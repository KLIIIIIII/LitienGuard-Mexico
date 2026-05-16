-- =============================================================
-- 0041_patient_memory_embeddings.sql
-- D3 — Patient memory layer. Embeddings de contextos clínicos
-- para que el cerebro recuerde "tu paciente del 3 de marzo con
-- perfil X" y muestre casos parecidos en la práctica del médico.
--
-- Diseño:
--   · Habilita extensión vector (pgvector).
--   · Tabla consulta_embeddings con un row por diferencial_session
--     guardado. Embedding del contexto_clinico (texto plano, no PHI
--     identificable porque iniciales máx 3 chars).
--   · Index HNSW para búsqueda rápida (cosine similarity).
--   · RLS: médico ve solo sus propios embeddings.
--
-- El embedding se genera al guardar la sesión (server action
-- saveDiferencialSession llamará a embed() del AI SDK).
-- =============================================================

create extension if not exists vector;

create table if not exists public.consulta_embeddings (
  id uuid default gen_random_uuid() primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,
  -- Fuente del embedding — qué tabla y row originó este vector.
  source_type text not null check (source_type in (
    'diferencial_session',
    'nota_scribe'
  )),
  source_id uuid not null,
  -- Preview corto del contenido (primeros 200 chars) — solo para mostrar
  -- "qué caso era" sin tener que descifrar la nota completa.
  content_preview text,
  -- Vector de 1536 dims — text-embedding-3-small de OpenAI.
  embedding vector(1536),
  created_at timestamptz default now()
);

create index if not exists consulta_embeddings_medico_idx
  on public.consulta_embeddings (medico_id, created_at desc);

create index if not exists consulta_embeddings_source_idx
  on public.consulta_embeddings (source_type, source_id);

-- HNSW index para búsqueda por similitud coseno. Es el más rápido para
-- producción; tarda un poco más en construir pero query es O(log n).
create index if not exists consulta_embeddings_vec_idx
  on public.consulta_embeddings
  using hnsw (embedding vector_cosine_ops);

alter table public.consulta_embeddings enable row level security;

drop policy if exists "medico reads own embeddings" on public.consulta_embeddings;
create policy "medico reads own embeddings"
  on public.consulta_embeddings for select
  using (auth.uid() = medico_id);

drop policy if exists "service_role manages embeddings" on public.consulta_embeddings;
create policy "service_role manages embeddings"
  on public.consulta_embeddings for all
  using (false)
  with check (false);

comment on table public.consulta_embeddings is
  'D3 patient memory layer. Embeddings de contextos clínicos para búsqueda de casos similares en la práctica del médico. NO contiene PHI directo — solo embedding vector + preview corto.';
