/**
 * Calculadoras de scores por departamento de especialidad.
 *
 * Referencias:
 *   - HEART: Backus B.E. et al. (2013) Crit Pathw Cardiol — riesgo SCA
 *   - NIHSS: NIH Stroke Scale — escala oficial NINDS
 *   - ECOG: Oken M.M. et al. (1982) — performance status oncológico
 *   - HbA1c: ADA Standards of Care 2024 — categorías de control DM
 *
 * Cada calculadora es pura — sin side effects — para que se pueda probar
 * con Vitest y reusar tanto en server (action) como en client (preview
 * del drawer mientras el médico escribe).
 */

// ----------------------------------------------------------------
// CARDIOLOGÍA — HEART score (riesgo SCA a 6 semanas)
// ----------------------------------------------------------------

export interface HeartInput {
  /** Historia: 0 ligeramente sospechosa, 1 moderadamente, 2 altamente */
  historia: 0 | 1 | 2;
  /** ECG: 0 normal, 1 anormal no específico, 2 con desnivel ST significativo */
  ecg: 0 | 1 | 2;
  /** Edad: 0 si <45, 1 si 45-64, 2 si ≥65 */
  edad: 0 | 1 | 2;
  /** Factores de riesgo: 0 ninguno, 1 1-2 FRCV, 2 ≥3 o ECV conocida */
  factoresRiesgo: 0 | 1 | 2;
  /** Troponina: 0 normal, 1 1-3× LSN, 2 >3× LSN */
  troponina: 0 | 1 | 2;
}

export interface HeartResult {
  total: number;
  riesgo: "bajo" | "moderado" | "alto";
  mortalidad6sem: string;
  conducta: string;
}

export function calcularHeart(input: HeartInput): HeartResult {
  const total =
    input.historia +
    input.ecg +
    input.edad +
    input.factoresRiesgo +
    input.troponina;

  if (total <= 3) {
    return {
      total,
      riesgo: "bajo",
      mortalidad6sem: "0.9-1.7%",
      conducta: "Alta con seguimiento ambulatorio temprano",
    };
  }
  if (total <= 6) {
    return {
      total,
      riesgo: "moderado",
      mortalidad6sem: "12-17%",
      conducta: "Observación, estratificación adicional (ergometría/coronariografía)",
    };
  }
  return {
    total,
    riesgo: "alto",
    mortalidad6sem: "50-65%",
    conducta: "Manejo invasivo — coronariografía urgente",
  };
}

// ----------------------------------------------------------------
// NEUROLOGÍA — NIHSS (NIH Stroke Scale)
// ----------------------------------------------------------------

export interface NihssInput {
  /** 1a Nivel conciencia (0-3) */
  nivelConciencia: 0 | 1 | 2 | 3;
  /** 1b Preguntas LOC (0-2) */
  preguntasLoc: 0 | 1 | 2;
  /** 1c Órdenes LOC (0-2) */
  ordenesLoc: 0 | 1 | 2;
  /** 2 Mirada (0-2) */
  mirada: 0 | 1 | 2;
  /** 3 Campos visuales (0-3) */
  camposVisuales: 0 | 1 | 2 | 3;
  /** 4 Parálisis facial (0-3) */
  paresia_facial: 0 | 1 | 2 | 3;
  /** 5 Motor MS — máx de brazo der/izq (0-4) */
  motorMs: 0 | 1 | 2 | 3 | 4;
  /** 6 Motor MI — máx de pierna der/izq (0-4) */
  motorMi: 0 | 1 | 2 | 3 | 4;
  /** 7 Ataxia (0-2) */
  ataxia: 0 | 1 | 2;
  /** 8 Sensibilidad (0-2) */
  sensibilidad: 0 | 1 | 2;
  /** 9 Lenguaje (0-3) */
  lenguaje: 0 | 1 | 2 | 3;
  /** 10 Disartria (0-2) */
  disartria: 0 | 1 | 2;
  /** 11 Negligencia (0-2) */
  negligencia: 0 | 1 | 2;
}

export interface NihssResult {
  total: number;
  severidad: "sin_deficit" | "leve" | "moderado" | "moderado_severo" | "severo";
  tpaCandidato: boolean;
}

export function calcularNihss(input: NihssInput): NihssResult {
  const total =
    input.nivelConciencia +
    input.preguntasLoc +
    input.ordenesLoc +
    input.mirada +
    input.camposVisuales +
    input.paresia_facial +
    input.motorMs +
    input.motorMi +
    input.ataxia +
    input.sensibilidad +
    input.lenguaje +
    input.disartria +
    input.negligencia;

  let severidad: NihssResult["severidad"];
  if (total === 0) severidad = "sin_deficit";
  else if (total <= 4) severidad = "leve";
  else if (total <= 15) severidad = "moderado";
  else if (total <= 20) severidad = "moderado_severo";
  else severidad = "severo";

  // Candidato a tPA: NIHSS entre 4 y 25 (ventana terapéutica típica)
  const tpaCandidato = total >= 4 && total <= 25;

  return { total, severidad, tpaCandidato };
}

// ----------------------------------------------------------------
// ONCOLOGÍA — ECOG Performance Status (0-5)
// ----------------------------------------------------------------

export interface EcogResult {
  ecog: 0 | 1 | 2 | 3 | 4 | 5;
  karnofskyAprox: number;
  descripcion: string;
  apto_quimio: boolean;
}

export function interpretarEcog(ecog: 0 | 1 | 2 | 3 | 4 | 5): EcogResult {
  const map: Record<0 | 1 | 2 | 3 | 4 | 5, Omit<EcogResult, "ecog">> = {
    0: {
      karnofskyAprox: 100,
      descripcion: "Asintomático, actividad normal completa",
      apto_quimio: true,
    },
    1: {
      karnofskyAprox: 80,
      descripcion:
        "Sintomático ambulatorio, capaz de trabajo ligero",
      apto_quimio: true,
    },
    2: {
      karnofskyAprox: 60,
      descripcion:
        "Ambulatorio, capaz de autocuidado pero no de trabajo, en cama < 50% del día",
      apto_quimio: true,
    },
    3: {
      karnofskyAprox: 40,
      descripcion:
        "Capacidad limitada de autocuidado, en cama > 50% del día",
      apto_quimio: false,
    },
    4: {
      karnofskyAprox: 20,
      descripcion: "Completamente incapacitado, encamado",
      apto_quimio: false,
    },
    5: {
      karnofskyAprox: 0,
      descripcion: "Fallecido",
      apto_quimio: false,
    },
  };
  return { ecog, ...map[ecog] };
}

// ----------------------------------------------------------------
// ENDOCRINOLOGÍA — Control glucémico (HbA1c ADA 2024)
// ----------------------------------------------------------------

export interface A1cResult {
  hba1c: number;
  glucosaPromedio: number; // mg/dL eAG
  categoria:
    | "no_diabetes"
    | "prediabetes"
    | "diabetes_meta"
    | "control_aceptable"
    | "fuera_meta";
  recomendacion: string;
}

export function interpretarHba1c(
  hba1c: number,
  metaIndividualizada = 7.0,
): A1cResult {
  // eAG (mg/dL) = 28.7 * HbA1c - 46.7 — Nathan et al. 2008
  const glucosaPromedio = Math.round(28.7 * hba1c - 46.7);

  let categoria: A1cResult["categoria"];
  let recomendacion: string;

  if (hba1c < 5.7) {
    categoria = "no_diabetes";
    recomendacion = "Sin DM. Repetir tamizaje según factores de riesgo.";
  } else if (hba1c < 6.5) {
    categoria = "prediabetes";
    recomendacion =
      "Prediabetes. Cambios en estilo de vida + considerar metformina si IMC ≥35 o ECVA.";
  } else if (hba1c <= metaIndividualizada) {
    categoria = "diabetes_meta";
    recomendacion =
      "DM en meta individualizada. Mantener esquema actual.";
  } else if (hba1c <= metaIndividualizada + 1.0) {
    categoria = "control_aceptable";
    recomendacion =
      "Control ligeramente fuera de meta. Reforzar adherencia y dieta antes de escalar fármacos.";
  } else {
    categoria = "fuera_meta";
    recomendacion =
      "Fuera de meta. Intensificar tratamiento — escalar a doble/triple terapia o iniciar insulina si HbA1c > 9%.";
  }

  return { hba1c, glucosaPromedio, categoria, recomendacion };
}
