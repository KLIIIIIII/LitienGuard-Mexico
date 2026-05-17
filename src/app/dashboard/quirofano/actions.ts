"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { QUIROFANO_TIPOS } from "@/lib/modulos-eventos";
import {
  evaluarWhoChecklist,
  calcularRcri,
  type WhoSignInInput,
  type WhoTimeOutInput,
  type WhoSignOutInput,
  type RcriInput,
} from "@/lib/scores-quirofano";

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

// ===================================================================
// WHO Surgical Safety Checklist 3 pausas — Haynes NEJM 2009
// ===================================================================

const whoChecklistSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  procedimiento: z.string().min(2).max(200),
  signIn: z.object({
    identificacionConfirmada: z.boolean(),
    sitioMarcado: z.boolean(),
    consentimientoFirmado: z.boolean(),
    verificacionAnestesia: z.boolean(),
    pulsioximetro: z.boolean(),
    alergiasEvaluadas: z.boolean(),
    viaAereaEvaluada: z.boolean(),
    riesgoSangradoEvaluado: z.boolean(),
  }),
  timeOut: z.object({
    presentacionEquipo: z.boolean(),
    confirmacionTresVias: z.boolean(),
    eventosCirujanoAnticipados: z.boolean(),
    preocupacionesAnestesia: z.boolean(),
    enfermeriaConfirmoEsterilidad: z.boolean(),
    profilaxisAntibiotica: z.boolean(),
    imagenologiaDisponible: z.boolean(),
  }),
  signOut: z.object({
    procedimientoRegistrado: z.boolean(),
    conteoCorrecto: z.boolean(),
    etiquetadoMuestras: z.boolean(),
    problemasEquipo: z.boolean(),
    comunicacionPostop: z.boolean(),
  }),
});

export async function registrarWhoChecklist(
  input: z.infer<typeof whoChecklistSchema>,
): Promise<ActionResult> {
  const parsed = whoChecklistSchema.safeParse(input);
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
    return { status: "error", message: "Requiere plan Profesional o superior." };
  }

  const resultado = evaluarWhoChecklist(
    parsed.data.signIn as WhoSignInInput,
    parsed.data.timeOut as WhoTimeOutInput,
    parsed.data.signOut as WhoSignOutInput,
  );

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "quirofano",
      tipo: "who_checklist",
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        procedimiento: parsed.data.procedimiento,
        signIn: parsed.data.signIn,
        timeOut: parsed.data.timeOut,
        signOut: parsed.data.signOut,
        resultado,
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      metricas: {
        who_total: resultado.totalCompletados,
        who_compliance: resultado.compliance,
        bundle_completo: resultado.bundleCompleto,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo registrar el checklist." };
  }

  void recordAudit({
    userId: user.id,
    action: "quirofano.who_checklist",
    metadata: {
      who_compliance: resultado.compliance,
      bundle_completo: resultado.bundleCompleto,
    },
  });

  revalidatePath("/dashboard/quirofano");
  return { status: "ok", eventoId: data.id };
}

// ===================================================================
// RCRI — Lee 1999
// ===================================================================

const rcriSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  input: z.object({
    cirugiaAltoRiesgo: z.boolean(),
    cardiopatiaIsquemica: z.boolean(),
    insuficienciaCardiaca: z.boolean(),
    evcTia: z.boolean(),
    diabetesInsulina: z.boolean(),
    creatininaAlta: z.boolean(),
  }),
});

export async function registrarRcri(
  input: z.infer<typeof rcriSchema>,
): Promise<ActionResult> {
  const parsed = rcriSchema.safeParse(input);
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
    return { status: "error", message: "Requiere plan Profesional o superior." };
  }

  const resultado = calcularRcri(parsed.data.input as RcriInput);

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "quirofano",
      tipo: "rcri",
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        input: parsed.data.input,
        resultado,
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      metricas: {
        rcri_total: resultado.total,
        clase: resultado.clase,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo registrar." };
  }

  void recordAudit({
    userId: user.id,
    action: "quirofano.rcri",
    metadata: { total: resultado.total, clase: resultado.clase },
  });

  revalidatePath("/dashboard/quirofano");
  return { status: "ok", eventoId: data.id };
}
