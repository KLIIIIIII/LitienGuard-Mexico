/**
 * Temporary diagnostic endpoint for the Resend pipeline.
 *
 * Visit /api/debug/email                         → just shows env-var presence
 * Visit /api/debug/email?to=email@example.com    → also attempts a test send
 *
 * REMOVE this file once email delivery is confirmed working.
 *
 * Auth: must be logged-in admin (matches the rest of the admin surface).
 */

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getResend, RESEND_FROM } from "@/lib/resend-client";

function redactKey(key: string | undefined): string {
  if (!key) return "MISSING";
  if (key.length < 8) return `SHORT(${key.length})`;
  return `${key.slice(0, 4)}…${key.slice(-3)} (len=${key.length})`;
}

export async function GET(request: NextRequest) {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const { data: profile } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "not_admin" }, { status: 403 });
  }

  const env = {
    RESEND_API_KEY: redactKey(process.env.RESEND_API_KEY),
    RESEND_FROM: process.env.RESEND_FROM ?? "(unset, falling back to default)",
    RESEND_FROM_resolved: RESEND_FROM,
    ADMIN_NOTIFY_EMAIL:
      process.env.ADMIN_NOTIFY_EMAIL ?? "(unset, falling back to default)",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "(unset)",
  };

  const url = new URL(request.url);
  const to = url.searchParams.get("to");

  if (!to) {
    return NextResponse.json({
      env,
      note: "Add ?to=email@example.com to actually attempt a test send.",
    });
  }

  const resend = getResend();
  if (!resend) {
    return NextResponse.json({
      env,
      send: { ok: false, reason: "resend_client_not_available" },
    });
  }

  try {
    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: [to],
      subject: "LitienGuard · diagnostic test email",
      html: `
        <p>This is an automated diagnostic email from LitienGuard.</p>
        <p>If you received it, the Resend pipeline works for this recipient.</p>
        <p>Triggered by admin <code>${user.email}</code> at ${new Date().toISOString()}.</p>
      `,
    });
    return NextResponse.json({
      env,
      send: {
        ok: !result.error,
        recipient: to,
        from: RESEND_FROM,
        resendResponse: result,
      },
    });
  } catch (e) {
    return NextResponse.json({
      env,
      send: {
        ok: false,
        recipient: to,
        from: RESEND_FROM,
        error: e instanceof Error ? e.message : String(e),
      },
    });
  }
}
