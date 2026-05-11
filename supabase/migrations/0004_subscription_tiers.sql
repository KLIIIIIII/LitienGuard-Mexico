-- LitienGuard — Subscription tiers
-- Adds tier-based access control on top of role-based auth.
-- role  = who you are (medico / admin) — RBAC
-- tier  = what you can use (free / pilot / pro / enterprise) — entitlement

-- 1) Tier enum (idempotent)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'subscription_tier') then
    create type subscription_tier as enum ('free', 'pilot', 'pro', 'enterprise');
  end if;
end$$;

-- 2) Add tier column to profiles
alter table public.profiles
  add column if not exists subscription_tier subscription_tier not null default 'free';

-- 3) Add tier column to invitaciones (so the invite can predetermine the tier)
alter table public.invitaciones
  add column if not exists subscription_tier subscription_tier not null default 'pilot';

create index if not exists profiles_tier_idx on public.profiles(subscription_tier);

-- 4) Update handle_new_user to copy tier from invitation
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

  insert into public.profiles (id, email, role, nombre, hospital, subscription_tier)
  values (
    new.id,
    new.email,
    invite.role,
    invite.nombre,
    invite.hospital,
    invite.subscription_tier
  );

  update public.invitaciones set usada = true where id = invite.id;

  return new;
end;
$$;

-- 5) Backfill: bring existing records up to tier (this section is data-safe)
--    el operador = pro (the operator gets full access)
update public.profiles
  set subscription_tier = 'pro'
  where lower(email) = 'contacto@litienguard.mx'
    and subscription_tier = 'free';

update public.invitaciones
  set subscription_tier = 'pro'
  where lower(email) = 'contacto@litienguard.mx';

--    Any other already-issued invitations stay as 'pilot' (the column default).

-- 6) Helper: entitlement check for the Scribe feature
create or replace function public.can_use_scribe()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and subscription_tier in ('pilot', 'pro', 'enterprise')
  );
$$;
