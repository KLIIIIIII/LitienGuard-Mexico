/**
 * Seed Hospital — pobla la cuenta de un médico con N pacientes
 * sintéticos + eventos en TODOS los workflows operacionales + bundles
 * en TODOS los departamentos clínicos.
 *
 * Distribución estratégica (para N=500):
 *   - 80  cardio   (DM+IC, IAM, HTA, ATTR-CM)
 *   - 60  onco     (mama, cervix, ovario, endometrio)
 *   - 50  neuro    (EVC, epilepsia, demencia, migraña aura)
 *   - 50  endo     (DM2, hipotiroidismo, Cushing, DKA)
 *   - 40  infecto  (sepsis, endocarditis, CAP)
 *   - 30  UCI      (críticos con SOFA + APACHE + FAST-HUG + CAM-ICU)
 *   - 30  cirugía  (WHO Checklist + RCRI)
 *   - 160 controles sanos
 *
 * Eventos de workflow insertados para activar cada módulo:
 *   - Urgencias: triages + protocolos críticos + disposition
 *   - UCI: SOFA + APACHE II + FAST-HUG + CAM-ICU
 *   - Quirófano: WHO Checklist + RCRI
 *   - Lab: valor_lab con valores críticos y normales
 *   - Cardiología/Neuro/Onco/Endo: HEART/NIHSS/ECOG/HbA1c
 *
 * Uso:
 *   SUPABASE_MGMT_TOKEN=... SUPABASE_PROJECT_REF=... \
 *   MEDICO_ID=8923af6b-5d0a-4cf6-85e8-badf86d24d13 \
 *   node --experimental-strip-types scripts/seed-hospital.mjs --count 500
 *
 * El medico_id puede pasar también como --medico-id <uuid>.
 */

// ----------------------------------------------------------------
// CLI args + env
// ----------------------------------------------------------------
function arg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || idx === process.argv.length - 1) return fallback;
  return process.argv[idx + 1];
}

const COUNT = arg("count") ? Number(arg("count")) : 500;
const MGMT_TOKEN = process.env.SUPABASE_MGMT_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const MEDICO_ID = arg("medico-id") ?? process.env.MEDICO_ID;

if (!MGMT_TOKEN || !PROJECT_REF) {
  console.error("Faltan SUPABASE_MGMT_TOKEN y SUPABASE_PROJECT_REF");
  process.exit(1);
}
if (!MEDICO_ID) {
  console.error("Falta MEDICO_ID (uuid del médico destino)");
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
  if (json.message) throw new Error(`SQL error: ${json.message.slice(0, 500)}`);
  return json;
}

function escapeText(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  let tag = "seed";
  const s = String(value);
  while (s.includes(`$${tag}$`)) tag += "x";
  return `$${tag}$${s}$${tag}$`;
}

function escapeJson(obj) {
  let tag = "j";
  const s = JSON.stringify(obj);
  while (s.includes(`$${tag}$`)) tag += "x";
  return `$${tag}$${s}$${tag}$::jsonb`;
}

// ----------------------------------------------------------------
// Generadores aleatorios
// ----------------------------------------------------------------
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min, max, decimals = 1) {
  return (
    Math.round((Math.random() * (max - min) + min) * 10 ** decimals) /
    10 ** decimals
  );
}

const NOMBRES_M = [
  "Juan",
  "Carlos",
  "José",
  "Luis",
  "Miguel",
  "Roberto",
  "Eduardo",
  "Daniel",
  "Pedro",
  "Antonio",
  "Francisco",
  "Manuel",
  "Jorge",
  "Alejandro",
  "Ricardo",
  "Fernando",
  "Raúl",
  "Sergio",
  "Arturo",
  "Mario",
];
const NOMBRES_F = [
  "María",
  "Guadalupe",
  "Ana",
  "Sofía",
  "Laura",
  "Patricia",
  "Carmen",
  "Rosa",
  "Elena",
  "Lucía",
  "Adriana",
  "Beatriz",
  "Mónica",
  "Verónica",
  "Andrea",
  "Sandra",
  "Claudia",
  "Diana",
  "Gabriela",
  "Mariana",
];
const APELLIDOS = [
  "Hernández",
  "García",
  "Martínez",
  "López",
  "González",
  "Pérez",
  "Rodríguez",
  "Sánchez",
  "Ramírez",
  "Cruz",
  "Flores",
  "Gómez",
  "Morales",
  "Vázquez",
  "Jiménez",
  "Reyes",
  "Gutiérrez",
  "Rivera",
  "Torres",
  "Mendoza",
  "Aguilar",
  "Domínguez",
  "Castillo",
  "Ortega",
  "Vargas",
];

function genPatient(category) {
  const sexo = Math.random() < 0.5 ? "M" : "F";
  const nombre = sexo === "M" ? rand(NOMBRES_M) : rand(NOMBRES_F);
  const apellidoP = rand(APELLIDOS);
  const apellidoM = rand(APELLIDOS);
  // Edad sesgada por categoría
  let edadMin = 25;
  let edadMax = 80;
  if (category === "uci" || category === "cardio") {
    edadMin = 55;
    edadMax = 85;
  } else if (category === "onco") {
    edadMin = 45;
    edadMax = 80;
  } else if (category === "neuro") {
    edadMin = 50;
    edadMax = 85;
  }
  const edad = randInt(edadMin, edadMax);
  const year = new Date().getFullYear() - edad;
  const month = String(randInt(1, 12)).padStart(2, "0");
  const day = String(randInt(1, 28)).padStart(2, "0");
  return {
    nombre,
    apellidoP,
    apellidoM,
    sexo,
    edad,
    fechaNacimiento: `${year}-${month}-${day}`,
    email: `${nombre.toLowerCase()}.${apellidoP.toLowerCase()}.${randInt(
      1000,
      9999,
    )}@demo.local`,
    telefono: `+52 55 ${randInt(1000, 9999)} ${randInt(1000, 9999)}`,
    category,
  };
}

// ----------------------------------------------------------------
// Generadores de eventos por categoría
// ----------------------------------------------------------------

// Top-diagnoses para diferencial sessions confirmados
const TOP_DX_BY_CATEGORY = {
  cardio: [
    { disease: "hfref", label: "Insuficiencia cardíaca FE reducida" },
    { disease: "ischemic-cm", label: "Cardiopatía isquémica" },
    { disease: "hypertensive-hd", label: "Cardiopatía hipertensiva" },
    { disease: "attr-cm", label: "ATTR-CM" },
    { disease: "adhf-acute", label: "IC aguda descompensada" },
  ],
  onco: [
    { disease: "breast-cancer", label: "Cáncer de mama HER2+" },
    { disease: "cervical-cancer", label: "Cáncer de cérvix" },
    { disease: "ovarian-cancer", label: "Cáncer de ovario" },
    { disease: "endometrial-cancer", label: "Cáncer de endometrio" },
  ],
  neuro: [
    { disease: "ischemic-stroke-acute", label: "EVC isquémico agudo" },
    { disease: "epilepsy", label: "Epilepsia" },
    { disease: "alzheimer-dementia", label: "Demencia tipo Alzheimer" },
    { disease: "migraine-aura", label: "Migraña con aura" },
  ],
  endo: [
    { disease: "dm2-typical", label: "DM2" },
    { disease: "hypothyroidism", label: "Hipotiroidismo" },
    { disease: "cushing", label: "Síndrome de Cushing" },
    { disease: "dka", label: "Cetoacidosis diabética" },
  ],
  infecto: [
    { disease: "sepsis", label: "Sepsis" },
    { disease: "endocarditis", label: "Endocarditis infecciosa" },
    { disease: "cap-pneumonia", label: "Neumonía adquirida en comunidad" },
  ],
  uci: [
    { disease: "sepsis", label: "Sepsis severa" },
    { disease: "adhf-acute", label: "IC aguda en UCI" },
    { disease: "dm2-typical", label: "DM2 descompensada" },
  ],
};

function genTopDxs(category) {
  const pool = TOP_DX_BY_CATEGORY[category] ?? [{ disease: "other", label: "Otro" }];
  const main = rand(pool);
  return [{ ...main, posterior: 0.7 + Math.random() * 0.25 }];
}

function genContexto(category) {
  const ctx = {
    cardio: [
      "Paciente con disnea de medianos esfuerzos y edema periférico. Diabético tipo 2 conocido. Ecocardiograma con FEVI 30%.",
      "Antecedente de IAM hace 2 años. Refiere dolor torácico opresivo de 2 días.",
      "HTA crónica mal controlada. Hipertrofia ventricular izquierda en ECG.",
    ],
    onco: [
      "Masa palpable en mama derecha de 3 cm. Biopsia con carcinoma ductal infiltrante HER2+. Plan antraciclinas.",
      "Sangrado posmenopáusico de 3 meses. USG endometrio engrosado. Biopsia confirma adenocarcinoma.",
      "Lesión ovárica con CA-125 elevado. RMN pélvica sugiere malignidad.",
    ],
    neuro: [
      "Hemiparesia derecha súbita + afasia. NIHSS 12. TC craneal sin sangrado. Ventana 3h.",
      "Crisis convulsivas tónico-clónicas focales. EEG con foco temporal izquierdo. Paciente en edad fértil.",
      "Deterioro cognitivo progresivo de 18 meses. MMSE 18/30. Atrofia hipocampal en RMN.",
    ],
    endo: [
      "DM2 con HbA1c 9.2%. Mal control glucémico crónico. Microalbuminuria positiva.",
      "Hipotiroidismo con TSH 8.5. Inicio levotiroxina. Hipercolesterolemia secundaria.",
      "Cushing endógeno confirmado por test de supresión. ACTH dependiente. RMN hipófisis pendiente.",
    ],
    infecto: [
      "Sepsis de origen urinario. Lactato 3.5. Hipotensión refractaria. Cumple criterios shock séptico.",
      "Fiebre persistente + soplo nuevo. Hemocultivos x2 positivos S. aureus. ETE con vegetación.",
    ],
    uci: [
      "Choque séptico secundario a neumonía. Ventilación mecánica. Norepinefrina 0.15 mcg/kg/min.",
      "Insuficiencia respiratoria aguda hipoxémica. SARA moderado. FiO2 70%, PEEP 12.",
    ],
  };
  return rand(ctx[category] ?? ["Paciente estable, control de rutina."]);
}

// ----------------------------------------------------------------
// Distribución de la cohorte
// ----------------------------------------------------------------
function buildDistribution(n) {
  const dist = {
    cardio: Math.floor(n * 0.16),
    onco: Math.floor(n * 0.12),
    neuro: Math.floor(n * 0.1),
    endo: Math.floor(n * 0.1),
    infecto: Math.floor(n * 0.08),
    uci: Math.floor(n * 0.06),
    cirugia: Math.floor(n * 0.06),
  };
  const sumSpec = Object.values(dist).reduce((a, b) => a + b, 0);
  dist.control = n - sumSpec; // resto sano
  return dist;
}

// ----------------------------------------------------------------
// Bulk insert helpers — N filas en una sola query
// ----------------------------------------------------------------
async function bulkInsertPacientes(rows) {
  if (rows.length === 0) return [];
  const values = rows
    .map(
      (r) =>
        `('${MEDICO_ID}', ${escapeText(r.nombre)}, ${escapeText(r.apellidoP)}, ${escapeText(r.apellidoM)}, ${escapeText(r.fechaNacimiento)}::date, ${escapeText(r.sexo)}, ${escapeText(r.email)}, ${escapeText(r.telefono)}, ${escapeText(r.notas)}, ARRAY['cohorte-demo','synthea','${r.category}'])`,
    )
    .join(",\n");
  const q = `INSERT INTO public.pacientes (
    medico_id, nombre, apellido_paterno, apellido_materno,
    fecha_nacimiento, sexo, email, telefono, notas_internas, etiquetas
  ) VALUES ${values}
  ON CONFLICT (medico_id, email) DO NOTHING
  RETURNING id, nombre, apellido_paterno;`;
  return await runSql(q);
}

async function bulkInsertConsultas(rows) {
  if (rows.length === 0) return;
  // Insert en chunks de 200 para evitar query size límite
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const values = chunk
      .map(
        (r) =>
          `('${MEDICO_ID}', '${r.pacienteId}', ${escapeText(r.fechaIso)}::timestamptz, ${escapeText(r.tipo)}::consulta_tipo, 'cerrada'::consulta_status, ${escapeText(r.motivo)}, ${escapeText(r.iniciales)}, ${r.edad ?? "NULL"}, ${escapeText(r.sexo)})`,
      )
      .join(",\n");
    await runSql(
      `INSERT INTO public.consultas (
        medico_id, paciente_id, fecha, tipo, status, motivo_consulta,
        paciente_iniciales, paciente_edad, paciente_sexo
      ) VALUES ${values};`,
    );
  }
}

async function bulkInsertEventos(rows) {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const values = chunk
      .map(
        (r) =>
          `('${MEDICO_ID}', ${r.pacienteId ? `'${r.pacienteId}'` : "NULL"}, ${escapeText(r.modulo)}, ${escapeText(r.tipo)}, ${escapeJson(r.datos)}, ${escapeText(r.status)}, ${escapeJson(r.metricas ?? {})}, ${escapeText(r.createdAt)}::timestamptz, ${r.completedAt ? `${escapeText(r.completedAt)}::timestamptz` : "NULL"})`,
      )
      .join(",\n");
    await runSql(
      `INSERT INTO public.eventos_modulos (
        user_id, paciente_id, modulo, tipo, datos, status, metricas,
        created_at, completed_at
      ) VALUES ${values};`,
    );
  }
}

async function bulkInsertDiferenciales(rows) {
  if (rows.length === 0) return;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const values = chunk
      .map(
        (r) =>
          `('${MEDICO_ID}', ${escapeText(r.iniciales)}, ${r.edad}, ${escapeText(r.sexo)}, ${escapeText(r.contexto)}, ${escapeJson(r.findings)}, ${escapeJson(r.topDxs)}, ${escapeText(r.medicoDx)}, ${escapeText(r.outcome)}, ${escapeText(r.outcomeAt)}::timestamptz)`,
      )
      .join(",\n");
    await runSql(
      `INSERT INTO public.diferencial_sessions (
        medico_id, paciente_iniciales, paciente_edad, paciente_sexo,
        contexto_clinico, findings_observed, top_diagnoses,
        medico_diagnostico_principal, outcome_confirmado, outcome_confirmado_at
      ) VALUES ${values};`,
    );
  }
}

// ----------------------------------------------------------------
// Builders de eventos por categoría
// ----------------------------------------------------------------

function buildSofaEvent(p, daysAgo) {
  const respiratorio = randInt(0, 4);
  const coag = randInt(0, 4);
  const hep = randInt(0, 3);
  const cv = randInt(0, 4);
  const neuro = randInt(0, 4);
  const renal = randInt(0, 3);
  const total = respiratorio + coag + hep + cv + neuro + renal;
  const riesgo =
    total >= 11 ? "critico" : total >= 7 ? "alto" : total >= 4 ? "moderado" : "bajo";
  const mortalidad =
    total >= 11 ? "≥80%" : total >= 7 ? "40-50%" : total >= 4 ? "10-20%" : "<5%";
  const ago = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    modulo: "uci",
    tipo: "sofa",
    datos: {
      paciente_iniciales: p.iniciales,
      paciente_edad: p.edad,
      input: {},
      subscores: { respiratorio, coagulacion: coag, hepatico: hep, cardiovascular: cv, neurologico: neuro, renal, total },
      interpretacion: { riesgo, mortalidad },
    },
    status: "completado",
    metricas: { sofa_total: total, riesgo },
    createdAt: ago,
    completedAt: ago,
  };
}

function buildApacheEvent(p, daysAgo) {
  const total = randInt(8, 30);
  const severidad =
    total <= 9 ? "baja" : total <= 19 ? "moderada" : total <= 29 ? "alta" : "muy_alta";
  const mortalidadAprox =
    total <= 9 ? "~8%" : total <= 19 ? "~25%" : total <= 29 ? "~55%" : "~85%";
  const ago = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    modulo: "uci",
    tipo: "apache_ii",
    datos: {
      paciente_iniciales: p.iniciales,
      paciente_edad: p.edad,
      resultado: { aps: total - 5, edadPts: 5, cronicaPts: 0, total, mortalidadAprox, severidad },
    },
    status: "completado",
    metricas: { apache_total: total, severidad, mortalidad_aprox: mortalidadAprox },
    createdAt: ago,
    completedAt: ago,
  };
}

function buildFastHugEvent(p, daysAgo) {
  const items = {
    feeding: Math.random() > 0.2,
    analgesia: Math.random() > 0.15,
    sedation: Math.random() > 0.15,
    thromboprophylaxis: Math.random() > 0.1,
    headOfBed: Math.random() > 0.25,
    ulcerProphylaxis: Math.random() > 0.2,
    glucoseControl: Math.random() > 0.3,
  };
  const cumplidos = Object.values(items).filter(Boolean).length;
  const compliance = Math.round((cumplidos / 7) * 100);
  const ago = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    modulo: "uci",
    tipo: "fast_hug",
    datos: {
      paciente_iniciales: p.iniciales,
      paciente_edad: p.edad,
      input: items,
      resultado: { cumplidos, pendientes: 7 - cumplidos, bundleCompleto: cumplidos === 7, compliance },
    },
    status: "completado",
    metricas: { fast_hug_cumplidos: cumplidos, bundle_completo: cumplidos === 7, compliance },
    createdAt: ago,
    completedAt: ago,
  };
}

function buildCamIcuEvent(p, daysAgo) {
  const f1 = Math.random() > 0.6;
  const f2 = Math.random() > 0.7;
  const f3 = Math.random() > 0.8;
  const f4 = Math.random() > 0.7;
  const delirium = (f1 && f2) && (f3 || f4);
  const ago = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    modulo: "uci",
    tipo: "cam_icu",
    datos: {
      paciente_iniciales: p.iniciales,
      paciente_edad: p.edad,
      input: { feature1_inicioAgudoFluctuante: f1, feature2_inatencion: f2, feature3_pensamientoDesorganizado: f3, feature4_concienciaAlterada: f4 },
      resultado: { delirium, interpretacion: delirium ? "CAM-ICU POSITIVO" : "CAM-ICU negativo" },
    },
    status: "completado",
    metricas: { delirium },
    createdAt: ago,
    completedAt: ago,
  };
}

function buildHeartEvent(p, daysAgo) {
  const inputs = {
    historia: randInt(0, 2),
    ecg: randInt(0, 2),
    edad: p.edad >= 65 ? 2 : p.edad >= 45 ? 1 : 0,
    factoresRiesgo: randInt(0, 2),
    troponina: randInt(0, 2),
  };
  const total = Object.values(inputs).reduce((a, b) => a + b, 0);
  const riesgo = total <= 3 ? "bajo" : total <= 6 ? "moderado" : "alto";
  const mortalidad6sem = total <= 3 ? "0.9-1.7%" : total <= 6 ? "12-17%" : "50-65%";
  const ago = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    modulo: "cardiologia",
    tipo: "heart_score",
    datos: {
      paciente_iniciales: p.iniciales,
      paciente_edad: p.edad,
      input: inputs,
      resultado: { total, riesgo, mortalidad6sem, conducta: "" },
    },
    status: "completado",
    metricas: { heart_total: total, riesgo },
    createdAt: ago,
    completedAt: ago,
  };
}

function buildNihssEvent(p, daysAgo) {
  const total = randInt(2, 22);
  const severidad =
    total === 0 ? "sin_deficit" : total <= 4 ? "leve" : total <= 15 ? "moderado" : total <= 20 ? "moderado_severo" : "severo";
  const tpaCandidato = total >= 4 && total <= 25;
  const ago = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    modulo: "neurologia",
    tipo: "nihss",
    datos: {
      paciente_iniciales: p.iniciales,
      paciente_edad: p.edad,
      resultado: { total, severidad, tpaCandidato },
    },
    status: "completado",
    metricas: { nihss_total: total, severidad, tpa_candidato: tpaCandidato },
    createdAt: ago,
    completedAt: ago,
  };
}

function buildEcogEvent(p, daysAgo) {
  const ecog = randInt(0, 4);
  const ago = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    modulo: "oncologia",
    tipo: "ecog",
    datos: {
      paciente_iniciales: p.iniciales,
      paciente_edad: p.edad,
      resultado: { ecog, karnofskyAprox: 100 - ecog * 20, descripcion: "", apto_quimio: ecog <= 2 },
    },
    status: "completado",
    metricas: { ecog, karnofsky: 100 - ecog * 20, apto_quimio: ecog <= 2 },
    createdAt: ago,
    completedAt: ago,
  };
}

function buildHba1cEvent(p, daysAgo) {
  const hba1c = randFloat(5.5, 12, 1);
  const glucosaPromedio = Math.round(28.7 * hba1c - 46.7);
  const categoria = hba1c < 5.7 ? "no_diabetes" : hba1c < 6.5 ? "prediabetes" : hba1c <= 7 ? "diabetes_meta" : hba1c <= 8 ? "control_aceptable" : "fuera_meta";
  const ago = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    modulo: "endocrinologia",
    tipo: "hba1c_control",
    datos: {
      paciente_iniciales: p.iniciales,
      paciente_edad: p.edad,
      meta: 7,
      resultado: { hba1c, glucosaPromedio, categoria, recomendacion: "" },
    },
    status: "completado",
    metricas: { hba1c, glucosa_promedio: glucosaPromedio, categoria },
    createdAt: ago,
    completedAt: ago,
  };
}

function buildLabValueEvent(p, daysAgo, test, valor, severidad) {
  const ago = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    modulo: "laboratorio",
    tipo: "valor_lab",
    datos: {
      paciente_iniciales: p.iniciales,
      paciente_edad: p.edad,
      paciente_sexo: p.sexo,
      test,
      valor,
      interpretation: { test, valor, severidad, mensaje: "" },
      reflexTests: [],
      deltaResult: null,
    },
    status: "completado",
    metricas: {
      severidad,
      es_critico: severidad === "critico_bajo" || severidad === "critico_alto",
      reflex_count: 0,
      delta_anormal: false,
    },
    createdAt: ago,
    completedAt: ago,
  };
}

function buildWhoChecklistEvent(p, daysAgo) {
  const compliance = randInt(75, 100);
  const totalCompletados = Math.round((compliance / 100) * 20);
  const ago = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    modulo: "quirofano",
    tipo: "who_checklist",
    datos: {
      paciente_iniciales: p.iniciales,
      paciente_edad: p.edad,
      procedimiento: rand([
        "Colecistectomía laparoscópica",
        "Apendicectomía",
        "Hernioplastia inguinal",
        "Cesárea",
        "Cirugía de cataratas",
        "Bypass gástrico",
      ]),
      resultado: { totalCompletados, totalPosible: 20, compliance, bundleCompleto: compliance === 100, pendientes: { signIn: [], timeOut: [], signOut: [] } },
    },
    status: "completado",
    metricas: { who_total: totalCompletados, who_compliance: compliance, bundle_completo: compliance === 100 },
    createdAt: ago,
    completedAt: ago,
  };
}

function buildRcriEvent(p, daysAgo) {
  const total = randInt(0, 4);
  const clase = total === 0 ? "I" : total === 1 ? "II" : total === 2 ? "III" : "IV";
  const ago = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    modulo: "quirofano",
    tipo: "rcri",
    datos: {
      paciente_iniciales: p.iniciales,
      paciente_edad: p.edad,
      resultado: { total, clase, riesgoEventoMayor: "", recomendacion: "" },
    },
    status: "completado",
    metricas: { rcri_total: total, clase },
    createdAt: ago,
    completedAt: ago,
  };
}

function buildTriageEvent(p, daysAgoHours) {
  const nivel = rand(["amarillo", "naranja", "verde", "rojo"]);
  const ago = new Date(Date.now() - daysAgoHours * 3600000).toISOString();
  return {
    modulo: "urgencias",
    tipo: "triage",
    datos: {
      paciente_iniciales: p.iniciales,
      paciente_edad: p.edad,
      paciente_sexo: p.sexo,
      motivo: rand([
        "Dolor torácico opresivo",
        "Cefalea súbita intensa",
        "Disnea progresiva",
        "Fiebre persistente",
        "Hemiparesia derecha",
        "Dolor abdominal severo",
      ]),
      nivel,
    },
    status: "activo",
    metricas: {},
    createdAt: ago,
    completedAt: null,
  };
}

function buildDispositionEvent(triageEvent, p, hoursLater) {
  const tipo = rand(["alta", "observacion", "hospitalizacion", "uci", "quirofano", "traslado", "lwbs"]);
  const losMin = randInt(60, 480);
  const ago = new Date(
    new Date(triageEvent.createdAt).getTime() + hoursLater * 3600000,
  ).toISOString();
  return {
    modulo: "urgencias",
    tipo: "disposition",
    datos: {
      paciente_iniciales: p.iniciales,
      paciente_edad: p.edad,
      paciente_sexo: p.sexo,
      tipo,
      razon: "Cierre de atención de urgencias",
    },
    status: "completado",
    metricas: { los_minutos: losMin, disposition: tipo },
    createdAt: ago,
    completedAt: ago,
  };
}

// ----------------------------------------------------------------
// Main
// ----------------------------------------------------------------
console.log(`Seed Hospital — ${COUNT} pacientes a médico ${MEDICO_ID}\n`);

const dist = buildDistribution(COUNT);
console.log("Distribución:");
for (const [cat, n] of Object.entries(dist)) {
  console.log(`  ${cat.padEnd(8)} ${n}`);
}
console.log("");

// 1) Generar pacientes
const allPatients = [];
for (const [category, n] of Object.entries(dist)) {
  for (let i = 0; i < n; i++) allPatients.push(genPatient(category));
}
console.log(`Generados ${allPatients.length} pacientes en memoria.\n`);

// Notas internas listando categoría
for (const p of allPatients) {
  p.notas = `Cohorte sintética · categoría: ${p.category}`;
  p.iniciales = `${p.nombre[0]}.${p.apellidoP[0]}`;
}

// 2) Bulk insert pacientes (chunks de 50)
console.log("Insertando pacientes a Supabase…");
let pacientesInsertados = 0;
const pacientesIdMap = []; // index → {id, nombre, apellido}
for (let i = 0; i < allPatients.length; i += 50) {
  const chunk = allPatients.slice(i, i + 50);
  const res = await bulkInsertPacientes(chunk);
  for (const row of res) {
    pacientesIdMap.push(row);
  }
  pacientesInsertados += res.length;
  process.stdout.write(`  ${pacientesInsertados}/${allPatients.length}\r`);
}
console.log(`  ${pacientesInsertados} pacientes insertados.            \n`);

// Asociar pacientes generados con sus IDs reales por nombre+apellido
const pacientesById = new Map();
for (let i = 0; i < pacientesIdMap.length; i++) {
  const dbRow = pacientesIdMap[i];
  // match: encontrar el genPatient correspondiente por nombre+apellido_p
  const match = allPatients.find(
    (p) =>
      p.nombre === dbRow.nombre &&
      p.apellidoP === dbRow.apellido_paterno &&
      !pacientesById.has(p),
  );
  if (match) pacientesById.set(match, dbRow.id);
}
console.log(`${pacientesById.size} pacientes mapeados con su DB id.\n`);

// 3) Generar consultas + diferenciales + eventos por categoría
const consultasRows = [];
const eventosRows = [];
const diferencialesRows = [];

for (const p of allPatients) {
  const pacienteId = pacientesById.get(p);
  if (!pacienteId) continue; // si no hubo conflict-skip

  // 1-3 consultas históricas
  const nConsultas = randInt(1, 3);
  for (let c = 0; c < nConsultas; c++) {
    const dayAgo = randInt(1, 365);
    consultasRows.push({
      pacienteId,
      iniciales: p.iniciales,
      edad: p.edad,
      sexo: p.sexo,
      tipo: p.category === "uci" || p.category === "infecto" ? "urgencia" : "subsecuente",
      motivo: `Consulta categoría ${p.category}`,
      fechaIso: new Date(Date.now() - dayAgo * 86400000).toISOString(),
    });
  }

  // 1 diferencial confirmado para pacientes con patología (no controles)
  if (p.category !== "control") {
    const topDxs = genTopDxs(p.category);
    const principalDx = topDxs[0]?.label ?? "Sin dx";
    const daysAgo = randInt(7, 180);
    diferencialesRows.push({
      iniciales: p.iniciales,
      edad: p.edad,
      sexo: p.sexo,
      contexto: genContexto(p.category),
      findings: [],
      topDxs,
      medicoDx: principalDx,
      outcome: "confirmado",
      outcomeAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    });
  }

  // Eventos por categoría
  switch (p.category) {
    case "uci": {
      eventosRows.push(buildSofaEvent({ ...p, pacienteId }, randInt(1, 7)));
      eventosRows.push(buildSofaEvent({ ...p, pacienteId }, randInt(1, 3)));
      if (Math.random() > 0.4) eventosRows.push(buildApacheEvent({ ...p, pacienteId }, randInt(2, 14)));
      if (Math.random() > 0.3) eventosRows.push(buildFastHugEvent({ ...p, pacienteId }, randInt(1, 5)));
      if (Math.random() > 0.5) eventosRows.push(buildCamIcuEvent({ ...p, pacienteId }, randInt(1, 7)));
      // Triage de entrada
      const triage = buildTriageEvent({ ...p, pacienteId }, randInt(48, 168));
      eventosRows.push(triage);
      // Disposition UCI
      eventosRows.push(buildDispositionEvent(triage, p, randInt(2, 8)));
      break;
    }
    case "cardio": {
      if (Math.random() > 0.3) eventosRows.push(buildHeartEvent({ ...p, pacienteId }, randInt(1, 90)));
      // Lab K + creatinina + troponina
      if (Math.random() > 0.4) {
        const k = randFloat(3.5, 6.5, 1);
        const sev = k >= 6.5 ? "critico_alto" : k < 3.5 ? "critico_bajo" : k > 5 ? "anormal" : "normal";
        eventosRows.push(buildLabValueEvent({ ...p, pacienteId }, randInt(1, 60), "potasio", k, sev));
      }
      if (Math.random() > 0.5) {
        const t = randFloat(0.01, 0.6, 2);
        const sev = t >= 0.5 ? "critico_alto" : t > 0.04 ? "anormal" : "normal";
        eventosRows.push(buildLabValueEvent({ ...p, pacienteId }, randInt(1, 30), "troponina", t, sev));
      }
      break;
    }
    case "neuro": {
      if (Math.random() > 0.4) eventosRows.push(buildNihssEvent({ ...p, pacienteId }, randInt(1, 120)));
      break;
    }
    case "onco": {
      if (Math.random() > 0.3) eventosRows.push(buildEcogEvent({ ...p, pacienteId }, randInt(1, 180)));
      break;
    }
    case "endo": {
      if (Math.random() > 0.2) eventosRows.push(buildHba1cEvent({ ...p, pacienteId }, randInt(1, 90)));
      break;
    }
    case "infecto": {
      // Triage activo + sepsis bundle
      const triage = buildTriageEvent({ ...p, pacienteId }, randInt(2, 72));
      eventosRows.push(triage);
      if (Math.random() > 0.5) {
        // Lactato crítico
        eventosRows.push(buildLabValueEvent({ ...p, pacienteId }, 0.5, "lactato", randFloat(3, 6, 1), "critico_alto"));
      }
      break;
    }
    case "cirugia": {
      if (Math.random() > 0.2) eventosRows.push(buildWhoChecklistEvent({ ...p, pacienteId }, randInt(1, 90)));
      if (Math.random() > 0.4) eventosRows.push(buildRcriEvent({ ...p, pacienteId }, randInt(1, 90)));
      break;
    }
    case "control":
    default: {
      // 10% probabilidad de un lab de rutina
      if (Math.random() > 0.85) {
        eventosRows.push(buildLabValueEvent({ ...p, pacienteId }, randInt(1, 365), "glucosa", randInt(85, 110), "normal"));
      }
      break;
    }
  }

  // Asignar pacienteId a eventos
  for (let i = eventosRows.length - 1; i >= 0; i--) {
    if (eventosRows[i].pacienteId === undefined) {
      eventosRows[i].pacienteId = pacienteId;
    } else {
      break;
    }
  }
}

console.log(`Generados:`);
console.log(`  ${consultasRows.length} consultas`);
console.log(`  ${diferencialesRows.length} diferenciales`);
console.log(`  ${eventosRows.length} eventos de workflow\n`);

// 4) Bulk insert
console.log("Insertando consultas…");
await bulkInsertConsultas(consultasRows);
console.log(`  ${consultasRows.length} consultas OK\n`);

console.log("Insertando diferenciales…");
await bulkInsertDiferenciales(diferencialesRows);
console.log(`  ${diferencialesRows.length} diferenciales OK\n`);

console.log("Insertando eventos de workflow…");
await bulkInsertEventos(eventosRows);
console.log(`  ${eventosRows.length} eventos OK\n`);

console.log("Seed completado.");
console.log("");
console.log("Entra a /dashboard como carlos.gnoriega@gmail.com y verifica:");
console.log("  /dashboard/cruces           — cruces multivariable detectados");
console.log("  /dashboard/operaciones      — overview 5 workflows");
console.log("  /dashboard/urgencias        — triages + dispositions + LOS");
console.log("  /dashboard/uci              — SOFA + APACHE + FAST-HUG + CAM-ICU");
console.log("  /dashboard/quirofano        — WHO Checklist + RCRI");
console.log("  /dashboard/laboratorio      — Lab Pathway con críticos");
console.log("  /dashboard/especialidades   — Cardio/Neuro/Onco/Endo activos");
