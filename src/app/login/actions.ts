"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/audit";
import { checkIpLockout, recordKnownDevice } from "@/lib/security";
import { verifyTurnstile } from "@/lib/turnstile";

const emailSchema = z.string().email("Correo inválido");
const otpSchema = z.string().regex(/^\d{6}$/, "El código debe ser de 6 dígitos");

export type LoginState =
  | { status: "idle" }
  | { status: "ok"; message: string; email: string }
  | { status: "error"; message: string };

export type VerifyState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error"; message: string }
  | { status: "mfa_required" };

export async function requestMagicLink(
  email: string,
  turnstileToken?: string | null,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }
  const normalized = parsed.data.toLowerCase().trim();

  const hdrs = await headers();
  const ip = extractIp(hdrs);

  const turnstile = await verifyTurnstile(turnstileToken, ip);
  if (!turnstile.ok) {
    return {
      status: "error",
      message:
        "No pudimos verificar que eres humano. Recarga la página e inténtalo de nuevo.",
    };
  }

  const lockout = await checkIpLockout(ip);
  if (lockout.locked) {
    return {
      status: "error",
      message:
        "Tu IP está temporalmente bloqueada por demasiados intentos. Inténtalo más tarde.",
    };
  }

  const rl = await checkRateLimit(ip, "login");
  if (!rl.allowed) {
    return {
      status: "error",
      message:
        "Demasiados intentos. Espera unos minutos antes de volver a pedir un magic link.",
    };
  }

  const supaAdmin = getSupabaseAdmin();
  if (!supaAdmin) {
    return {
      status: "error",
      message:
        "Servicio temporalmente no configurado. Inténtalo en unos minutos.",
    };
  }

  // Whitelist check: invitación pendiente o profile existente
  const [{ data: invite }, { data: profile }] = await Promise.all([
    supaAdmin
      .from("invitaciones")
      .select("email,usada,expires_at")
      .ilike("email", normalized)
      .maybeSingle(),
    supaAdmin
      .from("profiles")
      .select("email")
      .ilike("email", normalized)
      .maybeSingle(),
  ]);

  const inviteValid =
    invite &&
    !invite.usada &&
    (!invite.expires_at || new Date(invite.expires_at) > new Date());

  if (!profile && !inviteValid) {
    return {
      status: "error",
      message:
        "Tu correo no está en la lista de acceso al piloto. Solicítalo desde el formulario público.",
    };
  }

  const supa = await createSupabaseServer();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://litienguard-mexico.vercel.app";

  const { error } = await supa.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("[login] signInWithOtp error:", error);
    return {
      status: "error",
      message: `No pudimos enviar el correo (${error.message}). Inténtalo de nuevo.`,
    };
  }

  void recordAudit({
    action: "login.magic_link_requested",
    resource: normalized,
    ip,
    userAgent: hdrs.get("user-agent"),
  });

  // Best-effort known-device detection + alert email (non-blocking)
  void recordKnownDevice({
    email: normalized,
    ip,
    userAgent: hdrs.get("user-agent") ?? "",
  });

  return {
    status: "ok",
    email: normalized,
    message:
      "Revisa tu correo. Te enviamos un código de 6 dígitos y un magic link.",
  };
}

export async function verifyOtpCode(
  email: string,
  token: string,
): Promise<VerifyState> {
  const emailParsed = emailSchema.safeParse(email);
  if (!emailParsed.success) {
    return { status: "error", message: "Correo inválido" };
  }
  const tokenParsed = otpSchema.safeParse(token.trim().replace(/\s+/g, ""));
  if (!tokenParsed.success) {
    return {
      status: "error",
      message: tokenParsed.error.issues[0]?.message ?? "Código inválido",
    };
  }

  const hdrs = await headers();
  const ip = extractIp(hdrs);

  const lockout = await checkIpLockout(ip);
  if (lockout.locked) {
    return {
      status: "error",
      message: "Tu IP está temporalmente bloqueada. Inténtalo más tarde.",
    };
  }

  const rl = await checkRateLimit(ip, "login");
  if (!rl.allowed) {
    return {
      status: "error",
      message: "Demasiados intentos. Espera unos minutos.",
    };
  }

  const supa = await createSupabaseServer();
  const { error } = await supa.auth.verifyOtp({
    email: emailParsed.data.toLowerCase().trim(),
    token: tokenParsed.data,
    type: "email",
  });

  if (error) {
    console.error("[login] verifyOtp error:", error);
    void recordAudit({
      action: "login.otp_failed",
      resource: emailParsed.data.toLowerCase().trim(),
      ip,
      metadata: { reason: error.message },
    });

    if (/expired/i.test(error.message)) {
      return {
        status: "error",
        message: "El código expiró. Pide uno nuevo.",
      };
    }
    if (/invalid|otp/i.test(error.message)) {
      return {
        status: "error",
        message: "Código incorrecto. Revisa y vuelve a intentar.",
      };
    }
    return {
      status: "error",
      message: "No pudimos verificar el código. Inténtalo de nuevo.",
    };
  }

  // Check MFA requirement
  try {
    const { data: aal } =
      await supa.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      void recordAudit({
        action: "login.otp_verified_mfa_pending",
        resource: emailParsed.data.toLowerCase().trim(),
        ip,
      });
      return { status: "mfa_required" };
    }
  } catch (e) {
    console.warn("[login] AAL check failed:", e);
  }

  void recordAudit({
    action: "login.otp_verified",
    resource: emailParsed.data.toLowerCase().trim(),
    ip,
    userAgent: hdrs.get("user-agent"),
  });

  return { status: "ok" };
}

export async function signOut(): Promise<void> {
  const supa = await createSupabaseServer();
  const { data: { user } } = await supa.auth.getUser();
  await supa.auth.signOut();
  if (user) {
    void recordAudit({ userId: user.id, action: "auth.signed_out" });
  }
  revalidatePath("/", "layout");
  redirect("/");
}
