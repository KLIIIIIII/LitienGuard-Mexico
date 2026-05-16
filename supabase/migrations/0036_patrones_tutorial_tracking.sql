-- =============================================================
-- 0036_patrones_tutorial_tracking.sql
-- Tracking del onboarding interactivo de /dashboard/diferencial/patrones.
--
-- /patrones tiene dos componentes nuevos que requieren un tour
-- la primera vez que el médico entra:
--   - "Tus patrones": detección automática desde la data del médico
--     (diagnósticos frecuentes, co-ocurrencia, PPV personal, overrides).
--   - "Referencia académica": catálogo canónico curado.
--
-- 2 columnas separadas (completed / skipped) — mismo patrón que
-- welcome_tutorial. Útil para métricas: si mucha gente skippea
-- sin ver, el tour es muy largo o malo.
-- =============================================================

alter table public.profiles
  add column if not exists patrones_tutorial_completed_at timestamptz;

alter table public.profiles
  add column if not exists patrones_tutorial_skipped_at timestamptz;

comment on column public.profiles.patrones_tutorial_completed_at is
  'Timestamp cuando el medico completó el tour de /patrones. NULL = no lo ha visto o lo skipeó.';

comment on column public.profiles.patrones_tutorial_skipped_at is
  'Timestamp si el medico cerró el tour de /patrones sin completarlo. No se borra si se repite y completa después.';
