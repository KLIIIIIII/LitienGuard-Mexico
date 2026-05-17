"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { QUIROFANO_TIPOS } from "@/lib/modulos-eventos";

const timeoutSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  procedimiento: z.string().min(2).max(200),
  sitioMarcado: z.boolean(),
  consentimientoFirmado: z.boolean(),
  alergiasVerificadas: z.boolean(),
  antibioticoProfilactico: z.boolean(),
  conteoInstrumentalInicial: z.boolean(),
  pasosCompletados: z.array(z.string()),
  notas: z.string().max(500).optional(),
});

export type ActionResult =
  | { status: "ok"; eventoId: string }
  | { status: "error"; message: string };

export async function registrarTimeOut(
  input: z.infer<typeof timeoutSchema>,
): Promise<ActionResult> {
  const parsed = timeoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseCerebro(tier)) {
    return {
      status: "error",
      message: "Requiere plan Profesional o superior.",
    };
  }

  const checks = [
    parsed.data.sitioMarcado,
    parsed.data.consentimientoFirmado,
    parsed.data.alergiasVerificadas,
    parsed.data.antibioticoProfilactico,
    parsed.data.conteoInstrumentalInicial,
  ];
  const checksOk = checks.filter(Boolean).length;
  const complianceFull = checks.every(Boolean);

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "quirofano",
      tipo: QUIROFANO_TIPOS.time_out,
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        procedimiento: parsed.data.procedimiento,
        sitio_marcado: parsed.data.sitioMarcado,
        consentimiento_firmado: parsed.data.consentimientoFirmado,
        alergias_verificadas: parsed.data.alergiasVerificadas,
        antibiotico_profilactico: parsed.data.antibioticoProfilactico,
        conteo_instrumental_inicial: parsed.data.conteoInstrumentalInicial,
        pasos_completados: parsed.data.pasosCompletados,
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      notas: parsed.data.notas ?? null,
      metricas: {
        checks_ok: checksOk,
        checks_total: 5,
        compliance_full: complianceFull,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo registrar." };
  }

  void recordAudit({
    userId: user.id,
    action: "quirofano.time_out",
    metadata: {
      checks_ok: checksOk,
      compliance_full: complianceFull,
    },
  });

  revalidatePath("/dashboard/quirofano");
  return { status: "ok", eventoId: data.id };
}
