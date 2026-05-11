/**
 * Cloudflare Turnstile — anti-bot, anti-bruteforce gate.
 * Front-end renders the widget; the user's solved token is sent up to the
 * server action and we verify it against the siteverify endpoint before
 * allowing the protected action (magic link / preregistro / etc).
 *
 * If TURNSTILE_SECRET_KEY is not set in env (e.g. local dev w/o keys), the
 * verifier returns `{ ok: true }` so dev flows don't break. In production
 * we trust env presence — set NEXT_PUBLIC_TURNSTILE_SITE_KEY AND
 * TURNSTILE_SECRET_KEY together (otherwise the widget shows but verify
 * silently passes, which is worse than no widget).
 */

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifyResult {
  ok: boolean;
  reason?: string;
}

export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string,
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Not configured → permissive (dev / preview). Set the env var to enforce.
    return { ok: true, reason: "not_configured" };
  }
  if (!token) {
    return { ok: false, reason: "missing_token" };
  }
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    if (!data.success) {
      return {
        ok: false,
        reason: (data["error-codes"] ?? []).join(",") || "rejected",
      };
    }
    return { ok: true };
  } catch (e) {
    console.error("[turnstile] verify failed:", e);
    return { ok: false, reason: "network_error" };
  }
}

export function turnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;
}
