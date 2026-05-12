/**
 * Extracción automatizada de findings clínicos desde texto libre (H&P,
 * transcripción de scribe, notas a mano OCR-eadas).
 *
 * Llama a un LLM con la lista completa de findings del knowledge base
 * + el texto del médico. El LLM clasifica cada finding como:
 *   - presente: mencionado y observado
 *   - ausente: explícitamente negado / descartado
 *   - null (no mencionado): el texto no aporta evidencia
 *
 * Cada extracción incluye la frase verbatim del texto que la justifica,
 * para que el médico revise y corrija antes de aceptar.
 */

import { generateObject } from "ai";
import { z } from "zod";
import { FINDINGS } from "./knowledge-base";

const ExtractionSchema = z.object({
  extractions: z.array(
    z.object({
      finding_id: z
        .string()
        .describe("ID exacto del finding según el catálogo proporcionado"),
      present: z
        .enum(["si", "no", "no_mencionado"])
        .describe(
          "si = mencionado como presente, no = explícitamente negado, no_mencionado = sin evidencia en el texto",
        ),
      confidence: z
        .enum(["alta", "media", "baja"])
        .describe(
          "Confianza en la extracción según claridad del texto. Si no_mencionado, usar baja.",
        ),
      evidence: z
        .string()
        .describe(
          "Frase verbatim del texto que justifica. Vacío si no_mencionado.",
        ),
    }),
  ),
});

export interface ExtractedFinding {
  finding_id: string;
  present: boolean | null;
  confidence: "alta" | "media" | "baja";
  evidence: string;
}

export interface ExtractionResult {
  extractions: ExtractedFinding[];
  modelUsed: string;
  tokensInput?: number;
  tokensOutput?: number;
  latencyMs: number;
}

function buildFindingsCatalog(): string {
  const byCategory = new Map<string, typeof FINDINGS>();
  for (const f of FINDINGS) {
    const list = byCategory.get(f.category) ?? [];
    list.push(f);
    byCategory.set(f.category, list);
  }
  const CAT_LABELS: Record<string, string> = {
    ecg: "ECG",
    echo: "Ecocardiograma",
    lab: "Laboratorios",
    history: "Historia clínica",
    exam: "Examen físico",
    genetic: "Genética",
  };
  const lines: string[] = [];
  for (const [cat, list] of byCategory.entries()) {
    lines.push(`## ${CAT_LABELS[cat] ?? cat}`);
    for (const f of list) {
      lines.push(
        `- \`${f.id}\` · **${f.label}**${f.detail ? ` — ${f.detail}` : ""}`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

const SYSTEM_PROMPT = `Eres un asistente clínico que extrae findings semioiológicos desde texto libre (historia clínica, transcripción de consulta, notas a mano).

Tu tarea: para CADA finding del catálogo, decidir si está PRESENTE, AUSENTE, o NO MENCIONADO en el texto proporcionado.

Reglas estrictas:
1. **PRESENTE** solo si el texto menciona el hallazgo o un sinónimo claro. Ej: "PR de 110 ms" → ecg-short-pr presente.
2. **AUSENTE** solo si el texto lo niega explícitamente o el estudio se hizo y salió negativo. Ej: "PYP scan grado 0" → lab-pyp-scan-positive ausente.
3. **NO MENCIONADO** si el texto no aporta evidencia. NUNCA inferir presencia o ausencia de hallazgos no mencionados.
4. La evidencia debe ser una frase verbatim del texto (cortada, sin reescribir). Si no_mencionado, evidence vacío.
5. NO inventes findings que no estén en el catálogo. NO uses IDs distintos a los del catálogo.
6. NO diagnostiques ni recomiendes. Solo extrae.
7. Si hay ambigüedad clínica (ej. "engrosamiento septal" sin medida), marca como presente con confianza baja.

Output: array de extractions con un objeto por CADA finding del catálogo (incluye los no_mencionado).`;

export async function extractFindings(
  clinicalText: string,
): Promise<ExtractionResult> {
  if (!clinicalText || clinicalText.trim().length < 20) {
    throw new Error(
      "El texto clínico debe tener al menos 20 caracteres con contenido relevante.",
    );
  }
  if (clinicalText.length > 8000) {
    throw new Error(
      "El texto excede 8000 caracteres. Recórtalo a las secciones clínicas relevantes.",
    );
  }

  const catalog = buildFindingsCatalog();

  const modelId = process.env.LITIENGUARD_EXTRACT_MODEL ?? "anthropic/claude-sonnet-4-6";
  const t0 = Date.now();

  const result = await generateObject({
    model: modelId,
    schema: ExtractionSchema,
    system: SYSTEM_PROMPT,
    prompt: `# Catálogo de findings

${catalog}

# Texto clínico del paciente

\`\`\`
${clinicalText}
\`\`\`

Extrae el estado de CADA finding del catálogo. Recuerda: usa el ID exacto del catálogo, evidence verbatim del texto, no inventes hallazgos no mencionados.`,
    temperature: 0.1,
  });

  const latencyMs = Date.now() - t0;

  const validIds = new Set(FINDINGS.map((f) => f.id));
  const extractions: ExtractedFinding[] = result.object.extractions
    .filter((e) => validIds.has(e.finding_id))
    .map((e) => ({
      finding_id: e.finding_id,
      present:
        e.present === "si" ? true : e.present === "no" ? false : null,
      confidence: e.confidence,
      evidence: e.evidence.trim(),
    }));

  return {
    extractions,
    modelUsed: modelId,
    tokensInput: result.usage?.inputTokens,
    tokensOutput: result.usage?.outputTokens,
    latencyMs,
  };
}
