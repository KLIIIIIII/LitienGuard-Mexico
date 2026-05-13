-- LitienGuard — Tabla de pacientes y vinculación con citas.
--
-- Permite al médico mantener un padrón propio (subido por CSV o creado
-- manual desde el panel) y detectar pacientes inactivos para recall
-- de cita de mantenimiento. RLS estricto por médico.
--
-- citas actual usa strings (paciente_nombre, etc.) para mantener flujo
-- agendado público sin requerir registro previo. Aquí agregamos
-- paciente_id OPCIONAL — citas viejas siguen funcionando con strings,
-- citas nuevas pueden enlazarse a un paciente del padrón.
--
-- Trigger en citas mantiene pacientes.ultima_consulta_at sincronizada
-- cuando una cita pasa a status = 'completada'.

create table if not exists public.pacientes (
  id uuid default gen_random_uuid() primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,

  -- Identidad
  nombre text not null,
  apellido_paterno text,
  apellido_materno text,

  -- Contacto
  email text,
  telefono text,

  -- Demografía
  fecha_nacimiento date,
  sexo text check (sexo is null or sexo in ('M', 'F', 'O')),

  -- Operación clínica
  ultima_consulta_at timestamptz,
  recall_enviado_at timestamptz,

  -- Extras libres
  notas_internas text,
  etiquetas text[] default '{}'::text[],

  -- Trazabilidad de origen
  import_lote_id uuid,

  -- Estado
  activo boolean not null default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Email único por médico (si está presente) para evitar duplicados
  constraint pacientes_email_unique_por_medico
    unique (medico_id, email)
);

create index if not exists pacientes_medico_idx
  on public.pacientes(medico_id, activo, ultima_consulta_at desc);
create index if not exists pacientes_medico_nombre_idx
  on public.pacientes(medico_id, apellido_paterno, nombre);
create index if not exists pacientes_inactivos_idx
  on public.pacientes(medico_id, ultima_consulta_at)
  where activo = true;

-- updated_at trigger reutilizable
drop trigger if exists pacientes_set_updated_at on public.pacientes;
create trigger pacientes_set_updated_at
  before update on public.pacientes
  for each row execute function public.touch_updated_at();

-- RLS
alter table public.pacientes enable row level security;

drop policy if exists "medico reads own pacientes" on public.pacientes;
create policy "medico reads own pacientes"
  on public.pacientes for select
  using (auth.uid() = medico_id);

drop policy if exists "medico inserts own pacientes" on public.pacientes;
create policy "medico inserts own pacientes"
  on public.pacientes for insert
  with check (auth.uid() = medico_id);

drop policy if exists "medico updates own pacientes" on public.pacientes;
create policy "medico updates own pacientes"
  on public.pacientes for update
  using (auth.uid() = medico_id)
  with check (auth.uid() = medico_id);

drop policy if exists "medico deletes own pacientes" on public.pacientes;
create policy "medico deletes own pacientes"
  on public.pacientes for delete
  using (auth.uid() = medico_id);

drop policy if exists "admin reads all pacientes" on public.pacientes;
create policy "admin reads all pacientes"
  on public.pacientes for select
  using (public.is_admin());

-- Vincular cita con paciente del padrón (opcional, backward compat)
alter table public.citas
  add column if not exists paciente_id uuid
    references public.pacientes(id) on delete set null;

create index if not exists citas_paciente_idx
  on public.citas(paciente_id)
  where paciente_id is not null;

-- Trigger: cuando una cita pasa a 'completada' y tiene paciente_id,
-- actualizar pacientes.ultima_consulta_at a la fecha_fin de la cita.
create or replace function public.citas_sync_paciente_ultima_consulta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Solo al pasar A completada (no si ya estaba)
  if new.paciente_id is null then
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

drop trigger if exists citas_sync_paciente on public.citas;
create trigger citas_sync_paciente
  after insert or update of status, paciente_id, fecha_fin
  on public.citas
  for each row execute function public.citas_sync_paciente_ultima_consulta();

-- Tabla de lotes de import para auditoría
create table if not exists public.pacientes_import_lotes (
  id uuid default gen_random_uuid() primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,
  rows_total integer not null default 0,
  rows_ok integer not null default 0,
  rows_error integer not null default 0,
  status text not null default 'completado'
    check (status in ('procesando', 'completado', 'fallido')),
  notas text,
  created_at timestamptz default now()
);

create index if not exists pacientes_import_lotes_medico_idx
  on public.pacientes_import_lotes(medico_id, created_at desc);

alter table public.pacientes_import_lotes enable row level security;

drop policy if exists "medico reads own import lotes" on public.pacientes_import_lotes;
create policy "medico reads own import lotes"
  on public.pacientes_import_lotes for select
  using (auth.uid() = medico_id);

drop policy if exists "medico inserts own import lotes" on public.pacientes_import_lotes;
create policy "medico inserts own import lotes"
  on public.pacientes_import_lotes for insert
  with check (auth.uid() = medico_id);

-- Helper: ¿puede el médico autenticado usar el módulo de pacientes?
-- Disponible en Esencial+ (NO en Free).
create or replace function public.can_use_pacientes()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select subscription_tier in ('esencial', 'pilot', 'pro', 'enterprise')
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

comment on table public.pacientes is
  'Padrón de pacientes por médico. Permite tracking de inactivos para recall de mantenimiento.';
comment on column public.pacientes.ultima_consulta_at is
  'Actualizado automáticamente por trigger al completar una cita vinculada; también editable manualmente al importar CSV.';
comment on column public.pacientes.recall_enviado_at is
  'Última fecha que se envió recordatorio de "vuelve a consulta" para evitar spam.';
