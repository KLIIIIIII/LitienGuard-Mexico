-- =============================================================
-- 0038_rwd_data_asset.sql
-- Data asset RWD (Real World Data) — preparación intencional para
-- Fase 3+ del roadmap (licencia agregada a pharma/autoridad).
--
-- Modelo Tempus AI: el moat real no es el software, son los outcomes
-- de millones de consultas reales. Cada caso registrado con dx +
-- manejo + outcome es una unidad de valor para futura monetización.
--
-- Estructura:
--   - profiles.consent_rwd_aggregated_at — médico aceptó que sus casos
--     ANONIMIZADOS contribuyan al dataset agregado. NULL = no consent.
--   - diferencial_sessions.contributed_to_rwd — flag de inclusión.
--     Solo TRUE si: (1) outcome marcado, (2) médico dio consent,
--     (3) sin PII identificable (iniciales máx 3 chars, sin nombres).
--   - vista rwd_aggregated_dx — conteos por dx + outcome a nivel
--     plataforma, sin atribución por médico. Read-only para admins.
-- =============================================================

alter table public.profiles
  add column if not exists consent_rwd_aggregated_at timestamptz;

comment on column public.profiles.consent_rwd_aggregated_at is
  'Timestamp cuando el medico aceptó que sus casos anonimizados contribuyan al dataset agregado RWD para licenciamiento futuro. NULL = sin consent — los casos NO entran al dataset.';

alter table public.diferencial_sessions
  add column if not exists contributed_to_rwd boolean not null default false;

comment on column public.diferencial_sessions.contributed_to_rwd is
  'Marcador de inclusión en el dataset RWD agregado. Trigger lo activa cuando el caso cumple los 3 criterios: outcome marcado + médico con consent_rwd_aggregated_at + sin PII identificable.';

-- Trigger: actualiza contributed_to_rwd al cambiar outcome o consent
create or replace function public.update_rwd_contribution()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  has_consent boolean;
  has_outcome boolean;
  pii_safe boolean;
begin
  -- ¿médico tiene consent activo?
  select consent_rwd_aggregated_at is not null into has_consent
  from public.profiles
  where id = new.medico_id;

  -- ¿outcome marcado (no pendiente)?
  has_outcome := new.outcome_confirmado in ('confirmado', 'refutado', 'parcial');

  -- ¿sin PII identificable? Iniciales máx 3 chars, edad sin precisión exacta
  pii_safe := coalesce(length(new.paciente_iniciales), 0) <= 3;

  new.contributed_to_rwd := has_consent and has_outcome and pii_safe;
  return new;
end;
$$;

drop trigger if exists rwd_contribution_trigger on public.diferencial_sessions;
create trigger rwd_contribution_trigger
  before insert or update of outcome_confirmado, paciente_iniciales
  on public.diferencial_sessions
  for each row
  execute function public.update_rwd_contribution();

-- Vista agregada — counts por enfermedad + outcome, SIN atribución a
-- médico individual. Es lo que se exportaría a pharma/autoridad
-- bajo licencia anual.
create or replace view public.rwd_aggregated_dx as
select
  (top_diagnoses->0->>'disease')::text as dx_top1,
  (top_diagnoses->0->>'label')::text as dx_top1_label,
  outcome_confirmado as outcome,
  count(*)::int as n_casos,
  count(distinct medico_id)::int as n_medicos,
  min(created_at)::date as primer_caso,
  max(created_at)::date as ultimo_caso
from public.diferencial_sessions
where contributed_to_rwd = true
  and top_diagnoses is not null
  and jsonb_array_length(top_diagnoses) > 0
group by 1, 2, 3
order by n_casos desc;

comment on view public.rwd_aggregated_dx is
  'Agregado RWD por dx top-1 y outcome. NO contiene atribución a médico individual ni datos del paciente. Base para licenciamiento de Fase 3.';

-- RLS: solo admin lee
alter view public.rwd_aggregated_dx set (security_invoker = true);

-- Función helper para que el médico vea SU contribución personal
-- (sin ver otros médicos)
create or replace function public.mi_contribucion_rwd()
returns table (
  total_casos int,
  casos_contribuidos int,
  casos_con_outcome int,
  fecha_consent timestamptz
)
language sql
security definer
set search_path to 'public'
as $$
  select
    (select count(*)::int from public.diferencial_sessions
     where medico_id = auth.uid()),
    (select count(*)::int from public.diferencial_sessions
     where medico_id = auth.uid() and contributed_to_rwd = true),
    (select count(*)::int from public.diferencial_sessions
     where medico_id = auth.uid()
       and outcome_confirmado in ('confirmado','refutado','parcial')),
    (select consent_rwd_aggregated_at from public.profiles
     where id = auth.uid());
$$;

comment on function public.mi_contribucion_rwd is
  'Permite al medico ver SU propia contribución al RWD agregado, sin acceso a datos de otros médicos.';
