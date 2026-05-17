"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { ONCOLOGIA_TIPOS } from "@/lib/modulos-eventos";
import { interpretarEcog } from "@/lib/scores-especialidades";

const ecogSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  ecog: z.number().int().min(0).max(5),
});

export type ActionResult =
  | { status: "ok"; eventoId: string }
  | { status: "error"; message: string };

export async function registrarEcog(
  input: z.infer<typeof ecogSchema>,
): Promise<ActionResult> {
  const parsed = ecogSchema.safeParse(input);
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

  const ecogValue = parsed.data.ecog as 0 | 1 | 2 | 3 | 4 | 5;
  const resultado = interpretarEcog(ecogValue);

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "oncologia",
      tipo: ONCOLOGIA_TIPOS.ecog,
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        resultado,
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      metricas: {
        ecog: resultado.ecog,
        karnofsky: resultado.karnofskyAprox,
        apto_quimio: resultado.apto_quimio,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo registrar." };
  }

  void recordAudit({
    userId: user.id,
    action: "oncologia.ecog",
    metadata: {
      ecog: resultado.ecog,
      apto_quimio: resultado.apto_quimio,
    },
  });

  revalidatePath("/dashboard/oncologia");
  return { status: "ok", eventoId: data.id };
}
