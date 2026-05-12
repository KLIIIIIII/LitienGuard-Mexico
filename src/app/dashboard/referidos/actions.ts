"use server";

import { cookies } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

const REF_COOKIE = "lg_ref";
const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 60; // 60 days

export type ReferralCodeResult =
  | { status: "ok"; code: string }
  | { status: "error"; message: string };

/**
 * Returns the user's referral code. If profile doesn't have one yet
 * (legacy or trigger missed), generates one via the SQL function.
 */
export async function getMyReferralCode(): Promise<ReferralCodeResult> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { data: profile } = await supa
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single();

  if (profile?.referral_code) {
    return { status: "ok", code: profile.referral_code };
  }

  // Fallback: regenerate via SQL function
  const { data: gen, error: genErr } = await supa.rpc("generate_referral_code");
  if (genErr || !gen) {
    return { status: "error", message: "No pudimos generar el código." };
  }
  await supa
    .from("profiles")
    .update({ referral_code: gen as string })
    .eq("id", user.id);
  return { status: "ok", code: gen as string };
}

/**
 * Stores the captured ?ref= code in a cookie so the signup flow can
 * read it when the new user creates their account.
 */
export async function captureReferralCode(code: string): Promise<void> {
  const sanitized = code
    .trim()
    .toUpperCase()
    .slice(0, 12)
    .replace(/[^A-Z0-9-]/g, "");
  if (!/^LG-[A-Z0-9]{6}$/.test(sanitized)) return;

  const jar = await cookies();
  jar.set(REF_COOKIE, sanitized, {
    maxAge: REF_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Reads the captured referral code from cookie (used during signup).
 */
export async function readCapturedReferralCode(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(REF_COOKIE)?.value ?? null;
}

/**
 * Apply a captured referral code to the current user. Called after signup
 * once the user is authenticated. Creates referrals row and sets
 * referred_by on profile. Idempotent — won't apply twice.
 */
export async function applyCapturedReferralCode(): Promise<
  | { status: "ok"; applied: boolean }
  | { status: "error"; message: string }
> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const code = await readCapturedReferralCode();
  if (!code) return { status: "ok", applied: false };

  const { data: profile } = await supa
    .from("profiles")
    .select("referred_by")
    .eq("id", user.id)
    .single();
  if (profile?.referred_by) return { status: "ok", applied: false };

  const { data: referrer } = await supa
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .single();
  if (!referrer) {
    return { status: "ok", applied: false };
  }
  if (referrer.id === user.id) {
    return { status: "ok", applied: false };
  }

  await supa
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", user.id);

  const { error: insertErr } = await supa.from("referrals").insert({
    referrer_id: referrer.id,
    referred_id: user.id,
    code,
    status: "pending",
  });

  if (insertErr) {
    return { status: "error", message: insertErr.message };
  }

  const jar = await cookies();
  jar.delete(REF_COOKIE);

  void recordAudit({
    userId: user.id,
    action: "referral.applied",
    resource: referrer.id,
    metadata: { code },
  });

  return { status: "ok", applied: true };
}
