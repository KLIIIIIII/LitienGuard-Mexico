import { createSupabaseServer } from "@/lib/supabase-server";
import { WelcomeTutorialModal } from "@/components/welcome-tutorial-modal";
import type { ProfileType } from "@/lib/entitlements";

/**
 * Gate server-side del tutorial de bienvenida. Se dispara
 * automáticamente la primera vez DESPUÉS del onboarding de perfil
 * (cuando profile_type ya no es 'sin_definir') y solo si el médico
 * no lo ha completado ni saltado.
 *
 * Después de cerrar el modal (completar o saltar), el flag queda
 * persistido y no vuelve a aparecer. El médico puede repetirlo
 * manualmente desde /dashboard/configuracion o /dashboard/mi-plan.
 *
 * Importante: NO se dispara junto con el modal de onboarding de
 * perfil. Si el perfil aún está 'sin_definir', el onboarding modal
 * tiene prioridad. El tutorial aparece en el siguiente render
 * después de elegir perfil.
 */
export async function WelcomeTutorialGate() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supa
    .from("profiles")
    .select(
      "profile_type, nombre, welcome_tutorial_completed_at, welcome_tutorial_skipped_at",
    )
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  // Aún no eligió perfil — el ProfileOnboardingGate tiene prioridad
  if (profile.profile_type === "sin_definir") return null;

  // Ya lo completó o lo saltó
  if (
    profile.welcome_tutorial_completed_at ||
    profile.welcome_tutorial_skipped_at
  )
    return null;

  return (
    <WelcomeTutorialModal
      profileType={profile.profile_type as ProfileType}
      nombre={profile.nombre}
    />
  );
}
