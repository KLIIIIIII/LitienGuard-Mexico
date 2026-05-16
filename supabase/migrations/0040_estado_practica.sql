-- =============================================================
-- 0040_estado_practica.sql
-- profiles.estado_practica — permite calibrar el motor bayesiano a la
-- epidemiología del estado donde el médico practica (D5.2).
--
-- Los multiplicadores regionales viven en código
-- (src/lib/inference/epidemio-estados-mx.ts). Esta migración solo
-- agrega la columna + check constraint con los 32 códigos válidos.
-- =============================================================

alter table public.profiles
  add column if not exists estado_practica text;

alter table public.profiles
  drop constraint if exists profiles_estado_practica_check;

alter table public.profiles
  add constraint profiles_estado_practica_check
  check (
    estado_practica is null or estado_practica in (
      'AGS','BC','BCS','CAMP','COAH','COL','CHIS','CHIH','CDMX','DGO',
      'GTO','GRO','HGO','JAL','MEX','MICH','MOR','NAY','NL','OAX',
      'PUE','QRO','QROO','SLP','SIN','SON','TAB','TAMS','TLAX','VER',
      'YUC','ZAC'
    )
  );

comment on column public.profiles.estado_practica is
  'Entidad federativa donde el médico practica. Habilita la calibración regional del motor bayesiano (D5.2 — priors por estado).';
