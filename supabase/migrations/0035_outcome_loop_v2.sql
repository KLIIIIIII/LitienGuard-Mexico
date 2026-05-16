-- =============================================================
-- 0035_outcome_loop_v2.sql
-- Outcome loop v2: notas dedicadas al outcome + view de pendientes.
--
-- Antes: el panel de outcome reutilizaba `medico_notas` (campo del
-- momento de la consulta), pisándolo al marcar outcome. Eso hacía
-- imposible distinguir "lo que pensé en consulta" vs "lo que terminó
-- siendo realmente". Loop incompleto.
--
-- Ahora:
--   - `outcome_notes` separado para el resultado real (qué pasó,
--      estudio confirmatorio, evolución).
--   - View `diferencial_pendientes_outcome` lista casos con dx
--     marcado pero sin outcome y >7 días desde la consulta.
--   - View `diferencial_calidad_agregada` con KPIs por médico.
-- =============================================================

alter table public.diferencial_sessions
  add column if not exists outcome_notes text;

comment on column public.diferencial_sessions.outcome_notes is
  'Notas del resultado real (estudio confirmatorio, evolución a N semanas, biopsia, etc). Separadas de medico_notas (momento de consulta) para no perder ninguno.';

-- Casos donde el médico marcó dx pero no marcó outcome y ya pasaron
-- al menos 7 días — candidatos para banner "marcar outcome".
create or replace view public.diferencial_pendientes_outcome as
select
  d.id,
  d.medico_id,
  d.paciente_iniciales,
  d.paciente_edad,
  d.paciente_sexo,
  d.medico_diagnostico_principal,
  d.created_at,
  d.consulta_id,
  (now() - d.created_at) as antiguedad
from public.diferencial_sessions d
where
  d.outcome_confirmado is null
  and coalesce(trim(d.medico_diagnostico_principal), '') <> ''
  and d.created_at < (now() - interval '7 days');

comment on view public.diferencial_pendientes_outcome is
  'Casos con dx asignado pero sin outcome marcado tras 7+ días — candidatos a recordatorio.';

-- View de calidad agregada por médico (precomputa el join de calidad)
create or replace view public.diferencial_calidad_resumen as
select
  d.medico_id,
  count(*)::int                                                  as total,
  count(*) filter (where d.outcome_confirmado = 'confirmado')::int  as confirmados,
  count(*) filter (where d.outcome_confirmado = 'refutado')::int    as refutados,
  count(*) filter (where d.outcome_confirmado = 'parcial')::int     as parciales,
  count(*) filter (where d.outcome_confirmado is null)::int         as pendientes,
  count(*) filter (
    where d.outcome_confirmado is null
      and d.created_at < (now() - interval '7 days')
      and coalesce(trim(d.medico_diagnostico_principal), '') <> ''
  )::int                                                            as pendientes_recordatorio
from public.diferencial_sessions d
group by d.medico_id;

comment on view public.diferencial_calidad_resumen is
  'Resumen rápido de outcomes por médico — feed del banner del home.';

-- Las views heredan RLS de la tabla base; no hace falta enable/policy.
