"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { CARDIOLOGIA_TIPOS } from "@/lib/modulos-eventos";
import { calcularHeart } from "@/lib/scores-especialidades";

const heartSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  input: z.object({
    historia: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    ecg: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    edad: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    factoresRiesgo: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    troponina: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  }),
});

export type ActionResult =
  | { status: "ok"; eventoId: string }
  | { status: "error"; message: string };

export async function registrarHeart(
  input: z.infer<typeof heartSchema>,
): Promise<ActionResult> {
  const parsed = heartSchema.safeParse(input);
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

  const resultado = calcularHeart(parsed.data.input);

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "cardiologia",
      tipo: CARDIOLOGIA_TIPOS.heart_score,
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        input: parsed.data.input,
        resultado,
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      metricas: {
        heart_total: resultado.total,
        riesgo: resultado.riesgo,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo registrar." };
  }

  void recordAudit({
    userId: user.id,
    action: "cardiologia.heart_score",
    metadata: {
      heart_total: resultado.total,
      riesgo: resultado.riesgo,
    },
  });

  revalidatePath("/dashboard/cardiologia");
  return { status: "ok", eventoId: data.id };
}
