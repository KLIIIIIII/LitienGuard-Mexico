import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?reason=missing_code`);
  }

  const supa = await createSupabaseServer();
  const { error } = await supa.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchange error:", error);
    return NextResponse.redirect(`${origin}/login?reason=invalid_link`);
  }

  // If the user has a verified TOTP factor and the current session is
  // only AAL1, force them through the MFA challenge before granting access
  // to the dashboard.
  try {
    const { data: aal } =
      await supa.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
      aal?.nextLevel === "aal2" &&
      aal.currentLevel !== "aal2"
    ) {
      const dest = new URL(`${origin}/auth/mfa`);
      dest.searchParams.set("next", next);
      return NextResponse.redirect(dest);
    }
  } catch (e) {
    console.warn("[auth/callback] AAL check failed:", e);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
