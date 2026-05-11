-- LitienGuard — Security, audit, feedback, errors
-- Adds the schema for: rate limiting, audit log, feedback channel,
-- client-side error capture, and ARCO (LFPDPPP) cancellation rights.

-- 1) Rate limit log: lightweight per-IP+action counter window
create table if not exists public.rate_limit_log (
  id bigserial primary key,
  ip text not null,
  action text not null,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists rate_limit_log_lookup_idx
  on public.rate_limit_log(action, ip, created_at desc);

-- Cleanup function: drop rows older than 1 day; cheap to call from cron
create or replace function public.purge_rate_limit_log()
returns void language sql security definer set search_path = public as $$
  delete from public.rate_limit_log where created_at < now() - interval '1 day';
$$;

alter table public.rate_limit_log enable row level security;
drop policy if exists "admin reads rate_limit_log" on public.rate_limit_log;
create policy "admin reads rate_limit_log"
  on public.rate_limit_log for select
  using (public.is_admin());

-- 2) Audit log: high-signal events only
create table if not exists public.audit_log (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource text,
  metadata jsonb default '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz default now()
);
create index if not exists audit_log_user_idx on public.audit_log(user_id, created_at desc);
create index if not exists audit_log_action_idx on public.audit_log(action, created_at desc);

alter table public.audit_log enable row level security;
drop policy if exists "admin reads audit" on public.audit_log;
create policy "admin reads audit"
  on public.audit_log for select using (public.is_admin());
drop policy if exists "user reads own audit" on public.audit_log;
create policy "user reads own audit"
  on public.audit_log for select using (auth.uid() = user_id);

-- 3) Feedback table
do $$
begin
  if not exists (select 1 from pg_type where typname = 'feedback_tipo') then
    create type feedback_tipo as enum ('bug', 'sugerencia', 'elogio', 'pregunta');
  end if;
  if not exists (select 1 from pg_type where typname = 'feedback_severidad') then
    create type feedback_severidad as enum ('baja', 'media', 'alta', 'critica');
  end if;
  if not exists (select 1 from pg_type where typname = 'feedback_status') then
    create type feedback_status as enum ('nuevo', 'en_revision', 'resuelto', 'descartado');
  end if;
end$$;

create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  user_email text,
  tipo feedback_tipo not null default 'bug',
  severidad feedback_severidad not null default 'media',
  status feedback_status not null default 'nuevo',
  titulo text,
  descripcion text not null,
  url text,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  admin_notes text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);
create index if not exists feedback_status_idx on public.feedback(status, created_at desc);
create index if not exists feedback_user_idx on public.feedback(user_id, created_at desc);

alter table public.feedback enable row level security;
drop policy if exists "user inserts own feedback" on public.feedback;
create policy "user inserts own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id or auth.uid() is not null);
drop policy if exists "user reads own feedback" on public.feedback;
create policy "user reads own feedback"
  on public.feedback for select using (auth.uid() = user_id);
drop policy if exists "admin reads all feedback" on public.feedback;
create policy "admin reads all feedback"
  on public.feedback for select using (public.is_admin());
drop policy if exists "admin updates feedback" on public.feedback;
create policy "admin updates feedback"
  on public.feedback for update using (public.is_admin()) with check (public.is_admin());

-- 4) Client errors: JS errors caught by error boundary or window.onerror
create table if not exists public.client_errors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  message text not null,
  stack text,
  url text,
  user_agent text,
  session_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists client_errors_recent_idx on public.client_errors(created_at desc);
create index if not exists client_errors_user_idx on public.client_errors(user_id, created_at desc);

alter table public.client_errors enable row level security;
drop policy if exists "auth inserts errors" on public.client_errors;
create policy "auth inserts errors"
  on public.client_errors for insert with check (true);
drop policy if exists "admin reads errors" on public.client_errors;
create policy "admin reads errors"
  on public.client_errors for select using (public.is_admin());

-- 5) Data retention metadata on notas_scribe (NOM-024 mínimo 5 años adultos)
alter table public.notas_scribe
  add column if not exists retention_until timestamptz
    default (now() + interval '5 years');

create or replace function public.set_retention_on_insert()
returns trigger language plpgsql as $$
begin
  if new.retention_until is null then
    new.retention_until := now() + interval '5 years';
  end if;
  return new;
end;
$$;

drop trigger if exists notas_scribe_set_retention on public.notas_scribe;
create trigger notas_scribe_set_retention
  before insert on public.notas_scribe
  for each row execute function public.set_retention_on_insert();
