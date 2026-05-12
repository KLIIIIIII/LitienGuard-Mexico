"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseAgenda, type SubscriptionTier } from "@/lib/entitlements";
import { recordAudit } from "@/lib/audit";

const citaBaseSchema = z.object({
  paciente_nombre: z.string().trim().min(1, "Nombre requerido").max(120),
  paciente_apellido_paterno: z.string().trim().max(80).optional().or(z.literal("")),
  paciente_apellido_materno: z.string().trim().max(80).optional().or(z.literal("")),
  paciente_email: z
    .string()
    .trim()
    .email("Correo inválido")
    .max(200)
    .optional()
    .or(z.literal("")),
  paciente_telefono: z.string().trim().max(30).optional().or(z.literal("")),
  fecha_inicio: z.string().datetime({ offset: true }),
  fecha_fin: z.string().datetime({ offset: true }),
  tipo_consulta: z.string().trim().max(60).optional().or(z.literal("")),
  motivo: z.string().trim().max(500).optional().or(z.literal("")),
  notas_internas: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CitaInput = z.infer<typeof citaBaseSchema>;

export type ActionResult =
  | { status: "ok"; citaId: string }
  | { status: "error"; message: string };

async function requireAgendaAccess(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string }
> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  if (!profile) return { ok: false, error: "Perfil no encontrado." };
  const tier = (profile.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseAgenda(tier)) {
    return { ok: false, error: "Tu plan no incluye agenda. Actualiza a Profesional." };
  }
  return { ok: true, userId: user.id };
}

async function hasConflict(
  medicoId: string,
  fechaInicio: string,
  fechaFin: string,
  excludeId?: string,
): Promise<boolean> {
  const supa = await createSupabaseServer();
  let query = supa
    .from("citas")
    .select("id", { count: "exact", head: true })
    .eq("medico_id", medicoId)
    .in("status", ["agendada", "confirmada"])
    .lt("fecha_inicio", fechaFin)
    .gt("fecha_fin", fechaInicio);
  if (excludeId) {
    query = query.neq("id", excludeId);
  }
  const { count } = await query;
  return (count ?? 0) > 0;
}

export async function createCita(input: CitaInput): Promise<ActionResult> {
  const auth = await requireAgendaAccess();
  if (!auth.ok) return { status: "error", message: auth.error };

  const parsed = citaBaseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const d = parsed.data;
  if (new Date(d.fecha_fin) <= new Date(d.fecha_inicio)) {
    return { status: "error", message: "La hora de fin debe ser posterior al inicio." };
  }

  if (await hasConflict(auth.userId, d.fecha_inicio, d.fecha_fin)) {
    return {
      status: "error",
      message: "Tienes otra cita en ese horario. Elige un slot libre.",
    };
  }

  const supa = await createSupabaseServer();
  const { data: cita, error } = await supa
    .from("citas")
    .insert({
      medico_id: auth.userId,
      paciente_nombre: d.paciente_nombre,
      paciente_apellido_paterno: d.paciente_apellido_paterno || null,
      paciente_apellido_materno: d.paciente_apellido_materno || null,
      paciente_email: d.paciente_email || null,
      paciente_telefono: d.paciente_telefono || null,
      fecha_inicio: d.fecha_inicio,
      fecha_fin: d.fecha_fin,
      tipo_consulta: d.tipo_consulta || null,
      motivo: d.motivo || null,
      notas_internas: d.notas_internas || null,
      status: "agendada",
    })
    .select("id")
    .single();

  if (error || !cita) {
    console.error("[agenda] insert error:", error);
    return { status: "error", message: "No pudimos crear la cita." };
  }

  void recordAudit({
    userId: auth.userId,
    action: "cita.created",
    resource: cita.id,
    metadata: { paciente: d.paciente_nombre, fecha_inicio: d.fecha_inicio },
  });

  revalidatePath("/dashboard/agenda");
  return { status: "ok", citaId: cita.id };
}

export async function updateCita(
  citaId: string,
  input: CitaInput,
): Promise<ActionResult> {
  const auth = await requireAgendaAccess();
  if (!auth.ok) return { status: "error", message: auth.error };

  const parsed = citaBaseSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const d = parsed.data;

  if (new Date(d.fecha_fin) <= new Date(d.fecha_inicio)) {
    return { status: "error", message: "La hora de fin debe ser posterior al inicio." };
  }
  if (await hasConflict(auth.userId, d.fecha_inicio, d.fecha_fin, citaId)) {
    return {
      status: "error",
      message: "Tienes otra cita en ese horario. Elige un slot libre.",
    };
  }

  const supa = await createSupabaseServer();
  const { error } = await supa
    .from("citas")
    .update({
      paciente_nombre: d.paciente_nombre,
      paciente_apellido_paterno: d.paciente_apellido_paterno || null,
      paciente_apellido_materno: d.paciente_apellido_materno || null,
      paciente_email: d.paciente_email || null,
      paciente_telefono: d.paciente_telefono || null,
      fecha_inicio: d.fecha_inicio,
      fecha_fin: d.fecha_fin,
      tipo_consulta: d.tipo_consulta || null,
      motivo: d.motivo || null,
      notas_internas: d.notas_internas || null,
    })
    .eq("id", citaId)
    .eq("medico_id", auth.userId);

  if (error) {
    console.error("[agenda] update error:", error);
    return { status: "error", message: error.message };
  }

  void recordAudit({
    userId: auth.userId,
    action: "cita.updated",
    resource: citaId,
  });

  revalidatePath("/dashboard/agenda");
  revalidatePath(`/dashboard/agenda/${citaId}`);
  return { status: "ok", citaId };
}

export async function changeCitaStatus(
  citaId: string,
  status: "confirmada" | "completada" | "cancelada" | "no_asistio",
  motivoCancelacion?: string,
): Promise<ActionResult> {
  const auth = await requireAgendaAccess();
  if (!auth.ok) return { status: "error", message: auth.error };

  if (status === "cancelada") {
    if (!motivoCancelacion || motivoCancelacion.trim().length < 3) {
      return {
        status: "error",
        message: "Captura un motivo de cancelación (mínimo 3 caracteres).",
      };
    }
  }

  const supa = await createSupabaseServer();
  const payload: {
    status: typeof status;
    motivo_cancelacion?: string | null;
  } = { status };
  if (status === "cancelada") {
    payload.motivo_cancelacion = motivoCancelacion!.trim();
  }

  const { error } = await supa
    .from("citas")
    .update(payload)
    .eq("id", citaId)
    .eq("medico_id", auth.userId);

  if (error) {
    console.error("[agenda] status change error:", error);
    return { status: "error", message: error.message };
  }

  void recordAudit({
    userId: auth.userId,
    action: `cita.${status}`,
    resource: citaId,
    metadata: status === "cancelada" ? { motivo: motivoCancelacion } : undefined,
  });

  revalidatePath("/dashboard/agenda");
  revalidatePath(`/dashboard/agenda/${citaId}`);
  return { status: "ok", citaId };
}

export async function deleteCita(citaId: string): Promise<ActionResult> {
  const auth = await requireAgendaAccess();
  if (!auth.ok) return { status: "error", message: auth.error };

  const supa = await createSupabaseServer();
  const { error } = await supa
    .from("citas")
    .delete()
    .eq("id", citaId)
    .eq("medico_id", auth.userId);

  if (error) {
    console.error("[agenda] delete error:", error);
    return { status: "error", message: error.message };
  }

  void recordAudit({
    userId: auth.userId,
    action: "cita.deleted",
    resource: citaId,
  });

  revalidatePath("/dashboard/agenda");
  return { status: "ok", citaId };
}
