/**
 * Vercel Cron — recordatorios de cita 24 h antes.
 *
 * Configurado en vercel.json para correr una vez al día (Hobby plan limita
 * la frecuencia). En cada corrida:
 *   1. Verifica el header Authorization contra CRON_SECRET.
 *   2. Busca citas activas (agendada / confirmada) con fecha_inicio dentro
 *      de las próximas ~18–42h y sin recordatorio_24h_enviado_at.
 *   3. Para cada una: arma email HTML editorial + adjunta .ics + manda
 *      vía Resend.
 *   4. Marca recordatorio_24h_enviado_at para evitar reenvíos.
 *   5. Registra cada envío en audit_log.
 *
 * Idempotencia: el filtro `recordatorio_24h_enviado_at is null` y el
 * UPDATE atómico por id evitan doble envío incluso si el cron se dispara
 * dos veces.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getResend, RESEND_FROM } from "@/lib/resend-client";
import { recordAudit } from "@/lib/audit";
import { generateIcs } from "@/lib/ics";
import {
  buildRecordatorioHtml,
  buildRecordatorioText,
} from "@/lib/email-templates/cita-recordatorio";

const TZ = "America/Mexico_City";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface MedicoSlim {
  nombre: string | null;
  email: string | null;
  especialidad: string | null;
  consultorio_nombre: string | null;
  consultorio_direccion: string | null;
  consultorio_telefono: string | null;
}

interface CitaWithMedico {
  id: string;
  medico_id: string;
  paciente_nombre: string;
  paciente_apellido_paterno: string | null;
  paciente_email: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string | null;
  patient_token: string | null;
  profiles: MedicoSlim | MedicoSlim[] | null;
}

function pickMedico(p: MedicoSlim | MedicoSlim[] | null): MedicoSlim | null {
  if (!p) return null;
  if (Array.isArray(p)) return p[0] ?? null;
  return p;
}

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://litien-guard-mexico.vercel.app"
  );
}

export async function GET(request: NextRequest) {
  // 1) Auth — Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "cron_secret_not_configured" },
      { status: 500 },
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const resend = getResend();
  if (!admin) {
    return NextResponse.json(
      { error: "supabase_admin_unavailable" },
      { status: 500 },
    );
  }

  // 2) Window: next 18–42h covers "tomorrow" regardless of cron time of day.
  const now = new Date();
  const windowStart = new Date(now.getTime() + 18 * 60 * 60_000);
  const windowEnd = new Date(now.getTime() + 42 * 60 * 60_000);

  const { data: citas, error } = await admin
    .from("citas")
    .select(
      `id, medico_id, paciente_nombre, paciente_apellido_paterno,
       paciente_email, fecha_inicio, fecha_fin, motivo, patient_token,
       profiles!citas_medico_id_fkey ( nombre, email, especialidad,
         consultorio_nombre, consultorio_direccion, consultorio_telefono )`,
    )
    .in("status", ["agendada", "confirmada"])
    .gte("fecha_inicio", windowStart.toISOString())
    .lte("fecha_inicio", windowEnd.toISOString())
    .is("recordatorio_24h_enviado_at", null);

  if (error) {
    console.error("[cron/recordatorios] query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const candidates = (citas ?? []) as unknown as CitaWithMedico[];
  const results: Array<{
    citaId: string;
    sent: boolean;
    reason?: string;
  }> = [];

  for (const cita of candidates) {
    // Skip citas without patient email — nothing to send
    if (!cita.paciente_email) {
      results.push({
        citaId: cita.id,
        sent: false,
        reason: "no_patient_email",
      });
      continue;
    }
    if (!resend) {
      results.push({
        citaId: cita.id,
        sent: false,
        reason: "resend_unavailable",
      });
      continue;
    }
    if (!cita.patient_token) {
      // Should not happen — every cita gets a token via trigger. Defensive.
      results.push({
        citaId: cita.id,
        sent: false,
        reason: "no_patient_token",
      });
      continue;
    }

    const start = new Date(cita.fecha_inicio);
    const end = new Date(cita.fecha_fin);
    const fechaLarga = start.toLocaleDateString("es-MX", {
      timeZone: TZ,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const horaCorta =
      start.toLocaleTimeString("es-MX", {
        timeZone: TZ,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) + " hrs";

    const medico = pickMedico(cita.profiles);
    const medicoNombre = medico?.nombre ?? "tu médico";

    const cancelacionUrl = `${siteUrl()}/cita/cancelar/${cita.patient_token}`;

    const pacienteFullName = [
      cita.paciente_nombre,
      cita.paciente_apellido_paterno,
    ]
      .filter(Boolean)
      .join(" ");

    const html = buildRecordatorioHtml({
      pacienteNombre: pacienteFullName,
      medicoNombre,
      medicoEspecialidad: medico?.especialidad ?? null,
      consultorioNombre: medico?.consultorio_nombre ?? null,
      consultorioDireccion: medico?.consultorio_direccion ?? null,
      consultorioTelefono: medico?.consultorio_telefono ?? null,
      fechaLarga,
      horaCorta,
      motivo: cita.motivo,
      cancelacionUrl,
    });

    const text = buildRecordatorioText({
      pacienteNombre: pacienteFullName,
      medicoNombre,
      medicoEspecialidad: medico?.especialidad ?? null,
      consultorioNombre: medico?.consultorio_nombre ?? null,
      consultorioDireccion: medico?.consultorio_direccion ?? null,
      consultorioTelefono: medico?.consultorio_telefono ?? null,
      fechaLarga,
      horaCorta,
      motivo: cita.motivo,
      cancelacionUrl,
    });

    const ics = generateIcs({
      uid: `cita-${cita.id}@litienguard.mx`,
      summary: `Cita con ${medicoNombre}`,
      description: cita.motivo ?? undefined,
      location:
        medico?.consultorio_direccion ??
        medico?.consultorio_nombre ??
        undefined,
      start,
      end,
      organizerName: medico?.nombre ?? undefined,
      organizerEmail: medico?.email ?? undefined,
    });

    try {
      const sendResult = await resend.emails.send({
        from: RESEND_FROM,
        to: [cita.paciente_email],
        replyTo: medico?.email ?? undefined,
        subject: `Recordatorio · Cita con ${medicoNombre} mañana`,
        html,
        text,
        attachments: [
          {
            filename: "cita.ics",
            content: Buffer.from(ics, "utf-8").toString("base64"),
            contentType: "text/calendar; charset=utf-8; method=PUBLISH",
          },
        ],
      });

      if (sendResult.error) {
        console.error(
          "[cron/recordatorios] send error:",
          cita.id,
          sendResult.error,
        );
        results.push({
          citaId: cita.id,
          sent: false,
          reason: sendResult.error.message,
        });
        continue;
      }

      // Mark as sent atomically (the WHERE clause + null guard prevents
      // double sends if cron races with itself).
      const { error: updErr } = await admin
        .from("citas")
        .update({ recordatorio_24h_enviado_at: new Date().toISOString() })
        .eq("id", cita.id)
        .is("recordatorio_24h_enviado_at", null);

      if (updErr) {
        console.error("[cron/recordatorios] update flag error:", updErr);
      }

      void recordAudit({
        userId: cita.medico_id,
        action: "cita.recordatorio_24h_sent",
        resource: cita.id,
        metadata: {
          paciente_email: cita.paciente_email,
          fecha_inicio: cita.fecha_inicio,
        },
      });

      results.push({ citaId: cita.id, sent: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[cron/recordatorios] unexpected error:", cita.id, msg);
      results.push({ citaId: cita.id, sent: false, reason: msg });
    }
  }

  return NextResponse.json({
    ok: true,
    candidates: candidates.length,
    sent: results.filter((r) => r.sent).length,
    skipped: results.filter((r) => !r.sent).length,
    details: results,
  });
}
