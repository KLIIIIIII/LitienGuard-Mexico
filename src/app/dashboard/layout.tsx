import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import {
  canUseScribe,
  canUseCerebro,
  canUseRecetas,
  canUseAgenda,
  canUsePacientes,
  shouldShowOdontograma,
  shouldShowDiferencial,
  shouldShowRcm,
  type SubscriptionTier,
  type ProfileType,
} from "@/lib/entitlements";
import { applyCapturedReferralCode } from "./referidos/actions";
import { DashboardSidebar } from "./dashboard-sidebar";
import { PricingSurveyGate } from "@/components/pricing-survey-gate";
import { ProfileOnboardingGate } from "@/components/profile-onboarding-gate";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  // Enforce AAL2 for users who have MFA enabled. If the session is AAL1
  // and the account has a verified factor, send them to challenge first.
  // (Note: keep the redirect outside the try/catch — NEXT_REDIRECT throws.)
  let needsAal2 = false;
  try {
    const { data: aal } =
      await supa.auth.mfa.getAuthenticatorAssuranceLevel();
    needsAal2 =
      aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2";
  } catch {
    needsAal2 = false;
  }
  if (needsAal2) redirect("/auth/mfa?next=/dashboard");

  const { data: profile } = await supa
    .from("profiles")
    .select("role, subscription_tier, profile_type")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const profileType = (profile?.profile_type ?? "sin_definir") as ProfileType;
  const isAdmin = profile?.role === "admin";

  // Fire-and-forget: apply captured referral cookie if first dashboard visit.
  // Idempotent — won't apply twice. Silently no-ops if no captured code.
  void applyCapturedReferralCode().catch(() => undefined);

  return (
    <div className="lg-shell grid gap-8 py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 lg:py-8">
      <DashboardSidebar
        tier={tier}
        isAdmin={isAdmin}
        canScribe={canUseScribe(tier)}
        canCerebro={canUseCerebro(tier)}
        canRecetas={canUseRecetas(tier)}
        canAgenda={canUseAgenda(tier)}
        canPacientes={canUsePacientes(tier)}
        showOdontograma={shouldShowOdontograma(profileType)}
        showDiferencial={shouldShowDiferencial(profileType)}
        showRcm={shouldShowRcm(profileType)}
      />
      <div className="min-w-0">{children}</div>
      <Suspense fallback={null}>
        <PricingSurveyGate />
      </Suspense>
      <Suspense fallback={null}>
        <ProfileOnboardingGate />
      </Suspense>
    </div>
  );
}
