-- =============================================================
-- 0043_cerebro_embeddings.sql
-- D6 — cerebro v2 con embeddings semánticos + re-rank híbrido.
--
-- BM25 puro tiene techo en queries con sinónimos / paráfrasis ("falla
-- cardíaca" vs "insuficiencia cardíaca", "pre-diabetes" vs "intolerancia
-- glucosa", etc). Embeddings semánticos capturan eso. La estrategia:
--   1. BM25 retrieve top 30 candidatos (rápido, in-memory)
--   2. Re-rank con cosine similarity sobre los embeddings de esos 30
--   3. Combinar con RRF (Reciprocal Rank Fusion)
--
-- Beneficio: queries en español natural se vuelven mucho más permisivas
-- sin perder la velocidad del BM25.
-- =============================================================

-- pgvector ya está habilitado (0041). No-op si re-ejecutamos.
create extension if not exists vector;

alter table public.cerebro_chunks
  add column if not exists embedding vector(1536);

comment on column public.cerebro_chunks.embedding is
  'D6 — embedding text-embedding-3-small (1536 dim) del campo content. Usado para hybrid retrieval (BM25 + vector re-rank). Generado por scripts/embed-cerebro-chunks.mjs.';

create index if not exists cerebro_chunks_embedding_idx
  on public.cerebro_chunks
  using hnsw (embedding vector_cosine_ops)
  where embedding is not null;
