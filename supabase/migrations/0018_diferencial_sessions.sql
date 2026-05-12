-- LitienGuard — Sesiones de diferencial clínico
--
-- Registra cada uso del motor de inferencia bayesiano por un médico:
-- qué findings marcó, qué diferencial generó el motor, qué decisión
-- final tomó el médico. Es la base del loop de calidad y la fuente
-- de datos para mejorar calibración de likelihood ratios con
-- experiencia real.

create table if not exists public.diferencial_sessions (
  id uuid default gen_random_uuid() primary key,
  medico_id uuid not null references public.profiles(id) on delete cascade,

  -- Paciente (mínimo, anonimizable)
  paciente_iniciales text,
  paciente_edad int,
  paciente_sexo text check (paciente_sexo in ('M', 'F', 'O')),
  contexto_clinico text,

  -- Estado del razonamiento
  findings_observed jsonb not null default '[]'::jsonb,
  top_diagnoses jsonb not null default '[]'::jsonb,

  -- Decisión y outcome (loop de calidad)
  medico_diagnostico_principal text,
  medico_notas text,
  -- override_razonamiento se llena si el médico se aparta del top-1 del motor
  override_razonamiento text,
  outcome_confirmado text,
  outcome_confirmado_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists diferencial_medico_idx
  on public.diferencial_sessions(medico_id, created_at desc);

-- updated_at trigger
create or replace function public.diferencial_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists diferencial_updated_at on public.diferencial_sessions;
create trigger diferencial_updated_at
  before update on public.diferencial_sessions
  for each row execute function public.diferencial_set_updated_at();

-- RLS
alter table public.diferencial_sessions enable row level security;

drop policy if exists "medico reads own diferencial" on public.diferencial_sessions;
create policy "medico reads own diferencial"
  on public.diferencial_sessions for select
  using (auth.uid() = medico_id);

drop policy if exists "medico inserts own diferencial" on public.diferencial_sessions;
create policy "medico inserts own diferencial"
  on public.diferencial_sessions for insert
  with check (auth.uid() = medico_id);

drop policy if exists "medico updates own diferencial" on public.diferencial_sessions;
create policy "medico updates own diferencial"
  on public.diferencial_sessions for update
  using (auth.uid() = medico_id)
  with check (auth.uid() = medico_id);

drop policy if exists "admin reads all diferencial" on public.diferencial_sessions;
create policy "admin reads all diferencial"
  on public.diferencial_sessions for select
  using (public.is_admin());
