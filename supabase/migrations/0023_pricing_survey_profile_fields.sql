-- LitienGuard — Campos para tracking de encuesta proactiva de pricing.
--
-- 3 columnas en profiles para evitar mostrar el pop-up múltiples veces:
--   - pricing_survey_shown_at: cuándo se mostró el pop-up al usuario
--   - pricing_survey_answered_at: cuándo respondió (si lo hizo)
--   - pricing_survey_dismissed_at: cuándo lo cerró sin responder
--
-- La lógica de mostrar el pop-up:
--   IF days_since_created_at >= 3
--     AND pricing_survey_answered_at IS NULL
--     AND pricing_survey_dismissed_at IS NULL
--     AND subscription_tier IN ('pilot', 'esencial')
--   THEN show modal
--
-- El usuario puede aplazar (dismissed_at retrasa 7 días) o
-- responder (queda guardado en public.feedback con tipo='precio').

alter table public.profiles
  add column if not exists pricing_survey_shown_at timestamptz,
  add column if not exists pricing_survey_answered_at timestamptz,
  add column if not exists pricing_survey_dismissed_at timestamptz;

create index if not exists profiles_pricing_survey_eligible_idx
  on public.profiles(created_at)
  where pricing_survey_answered_at is null
    and pricing_survey_dismissed_at is null;

comment on column public.profiles.pricing_survey_shown_at is
  'Marca cuando el modal de encuesta proactiva de precios fue desplegado en el navegador del usuario.';
comment on column public.profiles.pricing_survey_answered_at is
  'Si el usuario respondió la encuesta, fecha de respuesta. La respuesta vive en public.feedback con tipo=precio.';
comment on column public.profiles.pricing_survey_dismissed_at is
  'Si el usuario cerró sin responder. El modal vuelve a aparecer 7 días después o nunca, según política.';
