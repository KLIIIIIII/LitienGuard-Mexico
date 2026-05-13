-- LitienGuard — Vincular reserva pública al padrón del médico.
--
-- Antes: cuando un paciente reservaba via /agendar/[slug], la cita
-- se creaba con paciente_email como string pero el campo paciente_id
-- quedaba NULL. Esto significaba que el doctor veía la cita pero
-- NO se vinculaba al padrón de pacientes (creado por import CSV o
-- manual). Resultado:
--   - 2 entidades separadas si el paciente ya existía en el padrón
--   - El trigger citas_sync_paciente_ultima_consulta NO se disparaba
--   - El recall de pacientes inactivos NO incluía a los que reservaban
--     por la página pública
--
-- Esta migration actualiza crear_cita_publica para:
--   1. Buscar paciente existente por (medico_id, email)
--   2. Si existe: vincular paciente_id de la cita
--   3. Si NO existe: crear paciente nuevo en el padrón con etiqueta
--      "auto-booking" para que el doctor sepa que vino por la
--      página pública (no fue creado manual ni vía CSV)

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
  v_paciente_id uuid;
  v_email_normalizado text;
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

  -- Validate workday + working hours (Mexico City local time)
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

  -- Conflict check
  select count(*) into v_conflict_count
    from public.citas
    where medico_id = v_medico_id
      and status in ('agendada', 'confirmada')
      and fecha_inicio < p_fecha_fin
      and fecha_fin > p_fecha_inicio;

  if v_conflict_count > 0 then
    raise exception 'BOOKING_CONFLICT' using errcode = 'check_violation';
  end if;

  -- ============================================================
  -- NUEVO: vincular al padrón del médico
  -- ============================================================
  v_email_normalizado := lower(trim(p_paciente_email));

  -- 1. Buscar paciente existente por (medico_id, email)
  select id into v_paciente_id
    from public.pacientes
    where medico_id = v_medico_id
      and lower(email) = v_email_normalizado
    limit 1;

  -- 2. Si NO existe, crearlo en el padrón con etiqueta 'auto-booking'
  if v_paciente_id is null then
    insert into public.pacientes (
      medico_id, nombre, apellido_paterno, apellido_materno,
      email, telefono, etiquetas, activo
    ) values (
      v_medico_id, p_paciente_nombre, p_paciente_apellido_paterno,
      p_paciente_apellido_materno, v_email_normalizado, p_paciente_telefono,
      array['auto-booking']::text[], true
    ) returning id into v_paciente_id;
  end if;

  -- 3. Insert cita con paciente_id ya vinculado al padrón
  insert into public.citas (
    medico_id, paciente_id, paciente_nombre, paciente_apellido_paterno,
    paciente_apellido_materno, paciente_email, paciente_telefono,
    fecha_inicio, fecha_fin, motivo, status, created_via
  ) values (
    v_medico_id, v_paciente_id, p_paciente_nombre, p_paciente_apellido_paterno,
    p_paciente_apellido_materno, v_email_normalizado, p_paciente_telefono,
    p_fecha_inicio, p_fecha_fin, p_motivo, 'agendada', 'paciente_publico'
  ) returning id into v_new_id;

  cita_id := v_new_id;
  return next;
end;
$$;

grant execute on function public.crear_cita_publica to anon, authenticated;

comment on function public.crear_cita_publica is
  'RPC pública para crear cita desde /agendar/[slug]. Vincula automáticamente al padrón del médico — si el paciente ya existe (por email), reusa el ID; si no, crea fila nueva con etiqueta auto-booking para que el doctor sepa que vino por la página pública.';
