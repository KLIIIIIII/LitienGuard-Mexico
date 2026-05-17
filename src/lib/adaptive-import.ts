/**
 * Adaptive importer — mapea CUALQUIER estructura de CSV a nuestro schema.
 *
 * El médico sube su archivo con las columnas que tenga (cualquier orden,
 * nombres en español o inglés, mezclados, mayúsculas o no, con/sin
 * acentos). Claude analiza headers + sample rows y propone:
 *
 *   1. Mapping columna → campo del schema
 *   2. Transformaciones sugeridas (split nombre completo, edad→fechaNacimiento, etc)
 *   3. Detección de columnas que mezclan datos de múltiples entidades
 *      (ej. CSV con paciente + diagnóstico + tratamiento → se sugiere
 *      crear notas/recetas vinculadas)
 *
 * Después el médico revisa, ajusta si quiere, y confirma.
 */

import { generateObject } from "ai";
import { z } from "zod";

/* ============================================================
   Schemas de mapping por entidad
   ============================================================ */

/**
 * Catálogo de campos válidos por entidad. El LLM solo puede mapear a
 * estos campos. Si no encuentra match → mapping null (queda como
 * notas_internas o se ignora).
 */
export const ENTITY_FIELDS = {
  pacientes: [
    { key: "nombre", desc: "Primer nombre del paciente" },
    { key: "apellido_paterno", desc: "Apellido paterno" },
    { key: "apellido_materno", desc: "Apellido materno" },
    { key: "nombre_completo", desc: "Nombre completo en un solo campo — el sistema lo separa" },
    { key: "email", desc: "Correo electrónico" },
    { key: "telefono", desc: "Teléfono / celular" },
    { key: "fecha_nacimiento", desc: "Fecha de nacimiento (cualquier formato)" },
    { key: "edad", desc: "Edad en años (se convierte a fecha_nacimiento aproximada)" },
    { key: "sexo", desc: "Sexo (M/F/O o Masculino/Femenino/Otro)" },
    { key: "notas_internas", desc: "Notas libres / comentarios / observaciones" },
    { key: "etiquetas", desc: "Tags / categorías / grupos del paciente" },
    { key: "alergias", desc: "Alergias documentadas (text o array)" },
    { key: "ultima_consulta_at", desc: "Fecha de última consulta" },
    { key: "external_id", desc: "ID del sistema original / expediente" },
    // Campos que se mapean a otras entidades (notas/recetas asociadas)
    { key: "diagnostico_asociado", desc: "Diagnóstico clínico (se crea nota asociada)" },
    { key: "tratamiento_asociado", desc: "Tratamiento / medicamento (se crea receta asociada)" },
    { key: "estudios_asociados", desc: "Estudios clínicos solicitados (se crea petición lab/rad asociada)" },
    { key: "estatura_m", desc: "Estatura en metros (a notas_internas)" },
    { key: "peso_kg", desc: "Peso en kg (a notas_internas)" },
    { key: "visitas_count", desc: "Cuenta de visitas (a notas_internas)" },
  ],
  recetas: [
    { key: "paciente_nombre", desc: "Nombre completo del paciente" },
    { key: "paciente_edad", desc: "Edad del paciente en años" },
    { key: "paciente_sexo", desc: "Sexo (M/F/O)" },
    { key: "diagnostico", desc: "Diagnóstico clínico" },
    { key: "diagnostico_cie10", desc: "Código CIE-10" },
    { key: "medicamento", desc: "Nombre del medicamento (genérico)" },
    { key: "presentacion", desc: "Presentación (tabletas 500mg, jarabe, etc)" },
    { key: "dosis", desc: "Dosis (1 tableta, 5 mL, etc)" },
    { key: "frecuencia", desc: "Frecuencia (c/8h, c/12h, BID)" },
    { key: "duracion", desc: "Duración del tratamiento (7 días, 1 mes)" },
    { key: "via_administracion", desc: "Vía (VO, IM, IV, tópico)" },
    { key: "indicaciones", desc: "Indicaciones específicas del medicamento" },
    { key: "indicaciones_generales", desc: "Indicaciones no farmacológicas" },
    { key: "fecha_emision", desc: "Fecha de emisión de la receta" },
  ],
  consultas: [
    { key: "paciente_nombre", desc: "Nombre completo del paciente" },
    { key: "paciente_edad", desc: "Edad del paciente" },
    { key: "paciente_sexo", desc: "Sexo (M/F/O)" },
    { key: "fecha", desc: "Fecha y hora de la consulta" },
    { key: "tipo", desc: "Tipo de consulta (primera_vez, subsecuente, urgencia, revision)" },
    { key: "motivo", desc: "Motivo de consulta" },
    { key: "diagnostico_principal", desc: "Diagnóstico principal" },
    { key: "subjetivo", desc: "Sección S del SOAP" },
    { key: "objetivo", desc: "Sección O del SOAP — exploración física, signos" },
    { key: "analisis", desc: "Sección A del SOAP — análisis clínico" },
    { key: "plan", desc: "Sección P del SOAP — plan terapéutico" },
    { key: "notas_libres", desc: "Cualquier nota adicional" },
  ],
} as const;

export type EntityKey = keyof typeof ENTITY_FIELDS;

/* ============================================================
   Schema de respuesta del LLM
   ============================================================ */

const MappingSchema = z.object({
  mappings: z
    .array(
      z.object({
        csvColumn: z
          .string()
          .describe("Nombre exacto de la columna como aparece en el CSV original"),
        targetField: z
          .string()
          .nullable()
          .describe(
            "Campo del schema al que se mapea. null si no aplica / se ignora. Solo usa keys de la lista de campos provista.",
          ),
        confidence: z
          .enum(["alta", "media", "baja"])
          .describe(
            "Confianza del mapeo: alta si el nombre es claro, media si requiere transformación, baja si es ambiguo.",
          ),
        transformation: z
          .string()
          .nullable()
          .describe(
            "Si la columna requiere transformación, describirla brevemente (ej. 'split en 3 partes', 'parsear fecha', 'a array por coma').",
          ),
        note: z
          .string()
          .nullable()
          .describe("Notas adicionales para el médico que revisa el mapping."),
      }),
    )
    .describe("Una entrada por cada columna del CSV. Sin omitir ninguna."),
  overallNotes: z
    .string()
    .nullable()
    .describe(
      "Observaciones globales para el médico (ej. 'el CSV mezcla datos de paciente + nota; sugiero crear notas asociadas').",
    ),
  warnings: z
    .array(z.string())
    .describe(
      "Warnings: columnas ambiguas, datos sensibles que requieren atención, formatos sospechosos.",
    ),
});

export type ColumnMapping = z.infer<typeof MappingSchema>;

/* ============================================================
   LLM call
   ============================================================ */

const MODEL_ID =
  process.env.LITIENGUARD_IMPORT_MODEL ?? "anthropic/claude-sonnet-4-6";

/**
 * Analiza headers + sample rows y propone mapping. Llamada cara (~3-5s),
 * pero ocurre solo una vez por archivo, no por fila.
 */
export async function mapColumnsWithAI(
  entity: EntityKey,
  headers: string[],
  sampleRows: string[][],
): Promise<ColumnMapping> {
  const validFields = ENTITY_FIELDS[entity];
  const fieldsList = validFields
    .map((f) => `  - ${f.key}: ${f.desc}`)
    .join("\n");

  // Limitar sample a 5 filas para tokens
  const sample = sampleRows.slice(0, 5);
  const sampleText = sample
    .map((row, i) => `Fila ${i + 1}: ${headers.map((h, j) => `${h}="${row[j] ?? ""}"`).join(" · ")}`)
    .join("\n");

  const prompt = `Analiza este CSV de un médico mexicano e indica cómo mapear cada columna a nuestro schema interno de ${entity}.

CAMPOS VÁLIDOS DE NUESTRO SCHEMA (${entity}):
${fieldsList}

HEADERS DEL CSV:
${headers.map((h) => `  - "${h}"`).join("\n")}

PRIMERAS FILAS (para entender qué contiene cada columna):
${sampleText}

INSTRUCCIONES:
1. Para CADA columna del CSV, propón a qué campo de nuestro schema se mapea (o null si no aplica).
2. Sé generoso con sinónimos en español MX: "nombre completo" → nombre_completo, "tel" → telefono, "DOB" → fecha_nacimiento, "alergias" → alergias, "obs" → notas_internas, "género" → sexo, etc.
3. Si el CSV mezcla columnas de PACIENTE + CLÍNICAS (diagnóstico, tratamiento, estudios), mapea cada una al campo *_asociado correspondiente y avisa en overallNotes.
4. Marca confidence ALTA si el match es obvio (ej. "edad" → edad), MEDIA si requiere transformación (ej. "Nombre Completo" → nombre_completo que el sistema split), BAJA si es ambiguo.
5. En transformation describe brevemente qué hay que hacer (ej. "split por espacios", "parsear DD/MM/YYYY", "convertir Masculino→M").
6. Warnings: alerta si detectas PHI sensible, columnas sospechosas, formatos raros.

Devuelve UNA entrada por cada header del CSV — no omitas ninguna.`;

  const { object } = await generateObject({
    model: MODEL_ID,
    schema: MappingSchema,
    prompt,
    temperature: 0,
  });

  return object;
}

/* ============================================================
   Aplicar mapping a una fila
   ============================================================ */

/**
 * Toma una fila parseada del CSV + mapping confirmado y devuelve un
 * objeto con los campos del schema listos para insertar.
 * Aplica transformaciones básicas:
 *   - split de nombre completo en partes
 *   - edad → fecha_nacimiento aproximada (1 de enero de año-edad)
 *   - alergias text → array (split por coma)
 *   - sexo Masculino/Femenino/etc → M/F/O
 *   - fechas → ISO si se puede parsear
 */
export function applyMapping(
  row: Record<string, string>,
  mapping: ColumnMapping["mappings"],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const m of mapping) {
    if (!m.targetField) continue;
    const raw = row[m.csvColumn]?.trim() ?? "";
    if (!raw) continue;

    switch (m.targetField) {
      case "nombre_completo": {
        const parts = raw.split(/\s+/).filter(Boolean);
        if (parts.length >= 3) {
          out.nombre = parts.slice(0, parts.length - 2).join(" ");
          out.apellido_paterno = parts[parts.length - 2];
          out.apellido_materno = parts[parts.length - 1];
        } else if (parts.length === 2) {
          out.nombre = parts[0];
          out.apellido_paterno = parts[1];
        } else {
          out.nombre = raw;
        }
        break;
      }
      case "edad": {
        const n = parseInt(raw, 10);
        if (!isNaN(n) && n >= 0 && n <= 130) {
          out.edad = n;
          // Aproximar fecha_nacimiento al 1 de enero del año-edad
          const año = new Date().getFullYear() - n;
          out.fecha_nacimiento = `${año}-01-01`;
        }
        break;
      }
      case "fecha_nacimiento":
      case "ultima_consulta_at":
      case "fecha":
      case "fecha_emision": {
        const iso = normalizeFecha(raw);
        if (iso) out[m.targetField] = iso;
        break;
      }
      case "sexo":
      case "paciente_sexo": {
        const s = raw.toUpperCase();
        if (s.startsWith("M") || s.startsWith("H")) out[m.targetField] = "M";
        else if (s.startsWith("F") || s.includes("MUJ")) out[m.targetField] = "F";
        else if (s.length > 0) out[m.targetField] = "O";
        break;
      }
      case "alergias": {
        if (raw.toLowerCase().match(/^(ninguna|sin|negativ|no)/)) {
          out.alergias = [];
        } else {
          out.alergias = raw
            .split(/[,;|]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && s.length < 80);
        }
        break;
      }
      case "etiquetas": {
        out.etiquetas = raw
          .split(/[,;|]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s.length < 60);
        break;
      }
      case "email": {
        const e = raw.toLowerCase().trim();
        if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) out.email = e;
        break;
      }
      default: {
        out[m.targetField] = raw;
      }
    }
  }

  return out;
}

/* ============================================================
   Parsers utilitarios
   ============================================================ */

function normalizeFecha(s: string): string | null {
  const v = s.trim();
  if (!v) return null;

  // ISO: 2024-09-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // DD/MM/YYYY o D/M/YYYY
  let m = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
  }

  // YYYY/MM/DD
  m = v.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
  }

  // DD-MMM-YYYY (Excel español)
  m = v.match(/^(\d{1,2})-([a-záéí]+)[-\s]+(\d{2,4})$/i);
  if (m) {
    const [, d, mes, y] = m;
    const mesNum = parseMesEs(mes!);
    if (mesNum) {
      const yFull = y!.length === 2 ? `20${y}` : y;
      return `${yFull}-${String(mesNum).padStart(2, "0")}-${d!.padStart(2, "0")}`;
    }
  }

  // Fallback: try Date.parse
  const ts = Date.parse(v);
  if (!isNaN(ts)) {
    const d = new Date(ts);
    return d.toISOString().slice(0, 10);
  }

  return null;
}

function parseMesEs(s: string): number | null {
  const map: Record<string, number> = {
    enero: 1, ene: 1,
    febrero: 2, feb: 2,
    marzo: 3, mar: 3,
    abril: 4, abr: 4,
    mayo: 5, may: 5,
    junio: 6, jun: 6,
    julio: 7, jul: 7,
    agosto: 8, ago: 8,
    septiembre: 9, sep: 9, sept: 9,
    octubre: 10, oct: 10,
    noviembre: 11, nov: 11,
    diciembre: 12, dic: 12,
  };
  const key = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return map[key] ?? null;
}

/* ============================================================
   CSV parser robusto (sin deps)
   ============================================================ */

/**
 * Parser CSV robusto. Maneja:
 *   - delimitadores `,` `;` `\t`
 *   - quotes con escape ""
 *   - BOM UTF-8
 *   - CRLF / LF / CR
 *   - campos vacíos
 */
export function parseCsv(text: string): {
  headers: string[];
  rows: string[][];
} {
  // Quitar BOM
  let t = text;
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);

  // Detectar delimitador desde primera línea no vacía
  const firstLine = t.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  const counts = {
    ",": (firstLine.match(/,/g) ?? []).length,
    ";": (firstLine.match(/;/g) ?? []).length,
    "\t": (firstLine.match(/\t/g) ?? []).length,
  };
  const delim = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    ",") as "," | ";" | "\t";

  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < t.length) {
    const c = t[i]!;
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === delim) {
      current.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\n" || c === "\r") {
      current.push(field);
      if (current.some((v) => v.length > 0)) rows.push(current);
      current = [];
      field = "";
      if (c === "\r" && t[i + 1] === "\n") i += 2;
      else i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length > 0 || current.length > 0) {
    current.push(field);
    if (current.some((v) => v.length > 0)) rows.push(current);
  }

  const headers = rows.shift() ?? [];
  return { headers: headers.map((h) => h.trim()), rows };
}
