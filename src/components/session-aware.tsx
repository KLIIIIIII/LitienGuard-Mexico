import { createSupabaseServer } from "@/lib/supabase-server";
import { AuthErrorHandler } from "@/components/auth-error-handler";
import { FloatingDashboardBanner } from "@/components/floating-dashboard-banner";

/**
 * Server component that resolves the current session once per request,
 * then renders the cross-page client widgets that depend on it.
 * Lives in the root layout so every page benefits.
 */
export async function SessionAware() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return <AuthErrorHandler isLoggedIn={false} />;
  }

  try {
    const supa = await createSupabaseServer();
    const {
      data: { user },
    } = await supa.auth.getUser();

    if (!user) {
      return <AuthErrorHandler isLoggedIn={false} />;
    }

    const { data: profile } = await supa
      .from("profiles")
      .select("nombre")
      .eq("id", user.id)
      .single();

    const firstName =
      profile?.nombre?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Tú";

    return (
      <>
        <AuthErrorHandler isLoggedIn />
        <FloatingDashboardBanner firstName={firstName} />
      </>
    );
  } catch {
    return <AuthErrorHandler isLoggedIn={false} />;
  }
}
