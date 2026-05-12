-- LitienGuard — fix invitaciones.usada sync + admin access to preregistros
--
-- Two retroactive fixes:
--   1. Any invitation whose email already has a profile (user signed up)
--      gets usada=true. Some old invitations got out of sync.
--   2. preregistros table needs admin read/update so the
--      /admin/invitaciones panel can list incoming requests and convert
--      them into invitations.

-- 1) Sync usada flag retroactively
update public.invitaciones inv
  set usada = true
  from public.profiles p
  where lower(p.email) = lower(inv.email)
    and inv.usada = false;

-- 2) Allow admin to read + update preregistros
drop policy if exists "admin reads preregistros" on public.preregistros;
create policy "admin reads preregistros"
  on public.preregistros for select
  using (public.is_admin());

drop policy if exists "admin updates preregistros" on public.preregistros;
create policy "admin updates preregistros"
  on public.preregistros for update
  using (public.is_admin())
  with check (public.is_admin());

-- 3) Track who approved a preregistro and when
alter table public.preregistros
  add column if not exists processed_at timestamptz,
  add column if not exists processed_by uuid references public.profiles(id);

create index if not exists preregistros_status_recent_idx
  on public.preregistros(status, created_at desc);
