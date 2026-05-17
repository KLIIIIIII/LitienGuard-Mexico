"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";
import { canUseScribe, type SubscriptionTier } from "@/lib/entitlements";
import { parseHl7, type Hl7ParseResult, type Hl7Mensaje } from "@/lib/import-from-hl7";

const previewSchema = z.object({
  content: z.string().min(10).max(2_000_000),
});

export type PreviewResult =
  | { status: "ok"; result: Hl7ParseResult }
  | { status: "error"; message: string };

/**
 * Recibe el contenido de un archivo HL7 v2 y devuelve preview parseado
 * (sin persistir). El médico revisa antes de importar.
 */
export async function previewHl7(
  content: string,
): Promise<PreviewResult> {
  const parsed = previewSchema.safeParse({ content });
  if (!parsed.success) {
    return {
      status: "error",
      message: "El archivo debe tener entre 10 y 2,000,000 caracteres.",
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
      message: "Has alcanzado el límite de importaciones por hora.",
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
      message: "La importación HL7 requiere plan Esencial o superior.",
    };
  }

  const result = parseHl7(parsed.data.content);

  void recordAudit({
    userId: user.id,
    action: "import.hl7_preview",
    metadata: {
      mensajes: result.mensajes.length,
      pacientes: result.mensajes.filter((m) => m.paciente).length,
      diagnosticos: result.mensajes.reduce(
        (s, m) => s + m.diagnosticos.length,
        0,
      ),
      total_segmentos: result.totalSegmentos,
    },
  });

  return { status: "ok", result };
}

// =================================================================
// Persistencia — confirma el preview
// =================================================================

const importSchema = z.object({
  mensajes: z.array(z.unknown()),
});

export type ImportResult =
  | {
      status: "ok";
      pacientesCreados: number;
      pacientesDuplicados: number;
    }
  | { status: "error"; message: string };

/**
 * Persiste los mensajes HL7 parseados. Por cada mensaje:
 *   - Crea paciente si no existe (dedupe por externalId + nombre + DOB)
 *   - Agrega alergias y antecedentes a notas_internas
 *   - Diagnósticos y medicamentos quedan disponibles como referencia
 *     (no creamos receta formal — solo paciente con resumen)
 */
export async function importarHl7(
  mensajes: Hl7Mensaje[],
): Promise<ImportResult> {
  const parsed = importSchema.safeParse({ mensajes });
  if (!parsed.success) {
    return { status: "error", message: "Datos inválidos." };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  let pacientesCreados = 0;
  let pacientesDuplicados = 0;

  for (const m of mensajes as Hl7Mensaje[]) {
    if (!m.paciente) continue;

    // Construir nombre completo para dedupe simple por nombre + DOB
    const nombreCompleto = [
      m.paciente.nombre,
      m.paciente.apellido_paterno,
      m.paciente.apellido_materno,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (m.paciente.fecha_nacimiento) {
      const { data: existing } = await supa
        .from("pacientes")
        .select("id")
        .eq("medico_id", user.id)
        .eq("nombre", m.paciente.nombre)
        .eq("fecha_nacimiento", m.paciente.fecha_nacimiento)
        .limit(1);
      if (existing && existing.length > 0) {
        pacientesDuplicados++;
        continue;
      }
    }

    // Construir notas_internas con resumen del HL7
    const notasParts: string[] = [];
    if (m.paciente.externalId) {
      notasParts.push(`ID externo: ${m.paciente.externalId}`);
    }
    if (m.alergias.length > 0) {
      notasParts.push(
        `Alergias: ${m.alergias
          .map((a) => (a.reaccion ? `${a.agente} (${a.reaccion})` : a.agente))
          .join(", ")}`,
      );
    }
    if (m.diagnosticos.length > 0) {
      notasParts.push(
        `Diagnósticos previos: ${m.diagnosticos
          .map((d) =>
            d.codigo ? `${d.codigo} - ${d.descripcion}` : d.descripcion,
          )
          .join("; ")}`,
      );
    }
    if (m.medicamentos.length > 0) {
      notasParts.push(
        `Medicamentos: ${m.medicamentos
          .map((med) =>
            [med.nombre, med.dosis, med.frecuencia, med.via]
              .filter(Boolean)
              .join(" "),
          )
          .join("; ")}`,
      );
    }
    if (m.observaciones.length > 0) {
      const obs = m.observaciones
        .slice(0, 10)
        .map((o) => `${o.campo}: ${o.valor}${o.unidad ? " " + o.unidad : ""}`)
        .join("; ");
      notasParts.push(`Observaciones: ${obs}`);
    }
    if (m.encounter?.fecha) {
      notasParts.push(`Última visita: ${m.encounter.fecha}`);
    }
    notasParts.push(`Importado desde HL7 v2 el ${new Date().toISOString().slice(0, 10)}`);

    const notas_internas = notasParts.join("\n");

    const { error } = await supa.from("pacientes").insert({
      medico_id: user.id,
      nombre: m.paciente.nombre,
      apellido_paterno: m.paciente.apellido_paterno,
      apellido_materno: m.paciente.apellido_materno,
      fecha_nacimiento: m.paciente.fecha_nacimiento,
      sexo: m.paciente.sexo,
      telefono: m.paciente.telefono,
      email: m.paciente.email,
      notas_internas,
    });

    if (!error) pacientesCreados++;
    else console.warn("[hl7] insert err:", error, nombreCompleto);
  }

  void recordAudit({
    userId: user.id,
    action: "import.hl7_imported",
    metadata: {
      mensajes_totales: mensajes.length,
      creados: pacientesCreados,
      duplicados: pacientesDuplicados,
    },
  });

  revalidatePath("/dashboard/pacientes");

  return {
    status: "ok",
    pacientesCreados,
    pacientesDuplicados,
  };
}
