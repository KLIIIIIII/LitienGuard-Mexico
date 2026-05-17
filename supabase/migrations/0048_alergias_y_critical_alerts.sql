-- Sprint seguridad clínica (O1) — alergias del paciente + critical alerts
--
-- Foundation para Allergy hard-stop en recetas + Critical value alerting
-- automático en Lab/Radiología.

-- ============================================================
-- A) Alergias del paciente (cumple AMIA error prevention)
-- ============================================================

alter table public.pacientes
  add column if not exists alergias text[] default array[]::text[];

comment on column public.pacientes.alergias is
  'Lista de alergias documentadas del paciente. Usado por allergy hard-stop en recetas (cross-check sintáctico pre-firma) y por PatientHeader sticky en módulos clínicos.';

-- Índice GIN para queries tipo "tiene alergia a X"
create index if not exists pacientes_alergias_idx
  on public.pacientes using gin (alergias)
  where array_length(alergias, 1) > 0;

-- ============================================================
-- B) Critical value alerts (eventos_modulos · tipo = critical_alert)
-- ============================================================
-- Reutilizamos la tabla eventos_modulos ya existente. Solo agregamos
-- columna acknowledged_at para que el clínico marque la alerta como
-- vista. Sin acknowledged_at = banner persistente en dashboard.

alter table public.eventos_modulos
  add column if not exists acknowledged_at timestamptz,
  add column if not exists acknowledged_by uuid references auth.users(id) on delete set null;

create index if not exists eventos_modulos_alerts_pending_idx
  on public.eventos_modulos (user_id, created_at desc)
  where tipo = 'critical_alert' and acknowledged_at is null;

comment on column public.eventos_modulos.acknowledged_at is
  'Timestamp cuando el clínico acknowledgea una alerta crítica. NULL = pendiente, banner persistente.';
