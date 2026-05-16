/**
 * D3 — Patient memory layer.
 *
 * El cerebro recuerda los casos del médico para que cuando vea uno
 * nuevo similar, le muestre "esto se parece a tu paciente del 3-mar
 * con perfil X". Usa embeddings text-embedding-3-small (1536 dim)
 * indexados en pgvector con HNSW cosine.
 *
 * Privacy:
 *   · Solo guardamos: medico_id, source_type/id, preview corto, vector.
 *   · Iniciales del paciente NO se incluyen en el embedding (las
 *     desfocamos a "paciente" antes de embed).
 *   · RLS: médico solo lee los suyos.
 */

import { embed } from "ai";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const EMBED_MODEL =
  process.env.LITIENGUARD_EMBED_MODEL ?? "openai/text-embedding-3-small";

/**
 * Normaliza texto antes de embed: quita iniciales 1-3 mayúsculas que
 * podrían identificar paciente, reemplaza con "paciente".
 */
function deidentify(text: string): string {
  return text
    .replace(/\b[A-ZÁÉÍÓÚÑ]{1,3}\b/g, "paciente")
    .slice(0, 8000);
}

/**
 * Genera embedding de un texto clínico. Devuelve el vector (1536 dim)
 * o null si falla. Best-effort — no bloquea operación principal.
 */
export async function embedClinicalText(
  text: string,
): Promise<number[] | null> {
  if (!text || text.trim().length < 20) return null;
  try {
    const result = await embed({
      model: EMBED_MODEL,
      value: deidentify(text),
    });
    return result.embedding;
  } catch (e) {
    console.warn("[patient-memory] embed failed:", e);
    return null;
  }
}

interface PersistArgs {
  medicoId: string;
  sourceType: "diferencial_session" | "nota_scribe";
  sourceId: string;
  text: string;
}

/**
 * Best-effort: genera embedding + lo persiste. Nunca lanza.
 */
export async function persistEmbedding(args: PersistArgs): Promise<void> {
  try {
    const supa = getSupabaseAdmin();
    if (!supa) return;
    const embedding = await embedClinicalText(args.text);
    if (!embedding) return;

    const preview = args.text.replace(/\s+/g, " ").trim().slice(0, 200);

    await supa.from("consulta_embeddings").insert({
      medico_id: args.medicoId,
      source_type: args.sourceType,
      source_id: args.sourceId,
      content_preview: preview,
      embedding: JSON.stringify(embedding),
    });
  } catch (e) {
    console.warn("[patient-memory] persist failed:", e);
  }
}

export interface SimilarCase {
  source_type: string;
  source_id: string;
  content_preview: string | null;
  similarity: number;
  created_at: string;
}

/**
 * Busca casos similares al texto query en la práctica del médico.
 * Devuelve top N ordenados por similitud (cosine).
 *
 * Si el embedding falla o no hay casos, devuelve array vacío.
 */
export async function findSimilarCases(
  medicoId: string,
  queryText: string,
  options: { limit?: number; excludeSourceId?: string } = {},
): Promise<SimilarCase[]> {
  const queryEmbed = await embedClinicalText(queryText);
  if (!queryEmbed) return [];

  const supa = getSupabaseAdmin();
  if (!supa) return [];

  const limit = options.limit ?? 5;
  const { data, error } = await supa.rpc("find_similar_consultas", {
    p_medico_id: medicoId,
    p_query_embedding: JSON.stringify(queryEmbed),
    p_limit: limit,
  });

  if (error || !data) {
    console.warn("[patient-memory] search failed:", error);
    return [];
  }

  let results = data as Array<{
    id: string;
    source_type: string;
    source_id: string;
    content_preview: string | null;
    similarity: number;
    created_at: string;
  }>;

  if (options.excludeSourceId) {
    results = results.filter((r) => r.source_id !== options.excludeSourceId);
  }

  return results;
}
