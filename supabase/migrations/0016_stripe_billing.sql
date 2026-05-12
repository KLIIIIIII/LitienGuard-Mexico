-- LitienGuard — Stripe billing
--
-- Vincula los perfiles con Stripe (customer + subscription) y registra
-- los eventos procesados por el webhook para garantizar idempotencia.

-- 1) Columnas de billing en profiles
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_subscription_status text,
  add column if not exists stripe_current_period_end timestamptz,
  add column if not exists stripe_billing_cycle text
    check (stripe_billing_cycle in ('mensual','anual'));

create index if not exists profiles_stripe_customer_idx
  on public.profiles(stripe_customer_id)
  where stripe_customer_id is not null;
create index if not exists profiles_stripe_subscription_idx
  on public.profiles(stripe_subscription_id)
  where stripe_subscription_id is not null;

-- 2) Tabla de eventos de Stripe para idempotencia
create table if not exists public.stripe_events (
  event_id text primary key,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz default now(),
  result text
);

create index if not exists stripe_events_type_idx
  on public.stripe_events(event_type, processed_at desc);

-- 3) RLS: solo service_role escribe; admin lee (para soporte)
alter table public.stripe_events enable row level security;

drop policy if exists "admin reads stripe events" on public.stripe_events;
create policy "admin reads stripe events"
  on public.stripe_events for select
  using (public.is_admin());
