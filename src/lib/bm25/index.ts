import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { decryptField } from "@/lib/encryption";
import { embed } from "ai";
import { buildIndex, search, type BM25Index, type CerebroDoc, type CerebroHit } from "./bm25";

const CACHE_TTL_MS = 60_000; // 1 minute — admin edits propagate quickly.

let cached: { index: BM25Index; loadedAt: number } | null = null;

async function loadDocs(): Promise<CerebroDoc[]> {
  const admin = getSupabaseAdmin();
  const supa = admin ?? (await createSupabaseServer());
  const { data, error } = await supa
    .from("cerebro_chunks")
    .select("id,source,page,title,content,meta,tipo,embedding")
    .eq("is_active", true);

  if (error) {
    console.error("[cerebro] load error:", error);
    return [];
  }

  type Row = {
    id: string;
    source: string;
    page: string;
    title: string;
    content: string;
    meta: Record<string, string> | null;
    tipo: "evidencia_academica" | "practica_observada" | null;
    embedding: number[] | string | null;
  };

  function parseEmbedding(e: number[] | string | null): number[] | undefined {
    if (e === null || e === undefined) return undefined;
    if (Array.isArray(e)) return e;
    // pgvector retorna como string "[0.1,0.2,...]" via supabase-js
    try {
      const parsed = JSON.parse(e);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  // content está cifrado (0033) — descifrar al cargar. decryptField
  // pasa-through los rows legacy con texto plano.
  const decrypted = await Promise.all(
    (data as Row[]).map(async (d) => ({
      id: d.id,
      source: d.source,
      page: d.page,
      title: d.title,
      content: (await decryptField(d.content)) ?? "",
      meta: d.meta ?? undefined,
      tipo: d.tipo ?? "evidencia_academica",
      embedding: parseEmbedding(d.embedding),
    })),
  );
  return decrypted;
}

export async function getCerebroIndex(): Promise<BM25Index> {
  const now = Date.now();
  if (cached && now - cached.loadedAt < CACHE_TTL_MS) return cached.index;
  const docs = await loadDocs();
  const index = buildIndex(docs);
  cached = { index, loadedAt: now };
  return index;
}

export async function searchCerebro(
  query: string,
  k: number = 5,
): Promise<CerebroHit[]> {
  const idx = await getCerebroIndex();
  return search(idx, query, k);
}

// =============================================================
// D6 — Hybrid retrieval: BM25 + vector re-rank con RRF.
// =============================================================

const EMBED_MODEL =
  process.env.LITIENGUARD_EMBED_MODEL ?? "openai/text-embedding-3-small";
const RRF_K = 60; // constante estándar para Reciprocal Rank Fusion
const BM25_CANDIDATES = 30; // top BM25 a re-rankear con vector

function cosineSim(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Búsqueda híbrida BM25 + vector re-rank.
 *
 *   1. BM25 retrieve top 30 candidatos in-memory (rápido)
 *   2. Genera embedding del query (~50-100ms)
 *   3. Cosine similarity vs embeddings de esos 30
 *   4. Combina con RRF: score = 1/(60 + rank_bm25) + 1/(60 + rank_vec)
 *   5. Top k por combined score
 *
 * Si el query embedding falla o ningún candidato tiene embedding, cae
 * back a BM25 puro.
 */
export async function searchCerebroHybrid(
  query: string,
  k: number = 5,
): Promise<CerebroHit[]> {
  const idx = await getCerebroIndex();
  const bm25Hits = search(idx, query, BM25_CANDIDATES);
  if (bm25Hits.length === 0) return [];

  // Si NO hay chunks con embedding, cae back a BM25 puro
  const candidatesWithEmbed = bm25Hits.filter(
    (h) => h.doc.embedding && h.doc.embedding.length > 0,
  );
  if (candidatesWithEmbed.length === 0) {
    return bm25Hits.slice(0, k);
  }

  // Generar embedding del query (best-effort)
  let queryEmbed: number[] | null = null;
  try {
    const result = await embed({
      model: EMBED_MODEL,
      value: query.slice(0, 8000),
    });
    queryEmbed = result.embedding;
  } catch (e) {
    console.warn("[cerebro hybrid] embed query failed:", e);
  }

  if (!queryEmbed) {
    // No pudimos embed el query — BM25 puro
    return bm25Hits.slice(0, k);
  }

  // Calcular similitud vector para los 30 candidatos
  const withVecScore = bm25Hits.map((h) => ({
    hit: h,
    vecSim: h.doc.embedding
      ? cosineSim(queryEmbed!, h.doc.embedding)
      : -1,
  }));

  // Ranks BM25 ya están dados por orden de bm25Hits (0 = mejor)
  const bm25Rank = new Map<string, number>();
  bm25Hits.forEach((h, i) => bm25Rank.set(h.doc.id, i));

  // Rank por vector (descendente — mayor similitud = mejor)
  const vecSorted = [...withVecScore].sort((a, b) => b.vecSim - a.vecSim);
  const vecRank = new Map<string, number>();
  vecSorted.forEach((entry, i) => {
    if (entry.vecSim > 0) vecRank.set(entry.hit.doc.id, i);
  });

  // Combinar con RRF
  const combined = withVecScore.map((entry) => {
    const rBm25 = bm25Rank.get(entry.hit.doc.id) ?? 999;
    const rVec = vecRank.get(entry.hit.doc.id) ?? 999;
    const rrf =
      1 / (RRF_K + rBm25) + (entry.vecSim > 0 ? 1 / (RRF_K + rVec) : 0);
    return { ...entry.hit, score: rrf };
  });

  combined.sort((a, b) => b.score - a.score);
  return combined.slice(0, k);
}

export async function corpusStats() {
  const idx = await getCerebroIndex();
  return {
    docs: idx.N,
    avgLength: Math.round(idx.avgLength),
  };
}

export function invalidateCerebroCache() {
  cached = null;
}
