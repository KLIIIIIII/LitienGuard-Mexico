/**
 * Extracción estructurada desde imágenes — migración papel → digital.
 *
 * Recibe una imagen (foto / escaneo de) agenda física, receta, ficha de
 * paciente o nota SOAP en papel, y devuelve JSON estructurado listo para
 * persistir en la base de datos.
 *
 * Usa Claude Sonnet vision vía AI Gateway. Las imágenes se pasan como
 * data URL base64; NO se almacenan por default (privacy first).
 *
 * Diseñado para reducir el dolor del onboarding del consultorio analógico —
 * en vez de teclear 200 pacientes uno por uno, el médico fotografía su
 * libreta y revisa la extracción.
 */

import { generateObject } from "ai";
import { z } from "zod";

// =================================================================
// Schemas por tipo de documento
// =================================================================

export const AgendaSchema = z.object({
  citas: z
    .array(
      z.object({
        paciente_nombre: z
          .string()
          .describe(
            "Nombre del paciente como aparece en la agenda. Si solo hay iniciales o apellido, usa eso.",
          ),
        fecha: z
          .string()
          .nullable()
          .describe(
            "Fecha en formato ISO YYYY-MM-DD si está visible. Si solo dice 'lunes' o 'mañana', null.",
          ),
        hora: z
          .string()
          .nullable()
          .describe("Hora en formato HH:MM 24h si está visible. Null si no aparece."),
        motivo: z
          .string()
          .nullable()
          .describe("Motivo de consulta breve si aparece. Null si solo hay nombre."),
        telefono: z
          .string()
          .nullable()
          .describe("Teléfono si aparece. Null si no."),
        notas: z
          .string()
          .nullable()
          .describe("Cualquier nota adicional visible (recordar, dieta, control, etc.)."),
      }),
    )
    .describe("Una entrada por cada cita visible en la agenda."),
});
export type AgendaExtraction = z.infer<typeof AgendaSchema>;

export const RecetaSchema = z.object({
  paciente_nombre: z
    .string()
    .nullable()
    .describe("Nombre del paciente como aparece en la receta."),
  paciente_edad: z
    .number()
    .nullable()
    .describe("Edad del paciente en años si aparece."),
  fecha: z
    .string()
    .nullable()
    .describe("Fecha de emisión en formato ISO YYYY-MM-DD si aparece."),
  diagnostico: z
    .string()
    .nullable()
    .describe("Diagnóstico o motivo si aparece en la receta."),
  medicamentos: z.array(
    z.object({
      nombre: z.string().describe("Nombre genérico o comercial del medicamento."),
      presentacion: z
        .string()
        .nullable()
        .describe("Presentación (tableta 500mg, ámpula, suspensión)."),
      dosis: z
        .string()
        .nullable()
        .describe("Dosis por toma (ej. '1 tableta', '5 mL')."),
      frecuencia: z
        .string()
        .nullable()
        .describe("Frecuencia (ej. 'cada 8h', 'cada 12 horas')."),
      duracion: z
        .string()
        .nullable()
        .describe("Duración del tratamiento (ej. '7 días', '3 meses')."),
      via: z
        .string()
        .nullable()
        .describe("Vía (VO, IM, IV, SC, tópica)."),
    }),
  ),
  indicaciones: z
    .string()
    .nullable()
    .describe("Indicaciones generales no farmacológicas si aparecen."),
});
export type RecetaExtraction = z.infer<typeof RecetaSchema>;

export const PacienteSchema = z.object({
  nombre: z.string().describe("Primer nombre del paciente."),
  apellido_paterno: z
    .string()
    .nullable()
    .describe("Apellido paterno si aparece."),
  apellido_materno: z
    .string()
    .nullable()
    .describe("Apellido materno si aparece."),
  fecha_nacimiento: z
    .string()
    .nullable()
    .describe("Fecha de nacimiento en formato ISO YYYY-MM-DD si aparece."),
  edad: z
    .number()
    .nullable()
    .describe("Edad en años si aparece (sin fecha de nacimiento)."),
  sexo: z
    .enum(["M", "F", "O"])
    .nullable()
    .describe("Sexo biológico si aparece."),
  telefono: z.string().nullable().describe("Teléfono si aparece."),
  email: z.string().nullable().describe("Email si aparece."),
  alergias: z
    .array(z.string())
    .describe("Alergias documentadas. Array vacío si no aparecen o si dice 'niega alergias'."),
  antecedentes: z
    .array(z.string())
    .describe(
      "Antecedentes médicos relevantes (HAS, DM2, asma, etc.). Array vacío si no aparecen.",
    ),
  medicamentos_actuales: z
    .array(z.string())
    .describe("Medicamentos que toma actualmente. Array vacío si no aparecen."),
});
export type PacienteExtraction = z.infer<typeof PacienteSchema>;

export const ConsultaSchema = z.object({
  paciente_iniciales: z
    .string()
    .nullable()
    .describe(
      "Iniciales o nombre corto del paciente. Si hay nombre completo, devuelve solo iniciales (e.g. 'MRG').",
    ),
  fecha: z
    .string()
    .nullable()
    .describe("Fecha de la consulta en formato ISO YYYY-MM-DD si aparece."),
  subjetivo: z
    .string()
    .describe(
      "Sección S del SOAP — síntomas referidos por el paciente, motivo, antecedentes recientes. Cadena vacía si no aparece.",
    ),
  objetivo: z
    .string()
    .describe(
      "Sección O del SOAP — signos vitales, examen físico, laboratorios. Cadena vacía si no aparece.",
    ),
  analisis: z
    .string()
    .describe(
      "Sección A del SOAP — diagnóstico o impresión clínica. Cadena vacía si no aparece.",
    ),
  plan: z
    .string()
    .describe(
      "Sección P del SOAP — tratamiento, estudios solicitados, control. Cadena vacía si no aparece.",
    ),
});
export type ConsultaExtraction = z.infer<typeof ConsultaSchema>;

// =================================================================
// Prompts por tipo
// =================================================================

const PROMPTS: Record<DocumentoTipo, string> = {
  agenda: `Eres un asistente que extrae citas de una agenda física manuscrita o impresa.
Tu única tarea es leer la imagen y devolver TODAS las citas visibles como JSON estructurado.

Reglas estrictas:
1. Una entrada por cada cita o renglón con paciente. NO inventes citas.
2. Si la letra es ilegible, marca el campo como null en vez de adivinar.
3. Si la fecha está implícita (encabezado del día), úsala. Si no, null.
4. Horas en formato 24h. "9 am" → "09:00". "3 pm" → "15:00".
5. NO incluyas headers, separadores ni texto que no sea una cita.
6. Conserva los nombres EXACTAMENTE como están escritos (no corrijas ortografía).`,

  receta: `Eres un asistente que extrae datos de una receta médica manuscrita o impresa.
Tu única tarea es leer la imagen y devolver una receta estructurada como JSON.

Reglas estrictas:
1. Lista TODOS los medicamentos visibles en la receta.
2. Si la letra es ilegible para un campo, márcalo como null en vez de adivinar.
3. Conserva nombres de medicamentos EXACTAMENTE como aparecen (no traduzcas marca a genérico ni viceversa).
4. Dosis, frecuencia y duración separados — no los combines.
5. NO inventes campos. Si un dato no aparece, deja null o array vacío.
6. Si hay sello del médico, NO incluyas su información (solo datos del paciente y rx).`,

  paciente: `Eres un asistente que extrae datos demográficos y clínicos básicos de una ficha de paciente.
Tu única tarea es leer la imagen y devolver un objeto paciente estructurado como JSON.

Reglas estrictas:
1. Conserva nombres EXACTAMENTE como aparecen (no corrijas ortografía).
2. Si letra ilegible para un campo, márcalo como null.
3. Alergias: array de strings. "Penicilina, AINE" → ["Penicilina", "AINE"]. "Niega" → [].
4. Antecedentes: condiciones médicas conocidas (HAS, DM2, asma, etc.). NO incluyas síntomas actuales.
5. Medicamentos actuales: solo los que toma el paciente al momento de la ficha.
6. NO inventes información que no aparezca en la imagen.`,

  consulta: `Eres un asistente que extrae una nota de consulta SOAP desde manuscrito o impreso.
Tu única tarea es leer la imagen y devolver una nota estructurada en formato SOAP.

Reglas estrictas:
1. Identifica las 4 secciones: Subjetivo, Objetivo, Análisis, Plan.
2. Si la nota NO está en SOAP explícito, separa el contenido en las 4 secciones según contenido (síntomas → S, signos vitales y examen → O, dx → A, tx → P).
3. Conserva el texto EXACTAMENTE como aparece (no resumas ni reescribas).
4. Si una sección no aparece en la nota, devuelve cadena vacía para esa sección.
5. Iniciales del paciente: extrae las primeras letras del nombre completo si aparece.
6. NO infieras diagnósticos ni tratamientos que no estén explícitamente escritos.`,
};

// =================================================================
// Tipos de documento soportados
// =================================================================

export type DocumentoTipo = "agenda" | "receta" | "paciente" | "consulta";

export interface ExtractFromImageResult {
  status: "ok" | "error";
  tipo: DocumentoTipo;
  data?:
    | AgendaExtraction
    | RecetaExtraction
    | PacienteExtraction
    | ConsultaExtraction;
  modelUsed: string;
  latencyMs: number;
  message?: string;
}

const MODEL_ID =
  process.env.LITIENGUARD_VISION_MODEL ?? "anthropic/claude-sonnet-4-6";

/**
 * Extrae estructura desde una imagen base64 + tipo de documento.
 * Throws si la imagen es inválida o el LLM falla.
 */
export async function extractFromImage(
  imageBase64DataUrl: string,
  tipo: DocumentoTipo,
): Promise<ExtractFromImageResult> {
  if (!imageBase64DataUrl.startsWith("data:image/")) {
    throw new Error("La imagen debe estar en formato data URL base64.");
  }
  if (imageBase64DataUrl.length > 12 * 1024 * 1024) {
    throw new Error("La imagen excede 12 MB. Recórtala o reduce calidad.");
  }

  const schema = (
    {
      agenda: AgendaSchema,
      receta: RecetaSchema,
      paciente: PacienteSchema,
      consulta: ConsultaSchema,
    } as const
  )[tipo];

  const system = PROMPTS[tipo];
  const userInstruction = `Extrae el contenido de esta imagen como JSON estructurado según el schema. Recuerda: no inventes campos, marca null o array vacío si no aparece, conserva texto EXACTAMENTE como está escrito.`;

  const t0 = Date.now();

  try {
    const result = await generateObject({
      model: MODEL_ID,
      schema,
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: userInstruction },
            { type: "image", image: imageBase64DataUrl },
          ],
        },
      ],
      temperature: 0.1,
    });

    return {
      status: "ok",
      tipo,
      data: result.object as
        | AgendaExtraction
        | RecetaExtraction
        | PacienteExtraction
        | ConsultaExtraction,
      modelUsed: MODEL_ID,
      latencyMs: Date.now() - t0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido.";
    return {
      status: "error",
      tipo,
      modelUsed: MODEL_ID,
      latencyMs: Date.now() - t0,
      message,
    };
  }
}
