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

  return NextResponse.redirect(`${origin}${next}`);
}
