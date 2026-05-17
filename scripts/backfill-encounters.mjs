/**
 * Backfill Encounters — convierte el seed actual (eventos_modulos +
 * diferencial_sessions) en filas de la tabla `encounters` con
 * distribución realista en 3 estados (activo / alta_reciente / historico).
 *
 * Estrategia:
 *   1. Para cada paciente cohorte-demo:
 *      - Detectar categoría desde la etiqueta `synthea`+`<cat>`
 *      - Crear encounters según la categoría con admitted_at distribuido
 *        a lo largo de los últimos 365 días
 *      - Marcar ~10-15% como activos (no dados de alta aún)
 *      - Marcar ~30% como alta reciente (últimos 15 días)
 *      - Resto histórico
 *
 *   2. Tipos de encounter por categoría:
 *      - UCI: 1 encounter UCI (LOS 3-14 días)
 *      - Cirugía: 1 encounter Quirófano (LOS 2-6 h) + opcional hospitalización post-op
 *      - Infecto: 1 encounter Urgencias + alta hospitalización
 *      - Cardio severo (adhf-acute, ischemic-cm): 1 encounter hospitalización (LOS 4-10 días)
 *      - Cardio crónico: 1 encounter ambulatorio
 *      - Neuro EVC agudo: 1 encounter Urgencias → Hospitalización
 *      - Neuro crónico: ambulatorio
 *      - Onco: 1 encounter ambulatorio (consulta oncológica)
 *      - Endo: 1 encounter ambulatorio (control)
 *      - Control: 1 encounter ambulatorio (chequeo)
 *
 * Uso:
 *   SUPABASE_MGMT_TOKEN=... SUPABASE_PROJECT_REF=... \
 *   MEDICO_ID=8923af6b-5d0a-4cf6-85e8-badf86d24d13 \
 *   node scripts/backfill-encounters.mjs
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
  if (typeof v === "boolean") return v ? "true" : "false";
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

// -------------------------------------------------------------
// 1) Limpiar encounters previos
// -------------------------------------------------------------
console.log("Limpiando encounters previos del médico…");
await runSql(`DELETE FROM public.encounters WHERE user_id = '${MEDICO_ID}';`);
console.log("OK\n");

// -------------------------------------------------------------
// 2) Pull de pacientes cohorte-demo
// -------------------------------------------------------------
console.log("Cargando pacientes cohorte-demo…");
const pacientesRes = await runSql(
  `SELECT id, nombre, apellido_paterno, sexo, fecha_nacimiento, etiquetas
   FROM public.pacientes
   WHERE medico_id = '${MEDICO_ID}' AND 'cohorte-demo' = ANY(etiquetas);`,
);
console.log(`  ${pacientesRes.length} pacientes\n`);

const pacientes = pacientesRes.map((p) => {
  const cat = (p.etiquetas ?? []).find((e) =>
    [
      "cardio",
      "onco",
      "neuro",
      "endo",
      "infecto",
      "uci",
      "cirugia",
      "control",
    ].includes(e),
  ) ?? "control";
  const edad =
    p.fecha_nacimiento
      ? Math.floor(
          (Date.now() - new Date(p.fecha_nacimiento).getTime()) /
            (365.25 * 24 * 3600 * 1000),
        )
      : null;
  return {
    id: p.id,
    nombre: p.nombre,
    apellidoP: p.apellido_paterno,
    sexo: p.sexo,
    edad,
    category: cat,
  };
});

// -------------------------------------------------------------
// 3) Generar encounters
// -------------------------------------------------------------
console.log("Generando encounters…");

const NOW = Date.now();
const DAY = 24 * 3600 * 1000;

const BED_PREFIX = {
  urgencias: "URG-",
  uci: "ICU-",
  quirofano: "OR-",
  hospitalizacion: "HOS-",
  cardiologia: "CAR-",
  neurologia: "NEU-",
  oncologia: "ONC-",
  endocrinologia: "END-",
};

const MOTIVOS_POR_CAT = {
  cardio: [
    "Disnea de medianos esfuerzos + edema",
    "Dolor torácico opresivo",
    "Descompensación de IC crónica",
    "Crisis hipertensiva",
    "Control post-IAM",
  ],
  onco: [
    "Ciclo de quimioterapia",
    "Evaluación post-cirugía oncológica",
    "Control oncológico",
    "Neutropenia febril",
    "Manejo del dolor oncológico",
  ],
  neuro: [
    "Hemiparesia súbita",
    "Crisis convulsiva",
    "Cefalea súbita intensa",
    "Deterioro cognitivo",
    "Control neurológico",
  ],
  endo: [
    "Control de DM2",
    "Hipoglucemia severa",
    "Ajuste de tiroides",
    "Cetoacidosis diabética",
    "Control endocrino",
  ],
  infecto: [
    "Sepsis de origen urinario",
    "Neumonía adquirida en comunidad",
    "Fiebre persistente + soplo",
    "Choque séptico",
    "Endocarditis sospechada",
  ],
  uci: [
    "Choque séptico ventilado",
    "Insuficiencia respiratoria",
    "Post-paro reanimado",
    "SARA moderado",
    "Politrauma estable",
  ],
  cirugia: [
    "Colecistectomía laparoscópica",
    "Apendicectomía",
    "Hernioplastia inguinal",
    "Cesárea",
    "Cirugía de cataratas",
    "Bypass gástrico",
  ],
  control: [
    "Chequeo anual",
    "Control de rutina",
    "Seguimiento ambulatorio",
    "Receta y revisión",
  ],
};

const encounters = [];

for (const p of pacientes) {
  switch (p.category) {
    case "uci": {
      // UCI: LOS 3-14 días. ~25% activos, ~30% alta reciente, resto histórico
      const roll = Math.random();
      const isActive = roll < 0.25;
      const isRecent = !isActive && roll < 0.55;
      const losDays = randInt(3, 14);

      let admittedAt, dischargedAt, status, disposition;
      if (isActive) {
        admittedAt = new Date(NOW - randInt(0, losDays) * DAY).toISOString();
        dischargedAt = null;
        status = "activo";
        disposition = null;
      } else if (isRecent) {
        const dischargeDaysAgo = randInt(0, 14);
        dischargedAt = new Date(NOW - dischargeDaysAgo * DAY).toISOString();
        admittedAt = new Date(
          new Date(dischargedAt).getTime() - losDays * DAY,
        ).toISOString();
        status = Math.random() < 0.15 ? "fallecido" : "alta";
        disposition = status === "fallecido" ? "fallecido" : "hospitalizacion";
      } else {
        const dischargeDaysAgo = randInt(16, 300);
        dischargedAt = new Date(NOW - dischargeDaysAgo * DAY).toISOString();
        admittedAt = new Date(
          new Date(dischargedAt).getTime() - losDays * DAY,
        ).toISOString();
        status = Math.random() < 0.18 ? "fallecido" : "alta";
        disposition = status === "fallecido" ? "fallecido" : "hospitalizacion";
      }
      encounters.push({
        paciente_id: p.id,
        modulo: "uci",
        tipo: "admision_uci",
        status,
        severidad: rand(["rojo", "naranja"]),
        admitted_at: admittedAt,
        discharged_at: dischargedAt,
        disposition,
        motivo: rand(MOTIVOS_POR_CAT.uci),
        bed: `${BED_PREFIX.uci}${randInt(1, 24).toString().padStart(2, "0")}`,
      });
      break;
    }
    case "cirugia": {
      // Cirugía: LOS 2-6 h en quirófano, ~5% activos (en quirófano ahora), 35% alta reciente, resto histórico
      const roll = Math.random();
      const isActive = roll < 0.05;
      const isRecent = !isActive && roll < 0.4;
      const losMinutes = randInt(60, 360);

      let admittedAt, dischargedAt, status, disposition;
      if (isActive) {
        admittedAt = new Date(NOW - randInt(0, losMinutes) * 60000).toISOString();
        dischargedAt = null;
        status = "activo";
        disposition = null;
      } else if (isRecent) {
        const ago = randInt(0, 14);
        dischargedAt = new Date(NOW - ago * DAY).toISOString();
        admittedAt = new Date(
          new Date(dischargedAt).getTime() - losMinutes * 60000,
        ).toISOString();
        status = "alta";
        disposition = "alta_domicilio";
      } else {
        const ago = randInt(16, 270);
        dischargedAt = new Date(NOW - ago * DAY).toISOString();
        admittedAt = new Date(
          new Date(dischargedAt).getTime() - losMinutes * 60000,
        ).toISOString();
        status = "alta";
        disposition = "alta_domicilio";
      }
      encounters.push({
        paciente_id: p.id,
        modulo: "quirofano",
        tipo: rand(["cirugia_programada", "cirugia_urgencia"]),
        status,
        severidad: rand(["amarillo", "naranja"]),
        admitted_at: admittedAt,
        discharged_at: dischargedAt,
        disposition,
        motivo: rand(MOTIVOS_POR_CAT.cirugia),
        bed: `${BED_PREFIX.quirofano}${randInt(1, 8)}`,
      });
      break;
    }
    case "infecto": {
      // Urgencias: LOS 4-24h. 15% activos, 35% alta reciente, resto histórico
      const roll = Math.random();
      const isActive = roll < 0.15;
      const isRecent = !isActive && roll < 0.5;
      const losMinutes = randInt(120, 1440);

      let admittedAt, dischargedAt, status, disposition;
      if (isActive) {
        admittedAt = new Date(NOW - randInt(0, losMinutes) * 60000).toISOString();
        dischargedAt = null;
        status = "activo";
        disposition = null;
      } else if (isRecent) {
        const ago = randInt(0, 14);
        dischargedAt = new Date(NOW - ago * DAY).toISOString();
        admittedAt = new Date(
          new Date(dischargedAt).getTime() - losMinutes * 60000,
        ).toISOString();
        status = "alta";
        disposition = rand(["hospitalizacion", "uci", "alta_domicilio"]);
      } else {
        const ago = randInt(16, 300);
        dischargedAt = new Date(NOW - ago * DAY).toISOString();
        admittedAt = new Date(
          new Date(dischargedAt).getTime() - losMinutes * 60000,
        ).toISOString();
        status = "alta";
        disposition = rand(["hospitalizacion", "uci", "alta_domicilio"]);
      }
      encounters.push({
        paciente_id: p.id,
        modulo: "urgencias",
        tipo: "urgencia",
        status,
        severidad: rand(["rojo", "naranja", "amarillo"]),
        admitted_at: admittedAt,
        discharged_at: dischargedAt,
        disposition,
        motivo: rand(MOTIVOS_POR_CAT.infecto),
        bed: `${BED_PREFIX.urgencias}${randInt(1, 30).toString().padStart(2, "0")}`,
      });
      break;
    }
    case "cardio": {
      // Cardio: 30% hospitalización aguda (LOS 4-10d), 70% ambulatorio
      if (Math.random() < 0.3) {
        const roll = Math.random();
        const isActive = roll < 0.18;
        const isRecent = !isActive && roll < 0.5;
        const losDays = randInt(4, 10);

        let admittedAt, dischargedAt, status, disposition;
        if (isActive) {
          admittedAt = new Date(NOW - randInt(0, losDays) * DAY).toISOString();
          dischargedAt = null;
          status = "activo";
          disposition = null;
        } else if (isRecent) {
          const ago = randInt(0, 14);
          dischargedAt = new Date(NOW - ago * DAY).toISOString();
          admittedAt = new Date(
            new Date(dischargedAt).getTime() - losDays * DAY,
          ).toISOString();
          status = "alta";
          disposition = "alta_domicilio";
        } else {
          const ago = randInt(16, 300);
          dischargedAt = new Date(NOW - ago * DAY).toISOString();
          admittedAt = new Date(
            new Date(dischargedAt).getTime() - losDays * DAY,
          ).toISOString();
          status = "alta";
          disposition = "alta_domicilio";
        }
        encounters.push({
          paciente_id: p.id,
          modulo: "cardiologia",
          tipo: "hospitalizacion_cardio",
          status,
          severidad: rand(["amarillo", "naranja"]),
          admitted_at: admittedAt,
          discharged_at: dischargedAt,
          disposition,
          motivo: rand(MOTIVOS_POR_CAT.cardio),
          bed: `${BED_PREFIX.cardiologia}${randInt(1, 16)}`,
        });
      } else {
        // Ambulatorio cardio
        const ago = randInt(1, 270);
        const dischargedAt = new Date(NOW - ago * DAY).toISOString();
        const admittedAt = new Date(
          new Date(dischargedAt).getTime() - 30 * 60000,
        ).toISOString();
        encounters.push({
          paciente_id: p.id,
          modulo: "ambulatorio",
          tipo: "consulta_cardio",
          status: "alta",
          severidad: "verde",
          admitted_at: admittedAt,
          discharged_at: dischargedAt,
          disposition: "alta_domicilio",
          motivo: rand(MOTIVOS_POR_CAT.cardio),
          bed: null,
        });
      }
      break;
    }
    case "neuro": {
      // 25% urgencia/hospitalización EVC, 75% ambulatorio
      if (Math.random() < 0.25) {
        const roll = Math.random();
        const isActive = roll < 0.15;
        const isRecent = !isActive && roll < 0.45;
        const losDays = randInt(3, 12);
        let admittedAt, dischargedAt, status, disposition;
        if (isActive) {
          admittedAt = new Date(NOW - randInt(0, losDays) * DAY).toISOString();
          dischargedAt = null;
          status = "activo";
          disposition = null;
        } else if (isRecent) {
          const ago = randInt(0, 14);
          dischargedAt = new Date(NOW - ago * DAY).toISOString();
          admittedAt = new Date(
            new Date(dischargedAt).getTime() - losDays * DAY,
          ).toISOString();
          status = "alta";
          disposition = "alta_domicilio";
        } else {
          const ago = randInt(16, 300);
          dischargedAt = new Date(NOW - ago * DAY).toISOString();
          admittedAt = new Date(
            new Date(dischargedAt).getTime() - losDays * DAY,
          ).toISOString();
          status = "alta";
          disposition = "alta_domicilio";
        }
        encounters.push({
          paciente_id: p.id,
          modulo: "neurologia",
          tipo: "evc_agudo",
          status,
          severidad: rand(["rojo", "naranja"]),
          admitted_at: admittedAt,
          discharged_at: dischargedAt,
          disposition,
          motivo: rand(MOTIVOS_POR_CAT.neuro),
          bed: `${BED_PREFIX.neurologia}${randInt(1, 12)}`,
        });
      } else {
        const ago = randInt(1, 270);
        const dischargedAt = new Date(NOW - ago * DAY).toISOString();
        const admittedAt = new Date(
          new Date(dischargedAt).getTime() - 30 * 60000,
        ).toISOString();
        encounters.push({
          paciente_id: p.id,
          modulo: "ambulatorio",
          tipo: "consulta_neuro",
          status: "alta",
          severidad: "verde",
          admitted_at: admittedAt,
          discharged_at: dischargedAt,
          disposition: "alta_domicilio",
          motivo: rand(MOTIVOS_POR_CAT.neuro),
          bed: null,
        });
      }
      break;
    }
    case "onco": {
      // 90% ambulatorio (consulta oncológica), 10% hospitalización
      if (Math.random() < 0.1) {
        const losDays = randInt(3, 8);
        const roll = Math.random();
        let admittedAt, dischargedAt, status, disposition;
        if (roll < 0.15) {
          admittedAt = new Date(NOW - randInt(0, losDays) * DAY).toISOString();
          dischargedAt = null;
          status = "activo";
          disposition = null;
        } else {
          const ago = randInt(0, 60);
          dischargedAt = new Date(NOW - ago * DAY).toISOString();
          admittedAt = new Date(
            new Date(dischargedAt).getTime() - losDays * DAY,
          ).toISOString();
          status = "alta";
          disposition = "alta_domicilio";
        }
        encounters.push({
          paciente_id: p.id,
          modulo: "oncologia",
          tipo: "hospitalizacion_onco",
          status,
          severidad: "amarillo",
          admitted_at: admittedAt,
          discharged_at: dischargedAt,
          disposition,
          motivo: rand(MOTIVOS_POR_CAT.onco),
          bed: `${BED_PREFIX.oncologia}${randInt(1, 10)}`,
        });
      } else {
        const ago = randInt(1, 270);
        const dischargedAt = new Date(NOW - ago * DAY).toISOString();
        const admittedAt = new Date(
          new Date(dischargedAt).getTime() - 45 * 60000,
        ).toISOString();
        encounters.push({
          paciente_id: p.id,
          modulo: "ambulatorio",
          tipo: "consulta_onco",
          status: "alta",
          severidad: "verde",
          admitted_at: admittedAt,
          discharged_at: dischargedAt,
          disposition: "alta_domicilio",
          motivo: rand(MOTIVOS_POR_CAT.onco),
          bed: null,
        });
      }
      break;
    }
    case "endo": {
      // 95% ambulatorio, 5% DKA hospitalización
      if (Math.random() < 0.05) {
        const losDays = randInt(2, 5);
        const ago = randInt(0, 60);
        const dischargedAt = new Date(NOW - ago * DAY).toISOString();
        const admittedAt = new Date(
          new Date(dischargedAt).getTime() - losDays * DAY,
        ).toISOString();
        encounters.push({
          paciente_id: p.id,
          modulo: "endocrinologia",
          tipo: "dka_hosp",
          status: "alta",
          severidad: "naranja",
          admitted_at: admittedAt,
          discharged_at: dischargedAt,
          disposition: "alta_domicilio",
          motivo: "Cetoacidosis diabética",
          bed: `${BED_PREFIX.endocrinologia}${randInt(1, 8)}`,
        });
      } else {
        const ago = randInt(1, 270);
        const dischargedAt = new Date(NOW - ago * DAY).toISOString();
        const admittedAt = new Date(
          new Date(dischargedAt).getTime() - 30 * 60000,
        ).toISOString();
        encounters.push({
          paciente_id: p.id,
          modulo: "ambulatorio",
          tipo: "consulta_endo",
          status: "alta",
          severidad: "verde",
          admitted_at: admittedAt,
          discharged_at: dischargedAt,
          disposition: "alta_domicilio",
          motivo: rand(MOTIVOS_POR_CAT.endo),
          bed: null,
        });
      }
      break;
    }
    case "control":
    default: {
      // 100% ambulatorio
      const ago = randInt(7, 365);
      const dischargedAt = new Date(NOW - ago * DAY).toISOString();
      const admittedAt = new Date(
        new Date(dischargedAt).getTime() - 20 * 60000,
      ).toISOString();
      encounters.push({
        paciente_id: p.id,
        modulo: "ambulatorio",
        tipo: "chequeo",
        status: "alta",
        severidad: "verde",
        admitted_at: admittedAt,
        discharged_at: dischargedAt,
        disposition: "alta_domicilio",
        motivo: rand(MOTIVOS_POR_CAT.control),
        bed: null,
      });
      break;
    }
  }
}

console.log(`Generados ${encounters.length} encounters\n`);

// -------------------------------------------------------------
// 4) Bulk insert
// -------------------------------------------------------------
console.log("Insertando encounters…");
for (let i = 0; i < encounters.length; i += 80) {
  const chunk = encounters.slice(i, i + 80);
  const values = chunk
    .map(
      (e) =>
        `('${MEDICO_ID}', '${e.paciente_id}', ${escapeText(e.modulo)}, ${escapeText(e.tipo)}, ${escapeText(e.status)}, ${escapeText(e.severidad)}, ${escapeText(e.admitted_at)}::timestamptz, ${e.discharged_at ? `${escapeText(e.discharged_at)}::timestamptz` : "NULL"}, ${escapeText(e.disposition)}, ${escapeText(e.motivo)}, ${escapeText(e.bed)}, ${escapeJson({})})`,
    )
    .join(",\n");
  await runSql(
    `INSERT INTO public.encounters (
      user_id, paciente_id, modulo, tipo, status, severidad,
      admitted_at, discharged_at, disposition, motivo_admision, bed_label, datos
    ) VALUES ${values};`,
  );
  process.stdout.write(
    `  ${Math.min(i + 80, encounters.length)}/${encounters.length}\r`,
  );
}
console.log(`  ${encounters.length} encounters insertados.            \n`);

// -------------------------------------------------------------
// 5) Reporte final
// -------------------------------------------------------------
const reporte = await runSql(`
  SELECT
    modulo,
    status,
    COUNT(*) AS n,
    COUNT(*) FILTER (WHERE discharged_at >= now() - interval '15 days') AS alta_15d
  FROM public.encounters
  WHERE user_id = '${MEDICO_ID}'
  GROUP BY modulo, status
  ORDER BY modulo, status;
`);

const activos = await runSql(`
  SELECT COUNT(*) AS n FROM public.encounters
  WHERE user_id = '${MEDICO_ID}' AND status = 'activo';
`);
const altaReciente = await runSql(`
  SELECT COUNT(*) AS n FROM public.encounters
  WHERE user_id = '${MEDICO_ID}' AND status <> 'activo'
    AND discharged_at >= now() - interval '15 days';
`);
const historico = await runSql(`
  SELECT COUNT(*) AS n FROM public.encounters
  WHERE user_id = '${MEDICO_ID}' AND status <> 'activo'
    AND discharged_at < now() - interval '15 days';
`);

console.log("Distribución final:");
console.log(`  Activos:        ${activos[0].n}`);
console.log(`  Alta reciente:  ${altaReciente[0].n}`);
console.log(`  Histórico:      ${historico[0].n}`);
console.log("");
console.log("Por módulo:");
for (const r of reporte) {
  console.log(`  ${r.modulo.padEnd(18)} ${r.status.padEnd(12)} n=${String(r.n).padStart(3)}  alta_15d=${r.alta_15d}`);
}
