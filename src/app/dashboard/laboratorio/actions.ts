"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { LABORATORIO_TIPOS } from "@/lib/modulos-eventos";
import { ESTUDIOS_DIAGNOSTICOS } from "@/lib/inference/estudios-diagnosticos";
import {
  detectCriticalValues,
  summarizeSeverity,
} from "@/lib/clinical-safety";
import {
  interpretarLab,
  detectarReflexTests,
  detectarDeltaCheck,
  type LabResultInput,
  type LabTest,
} from "@/lib/scores-lab";

const peticionSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  pacienteSexo: z.enum(["M", "F", "X"]).optional(),
  estudiosIds: z.array(z.string()).min(1).max(20),
  indicacionClinica: z.string().min(2).max(500),
  urgencia: z.enum(["rutina", "urgente", "stat"]),
  notas: z.string().max(500).optional(),
});

export type ActionResult =
  | { status: "ok"; eventoId: string }
  | { status: "error"; message: string };

export async function crearPeticionLab(
  input: z.infer<typeof peticionSchema>,
): Promise<ActionResult> {
  const parsed = peticionSchema.safeParse(input);
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

  const estudios = ESTUDIOS_DIAGNOSTICOS.filter(
    (e) => parsed.data.estudiosIds.includes(e.id) && e.categoria === "laboratorio",
  );
  if (estudios.length === 0) {
    return { status: "error", message: "Selecciona al menos un estudio de laboratorio." };
  }

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "laboratorio",
      tipo: LABORATORIO_TIPOS.peticion,
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        paciente_sexo: parsed.data.pacienteSexo ?? null,
        estudios: estudios.map((e) => ({
          id: e.id,
          nombre: e.nombre,
          disponibilidad: e.disponibilidadIMSS,
          costo_mxn: e.costoPrivadoMxn ?? null,
        })),
        indicacion_clinica: parsed.data.indicacionClinica,
        urgencia: parsed.data.urgencia,
      },
      status: "activo",
      notas: parsed.data.notas ?? null,
      metricas: {
        n_estudios: estudios.length,
        urgencia: parsed.data.urgencia,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo crear la petición." };
  }

  void recordAudit({
    userId: user.id,
    action: "laboratorio.peticion",
    metadata: {
      n_estudios: estudios.length,
      urgencia: parsed.data.urgencia,
    },
  });

  revalidatePath("/dashboard/laboratorio");
  return { status: "ok", eventoId: data.id };
}

export async function marcarRecibido(
  eventoId: string,
  resultados: string,
): Promise<ActionResult> {
  if (!/^[0-9a-f-]{36}$/i.test(eventoId)) {
    return { status: "error", message: "ID inválido." };
  }
  if (resultados.length > 2000) {
    return { status: "error", message: "Resultados muy largos (máx 2000)." };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { data: existing } = await supa
    .from("eventos_modulos")
    .select("id, datos")
    .eq("id", eventoId)
    .eq("user_id", user.id)
    .single();
  if (!existing) {
    return { status: "error", message: "Petición no encontrada." };
  }

  // Detectar valores críticos en el texto del resultado
  const findings = detectCriticalValues(resultados);
  const severity = summarizeSeverity(findings);

  const datos = {
    ...(existing.datos as Record<string, unknown>),
    resultados_texto: resultados,
    recibido_at: new Date().toISOString(),
    findings_criticos: findings,
    severity,
  };

  const { error } = await supa
    .from("eventos_modulos")
    .update({
      status: "completado",
      completed_at: new Date().toISOString(),
      datos,
    })
    .eq("id", eventoId)
    .eq("user_id", user.id);

  if (error) {
    return { status: "error", message: "No se pudo actualizar." };
  }

  // Si hay hallazgos críticos, crear evento dedicado de critical_alert
  // para que aparezca en el banner del dashboard (ACR/AHRQ compliance).
  if (severity && findings.length > 0) {
    const pacienteIniciales =
      ((existing.datos as { paciente_iniciales?: string | null })
        ?.paciente_iniciales as string | null) ?? null;
    await supa.from("eventos_modulos").insert({
      user_id: user.id,
      modulo: "laboratorio",
      tipo: "critical_alert",
      datos: {
        source_evento_id: eventoId,
        paciente_iniciales: pacienteIniciales,
        findings,
        snippet: resultados.slice(0, 200),
      },
      status: "activo",
      metricas: {
        severity,
        n_findings: findings.length,
      },
    });
  }

  void recordAudit({
    userId: user.id,
    action: "laboratorio.resultado_recibido",
    metadata: {
      evento_id: eventoId,
      severity,
      findings_count: findings.length,
    },
  });

  revalidatePath("/dashboard/laboratorio");
  revalidatePath("/dashboard");
  return { status: "ok", eventoId };
}

// ===================================================================
// Motor LitienGuard · Lab Pathway — registrar valor numérico individual
// con auto-detección de critical values + reflex + delta check
// ===================================================================

const valorLabSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  pacienteSexo: z.enum(["M", "F", "X"]).optional(),
  test: z.enum([
    "glucosa",
    "potasio",
    "sodio",
    "calcio",
    "creatinina",
    "hemoglobina",
    "plaquetas",
    "leucocitos",
    "inr",
    "troponina",
    "lactato",
    "ph_arterial",
    "pco2",
    "po2",
    "tsh",
    "hba1c",
  ]),
  valor: z.number(),
  valorPrevio: z.number().optional(),
  diasEntre: z.number().int().min(0).max(365).optional(),
  notas: z.string().max(500).optional(),
});

export async function registrarValorLab(
  input: z.infer<typeof valorLabSchema>,
): Promise<ActionResult> {
  const parsed = valorLabSchema.safeParse(input);
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

  const interpretation = interpretarLab({
    test: parsed.data.test as LabTest,
    valor: parsed.data.valor,
    edad: parsed.data.pacienteEdad,
    sexo:
      parsed.data.pacienteSexo === "X"
        ? "O"
        : (parsed.data.pacienteSexo as "M" | "F" | undefined),
  } satisfies LabResultInput);

  const reflexTests = detectarReflexTests(interpretation);

  let deltaResult = null;
  if (
    parsed.data.valorPrevio !== undefined &&
    parsed.data.diasEntre !== undefined
  ) {
    deltaResult = detectarDeltaCheck({
      test: parsed.data.test as LabTest,
      valorActual: parsed.data.valor,
      valorPrevio: parsed.data.valorPrevio,
      diasEntre: parsed.data.diasEntre,
    });
  }

  const esCritico =
    interpretation.severidad === "critico_bajo" ||
    interpretation.severidad === "critico_alto";

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "laboratorio",
      tipo: "valor_lab",
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        paciente_sexo: parsed.data.pacienteSexo ?? null,
        test: parsed.data.test,
        valor: parsed.data.valor,
        interpretation,
        reflexTests,
        deltaResult,
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      notas: parsed.data.notas ?? null,
      metricas: {
        severidad: interpretation.severidad,
        es_critico: esCritico,
        reflex_count: reflexTests.length,
        delta_anormal: deltaResult?.esDeltaAnormal ?? false,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo registrar el valor." };
  }

  void recordAudit({
    userId: user.id,
    action: esCritico
      ? "laboratorio.valor_critico"
      : "laboratorio.valor_registrado",
    metadata: {
      test: parsed.data.test,
      severidad: interpretation.severidad,
      reflex_count: reflexTests.length,
    },
  });

  revalidatePath("/dashboard/laboratorio");
  return { status: "ok", eventoId: data.id };
}
