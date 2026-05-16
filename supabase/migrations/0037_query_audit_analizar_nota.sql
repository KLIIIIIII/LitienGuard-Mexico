-- =============================================================
-- 0037_query_audit_analizar_nota.sql
-- Extiende el CHECK constraint de query_audit.action para incluir
-- 'cerebro.analizar_nota' — endpoint E2 (flujo "pega tu nota SOAP"
-- para médicos que vienen de otros EHRs).
-- =============================================================

alter table public.query_audit
  drop constraint if exists query_audit_action_check;

alter table public.query_audit
  add constraint query_audit_action_check
  check (action in (
    'diferencial.procesar',
    'cerebro.buscar',
    'cerebro.analizar_nota'
  ));
