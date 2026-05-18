/**
 * Seed Camas — crea las 300 camas del hospital distribuidas por
 * departamento, y las marca como ocupadas/libres según los encounters
 * activos del médico.
 *
 * Distribución típica de hospital privado mediano (300 camas):
 *   Urgencias:        40 (URG-01 … URG-40)
 *   UCI:              30 (ICU-01 … ICU-30)
 *   Quirófano (OR):   12 salas (OR-1 … OR-12)
 *   Hospitalización:  120 (HOS-101 … HOS-220, distribuidas por piso)
 *   Cardiología:      24 (CAR-1 … CAR-24)
 *   Neurología:       18 (NEU-1 … NEU-18)
 *   Oncología:        20 (ONC-1 … ONC-20)
 *   Endocrinología:   12 (END-1 … END-12)
 *   Pediatría:        20 (PED-1 … PED-20)
 *   Maternidad:       20 (MAT-1 … MAT-20) — 4 son box_or de parto
 *   TOTAL:            316 (≈300 efectivas, contando 12 ORs como salas)
 *
 * Uso:
 *   SUPABASE_MGMT_TOKEN=... SUPABASE_PROJECT_REF=... MEDICO_ID=... \
 *   node scripts/seed-camas.mjs
 */

const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const MEDICO_ID = process.env.MEDICO_ID;

if (!MGMT_TOKEN || !PROJECT_REF || !MEDICO_ID) {
  console.error("Faltan SUPABASE_MGMT_TOKEN, SUPABASE_PROJECT_REF y MEDICO_ID");
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
  if (json.message) throw new Error(`SQL error: ${json.message.slice(0, 500)}`);
  return json;
}

function escapeText(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  return `'${String(v).replaceAll("'", "''")}'`;
}

// -------------------------------------------------------------
// Distribución
// -------------------------------------------------------------
const DISTRIBUCION = [
  { modulo: "urgencias", prefix: "URG", n: 40, ala: "ED" },
  { modulo: "uci", prefix: "ICU", n: 30, ala: "ICU" },
  { modulo: "quirofano", prefix: "OR", n: 12, ala: "OR", tipo: "box_or" },
  { modulo: "hospitalizacion", prefix: "HOS-1", n: 40, ala: "Piso 1", piso: 1 },
  { modulo: "hospitalizacion", prefix: "HOS-2", n: 40, ala: "Piso 2", piso: 2 },
  { modulo: "hospitalizacion", prefix: "HOS-3", n: 40, ala: "Piso 3", piso: 3 },
  { modulo: "cardiologia", prefix: "CAR", n: 24, ala: "Cardio Unit" },
  { modulo: "neurologia", prefix: "NEU", n: 18, ala: "Stroke Unit" },
  { modulo: "oncologia", prefix: "ONC", n: 20, ala: "Oncology Ward" },
  { modulo: "endocrinologia", prefix: "END", n: 12, ala: "Endo Ward" },
  { modulo: "pediatria", prefix: "PED", n: 20, ala: "Pediatric Ward" },
  { modulo: "maternidad", prefix: "MAT", n: 20, ala: "Maternity" },
];

console.log(`Limpiando camas previas del médico ${MEDICO_ID}…`);
await runSql(`DELETE FROM public.camas WHERE user_id = '${MEDICO_ID}';`);
console.log("OK\n");

console.log("Generando 316 camas distribuidas en 10 áreas…");
const camas = [];
for (const dep of DISTRIBUCION) {
  for (let i = 1; i <= dep.n; i++) {
    const num = i.toString().padStart(2, "0");
    const label =
      dep.prefix.startsWith("OR")
        ? `OR-${i}`
        : dep.prefix.startsWith("HOS-")
          ? `${dep.prefix}${num}`
          : `${dep.prefix}-${num}`;
    // 8% son tipo aislamiento o negativa para diversidad
    let tipo = dep.tipo ?? "estandar";
    if (!dep.tipo) {
      const r = Math.random();
      if (r < 0.04) tipo = "negativa";
      else if (r < 0.08) tipo = "aislamiento";
      else if (dep.modulo === "hospitalizacion" && r < 0.1) tipo = "vip";
    }
    camas.push({
      label,
      modulo: dep.modulo,
      ala: dep.ala,
      piso: dep.piso ?? null,
      tipo,
    });
  }
}
console.log(`  ${camas.length} camas en memoria\n`);

// Bulk insert
console.log("Insertando camas…");
for (let i = 0; i < camas.length; i += 80) {
  const chunk = camas.slice(i, i + 80);
  const values = chunk
    .map(
      (c) =>
        `('${MEDICO_ID}', ${escapeText(c.label)}, ${escapeText(c.modulo)}, ${escapeText(c.ala)}, ${c.piso ?? "NULL"}, ${escapeText(c.tipo)})`,
    )
    .join(",\n");
  await runSql(
    `INSERT INTO public.camas (user_id, label, modulo, ala, piso, tipo) VALUES ${values};`,
  );
}
console.log(`  ${camas.length} camas insertadas\n`);

// -------------------------------------------------------------
// Asignar camas a encounters activos
// -------------------------------------------------------------
console.log("Sincronizando ocupación con encounters activos…");

// Para cada modulo, asignar camas libres a los encounters activos del
// mismo modulo (en orden de admisión). Si hay más activos que camas en
// su modulo, los sobrantes se ponen en hospitalización general.
const moduleMapping = {
  urgencias: "urgencias",
  uci: "uci",
  quirofano: "quirofano",
  cardiologia: "cardiologia",
  neurologia: "neurologia",
  oncologia: "oncologia",
  endocrinologia: "endocrinologia",
  hospitalizacion: "hospitalizacion",
};

let totalAsignadas = 0;
for (const [encMod, camaMod] of Object.entries(moduleMapping)) {
  // Encounters activos en ese módulo
  const activos = await runSql(`
    SELECT id, paciente_id FROM public.encounters
    WHERE user_id = '${MEDICO_ID}' AND status = 'activo' AND modulo = '${encMod}'
    ORDER BY admitted_at ASC;
  `);

  if (activos.length === 0) continue;

  // Camas libres en ese módulo
  const camasLibres = await runSql(`
    SELECT id, label FROM public.camas
    WHERE user_id = '${MEDICO_ID}' AND modulo = '${camaMod}' AND status = 'libre'
    ORDER BY label ASC;
  `);

  const pairs = Math.min(activos.length, camasLibres.length);
  for (let i = 0; i < pairs; i++) {
    await runSql(`
      UPDATE public.camas
      SET status = 'ocupada', encounter_id = '${activos[i].id}'
      WHERE id = '${camasLibres[i].id}';

      UPDATE public.encounters
      SET bed_label = '${camasLibres[i].label}'
      WHERE id = '${activos[i].id}';
    `);
    totalAsignadas++;
  }

  // Si hay más activos que camas, los sobrantes a hospitalización
  if (activos.length > pairs && camaMod !== "hospitalizacion") {
    const sobrantes = activos.slice(pairs);
    const hospLibres = await runSql(`
      SELECT id, label FROM public.camas
      WHERE user_id = '${MEDICO_ID}' AND modulo = 'hospitalizacion' AND status = 'libre'
      ORDER BY label ASC
      LIMIT ${sobrantes.length};
    `);
    for (let i = 0; i < Math.min(sobrantes.length, hospLibres.length); i++) {
      await runSql(`
        UPDATE public.camas SET status = 'ocupada', encounter_id = '${sobrantes[i].id}' WHERE id = '${hospLibres[i].id}';
        UPDATE public.encounters SET bed_label = '${hospLibres[i].label}' WHERE id = '${sobrantes[i].id}';
      `);
      totalAsignadas++;
    }
  }
}

console.log(`  ${totalAsignadas} camas asignadas a encounters activos\n`);

// Algunas camas a "limpieza" o "mantenimiento" para realismo
console.log("Marcando algunas camas en limpieza/mantenimiento…");
await runSql(`
  WITH muestra AS (
    SELECT id FROM public.camas
    WHERE user_id = '${MEDICO_ID}' AND status = 'libre'
    ORDER BY random() LIMIT 18
  )
  UPDATE public.camas SET status = 'limpieza' WHERE id IN (SELECT id FROM muestra);
`);
await runSql(`
  WITH muestra AS (
    SELECT id FROM public.camas
    WHERE user_id = '${MEDICO_ID}' AND status = 'libre'
    ORDER BY random() LIMIT 6
  )
  UPDATE public.camas SET status = 'mantenimiento' WHERE id IN (SELECT id FROM muestra);
`);

// Reporte final
const reporte = await runSql(`
  SELECT modulo, status, COUNT(*) AS n
  FROM public.camas
  WHERE user_id = '${MEDICO_ID}'
  GROUP BY modulo, status
  ORDER BY modulo, status;
`);
const totales = await runSql(`
  SELECT status, COUNT(*) AS n FROM public.camas WHERE user_id = '${MEDICO_ID}' GROUP BY status ORDER BY n DESC;
`);

console.log("Distribución final:");
for (const r of reporte) {
  console.log(`  ${r.modulo.padEnd(18)} ${r.status.padEnd(15)} ${r.n}`);
}
console.log("");
console.log("Totales:");
for (const t of totales) {
  console.log(`  ${t.status.padEnd(15)} ${t.n}`);
}
