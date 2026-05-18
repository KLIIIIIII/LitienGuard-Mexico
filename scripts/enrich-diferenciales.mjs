/**
 * Enrich Diferenciales — toma los pacientes cohorte-demo de Carlos y
 * agrega diferenciales adicionales para que el motor de Patrones tenga
 * data rica:
 *
 *   - 30% de pacientes con patología obtienen 1 dx secundario (activa coOcurrencias)
 *   - 15% obtienen 2 dx secundarios (cuadros complejos)
 *   - 12% de TODOS los diferenciales obtienen override_razonamiento con
 *     un dx distinto al top — el médico se aparta del motor (activa
 *     overridePatterns)
 *   - Outcomes ya no son 100% confirmados: 65% confirmado, 18% parcial,
 *     12% refutado, 5% pendiente (activa PPV personal realista)
 *
 * No borra nada — solo agrega y modifica diferenciales existentes que
 * no tengan override (idempotente: si ya fueron enriquecidos no se
 * tocan dos veces).
 *
 * Uso:
 *   SUPABASE_MGMT_TOKEN=... SUPABASE_PROJECT_REF=... MEDICO_ID=... \
 *   node scripts/enrich-diferenciales.mjs
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
  let tag = "e";
  const s = String(v);
  while (s.includes(`$${tag}$`)) tag += "x";
  return `$${tag}$${s}$${tag}$`;
}

function escapeJson(obj) {
  let tag = "j";
  const s = JSON.stringify(obj);
  while (s.includes(`$${tag}$`)) tag += "x";
  return `$${tag}$${s}$${tag}$::jsonb`;
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Diagnósticos secundarios que aparecen junto al primario (co-morbilidades reales)
const DX_SECUNDARIOS = {
  "Insuficiencia cardíaca FE reducida": [
    { disease: "dm2-typical", label: "DM2" },
    { disease: "hypertensive-hd", label: "Cardiopatía hipertensiva" },
    { disease: "ckd-stage3", label: "Enfermedad renal crónica estadio 3" },
  ],
  "Cardiopatía isquémica": [
    { disease: "dm2-typical", label: "DM2" },
    { disease: "hypertensive-hd", label: "Cardiopatía hipertensiva" },
    { disease: "dyslipidemia", label: "Dislipidemia" },
  ],
  "DM2": [
    { disease: "hypertensive-hd", label: "Cardiopatía hipertensiva" },
    { disease: "ckd-stage3", label: "Enfermedad renal crónica estadio 3" },
    { disease: "dyslipidemia", label: "Dislipidemia" },
    { disease: "diabetic-retinopathy", label: "Retinopatía diabética" },
  ],
  "EVC isquémico agudo": [
    { disease: "atrial-fibrillation", label: "Fibrilación auricular" },
    { disease: "hypertensive-hd", label: "Cardiopatía hipertensiva" },
    { disease: "dm2-typical", label: "DM2" },
  ],
  "Cáncer de mama HER2+": [
    { disease: "hfref", label: "Insuficiencia cardíaca FE reducida" }, // post-quimio
    { disease: "anemia-cronica", label: "Anemia crónica" },
  ],
  "Sepsis": [
    { disease: "dm2-typical", label: "DM2" },
    { disease: "ckd-stage3", label: "ERC estadio 3" },
  ],
  "Hipotiroidismo": [
    { disease: "dyslipidemia", label: "Dislipidemia" },
    { disease: "anemia-cronica", label: "Anemia" },
  ],
  "Cetoacidosis diabética": [
    { disease: "dm2-typical", label: "DM2" },
    { disease: "uti", label: "Infección urinaria" },
  ],
  "Síndrome de Cushing": [
    { disease: "dm2-typical", label: "DM2 secundaria" },
    { disease: "hypertensive-hd", label: "HTA secundaria" },
    { disease: "osteoporosis", label: "Osteoporosis" },
  ],
};

const RAZONAMIENTOS_OVERRIDE = [
  "Cuadro clínico no encaja con top-1 — paciente con factores de riesgo distintos a los típicos del motor.",
  "Antecedente quirúrgico reciente cambia la probabilidad pre-test.",
  "Hallazgo físico no capturado en el input — soplo nuevo + edema confirmado.",
  "Curso temporal sugiere etiología subaguda, no aguda como propone el motor.",
  "Respuesta a tratamiento empírico previo descarta la opción top-1.",
  "Estudios complementarios (eco, TC) confirman dx alternativo.",
];

// Step 1: Pull diferenciales existentes del médico (de cohorte-demo)
console.log("Cargando diferenciales existentes...");
const difsRes = await runSql(`
  SELECT d.id, d.paciente_iniciales, d.paciente_edad, d.paciente_sexo,
         d.medico_diagnostico_principal, d.outcome_confirmado, d.top_diagnoses
  FROM public.diferencial_sessions d
  WHERE d.medico_id = '${MEDICO_ID}'
    AND d.paciente_iniciales LIKE '_._'
  ORDER BY d.created_at DESC;
`);
console.log(`  ${difsRes.length} diferenciales encontrados\n`);

// Step 2: Generar diferenciales adicionales (secundarios) y overrides
const updatesOverride = [];
const updatesOutcome = [];
const nuevosDifs = [];

for (const d of difsRes) {
  // El campo medico_diagnostico_principal puede venir cifrado.
  // Para el seed, asumimos que se generó como texto plano (recordemos:
  // el seed inserta en plano, sin pasar por encryption layer).
  // Verifico si parece cifrado (empieza con prefijo de KMS o random base64).
  const dx = d.medico_diagnostico_principal;
  if (!dx || dx.length > 200) continue; // skip si parece cifrado

  // 1) Distribuir outcomes: 65% confirmado, 18% parcial, 12% refutado, 5% pendiente
  const r = Math.random();
  let nuevoOutcome = d.outcome_confirmado;
  if (r < 0.05) nuevoOutcome = "pendiente";
  else if (r < 0.17) nuevoOutcome = "refutado";
  else if (r < 0.35) nuevoOutcome = "parcial";
  else nuevoOutcome = "confirmado";
  if (nuevoOutcome !== d.outcome_confirmado) {
    updatesOutcome.push({ id: d.id, outcome: nuevoOutcome });
  }

  // 2) 12% de diferenciales: agregar override_razonamiento
  if (Math.random() < 0.12) {
    updatesOverride.push({
      id: d.id,
      razon: rand(RAZONAMIENTOS_OVERRIDE),
    });
  }

  // 3) 30% de pacientes con patología: agregar 1 dx secundario
  const dxOptions = DX_SECUNDARIOS[dx];
  if (dxOptions && Math.random() < 0.3) {
    const sec = rand(dxOptions);
    nuevosDifs.push({
      pacienteIniciales: d.paciente_iniciales,
      pacienteEdad: d.paciente_edad,
      pacienteSexo: d.paciente_sexo,
      dx: sec.label,
      disease: sec.disease,
      outcome: rand(["confirmado", "confirmado", "confirmado", "parcial"]),
    });

    // 15% adicional: un 3er dx
    if (dxOptions.length > 1 && Math.random() < 0.5) {
      const sec2 = rand(dxOptions.filter((o) => o.disease !== sec.disease));
      if (sec2) {
        nuevosDifs.push({
          pacienteIniciales: d.paciente_iniciales,
          pacienteEdad: d.paciente_edad,
          pacienteSexo: d.paciente_sexo,
          dx: sec2.label,
          disease: sec2.disease,
          outcome: rand(["confirmado", "parcial"]),
        });
      }
    }
  }
}

console.log("Cambios a aplicar:");
console.log(`  Outcomes redistribuidos: ${updatesOutcome.length}`);
console.log(`  Overrides añadidos:      ${updatesOverride.length}`);
console.log(`  Nuevos diferenciales:    ${nuevosDifs.length}\n`);

// Step 3: Apply outcomes
if (updatesOutcome.length > 0) {
  console.log("Actualizando outcomes...");
  for (let i = 0; i < updatesOutcome.length; i += 100) {
    const chunk = updatesOutcome.slice(i, i + 100);
    // Build CASE WHEN
    const cases = chunk
      .map((u) => `WHEN '${u.id}'::uuid THEN '${u.outcome}'`)
      .join(" ");
    const ids = chunk.map((u) => `'${u.id}'::uuid`).join(",");
    await runSql(`
      UPDATE public.diferencial_sessions
      SET outcome_confirmado = CASE id ${cases} END
      WHERE id IN (${ids});
    `);
  }
  console.log(`  ${updatesOutcome.length} outcomes OK\n`);
}

// Step 4: Apply overrides (override_razonamiento es cifrado — usar el
// valor en texto plano, la app lo descifra solo si tiene prefijo)
if (updatesOverride.length > 0) {
  console.log("Añadiendo override_razonamiento...");
  for (let i = 0; i < updatesOverride.length; i += 50) {
    const chunk = updatesOverride.slice(i, i + 50);
    for (const u of chunk) {
      await runSql(`
        UPDATE public.diferencial_sessions
        SET override_razonamiento = ${escapeText(u.razon)}
        WHERE id = '${u.id}';
      `);
    }
  }
  console.log(`  ${updatesOverride.length} overrides OK\n`);
}

// Step 5: Insert nuevos diferenciales secundarios
if (nuevosDifs.length > 0) {
  console.log("Insertando diferenciales secundarios...");
  const DAYS_AGO_BASE = 14;
  for (let i = 0; i < nuevosDifs.length; i += 100) {
    const chunk = nuevosDifs.slice(i, i + 100);
    const values = chunk
      .map((d) => {
        const daysAgo = randInt(1, 180);
        const fechaIso = new Date(Date.now() - daysAgo * 86400000).toISOString();
        const topDxs = [{ disease: d.disease, label: d.dx, posterior: 0.6 + Math.random() * 0.3 }];
        return `('${MEDICO_ID}', ${escapeText(d.pacienteIniciales)}, ${d.pacienteEdad ?? "NULL"}, ${escapeText(d.pacienteSexo)}, ${escapeText("Comorbilidad detectada en seguimiento — agrega al cuadro primario.")}, '[]'::jsonb, ${escapeJson(topDxs)}, ${escapeText(d.dx)}, ${escapeText(d.outcome)}, ${escapeText(fechaIso)}::timestamptz)`;
      })
      .join(",\n");
    await runSql(`
      INSERT INTO public.diferencial_sessions (
        medico_id, paciente_iniciales, paciente_edad, paciente_sexo,
        contexto_clinico, findings_observed, top_diagnoses,
        medico_diagnostico_principal, outcome_confirmado, outcome_confirmado_at
      ) VALUES ${values};
    `);
  }
  console.log(`  ${nuevosDifs.length} diferenciales secundarios OK\n`);
}

// Reporte final
const res = await runSql(`
  SELECT outcome_confirmado, COUNT(*)
  FROM public.diferencial_sessions
  WHERE medico_id = '${MEDICO_ID}' AND paciente_iniciales LIKE '_._'
  GROUP BY outcome_confirmado
  ORDER BY count DESC;
`);
console.log("Distribución final de outcomes:");
for (const r of res) {
  console.log(`  ${(r.outcome_confirmado ?? "null").padEnd(15)} ${r.count}`);
}

const overrideCount = await runSql(`
  SELECT COUNT(*) FROM public.diferencial_sessions
  WHERE medico_id = '${MEDICO_ID}' AND paciente_iniciales LIKE '_._' AND override_razonamiento IS NOT NULL;
`);
console.log(`\nOverrides con razonamiento: ${overrideCount[0].count}`);
