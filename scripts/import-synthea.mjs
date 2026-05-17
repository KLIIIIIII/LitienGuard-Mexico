/**
 * CLI Importer Synthea → Supabase.
 *
 * Lee un directorio con archivos FHIR JSON generados por Synthea
 * (synthetichealth/synthea, output/fhir/) o por nuestro fixture
 * de prueba (scripts/synthea-fixtures/), parsea cada bundle con
 * parseSyntheaBundle y los inserta a Supabase.
 *
 * Uso:
 *   SUPABASE_MGMT_TOKEN=... SUPABASE_PROJECT_REF=... \
 *   MEDICO_ID=<uuid-del-medico-demo> \
 *   node --experimental-strip-types scripts/import-synthea.mjs \
 *     --input ./scripts/synthea-fixtures/ \
 *     [--limit 100]
 *
 * Mapeo a tablas:
 *   - Patient   → pacientes (apellido_paterno, fecha_nacimiento, sexo)
 *   - Encounter → consultas (tipo, motivo_consulta, fecha, status='cerrada')
 *   - Observation con LOINC reconocido → eventos_modulos tipo 'valor_lab'
 *   - Condition activa → notas_internas del paciente (lista de dx)
 *   - MedicationRequest → omite por ahora (necesita mapeo a recetas_items)
 *
 * Idempotente: usa `import_lote_id` para identificar el batch y
 * NO duplica si se corre dos veces con la misma cohorte (chequeo por
 * (medico_id, apellido_paterno, nombre, fecha_nacimiento)).
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { parseSyntheaBundle, getActiveDiseaseIds } from "../src/lib/importers/synthea-fhir.ts";

// ----------------------------------------------------------------
// CLI args
// ----------------------------------------------------------------
function arg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || idx === process.argv.length - 1) return fallback;
  return process.argv[idx + 1];
}

const INPUT_DIR = arg("input");
const LIMIT = arg("limit") ? Number(arg("limit")) : null;

const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const MEDICO_ID = process.env.MEDICO_ID;

if (!INPUT_DIR) {
  console.error("Falta --input <directorio>");
  process.exit(1);
}
if (!MGMT_TOKEN || !PROJECT_REF) {
  console.error("Faltan SUPABASE_MGMT_TOKEN y SUPABASE_PROJECT_REF");
  process.exit(1);
}
if (!MEDICO_ID) {
  console.error("Falta MEDICO_ID (uuid del médico al que se asignarán los pacientes)");
  process.exit(1);
}

// ----------------------------------------------------------------
// SQL helpers
// ----------------------------------------------------------------
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

function quote(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  // dollar-quote para texto seguro
  let tag = "syn";
  const s = String(value);
  while (s.includes(`$${tag}$`)) tag += "x";
  return `$${tag}$${s}$${tag}$`;
}

// ----------------------------------------------------------------
// Read JSON files
// ----------------------------------------------------------------
function readBundles(dir) {
  const absDir = resolve(dir);
  const files = readdirSync(absDir).filter((f) => f.endsWith(".json"));
  const bundles = [];
  for (const f of files) {
    const full = join(absDir, f);
    if (!statSync(full).isFile()) continue;
    try {
      const raw = readFileSync(full, "utf8");
      const json = JSON.parse(raw);
      // Aceptar Bundle individual o array
      if (Array.isArray(json)) {
        for (const b of json) bundles.push({ file: f, bundle: b });
      } else {
        bundles.push({ file: f, bundle: json });
      }
    } catch (e) {
      console.error(`Error leyendo ${f}: ${e.message}`);
    }
    if (LIMIT && bundles.length >= LIMIT) break;
  }
  return bundles;
}

// ----------------------------------------------------------------
// Insert helpers
// ----------------------------------------------------------------
async function createImportLote() {
  const r = await runSql(
    `INSERT INTO public.pacientes_import_lotes (medico_id, rows_total, status, notas)
     VALUES ('${MEDICO_ID}', 0, 'procesando', ${quote("Synthea import via CLI")})
     RETURNING id;`,
  );
  return r[0].id;
}

async function updateImportLote(loteId, total, ok, errors) {
  await runSql(
    `UPDATE public.pacientes_import_lotes
     SET rows_total=${total}, rows_ok=${ok}, rows_error=${errors},
         status=${quote(errors === 0 ? "completado" : "completado")}
     WHERE id='${loteId}';`,
  );
}

async function upsertPaciente(patient, conditions, loteId) {
  const dxList = conditions
    .filter((c) => c.activa)
    .map((c) => c.textoLibre)
    .slice(0, 20)
    .join(" · ");
  const notas = `Cohorte sintética · ${dxList || "sin dx activos"}`;

  // Anti-duplicado: chequeo por (medico_id, apellido, nombre, fecha_nac)
  const apellido = patient.apellidoPaterno
    ? patient.apellidoPaterno.toLowerCase().replace(/'/g, "")
    : "";
  const nombre = patient.nombre.toLowerCase().replace(/'/g, "");
  const dob = patient.fechaNacimiento ?? null;

  const existing = await runSql(
    `SELECT id FROM public.pacientes
     WHERE medico_id='${MEDICO_ID}'
       AND lower(nombre)=${quote(nombre)}
       AND lower(coalesce(apellido_paterno, ''))=${quote(apellido)}
       AND fecha_nacimiento ${dob ? `=${quote(dob)}::date` : "IS NULL"}
     LIMIT 1;`,
  );
  if (existing.length > 0) {
    return { id: existing[0].id, created: false };
  }

  const r = await runSql(
    `INSERT INTO public.pacientes (
       medico_id, nombre, apellido_paterno, apellido_materno,
       fecha_nacimiento, sexo, email, telefono,
       notas_internas, import_lote_id, etiquetas
     ) VALUES (
       '${MEDICO_ID}',
       ${quote(patient.nombre)},
       ${quote(patient.apellidoPaterno)},
       ${quote(patient.apellidoMaterno)},
       ${dob ? `${quote(dob)}::date` : "NULL"},
       ${quote(patient.sexo)},
       ${quote(patient.email)},
       ${quote(patient.telefono)},
       ${quote(notas)},
       '${loteId}',
       ARRAY['cohorte-demo','synthea']
     ) RETURNING id;`,
  );
  return { id: r[0].id, created: true };
}

async function insertEncounters(pacienteId, encounters) {
  let inserted = 0;
  for (const e of encounters.slice(0, 10)) {
    if (!e.inicioIso) continue;
    const tipo = (e.tipo || "consulta_externa").toLowerCase().includes("emerg")
      ? "urgencia"
      : "subsecuente";
    await runSql(
      `INSERT INTO public.consultas (
         medico_id, paciente_id, fecha, tipo, status,
         motivo_consulta
       ) VALUES (
         '${MEDICO_ID}',
         '${pacienteId}',
         ${quote(e.inicioIso)}::timestamptz,
         ${quote(tipo)}::consulta_tipo,
         'cerrada'::consulta_status,
         ${quote(e.motivo)}
       );`,
    );
    inserted++;
  }
  return inserted;
}

async function insertLabValues(pacienteIniciales, observations) {
  let inserted = 0;
  for (const o of observations.slice(0, 30)) {
    if (!o.labTest || o.valor === null) continue;
    const datos = JSON.stringify({
      paciente_iniciales: pacienteIniciales,
      test: o.labTest,
      valor: o.valor,
      source: "synthea_cohort",
    }).replace(/'/g, "''");
    await runSql(
      `INSERT INTO public.eventos_modulos (
         user_id, modulo, tipo, datos, status, completed_at
       ) VALUES (
         '${MEDICO_ID}',
         'laboratorio',
         'valor_lab',
         '${datos}'::jsonb,
         'completado',
         ${o.fechaIso ? `${quote(o.fechaIso)}::timestamptz` : "now()"}
       );`,
    );
    inserted++;
  }
  return inserted;
}

// ----------------------------------------------------------------
// Main
// ----------------------------------------------------------------
console.log(`Synthea Import CLI`);
console.log(`Input:    ${INPUT_DIR}`);
console.log(`Médico:   ${MEDICO_ID}`);
console.log(`Límite:   ${LIMIT ?? "sin límite"}`);
console.log(``);

const bundles = readBundles(INPUT_DIR);
console.log(`${bundles.length} bundles encontrados.\n`);

if (bundles.length === 0) {
  console.error("No hay bundles para importar. Aborta.");
  process.exit(1);
}

const loteId = await createImportLote();
console.log(`Lote de import: ${loteId}\n`);

let okCount = 0;
let errorCount = 0;
const stats = {
  pacientes: 0,
  pacientesNuevos: 0,
  encuentros: 0,
  labs: 0,
  conditions: 0,
  conditionsMatched: 0,
};

for (let i = 0; i < bundles.length; i++) {
  const { file, bundle } = bundles[i];
  try {
    const result = parseSyntheaBundle(bundle);
    if (!result) {
      console.log(`  [${i + 1}/${bundles.length}] ${file}: sin Patient → skip`);
      errorCount++;
      continue;
    }

    const upsertRes = await upsertPaciente(result.patient, result.conditions, loteId);
    stats.pacientes++;
    if (upsertRes.created) stats.pacientesNuevos++;

    const enc = await insertEncounters(upsertRes.id, result.encounters);
    stats.encuentros += enc;

    const pacienteIniciales =
      (result.patient.nombre[0] ?? "") +
      "." +
      (result.patient.apellidoPaterno?.[0] ?? "");
    const labs = await insertLabValues(pacienteIniciales, result.observations);
    stats.labs += labs;

    stats.conditions += result.conditions.length;
    stats.conditionsMatched += result.conditions.filter((c) => c.diseaseId).length;

    const activeIds = getActiveDiseaseIds(result);
    okCount++;
    console.log(
      `  [${i + 1}/${bundles.length}] ${file}: ${result.patient.nombre} ${
        result.patient.apellidoPaterno ?? ""
      } · ${enc} enc · ${labs} labs · dx: ${activeIds.join(", ") || "ninguno"}${
        upsertRes.created ? " · NUEVO" : " · existente"
      }`,
    );
  } catch (e) {
    errorCount++;
    console.error(`  [${i + 1}/${bundles.length}] ${file}: ERROR ${e.message}`);
  }
}

await updateImportLote(loteId, bundles.length, okCount, errorCount);

console.log(``);
console.log(`Import completado.`);
console.log(`  Pacientes totales:      ${stats.pacientes}`);
console.log(`  Pacientes nuevos:       ${stats.pacientesNuevos}`);
console.log(`  Encuentros insertados:  ${stats.encuentros}`);
console.log(`  Valores lab insertados: ${stats.labs}`);
console.log(
  `  Conditions mapeadas:    ${stats.conditionsMatched}/${stats.conditions} (${
    stats.conditions > 0
      ? Math.round((stats.conditionsMatched / stats.conditions) * 100)
      : 0
  }%)`,
);
console.log(`  Errores:                ${errorCount}`);
console.log(``);
console.log(`Lote ID: ${loteId}`);
