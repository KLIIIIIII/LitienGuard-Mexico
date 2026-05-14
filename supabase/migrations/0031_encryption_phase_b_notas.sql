-- =============================================================
-- 0031_encryption_phase_b_notas.sql
-- Fase B del cifrado app-level — notas_scribe.
--
-- Los campos clínicos de notas_scribe (transcripcion, soap_subjetivo,
-- soap_objetivo, soap_analisis, soap_plan) ahora se cifran en la app
-- con AES-256-GCM antes de persistir (ver src/lib/encryption.ts).
--
-- Esta migración solo hace UN cambio de esquema: deshabilita el
-- trigger que sincronizaba notas firmadas al cerebro colectivo.
--
-- POR QUÉ: el trigger sync_nota_to_practica leía soap_analisis +
-- soap_plan directamente en SQL y los copiaba a cerebro_chunks.content.
-- Con esos campos cifrados, el trigger copiaría texto cifrado e
-- ilegible al índice BM25. La extracción ahora se hace en la app
-- (scribe/actions.ts → extractNotaToCerebro), donde sí hay acceso a
-- la KMS key para descifrar.
--
-- El cifrado de las filas existentes lo hace el script
-- scripts/migrate-encrypt-notas.mjs (corre una vez, fuera de SQL,
-- porque SQL no tiene acceso a KMS).
-- =============================================================

-- Deshabilitar el trigger SQL — la extracción al cerebro es ahora
-- responsabilidad de la app. La función sync_nota_to_practica se
-- conserva por si se necesita rollback, pero ya no se dispara.
drop trigger if exists notas_scribe_sync_practica on public.notas_scribe;

comment on function public.sync_nota_to_practica() is
  'DESHABILITADO desde migración 0031 — la extracción al cerebro se hace en la app (scribe/actions.ts::extractNotaToCerebro) porque los campos soap_* están cifrados y SQL no puede descifrarlos. Se conserva la función para posible rollback.';
