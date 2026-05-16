/**
 * Migración batch — cifra el campo `content` de las filas EXISTENTES
 * de cerebro_chunks (Fase A2 del programa de protección). Se corre UNA
 * vez después de desplegar el código que descifra al leer e inserta
 * cifrado.
 *
 * Idempotente: encryptField no doble-cifra valores ya cifrados, así que
 * correrlo dos veces no hace daño.
 *
 * Uso (todas las env vars necesarias):
 *   GCP_SERVICE_ACCOUNT_JSON=... GCP_KMS_KEY_NAME=... \
 *   GCP_KMS_WRAPPED_DEK=... SEARCH_HMAC_SECRET=... \
 *   SUPABASE_MGMT_TOKEN=... SUPABASE_PROJECT_REF=... \
 *   node --experimental-strip-types scripts/migrate-encrypt-cerebro-chunks.mjs
 */

import { encryptField, isEncrypted } from "../src/lib/encryption.ts";

const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;

if (!MGMT_TOKEN || !PROJECT_REF) {
  console.error("Faltan SUPABASE_MGMT_TOKEN y SUPABASE_PROJECT_REF");
  process.exit(1);
}

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

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

console.log("Leyendo cerebro_chunks...");
const rows = await runSql(
  `SELECT id, content FROM public.cerebro_chunks ORDER BY id`,
);

console.log(`${rows.length} chunks encontrados.\n`);

let updated = 0;
let skipped = 0;
let empty = 0;

for (const row of rows) {
  const value = row.content;
  if (value === null || value === undefined || value === "") {
    empty++;
    continue;
  }
  if (isEncrypted(value)) {
    skipped++;
    continue;
  }
  const encrypted = await encryptField(value);
  await runSql(
    `UPDATE public.cerebro_chunks SET content = ${dollarQuote(encrypted)} WHERE id = '${sqlEscape(row.id)}'`,
  );
  updated++;
  if (updated % 50 === 0) console.log(`  ... ${updated} chunks cifrados`);
}

console.log(
  `\nListo: ${updated} chunks cifrados, ${skipped} ya estaban cifrados, ${empty} vacíos.`,
);
