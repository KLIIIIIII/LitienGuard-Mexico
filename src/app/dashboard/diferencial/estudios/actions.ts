"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import {
  evaluarPatrones,
  type EstudioIngresado,
  type PatronCobertura,
} from "@/lib/inference/motor-estudios";

const schema = z.object({
  estudios: z.array(
    z.object({
      estudioId: z.string().min(1).max(100),
      hallazgoPresente: z.boolean(),
      resultadoTexto: z.string().max(500).optional(),
    }),
  ),
});

export type EvaluarResult =
  | { status: "ok"; patrones: PatronCobertura[]; latencyMs: number }
  | { status: "error"; message: string };

export async function evaluarEstudios(
  estudios: EstudioIngresado[],
): Promise<EvaluarResult> {
  const parsed = schema.safeParse({ estudios });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  if (parsed.data.estudios.length === 0) {
    return {
      status: "error",
      message: "Selecciona al menos un estudio con hallazgo positivo.",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const hdrs = await headers();
  const ip = extractIp(hdrs);
  const rl = await checkRateLimit(ip, "diferencial", user.id);
  if (!rl.allowed) {
    return {
      status: "error",
      message: "Has alcanzado el límite de evaluaciones por hora.",
    };
  }

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseCerebro(tier)) {
    return {
      status: "error",
      message: "El motor de estudios requiere plan Profesional o superior.",
    };
  }

  const t0 = Date.now();
  const patrones = evaluarPatrones(parsed.data.estudios, 6);
  const latencyMs = Date.now() - t0;

  void recordAudit({
    userId: user.id,
    action: "diferencial.evaluar_estudios",
    metadata: {
      n_estudios: parsed.data.estudios.length,
      positivos: parsed.data.estudios.filter((e) => e.hallazgoPresente).length,
      patrones_match: patrones.length,
      top_patron: patrones[0]?.patron.id ?? null,
      top_score: patrones[0]?.score ?? null,
    },
  });

  return { status: "ok", patrones, latencyMs };
}
