"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { recordAudit } from "@/lib/audit";
import { getResend, RESEND_FROM } from "@/lib/resend-client";
import {
  buildInvitacionHtml,
  buildInvitacionText,
} from "@/lib/email-templates/invitacion-bienvenida";
import { TIER_LABELS, TIER_DESCRIPTIONS } from "@/lib/entitlements";
import { SITE_URL } from "@/lib/utils";

async function requireAdmin(): Promise<
  | { ok: true; userId: string; userNombre: string | null }
  | { ok: false; error: string }
> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };
  const { data: me } = await supa
    .from("profiles")
    .select("role, nombre")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin")
    return { ok: false, error: "Solo admins pueden hacer esto" };
  return { ok: true, userId: user.id, userNombre: me?.nombre ?? null };
}

const inviteSchema = z.object({
  email: z.string().email("Correo inválido"),
  role: z.enum(["medico", "admin"]),
  subscription_tier: z.enum(["free", "esencial", "pilot", "pro", "enterprise"]),
  nombre: z.string().max(120).optional(),
  hospital: z.string().max(120).optional(),
});

export type InviteState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

export async function inviteUser(formData: FormData): Promise<InviteState> {
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    subscription_tier: formData.get("subscription_tier") ?? "pilot",
    nombre: formData.get("nombre") || undefined,
    hospital: formData.get("hospital") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { data: me } = await supa
    .from("profiles")
    .select("role, nombre")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") {
    return { status: "error", message: "Solo admins pueden invitar" };
  }

  const emailNormalizado = parsed.data.email.toLowerCase().trim();
  const expiresAt = new Date(
    Date.now() + 60 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supa.from("invitaciones").upsert(
    {
      email: emailNormalizado,
      role: parsed.data.role,
      subscription_tier: parsed.data.subscription_tier,
      nombre: parsed.data.nombre ?? null,
      hospital: parsed.data.hospital ?? null,
      invitada_por: user.id,
      usada: false,
      expires_at: expiresAt,
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("[admin/invitaciones] upsert error:", error);
    return { status: "error", message: "No pudimos guardar la invitación" };
  }

  // Enviar correo de bienvenida con link directo a /login?email=X
  // Best-effort: si Resend no está configurado o falla, NO bloquear
  // la creación. El admin siempre puede copiar el link manual desde
  // la tabla y mandarlo por WhatsApp/SMS.
  let emailEnviado = false;
  let emailErrorMsg: string | null = null;
  const resend = getResend();
  if (resend) {
    try {
      const loginUrl = `${SITE_URL.replace(/\/$/, "")}/login?email=${encodeURIComponent(emailNormalizado)}`;
      const tierLabel = TIER_LABELS[parsed.data.subscription_tier];
      const tierDescription =
        TIER_DESCRIPTIONS[parsed.data.subscription_tier];
      const data = {
        pacienteNombre: parsed.data.nombre ?? null,
        email: emailNormalizado,
        tierLabel,
        tierDescription,
        invitadoPorNombre: me?.nombre ?? null,
        expiresAt,
        loginUrl,
      };
      await resend.emails.send({
        from: RESEND_FROM,
        to: emailNormalizado,
        subject: `Tu acceso a LitienGuard · plan ${tierLabel}`,
        html: buildInvitacionHtml(data),
        text: buildInvitacionText(data),
      });
      emailEnviado = true;
    } catch (err) {
      console.error("[admin/invitaciones] resend send err:", err);
      emailErrorMsg =
        err instanceof Error ? err.message : "Error al enviar correo";
    }
  } else {
    emailErrorMsg = "Resend no configurado (RESEND_API_KEY ausente)";
  }

  void recordAudit({
    userId: user.id,
    action: "admin.invitation_created",
    resource: `invitacion:${emailNormalizado}`,
    metadata: {
      target_email: emailNormalizado,
      tier: parsed.data.subscription_tier,
      email_sent: emailEnviado,
      email_error: emailErrorMsg,
    },
  });

  revalidatePath("/admin/invitaciones");
  return {
    status: "ok",
    message: emailEnviado
      ? `Invitación creada y correo enviado a ${emailNormalizado}.`
      : `Invitación creada — pero el correo no se envió (${emailErrorMsg ?? "razón desconocida"}). Usa "Copiar link" y mándalo manual.`,
  };
}

export async function revokeInvite(id: string): Promise<void> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return;

  const { data: me } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return;

  await supa.from("invitaciones").delete().eq("id", id);
  revalidatePath("/admin/invitaciones");
}

// =============================================================
// Admin recovery actions: reiniciar / reenviar / revocar completo
// =============================================================

type ActionResult = { status: "ok"; message: string } | { status: "error"; message: string };

/**
 * Reinicia una invitación marcada como usada o expirada:
 * - usada = false
 * - expires_at = ahora + 60 días
 * - reenvía el email de bienvenida con el link a /login
 *
 * Útil cuando el médico nunca pudo entrar pero el sistema marcó
 * la invitación como consumida (ej. el escáner de email pre-fetcheó
 * el magic link antes de que el usuario le diera click).
 */
export async function resetInvitation(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { status: "error", message: auth.error };

  const supa = await createSupabaseServer();
  const { data: invite, error: readErr } = await supa
    .from("invitaciones")
    .select(
      "email, role, subscription_tier, nombre, usada, expires_at",
    )
    .eq("id", id)
    .single();
  if (readErr || !invite) {
    return { status: "error", message: "Invitación no encontrada" };
  }

  const newExpires = new Date(
    Date.now() + 60 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error: updErr } = await supa
    .from("invitaciones")
    .update({ usada: false, expires_at: newExpires })
    .eq("id", id);

  if (updErr) {
    console.error("[admin] reset invitation err:", updErr);
    return { status: "error", message: "No pudimos reiniciar la invitación" };
  }

  // Reenviar email
  const resend = getResend();
  let emailEnviado = false;
  let emailError: string | null = null;
  if (resend) {
    try {
      const loginUrl = `${SITE_URL.replace(/\/$/, "")}/login?email=${encodeURIComponent(invite.email)}`;
      const tierLabel = TIER_LABELS[invite.subscription_tier as keyof typeof TIER_LABELS];
      const tierDescription =
        TIER_DESCRIPTIONS[invite.subscription_tier as keyof typeof TIER_DESCRIPTIONS];
      const data = {
        pacienteNombre: invite.nombre ?? null,
        email: invite.email,
        tierLabel,
        tierDescription,
        invitadoPorNombre: auth.userNombre,
        expiresAt: newExpires,
        loginUrl,
      };
      await resend.emails.send({
        from: RESEND_FROM,
        to: invite.email,
        subject: `Tu acceso reiniciado a LitienGuard · plan ${tierLabel}`,
        html: buildInvitacionHtml(data),
        text: buildInvitacionText(data),
      });
      emailEnviado = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Error desconocido";
      console.error("[admin] reset resend err:", err);
    }
  } else {
    emailError = "Resend no configurado";
  }

  void recordAudit({
    userId: auth.userId,
    action: "admin.invitation_reset",
    resource: `invitacion:${invite.email}`,
    metadata: {
      target_email: invite.email,
      previous_usada: invite.usada,
      previous_expires_at: invite.expires_at,
      new_expires_at: newExpires,
      email_resent: emailEnviado,
      email_error: emailError,
    },
  });

  revalidatePath("/admin/invitaciones");
  return {
    status: "ok",
    message: emailEnviado
      ? `Invitación reiniciada y correo reenviado a ${invite.email}.`
      : `Invitación reiniciada — el correo no se envió (${emailError ?? "razón desconocida"}). Copia el link manual.`,
  };
}

/**
 * Reenvía el email de bienvenida sin modificar la invitación. Útil
 * cuando el médico simplemente perdió el correo y la invitación
 * sigue válida.
 */
export async function resendInvitationEmail(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { status: "error", message: auth.error };

  const supa = await createSupabaseServer();
  const { data: invite, error: readErr } = await supa
    .from("invitaciones")
    .select("email, subscription_tier, nombre, expires_at, usada")
    .eq("id", id)
    .single();
  if (readErr || !invite) {
    return { status: "error", message: "Invitación no encontrada" };
  }

  if (invite.usada) {
    return {
      status: "error",
      message:
        "Esta invitación está marcada como usada — usa 'Reiniciar' en su lugar.",
    };
  }

  const resend = getResend();
  if (!resend) {
    return {
      status: "error",
      message: "Resend no configurado. Copia el link manual de la tabla.",
    };
  }

  try {
    const loginUrl = `${SITE_URL.replace(/\/$/, "")}/login?email=${encodeURIComponent(invite.email)}`;
    const tierLabel =
      TIER_LABELS[invite.subscription_tier as keyof typeof TIER_LABELS];
    const tierDescription =
      TIER_DESCRIPTIONS[invite.subscription_tier as keyof typeof TIER_DESCRIPTIONS];
    const data = {
      pacienteNombre: invite.nombre ?? null,
      email: invite.email,
      tierLabel,
      tierDescription,
      invitadoPorNombre: auth.userNombre,
      expiresAt: invite.expires_at ?? new Date().toISOString(),
      loginUrl,
    };
    await resend.emails.send({
      from: RESEND_FROM,
      to: invite.email,
      subject: `Recordatorio: tu acceso a LitienGuard · plan ${tierLabel}`,
      html: buildInvitacionHtml(data),
      text: buildInvitacionText(data),
    });

    void recordAudit({
      userId: auth.userId,
      action: "admin.invitation_resent",
      resource: `invitacion:${invite.email}`,
      metadata: { target_email: invite.email },
    });

    return {
      status: "ok",
      message: `Correo reenviado a ${invite.email}.`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[admin] resend invitation err:", err);
    return {
      status: "error",
      message: `No pudimos reenviar el correo (${msg}).`,
    };
  }
}

/**
 * Revoca por completo el acceso del médico:
 * - elimina la invitación
 * - elimina la cuenta de Supabase Auth (si existe)
 * - elimina el profile (cascade desde Auth)
 *
 * Esto es DESTRUCTIVO. Solo usar cuando se quiere borrar todo
 * para volver a empezar (ej. médico se equivocó de correo).
 */
export async function revokeFullAccess(
  id: string,
  motivo: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { status: "error", message: auth.error };

  const cleanMotivo = motivo.trim().slice(0, 500);
  if (!cleanMotivo) {
    return { status: "error", message: "Indica un motivo de revocación" };
  }

  const supa = await createSupabaseServer();
  const { data: invite, error: readErr } = await supa
    .from("invitaciones")
    .select("email, role, subscription_tier")
    .eq("id", id)
    .single();
  if (readErr || !invite) {
    return { status: "error", message: "Invitación no encontrada" };
  }

  const supaAdmin = getSupabaseAdmin();
  let authUserDeleted = false;
  let authError: string | null = null;

  if (supaAdmin) {
    try {
      // Buscar usuario en Auth por email
      const { data: usersList, error: listErr } =
        await supaAdmin.auth.admin.listUsers();
      if (!listErr && usersList?.users) {
        const targetUser = usersList.users.find(
          (u) =>
            u.email?.toLowerCase() === invite.email.toLowerCase(),
        );
        if (targetUser) {
          const { error: delErr } = await supaAdmin.auth.admin.deleteUser(
            targetUser.id,
          );
          if (delErr) {
            authError = delErr.message;
          } else {
            authUserDeleted = true;
          }
        }
      } else if (listErr) {
        authError = listErr.message;
      }
    } catch (err) {
      authError = err instanceof Error ? err.message : "Error desconocido";
      console.error("[admin] revoke auth delete err:", err);
    }
  } else {
    authError = "Service role no configurado";
  }

  // Eliminar invitación (independiente del Auth delete)
  const { error: invDelErr } = await supa
    .from("invitaciones")
    .delete()
    .eq("id", id);

  if (invDelErr) {
    return {
      status: "error",
      message: `Auth ${authUserDeleted ? "borrado" : "no afectado"}, pero no pudimos borrar la invitación: ${invDelErr.message}`,
    };
  }

  void recordAudit({
    userId: auth.userId,
    action: "admin.invitation_revoked_full",
    resource: `invitacion:${invite.email}`,
    metadata: {
      target_email: invite.email,
      motivo: cleanMotivo,
      auth_user_deleted: authUserDeleted,
      auth_error: authError,
    },
  });

  revalidatePath("/admin/invitaciones");
  return {
    status: "ok",
    message: authUserDeleted
      ? `Acceso de ${invite.email} revocado por completo (invitación + cuenta Auth eliminadas).`
      : authError
        ? `Invitación de ${invite.email} eliminada, pero la cuenta Auth no se pudo borrar: ${authError}`
        : `Invitación de ${invite.email} eliminada (no había cuenta Auth asociada).`,
  };
}

const approveSchema = z.object({
  preregistroId: z.string().uuid(),
  role: z.enum(["medico", "admin"]),
  subscription_tier: z.enum(["free", "esencial", "pilot", "pro", "enterprise"]),
});

export async function approvePreregistro(
  formData: FormData,
): Promise<InviteState> {
  const parsed = approveSchema.safeParse({
    preregistroId: formData.get("preregistroId"),
    role: formData.get("role"),
    subscription_tier: formData.get("subscription_tier"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { data: me } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") {
    return { status: "error", message: "Solo admins pueden aprobar" };
  }

  // Read the preregistro
  const { data: prereg, error: readErr } = await supa
    .from("preregistros")
    .select("email,nombre,status")
    .eq("id", parsed.data.preregistroId)
    .single();
  if (readErr || !prereg) {
    return { status: "error", message: "Solicitud no encontrada" };
  }
  if (prereg.status === "calificado") {
    return { status: "error", message: "Esta solicitud ya fue aprobada" };
  }

  // Create / upsert the invitation
  const { error: inviteErr } = await supa.from("invitaciones").upsert(
    {
      email: prereg.email.toLowerCase().trim(),
      role: parsed.data.role,
      subscription_tier: parsed.data.subscription_tier,
      nombre: prereg.nombre ?? null,
      invitada_por: user.id,
      usada: false,
      expires_at: new Date(
        Date.now() + 60 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    { onConflict: "email" },
  );
  if (inviteErr) {
    console.error("[admin/invitaciones] approve invite error:", inviteErr);
    return { status: "error", message: "No pudimos crear la invitación" };
  }

  // Mark preregistro as qualified
  const { error: updErr } = await supa
    .from("preregistros")
    .update({
      status: "calificado",
      processed_at: new Date().toISOString(),
      processed_by: user.id,
    })
    .eq("id", parsed.data.preregistroId);
  if (updErr) {
    console.error("[admin/invitaciones] preregistro update error:", updErr);
    // Invitation already created — don't fail, just warn
    return {
      status: "ok",
      message: `Invitación creada para ${prereg.email}. (Aviso: no pudimos marcar la solicitud como atendida.)`,
    };
  }

  revalidatePath("/admin/invitaciones");
  return {
    status: "ok",
    message: `Invitación lista para ${prereg.email}. Ya puede pedir su magic link.`,
  };
}

const tierUpdateSchema = z.object({
  inviteId: z.string().uuid(),
  tier: z.enum(["free", "esencial", "pilot", "pro", "enterprise"]),
});

export async function updateInvitationTier(
  inviteId: string,
  tier: "free" | "esencial" | "pilot" | "pro" | "enterprise",
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const parsed = tierUpdateSchema.safeParse({ inviteId, tier });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { data: me } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") {
    return { status: "error", message: "Solo admins pueden cambiar planes" };
  }

  // Leer el tier actual antes del UPDATE para registrar el cambio
  const { data: invitePrev } = await supa
    .from("invitaciones")
    .select("email, subscription_tier")
    .eq("id", parsed.data.inviteId)
    .single();
  const tierAnterior = invitePrev?.subscription_tier ?? null;

  // Update the invitation tier first
  const { data: invite, error: inviteErr } = await supa
    .from("invitaciones")
    .update({ subscription_tier: parsed.data.tier })
    .eq("id", parsed.data.inviteId)
    .select("email")
    .single();

  if (inviteErr || !invite) {
    console.error("[admin/invitaciones] tier update error:", inviteErr);
    return { status: "error", message: "No pudimos actualizar la invitación" };
  }

  // Sync the profile too if the user already exists (already activated).
  // Si el profile existe, el trigger audit_subscription_tier_change
  // registra automáticamente el cambio en audit_log. Aquí además
  // dejamos rastro explícito de la acción admin (porque cubrimos
  // también el caso "invitación no activada todavía" donde el trigger
  // del profile no se dispara).
  //
  // Verificamos cantidad de filas afectadas para detectar fallos
  // silenciosos por RLS (la policy admins_update_all_profiles cubre
  // el caso admin cambiando tier de otro user). Si el user todavía
  // no existe (profile no creado), 0 filas es esperado y no es error.
  const { data: profileSync, error: profileErr } = await supa
    .from("profiles")
    .update({ subscription_tier: parsed.data.tier })
    .ilike("email", invite.email)
    .select("id");

  if (profileErr) {
    console.error(
      "[admin/invitaciones] profile sync FAILED:",
      profileErr,
    );
    return {
      status: "error",
      message: `Invitación actualizada pero el sync del perfil falló: ${profileErr.message}. Revisa policies RLS.`,
    };
  }

  const profileSyncCount = profileSync?.length ?? 0;
  // 0 filas es OK si la invitación todavía no fue activada (sin profile);
  // pero si esperamos sync y devolvió 0, log warning visible.
  if (profileSyncCount === 0) {
    console.warn(
      `[admin/invitaciones] profile sync afectó 0 filas para ${invite.email} — probablemente invitación no activada todavía.`,
    );
  }

  // Audit log explícito de la acción admin sobre la invitación
  void recordAudit({
    userId: user.id,
    action: "admin.invitation_tier_changed",
    resource: `invitacion:${parsed.data.inviteId}`,
    metadata: {
      target_email: invite.email,
      tier_anterior: tierAnterior,
      tier_nuevo: parsed.data.tier,
    },
  });

  revalidatePath("/admin/invitaciones");
  return { status: "ok" };
}

export async function dismissPreregistro(
  preregistroId: string,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { data: me } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") {
    return { status: "error", message: "Solo admins" };
  }

  const { error } = await supa
    .from("preregistros")
    .update({
      status: "descartado",
      processed_at: new Date().toISOString(),
      processed_by: user.id,
    })
    .eq("id", preregistroId);

  if (error) {
    return { status: "error", message: error.message };
  }
  revalidatePath("/admin/invitaciones");
  return { status: "ok" };
}
