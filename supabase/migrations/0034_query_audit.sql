-- =============================================================
-- 0034_query_audit.sql
-- Audit forense de queries al diferencial y al cerebro — Fase A3.
--
-- Cada llamada autenticada a procesarCasoCompleto y a buscarCerebro
-- deja registro en query_audit con:
--   - hash de la query (sin contenido — no guardamos PHI)
--   - watermark único de la respuesta (para forense si se filtra)
--   - métricas para detección de scraping (latencia, tamaño,
--     repetición)
--
-- THREAT MODEL — esta tabla resuelve:
--   ✓ Scraping autenticado: query_audit_user_time permite detectar
--     usuarios con >N queries en una ventana.
--   ✓ Identificación post-leak: si se descubre una copia con
--     watermarks _wm específicos, query_audit_watermark mapea
--     directo al user_id y timestamp.
--   ✓ Forense de incidentes: trazabilidad ip/ua/tier.
--   No resuelve: insider con acceso a la app, agente humano lento
--   que copy-paste manualmente.
-- =============================================================

create table if not exists public.query_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in (
    'diferencial.procesar',
    'cerebro.buscar'
  )),
  -- SHA-256 truncado de la query — para detectar repeticiones sin
  -- guardar el contenido (PHI / datos clínicos del paciente).
  query_hash text not null,
  query_length int not null,
  response_count int not null default 0,
  -- Watermark único de la respuesta (campo _wm en el JSON serializado).
  -- Si aparece en un dump externo, mapea al user_id y timestamp.
  response_watermark text not null,
  ip text,
  user_agent text,
  tier text,
  latency_ms int,
  created_at timestamptz default now()
);

create index if not exists query_audit_user_time_idx
  on public.query_audit(user_id, created_at desc);
create index if not exists query_audit_watermark_idx
  on public.query_audit(response_watermark);
create index if not exists query_audit_action_time_idx
  on public.query_audit(action, created_at desc);

alter table public.query_audit enable row level security;

-- Solo admins leen. Inserts via service_role (server actions).
drop policy if exists "admin read query_audit" on public.query_audit;
create policy "admin read query_audit"
  on public.query_audit for select
  using (public.is_admin());

comment on table public.query_audit is
  'Audit forense de queries al diferencial/cerebro. Registra hash + watermark de respuesta para investigar leaks y detectar scraping. NO contiene PHI.';
