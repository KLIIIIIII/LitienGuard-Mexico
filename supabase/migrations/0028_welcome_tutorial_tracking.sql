-- LitienGuard — Tracking del mini-tutorial post-onboarding.
--
-- Después del modal de selección de perfil (profile_type), el médico
-- ve un tour de 5-6 slides explicando las features clave. El tour:
--   - Es skippable desde el primer click
--   - Se puede repetir desde /dashboard/configuracion o /mi-plan
--   - Solo aparece automáticamente la 1era vez
--
-- 2 columnas separadas para distinguir entre completed (vio todos
-- los slides) y skipped (cerró antes). Útil para métricas — si
-- mucha gente skippea sin ver, el tour es muy largo o malo.

alter table public.profiles
  add column if not exists welcome_tutorial_completed_at timestamptz;

alter table public.profiles
  add column if not exists welcome_tutorial_skipped_at timestamptz;

comment on column public.profiles.welcome_tutorial_completed_at is
  'Timestamp cuando el medico completó todos los slides del tour de bienvenida. NULL = no lo ha visto o lo skipeó.';

comment on column public.profiles.welcome_tutorial_skipped_at is
  'Timestamp si el médico cerró el tour sin completarlo. Si se repite manualmente desde configuración y lo completa, este campo NO se borra (queda como evidencia del primer comportamiento).';
