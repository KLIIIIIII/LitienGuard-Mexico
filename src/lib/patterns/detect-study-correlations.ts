/**
 * Detección de correlaciones estudio↔diagnóstico en la cohorte del médico.
 *
 * Cruza eventos_modulos (laboratorio + radiología + scores específicos)
 * con diferencial_sessions confirmados para encontrar:
 *
 *   - Estudios críticos frecuentes (top labs anormales del médico)
 *   - Correlaciones dx↔estudio (pacientes con dx X que también tienen
 *     estudio Y anormal — sugiere patrón clínico)
 *   - Co-aparición de scores severos (HEART alto + troponina elevada;
 *     NIHSS alto + lactato elevado — patrones multivariables)
 *
 * Es un detector puro server-side, sin LLM, sin I/O fuera de los queries
 * SQL. Devuelve estructura serializable para que el componente cliente
 * solo pinte.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface CriticalStudyEntry {
  test: string;
  totalAnormal: number;
  totalCritico: number;
  /** Iniciales-edad-sexo agrupados como patient proxy */
  pacientesAfectados: number;
}

export interface DxStudyCorrelation {
  /** Disease ID interno */
  diseaseId: string;
  /** Label legible */
  diseaseLabel: string;
  /** Estudio/score que correlaciona */
  estudio: string;
  /** Cuántos pacientes con ese dx tienen ese estudio anormal */
  pacientesConCorrelacion: number;
  /** Cuántos pacientes totales con ese dx */
  pacientesTotalDx: number;
  /** % = pacientesConCorrelacion / pacientesTotalDx */
  ratio: number;
  /** Descripción clínica para mostrar */
  hint: string;
}

export interface ScoreSeverityPattern {
  scoreA: string;
  scoreB: string;
  cuandoA: string;
  cuandoB: string;
  pacientes: number;
  hint: string;
}

export interface StudyCorrelations {
  totalEventosLab: number;
  totalEventosImaging: number;
  criticosTop: CriticalStudyEntry[];
  correlacionesDxEstudio: DxStudyCorrelation[];
  patronesMultiScore: ScoreSeverityPattern[];
  hasEnoughData: boolean;
}

interface EventoRow {
  paciente_id: string | null;
  modulo: string;
  tipo: string;
  datos: Record<string, unknown>;
  metricas: Record<string, unknown> | null;
  created_at: string;
}

interface DifRow {
  paciente_iniciales: string | null;
  paciente_edad: number | null;
  paciente_sexo: string | null;
  top_diagnoses: Array<{ disease?: string; label?: string }> | null;
  outcome_confirmado: string | null;
}

function patientKey(
  ini: string | null,
  edad: number | null,
  sexo: string | null,
): string | null {
  if (!ini) return null;
  return `${ini.toUpperCase()}|${edad ?? "?"}|${sexo ?? "?"}`;
}

export async function detectStudyCorrelations(
  supa: SupabaseClient,
  medicoId: string,
): Promise<StudyCorrelations> {
  const [eventosRes, difsRes, pacientesRes] = await Promise.all([
    supa
      .from("eventos_modulos")
      .select("paciente_id, modulo, tipo, datos, metricas, created_at")
      .eq("user_id", medicoId)
      .in("modulo", ["laboratorio", "radiologia", "cardiologia", "neurologia", "oncologia", "endocrinologia", "uci"])
      .limit(5000),
    supa
      .from("diferencial_sessions")
      .select("paciente_iniciales, paciente_edad, paciente_sexo, top_diagnoses, outcome_confirmado")
      .eq("medico_id", medicoId)
      .in("outcome_confirmado", ["confirmado", "parcial"])
      .limit(3000),
    supa
      .from("pacientes")
      .select("id, nombre, apellido_paterno, sexo, fecha_nacimiento")
      .eq("medico_id", medicoId)
      .limit(5000),
  ]);

  const eventos = (eventosRes.data ?? []) as EventoRow[];
  const difs = (difsRes.data ?? []) as DifRow[];
  const pacientes = pacientesRes.data ?? [];

  // Map pacienteId → patient proxy key
  const pacienteIdToKey = new Map<string, string>();
  for (const p of pacientes) {
    const ini = `${p.nombre?.[0] ?? ""}.${p.apellido_paterno?.[0] ?? ""}`;
    const edad = p.fecha_nacimiento
      ? Math.floor(
          (Date.now() - new Date(p.fecha_nacimiento).getTime()) /
            (365.25 * 24 * 3600 * 1000),
        )
      : null;
    pacienteIdToKey.set(p.id, `${ini.toUpperCase()}|${edad ?? "?"}|${p.sexo ?? "?"}`);
  }

  // Map patient proxy → diseases confirmed
  const pacienteToDxs = new Map<string, Array<{ disease: string; label: string }>>();
  for (const d of difs) {
    const key = patientKey(d.paciente_iniciales, d.paciente_edad, d.paciente_sexo);
    if (!key) continue;
    const dxList = pacienteToDxs.get(key) ?? [];
    for (const t of d.top_diagnoses ?? []) {
      if (t.disease && t.label) {
        dxList.push({ disease: t.disease, label: t.label });
      }
    }
    if (dxList.length > 0) pacienteToDxs.set(key, dxList);
  }

  // ---------------- Críticos top ----------------
  const labMap = new Map<
    string,
    { totalAnormal: number; totalCritico: number; pacientes: Set<string> }
  >();
  let totalEventosLab = 0;
  let totalEventosImaging = 0;

  for (const e of eventos) {
    if (e.modulo === "laboratorio") {
      totalEventosLab += 1;
      const test = (e.datos.test as string) ?? "desconocido";
      const sev = (e.metricas?.severidad as string) ?? "normal";
      if (sev === "normal") continue;
      const entry = labMap.get(test) ?? {
        totalAnormal: 0,
        totalCritico: 0,
        pacientes: new Set<string>(),
      };
      entry.totalAnormal += 1;
      if (sev === "critico_alto" || sev === "critico_bajo") entry.totalCritico += 1;
      if (e.paciente_id) entry.pacientes.add(e.paciente_id);
      labMap.set(test, entry);
    } else if (e.modulo === "radiologia") {
      totalEventosImaging += 1;
    }
  }
  const criticosTop: CriticalStudyEntry[] = Array.from(labMap.entries())
    .map(([test, v]) => ({
      test,
      totalAnormal: v.totalAnormal,
      totalCritico: v.totalCritico,
      pacientesAfectados: v.pacientes.size,
    }))
    .sort((a, b) => b.totalCritico - a.totalCritico || b.totalAnormal - a.totalAnormal)
    .slice(0, 10);

  // ---------------- Correlaciones dx ↔ estudio anormal ----------------
  // Para cada dx confirmado, contar qué estudios anormales tienen los
  // pacientes con ese dx.
  const dxStudyMatrix = new Map<
    string, // disease ID
    {
      label: string;
      pacientes: Set<string>;
      estudiosAnormales: Map<string, Set<string>>; // test → pacientes
    }
  >();

  for (const [pacKey, dxs] of pacienteToDxs.entries()) {
    for (const d of dxs) {
      const entry = dxStudyMatrix.get(d.disease) ?? {
        label: d.label,
        pacientes: new Set<string>(),
        estudiosAnormales: new Map<string, Set<string>>(),
      };
      entry.pacientes.add(pacKey);
      dxStudyMatrix.set(d.disease, entry);
    }
  }

  // Cruzar eventos críticos con dx
  for (const e of eventos) {
    if (e.modulo !== "laboratorio") continue;
    const sev = (e.metricas?.severidad as string) ?? "normal";
    if (sev === "normal") continue;
    const pacId = e.paciente_id;
    if (!pacId) continue;
    const pacKey = pacienteIdToKey.get(pacId);
    if (!pacKey) continue;
    const dxs = pacienteToDxs.get(pacKey);
    if (!dxs) continue;
    const test = (e.datos.test as string) ?? "desconocido";
    for (const d of dxs) {
      const entry = dxStudyMatrix.get(d.disease);
      if (!entry) continue;
      const set = entry.estudiosAnormales.get(test) ?? new Set<string>();
      set.add(pacKey);
      entry.estudiosAnormales.set(test, set);
    }
  }

  const correlacionesDxEstudio: DxStudyCorrelation[] = [];
  for (const [diseaseId, entry] of dxStudyMatrix.entries()) {
    for (const [estudio, pacsSet] of entry.estudiosAnormales.entries()) {
      if (pacsSet.size < 3) continue; // requiere ≥3 pacientes para significancia
      const ratio = pacsSet.size / entry.pacientes.size;
      if (ratio < 0.15) continue; // ≥15% del cohorte de ese dx
      correlacionesDxEstudio.push({
        diseaseId,
        diseaseLabel: entry.label,
        estudio,
        pacientesConCorrelacion: pacsSet.size,
        pacientesTotalDx: entry.pacientes.size,
        ratio,
        hint: clinicalHint(diseaseId, estudio),
      });
    }
  }
  correlacionesDxEstudio.sort((a, b) => b.pacientesConCorrelacion - a.pacientesConCorrelacion);

  // ---------------- Patrones multi-score severos ----------------
  // Buscar pacientes con HEART alto + troponina elevada (SCA inminente),
  // NIHSS alto + lactato elevado (EVC grave hipoperfusión), etc.
  const heartByPaciente = new Map<string, number>();
  const nihssByPaciente = new Map<string, number>();
  const troponinaCritByPaciente = new Set<string>();
  const lactatoCritByPaciente = new Set<string>();
  const sofaAltoByPaciente = new Set<string>();

  for (const e of eventos) {
    if (!e.paciente_id) continue;
    if (e.tipo === "heart_score") {
      const total = (e.metricas?.heart_total as number) ?? 0;
      const prev = heartByPaciente.get(e.paciente_id) ?? 0;
      if (total > prev) heartByPaciente.set(e.paciente_id, total);
    }
    if (e.tipo === "nihss") {
      const total = (e.metricas?.nihss_total as number) ?? 0;
      const prev = nihssByPaciente.get(e.paciente_id) ?? 0;
      if (total > prev) nihssByPaciente.set(e.paciente_id, total);
    }
    if (e.tipo === "valor_lab") {
      const test = (e.datos.test as string) ?? "";
      const sev = (e.metricas?.severidad as string) ?? "";
      if (test === "troponina" && (sev === "critico_alto" || sev === "anormal")) {
        troponinaCritByPaciente.add(e.paciente_id);
      }
      if (test === "lactato" && sev === "critico_alto") {
        lactatoCritByPaciente.add(e.paciente_id);
      }
    }
    if (e.tipo === "sofa") {
      const total = (e.metricas?.sofa_total as number) ?? 0;
      if (total >= 7) sofaAltoByPaciente.add(e.paciente_id);
    }
  }

  const patronesMultiScore: ScoreSeverityPattern[] = [];

  // HEART ≥7 + troponina anormal → SCA con daño miocárdico
  const heartTropPacs = Array.from(heartByPaciente.entries()).filter(
    ([id, h]) => h >= 7 && troponinaCritByPaciente.has(id),
  );
  if (heartTropPacs.length >= 2) {
    patronesMultiScore.push({
      scoreA: "HEART",
      scoreB: "Troponina",
      cuandoA: "≥ 7",
      cuandoB: "elevada",
      pacientes: heartTropPacs.length,
      hint: "Síndrome coronario agudo con daño miocárdico — manejo invasivo temprano (cateterismo ≤24h) reduce mortalidad.",
    });
  }

  // NIHSS ≥15 + lactato alto → EVC grave con hipoperfusión sistémica
  const nihssLactatoPacs = Array.from(nihssByPaciente.entries()).filter(
    ([id, n]) => n >= 15 && lactatoCritByPaciente.has(id),
  );
  if (nihssLactatoPacs.length >= 2) {
    patronesMultiScore.push({
      scoreA: "NIHSS",
      scoreB: "Lactato",
      cuandoA: "≥ 15",
      cuandoB: "crítico",
      pacientes: nihssLactatoPacs.length,
      hint: "EVC severo con hipoperfusión sistémica — vigilar shock cardiogénico secundario y considerar trombolisis si ventana abierta.",
    });
  }

  // SOFA ≥7 + lactato crítico → sepsis severa
  const sofaLactatoPacs = Array.from(sofaAltoByPaciente).filter((id) =>
    lactatoCritByPaciente.has(id),
  );
  if (sofaLactatoPacs.length >= 2) {
    patronesMultiScore.push({
      scoreA: "SOFA",
      scoreB: "Lactato",
      cuandoA: "≥ 7",
      cuandoB: "crítico",
      pacientes: sofaLactatoPacs.length,
      hint: "Sepsis severa / shock séptico — bundle 1h obligatorio: cultivos, ATB amplio espectro, fluidos 30 mL/kg, presor si MAP < 65.",
    });
  }

  // SOFA ≥7 + HEART ≥7 → choque mixto séptico-cardiogénico
  const sofaHeartPacs = Array.from(sofaAltoByPaciente).filter((id) => {
    const h = heartByPaciente.get(id) ?? 0;
    return h >= 7;
  });
  if (sofaHeartPacs.length >= 2) {
    patronesMultiScore.push({
      scoreA: "SOFA",
      scoreB: "HEART",
      cuandoA: "≥ 7",
      cuandoB: "≥ 7",
      pacientes: sofaHeartPacs.length,
      hint: "Choque mixto séptico-cardiogénico — considerar dobutamina si MAP < 65 post-volumen + norepinefrina.",
    });
  }

  return {
    totalEventosLab,
    totalEventosImaging,
    criticosTop,
    correlacionesDxEstudio: correlacionesDxEstudio.slice(0, 10),
    patronesMultiScore,
    hasEnoughData:
      totalEventosLab + totalEventosImaging >= 10 ||
      correlacionesDxEstudio.length > 0,
  };
}

// Hints clínicos curados — corto y accionable
function clinicalHint(diseaseId: string, test: string): string {
  const key = `${diseaseId}|${test}`;
  const hints: Record<string, string> = {
    "dm2-typical|glucosa":
      "Control glucémico fuera de meta — considerar ajuste basal y revisar adherencia. Si HbA1c > 9, intensificar.",
    "hfref|potasio":
      "K+ anormal en IC con SGLT2/IECA/ARM — vigilar hiperK con ARM (espironolactona) si TFG < 45.",
    "sepsis|lactato":
      "Lactato crítico en sepsis — bundle 1h (cultivos, ATB, fluidos 30 mL/kg, vasopresor si MAP < 65 post-volumen).",
    "ischemic-cm|troponina":
      "Troponina elevada en cardiopatía isquémica — considerar cateterismo ≤24h si NSTEMI o ≤2h si STEMI.",
    "adhf-acute|potasio":
      "K+ alterado en IC aguda — diurético IV puede agravar hipoK; vigilar arritmia y suplementar oral.",
  };
  return hints[key] ?? "Asociación detectada en tu cohorte — revisar manejo según contexto clínico del paciente.";
}
