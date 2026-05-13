import { createSupabaseServer } from "@/lib/supabase-server";
import { ProfileOnboardingModal } from "@/components/profile-onboarding-modal";

/**
 * Server-side gate del onboarding de perfil. Si profile_type es
 * 'sin_definir', monta el modal bloqueante. El modal cubre toda la
 * pantalla y no se puede cerrar — solo desaparece al elegir.
 *
 * Diseñado para montarse en /dashboard/layout.tsx después del auth
 * check pero antes del contenido. Si el modal NO debe aparecer
 * (perfil ya elegido), retorna null y el render del dashboard
 * procede normal.
 */
export async function ProfileOnboardingGate() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supa
    .from("profiles")
    .select("profile_type")
    .eq("id", user.id)
    .single();

  if (!profile || profile.profile_type !== "sin_definir") return null;

  return <ProfileOnboardingModal />;
}
