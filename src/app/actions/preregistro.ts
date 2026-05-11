"use server";

import { headers } from "next/headers";
import { preregistroSchema, type PreregistroInput } from "@/lib/preregistro";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getResend, RESEND_FROM } from "@/lib/resend-client";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";

export type PreregistroState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export async function submitPreregistro(
  input: PreregistroInput,
): Promise<PreregistroState> {
  const parsed = preregistroSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "form");
      if (!fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  const hdrs = await headers();
  const ua = hdrs.get("user-agent") ?? null;
  const ip = extractIp(hdrs);

  const rl = await checkRateLimit(ip, "preregistro");
  if (!rl.allowed) {
    return {
      status: "error",
      message:
        "Demasiadas solicitudes desde tu red. Inténtalo de nuevo en unos minutos.",
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      status: "error",
      message:
        "Servicio temporalmente no configurado. Escríbenos a contacto@litienguard.mx mientras tanto.",
    };
  }

  const { error: insertError } = await supabase.from("preregistros").insert({
    email: data.email.toLowerCase().trim(),
    tipo: data.tipo,
    nombre: data.nombre || null,
    mensaje: data.mensaje || null,
    utm_source: data.utm_source || null,
    utm_medium: data.utm_medium || null,
    utm_campaign: data.utm_campaign || null,
    ip,
    user_agent: ua,
  });

  if (insertError) {
    console.error("[preregistro] insert error:", insertError);
    return {
      status: "error",
      message:
        "No pudimos guardar tu solicitud. Inténtalo de nuevo en un momento.",
    };
  }

  // Emails (best-effort, do not block ok response)
  const resend = getResend();
  if (resend) {
    // 1) Confirmation to the requester
    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: [data.email],
        subject: "Recibimos tu solicitud — LitienGuard",
        html: `
          <div style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #2C2B27; max-width: 560px;">
            <p style="font-size: 0.9rem; letter-spacing: 0.11em; text-transform: uppercase; color: #4A6B5B; margin: 0 0 12px 0;">LitienGuard</p>
            <h1 style="font-size: 1.4rem; font-weight: 600; margin: 0 0 16px 0; line-height: 1.25;">Recibimos tu solicitud.</h1>
            <p style="font-size: 0.94rem; line-height: 1.6; color: #57554F;">Gracias por interesarte en LitienGuard. Vamos a revisar tu solicitud y te contactamos en menos de 48 horas.</p>
            <p style="font-size: 0.94rem; line-height: 1.6; color: #57554F;">Mientras tanto, si tienes alguna pregunta urgente puedes responder este correo.</p>
            <hr style="border: 0; height: 1px; background: #E5E2DA; margin: 24px 0;">
            <p style="font-size: 0.78rem; color: #8B887F;">LitienGuard — Inteligencia Médica para México. Esta plataforma no sustituye atención médica profesional.</p>
          </div>
        `,
      });
    } catch (e) {
      console.error("[preregistro] resend (user) error:", e);
    }

    // 2) Admin notification
    const adminEmail =
      process.env.ADMIN_NOTIFY_EMAIL ?? "contacto@litienguard.mx";
    const esc = (s: string | null | undefined): string =>
      (s ?? "—").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c] as string,
      );
    const tipoLabel: Record<string, string> = {
      medico: "Médico",
      paciente: "Paciente",
      hospital: "Hospital",
      otro: "Otro",
    };
    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: [adminEmail],
        replyTo: data.email,
        subject: `Nueva solicitud piloto: ${tipoLabel[data.tipo] ?? data.tipo} — ${data.email}`,
        html: `
          <div style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #2C2B27; max-width: 600px;">
            <p style="font-size: 0.78rem; letter-spacing: 0.11em; text-transform: uppercase; color: #4A6B5B; margin: 0 0 12px 0;">LitienGuard · Admin</p>
            <h1 style="font-size: 1.3rem; font-weight: 600; margin: 0 0 20px 0; line-height: 1.25;">Nueva solicitud de pre-registro</h1>
            <div style="background: #F4F2EB; border-radius: 8px; padding: 18px 20px; margin: 0 0 18px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.92rem;">
                <tr><td style="padding: 6px 0; color: #57554F; width: 130px;">Tipo</td><td style="padding: 6px 0;"><strong>${esc(tipoLabel[data.tipo] ?? data.tipo)}</strong></td></tr>
                <tr><td style="padding: 6px 0; color: #57554F;">Correo</td><td style="padding: 6px 0;"><a href="mailto:${esc(data.email)}" style="color: #2D3E50;">${esc(data.email)}</a></td></tr>
                <tr><td style="padding: 6px 0; color: #57554F;">Nombre</td><td style="padding: 6px 0;">${esc(data.nombre)}</td></tr>
                <tr><td style="padding: 6px 0; color: #57554F; vertical-align: top;">Mensaje</td><td style="padding: 6px 0; white-space: pre-wrap;">${esc(data.mensaje)}</td></tr>
              </table>
            </div>
            <p style="font-size: 0.82rem; color: #8B887F; margin: 0 0 4px 0;"><strong>UTM:</strong> ${esc(data.utm_source)} / ${esc(data.utm_medium)} / ${esc(data.utm_campaign)}</p>
            <p style="font-size: 0.82rem; color: #8B887F; margin: 0 0 4px 0;"><strong>IP:</strong> ${esc(ip)}</p>
            <p style="font-size: 0.82rem; color: #8B887F; margin: 0 0 4px 0;"><strong>User-agent:</strong> ${esc(ua)}</p>
            <hr style="border: 0; height: 1px; background: #E5E2DA; margin: 20px 0;">
            <p style="font-size: 0.78rem; color: #8B887F;">Responde este correo para contestar directamente al solicitante. El registro completo está en Supabase, tabla <code>preregistros</code>.</p>
          </div>
        `,
      });
    } catch (e) {
      console.error("[preregistro] resend (admin) error:", e);
    }
  }

  return {
    status: "ok",
    message:
      "¡Listo! Recibimos tu solicitud. Te contactamos en menos de 48 horas.",
  };
}
