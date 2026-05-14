-- Registra cuándo el médico aceptó la obligación de obtener
-- consentimiento informado de sus pacientes antes de almacenar sus datos.
-- NULL = no ha aceptado todavía (features de pacientes quedan bloqueadas).

alter table public.profiles
  add column if not exists consentimiento_pacientes_at timestamptz default null;

comment on column public.profiles.consentimiento_pacientes_at is
  'Timestamp en que el médico confirmó que informará a sus pacientes antes de registrar sus datos. NULL = no aceptado.';
