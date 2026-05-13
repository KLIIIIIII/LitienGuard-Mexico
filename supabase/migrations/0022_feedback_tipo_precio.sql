-- LitienGuard — Agrega 'precio' al enum feedback_tipo.
--
-- Necesario para que la encuesta proactiva de pricing (que aparece
-- al 3er día de uso de un piloto) pueda guardarse en la tabla
-- public.feedback con tipo dedicado y filtrarse aparte en
-- /admin/feedback.
--
-- IMPORTANTE: como con 'esencial' en subscription_tier, PostgreSQL
-- exige que ALTER TYPE ADD VALUE corra solo, antes de la migration
-- que lo usa (0023_pricing_survey_profile_fields.sql).

alter type feedback_tipo add value if not exists 'precio';
