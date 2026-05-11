import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { buildIndex, search, type BM25Index, type CerebroDoc, type CerebroHit } from "./bm25";

const CACHE_TTL_MS = 60_000; // 1 minute — admin edits propagate quickly.

let cached: { index: BM25Index; loadedAt: number } | null = null;

async function loadDocs(): Promise<CerebroDoc[]> {
  // Prefer admin client when available (server-side route handlers and
  // server actions); falls back to the user-context client for SSR.
  const admin = getSupabaseAdmin();
  const supa = admin ?? (await createSupabaseServer());
  const { data, error } = await supa
    .from("cerebro_chunks")
    .select("id,source,page,title,content,meta")
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
  };
  return (data as Row[]).map((d) => ({
    id: d.id,
    source: d.source,
    page: d.page,
    title: d.title,
    content: d.content,
    meta: d.meta ?? undefined,
  }));
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
