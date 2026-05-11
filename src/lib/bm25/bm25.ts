/**
 * Minimal BM25 search engine.
 * Designed for medical-guide corpora in Spanish (with Spanish stopwords +
 * accent folding). Single-document collection per process — fine for piloto
 * scale (~100 chunks). Migrate to Cloudflare Workers + Vectorize when the
 * corpus crosses 5–10k chunks or query latency exceeds 500ms.
 */

const K1 = 1.5;
const B = 0.75;

// Compact Spanish stopword set — keeps clinical terms intact.
const STOPWORDS = new Set([
  "a", "al", "ante", "antes", "aqui", "asi", "aun", "aunque", "bajo", "bien",
  "cada", "cierta", "ciertas", "cierto", "ciertos", "como", "con", "contra",
  "cual", "cuales", "cualquier", "cuando", "cuanto", "de", "del", "desde",
  "donde", "dos", "el", "ella", "ellas", "ellos", "en", "entre", "era",
  "eran", "es", "esa", "esas", "ese", "esos", "esta", "estaba", "estan",
  "estar", "este", "estos", "fue", "fueron", "ha", "han", "hasta", "hay",
  "la", "las", "le", "les", "lo", "los", "mas", "me", "mi", "mis", "mismo",
  "muy", "ni", "no", "nos", "nuestra", "nuestro", "o", "otra", "otras",
  "otro", "otros", "para", "pero", "poco", "por", "porque", "puede", "que",
  "quien", "quienes", "se", "sea", "ser", "si", "sin", "sobre", "solo",
  "son", "su", "sus", "tal", "tambien", "tanto", "te", "tiene", "tienen",
  "todo", "todos", "tu", "tus", "un", "una", "unas", "uno", "unos", "y",
  "ya", "yo",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

export interface CerebroDoc {
  id: string;
  source: string;
  page: string;
  title: string;
  content: string;
  /** Optional metadata for filtering / display (e.g. specialty, year). */
  meta?: Record<string, string>;
}

export interface BM25Index {
  docs: CerebroDoc[];
  docById: Map<string, CerebroDoc>;
  /** Per-doc term frequencies */
  tf: Map<string, Map<string, number>>;
  /** Document frequency per term (in how many docs the term appears) */
  df: Map<string, number>;
  /** Length (in tokens) per doc */
  length: Map<string, number>;
  /** Average doc length */
  avgLength: number;
  /** Total doc count */
  N: number;
}

export function buildIndex(docs: CerebroDoc[]): BM25Index {
  const tf = new Map<string, Map<string, number>>();
  const df = new Map<string, number>();
  const length = new Map<string, number>();
  const docById = new Map<string, CerebroDoc>();
  let totalLen = 0;

  for (const doc of docs) {
    docById.set(doc.id, doc);
    const tokens = tokenize(`${doc.title} ${doc.content}`);
    length.set(doc.id, tokens.length);
    totalLen += tokens.length;

    const counts = new Map<string, number>();
    for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
    tf.set(doc.id, counts);

    for (const term of counts.keys()) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  return {
    docs,
    docById,
    tf,
    df,
    length,
    avgLength: docs.length === 0 ? 0 : totalLen / docs.length,
    N: docs.length,
  };
}

export interface CerebroHit {
  doc: CerebroDoc;
  score: number;
  /** Token-level snippet around the best matching region */
  snippet: string;
}

export function search(
  index: BM25Index,
  query: string,
  k: number = 5,
): CerebroHit[] {
  const qTerms = tokenize(query);
  if (qTerms.length === 0 || index.N === 0) return [];

  const scores = new Map<string, number>();

  for (const term of qTerms) {
    const dfT = index.df.get(term) ?? 0;
    if (dfT === 0) continue;
    const idf = Math.log(
      1 + (index.N - dfT + 0.5) / (dfT + 0.5),
    );
    for (const [docId, tfCounts] of index.tf) {
      const tfT = tfCounts.get(term);
      if (!tfT) continue;
      const dl = index.length.get(docId) ?? 0;
      const denom =
        tfT + K1 * (1 - B + (B * dl) / Math.max(1, index.avgLength));
      const contribution = idf * ((tfT * (K1 + 1)) / denom);
      scores.set(docId, (scores.get(docId) ?? 0) + contribution);
    }
  }

  const ranked: CerebroHit[] = [];
  for (const [docId, score] of scores) {
    const doc = index.docById.get(docId);
    if (!doc) continue;
    ranked.push({ doc, score, snippet: buildSnippet(doc.content, qTerms) });
  }
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, k);
}

function buildSnippet(
  content: string,
  qTerms: string[],
  windowChars = 220,
): string {
  if (!content) return "";
  const lc = content.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  let bestIdx = -1;
  for (const term of qTerms) {
    const idx = lc.indexOf(term);
    if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) bestIdx = idx;
  }
  if (bestIdx === -1) return content.slice(0, windowChars) + (content.length > windowChars ? "…" : "");
  const start = Math.max(0, bestIdx - Math.floor(windowChars / 2));
  const end = Math.min(content.length, start + windowChars);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < content.length ? "…" : "";
  return prefix + content.slice(start, end) + suffix;
}
