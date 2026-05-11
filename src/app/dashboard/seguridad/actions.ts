"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

export type EnrollResult =
  | { status: "ok"; factorId: string; qr: string; secret: string }
  | { status: "error"; message: string };

export type VerifyResult =
  | { status: "ok" }
  | { status: "error"; message: string };

export type DisableResult =
  | { status: "ok" }
  | { status: "error"; message: string };

/**
 * Begin TOTP enrollment. Returns a QR code (data URI) and the raw secret so
 * the doctor can scan with Google Authenticator / Authy / 1Password. The
 * factor stays "unverified" until the user submits a valid 6-digit code.
 */
export async function enrollMfa(): Promise<EnrollResult> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "Sesión no encontrada." };

  // Clean up any half-enrolled (unverified) factors so we don't accumulate.
  // `listFactors().all` includes both verified + unverified.
  const { data: existing } = await supa.auth.mfa.listFactors();
  for (const f of existing?.all ?? []) {
    if (f.factor_type === "totp" && f.status !== "verified") {
      await supa.auth.mfa.unenroll({ factorId: f.id });
    }
  }

  const { data, error } = await supa.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `LitienGuard · ${new Date().toLocaleDateString("es-MX")}`,
  });
  if (error || !data) {
    return {
      status: "error",
      message: error?.message ?? "No pudimos iniciar el enrolamiento.",
    };
  }
  return {
    status: "ok",
    factorId: data.id,
    qr: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

/**
 * Verify the 6-digit TOTP code against the enrolling factor. On success the
 * factor goes from "unverified" to "verified" and AAL2 is required on
 * subsequent sign-ins.
 */
export async function verifyMfa(
  factorId: string,
  code: string,
): Promise<VerifyResult> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "Sesión no encontrada." };

  const trimmed = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(trimmed)) {
    return { status: "error", message: "El código debe tener 6 dígitos." };
  }

  const { error } = await supa.auth.mfa.challengeAndVerify({
    factorId,
    code: trimmed,
  });
  if (error) {
    return {
      status: "error",
      message:
        error.message === "Invalid TOTP code"
          ? "Código incorrecto. Verifica el reloj de tu dispositivo e inténtalo de nuevo."
          : error.message,
    };
  }

  void recordAudit({
    userId: user.id,
    action: "auth.mfa_enabled",
    metadata: { factor_type: "totp", factor_id: factorId },
  });

  return { status: "ok" };
}

/**
 * Disable (unenroll) a verified factor. The user must already be in an AAL2
 * session — i.e., they just authenticated with the factor — otherwise
 * Supabase rejects unenroll.
 */
export async function disableMfa(factorId: string): Promise<DisableResult> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "Sesión no encontrada." };

  const { error } = await supa.auth.mfa.unenroll({ factorId });
  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  void recordAudit({
    userId: user.id,
    action: "auth.mfa_disabled",
    metadata: { factor_id: factorId },
  });

  return { status: "ok" };
}
