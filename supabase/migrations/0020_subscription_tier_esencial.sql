-- LitienGuard — Agrega 'esencial' al enum subscription_tier.
--
-- El enum se creó originalmente en 0004_subscription_tiers.sql con
-- valores ('free', 'pilot', 'pro', 'enterprise'). Después agregamos
-- 'esencial' como tier comercial (MXN 499/mes) en el código TypeScript
-- pero no en la base — esta migration cierra el gap.
--
-- IMPORTANTE: PostgreSQL exige que ALTER TYPE ADD VALUE corra en su
-- propia transacción antes de que el valor pueda usarse en queries o
-- en funciones. Por eso vive en una migration separada y debe
-- aplicarse ANTES que 0021_pacientes.sql (que crea
-- public.can_use_pacientes con `subscription_tier in ('esencial', ...)`).
--
-- Si se intenta correr 0021 antes de esta, falla con:
--   "invalid input value for enum subscription_tier: 'esencial'"

alter type subscription_tier add value if not exists 'esencial';
