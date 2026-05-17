"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import {
  URGENCIAS_TIPOS,
  type TriageNivel,
  type DispositionTipo,
} from "@/lib/modulos-eventos";

const tipoSchema = z.enum([
  URGENCIAS_TIPOS.triage,
  URGENCIAS_TIPOS.sepsis_bundle,
  URGENCIAS_TIPOS.codigo_stroke,
  URGENCIAS_TIPOS.codigo_iam,
  URGENCIAS_TIPOS.dka_protocolo,
]);

const iniciarSchema = z.object({
  tipo: tipoSchema,
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  pacienteSexo: z.enum(["M", "F", "X"]).optional(),
  notas: z.string().max(500).optional(),
});

const triageSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  pacienteSexo: z.enum(["M", "F", "X"]).optional(),
  motivo: z.string().min(2).max(300),
  nivel: z.enum(["rojo", "naranja", "amarillo", "verde", "azul"]),
  signosVitales: z
    .object({
      tas: z.number().int().min(40).max(280).optional(),
      tad: z.number().int().min(20).max(180).optional(),
      fc: z.number().int().min(20).max(250).optional(),
      fr: z.number().int().min(4).max(60).optional(),
      sato2: z.number().int().min(40).max(100).optional(),
      temp: z.number().min(30).max(45).optional(),
      glasgow: z.number().int().min(3).max(15).optional(),
    })
    .optional(),
});

const completarSchema = z.object({
  eventoId: z.string().uuid(),
  metricas: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  pasosCompletados: z.array(z.string()).optional(),
});

export type ActionResult<T = void> =
  | (T extends void ? { status: "ok" } : { status: "ok"; data: T })
  | { status: "error"; message: string };

async function authAndGate(): Promise<
  | { ok: true; userId: string }
  | { ok: false; message: string }
> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { ok: false, message: "No autenticado." };

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseCerebro(tier)) {
    return {
      ok: false,
      message: "Los módulos hospitalarios requieren plan Profesional o superior.",
    };
  }
  return { ok: true, userId: user.id };
}

export async function iniciarTriage(
  input: z.infer<typeof triageSchema>,
): Promise<ActionResult<{ eventoId: string }>> {
  const parsed = triageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const gate = await authAndGate();
  if (!gate.ok) return { status: "error", message: gate.message };

  const supa = await createSupabaseServer();
  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: gate.userId,
      modulo: "urgencias",
      tipo: URGENCIAS_TIPOS.triage,
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        paciente_sexo: parsed.data.pacienteSexo ?? null,
        motivo: parsed.data.motivo,
        nivel: parsed.data.nivel as TriageNivel,
        signos_vitales: parsed.data.signosVitales ?? {},
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      metricas: {
        nivel: parsed.data.nivel,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      status: "error",
      message: "No se pudo registrar el triage.",
    };
  }

  void recordAudit({
    userId: gate.userId,
    action: "urgencias.triage",
    metadata: {
      nivel: parsed.data.nivel,
      tiene_signos_vitales: Boolean(parsed.data.signosVitales),
    },
  });

  revalidatePath("/dashboard/urgencias");
  return { status: "ok", data: { eventoId: data.id } };
}

export async function iniciarProtocolo(
  input: z.infer<typeof iniciarSchema>,
): Promise<ActionResult<{ eventoId: string }>> {
  const parsed = iniciarSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const gate = await authAndGate();
  if (!gate.ok) return { status: "error", message: gate.message };

  const supa = await createSupabaseServer();
  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: gate.userId,
      modulo: "urgencias",
      tipo: parsed.data.tipo,
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        paciente_sexo: parsed.data.pacienteSexo ?? null,
        iniciado_at: new Date().toISOString(),
      },
      status: "activo",
      notas: parsed.data.notas ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      status: "error",
      message: "No se pudo iniciar el protocolo.",
    };
  }

  void recordAudit({
    userId: gate.userId,
    action: "urgencias.protocolo_iniciado",
    metadata: { tipo: parsed.data.tipo },
  });

  revalidatePath("/dashboard/urgencias");
  return { status: "ok", data: { eventoId: data.id } };
}

export async function completarProtocolo(
  input: z.infer<typeof completarSchema>,
): Promise<ActionResult> {
  const parsed = completarSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const gate = await authAndGate();
  if (!gate.ok) return { status: "error", message: gate.message };

  const supa = await createSupabaseServer();
  const { data: existing } = await supa
    .from("eventos_modulos")
    .select("id, datos, metricas, tipo")
    .eq("id", parsed.data.eventoId)
    .eq("user_id", gate.userId)
    .single();

  if (!existing) {
    return { status: "error", message: "Protocolo no encontrado." };
  }

  const datos = {
    ...(existing.datos as Record<string, unknown>),
    pasos_completados: parsed.data.pasosCompletados ?? [],
    completado_at: new Date().toISOString(),
  };
  const metricas = {
    ...(existing.metricas as Record<string, unknown>),
    ...(parsed.data.metricas ?? {}),
  };

  const { error } = await supa
    .from("eventos_modulos")
    .update({
      status: "completado",
      completed_at: new Date().toISOString(),
      datos,
      metricas,
    })
    .eq("id", parsed.data.eventoId)
    .eq("user_id", gate.userId);

  if (error) {
    return { status: "error", message: "No se pudo completar." };
  }

  void recordAudit({
    userId: gate.userId,
    action: "urgencias.protocolo_completado",
    metadata: {
      tipo: existing.tipo,
      pasos: parsed.data.pasosCompletados?.length ?? 0,
    },
  });

  revalidatePath("/dashboard/urgencias");
  return { status: "ok" };
}

/**
 * Registra disposición de un paciente de urgencias.
 * Calcula LOS desde el triage al cierre.
 */
const dispositionSchema = z.object({
  triageEventoId: z.string().uuid(),
  tipo: z.enum([
    "alta",
    "observacion",
    "hospitalizacion",
    "uci",
    "quirofano",
    "traslado",
    "morgue",
    "lwbs",
  ]),
  razon: z.string().trim().max(500).optional(),
});

export async function registrarDisposition(
  input: z.infer<typeof dispositionSchema>,
): Promise<ActionResult> {
  const gate = await authAndGate();
  if (!gate.ok) return { status: "error", message: gate.message };

  const parsed = dispositionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const supa = await createSupabaseServer();

  // Leer el triage para calcular LOS y vincular paciente
  const { data: triage } = await supa
    .from("eventos_modulos")
    .select("id, datos, created_at, status, user_id")
    .eq("id", parsed.data.triageEventoId)
    .eq("user_id", gate.userId)
    .single();

  if (!triage) {
    return { status: "error", message: "Triage no encontrado." };
  }
  if (triage.status === "completado") {
    return { status: "error", message: "Este paciente ya fue dado de baja." };
  }

  const triageData = triage.datos as {
    paciente_iniciales?: string | null;
    paciente_edad?: number | null;
    paciente_sexo?: "M" | "F" | "X" | null;
    motivo?: string;
    nivel?: TriageNivel;
  };

  const losMin = Math.floor(
    (Date.now() - new Date(triage.created_at).getTime()) / 60000,
  );

  // Insertar evento disposition
  const { error: dispErr } = await supa.from("eventos_modulos").insert({
    user_id: gate.userId,
    modulo: "urgencias",
    tipo: URGENCIAS_TIPOS.disposition,
    datos: {
      triage_evento_id: parsed.data.triageEventoId,
      paciente_iniciales: triageData.paciente_iniciales ?? null,
      paciente_edad: triageData.paciente_edad ?? null,
      paciente_sexo: triageData.paciente_sexo ?? null,
      tipo: parsed.data.tipo as DispositionTipo,
      razon: parsed.data.razon ?? null,
    },
    status: "completado",
    completed_at: new Date().toISOString(),
    metricas: {
      los_minutos: losMin,
      disposition: parsed.data.tipo,
      nivel_triage: triageData.nivel ?? null,
    },
  });

  if (dispErr) {
    return { status: "error", message: "No se pudo registrar la disposición." };
  }

  // Cerrar el triage marcándolo completado
  const { error: triageErr } = await supa
    .from("eventos_modulos")
    .update({
      status: "completado",
      completed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.triageEventoId)
    .eq("user_id", gate.userId);

  if (triageErr) {
    return {
      status: "error",
      message: "Disposition registrada pero no se cerró el triage.",
    };
  }

  void recordAudit({
    userId: gate.userId,
    action: "urgencias.disposition",
    metadata: {
      tipo: parsed.data.tipo,
      los_minutos: losMin,
    },
  });

  revalidatePath("/dashboard/urgencias");
  return { status: "ok" };
}

export async function cancelarProtocolo(
  eventoId: string,
): Promise<ActionResult> {
  const gate = await authAndGate();
  if (!gate.ok) return { status: "error", message: gate.message };

  if (!/^[0-9a-f-]{36}$/i.test(eventoId)) {
    return { status: "error", message: "ID inválido." };
  }

  const supa = await createSupabaseServer();
  const { error } = await supa
    .from("eventos_modulos")
    .update({ status: "cancelado", completed_at: new Date().toISOString() })
    .eq("id", eventoId)
    .eq("user_id", gate.userId);

  if (error) {
    return { status: "error", message: "No se pudo cancelar." };
  }
  revalidatePath("/dashboard/urgencias");
  return { status: "ok" };
}
