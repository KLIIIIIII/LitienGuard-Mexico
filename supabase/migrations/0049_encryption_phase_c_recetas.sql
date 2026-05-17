-- =============================================================
-- 0049_encryption_phase_c_recetas.sql
-- Fase C del cifrado app-level — recetas + recetas_items.
--
-- A partir de esta migración, los siguientes campos se cifran en
-- la app con AES-256-GCM antes de persistir (ver src/lib/encryption.ts):
--
--   recetas:
--     paciente_nombre, paciente_apellido_paterno, paciente_apellido_materno,
--     diagnostico, diagnostico_cie10, indicaciones_generales,
--     observaciones, motivo_anulacion
--
--   recetas_items:
--     medicamento, presentacion, dosis, frecuencia, duracion,
--     via_administracion, indicaciones
--
-- NO se cifran (no son PII identificable por sí solos, o son enums/IDs):
--   paciente_edad (int), paciente_sexo (1 char enum), status, fechas,
--   medico_id, receta_id, paciente_email (queda para Fase F PIIs).
--
-- Esta migración hace tres cambios de esquema:
--
--   1) Agrega `paciente_search_hash text` a recetas (HMAC determinístico
--      del nombre completo concatenado, para preservar "buscar receta
--      de paciente X" cuando el texto del nombre ya está cifrado).
--
--   2) Sustituye `recetas_paciente_idx` (sobre paciente_nombre plano)
--      por `recetas_paciente_search_idx` (sobre el HMAC).
--
--   3) Comenta que el cifrado en sí lo hace la app — SQL no tiene
--      acceso a KMS. El script scripts/migrate-encrypt-recetas.mjs
--      cifra filas existentes (idempotente).
-- =============================================================

-- Search hash determinístico para búsqueda exacta de paciente
alter table public.recetas
  add column if not exists paciente_search_hash text;

-- Sustituir el índice viejo (sobre texto que va a estar cifrado) por
-- el nuevo (sobre el HMAC). Mantiene la UX de "buscar receta por
-- paciente" sin filtrar texto cifrado.
drop index if exists recetas_paciente_idx;

create index if not exists recetas_paciente_search_idx
  on public.recetas(medico_id, paciente_search_hash)
  where paciente_search_hash is not null;

comment on column public.recetas.paciente_search_hash is
  'HMAC-SHA256 determinístico del nombre completo (nombre + apellido_p + apellido_m) normalizado (trim + lowercase). Generado en la app con SEARCH_HMAC_SECRET. Permite búsqueda exacta sobre paciente_nombre cifrado.';
