-- LitienGuard — Portal del paciente (acceso a expediente con magic link)
--
-- Diseño: el paciente NO entra a auth.users (evita colisiones con médicos
-- y mantiene la separación de gobernanza). En su lugar usamos una tabla
-- de tokens de un solo uso enlazada al correo del paciente.
--
-- Cada visita al expediente es un acto explícito y auditado de "acceso
-- a mis datos" conforme al artículo 22 de la LFPDPPP.

create table if not exists public.paciente_magic_tokens (
  id uuid default gen_random_uuid() primary key,
  token text not null unique,
  email text not null,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  used_at timestamptz,
  ip text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists paciente_magic_tokens_email_idx
  on public.paciente_magic_tokens(lower(email), created_at desc);
create index if not exists paciente_magic_tokens_expires_idx
  on public.paciente_magic_tokens(expires_at);

-- RLS: solo service_role accede directamente. La validación del token
-- ocurre server-side en /paciente/expediente/[token].
alter table public.paciente_magic_tokens enable row level security;

drop policy if exists "admin reads tokens" on public.paciente_magic_tokens;
create policy "admin reads tokens"
  on public.paciente_magic_tokens for select
  using (public.is_admin());

-- Add paciente_email to recetas so the portal can show prescriptions
-- alongside appointments. Nullable for retrocompat (existing rows have
-- no email captured); future Scribe form should capture it.
alter table public.recetas
  add column if not exists paciente_email text;

create index if not exists recetas_paciente_email_idx
  on public.recetas(lower(paciente_email))
  where paciente_email is not null;

-- Cleanup function: purge expired tokens older than 7 days. Cheap to
-- call from a daily cron later.
create or replace function public.purge_paciente_magic_tokens()
returns void language sql security definer set search_path = public as $$
  delete from public.paciente_magic_tokens
   where expires_at < now() - interval '7 days';
$$;
