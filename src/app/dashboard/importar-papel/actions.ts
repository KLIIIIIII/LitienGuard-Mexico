"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";
import { canUseScribe, type SubscriptionTier } from "@/lib/entitlements";
import {
  extractFromImage,
  type DocumentoTipo,
  type ExtractFromImageResult,
  type AgendaExtraction,
  type RecetaExtraction,
  type PacienteExtraction,
} from "@/lib/extract-from-image";
const extractSchema = z.object({
  imageBase64: z.string().min(40),
  tipo: z.enum(["agenda", "receta", "paciente", "consulta"]),
});

export type ExtractActionResult =
  | { status: "ok"; result: ExtractFromImageResult }
  | { status: "error"; message: string };

/**
 * Recibe imagen base64 + tipo de documento. Devuelve extracción
 * estructurada al cliente para que el médico revise/edite antes de
 * persistir. NO almacena la imagen original.
 */
export async function extractImage(
  imageBase64: string,
  tipo: DocumentoTipo,
): Promise<ExtractActionResult> {
  const parsed = extractSchema.safeParse({ imageBase64, tipo });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const hdrs = await headers();
  const ip = extractIp(hdrs);
  const rl = await checkRateLimit(ip, "import_image", user.id);
  if (!rl.allowed) {
    return {
      status: "error",
      message:
        "Has alcanzado el límite de imágenes por hora. Intenta en unos minutos.",
    };
  }

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseScribe(tier)) {
    return {
      status: "error",
      message:
        "La importación desde imágenes requiere plan Esencial o superior.",
    };
  }

  try {
    const result = await extractFromImage(parsed.data.imageBase64, parsed.data.tipo);

    void recordAudit({
      userId: user.id,
      action: "import.image_extracted",
      metadata: {
        tipo: parsed.data.tipo,
        status: result.status,
        latency_ms: result.latencyMs,
        items: itemCount(result),
      },
    });

    return { status: "ok", result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido.";
    return { status: "error", message };
  }
}

function itemCount(r: ExtractFromImageResult): number {
  if (r.status !== "ok" || !r.data) return 0;
  if (r.tipo === "agenda") return (r.data as AgendaExtraction).citas.length;
  if (r.tipo === "receta")
    return (r.data as RecetaExtraction).medicamentos.length;
  return 1;
}

// =================================================================
// Persistencia post-edición — el médico revisa, ajusta y guarda
// =================================================================

const guardarAgendaSchema = z.object({
  citas: z.array(
    z.object({
      paciente_nombre: z.string().min(1).max(120),
      fecha: z.string().nullable(),
      hora: z.string().nullable(),
      motivo: z.string().nullable(),
      telefono: z.string().nullable(),
      notas: z.string().nullable(),
    }),
  ),
});

export type GuardarResult =
  | { status: "ok"; inserted: number }
  | { status: "error"; message: string };

/**
 * Guarda citas extraídas de agenda como entradas en el padrón de
 * pacientes (si no existen) + citas pendientes. Best-effort:
 * si una cita falla, las demás siguen.
 */
export async function guardarAgenda(
  citas: z.infer<typeof guardarAgendaSchema>["citas"],
): Promise<GuardarResult> {
  const parsed = guardarAgendaSchema.safeParse({ citas });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  let inserted = 0;
  for (const cita of parsed.data.citas) {
    try {
      // Construir fecha_inicio si tenemos fecha + hora. Si no hay fecha,
      // saltamos esta cita (la tabla citas requiere fecha_inicio).
      if (!cita.fecha) continue;
      const inicio = cita.hora
        ? new Date(`${cita.fecha}T${cita.hora}:00`)
        : new Date(`${cita.fecha}T09:00:00`);
      if (Number.isNaN(inicio.getTime())) continue;
      // duración default 30 min — el médico puede ajustar después
      const fin = new Date(inicio.getTime() + 30 * 60 * 1000);

      // Separar nombre en primer-nombre / apellido si tiene espacio.
      const partes = cita.paciente_nombre.trim().split(/\s+/);
      const nombre = partes[0] ?? cita.paciente_nombre;
      const apPaterno = partes.length > 1 ? partes.slice(1).join(" ") : null;

      const { error } = await supa.from("citas").insert({
        medico_id: user.id,
        paciente_nombre: nombre,
        paciente_apellido_paterno: apPaterno,
        paciente_telefono: cita.telefono ?? null,
        motivo: cita.motivo ?? null,
        notas_internas: cita.notas ?? null,
        fecha_inicio: inicio.toISOString(),
        fecha_fin: fin.toISOString(),
        status: "agendada",
      });
      if (!error) inserted++;
    } catch (e) {
      console.warn("[guardar-agenda] cita falló:", e);
    }
  }

  void recordAudit({
    userId: user.id,
    action: "import.agenda_saved",
    metadata: { total: citas.length, inserted },
  });

  revalidatePath("/dashboard/agenda");
  return { status: "ok", inserted };
}

const guardarPacienteSchema = z.object({
  nombre: z.string().min(1).max(60),
  apellido_paterno: z.string().max(60).nullable(),
  apellido_materno: z.string().max(60).nullable(),
  fecha_nacimiento: z.string().nullable(),
  edad: z.number().int().nullable(),
  sexo: z.enum(["M", "F", "O"]).nullable(),
  telefono: z.string().max(20).nullable(),
  email: z.string().email().nullable().or(z.literal("").transform(() => null)),
  alergias: z.array(z.string()).default([]),
  antecedentes: z.array(z.string()).default([]),
  medicamentos_actuales: z.array(z.string()).default([]),
});

export async function guardarPaciente(
  paciente: PacienteExtraction,
): Promise<GuardarResult> {
  const parsed = guardarPacienteSchema.safeParse(paciente);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos del paciente inválidos.",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const p = parsed.data;

  // Notas con resumen del paciente (alergias, antecedentes, meds)
  const notasParts: string[] = [];
  if (p.alergias.length > 0) {
    notasParts.push(`Alergias: ${p.alergias.join(", ")}`);
  }
  if (p.antecedentes.length > 0) {
    notasParts.push(`Antecedentes: ${p.antecedentes.join(", ")}`);
  }
  if (p.medicamentos_actuales.length > 0) {
    notasParts.push(`Medicamentos actuales: ${p.medicamentos_actuales.join(", ")}`);
  }
  const notasResumen = notasParts.length > 0 ? notasParts.join("\n") : null;

  const { error } = await supa.from("pacientes").insert({
    medico_id: user.id,
    nombre: p.nombre,
    apellido_paterno: p.apellido_paterno,
    apellido_materno: p.apellido_materno,
    fecha_nacimiento: p.fecha_nacimiento,
    sexo: p.sexo,
    telefono: p.telefono,
    email: p.email,
    notas_internas: notasResumen,
  });

  if (error) {
    console.error("[guardar-paciente] error:", error);
    return { status: "error", message: error.message };
  }

  void recordAudit({
    userId: user.id,
    action: "import.paciente_saved",
    metadata: {
      alergias_count: p.alergias.length,
      antecedentes_count: p.antecedentes.length,
    },
  });

  revalidatePath("/dashboard/pacientes");
  return { status: "ok", inserted: 1 };
}
