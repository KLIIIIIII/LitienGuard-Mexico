export const TIER_LABELS = {
  free: "Explorador",
  esencial: "Esencial",
  pilot: "Esencial (piloto)",
  pro: "Profesional",
  enterprise: "Clínica",
} as const;

export const TIER_DESCRIPTIONS = {
  free: "Acceso al panel — 5 notas SOAP, sin cerebro",
  esencial: "100 SOAPs + cerebro lectura + recetas básicas",
  pilot: "Scribe ilimitado durante piloto",
  pro: "Scribe + cerebro + diferencial bayesiano + agenda",
  enterprise: "Todo + RCM + multi-médico + SLA",
} as const;

export type SubscriptionTier = keyof typeof TIER_LABELS;

// "pilot" is kept for backward compatibility — same access as "esencial".
const ESENCIAL_TIERS: SubscriptionTier[] = ["esencial", "pilot", "pro", "enterprise"];
const SCRIBE_TIERS: SubscriptionTier[] = ["pilot", "pro", "enterprise"];
const CEREBRO_TIERS: SubscriptionTier[] = ["pro", "enterprise"];
const RECETAS_TIERS: SubscriptionTier[] = ["esencial", "pilot", "pro", "enterprise"];
const AGENDA_TIERS: SubscriptionTier[] = ["pro", "enterprise"];
const RCM_TIERS: SubscriptionTier[] = ["enterprise"];

/**
 * Read-only access to cerebro (search guidelines, no diferencial engine
 * or auto-extraction). Available from Esencial.
 */
export function canReadCerebro(
  tier: SubscriptionTier | null | undefined,
): boolean {
  if (!tier) return false;
  return ESENCIAL_TIERS.includes(tier);
}

export function canUseScribe(tier: SubscriptionTier | null | undefined): boolean {
  if (!tier) return false;
  return SCRIBE_TIERS.includes(tier);
}

/**
 * Full cerebro access — includes diferencial bayesiano engine,
 * auto-extraction of findings, evidence Q&A.
 */
export function canUseCerebro(
  tier: SubscriptionTier | null | undefined,
): boolean {
  if (!tier) return false;
  return CEREBRO_TIERS.includes(tier);
}

export function canUseRecetas(
  tier: SubscriptionTier | null | undefined,
): boolean {
  if (!tier) return false;
  return RECETAS_TIERS.includes(tier);
}

export function canUseAgenda(
  tier: SubscriptionTier | null | undefined,
): boolean {
  if (!tier) return false;
  return AGENDA_TIERS.includes(tier);
}

export function canUseRcm(tier: SubscriptionTier | null | undefined): boolean {
  if (!tier) return false;
  return RCM_TIERS.includes(tier);
}

export function scribeMonthlyLimit(
  tier: SubscriptionTier | null | undefined,
): number {
  switch (tier) {
    case "pilot":
    case "esencial":
      return 100;
    case "pro":
      return 300;
    case "enterprise":
      return Infinity;
    case "free":
    default:
      return 0;
  }
}

export function tierBadgeClass(tier: SubscriptionTier | null | undefined): string {
  switch (tier) {
    case "pro":
    case "enterprise":
      return "bg-validation-soft text-validation";
    case "pilot":
    case "esencial":
      return "bg-accent-soft text-accent";
    case "free":
    default:
      return "bg-warn-soft text-warn";
  }
}
