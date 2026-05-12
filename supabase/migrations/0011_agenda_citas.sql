-- LitienGuard — Agenda de citas
-- Tabla principal de citas clínicas con RLS estricto por médico.
-- Los recordatorios automáticos vendrán en una iteración posterior; los
-- campos recordatorio_*_enviado_at ya quedan listos para esa funcionalidad.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'cita_status') then
    create type cita_status as enum (
      'agendada', 'confirmada', 'completada', 'cancelada', 'no_asistio'
    );
  end if;
end$$;

create table if not exists public.citas (
  id uuid default gen_random_uuid() primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,

  paciente_nombre text not null,
  paciente_apellido_paterno text,
  paciente_apellido_materno text,
  paciente_email text,
  paciente_telefono text,

  fecha_inicio timestamptz not null,
  fecha_fin timestamptz not null,

  tipo_consulta text,
  motivo text,
  notas_internas text,

  status cita_status not null default 'agendada',
  motivo_cancelacion text,

  recordatorio_24h_enviado_at timestamptz,
  recordatorio_1h_enviado_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint citas_fecha_orden check (fecha_fin > fecha_inicio),
  constraint citas_cancelacion_motivo check (
    (status <> 'cancelada') or (motivo_cancelacion is not null and length(trim(motivo_cancelacion)) > 0)
  )
);

create index if not exists citas_medico_fecha_idx
  on public.citas(medico_id, fecha_inicio);
create index if not exists citas_medico_status_idx
  on public.citas(medico_id, status, fecha_inicio);
create index if not exists citas_recordatorio_pending_idx
  on public.citas(fecha_inicio)
  where status in ('agendada', 'confirmada')
    and recordatorio_24h_enviado_at is null;

-- updated_at trigger
create or replace function public.citas_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists citas_updated_at on public.citas;
create trigger citas_updated_at
  before update on public.citas
  for each row execute function public.citas_set_updated_at();

-- RLS
alter table public.citas enable row level security;

drop policy if exists "medico reads own citas" on public.citas;
create policy "medico reads own citas"
  on public.citas for select
  using (auth.uid() = medico_id);

drop policy if exists "medico inserts own citas" on public.citas;
create policy "medico inserts own citas"
  on public.citas for insert
  with check (auth.uid() = medico_id);

drop policy if exists "medico updates own citas" on public.citas;
create policy "medico updates own citas"
  on public.citas for update
  using (auth.uid() = medico_id)
  with check (auth.uid() = medico_id);

drop policy if exists "medico deletes own citas" on public.citas;
create policy "medico deletes own citas"
  on public.citas for delete
  using (auth.uid() = medico_id);

drop policy if exists "admin reads all citas" on public.citas;
create policy "admin reads all citas"
  on public.citas for select
  using (public.is_admin());

-- Helper: ¿puede el médico actualmente autenticado usar la agenda?
create or replace function public.can_use_agenda()
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
