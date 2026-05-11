import { getSupabaseAdmin } from "@/lib/supabase-admin";

export interface RateLimitConfig {
  action: string;
  /** Window in seconds */
  windowSec: number;
  /** Maximum events per window per IP */
  max: number;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  login: { action: "login", windowSec: 300, max: 6 }, // 6 magic-link requests / 5 min
  preregistro: { action: "preregistro", windowSec: 600, max: 4 }, // 4 / 10 min
  scribe: { action: "scribe", windowSec: 3600, max: 40 }, // 40 SOAP / hour
  feedback: { action: "feedback", windowSec: 600, max: 8 }, // 8 / 10 min
  exportar: { action: "exportar", windowSec: 3600, max: 10 }, // 10 dumps / hour
};

const LOCKOUT_THRESHOLD = 3; // burning through limit N times → IP lockout
const LOCKOUT_MINUTES = 60;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSec: number;
}

/**
 * Lightweight rate limiter backed by the `rate_limit_log` table.
 * Race-prone under heavy concurrency but adequate for piloto-scale traffic
 * and abuse prevention. Replace with Redis/Upstash when traffic justifies.
 */
export async function checkRateLimit(
  ip: string,
  actionKey: keyof typeof DEFAULT_LIMITS | string,
  userId?: string | null,
): Promise<RateLimitResult> {
  const cfg = DEFAULT_LIMITS[actionKey] ?? {
    action: actionKey,
    windowSec: 600,
    max: 20,
  };
  const supa = getSupabaseAdmin();
  if (!supa || !ip) {
    return { allowed: true, remaining: cfg.max, resetSec: cfg.windowSec };
  }

  const sinceIso = new Date(Date.now() - cfg.windowSec * 1000).toISOString();
  const { count } = await supa
    .from("rate_limit_log")
    .select("*", { count: "exact", head: true })
    .eq("action", cfg.action)
    .eq("ip", ip)
    .gte("created_at", sinceIso);

  const used = count ?? 0;
  if (used >= cfg.max) {
    // How many times has this IP been at the cap in the last 24h?
    const burnsSince = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count: totalBurns } = await supa
      .from("rate_limit_log")
      .select("*", { count: "exact", head: true })
      .eq("action", cfg.action)
      .eq("ip", ip)
      .gte("created_at", burnsSince);
    if ((totalBurns ?? 0) >= cfg.max * LOCKOUT_THRESHOLD) {
      const until = new Date(
        Date.now() + LOCKOUT_MINUTES * 60_000,
      ).toISOString();
      await supa.from("login_lockouts").insert({
        ip,
        user_email: null,
        locked_until: until,
        reason: `rate_limit_abuse:${cfg.action}`,
      });
    }
    return { allowed: false, remaining: 0, resetSec: cfg.windowSec };
  }

  await supa.from("rate_limit_log").insert({
    ip,
    action: cfg.action,
    user_id: userId ?? null,
  });

  return {
    allowed: true,
    remaining: Math.max(0, cfg.max - used - 1),
    resetSec: cfg.windowSec,
  };
}

export function extractIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
