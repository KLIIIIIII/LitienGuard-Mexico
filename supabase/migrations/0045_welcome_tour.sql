-- Welcome tour interactivo (spotlight sobre elementos del dashboard).
--
-- Distinto al welcome_tutorial existente (que son slides en modal).
-- Este tour guía al médico por la UI real con spotlight + tooltip.
-- Por eso necesita su propio flag de completado / skippeado.

alter table public.profiles
  add column if not exists welcome_tour_completed_at timestamptz;

alter table public.profiles
  add column if not exists welcome_tour_skipped_at timestamptz;

comment on column public.profiles.welcome_tour_completed_at is
  'Timestamp cuando el medico completó el tour interactivo del dashboard (spotlight sobre elementos reales). Diferente al welcome_tutorial que son slides modales.';

comment on column public.profiles.welcome_tour_skipped_at is
  'Timestamp cuando saltó el tour interactivo sin completarlo. No se borra al reset.';
