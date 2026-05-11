export const TIER_LABELS = {
  free: "Gratis",
  pilot: "Piloto",
  pro: "Pro",
  enterprise: "Enterprise",
} as const;

export const TIER_DESCRIPTIONS = {
  free: "Acceso al panel — sin Scribe",
  pilot: "Scribe ilimitado durante piloto",
  pro: "Scribe + Cerebro · Plan comercial",
  enterprise: "Todo + RCM · Hospitales",
} as const;

export type SubscriptionTier = keyof typeof TIER_LABELS;

const SCRIBE_TIERS: SubscriptionTier[] = ["pilot", "pro", "enterprise"];
const CEREBRO_TIERS: SubscriptionTier[] = ["pro", "enterprise"];
const RCM_TIERS: SubscriptionTier[] = ["enterprise"];

export function canUseScribe(tier: SubscriptionTier | null | undefined): boolean {
  if (!tier) return false;
  return SCRIBE_TIERS.includes(tier);
}

export function canUseCerebro(
  tier: SubscriptionTier | null | undefined,
): boolean {
  if (!tier) return false;
  return CEREBRO_TIERS.includes(tier);
}

export function canUseRcm(tier: SubscriptionTier | null | undefined): boolean {
  if (!tier) return false;
  return RCM_TIERS.includes(tier);
}

export function tierBadgeClass(tier: SubscriptionTier | null | undefined): string {
  switch (tier) {
    case "pro":
    case "enterprise":
      return "bg-validation-soft text-validation";
    case "pilot":
      return "bg-accent-soft text-accent";
    case "free":
    default:
      return "bg-warn-soft text-warn";
  }
}
