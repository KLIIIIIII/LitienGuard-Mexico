"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { NEUROLOGIA_TIPOS } from "@/lib/modulos-eventos";
import { calcularNihss } from "@/lib/scores-especialidades";

const nihssSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  input: z.object({
    nivelConciencia: z.number().int().min(0).max(3),
    preguntasLoc: z.number().int().min(0).max(2),
    ordenesLoc: z.number().int().min(0).max(2),
    mirada: z.number().int().min(0).max(2),
    camposVisuales: z.number().int().min(0).max(3),
    paresia_facial: z.number().int().min(0).max(3),
    motorMs: z.number().int().min(0).max(4),
    motorMi: z.number().int().min(0).max(4),
    ataxia: z.number().int().min(0).max(2),
    sensibilidad: z.number().int().min(0).max(2),
    lenguaje: z.number().int().min(0).max(3),
    disartria: z.number().int().min(0).max(2),
    negligencia: z.number().int().min(0).max(2),
  }),
});

export type ActionResult =
  | { status: "ok"; eventoId: string }
  | { status: "error"; message: string };

export async function registrarNihss(
  input: z.infer<typeof nihssSchema>,
): Promise<ActionResult> {
  const parsed = nihssSchema.safeParse(input);
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

  // Cast to typed NIHSS input (zod already validated ranges)
  const typedInput = parsed.data.input as Parameters<typeof calcularNihss>[0];
  const resultado = calcularNihss(typedInput);

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "neurologia",
      tipo: NEUROLOGIA_TIPOS.nihss,
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        input: parsed.data.input,
        resultado,
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      metricas: {
        nihss_total: resultado.total,
        severidad: resultado.severidad,
        tpa_candidato: resultado.tpaCandidato,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo registrar." };
  }

  void recordAudit({
    userId: user.id,
    action: "neurologia.nihss",
    metadata: {
      nihss_total: resultado.total,
      severidad: resultado.severidad,
    },
  });

  revalidatePath("/dashboard/neurologia");
  return { status: "ok", eventoId: data.id };
}
