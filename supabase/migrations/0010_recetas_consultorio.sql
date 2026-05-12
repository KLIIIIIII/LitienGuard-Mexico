-- LitienGuard — Recetas electrónicas + datos del consultorio
-- Cumple con los requerimientos de la NOM-024-SSA3 sobre datos mínimos que
-- debe contener una receta médica. Incluye RLS estricto por médico y
-- anulación en lugar de borrado (retención regulatoria).

-- 1) Extender profiles con datos requeridos para emitir recetas
alter table public.profiles
  add column if not exists cedula_profesional text,
  add column if not exists especialidad text,
  add column if not exists consultorio_nombre text,
  add column if not exists consultorio_direccion text,
  add column if not exists consultorio_telefono text;

-- 2) Status enum para recetas
do $$
begin
  if not exists (select 1 from pg_type where typname = 'receta_status') then
    create type receta_status as enum ('borrador', 'firmada', 'anulada');
  end if;
end$$;

-- 3) Tabla principal de recetas
create table if not exists public.recetas (
  id uuid default gen_random_uuid() primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,

  paciente_nombre text not null,
  paciente_apellido_paterno text,
  paciente_apellido_materno text,
  paciente_edad int,
  paciente_sexo text check (paciente_sexo in ('M', 'F', 'O')),

  diagnostico text not null,
  diagnostico_cie10 text,
  indicaciones_generales text,
  observaciones text,

  status receta_status not null default 'borrador',
  motivo_anulacion text,

  fecha_emision timestamptz default now(),
  retention_until timestamptz default (now() + interval '5 years'),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint recetas_motivo_anulacion_required check (
    (status <> 'anulada') or (motivo_anulacion is not null and length(trim(motivo_anulacion)) > 0)
  )
);

create index if not exists recetas_medico_idx on public.recetas(medico_id, fecha_emision desc);
create index if not exists recetas_status_idx on public.recetas(medico_id, status, fecha_emision desc);
create index if not exists recetas_paciente_idx on public.recetas(medico_id, paciente_nombre);

-- 4) Tabla de items (medicamentos) de una receta
create table if not exists public.recetas_items (
  id uuid default gen_random_uuid() primary key,
  receta_id uuid not null references public.recetas(id) on delete cascade,
  orden int not null default 1,

  medicamento text not null,
  presentacion text,
  dosis text,
  frecuencia text,
  duracion text,
  via_administracion text,
  indicaciones text,

  created_at timestamptz default now()
);

create index if not exists recetas_items_receta_idx on public.recetas_items(receta_id, orden);

-- 5) Trigger: actualizar updated_at en cada UPDATE
create or replace function public.recetas_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists recetas_updated_at on public.recetas;
create trigger recetas_updated_at
  before update on public.recetas
  for each row execute function public.recetas_set_updated_at();

-- 6) RLS: cada médico ve y administra solo sus propias recetas
alter table public.recetas enable row level security;

drop policy if exists "medico reads own recetas" on public.recetas;
create policy "medico reads own recetas"
  on public.recetas for select
  using (auth.uid() = medico_id);

drop policy if exists "medico inserts own recetas" on public.recetas;
create policy "medico inserts own recetas"
  on public.recetas for insert
  with check (auth.uid() = medico_id);

drop policy if exists "medico updates own recetas" on public.recetas;
create policy "medico updates own recetas"
  on public.recetas for update
  using (auth.uid() = medico_id)
  with check (auth.uid() = medico_id);

-- DELETE intencionalmente NO permitido — las recetas se anulan, no se borran.
-- Admin puede leer todas las recetas (para soporte y auditoría)
drop policy if exists "admin reads all recetas" on public.recetas;
create policy "admin reads all recetas"
  on public.recetas for select
  using (public.is_admin());

-- 7) RLS para items: el médico ve los items de sus recetas
alter table public.recetas_items enable row level security;

drop policy if exists "medico reads own items" on public.recetas_items;
create policy "medico reads own items"
  on public.recetas_items for select
  using (
    receta_id in (select id from public.recetas where medico_id = auth.uid())
  );

drop policy if exists "medico inserts own items" on public.recetas_items;
create policy "medico inserts own items"
  on public.recetas_items for insert
  with check (
    receta_id in (select id from public.recetas where medico_id = auth.uid())
  );

drop policy if exists "medico updates own items" on public.recetas_items;
create policy "medico updates own items"
  on public.recetas_items for update
  using (
    receta_id in (select id from public.recetas where medico_id = auth.uid())
  )
  with check (
    receta_id in (select id from public.recetas where medico_id = auth.uid())
  );

drop policy if exists "medico deletes own items" on public.recetas_items;
create policy "medico deletes own items"
  on public.recetas_items for delete
  using (
    receta_id in (select id from public.recetas where medico_id = auth.uid())
  );

drop policy if exists "admin reads all items" on public.recetas_items;
create policy "admin reads all items"
  on public.recetas_items for select
  using (public.is_admin());

-- 8) Helper SQL para entitlement: puede el médico usar recetas?
create or replace function public.can_use_recetas()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select subscription_tier in ('pro', 'enterprise')
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;
