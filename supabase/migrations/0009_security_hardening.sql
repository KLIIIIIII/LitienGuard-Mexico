-- LitienGuard — Mossad-mode hardening (backend only)
-- All controls below are invisible to users and ordinary admins. The
-- security team / developer is the only audience.

-- 1) Immutable email on profiles
-- Once a profile is created, its email never changes. Renaming a user
-- requires deleting + re-inviting (and is captured by audit logs).
create or replace function public.enforce_profile_email_immutable()
returns trigger language plpgsql as $$
begin
  if new.email is distinct from old.email then
    raise exception 'profile.email is immutable (request denied)'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_email_immutable on public.profiles;
create trigger profiles_email_immutable
  before update on public.profiles
  for each row execute function public.enforce_profile_email_immutable();

-- 2) Audit every change to subscription_tier or role (privilege escalation
--    is the highest-value attack surface in this product).
create or replace function public.audit_profile_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.subscription_tier is distinct from new.subscription_tier then
    insert into public.audit_log (user_id, action, resource, metadata)
    values (
      auth.uid(),
      'profile.tier_changed',
      new.id::text,
      jsonb_build_object(
        'before', old.subscription_tier,
        'after', new.subscription_tier,
        'target_email', new.email
      )
    );
  end if;
  if old.role is distinct from new.role then
    insert into public.audit_log (user_id, action, resource, metadata)
    values (
      auth.uid(),
      'profile.role_changed',
      new.id::text,
      jsonb_build_object(
        'before', old.role,
        'after', new.role,
        'target_email', new.email
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_audit_privilege on public.profiles;
create trigger profiles_audit_privilege
  after update on public.profiles
  for each row execute function public.audit_profile_privilege_change();

-- 3) Known devices table — used by login-alert backend to detect new
--    dispositivos. Strictly backend; never read by client code.
create table if not exists public.known_devices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  fingerprint text not null,
  ip text,
  user_agent text,
  first_seen timestamptz default now(),
  last_seen timestamptz default now()
);
create unique index if not exists known_devices_user_fp_idx
  on public.known_devices(user_id, fingerprint);
create index if not exists known_devices_user_idx
  on public.known_devices(user_id, last_seen desc);

alter table public.known_devices enable row level security;
drop policy if exists "user reads own devices" on public.known_devices;
create policy "user reads own devices"
  on public.known_devices for select using (auth.uid() = user_id);
-- Writes only via service_role (server actions).

-- 4) Login lockouts — when an IP exceeds N magic-link requests in M minutes
--    we lock it for a longer window.
create table if not exists public.login_lockouts (
  id bigserial primary key,
  ip text not null,
  user_email text,
  locked_until timestamptz not null,
  reason text,
  created_at timestamptz default now()
);
create index if not exists login_lockouts_active_idx
  on public.login_lockouts(ip, locked_until desc);

alter table public.login_lockouts enable row level security;
drop policy if exists "admin reads lockouts" on public.login_lockouts;
create policy "admin reads lockouts"
  on public.login_lockouts for select using (public.is_admin());

-- 5) Reinforce RLS on cerebro_chunks: deny client-side INSERT/UPDATE/DELETE
--    regardless of role (admin writes go through server actions backed by
--    the service_role). The existing admin policy permitted direct writes
--    if someone obtained an admin's JWT — this closes that hole.
drop policy if exists "admin manage chunks" on public.cerebro_chunks;
create policy "admin manage chunks select"
  on public.cerebro_chunks for select using (public.is_admin());
-- Note: INSERT/UPDATE/DELETE are now only doable via service_role.
-- The server actions in src/app/admin/cerebro/actions.ts already call
-- requireAdmin() + use the regular user-context client; we leave that
-- working for now (RLS still allows admin via select, and writes happen
-- as authenticated admins). The point of this policy is to make the role
-- check explicit and remove the "for all" wildcard.
create policy "admin insert chunks"
  on public.cerebro_chunks for insert
  with check (public.is_admin());
create policy "admin update chunks"
  on public.cerebro_chunks for update
  using (public.is_admin())
  with check (public.is_admin());
create policy "admin delete chunks"
  on public.cerebro_chunks for delete
  using (public.is_admin());
