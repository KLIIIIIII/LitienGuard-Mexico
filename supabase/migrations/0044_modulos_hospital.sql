-- Módulos hospitalarios enterprise (Urgencias / Quirófano / UCI / Lab / Radiología)
-- Registra activaciones de protocolos y peticiones para audit + métricas

create table if not exists public.eventos_modulos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paciente_id uuid references public.pacientes(id) on delete set null,
  modulo text not null check (modulo in ('urgencias','quirofano','uci','laboratorio','radiologia')),
  tipo text not null,
  datos jsonb not null default '{}'::jsonb,
  status text not null default 'activo' check (status in ('activo','completado','cancelado')),
  metricas jsonb not null default '{}'::jsonb,
  notas text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists eventos_modulos_user_created_idx
  on public.eventos_modulos (user_id, created_at desc);

create index if not exists eventos_modulos_paciente_idx
  on public.eventos_modulos (paciente_id)
  where paciente_id is not null;

create index if not exists eventos_modulos_modulo_tipo_idx
  on public.eventos_modulos (user_id, modulo, tipo, created_at desc);

create index if not exists eventos_modulos_status_idx
  on public.eventos_modulos (user_id, status, created_at desc)
  where status = 'activo';

alter table public.eventos_modulos enable row level security;

create policy "eventos_modulos_select_owner"
  on public.eventos_modulos
  for select
  using (auth.uid() = user_id);

create policy "eventos_modulos_insert_owner"
  on public.eventos_modulos
  for insert
  with check (auth.uid() = user_id);

create policy "eventos_modulos_update_owner"
  on public.eventos_modulos
  for update
  using (auth.uid() = user_id);

create policy "eventos_modulos_delete_owner"
  on public.eventos_modulos
  for delete
  using (auth.uid() = user_id);

comment on table public.eventos_modulos is
  'Activaciones de protocolos clínicos (sepsis bundle, código stroke, time-out OR, SOFA, peticiones lab/rad) por los módulos hospitalarios.';
