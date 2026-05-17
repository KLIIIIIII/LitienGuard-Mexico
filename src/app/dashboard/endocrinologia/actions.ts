"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { ENDOCRINOLOGIA_TIPOS } from "@/lib/modulos-eventos";
import { interpretarHba1c } from "@/lib/scores-especialidades";

const a1cSchema = z.object({
  pacienteIniciales: z.string().max(8).optional(),
  pacienteEdad: z.number().int().min(0).max(120).optional(),
  hba1c: z.number().min(3).max(20),
  metaIndividualizada: z.number().min(5.5).max(9.5).optional(),
});

export type ActionResult =
  | { status: "ok"; eventoId: string }
  | { status: "error"; message: string };

export async function registrarHba1c(
  input: z.infer<typeof a1cSchema>,
): Promise<ActionResult> {
  const parsed = a1cSchema.safeParse(input);
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

  const resultado = interpretarHba1c(
    parsed.data.hba1c,
    parsed.data.metaIndividualizada ?? 7.0,
  );

  const { data, error } = await supa
    .from("eventos_modulos")
    .insert({
      user_id: user.id,
      modulo: "endocrinologia",
      tipo: ENDOCRINOLOGIA_TIPOS.hba1c_control,
      datos: {
        paciente_iniciales: parsed.data.pacienteIniciales ?? null,
        paciente_edad: parsed.data.pacienteEdad ?? null,
        meta: parsed.data.metaIndividualizada ?? 7.0,
        resultado,
      },
      status: "completado",
      completed_at: new Date().toISOString(),
      metricas: {
        hba1c: resultado.hba1c,
        glucosa_promedio: resultado.glucosaPromedio,
        categoria: resultado.categoria,
      },
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: "No se pudo registrar." };
  }

  void recordAudit({
    userId: user.id,
    action: "endocrinologia.hba1c",
    metadata: {
      hba1c: resultado.hba1c,
      categoria: resultado.categoria,
    },
  });

  revalidatePath("/dashboard/endocrinologia");
  return { status: "ok", eventoId: data.id };
}
