"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { recordAudit } from "@/lib/audit";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";
import { getResend, RESEND_FROM } from "@/lib/resend-client";

export type CancelResult =
  | { status: "ok" }
  | { status: "error"; message: string };

export async function cancelByToken(
  token: string,
  motivo: string,
): Promise<CancelResult> {
  if (!/^[a-f0-9]{32}$/i.test(token)) {
    return { status: "error", message: "Link de cancelación inválido." };
  }

  const trimmedMotivo = motivo.trim();
  if (trimmedMotivo.length < 3) {
    return {
      status: "error",
      message: "Cuéntanos brevemente el motivo (mínimo 3 caracteres).",
    };
  }

  const hdrs = await headers();
  const ip = extractIp(hdrs);

  const rl = await checkRateLimit(ip, "preregistro");
  if (!rl.allowed) {
    return {
      status: "error",
      message: "Demasiados intentos desde tu red. Espera unos minutos.",
    };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      status: "error",
      message: "Servicio temporalmente no configurado.",
    };
  }

  // Atomic update: only flip to 'cancelada' if currently agendada/confirmada
  const { data: updated, error } = await admin
    .from("citas")
    .update({
      status: "cancelada",
      motivo_cancelacion: `Cancelada por el paciente · ${trimmedMotivo}`,
    })
    .eq("patient_token", token)
    .in("status", ["agendada", "confirmada"])
    .select(
      `id, medico_id, paciente_email, paciente_nombre, fecha_inicio,
       profiles!citas_medico_id_fkey ( email, nombre )`,
    )
    .maybeSingle();

  if (error) {
    console.error("[cita/cancelar] update error:", error);
    return {
      status: "error",
      message: "No pudimos cancelar la cita. Inténtalo en unos minutos.",
    };
  }
  if (!updated) {
    return {
      status: "error",
      message: "Esta cita ya fue cancelada o ya no está disponible.",
    };
  }

  void recordAudit({
    userId: updated.medico_id,
    action: "cita.cancelled_by_patient",
    resource: updated.id,
    metadata: { motivo: trimmedMotivo },
    ip,
    userAgent: hdrs.get("user-agent"),
  });

  // Notify the doctor — best effort
  const medicoArr = (updated.profiles ?? []) as unknown as Array<{
    email: string | null;
    nombre: string | null;
  }>;
  const medico = Array.isArray(medicoArr) ? medicoArr[0] : medicoArr;
  if (!medico) {
    return { status: "ok" };
  }
  const resend = getResend();
  if (resend && medico.email) {
    const startMx = new Date(updated.fecha_inicio).toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    void resend.emails
      .send({
        from: RESEND_FROM,
        to: [medico.email],
        replyTo: updated.paciente_email ?? undefined,
        subject: `Cita cancelada por el paciente · ${startMx}`,
        html: `
          <div style="font-family:system-ui,sans-serif;color:#1F1E1B;max-width:540px;">
            <p style="font-size:.78rem;letter-spacing:.11em;text-transform:uppercase;color:#4A6B5B;margin:0 0 12px 0;">LitienGuard · Cancelación</p>
            <h1 style="font-size:1.25rem;font-weight:600;margin:0 0 12px 0;">Un paciente canceló su cita</h1>
            <p style="font-size:.94rem;line-height:1.6;color:#57554F;">
              <strong>${updated.paciente_nombre}</strong> canceló su cita programada para <strong>${startMx}</strong> a través del link incluido en su correo de recordatorio.
            </p>
            <div style="background:#F4F2EB;border-radius:8px;padding:14px;margin:14px 0;font-size:.9rem;">
              <p style="margin:0;color:#57554F;">Motivo:</p>
              <p style="margin:4px 0 0 0;font-weight:600;">${trimmedMotivo.replace(/[<>&]/g, "")}</p>
            </div>
            <p style="font-size:.86rem;color:#57554F;">El horario queda nuevamente disponible en tu agenda.</p>
          </div>
        `,
      })
      .catch((e) => console.error("[cita/cancelar] medico email error:", e));
  }

  revalidatePath(`/cita/cancelar/${token}`);
  return { status: "ok" };
}
