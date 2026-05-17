"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import {
  URGENCIAS_TIPOS,
  type TriageNivel,
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
