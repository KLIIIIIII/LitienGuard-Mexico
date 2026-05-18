import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import {
  canUseScribe,
  canUseCerebro,
  canUseHospitalModules,
  canUseEspecialidadModulo,
  canUseRecetas,
  canUseAgenda,
  canUsePacientes,
  shouldShowOdontograma,
  shouldShowScribe,
  shouldShowMisConsultas,
  shouldShowDiferencial,
  shouldShowRcm,
  shouldShowAreasCriticas,
  shouldShowApoyoDiagnostico,
  shouldShowEspecialidadesMedicas,
  type SubscriptionTier,
  type ProfileType,
} from "@/lib/entitlements";
import { applyCapturedReferralCode } from "./referidos/actions";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardMobileBar } from "./dashboard-mobile-bar";
import { PricingSurveyGate } from "@/components/pricing-survey-gate";
import { ProfileOnboardingGate } from "@/components/profile-onboarding-gate";
import { WelcomeTutorialGate } from "@/components/welcome-tutorial-gate";
import { FeedbackButton } from "@/components/feedback-button";

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
    .select("role, subscription_tier, profile_type, especialidad")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const profileType = (profile?.profile_type ?? "sin_definir") as ProfileType;
  const isAdmin = profile?.role === "admin";
  const especialidad = (profile?.especialidad ?? null) as string | null;

  // Calcular qué módulos de especialidad puede ver el médico:
  // - Clínica: los 4
  // - Profesional: solo el que mapea a SU especialidad
  // - Otros: ninguno
  const availableEspecialidades = (
    ["cardiologia", "neurologia", "oncologia", "endocrinologia"] as const
  ).filter((target) =>
    canUseEspecialidadModulo({
      tier,
      profileEspecialidad: especialidad,
      targetModulo: target,
    }),
  );

  // Fire-and-forget: apply captured referral cookie if first dashboard visit.
  // Idempotent — won't apply twice. Silently no-ops if no captured code.
  void applyCapturedReferralCode().catch(() => undefined);

  const sidebarProps = {
    tier,
    isAdmin,
    canScribe: canUseScribe(tier),
    canCerebro: canUseCerebro(tier),
    canHospitalModules: canUseHospitalModules(tier),
    canRecetas: canUseRecetas(tier),
    canAgenda: canUseAgenda(tier),
    canPacientes: canUsePacientes(tier),
    availableEspecialidades,
    showOdontograma: shouldShowOdontograma(profileType),
    showScribe: shouldShowScribe(profileType),
    showMisConsultas: shouldShowMisConsultas(profileType),
    showDiferencial: shouldShowDiferencial(profileType),
    showAreasCriticas: shouldShowAreasCriticas(profileType),
    showApoyoDiagnostico: shouldShowApoyoDiagnostico(profileType),
    showEspecialidadesMedicas:
      shouldShowEspecialidadesMedicas(profileType) &&
      availableEspecialidades.length > 0,
  };

  return (
    <div className="lg-shell py-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 lg:py-8">
      {/* Mobile-only: bar superior con plan + menú drawer */}
      <DashboardMobileBar {...sidebarProps} />

      {/* Desktop-only: sidebar vertical sticky */}
      <div className="hidden lg:block">
        <DashboardSidebar {...sidebarProps} showRcm={shouldShowRcm(profileType)} />
      </div>

      <div className="min-w-0">{children}</div>

      <Suspense fallback={null}>
        <PricingSurveyGate />
      </Suspense>
      <Suspense fallback={null}>
        <ProfileOnboardingGate />
      </Suspense>
      <Suspense fallback={null}>
        <WelcomeTutorialGate />
      </Suspense>

      <FeedbackButton />
    </div>
  );
}
