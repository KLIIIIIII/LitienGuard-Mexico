import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { PLANS, type PaidPlan } from "@/lib/stripe";
import { TIER_LABELS, type SubscriptionTier } from "@/lib/entitlements";
import { PricingSurveyModal } from "@/components/pricing-survey-modal";

const DAYS_MIN_BEFORE_SHOW = 3;
const DAYS_BEFORE_REASK_AFTER_DISMISS = 7;

/**
 * Server-side gate que decide si renderizar la encuesta proactiva de
 * pricing. Se monta en /dashboard/layout.tsx para que aparezca en
 * cualquier sub-ruta del panel.
 *
 * Condiciones para mostrar:
 *   1. Usuario autenticado
 *   2. days_since_created_at >= 3
 *   3. Tier de pago en ('pilot', 'esencial', 'pro') — todo el piloto
 *      da feedback de precio, sin importar el tier que se les asignó.
 *      Enterprise se excluye (son contratos negociados aparte).
 *   4. pricing_survey_answered_at IS NULL
 *   5. pricing_survey_dismissed_at IS NULL OR > 7 días pasados
 *
 * Side effect: cuando determina que SÍ debe mostrar, marca
 * pricing_survey_shown_at en profiles (idempotente: solo la primera
 * vez). Eso queda como evidencia de que el usuario fue expuesto al
 * pop-up — útil para diferenciar "no contestó porque no apareció"
 * vs "no contestó porque cerró".
 */
export async function PricingSurveyGate() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supa
    .from("profiles")
    .select(
      "subscription_tier, created_at, pricing_survey_answered_at, pricing_survey_dismissed_at",
    )
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  if (profile.pricing_survey_answered_at) return null;

  const tier = (profile.subscription_tier ?? "free") as SubscriptionTier;
  const TIERS_ENCUESTABLES: SubscriptionTier[] = [
    "pilot",
    "esencial",
    "pro",
  ];
  if (!TIERS_ENCUESTABLES.includes(tier)) return null;

  // Días desde signup
  if (!profile.created_at) return null;
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(profile.created_at).getTime()) /
      (1000 * 60 * 60 * 24),
  );
  if (daysSinceCreated < DAYS_MIN_BEFORE_SHOW) return null;

  // Si lo cerró antes, esperar 7 días
  if (profile.pricing_survey_dismissed_at) {
    const daysSinceDismiss = Math.floor(
      (Date.now() -
        new Date(profile.pricing_survey_dismissed_at).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysSinceDismiss < DAYS_BEFORE_REASK_AFTER_DISMISS) return null;
  }

  // Calcula precio actual del tier para mostrarlo en el modal
  const paidPlan: PaidPlan | null =
    tier === "esencial" || tier === "pilot"
      ? "esencial"
      : tier === "pro"
        ? "profesional"
        : null;
  const precioActualMxn = paidPlan ? PLANS[paidPlan].monthlyMxn : 499;

  // Marca como mostrado (fire-and-forget, no espera)
  void (async () => {
    const admin = getSupabaseAdmin();
    if (!admin) return;
    await admin
      .from("profiles")
      .update({ pricing_survey_shown_at: new Date().toISOString() })
      .eq("id", user.id)
      .is("pricing_survey_shown_at", null);
  })();

  return (
    <PricingSurveyModal
      precioActualMxn={precioActualMxn}
      tierLabel={TIER_LABELS[tier]}
    />
  );
}
