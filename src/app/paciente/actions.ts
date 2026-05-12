"use server";

import { headers } from "next/headers";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { getResend, RESEND_FROM } from "@/lib/resend-client";
import { recordAudit } from "@/lib/audit";
import {
  buildPacienteMagicLinkHtml,
  buildPacienteMagicLinkText,
} from "@/lib/email-templates/paciente-magic-link";

const TOKEN_TTL_HOURS = 24;

const requestSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(200),
});

export type RequestAccessResult =
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://litien-guard-mexico.vercel.app"
  );
}

/**
 * Solicita acceso al expediente. Verifica que el correo esté asociado a
 * al menos una cita o receta antes de enviar el magic link — evita que
 * cualquiera dispare correos a direcciones arbitrarias.
 *
 * Por privacidad, la respuesta es genérica aunque el correo no exista:
 * "Si tienes información registrada con nosotros, te enviamos un correo."
 * Esto previene enumeración de pacientes.
 */
export async function requestExpedienteAccess(
  rawEmail: string,
  turnstileToken?: string | null,
): Promise<RequestAccessResult> {
  const parsed = requestSchema.safeParse({ email: rawEmail });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Correo inválido.",
    };
  }
  const email = parsed.data.email.toLowerCase().trim();

  const hdrs = await headers();
  const ip = extractIp(hdrs);
  const userAgent = hdrs.get("user-agent");

  const turnstile = await verifyTurnstile(turnstileToken, ip);
  if (!turnstile.ok) {
    return {
      status: "error",
      message:
        "No pudimos verificar que eres humano. Recarga e inténtalo de nuevo.",
    };
  }

  const rl = await checkRateLimit(ip, "preregistro");
  if (!rl.allowed) {
    return {
      status: "error",
      message:
        "Demasiados intentos desde tu red. Espera unos minutos antes de volver a pedir acceso.",
    };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      status: "error",
      message: "Servicio temporalmente no configurado.",
    };
  }

  // Check if the email has any associated record (cita or receta)
  const [{ count: citasCount }, { count: recetasCount }] = await Promise.all([
    admin
      .from("citas")
      .select("id", { count: "exact", head: true })
      .ilike("paciente_email", email),
    admin
      .from("recetas")
      .select("id", { count: "exact", head: true })
      .ilike("paciente_email", email),
  ]);

  const hasRecords = (citasCount ?? 0) > 0 || (recetasCount ?? 0) > 0;

  // ALWAYS return the same generic success message to prevent enumeration.
  // Only actually send the email if there are matching records.
  const genericMessage =
    "Si tienes información clínica registrada con nosotros, te enviamos un correo con el enlace de acceso.";

  if (!hasRecords) {
    void recordAudit({
      action: "paciente.magic_link_requested_no_records",
      metadata: { email },
      ip,
      userAgent,
    });
    return { status: "ok", message: genericMessage };
  }

  // Generate cryptographic token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + TOKEN_TTL_HOURS * 60 * 60_000,
  ).toISOString();

  const { error: insertErr } = await admin
    .from("paciente_magic_tokens")
    .insert({
      token,
      email,
      expires_at: expiresAt,
      ip,
      user_agent: userAgent,
    });

  if (insertErr) {
    console.error("[paciente] token insert error:", insertErr);
    return {
      status: "error",
      message: "No pudimos generar el enlace. Inténtalo en unos minutos.",
    };
  }

  const resend = getResend();
  const accessUrl = `${siteUrl()}/paciente/expediente/${token}`;

  if (resend) {
    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: [email],
        subject: "Acceso a tu expediente · LitienGuard",
        html: buildPacienteMagicLinkHtml({
          accessUrl,
          expiraEnHoras: TOKEN_TTL_HOURS,
        }),
        text: buildPacienteMagicLinkText({
          accessUrl,
          expiraEnHoras: TOKEN_TTL_HOURS,
        }),
      });
    } catch (e) {
      console.error("[paciente] send error:", e);
      // We don't surface this — the user shouldn't know whether the email
      // succeeded if it would reveal whether the address exists.
    }
  }

  void recordAudit({
    action: "paciente.magic_link_sent",
    metadata: { email },
    ip,
    userAgent,
  });

  return { status: "ok", message: genericMessage };
}

/**
 * Marca un token como usado tras la primera vista del expediente.
 * Esta función la llama el server component de expediente.
 */
export async function consumeTokenIfPending(token: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  await admin
    .from("paciente_magic_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token)
    .is("used_at", null);
}
