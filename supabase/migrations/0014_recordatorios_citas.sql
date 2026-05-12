-- LitienGuard — Recordatorios automáticos de citas
--
-- Permite que el cron diario envíe recordatorios 24h antes de cada cita
-- agendada/confirmada. Incluye un token criptográfico para la cancelación
-- desde el correo (sin requerir sesión del paciente) y un trigger que
-- limpia el estado del recordatorio si la cita se reagenda.

-- 1) Token de acción del paciente (cancelación desde email)
alter table public.citas
  add column if not exists patient_token text;

-- Pre-poblar tokens para citas existentes que aún no terminan, usando un
-- random hex de 32 chars (128 bits de entropía).
update public.citas
   set patient_token = encode(extensions.gen_random_bytes(16), 'hex')
 where patient_token is null
   and status in ('agendada', 'confirmada')
   and fecha_inicio > now();

create unique index if not exists citas_patient_token_idx
  on public.citas(patient_token)
  where patient_token is not null;

-- 2) Trigger: asignar token automáticamente al crear cita
create or replace function public.citas_set_patient_token()
returns trigger language plpgsql as $$
begin
  if new.patient_token is null then
    new.patient_token := encode(extensions.gen_random_bytes(16), 'hex');
  end if;
  return new;
end;
$$;

drop trigger if exists citas_assign_token on public.citas;
create trigger citas_assign_token
  before insert on public.citas
  for each row execute function public.citas_set_patient_token();

-- 3) Trigger: si la cita se reagenda (cambia fecha_inicio o fecha_fin),
--    limpiar los flags de recordatorio para que se vuelva a notificar.
create or replace function public.citas_reset_recordatorios_on_reschedule()
returns trigger language plpgsql as $$
begin
  if (new.fecha_inicio is distinct from old.fecha_inicio)
     or (new.fecha_fin is distinct from old.fecha_fin) then
    new.recordatorio_24h_enviado_at := null;
    new.recordatorio_1h_enviado_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists citas_reset_recordatorios on public.citas;
create trigger citas_reset_recordatorios
  before update on public.citas
  for each row execute function public.citas_reset_recordatorios_on_reschedule();
