"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { recordAudit } from "@/lib/audit";
import {
  PLANS,
  type PaidPlan,
} from "@/lib/stripe";
import { TIER_LABELS, type SubscriptionTier } from "@/lib/entitlements";

const SENTIMIENTO = ["caro", "justo", "barato"] as const;
type Sentimiento = (typeof SENTIMIENTO)[number];

const surveySchema = z.object({
  sentimiento: z.enum(SENTIMIENTO),
  precio_justo_mxn: z
    .number()
    .int()
    .min(0)
    .max(50_000)
    .optional()
    .nullable(),
  comentario: z.string().max(800).optional().or(z.literal("")),
});

export type SurveyResult =
  | { status: "ok" }
  | { status: "error"; message: string };

export async function submitPricingSurvey(input: {
  sentimiento: Sentimiento;
  precio_justo_mxn: number | null;
  comentario: string;
}): Promise<SurveyResult> {
  const parsed = surveySchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { data: profile } = await supa
    .from("profiles")
    .select(
      "subscription_tier, created_at, nombre, especialidad, hospital, pricing_survey_answered_at",
    )
    .eq("id", user.id)
    .single();

  if (profile?.pricing_survey_answered_at) {
    return { status: "error", message: "Ya respondiste esta encuesta" };
  }

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const daysSinceCreated = profile?.created_at
    ? Math.floor(
        (Date.now() - new Date(profile.created_at).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  // Precio actual del tier (referencia para el feedback)
  const planActual: PaidPlan | null =
    tier === "esencial" || tier === "pilot"
      ? "esencial"
      : tier === "pro"
        ? "profesional"
        : null;
  const precioActualMxn = planActual
    ? PLANS[planActual].monthlyMxn
    : null;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return { status: "error", message: "Servicio no configurado" };
  }

  const descripcion = [
    `Sentimiento: ${parsed.data.sentimiento}`,
    parsed.data.precio_justo_mxn != null
      ? `Precio que sí pagaría: MXN ${parsed.data.precio_justo_mxn}/mes`
      : null,
    parsed.data.comentario?.trim()
      ? `Comentario: ${parsed.data.comentario.trim()}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { error: feedbackErr } = await admin.from("feedback").insert({
    user_id: user.id,
    user_email: user.email ?? null,
    tipo: "precio",
    severidad: "baja",
    status: "nuevo",
    titulo: `Pricing survey · ${parsed.data.sentimiento} · ${TIER_LABELS[tier]}`,
    descripcion,
    metadata: {
      sentimiento: parsed.data.sentimiento,
      precio_justo_mxn: parsed.data.precio_justo_mxn,
      comentario: parsed.data.comentario || null,
      tier_actual: tier,
      precio_actual_mxn: precioActualMxn,
      dias_desde_signup: daysSinceCreated,
      nombre: profile?.nombre ?? null,
      especialidad: profile?.especialidad ?? null,
      hospital: profile?.hospital ?? null,
    },
  });

  if (feedbackErr) {
    console.error("[pricing-survey] feedback insert err:", feedbackErr);
    return { status: "error", message: "No pudimos guardar tu respuesta" };
  }

  await admin
    .from("profiles")
    .update({
      pricing_survey_answered_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  void recordAudit({
    userId: user.id,
    action: "pricing_survey.answered",
    metadata: {
      sentimiento: parsed.data.sentimiento,
      tier_actual: tier,
    },
  });

  revalidatePath("/dashboard");
  return { status: "ok" };
}

export async function dismissPricingSurvey(): Promise<SurveyResult> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const admin = getSupabaseAdmin();
  if (!admin) return { status: "error", message: "Servicio no configurado" };

  await admin
    .from("profiles")
    .update({
      pricing_survey_dismissed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  return { status: "ok" };
}

export async function markPricingSurveyShown(): Promise<void> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return;

  const admin = getSupabaseAdmin();
  if (!admin) return;

  // Solo actualiza si nunca se ha mostrado (idempotente)
  await admin
    .from("profiles")
    .update({ pricing_survey_shown_at: new Date().toISOString() })
    .eq("id", user.id)
    .is("pricing_survey_shown_at", null);
}
