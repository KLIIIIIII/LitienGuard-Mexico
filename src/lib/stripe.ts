import Stripe from "stripe";

/**
 * Stripe lazy singleton. Returns null when the secret key is not
 * configured — every caller must handle that case to support gracefully
 * degrading the pricing page before billing goes live.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  _stripe = new Stripe(key, {
    typescript: true,
    appInfo: { name: "LitienGuard", url: "https://litien-guard-mexico.vercel.app" },
  });
  return _stripe;
}

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

/**
 * Planes pagados que el sistema vende. El tier "free" no necesita
 * checkout y el "enterprise" se vende contratado, no auto-servicio.
 *
 * Cada plan tiene un priceId mensual y uno anual. Si los env vars no
 * están configurados, el checkout queda deshabilitado para ese plan
 * (degradación elegante).
 */
export type PaidPlan = "esencial" | "profesional";
export type BillingCycle = "mensual" | "anual";

interface PlanConfig {
  name: string;
  monthlyMxn: number;
  annualMxn: number; // total cobrado anual (con descuento)
  priceIdMonthly: string | null;
  priceIdAnnual: string | null;
  tier: "pilot" | "pro";
}

export const PLANS: Record<PaidPlan, PlanConfig> = {
  esencial: {
    name: "Esencial",
    monthlyMxn: 499,
    annualMxn: 4990, // 2 meses gratis
    priceIdMonthly: process.env.STRIPE_PRICE_ESENCIAL_MENSUAL ?? null,
    priceIdAnnual: process.env.STRIPE_PRICE_ESENCIAL_ANUAL ?? null,
    tier: "pilot",
  },
  profesional: {
    name: "Profesional",
    monthlyMxn: 999,
    annualMxn: 9990,
    priceIdMonthly: process.env.STRIPE_PRICE_PROFESIONAL_MENSUAL ?? null,
    priceIdAnnual: process.env.STRIPE_PRICE_PROFESIONAL_ANUAL ?? null,
    tier: "pro",
  },
};

export function priceIdFor(plan: PaidPlan, cycle: BillingCycle): string | null {
  const cfg = PLANS[plan];
  return cycle === "anual" ? cfg.priceIdAnnual : cfg.priceIdMonthly;
}

export function isBillingConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!STRIPE_WEBHOOK_SECRET;
}
