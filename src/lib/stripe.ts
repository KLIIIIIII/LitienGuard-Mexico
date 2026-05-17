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

/* ============================================================
   PRICING V2 — matriz segmento × perfil × tier funcional
   Decisión Carlos 2026-05-17. Doc: litienguard_av_pricing_v2.md
   ============================================================ */

/**
 * 4 perfiles. "core" engloba las 5 especialidades curadas por
 * LitienGuard (cardiología, oncología, gineco-oncología, diabetes/endo,
 * neurología). El detalle por especialidad se muestra en la sección
 * "Workflows por especialidad" más abajo en /precios.
 */
export type Specialty =
  | "core"
  | "general"
  | "otra_especialidad"
  | "dentista";
export type Segment = "solo" | "equipo" | "clinica";
export type FunctionalTier = "esencial" | "profesional";
export type BillingCycle = "mensual" | "anual";

/** Tier interno que controla acceso a features (entitlements). */
export type AccessTier = "pilot" | "pro" | "enterprise";

/* Multiplicadores por perfil (sobre base Médico General).
   Core agrupa las 5 especialidades curadas con cerebro profundo. */
const SPECIALTY_MULT: Record<Specialty, { esencial: number; profesional: number }> = {
  general: { esencial: 1.0, profesional: 1.0 },
  core: { esencial: 1.3, profesional: 1.3 },
  otra_especialidad: { esencial: 1.3, profesional: 1.3 },
  dentista: { esencial: 0.9, profesional: 1.0 },
};

/* Multiplicador por segmento (sobre base Solo) */
const SEGMENT_MULT: Record<Segment, { esencial: number; profesional: number }> = {
  solo: { esencial: 1.0, profesional: 1.0 },
  equipo: { esencial: 0.86, profesional: 0.86 }, // -14% por médico
  clinica: { esencial: 1.0, profesional: 1.0 }, // base + extra por médico
};

/* Base Médico General Solo (Pricing v2 = v1 × 1.87 redondeado) */
const BASE_SOLO_GENERAL = {
  esencial: 929, // antes 499 × 1.87 ≈ 933 → 929
  profesional: 1869, // antes 999 × 1.87 ≈ 1868 → 1869
};

/* SOAPs incluidos por tier */
export const SOAP_QUOTA: Record<FunctionalTier, number> = {
  esencial: 100,
  profesional: 300,
};

/* Costo por SOAP extra (sobre la cuota) */
export const SOAP_OVERAGE_MXN: Record<FunctionalTier, number> = {
  esencial: 5,
  profesional: 4,
};

export interface PriceQuote {
  segment: Segment;
  specialty: Specialty;
  tier: FunctionalTier;
  cycle: BillingCycle;
  /** Mensual (o equivalente mensual si anual) */
  monthlyMxn: number;
  /** Total anual si se paga anual (= monthlyMxn × 10) */
  annualMxn: number | null;
  /** Cuántos médicos asume este pricing */
  baseSeats: number;
  /** Por médico extra (clínica) */
  extraSeatMxn: number | null;
  /** Soaps incluidos */
  soapQuota: number;
  /** Tier interno para entitlements */
  accessTier: AccessTier;
  /** PriceId Stripe — null hasta que se cree */
  priceId: string | null;
  /** Etiqueta legible */
  label: string;
}

/**
 * Calcula el precio para una combinación segmento × especialidad × tier
 * × ciclo. Es función pura para que la UI pueda recalcular en vivo.
 */
export function quotePrice(
  segment: Segment,
  specialty: Specialty,
  tier: FunctionalTier,
  cycle: BillingCycle = "mensual",
): PriceQuote {
  const base = BASE_SOLO_GENERAL[tier];
  const specMult = SPECIALTY_MULT[specialty][tier];
  const segMult = SEGMENT_MULT[segment][tier];

  let monthlyMxn = Math.round((base * specMult * segMult) / 10) * 10; // redondear a 10

  // Clínica: base × 10 (porque incluye 6 médicos)
  let baseSeats = 1;
  let extraSeatMxn: number | null = null;
  if (segment === "clinica") {
    monthlyMxn = Math.round(monthlyMxn * 10);
    baseSeats = 6;
    extraSeatMxn = tier === "esencial" ? 499 : 999;
  } else if (segment === "equipo") {
    baseSeats = 1; // se cobra por médico, mínimo 2
  }

  const annualMxn = cycle === "anual" ? monthlyMxn * 10 : null;
  const accessTier: AccessTier = tier === "esencial" ? "pilot" : "pro";

  const labelSeg =
    segment === "solo"
      ? "Solo"
      : segment === "equipo"
        ? "Equipo"
        : "Clínica";
  const labelSpec = specialtyLabel(specialty);
  const labelTier = tier === "esencial" ? "Esencial" : "Profesional";

  return {
    segment,
    specialty,
    tier,
    cycle,
    monthlyMxn,
    annualMxn,
    baseSeats,
    extraSeatMxn,
    soapQuota: SOAP_QUOTA[tier],
    accessTier,
    priceId: lookupPriceId(segment, specialty, tier, cycle),
    label: `${labelSeg} · ${labelSpec} · ${labelTier}`,
  };
}

/**
 * Lookup de priceIds en env vars. Patrón de naming:
 *   STRIPE_PRICE_{SEGMENT}_{SPECIALTY}_{TIER}_{CYCLE}
 * Si no existe → null (deshabilita checkout y muestra "contacto" en UI).
 *
 * Backward compatibility: si solo existen los v1 STRIPE_PRICE_ESENCIAL_*
 * los usamos como fallback para Solo · General hasta migrar.
 */
function lookupPriceId(
  segment: Segment,
  specialty: Specialty,
  tier: FunctionalTier,
  cycle: BillingCycle,
): string | null {
  const segUp = segment.toUpperCase();
  const specUp = specialty.toUpperCase();
  const tierUp = tier.toUpperCase();
  const cycleUp = cycle.toUpperCase();
  const env = process.env;

  // Try specific v2 priceId
  const specific = env[`STRIPE_PRICE_${segUp}_${specUp}_${tierUp}_${cycleUp}`];
  if (specific) return specific;

  // Fallback v1 only for Solo · General (lo más cercano al schema viejo)
  if (segment === "solo" && specialty === "general") {
    if (tier === "esencial") {
      return cycle === "anual"
        ? env.STRIPE_PRICE_ESENCIAL_ANUAL ?? null
        : env.STRIPE_PRICE_ESENCIAL_MENSUAL ?? null;
    }
    if (tier === "profesional") {
      return cycle === "anual"
        ? env.STRIPE_PRICE_PROFESIONAL_ANUAL ?? null
        : env.STRIPE_PRICE_PROFESIONAL_MENSUAL ?? null;
    }
  }

  return null;
}

/* ============================================================
   PLANS — compatibility wrapper para código legacy
   ============================================================ */

export type PaidPlan = "esencial" | "profesional";

interface PlanConfig {
  name: string;
  monthlyMxn: number;
  annualMxn: number;
  priceIdMonthly: string | null;
  priceIdAnnual: string | null;
  tier: "pilot" | "pro";
}

/**
 * Wrapper de compatibilidad: el código legacy llama PLANS.esencial.monthlyMxn.
 * Mapea al precio base Solo · Médico General de la matriz v2.
 */
export const PLANS: Record<PaidPlan, PlanConfig> = {
  esencial: {
    name: "Esencial",
    monthlyMxn: BASE_SOLO_GENERAL.esencial,
    annualMxn: BASE_SOLO_GENERAL.esencial * 10,
    priceIdMonthly: process.env.STRIPE_PRICE_ESENCIAL_MENSUAL ?? null,
    priceIdAnnual: process.env.STRIPE_PRICE_ESENCIAL_ANUAL ?? null,
    tier: "pilot",
  },
  profesional: {
    name: "Profesional",
    monthlyMxn: BASE_SOLO_GENERAL.profesional,
    annualMxn: BASE_SOLO_GENERAL.profesional * 10,
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

/* ============================================================
   Hospital Enterprise — manual contracting
   ============================================================ */

export const HOSPITAL_ENTERPRISE_MIN_MXN = 49_999;

export function specialtyLabel(s: Specialty): string {
  switch (s) {
    case "general": return "Médico General";
    case "core": return "Especialidad Core";
    case "otra_especialidad": return "Otra especialidad";
    case "dentista": return "Dentista";
  }
}
