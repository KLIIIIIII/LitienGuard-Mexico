-- =============================================================
-- 0042_find_similar_consultas_rpc.sql
-- RPC para búsqueda por similitud coseno en consulta_embeddings.
-- Usado por el patient memory layer (D3).
--
-- security definer + filtro medico_id explícito — el cliente NO puede
-- ver embeddings de otros médicos aunque pase otro medico_id porque
-- la función fuerza el filtro.
-- =============================================================

create or replace function public.find_similar_consultas(
  p_medico_id uuid,
  p_query_embedding text,
  p_limit int default 5
)
returns table (
  id uuid,
  source_type text,
  source_id uuid,
  content_preview text,
  similarity float,
  created_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  -- Solo permitir consulta sobre embeddings propios del usuario actual
  if auth.uid() is null or auth.uid() <> p_medico_id then
    raise exception 'forbidden';
  end if;

  return query
  select
    e.id,
    e.source_type,
    e.source_id,
    e.content_preview,
    1 - (e.embedding <=> p_query_embedding::vector) as similarity,
    e.created_at
  from public.consulta_embeddings e
  where e.medico_id = p_medico_id
    and e.embedding is not null
  order by e.embedding <=> p_query_embedding::vector
  limit p_limit;
end;
$$;

grant execute on function public.find_similar_consultas(uuid, text, int) to authenticated;
