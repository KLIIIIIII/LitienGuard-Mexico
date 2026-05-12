-- LitienGuard — Public patient self-booking
-- Permite que pacientes agenden directamente desde una página pública
-- (sin autenticación, sin suscripción) en el calendario de un médico que
-- haya activado explícitamente la reservación pública.

-- 1) Configuración de booking en profiles
alter table public.profiles
  add column if not exists booking_slug text unique,
  add column if not exists accepts_public_bookings boolean default false,
  add column if not exists booking_workdays int[] default '{1,2,3,4,5}',
    -- 1=Mon, 7=Sun (ISO 8601 weekday)
  add column if not exists booking_hour_start int default 9
    check (booking_hour_start >= 0 and booking_hour_start <= 22),
  add column if not exists booking_hour_end int default 18
    check (booking_hour_end >= 1 and booking_hour_end <= 23),
  add column if not exists booking_slot_minutes int default 30
    check (booking_slot_minutes in (15, 20, 30, 45, 60)),
  add column if not exists booking_advance_days int default 14
    check (booking_advance_days >= 1 and booking_advance_days <= 60),
  add column if not exists booking_bio text;

create index if not exists profiles_booking_slug_idx on public.profiles(booking_slug);
create index if not exists profiles_accepts_public_bookings_idx
  on public.profiles(accepts_public_bookings)
  where accepts_public_bookings = true;

-- 2) Permitir lectura pública de los campos mínimos de booking de
--    médicos que aceptan reservación pública
drop policy if exists "public reads booking-enabled medicos" on public.profiles;
create policy "public reads booking-enabled medicos"
  on public.profiles for select
  using (accepts_public_bookings = true);

-- 3) Marcar quién creó la cita (médico vs reserva pública)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'cita_origen') then
    create type cita_origen as enum ('medico', 'paciente_publico');
  end if;
end$$;

alter table public.citas
  add column if not exists created_via cita_origen default 'medico';

-- 4) Permitir lectura pública de slots ocupados (solo fecha_inicio, fecha_fin
--    y status) — necesaria para calcular slots libres SIN exponer datos
--    sensibles. Lo logramos con una vista materializable de columnas
--    seguras, no con una policy sobre la tabla original.
create or replace view public.citas_slots_publicos as
select
  c.medico_id,
  c.fecha_inicio,
  c.fecha_fin,
  c.status
from public.citas c
where c.status in ('agendada', 'confirmada');

grant select on public.citas_slots_publicos to anon, authenticated;

-- 5) RPC para crear una cita desde la página pública. El insert pasa por
--    service_role en el server action, pero esta función permite que el
--    flujo público no tenga que conocer detalles internos de la tabla y
--    valida que el médico realmente acepte reservaciones públicas.
create or replace function public.crear_cita_publica(
  p_booking_slug text,
  p_paciente_nombre text,
  p_paciente_apellido_paterno text,
  p_paciente_apellido_materno text,
  p_paciente_email text,
  p_paciente_telefono text,
  p_fecha_inicio timestamptz,
  p_fecha_fin timestamptz,
  p_motivo text
)
returns table(cita_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_medico_id uuid;
  v_workdays int[];
  v_hour_start int;
  v_hour_end int;
  v_slot_minutes int;
  v_advance_days int;
  v_accepts boolean;
  v_local_dow int;
  v_local_hour int;
  v_local_minute int;
  v_conflict_count int;
  v_new_id uuid;
begin
  -- Lookup médico by slug
  select id, accepts_public_bookings, booking_workdays, booking_hour_start,
         booking_hour_end, booking_slot_minutes, booking_advance_days
    into v_medico_id, v_accepts, v_workdays, v_hour_start, v_hour_end,
         v_slot_minutes, v_advance_days
    from public.profiles
    where booking_slug = p_booking_slug;

  if v_medico_id is null then
    raise exception 'BOOKING_NOT_FOUND' using errcode = 'no_data_found';
  end if;
  if v_accepts is not true then
    raise exception 'BOOKING_DISABLED' using errcode = 'check_violation';
  end if;

  -- Window: must be in the future and within booking_advance_days
  if p_fecha_inicio <= now() then
    raise exception 'BOOKING_PAST' using errcode = 'check_violation';
  end if;
  if p_fecha_inicio > now() + (v_advance_days || ' days')::interval then
    raise exception 'BOOKING_TOO_FAR' using errcode = 'check_violation';
  end if;
  if p_fecha_fin <= p_fecha_inicio then
    raise exception 'BOOKING_BAD_RANGE' using errcode = 'check_violation';
  end if;

  -- Validate workday + working hours (in Mexico City local time, since
  -- doctors set hours assuming local time)
  v_local_dow := extract(isodow from p_fecha_inicio at time zone 'America/Mexico_City');
  v_local_hour := extract(hour from p_fecha_inicio at time zone 'America/Mexico_City');
  v_local_minute := extract(minute from p_fecha_inicio at time zone 'America/Mexico_City');

  if not (v_local_dow = any(v_workdays)) then
    raise exception 'BOOKING_DAY_OFF' using errcode = 'check_violation';
  end if;
  if v_local_hour < v_hour_start or v_local_hour >= v_hour_end then
    raise exception 'BOOKING_OUTSIDE_HOURS' using errcode = 'check_violation';
  end if;
  if (v_local_minute % v_slot_minutes) <> 0 then
    raise exception 'BOOKING_BAD_SLOT' using errcode = 'check_violation';
  end if;

  -- Conflict check: no overlapping cita in agendada/confirmada state
  select count(*) into v_conflict_count
    from public.citas
    where medico_id = v_medico_id
      and status in ('agendada', 'confirmada')
      and fecha_inicio < p_fecha_fin
      and fecha_fin > p_fecha_inicio;

  if v_conflict_count > 0 then
    raise exception 'BOOKING_CONFLICT' using errcode = 'check_violation';
  end if;

  -- Insert cita
  insert into public.citas (
    medico_id, paciente_nombre, paciente_apellido_paterno,
    paciente_apellido_materno, paciente_email, paciente_telefono,
    fecha_inicio, fecha_fin, motivo, status, created_via
  ) values (
    v_medico_id, p_paciente_nombre, p_paciente_apellido_paterno,
    p_paciente_apellido_materno, p_paciente_email, p_paciente_telefono,
    p_fecha_inicio, p_fecha_fin, p_motivo, 'agendada', 'paciente_publico'
  ) returning id into v_new_id;

  cita_id := v_new_id;
  return next;
end;
$$;

grant execute on function public.crear_cita_publica to anon, authenticated;
