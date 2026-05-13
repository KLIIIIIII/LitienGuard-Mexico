-- =============================================================
-- 0030_consultas_model.sql
-- Modelo de "consulta" como contenedor de artefactos clínicos.
--
-- Antes: el médico gestionaba NOTAS (SOAP), RECETAS y DIFERENCIALES
-- por separado, sin vínculo entre ellos.
-- Ahora: una CONSULTA agrupa los artefactos producidos en un mismo
-- encuentro clínico con un paciente.
--
-- Diseño:
--   - consultas es un objeto nuevo (no afecta el contenido clínico)
--   - notas_scribe, recetas, diferencial_sessions ganan consulta_id
--     (NULLABLE — backwards compat con artefactos huérfanos)
--   - cita_id link opcional al evento de agenda (creación explícita
--     vía botón, no automática)
--   - backfill 1:1: cada artefacto pre-existente recibe su propia
--     consulta cerrada con fecha = created_at original (estrategia
--     conservadora — sin fuzzy-match por iniciales+día)
--   - trigger pacientes.ultima_consulta_at coordinado:
--     consulta.status='cerrada' es ahora source of truth; el trigger
--     viejo de citas se condiciona para evitar double-fire
-- =============================================================

-- ENUMS -------------------------------------------------------

do $$ begin
  create type consulta_status as enum ('abierta', 'cerrada', 'cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type consulta_tipo as enum (
    'primera_vez',
    'subsecuente',
    'urgencia',
    'revision'
  );
exception when duplicate_object then null; end $$;

-- TABLA consultas ---------------------------------------------

create table if not exists public.consultas (
  id uuid primary key default gen_random_uuid(),
  medico_id uuid not null references public.profiles(id) on delete cascade,
  paciente_id uuid references public.pacientes(id) on delete set null,
  cita_id uuid references public.citas(id) on delete set null,

  -- Snapshot del paciente al momento de la consulta. Si paciente_id
  -- está, redundante pero útil para registro histórico. Si paciente_id
  -- es NULL (paciente no en padrón), estos son la única fuente.
  paciente_nombre text,
  paciente_apellido_paterno text,
  paciente_apellido_materno text,
  paciente_iniciales text,
  paciente_edad int,
  paciente_sexo text check (paciente_sexo in ('M','F','O') or paciente_sexo is null),

  fecha timestamptz not null default now(),
  motivo_consulta text,
  tipo consulta_tipo not null default 'subsecuente',
  status consulta_status not null default 'abierta',

  cerrada_at timestamptz,
  cancelada_at timestamptz,
  motivo_cancelacion text,

  notas_libres text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.consultas is
  'Encuentro clínico — contenedor que agrupa artefactos (nota SOAP, recetas, diferencial) producidos en una misma sesión con el paciente.';

create index if not exists consultas_medico_id_fecha_idx
  on public.consultas (medico_id, fecha desc);
create index if not exists consultas_medico_id_status_idx
  on public.consultas (medico_id, status);
create index if not exists consultas_paciente_id_idx
  on public.consultas (paciente_id) where paciente_id is not null;
create index if not exists consultas_cita_id_idx
  on public.consultas (cita_id) where cita_id is not null;

-- FK consulta_id en tablas existentes -------------------------

alter table public.notas_scribe
  add column if not exists consulta_id uuid
    references public.consultas(id) on delete set null;
alter table public.recetas
  add column if not exists consulta_id uuid
    references public.consultas(id) on delete set null;
alter table public.diferencial_sessions
  add column if not exists consulta_id uuid
    references public.consultas(id) on delete set null;

create index if not exists notas_scribe_consulta_id_idx
  on public.notas_scribe (consulta_id) where consulta_id is not null;
create index if not exists recetas_consulta_id_idx
  on public.recetas (consulta_id) where consulta_id is not null;
create index if not exists diferencial_sessions_consulta_id_idx
  on public.diferencial_sessions (consulta_id) where consulta_id is not null;

-- RLS ---------------------------------------------------------

alter table public.consultas enable row level security;

drop policy if exists "consultas_select_own" on public.consultas;
create policy "consultas_select_own"
  on public.consultas for select
  using (medico_id = auth.uid());

drop policy if exists "consultas_insert_own" on public.consultas;
create policy "consultas_insert_own"
  on public.consultas for insert
  with check (medico_id = auth.uid());

drop policy if exists "consultas_update_own" on public.consultas;
create policy "consultas_update_own"
  on public.consultas for update
  using (medico_id = auth.uid())
  with check (medico_id = auth.uid());

drop policy if exists "consultas_delete_own" on public.consultas;
create policy "consultas_delete_own"
  on public.consultas for delete
  using (medico_id = auth.uid());

-- updated_at trigger ------------------------------------------

create or replace function public.consultas_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists consultas_updated_at on public.consultas;
create trigger consultas_updated_at
  before update on public.consultas
  for each row
  execute function public.consultas_set_updated_at();

-- Trigger: ultima_consulta_at del paciente --------------------
-- Cuando una consulta se cierra y tiene paciente_id, actualizar
-- pacientes.ultima_consulta_at.

create or replace function public.consultas_sync_paciente_ultima()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.paciente_id is null then
    return new;
  end if;
  if new.status = 'cerrada'
     and (tg_op = 'INSERT' or old.status is distinct from 'cerrada')
  then
    if new.cerrada_at is null then
      new.cerrada_at := now();
    end if;
    update public.pacientes
      set ultima_consulta_at = greatest(
        coalesce(ultima_consulta_at, 'epoch'::timestamptz),
        coalesce(new.cerrada_at, now())
      )
    where id = new.paciente_id;
  end if;
  return new;
end;
$$;

drop trigger if exists consultas_ultima_consulta on public.consultas;
create trigger consultas_ultima_consulta
  before insert or update on public.consultas
  for each row
  execute function public.consultas_sync_paciente_ultima();

-- Coordinación con el trigger viejo de citas ------------------
-- La intención: si una cita tiene una consulta asociada (cita_id),
-- la consulta cerrada es la canónica. Si no la tiene (médico no
-- abrió consulta desde la cita), el trigger de citas sigue siendo
-- el fallback para actualizar ultima_consulta_at.

create or replace function public.citas_sync_paciente_ultima_consulta()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.paciente_id is null then
    return new;
  end if;

  -- Si ya existe una consulta asociada a esta cita, la consulta es
  -- la fuente de verdad. No duplicar la actualización.
  if exists (
    select 1 from public.consultas
    where cita_id = new.id
      and status in ('cerrada','abierta')
    limit 1
  ) then
    return new;
  end if;

  if new.status = 'completada'
     and (tg_op = 'INSERT' or old.status is distinct from 'completada')
  then
    update public.pacientes
      set ultima_consulta_at = greatest(
        coalesce(ultima_consulta_at, 'epoch'::timestamptz),
        new.fecha_fin
      )
    where id = new.paciente_id;
  end if;
  return new;
end;
$$;

-- BACKFILL 1:1 ------------------------------------------------
-- Cada nota_scribe / receta / diferencial pre-existente recibe su
-- propia consulta cerrada con fecha = created_at original.
-- Estrategia conservadora: NO agrupamos por iniciales+día porque
-- las iniciales pueden colisionar entre pacientes distintos
-- (riesgo de privacidad). El médico puede merger consultas desde
-- la UI más adelante si lo desea.

-- 1) Backfill notas_scribe sin consulta
with inserted as (
  insert into public.consultas (
    id, medico_id, paciente_nombre, paciente_apellido_paterno,
    paciente_apellido_materno, paciente_iniciales, paciente_edad,
    paciente_sexo, fecha, tipo, status, cerrada_at, created_at, updated_at
  )
  select
    gen_random_uuid(), n.medico_id, n.paciente_nombre,
    n.paciente_apellido_paterno, n.paciente_apellido_materno,
    n.paciente_iniciales, n.paciente_edad, n.paciente_sexo,
    n.created_at, 'subsecuente'::consulta_tipo,
    'cerrada'::consulta_status, n.created_at, n.created_at, n.updated_at
  from public.notas_scribe n
  where n.consulta_id is null
  returning id, medico_id, created_at
)
update public.notas_scribe n
   set consulta_id = i.id
  from inserted i
 where n.medico_id = i.medico_id
   and n.created_at = i.created_at
   and n.consulta_id is null;

-- 2) Backfill recetas sin consulta
with inserted as (
  insert into public.consultas (
    id, medico_id, paciente_nombre, paciente_apellido_paterno,
    paciente_apellido_materno, paciente_edad, paciente_sexo,
    fecha, tipo, status, cerrada_at, created_at, updated_at,
    motivo_consulta
  )
  select
    gen_random_uuid(), r.medico_id, r.paciente_nombre,
    r.paciente_apellido_paterno, r.paciente_apellido_materno,
    r.paciente_edad, r.paciente_sexo,
    coalesce(r.fecha_emision, r.created_at),
    'subsecuente'::consulta_tipo, 'cerrada'::consulta_status,
    coalesce(r.fecha_emision, r.created_at), r.created_at, r.updated_at,
    nullif(r.diagnostico, '')
  from public.recetas r
  where r.consulta_id is null
  returning id, medico_id, created_at
)
update public.recetas r
   set consulta_id = i.id
  from inserted i
 where r.medico_id = i.medico_id
   and r.created_at = i.created_at
   and r.consulta_id is null;

-- 3) Backfill diferencial_sessions sin consulta
with inserted as (
  insert into public.consultas (
    id, medico_id, paciente_iniciales, paciente_edad, paciente_sexo,
    fecha, tipo, status, cerrada_at, created_at, updated_at,
    motivo_consulta
  )
  select
    gen_random_uuid(), d.medico_id, d.paciente_iniciales,
    d.paciente_edad, d.paciente_sexo, d.created_at,
    'subsecuente'::consulta_tipo, 'cerrada'::consulta_status,
    d.created_at, d.created_at, d.updated_at,
    nullif(d.contexto_clinico, '')
  from public.diferencial_sessions d
  where d.consulta_id is null
  returning id, medico_id, created_at
)
update public.diferencial_sessions d
   set consulta_id = i.id
  from inserted i
 where d.medico_id = i.medico_id
   and d.created_at = i.created_at
   and d.consulta_id is null;
