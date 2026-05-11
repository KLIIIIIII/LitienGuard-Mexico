import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getResend, RESEND_FROM } from "@/lib/resend-client";
import { recordAudit } from "@/lib/audit";

/**
 * Stable per-(user-agent + IP /16) fingerprint. We deliberately truncate
 * the IP to its first two octets so a user's residential dynamic IP swap
 * doesn't keep triggering "new device" alerts, while a different ISP or
 * country still does.
 */
export function fingerprintDevice(userAgent: string, ip: string): string {
  const ipPrefix = ip.split(".").slice(0, 2).join(".");
  return createHash("sha256")
    .update(`${userAgent}|${ipPrefix}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Records the device usage. If it's a new fingerprint for that user AND
 * the user already has a profile (i.e. not first-time signup), sends a
 * "new sign-in attempt" alert by email.
 */
export async function recordKnownDevice(opts: {
  email: string;
  ip: string;
  userAgent: string;
}): Promise<{ isNewDevice: boolean }> {
  const admin = getSupabaseAdmin();
  if (!admin) return { isNewDevice: false };

  const { data: profile } = await admin
    .from("profiles")
    .select("id, nombre, email")
    .ilike("email", opts.email)
    .maybeSingle();

  if (!profile) return { isNewDevice: false };

  const fingerprint = fingerprintDevice(opts.userAgent, opts.ip);

  const { data: existing } = await admin
    .from("known_devices")
    .select("id")
    .eq("user_id", profile.id)
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  if (existing) {
    await admin
      .from("known_devices")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", existing.id);
    return { isNewDevice: false };
  }

  await admin.from("known_devices").insert({
    user_id: profile.id,
    fingerprint,
    ip: opts.ip,
    user_agent: opts.userAgent,
  });

  // Best-effort alert email
  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: [profile.email],
        subject: "LitienGuard · Acceso desde un nuevo dispositivo",
        html: `
          <div style="font-family: system-ui, sans-serif; color:#2C2B27; max-width:560px;">
            <p style="font-size:.78rem; letter-spacing:.11em; text-transform:uppercase; color:#4A6B5B; margin:0 0 12px 0;">LitienGuard · Seguridad</p>
            <h1 style="font-size:1.3rem; font-weight:600; margin:0 0 10px 0;">Nuevo dispositivo detectado</h1>
            <p style="font-size:.94rem; line-height:1.6; color:#57554F;">
              Acabamos de recibir una solicitud de magic link para tu cuenta desde un dispositivo o ubicación que no habíamos visto antes.
            </p>
            <div style="background:#F4F2EB; border-radius:8px; padding:14px; margin:14px 0; font-size:.86rem;">
              <strong>IP:</strong> ${opts.ip}<br/>
              <strong>Navegador:</strong> ${opts.userAgent.slice(0, 200)}
            </div>
            <p style="font-size:.94rem; line-height:1.6; color:#57554F;">
              Si fuiste tú, ignora este correo. Si no reconoces este intento, contacta al admin de LitienGuard inmediatamente para revocar accesos.
            </p>
          </div>`,
      });
    } catch (e) {
      console.warn("[security] device alert email failed:", e);
    }
  }

  await recordAudit({
    userId: profile.id,
    action: "auth.new_device_detected",
    metadata: { fingerprint, ip_redacted: opts.ip.split(".").slice(0, 2).join(".") + ".*.*" },
    ip: opts.ip,
    userAgent: opts.userAgent,
  });

  return { isNewDevice: true };
}

/**
 * IP-level lockout. Activates when a single IP burns through the magic-
 * link rate limit twice in a row (signals a deliberate attack vs an
 * overworked physician).
 */
export async function checkIpLockout(ip: string): Promise<{
  locked: boolean;
  until?: string;
}> {
  const admin = getSupabaseAdmin();
  if (!admin) return { locked: false };

  const { data } = await admin
    .from("login_lockouts")
    .select("locked_until")
    .eq("ip", ip)
    .gt("locked_until", new Date().toISOString())
    .order("locked_until", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) return { locked: true, until: data.locked_until };
  return { locked: false };
}

export async function escalateLockout(opts: {
  ip: string;
  email?: string;
  reason: string;
  minutes: number;
}): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  const until = new Date(Date.now() + opts.minutes * 60_000).toISOString();
  await admin.from("login_lockouts").insert({
    ip: opts.ip,
    user_email: opts.email ?? null,
    locked_until: until,
    reason: opts.reason,
  });
  await recordAudit({
    action: "security.ip_lockout",
    metadata: { ip: opts.ip, reason: opts.reason, until },
    ip: opts.ip,
  });
}

/**
 * Verifies the caller's subscription tier against the DB at the moment
 * of execution. Used as a redundant gate in front of every paid feature
 * (defense in depth: UI / server action / SQL).
 */
export async function strictTierCheck(
  userId: string,
  allowedTiers: Array<"free" | "pilot" | "pro" | "enterprise">,
): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  const { data } = await admin
    .from("profiles")
    .select("subscription_tier")
    .eq("id", userId)
    .single();
  if (!data) return false;
  return allowedTiers.includes(
    data.subscription_tier as "free" | "pilot" | "pro" | "enterprise",
  );
}
