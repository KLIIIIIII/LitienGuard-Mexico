-- =============================================================
-- 0050_decrypt_monitor.sql
-- Monitoreo de descifrado masivo — defensa en profundidad ante
-- exfiltración por una cuenta comprometida.
--
-- Cada vez que la app descifra en lote (lista de recetas, expediente
-- de paciente, etc.), recordBulkDecryption(user_id, surface, count)
-- incrementa el contador del minuto. Si supera umbrales, se inserta
-- una entrada en audit_log; un dashboard interno o webhook puede
-- reaccionar (alerta a admin, suspender sesión, etc.).
--
-- Diseño portable: la tabla es Postgres estándar. Si en el futuro
-- migramos a Redis para velocidad, el helper recordBulkDecryption
-- se reemplaza pero el esquema de los logs no cambia.
-- =============================================================

create table if not exists public.decrypt_counters (
  user_id uuid not null references public.profiles(id) on delete cascade,
  minute_bucket timestamptz not null,
  surface text not null,
  count int not null default 0,
  primary key (user_id, minute_bucket, surface)
);

create index if not exists decrypt_counters_window_idx
  on public.decrypt_counters (user_id, minute_bucket desc);

comment on table public.decrypt_counters is
  'Contadores de descifrado por usuario y ventana de un minuto. Se purga periódicamente (>24h). Si una suma móvil pasa umbral, se inserta entrada en audit_log con action=decrypt.high_volume.';

-- RLS: solo admin lee. La app escribe vía service role (recordBulkDecryption)
alter table public.decrypt_counters enable row level security;

drop policy if exists "admin reads decrypt_counters" on public.decrypt_counters;
create policy "admin reads decrypt_counters"
  on public.decrypt_counters for select
  using (public.is_admin());

-- Purga automática de contadores viejos (>24h) para evitar bloat
create or replace function public.purge_old_decrypt_counters()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.decrypt_counters
  where minute_bucket < now() - interval '24 hours';
$$;

comment on function public.purge_old_decrypt_counters is
  'Llamar periódicamente (cron o webhook) para purgar contadores viejos.';
