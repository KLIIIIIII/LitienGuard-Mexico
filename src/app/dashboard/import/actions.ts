"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import {
  canUsePacientes,
  canUseRecetas,
  canUseScribe,
  type SubscriptionTier,
} from "@/lib/entitlements";
import {
  mapColumnsWithAI,
  applyMapping,
  ENTITY_FIELDS,
  type EntityKey,
  type ColumnMapping,
} from "@/lib/adaptive-import";

const entitySchema = z.enum(["pacientes", "recetas", "consultas"]);

const mapInput = z.object({
  entity: entitySchema,
  headers: z.array(z.string().max(120)).min(1).max(80),
  sampleRows: z.array(z.array(z.string())).max(10),
});

export type MapResult =
  | { status: "ok"; mapping: ColumnMapping }
  | { status: "error"; message: string };

export async function mapHeaders(
  input: z.infer<typeof mapInput>,
): Promise<MapResult> {
  const parsed = mapInput.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;

  if (!hasAccess(parsed.data.entity, tier)) {
    return { status: "error", message: "Tu plan no incluye este import." };
  }

  try {
    const mapping = await mapColumnsWithAI(
      parsed.data.entity,
      parsed.data.headers,
      parsed.data.sampleRows,
    );

    void recordAudit({
      userId: user.id,
      action: "adaptive_import.map_headers",
      metadata: {
        entity: parsed.data.entity,
        n_headers: parsed.data.headers.length,
        n_sample: parsed.data.sampleRows.length,
        n_mapped: mapping.mappings.filter((m) => m.targetField).length,
      },
    });

    return { status: "ok", mapping };
  } catch (err) {
    console.error("[adaptive-import] mapping err:", err);
    return {
      status: "error",
      message: "El asistente no pudo analizar el archivo. Intenta de nuevo.",
    };
  }
}

/* ============================================================
   Import batch — aplica mapping y crea records
   ============================================================ */

const importInput = z.object({
  entity: entitySchema,
  mapping: z.array(
    z.object({
      csvColumn: z.string(),
      targetField: z.string().nullable(),
      confidence: z.enum(["alta", "media", "baja"]),
      transformation: z.string().nullable(),
      note: z.string().nullable(),
    }),
  ),
  rows: z.array(z.record(z.string(), z.string())).max(500),
});

export type ImportResult =
  | {
      status: "ok";
      rowsOk: number;
      rowsError: number;
      errors: string[];
      createdIds: string[];
    }
  | { status: "error"; message: string };

export async function importBatch(
  input: z.infer<typeof importInput>,
): Promise<ImportResult> {
  const parsed = importInput.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;

  if (!hasAccess(parsed.data.entity, tier)) {
    return { status: "error", message: "Tu plan no incluye este import." };
  }

  const errors: string[] = [];
  const createdIds: string[] = [];
  let rowsOk = 0;
  let rowsError = 0;

  for (let i = 0; i < parsed.data.rows.length; i++) {
    const row = parsed.data.rows[i]!;
    try {
      const transformed = applyMapping(row, parsed.data.mapping);

      if (parsed.data.entity === "pacientes") {
        const id = await insertPaciente(supa, user.id, transformed);
        if (id) {
          createdIds.push(id);
          rowsOk++;
        } else {
          rowsError++;
        }
      } else if (parsed.data.entity === "recetas") {
        const id = await insertReceta(supa, user.id, transformed);
        if (id) {
          createdIds.push(id);
          rowsOk++;
        } else {
          rowsError++;
        }
      } else if (parsed.data.entity === "consultas") {
        const id = await insertConsulta(supa, user.id, transformed);
        if (id) {
          createdIds.push(id);
          rowsOk++;
        } else {
          rowsError++;
        }
      }
    } catch (err) {
      rowsError++;
      const message =
        err instanceof Error ? err.message : String(err);
      if (errors.length < 10) {
        errors.push(`Fila ${i + 1}: ${message}`);
      }
    }
  }

  void recordAudit({
    userId: user.id,
    action: "adaptive_import.batch",
    metadata: {
      entity: parsed.data.entity,
      n_rows: parsed.data.rows.length,
      rows_ok: rowsOk,
      rows_error: rowsError,
    },
  });

  revalidatePath(`/dashboard/${parsed.data.entity}`);
  return {
    status: "ok",
    rowsOk,
    rowsError,
    errors,
    createdIds,
  };
}

/* ============================================================
   Inserts específicos por entidad
   ============================================================ */

type SupaClient = Awaited<ReturnType<typeof createSupabaseServer>>;

async function insertPaciente(
  supa: SupaClient,
  userId: string,
  data: Record<string, unknown>,
): Promise<string | null> {
  const nombre = (data.nombre as string | undefined)?.trim();
  if (!nombre) return null;

  // Construir notas_internas combinando campos extras
  const extras: string[] = [];
  if (data.estatura_m) extras.push(`Estatura: ${data.estatura_m} m`);
  if (data.peso_kg) extras.push(`Peso: ${data.peso_kg} kg`);
  if (data.visitas_count) extras.push(`Visitas previas: ${data.visitas_count}`);
  if (data.diagnostico_asociado)
    extras.push(`Dx documentado: ${data.diagnostico_asociado}`);
  if (data.tratamiento_asociado)
    extras.push(`Tratamiento previo: ${data.tratamiento_asociado}`);
  if (data.estudios_asociados)
    extras.push(`Estudios previos: ${data.estudios_asociados}`);
  if (data.notas_internas) extras.push(String(data.notas_internas));

  const notas = extras.join(" · ").slice(0, 2000);

  const alergias = Array.isArray(data.alergias)
    ? (data.alergias as string[]).filter((a) => a && a.length > 0)
    : [];

  const etiquetas = Array.isArray(data.etiquetas)
    ? (data.etiquetas as string[]).filter((t) => t && t.length > 0)
    : [];

  const insertData: Record<string, unknown> = {
    medico_id: userId,
    nombre,
    apellido_paterno: (data.apellido_paterno as string) ?? null,
    apellido_materno: (data.apellido_materno as string) ?? null,
    email: (data.email as string) ?? null,
    telefono: (data.telefono as string) ?? null,
    fecha_nacimiento: (data.fecha_nacimiento as string) ?? null,
    sexo: (data.sexo as string) ?? null,
    ultima_consulta_at: (data.ultima_consulta_at as string) ?? null,
    notas_internas: notas || null,
    alergias,
    etiquetas,
  };

  const { data: row, error } = await supa
    .from("pacientes")
    .insert(insertData)
    .select("id")
    .single();
  if (error) throw error;
  return row?.id ?? null;
}

async function insertReceta(
  supa: SupaClient,
  userId: string,
  data: Record<string, unknown>,
): Promise<string | null> {
  const nombre = (data.paciente_nombre as string | undefined)?.trim();
  if (!nombre) return null;

  const partes = nombre.split(/\s+/);
  const pacienteNombre = partes.slice(0, partes.length - 2).join(" ") || nombre;
  const apellidoP = partes[partes.length - 2] ?? "";
  const apellidoM = partes[partes.length - 1] ?? "";

  const item = {
    medicamento: (data.medicamento as string) ?? "",
    presentacion: (data.presentacion as string) ?? "",
    dosis: (data.dosis as string) ?? "",
    frecuencia: (data.frecuencia as string) ?? "",
    duracion: (data.duracion as string) ?? "",
    via_administracion: (data.via_administracion as string) ?? "",
    indicaciones: (data.indicaciones as string) ?? "",
  };

  if (!item.medicamento) return null;

  const { data: receta, error } = await supa
    .from("recetas")
    .insert({
      medico_id: userId,
      paciente_nombre: pacienteNombre,
      paciente_apellido_paterno: apellidoP,
      paciente_apellido_materno: apellidoM,
      paciente_edad: (data.paciente_edad as number) ?? null,
      paciente_sexo: (data.paciente_sexo as string) ?? null,
      diagnostico: (data.diagnostico as string) ?? "",
      diagnostico_cie10: (data.diagnostico_cie10 as string) ?? "",
      indicaciones_generales: (data.indicaciones_generales as string) ?? "",
      fecha_emision: (data.fecha_emision as string) ?? null,
      status: "borrador",
    })
    .select("id")
    .single();

  if (error) throw error;
  if (!receta?.id) return null;

  // Insertar item
  await supa.from("recetas_items").insert({
    receta_id: receta.id,
    ...item,
  });

  return receta.id;
}

async function insertConsulta(
  supa: SupaClient,
  userId: string,
  data: Record<string, unknown>,
): Promise<string | null> {
  const nombre = (data.paciente_nombre as string | undefined)?.trim();
  if (!nombre) return null;

  const partes = nombre.split(/\s+/);
  const pacienteNombre = partes.slice(0, partes.length - 2).join(" ") || nombre;
  const apellidoP = partes[partes.length - 2] ?? "";
  const apellidoM = partes[partes.length - 1] ?? "";

  const tipoMap: Record<string, string> = {
    primera: "primera_vez",
    primera_vez: "primera_vez",
    subsecuente: "subsecuente",
    urgencia: "urgencia",
    revision: "revision",
    revisión: "revision",
  };
  const tipoRaw = ((data.tipo as string) ?? "").toLowerCase();
  const tipo = tipoMap[tipoRaw] ?? "subsecuente";

  // Construir notas_libres combinando análisis/plan/diagnóstico
  const notasParts: string[] = [];
  if (data.diagnostico_principal)
    notasParts.push(`Dx: ${data.diagnostico_principal}`);
  if (data.subjetivo) notasParts.push(`S: ${data.subjetivo}`);
  if (data.objetivo) notasParts.push(`O: ${data.objetivo}`);
  if (data.analisis) notasParts.push(`A: ${data.analisis}`);
  if (data.plan) notasParts.push(`P: ${data.plan}`);
  if (data.notas_libres) notasParts.push(String(data.notas_libres));
  const notas = notasParts.join("\n").slice(0, 5000) || null;

  const { data: row, error } = await supa
    .from("consultas")
    .insert({
      medico_id: userId,
      paciente_nombre: pacienteNombre,
      paciente_apellido_paterno: apellidoP,
      paciente_apellido_materno: apellidoM,
      paciente_edad: (data.paciente_edad as number) ?? null,
      paciente_sexo: (data.paciente_sexo as string) ?? null,
      fecha: (data.fecha as string) ?? new Date().toISOString(),
      tipo,
      motivo_consulta: (data.motivo as string) ?? null,
      notas_libres: notas,
      status: "cerrada",
      cerrada_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return row?.id ?? null;
}

/* ============================================================
   Access control
   ============================================================ */

function hasAccess(entity: EntityKey, tier: SubscriptionTier): boolean {
  if (entity === "pacientes") return canUsePacientes(tier);
  if (entity === "recetas") return canUseRecetas(tier);
  if (entity === "consultas") return canUseScribe(tier);
  return false;
}

/* ============================================================
   Re-export para usar en cliente
   ============================================================ */

export async function getEntityFields(entity: EntityKey): Promise<
  Array<{ key: string; desc: string }>
> {
  return [...ENTITY_FIELDS[entity]];
}
