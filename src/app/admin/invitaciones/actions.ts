"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

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
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") {
    return { status: "error", message: "Solo admins pueden invitar" };
  }

  const { error } = await supa.from("invitaciones").upsert(
    {
      email: parsed.data.email.toLowerCase().trim(),
      role: parsed.data.role,
      subscription_tier: parsed.data.subscription_tier,
      nombre: parsed.data.nombre ?? null,
      hospital: parsed.data.hospital ?? null,
      invitada_por: user.id,
      usada: false,
      expires_at: new Date(
        Date.now() + 60 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("[admin/invitaciones] upsert error:", error);
    return { status: "error", message: "No pudimos guardar la invitación" };
  }

  revalidatePath("/admin/invitaciones");
  return {
    status: "ok",
    message: `Invitación lista para ${parsed.data.email}. Ya puede pedir su magic link.`,
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
  const { error: profileErr } = await supa
    .from("profiles")
    .update({ subscription_tier: parsed.data.tier })
    .ilike("email", invite.email);

  if (profileErr) {
    console.warn(
      "[admin/invitaciones] profile sync warn (invitation updated OK):",
      profileErr,
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
