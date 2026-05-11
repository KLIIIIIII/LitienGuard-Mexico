-- LitienGuard — Scribe domain
-- Stores SOAP notes generated from clinical audio.
-- Audio itself is not stored on our servers (privacy by default).

create table if not exists public.notas_scribe (
  id uuid default gen_random_uuid() primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,

  -- Patient context (anonymized — no PII required for piloto)
  paciente_iniciales text,
  paciente_edad integer check (paciente_edad is null or (paciente_edad >= 0 and paciente_edad <= 130)),
  paciente_sexo text check (paciente_sexo is null or paciente_sexo in ('M', 'F', 'O')),

  -- Audio metadata
  duracion_segundos integer,
  audio_filename text,

  -- Generated content
  transcripcion text,
  soap_subjetivo text,
  soap_objetivo text,
  soap_analisis text,
  soap_plan text,
  soap_metadata jsonb default '{}'::jsonb,

  -- Workflow
  status text not null default 'borrador'
    check (status in ('borrador', 'firmada', 'descartada')),

  -- Optional CIE-10 codes (for RCM/Fase 2A later)
  cie10 text[],

  -- Error capture
  error_message text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists notas_scribe_medico_idx
  on public.notas_scribe(medico_id, created_at desc);
create index if not exists notas_scribe_status_idx
  on public.notas_scribe(status);

-- Shared touch_updated_at function (idempotent)
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notas_scribe_updated_at on public.notas_scribe;
create trigger notas_scribe_updated_at
  before update on public.notas_scribe
  for each row execute function public.touch_updated_at();

-- RLS
alter table public.notas_scribe enable row level security;

drop policy if exists "medico reads own notas" on public.notas_scribe;
create policy "medico reads own notas"
  on public.notas_scribe for select
  using (auth.uid() = medico_id);

drop policy if exists "medico inserts own notas" on public.notas_scribe;
create policy "medico inserts own notas"
  on public.notas_scribe for insert
  with check (auth.uid() = medico_id);

drop policy if exists "medico updates own notas" on public.notas_scribe;
create policy "medico updates own notas"
  on public.notas_scribe for update
  using (auth.uid() = medico_id)
  with check (auth.uid() = medico_id);

drop policy if exists "medico deletes own notas" on public.notas_scribe;
create policy "medico deletes own notas"
  on public.notas_scribe for delete
  using (auth.uid() = medico_id);

drop policy if exists "admins read all notas" on public.notas_scribe;
create policy "admins read all notas"
  on public.notas_scribe for select
  using (public.is_admin());
