/**
 * Migración de datos — cifra los campos clínicos de las filas EXISTENTES
 * de notas_scribe (Fase B). Se corre UNA vez, después de desplegar el
 * código que sabe leer ambos formatos (cifrado y legacy plaintext).
 *
 * Idempotente: encryptField no doble-cifra valores ya cifrados, así que
 * correrlo dos veces no hace daño.
 *
 * Uso (todas las env vars necesarias):
 *   GCP_SERVICE_ACCOUNT_JSON=... GCP_KMS_KEY_NAME=... \
 *   GCP_KMS_WRAPPED_DEK=... SEARCH_HMAC_SECRET=... \
 *   SUPABASE_MGMT_TOKEN=... SUPABASE_PROJECT_REF=... \
 *   node --experimental-strip-types scripts/migrate-encrypt-notas.mjs
 */

import { encryptField, isEncrypted } from "../src/lib/encryption.ts";

const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!MGMT_TOKEN || !PROJECT_REF) {
  console.error("Faltan SUPABASE_MGMT_TOKEN y SUPABASE_PROJECT_REF");
  process.exit(1);
}

const FIELDS = [
  "transcripcion",
  "soap_subjetivo",
  "soap_objetivo",
  "soap_analisis",
  "soap_plan",
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

console.log("Leyendo notas_scribe...");
const rows = await runSql(
  `SELECT id, ${FIELDS.join(", ")} FROM public.notas_scribe`,
);

console.log(`${rows.length} notas encontradas.\n`);

let updated = 0;
let skipped = 0;

for (const row of rows) {
  const sets = [];
  for (const field of FIELDS) {
    const value = row[field];
    if (value === null || value === undefined || value === "") continue;
    if (isEncrypted(value)) continue; // ya cifrado — idempotencia
    const encrypted = await encryptField(value);
    sets.push(`${field} = ${dollarQuote(encrypted)}`);
  }
  if (sets.length === 0) {
    skipped++;
    continue;
  }
  await runSql(
    `UPDATE public.notas_scribe SET ${sets.join(", ")} WHERE id = '${row.id}'`,
  );
  updated++;
  console.log(`  ✓ ${row.id} — ${sets.length} campos cifrados`);
}

console.log(`\nListo: ${updated} notas cifradas, ${skipped} sin cambios.`);
