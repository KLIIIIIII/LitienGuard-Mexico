import { CEREBRO_CORPUS } from "./corpus";
import { buildIndex, search, type BM25Index, type CerebroHit } from "./bm25";

let cached: BM25Index | null = null;

function getIndex(): BM25Index {
  if (!cached) cached = buildIndex(CEREBRO_CORPUS);
  return cached;
}

export function searchCerebro(query: string, k = 5): CerebroHit[] {
  return search(getIndex(), query, k);
}

export function corpusStats() {
  const idx = getIndex();
  return {
    docs: idx.N,
    avgLength: Math.round(idx.avgLength),
  };
}
