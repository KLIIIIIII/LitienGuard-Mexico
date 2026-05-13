"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUsePacientes, type SubscriptionTier } from "@/lib/entitlements";
import { getResend, RESEND_FROM } from "@/lib/resend-client";
import {
  buildRecallHtml,
  buildRecallText,
} from "@/lib/email-templates/paciente-recall";
import { recordAudit } from "@/lib/audit";

const pacienteSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(120),
  apellido_paterno: z.string().max(120).optional().or(z.literal("")),
  apellido_materno: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("Correo inválido").max(160).optional().or(z.literal("")),
  telefono: z.string().max(40).optional().or(z.literal("")),
  fecha_nacimiento: z.string().optional().or(z.literal("")),
  sexo: z.enum(["M", "F", "O"]).optional().or(z.literal("")),
  ultima_consulta_at: z.string().optional().or(z.literal("")),
  notas_internas: z.string().max(2000).optional().or(z.literal("")),
  etiquetas: z.string().max(500).optional().or(z.literal("")),
});

export type ActionResult =
  | { status: "ok"; message?: string }
  | { status: "error"; message: string };

async function getMedicoTier(): Promise<{
  userId: string;
  tier: SubscriptionTier;
} | null> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  return {
    userId: user.id,
    tier: (profile?.subscription_tier ?? "free") as SubscriptionTier,
  };
}

function emptyToNull<T extends string | undefined>(v: T): string | null {
  if (!v || v === "") return null;
  return v;
}

export async function crearPaciente(formData: FormData): Promise<ActionResult> {
  const session = await getMedicoTier();
  if (!session) return { status: "error", message: "No autenticado" };
  if (!canUsePacientes(session.tier)) {
    return {
      status: "error",
      message: "Tu plan no incluye el módulo de pacientes. Sube a Esencial.",
    };
  }

  const parsed = pacienteSchema.safeParse({
    nombre: formData.get("nombre"),
    apellido_paterno: formData.get("apellido_paterno") ?? "",
    apellido_materno: formData.get("apellido_materno") ?? "",
    email: formData.get("email") ?? "",
    telefono: formData.get("telefono") ?? "",
    fecha_nacimiento: formData.get("fecha_nacimiento") ?? "",
    sexo: formData.get("sexo") ?? "",
    ultima_consulta_at: formData.get("ultima_consulta_at") ?? "",
    notas_internas: formData.get("notas_internas") ?? "",
    etiquetas: formData.get("etiquetas") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supa = await createSupabaseServer();
  const etiquetas = parsed.data.etiquetas
    ? parsed.data.etiquetas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const { error } = await supa.from("pacientes").insert({
    medico_id: session.userId,
    nombre: parsed.data.nombre.trim(),
    apellido_paterno: emptyToNull(parsed.data.apellido_paterno),
    apellido_materno: emptyToNull(parsed.data.apellido_materno),
    email: emptyToNull(parsed.data.email)?.toLowerCase().trim() ?? null,
    telefono: emptyToNull(parsed.data.telefono),
    fecha_nacimiento: emptyToNull(parsed.data.fecha_nacimiento),
    sexo: emptyToNull(parsed.data.sexo) as "M" | "F" | "O" | null,
    ultima_consulta_at: emptyToNull(parsed.data.ultima_consulta_at),
    notas_internas: emptyToNull(parsed.data.notas_internas),
    etiquetas,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        status: "error",
        message: "Ya tienes un paciente con ese correo",
      };
    }
    console.error("[pacientes/crear] error:", error);
    return { status: "error", message: "No pudimos guardar el paciente" };
  }

  revalidatePath("/dashboard/pacientes");
  return { status: "ok", message: "Paciente agregado" };
}

interface CsvRow {
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  email?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  sexo?: string;
  ultima_consulta_at?: string;
  notas_internas?: string;
  etiquetas?: string;
}

/**
 * Importa filas de CSV ya parseadas (cliente parsea con papaparse,
 * envía objetos validados). Soporta dos formatos comunes de columnas
 * usadas por consultorios: español MX y técnico inglés.
 */
export async function importarPacientesBatch(
  rows: CsvRow[],
): Promise<
  | { status: "ok"; lote_id: string; rows_ok: number; rows_error: number; errors: string[] }
  | { status: "error"; message: string }
> {
  const session = await getMedicoTier();
  if (!session) return { status: "error", message: "No autenticado" };
  if (!canUsePacientes(session.tier)) {
    return {
      status: "error",
      message: "Tu plan no incluye el módulo de pacientes. Sube a Esencial.",
    };
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { status: "error", message: "El archivo está vacío" };
  }
  if (rows.length > 5000) {
    return {
      status: "error",
      message: "Máximo 5,000 filas por archivo. Divide y vuelve a intentar.",
    };
  }

  const supa = await createSupabaseServer();

  // 1) Crear lote para auditoría
  const { data: lote, error: loteErr } = await supa
    .from("pacientes_import_lotes")
    .insert({
      medico_id: session.userId,
      rows_total: rows.length,
      status: "procesando",
    })
    .select("id")
    .single();

  if (loteErr || !lote) {
    console.error("[pacientes/import] lote err:", loteErr);
    return { status: "error", message: "No pudimos iniciar el lote" };
  }

  const errors: string[] = [];
  const inserts: Array<Record<string, unknown>> = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // +1 por header, +1 por base 1
    const nombre = (r.nombre ?? "").trim();
    if (!nombre) {
      errors.push(`Fila ${rowNum}: nombre vacío`);
      continue;
    }
    const email = (r.email ?? "").trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Fila ${rowNum}: correo inválido (${email})`);
      continue;
    }
    const sexo = (r.sexo ?? "").trim().toUpperCase();
    const sexoValido = sexo === "M" || sexo === "F" || sexo === "O"
      ? sexo
      : null;

    inserts.push({
      medico_id: session.userId,
      import_lote_id: lote.id,
      nombre,
      apellido_paterno: (r.apellido_paterno ?? "").trim() || null,
      apellido_materno: (r.apellido_materno ?? "").trim() || null,
      email: email || null,
      telefono: (r.telefono ?? "").trim() || null,
      fecha_nacimiento: (r.fecha_nacimiento ?? "").trim() || null,
      sexo: sexoValido,
      ultima_consulta_at: (r.ultima_consulta_at ?? "").trim() || null,
      notas_internas: (r.notas_internas ?? "").trim() || null,
      etiquetas: (r.etiquetas ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  // 2) Insert masivo (upsert por (medico_id, email) cuando email existe)
  const rowsOkPrev = inserts.length;
  if (inserts.length > 0) {
    const { error: insertErr } = await supa.from("pacientes").upsert(
      inserts,
      {
        onConflict: "medico_id,email",
        ignoreDuplicates: false, // updatea si ya existe
      },
    );
    if (insertErr) {
      console.error("[pacientes/import] insert err:", insertErr);
      errors.push(
        `Error al guardar: ${insertErr.message ?? "desconocido"}`,
      );
    }
  }

  const rowsOk = errors.length > rows.length - rowsOkPrev ? 0 : rowsOkPrev;
  const rowsError = rows.length - rowsOk;

  // 3) Cerrar lote
  await supa
    .from("pacientes_import_lotes")
    .update({
      rows_ok: rowsOk,
      rows_error: rowsError,
      status: rowsError === rows.length ? "fallido" : "completado",
    })
    .eq("id", lote.id);

  revalidatePath("/dashboard/pacientes");
  return {
    status: "ok",
    lote_id: lote.id,
    rows_ok: rowsOk,
    rows_error: rowsError,
    errors: errors.slice(0, 20), // limita output
  };
}

const recallSchema = z.object({
  pacienteId: z.string().uuid(),
  mensajePersonalizado: z.string().max(800).optional().or(z.literal("")),
});

export async function enviarRecallManual(
  formData: FormData,
): Promise<ActionResult> {
  const session = await getMedicoTier();
  if (!session) return { status: "error", message: "No autenticado" };
  if (!canUsePacientes(session.tier)) {
    return {
      status: "error",
      message: "Tu plan no incluye envío de recordatorios. Sube a Esencial.",
    };
  }

  const parsed = recallSchema.safeParse({
    pacienteId: formData.get("pacienteId"),
    mensajePersonalizado: formData.get("mensajePersonalizado") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supa = await createSupabaseServer();
  const { data: paciente, error: pErr } = await supa
    .from("pacientes")
    .select(
      "id, nombre, apellido_paterno, email, ultima_consulta_at, recall_enviado_at",
    )
    .eq("id", parsed.data.pacienteId)
    .eq("medico_id", session.userId)
    .single();

  if (pErr || !paciente) {
    return { status: "error", message: "Paciente no encontrado" };
  }
  if (!paciente.email) {
    return {
      status: "error",
      message: "El paciente no tiene correo registrado",
    };
  }

  // Lock #2: cooldown de 30 días entre recordatorios al mismo paciente.
  // Evita spam accidental (click múltiple) o malicioso del médico.
  if (paciente.recall_enviado_at) {
    const last = new Date(paciente.recall_enviado_at);
    const daysSinceLast = Math.floor(
      (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSinceLast < 30) {
      const remaining = 30 - daysSinceLast;
      return {
        status: "error",
        message: `Enviaste un recordatorio hace ${daysSinceLast} día${daysSinceLast === 1 ? "" : "s"}. Espera ${remaining} día${remaining === 1 ? "" : "s"} más antes del siguiente — para no saturar al paciente.`,
      };
    }
  }

  // Datos del médico para el cuerpo del correo + reply-to configurado
  const { data: medico } = await supa
    .from("profiles")
    .select(
      "nombre, email, especialidad, consultorio_nombre, consultorio_telefono, booking_slug, recall_reply_to_email",
    )
    .eq("id", session.userId)
    .single();

  // Calcular meses sin consulta
  let meses = 0;
  if (paciente.ultima_consulta_at) {
    const last = new Date(paciente.ultima_consulta_at);
    const now = new Date();
    meses = Math.max(
      0,
      Math.floor(
        (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24 * 30),
      ),
    );
  }

  const agendarUrl = medico?.booking_slug
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://litien-guard-mexico.vercel.app"}/agendar/${medico.booking_slug}`
    : null;

  const data = {
    pacienteNombre: [paciente.nombre, paciente.apellido_paterno]
      .filter(Boolean)
      .join(" "),
    medicoNombre: medico?.nombre ?? "Tu médico",
    medicoEspecialidad: medico?.especialidad ?? null,
    consultorioNombre: medico?.consultorio_nombre ?? null,
    consultorioTelefono: medico?.consultorio_telefono ?? null,
    mesesSinConsulta: meses,
    mensajePersonalizado: parsed.data.mensajePersonalizado?.trim() || null,
    agendarUrl,
  };

  const resend = getResend();
  if (!resend) {
    return {
      status: "error",
      message: "Servicio de correo no configurado. Contacta soporte.",
    };
  }

  /*
   * Sender personalizado:
   * - El "from" tecnico mantiene nuestro dominio verificado (DKIM/SPF)
   *   pero usa el nombre del medico para que el paciente identifique
   *   inmediatamente al remitente: "Dra. Pamela Sandoval · LitienGuard"
   * - El "replyTo" prioriza recall_reply_to_email si el medico lo
   *   configuro (ej. contacto@consultorio.mx); si no, usa su email
   *   de login. Asi las respuestas del paciente llegan al buzon
   *   correcto sin necesidad de dominio custom.
   */
  const senderName = medico?.nombre
    ? `${medico.nombre} · LitienGuard`
    : "LitienGuard";
  const fromAddressMatch = /<([^>]+)>/.exec(RESEND_FROM);
  const fromAddress = fromAddressMatch
    ? fromAddressMatch[1]
    : RESEND_FROM;
  const fromWithSenderName = `${senderName} <${fromAddress}>`;

  const replyTo =
    medico?.recall_reply_to_email && medico.recall_reply_to_email.trim()
      ? medico.recall_reply_to_email
      : medico?.email ?? null;

  try {
    await resend.emails.send({
      from: fromWithSenderName,
      to: paciente.email,
      replyTo: replyTo ?? undefined,
      subject: `${data.medicoNombre} te recuerda — cita de seguimiento`,
      html: buildRecallHtml(data),
      text: buildRecallText(data),
    });
  } catch (err) {
    console.error("[pacientes/recall] resend err:", err);
    return {
      status: "error",
      message: "No pudimos enviar el correo. Inténtalo más tarde.",
    };
  }

  // Marcar recall_enviado_at
  await supa
    .from("pacientes")
    .update({ recall_enviado_at: new Date().toISOString() })
    .eq("id", paciente.id);

  void recordAudit({
    userId: session.userId,
    action: "pacientes.recall_enviado",
    metadata: { paciente_id: paciente.id, meses_sin_consulta: meses },
  });

  revalidatePath("/dashboard/pacientes");
  revalidatePath(`/dashboard/pacientes/${paciente.id}`);

  return { status: "ok", message: "Recordatorio enviado" };
}
