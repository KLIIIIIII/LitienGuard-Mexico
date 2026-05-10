-- LitienGuard — initial schema
-- Run this once in Supabase Studio (SQL Editor) before first deploy.

create table if not exists public.preregistros (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  tipo text not null check (tipo in ('medico','paciente','hospital','otro')),
  nombre text,
  mensaje text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip text,
  user_agent text,
  created_at timestamptz default now(),
  status text default 'nuevo' check (status in ('nuevo','contactado','calificado','descartado'))
);

create index if not exists preregistros_email_idx on public.preregistros(email);
create index if not exists preregistros_tipo_idx on public.preregistros(tipo);
create index if not exists preregistros_created_at_idx on public.preregistros(created_at desc);

alter table public.preregistros enable row level security;

-- Only service_role can insert (server-side via Server Action / API route).
-- The anon key cannot read or write — protects PII.
drop policy if exists "service can insert" on public.preregistros;
create policy "service can insert"
  on public.preregistros
  for insert
  with check (true);

-- Optional: allow service_role to update status (for ops UI later)
drop policy if exists "service can update status" on public.preregistros;
create policy "service can update status"
  on public.preregistros
  for update
  using (true)
  with check (true);
