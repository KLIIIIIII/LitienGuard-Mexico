-- =============================================================
-- 0039_anuncios.sql
-- Sistema de anuncios — comunicar nuevas features, cambios y
-- novedades a los doctores activos de la plataforma.
--
-- Tablas:
--   anuncios — entrada principal con título, contenido, audiencia.
--   anuncios_vistos — tracking de quién vio/descartó cada anuncio.
-- =============================================================

do $$ begin
  create type anuncio_tipo as enum (
    'feature',  -- nueva feature lanzada
    'cambio',   -- cambio importante en producto
    'alerta',   -- aviso operacional / mantenimiento
    'tip'       -- tip de uso o mejor práctica
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type anuncio_audiencia as enum (
    'todos',
    'esencial',
    'profesional',
    'clinica',
    'admin'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.anuncios (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  contenido text not null,
  tipo anuncio_tipo not null default 'feature',
  audiencia anuncio_audiencia not null default 'todos',
  -- URL opcional para "ver más" / "ir a la feature"
  link_url text,
  link_label text,
  -- Visibilidad temporal
  publicado_at timestamptz,
  expira_at timestamptz,
  -- Soft delete
  archivado_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists anuncios_publicado_idx
  on public.anuncios (publicado_at desc)
  where archivado_at is null;

comment on table public.anuncios is
  'Anuncios para comunicar nuevas features, cambios o tips a doctores activos.';

create table if not exists public.anuncios_vistos (
  user_id uuid not null references public.profiles(id) on delete cascade,
  anuncio_id uuid not null references public.anuncios(id) on delete cascade,
  visto_at timestamptz default now(),
  descartado_at timestamptz,
  primary key (user_id, anuncio_id)
);

create index if not exists anuncios_vistos_user_idx
  on public.anuncios_vistos (user_id, visto_at desc);

comment on table public.anuncios_vistos is
  'Tracking de visualización y descarte de anuncios por usuario.';

-- RLS
alter table public.anuncios enable row level security;
alter table public.anuncios_vistos enable row level security;

-- Anuncios: todos los autenticados leen los publicados no archivados;
-- solo admin crea/actualiza
drop policy if exists "auth reads published anuncios" on public.anuncios;
create policy "auth reads published anuncios"
  on public.anuncios for select
  using (
    auth.uid() is not null
    and archivado_at is null
    and publicado_at is not null
    and publicado_at <= now()
    and (expira_at is null or expira_at > now())
  );

drop policy if exists "admin reads all anuncios" on public.anuncios;
create policy "admin reads all anuncios"
  on public.anuncios for select
  using (public.is_admin());

drop policy if exists "admin manages anuncios" on public.anuncios;
create policy "admin manages anuncios"
  on public.anuncios for all
  using (public.is_admin())
  with check (public.is_admin());

-- anuncios_vistos: usuario gestiona los suyos
drop policy if exists "user reads own anuncios_vistos" on public.anuncios_vistos;
create policy "user reads own anuncios_vistos"
  on public.anuncios_vistos for select
  using (user_id = auth.uid());

drop policy if exists "user inserts own anuncios_vistos" on public.anuncios_vistos;
create policy "user inserts own anuncios_vistos"
  on public.anuncios_vistos for insert
  with check (user_id = auth.uid());

drop policy if exists "user updates own anuncios_vistos" on public.anuncios_vistos;
create policy "user updates own anuncios_vistos"
  on public.anuncios_vistos for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- updated_at trigger
create or replace function public.anuncios_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists anuncios_updated_at on public.anuncios;
create trigger anuncios_updated_at
  before update on public.anuncios
  for each row execute function public.anuncios_set_updated_at();
