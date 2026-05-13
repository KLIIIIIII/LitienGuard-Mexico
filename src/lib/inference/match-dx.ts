/**
 * Mapeo del texto libre del médico al catálogo de enfermedades del
 * motor. El médico escribe su hipótesis en lenguaje natural
 * ("amiloidosis cardiaca", "infarto subendocárdico", "Cushing por
 * adenoma") y este módulo identifica el `Disease.id` correspondiente
 * para que el motor bayesiano pueda calcular la probabilidad.
 *
 * Si el texto no matchea con confianza suficiente (umbral 'media+'),
 * devolvemos null — el médico podrá registrar el caso pero sin
 * probabilidad bayesiana específica para su hipótesis.
 */

import { generateObject } from "ai";
import { z } from "zod";
import { DISEASES } from "./knowledge-base";

const MatchSchema = z.object({
  matched_id: z
    .string()
    .nullable()
    .describe(
      "ID exacto del Disease del catálogo. null si no hay match razonable.",
    ),
  confidence: z
    .enum(["alta", "media", "baja"])
    .describe(
      "Alta = match exacto o sinónimo claro. Media = probable match con interpretación. Baja = match débil o ambiguo.",
    ),
  reasoning: z
    .string()
    .describe(
      "Una frase corta explicando por qué este match o por qué null.",
    ),
});

export interface DxMatch {
  matchedId: string | null;
  matchedLabel: string | null;
  confidence: "alta" | "media" | "baja";
  reasoning: string;
}

export async function matchDxToCatalog(text: string): Promise<DxMatch> {
  const cleanText = text.trim();
  if (!cleanText || cleanText.length < 3) {
    return {
      matchedId: null,
      matchedLabel: null,
      confidence: "baja",
      reasoning: "Texto demasiado corto",
    };
  }

  const catalog = DISEASES.map((d) => `- ${d.id}: ${d.label}`).join("\n");

  const result = await generateObject({
    model: "anthropic/claude-sonnet-4-6",
    schema: MatchSchema,
    system: `Eres un asistente clínico que mapea el diagnóstico hipotético escrito por un médico al ID más cercano de un catálogo de 28 enfermedades.

Reglas estrictas:
1. Devuelve el ID **exacto** del catálogo (string entre comillas).
2. Considera sinónimos clínicos comunes (ej. "TIA" → "tia", "AMI" → "ami-stemi", "amiloidosis TR" → "attr-cm").
3. Si el texto se refiere a una enfermedad que NO está en el catálogo, devuelve null. No fuerces matches.
4. Confianza "alta" solo si el match es claramente lo que el médico quiso decir. "Media" si requiere interpretación. "Baja" para matches débiles.
5. NO recomiendes tratamientos. NO añadas información clínica. Solo mapea.`,
    prompt: `# Catálogo de enfermedades del motor

${catalog}

# Texto del médico

"${cleanText}"

Identifica el ID del catálogo que mejor corresponde a la hipótesis del médico. Si el texto se refiere a una enfermedad NO contemplada en el catálogo, devuelve matched_id null.`,
    temperature: 0.1,
  });

  const matched = result.object.matched_id
    ? DISEASES.find((d) => d.id === result.object.matched_id)
    : undefined;

  return {
    matchedId: matched?.id ?? null,
    matchedLabel: matched?.label ?? null,
    confidence: result.object.confidence,
    reasoning: result.object.reasoning,
  };
}
