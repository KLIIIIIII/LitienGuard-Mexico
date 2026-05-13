/**
 * Generador de diferenciales basado en contexto clínico vía LLM.
 *
 * A diferencia del motor bayesiano (limitado a 28 enfermedades del
 * catálogo), este generador puede sugerir CUALQUIER enfermedad
 * coherente con el contexto del paciente — incluido Whipple, Crohn,
 * linfoma, TB, lupus, miopatías raras, etc.
 *
 * Estrategia anti-anchoring:
 * - Lee el contexto clínico completo SIN privilegiar la hipótesis del
 *   médico.
 * - Genera 5-7 diferenciales ordenados por sospecha clínica.
 * - Para cada uno: razonamiento explícito citando hallazgos verbatim.
 * - Evalúa explícitamente si la hipótesis del médico encaja o no.
 *
 * Cross-link con bayesiano:
 * - Para cada diferencial, el LLM intenta mapear al ID del catálogo
 *   bayesiano (DISEASES). Si matchea, la UI sobrelapa el % calculado.
 * - Si NO matchea (la enfermedad NO está en las 28), se muestra nivel
 *   cualitativo (alta/media/baja sospecha) sin % numérico.
 */

import { generateObject } from "ai";
import { z } from "zod";
import { DISEASES } from "./knowledge-base";

const DiferencialItemSchema = z.object({
  nombre: z
    .string()
    .describe(
      "Nombre clínico de la enfermedad o entidad nosológica diferencial. Ej. 'Enfermedad de Whipple', 'Linfoma intestinal de células T', 'Insuficiencia suprarrenal primaria (Addison)'.",
    ),
  id_catalogo: z
    .string()
    .nullable()
    .describe(
      "ID exacto del catálogo bayesiano si la enfermedad está incluida; null si está fuera del catálogo (la mayoría de los casos lo estarán).",
    ),
  razonamiento: z
    .string()
    .describe(
      "Razonamiento clínico de 2-4 frases citando hallazgos verbatim del contexto que apuntan a este diagnóstico. Sé específico, no genérico.",
    ),
  nivel_sospecha: z
    .enum(["alta", "media", "baja"])
    .describe(
      "Nivel cualitativo de sospecha clínica dado el contexto: alta = encaja muy bien, media = posible, baja = a considerar como diferencial pero menos probable.",
    ),
  findings_a_confirmar: z
    .array(z.string())
    .max(5)
    .describe(
      "2-5 preguntas concretas o estudios pendientes que confirmarían o descartarían este diagnóstico. Ej. 'Biopsia duodenal con tinción PAS', 'Cortisol matutino', 'PCR para Tropheryma whipplei'.",
    ),
});

const EvaluacionHipotesisSchema = z.object({
  encaja_con_contexto: z
    .boolean()
    .describe(
      "true si la hipótesis del médico es clínicamente coherente con los hallazgos. false si los hallazgos sugieren claramente otra cosa.",
    ),
  razonamiento: z
    .string()
    .describe(
      "1-3 frases explicando por qué la hipótesis encaja o no. Si no encaja, indicar qué diagnóstico parece más probable.",
    ),
  posicion_en_ranking: z
    .number()
    .int()
    .nullable()
    .describe(
      "Posición de la hipótesis del médico en el ranking de diferenciales (1 = top, null si no aparece en el top-7).",
    ),
});

const ResponseSchema = z.object({
  diferenciales: z
    .array(DiferencialItemSchema)
    .min(3)
    .max(7),
  evaluacion_hipotesis: EvaluacionHipotesisSchema,
});

export interface LlmDifferential {
  nombre: string;
  idCatalogo: string | null;
  razonamiento: string;
  nivelSospecha: "alta" | "media" | "baja";
  findingsAConfirmar: string[];
}

export interface LlmHypothesisEval {
  encajaConContexto: boolean;
  razonamiento: string;
  posicionEnRanking: number | null;
}

export interface GenerateDifferentialResult {
  diferenciales: LlmDifferential[];
  evaluacionHipotesis: LlmHypothesisEval;
  modelUsed: string;
  latencyMs: number;
  tokensInput?: number;
  tokensOutput?: number;
}

const SYSTEM_PROMPT = `Eres un asistente clínico experto en medicina interna que genera diagnósticos diferenciales para casos complejos.

Tu objetivo principal: **ANTI-ANCHORING**. El médico está aportando una hipótesis, pero tú DEBES razonar desde el contexto clínico completo sin sesgo. Si los hallazgos no apoyan la hipótesis, dilo claramente.

Reglas estrictas:
1. Genera entre 3 y 7 diferenciales clínicamente coherentes con el contexto. NUNCA inventes enfermedades fantasiosas; usa entidades nosológicas reales con literatura citable.
2. Razonamiento debe citar hallazgos **verbatim** del texto (ej. "macrófagos PAS positivos en lámina propia + PCR Tropheryma whipplei positiva"), no parafrasees.
3. Si la hipótesis del médico es razonable, inclúyela en el top con su razonamiento; si NO encaja, dilo en la evaluacion_hipotesis y NO la fuerces al ranking.
4. Cobertura amplia: incluye reumatológicas, hematológicas, gastrointestinales, neurológicas, infecciosas, endocrinas, oncológicas según corresponda al caso. NO te limites a cardiología.
5. Findings a confirmar deben ser **estudios o preguntas accionables** (biopsia, estudio de imagen, marcador específico), no abstracciones.
6. NO recomiendes tratamientos. Solo orientación diagnóstica.
7. Para id_catalogo: solo asigna un ID si la enfermedad es EXACTAMENTE la del catálogo. No fuerces matches débiles.

Catálogo bayesiano disponible (úsalo para id_catalogo, déjalo null si no aplica):
${DISEASES.map((d) => `- ${d.id}: ${d.label}`).join("\n")}`;

export async function generateDifferentialFromContext(args: {
  hipotesisDx: string;
  contextoClinico: string;
}): Promise<GenerateDifferentialResult> {
  const { hipotesisDx, contextoClinico } = args;

  if (!hipotesisDx.trim() || hipotesisDx.trim().length < 2) {
    throw new Error("La hipótesis diagnóstica es muy corta");
  }
  if (!contextoClinico.trim() || contextoClinico.trim().length < 20) {
    throw new Error(
      "El contexto clínico debe tener al menos 20 caracteres con contenido relevante",
    );
  }

  const modelId = "anthropic/claude-sonnet-4-6";
  const t0 = Date.now();

  const result = await generateObject({
    model: modelId,
    schema: ResponseSchema,
    system: SYSTEM_PROMPT,
    prompt: `# Hipótesis diagnóstica del médico

"${hipotesisDx.trim()}"

# Contexto clínico del caso

\`\`\`
${contextoClinico.trim()}
\`\`\`

Genera el diferencial diagnóstico. Razona desde los hallazgos, no desde la hipótesis. Si la hipótesis NO encaja, no la fuerces al ranking — dilo en evaluacion_hipotesis y propón lo que SÍ encaja.`,
    temperature: 0.2,
  });

  const validIds = new Set(DISEASES.map((d) => d.id));

  return {
    diferenciales: result.object.diferenciales.map((d) => ({
      nombre: d.nombre,
      idCatalogo:
        d.id_catalogo && validIds.has(d.id_catalogo) ? d.id_catalogo : null,
      razonamiento: d.razonamiento,
      nivelSospecha: d.nivel_sospecha,
      findingsAConfirmar: d.findings_a_confirmar,
    })),
    evaluacionHipotesis: {
      encajaConContexto: result.object.evaluacion_hipotesis.encaja_con_contexto,
      razonamiento: result.object.evaluacion_hipotesis.razonamiento,
      posicionEnRanking:
        result.object.evaluacion_hipotesis.posicion_en_ranking,
    },
    modelUsed: modelId,
    latencyMs: Date.now() - t0,
    tokensInput: result.usage?.inputTokens,
    tokensOutput: result.usage?.outputTokens,
  };
}
