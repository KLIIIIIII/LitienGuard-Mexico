"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { UCI_TIPOS } from "@/lib/modulos-eventos";
import { calcularSofa, interpretarSofa } from "@/lib/scores-uci";

const sofaSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  input: z.object({
    pao2Fio2: z.number().min(0).max(800),
    ventMecanica: z.boolean(),
    plaquetasMil: z.number().min(0).max(2000),
    bilirrubinaMg: z.number().min(0).max(50),
    map: z.number().min(0).max(200),
    dopaminaMcgKgMin: z.number().min(0).max(50),
    dobutaminaActiva: z.boolean(),
    norepinefrinaMcgKgMin: z.number().min(0).max(5),
    adrenalinaMcgKgMin: z.number().min(0).max(5),
    glasgow: z.number().int().min(3).max(15),
    creatininaMg: z.number().min(0).max(20),
    gastoUrinarioMlDia: z.number().min(0).max(10000),
  }),
});

export type ActionResult =
  | { status: "ok"; eventoId: string }
  | { status: "error"; message: string };

export async function registrarSofa(
  input: z.infer<typeof sofaSchema>,
): Promise<ActionResult> {
  const parsed = sofaSchema.safeParse(input);
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

  const subscores = calcularSofa(parsed.data.input);
  const interpretacion = interpretarSofa(subscores.total);

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "uci",
      tipo: UCI_TIPOS.sofa,
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        input: parsed.data.input,
        subscores,
        interpretacion,
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      metricas: {
        sofa_total: subscores.total,
        riesgo: interpretacion.riesgo,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo registrar." };
  }

  void recordAudit({
    userId: user.id,
    action: "uci.sofa",
    metadata: {
      sofa_total: subscores.total,
      riesgo: interpretacion.riesgo,
    },
  });

  revalidatePath("/dashboard/uci");
  return { status: "ok", eventoId: data.id };
}
