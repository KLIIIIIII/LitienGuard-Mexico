-- LitienGuard — Auth schema: profiles + invitaciones whitelist
-- Run once in Supabase Studio (SQL Editor) after enabling Email auth.

-- 1) Role type ----------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('medico', 'admin');
  end if;
end$$;

-- 2) profiles -----------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role user_role not null default 'medico',
  nombre text,
  hospital text,
  especialidad text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists profiles_email_idx on public.profiles(lower(email));
create index if not exists profiles_role_idx on public.profiles(role);

-- 3) invitaciones (whitelist) -------------------------------------------------
create table if not exists public.invitaciones (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  role user_role not null default 'medico',
  invitada_por uuid references public.profiles(id),
  nombre text,
  hospital text,
  usada boolean default false,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '60 days')
);

create index if not exists invitaciones_email_idx on public.invitaciones(lower(email));

-- 4) Trigger: enforce invitation on new auth users ---------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite record;
begin
  select * into invite
  from public.invitaciones
  where lower(email) = lower(new.email)
    and usada = false
    and (expires_at is null or expires_at > now())
  limit 1;

  if invite is null then
    raise exception 'No hay invitación válida para este correo';
  end if;

  insert into public.profiles (id, email, role, nombre, hospital)
  values (new.id, new.email, invite.role, invite.nombre, invite.hospital);

  update public.invitaciones set usada = true where id = invite.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Helper: is_admin() (security definer avoids RLS recursion) --------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- 6) RLS ----------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.invitaciones enable row level security;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "admins read invitaciones" on public.invitaciones;
create policy "admins read invitaciones"
  on public.invitaciones for select
  using (public.is_admin());

drop policy if exists "admins insert invitaciones" on public.invitaciones;
create policy "admins insert invitaciones"
  on public.invitaciones for insert
  with check (public.is_admin());

drop policy if exists "admins update invitaciones" on public.invitaciones;
create policy "admins update invitaciones"
  on public.invitaciones for update
  using (public.is_admin());

drop policy if exists "admins delete invitaciones" on public.invitaciones;
create policy "admins delete invitaciones"
  on public.invitaciones for delete
  using (public.is_admin());

-- 7) Seed initial admin invite -----------------------------------------------
insert into public.invitaciones (email, role, nombre)
values ('contacto@litienguard.mx', 'admin', 'LitienGuard')
on conflict (email) do update
  set role = 'admin', usada = false, expires_at = now() + interval '60 days';
