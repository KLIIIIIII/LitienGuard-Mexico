/**
 * Migración de datos — cifra los campos PII + clínicos de las filas
 * EXISTENTES de recetas y recetas_items (Fase C). Se corre UNA vez,
 * después de desplegar el código que sabe leer ambos formatos (cifrado
 * y legacy plaintext).
 *
 * Idempotente: encryptField no doble-cifra valores ya cifrados; el
 * UPDATE solo toca filas que tienen algo legacy que cifrar.
 *
 * Uso (todas las env vars necesarias):
 *   GCP_SERVICE_ACCOUNT_JSON=... GCP_KMS_KEY_NAME=... \
 *   GCP_KMS_WRAPPED_DEK=... SEARCH_HMAC_SECRET=... \
 *   SUPABASE_MGMT_TOKEN=... SUPABASE_PROJECT_REF=... \
 *   node --experimental-strip-types scripts/migrate-encrypt-recetas.mjs
 */

import { encryptField, isEncrypted, searchHash } from "../src/lib/encryption.ts";

const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!MGMT_TOKEN || !PROJECT_REF) {
  console.error("Faltan SUPABASE_MGMT_TOKEN y SUPABASE_PROJECT_REF");
  process.exit(1);
}

const RECETA_FIELDS = [
  "paciente_nombre",
  "paciente_apellido_paterno",
  "paciente_apellido_materno",
  "diagnostico",
  "diagnostico_cie10",
  "indicaciones_generales",
  "observaciones",
  "motivo_anulacion",
];

const ITEM_FIELDS = [
  "medicamento",
  "presentacion",
  "dosis",
  "frecuencia",
  "duracion",
  "via_administracion",
  "indicaciones",
];

async function runSql(query) {
  const r = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MGMT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Respuesta no-JSON: ${text.slice(0, 200)}`);
  }
  if (json.message) throw new Error(`SQL error: ${json.message}`);
  return json;
}

// Dollar-quote seguro: elige un tag que no aparezca en el contenido
function dollarQuote(value) {
  let tag = "enc";
  while (value.includes(`$${tag}$`)) tag += "x";
  return `$${tag}$${value}$${tag}$`;
}

// ----------------------------------------------------------------
// 1) recetas — 8 campos + paciente_search_hash
// ----------------------------------------------------------------
console.log("Leyendo recetas...");
const recetas = await runSql(
  `SELECT id, paciente_search_hash, ${RECETA_FIELDS.join(", ")} FROM public.recetas`,
);

console.log(`${recetas.length} recetas encontradas.\n`);

let updatedRecetas = 0;
let skippedRecetas = 0;

for (const row of recetas) {
  const sets = [];

  // Capturar valores plaintext de nombre/apellidos ANTES de cifrar
  // para reconstruir el search_hash si todavía no existe.
  const plaintextNombre =
    typeof row.paciente_nombre === "string" && !isEncrypted(row.paciente_nombre)
      ? row.paciente_nombre
      : null;
  const plaintextApellidoP =
    typeof row.paciente_apellido_paterno === "string" &&
    !isEncrypted(row.paciente_apellido_paterno)
      ? row.paciente_apellido_paterno
      : null;
  const plaintextApellidoM =
    typeof row.paciente_apellido_materno === "string" &&
    !isEncrypted(row.paciente_apellido_materno)
      ? row.paciente_apellido_materno
      : null;

  for (const field of RECETA_FIELDS) {
    const value = row[field];
    if (value === null || value === undefined || value === "") continue;
    if (isEncrypted(value)) continue;
    const encrypted = await encryptField(value);
    sets.push(`${field} = ${dollarQuote(encrypted)}`);
  }

  // Si todavía no hay search_hash y tenemos plaintext del nombre,
  // calcularlo (preserva "buscar receta de paciente X" sobre data vieja).
  if (!row.paciente_search_hash && plaintextNombre) {
    const fullName = [plaintextNombre, plaintextApellidoP, plaintextApellidoM]
      .map((s) => (s ?? "").trim())
      .filter((s) => s.length > 0)
      .join(" ");
    const hash = searchHash(fullName);
    if (hash) sets.push(`paciente_search_hash = ${dollarQuote(hash)}`);
  }

  if (sets.length === 0) {
    skippedRecetas++;
    continue;
  }
  await runSql(
    `UPDATE public.recetas SET ${sets.join(", ")} WHERE id = '${row.id}'`,
  );
  updatedRecetas++;
  console.log(`  ✓ receta ${row.id} — ${sets.length} campos cifrados`);
}

console.log(
  `\nrecetas: ${updatedRecetas} cifradas, ${skippedRecetas} sin cambios.\n`,
);

// ----------------------------------------------------------------
// 2) recetas_items — 7 campos
// ----------------------------------------------------------------
console.log("Leyendo recetas_items...");
const items = await runSql(
  `SELECT id, ${ITEM_FIELDS.join(", ")} FROM public.recetas_items`,
);

console.log(`${items.length} items encontrados.\n`);

let updatedItems = 0;
let skippedItems = 0;

for (const row of items) {
  const sets = [];
  for (const field of ITEM_FIELDS) {
    const value = row[field];
    if (value === null || value === undefined || value === "") continue;
    if (isEncrypted(value)) continue;
    const encrypted = await encryptField(value);
    sets.push(`${field} = ${dollarQuote(encrypted)}`);
  }
  if (sets.length === 0) {
    skippedItems++;
    continue;
  }
  await runSql(
    `UPDATE public.recetas_items SET ${sets.join(", ")} WHERE id = '${row.id}'`,
  );
  updatedItems++;
  console.log(`  ✓ item ${row.id} — ${sets.length} campos cifrados`);
}

console.log(
  `\nrecetas_items: ${updatedItems} cifrados, ${skippedItems} sin cambios.`,
);
console.log("\nListo.");
