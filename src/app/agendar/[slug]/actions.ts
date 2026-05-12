"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { recordAudit } from "@/lib/audit";
import { getResend, RESEND_FROM } from "@/lib/resend-client";

const bookingSchema = z.object({
  paciente_nombre: z.string().trim().min(1, "Nombre requerido").max(120),
  paciente_apellido_paterno: z.string().trim().max(80).optional().or(z.literal("")),
  paciente_apellido_materno: z.string().trim().max(80).optional().or(z.literal("")),
  paciente_email: z.string().trim().email("Correo inválido").max(200),
  paciente_telefono: z.string().trim().min(7, "Teléfono requerido").max(30),
  motivo: z.string().trim().max(500).optional().or(z.literal("")),
  slot_inicio: z.string().datetime({ offset: true }),
  slot_fin: z.string().datetime({ offset: true }),
});

export type PublicBookingInput = z.infer<typeof bookingSchema>;

export type BookingResult =
  | {
      status: "ok";
      citaId: string;
      slot_inicio: string;
      slot_fin: string;
      medico_nombre: string;
    }
  | { status: "error"; message: string };

const ERROR_TRANSLATIONS: Record<string, string> = {
  BOOKING_NOT_FOUND: "El profesional ya no está aceptando reservaciones.",
  BOOKING_DISABLED: "Este profesional pausó las reservaciones en línea.",
  BOOKING_PAST: "El horario seleccionado ya pasó.",
  BOOKING_TOO_FAR: "Solo se puede reservar dentro del rango disponible.",
  BOOKING_BAD_RANGE: "La hora de fin debe ser posterior al inicio.",
  BOOKING_DAY_OFF: "Ese día no está disponible.",
  BOOKING_OUTSIDE_HOURS: "Ese horario está fuera del rango disponible.",
  BOOKING_BAD_SLOT: "Ese horario no corresponde a un slot válido.",
  BOOKING_CONFLICT: "Ese horario ya fue tomado. Selecciona otro.",
};

export async function bookPublicCita(
  bookingSlug: string,
  input: PublicBookingInput,
  turnstileToken?: string | null,
): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const data = parsed.data;

  const hdrs = await headers();
  const ip = extractIp(hdrs);

  const turnstile = await verifyTurnstile(turnstileToken, ip);
  if (!turnstile.ok) {
    return {
      status: "error",
      message: "No pudimos verificar que eres humano. Recarga e inténtalo de nuevo.",
    };
  }

  const rl = await checkRateLimit(ip, "preregistro");
  if (!rl.allowed) {
    return {
      status: "error",
      message: "Demasiadas reservaciones desde tu red. Inténtalo en unos minutos.",
    };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      status: "error",
      message: "Servicio temporalmente no configurado. Inténtalo en unos minutos.",
    };
  }

  // Call SQL function that validates + inserts atomically
  const { data: rpcResult, error } = await admin.rpc("crear_cita_publica", {
    p_booking_slug: bookingSlug,
    p_paciente_nombre: data.paciente_nombre,
    p_paciente_apellido_paterno: data.paciente_apellido_paterno || null,
    p_paciente_apellido_materno: data.paciente_apellido_materno || null,
    p_paciente_email: data.paciente_email.toLowerCase(),
    p_paciente_telefono: data.paciente_telefono,
    p_fecha_inicio: data.slot_inicio,
    p_fecha_fin: data.slot_fin,
    p_motivo: data.motivo || null,
  });

  if (error) {
    const known = ERROR_TRANSLATIONS[error.message] ?? null;
    if (known) {
      return { status: "error", message: known };
    }
    console.error("[booking] rpc error:", error);
    return {
      status: "error",
      message: "No pudimos completar la reservación. Inténtalo de nuevo en un momento.",
    };
  }

  const citaId = (rpcResult as Array<{ cita_id: string }> | null)?.[0]?.cita_id;
  if (!citaId) {
    return {
      status: "error",
      message: "Reservación no confirmada. Inténtalo de nuevo.",
    };
  }

  // Fetch medico info for the confirmation email + audit
  const { data: cita } = await admin
    .from("citas")
    .select("medico_id,fecha_inicio,fecha_fin")
    .eq("id", citaId)
    .single();

  const { data: medico } = cita
    ? await admin
        .from("profiles")
        .select("nombre,email,especialidad,consultorio_nombre,consultorio_direccion,consultorio_telefono")
        .eq("id", cita.medico_id)
        .single()
    : { data: null as null };

  void recordAudit({
    userId: cita?.medico_id ?? null,
    action: "cita.booked_publicly",
    resource: citaId,
    metadata: { paciente_email: data.paciente_email, slot_inicio: data.slot_inicio },
    ip,
    userAgent: hdrs.get("user-agent"),
  });

  // Fire-and-forget confirmation emails
  const resend = getResend();
  if (resend && medico) {
    const fechaStr = new Date(data.slot_inicio).toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const medicoNombre = medico.nombre ?? "Tu médico";

    // To patient
    void resend.emails.send({
      from: RESEND_FROM,
      to: [data.paciente_email],
      subject: `Cita confirmada con ${medicoNombre} — LitienGuard`,
      html: confirmacionPaciente({
        paciente: data.paciente_nombre,
        medicoNombre,
        medicoEspecialidad: medico.especialidad,
        consultorioNombre: medico.consultorio_nombre,
        consultorioDireccion: medico.consultorio_direccion,
        consultorioTelefono: medico.consultorio_telefono,
        fechaStr,
        motivo: data.motivo || null,
      }),
    }).catch((e) => console.error("[booking] confirmation email failed:", e));

    // To medico
    if (medico.email) {
      void resend.emails.send({
        from: RESEND_FROM,
        to: [medico.email],
        replyTo: data.paciente_email,
        subject: `Nueva cita pública: ${data.paciente_nombre} — ${fechaStr}`,
        html: notificacionMedico({
          paciente: data.paciente_nombre,
          pacienteApellido: data.paciente_apellido_paterno || null,
          pacienteEmail: data.paciente_email,
          pacienteTelefono: data.paciente_telefono,
          fechaStr,
          motivo: data.motivo || null,
        }),
      }).catch((e) => console.error("[booking] medico email failed:", e));
    }
  }

  return {
    status: "ok",
    citaId,
    slot_inicio: data.slot_inicio,
    slot_fin: data.slot_fin,
    medico_nombre: medico?.nombre ?? "Tu médico",
  };
}

function esc(s: string | null | undefined): string {
  return (s ?? "—").replace(/[&<>"']/g, (c) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[c] as string,
  );
}

function confirmacionPaciente(p: {
  paciente: string;
  medicoNombre: string;
  medicoEspecialidad: string | null;
  consultorioNombre: string | null;
  consultorioDireccion: string | null;
  consultorioTelefono: string | null;
  fechaStr: string;
  motivo: string | null;
}): string {
  return `
    <div style="font-family: system-ui, sans-serif; color:#2C2B27; max-width:560px;">
      <p style="font-size:.78rem; letter-spacing:.11em; text-transform:uppercase; color:#4A6B5B; margin:0 0 12px 0;">LitienGuard · Cita confirmada</p>
      <h1 style="font-size:1.4rem; font-weight:600; margin:0 0 12px 0;">Tu cita está agendada, ${esc(p.paciente)}.</h1>
      <p style="font-size:.94rem; line-height:1.6; color:#57554F;">
        Te esperamos en la siguiente fecha y hora:
      </p>
      <div style="background:#F4F2EB; border-radius:8px; padding:16px; margin:14px 0; font-size:.95rem;">
        <p style="margin:0 0 6px 0;"><strong>${esc(p.fechaStr)}</strong></p>
        <p style="margin:0 0 6px 0;">Con <strong>${esc(p.medicoNombre)}</strong>${p.medicoEspecialidad ? ` · ${esc(p.medicoEspecialidad)}` : ""}</p>
        ${p.consultorioNombre ? `<p style="margin:0 0 6px 0;">${esc(p.consultorioNombre)}</p>` : ""}
        ${p.consultorioDireccion ? `<p style="margin:0 0 6px 0; color:#57554F;">${esc(p.consultorioDireccion)}</p>` : ""}
        ${p.consultorioTelefono ? `<p style="margin:0; color:#57554F;">Tel. ${esc(p.consultorioTelefono)}</p>` : ""}
      </div>
      ${p.motivo ? `<p style="font-size:.9rem; color:#57554F;"><strong>Motivo:</strong> ${esc(p.motivo)}</p>` : ""}
      <p style="font-size:.86rem; line-height:1.6; color:#57554F; margin-top:18px;">
        Si necesitas reagendar o cancelar, responde este correo o llama al consultorio.
      </p>
      <hr style="border:0; height:1px; background:#E5E2DA; margin:24px 0;">
      <p style="font-size:.78rem; color:#8B887F;">LitienGuard · Inteligencia Médica para México. Esta plataforma no sustituye atención médica de urgencia.</p>
    </div>
  `;
}

function notificacionMedico(p: {
  paciente: string;
  pacienteApellido: string | null;
  pacienteEmail: string;
  pacienteTelefono: string;
  fechaStr: string;
  motivo: string | null;
}): string {
  return `
    <div style="font-family: system-ui, sans-serif; color:#2C2B27; max-width:560px;">
      <p style="font-size:.78rem; letter-spacing:.11em; text-transform:uppercase; color:#4A6B5B; margin:0 0 12px 0;">LitienGuard · Nueva cita reservada</p>
      <h1 style="font-size:1.3rem; font-weight:600; margin:0 0 12px 0;">Nuevo paciente agendado en línea</h1>
      <div style="background:#F4F2EB; border-radius:8px; padding:16px; margin:14px 0; font-size:.95rem;">
        <table style="width:100%; border-collapse:collapse;">
          <tr><td style="padding:4px 0; color:#57554F; width:120px;">Paciente</td><td style="padding:4px 0;"><strong>${esc(p.paciente)} ${esc(p.pacienteApellido)}</strong></td></tr>
          <tr><td style="padding:4px 0; color:#57554F;">Cuándo</td><td style="padding:4px 0;"><strong>${esc(p.fechaStr)}</strong></td></tr>
          <tr><td style="padding:4px 0; color:#57554F;">Correo</td><td style="padding:4px 0;"><a href="mailto:${esc(p.pacienteEmail)}" style="color:#2D3E50;">${esc(p.pacienteEmail)}</a></td></tr>
          <tr><td style="padding:4px 0; color:#57554F;">Teléfono</td><td style="padding:4px 0;">${esc(p.pacienteTelefono)}</td></tr>
          ${p.motivo ? `<tr><td style="padding:4px 0; color:#57554F; vertical-align:top;">Motivo</td><td style="padding:4px 0; white-space:pre-wrap;">${esc(p.motivo)}</td></tr>` : ""}
        </table>
      </div>
      <p style="font-size:.86rem; line-height:1.6; color:#57554F;">
        Verla en tu agenda: <a href="https://litien-guard-mexico.vercel.app/dashboard/agenda" style="color:#4A6B5B;">Dashboard › Agenda</a>
      </p>
      <p style="font-size:.78rem; color:#8B887F; margin-top:18px;">Responde este correo para contactar directamente al paciente.</p>
    </div>
  `;
}
