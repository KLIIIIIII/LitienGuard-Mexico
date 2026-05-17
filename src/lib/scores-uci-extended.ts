/**
 * Scores extendidos de UCI — APACHE II, FAST-HUG, CAM-ICU.
 *
 * Anclados a literatura primaria:
 *   - APACHE II: Knaus W.A. et al. Crit Care Med 1985 — "APACHE II:
 *     A severity of disease classification system"
 *   - FAST-HUG: Vincent J-L. Crit Care Med 2005 — "Give your patient
 *     a fast hug (at least) once a day"
 *   - CAM-ICU: Ely E.W. et al. JAMA 2001 — "Delirium in mechanically
 *     ventilated patients: validity and reliability of the Confusion
 *     Assessment Method for the ICU"
 *
 * Estos tres son parte del SCCM ICU Liberation Bundle (A-F) y la
 * mayoría de top-25 smart hospitals los aplican como standard of care.
 *
 * Funciones puras — sin side effects, testeables con Vitest.
 */

// ===================================================================
// APACHE II — Knaus 1985
// 12 variables fisiológicas + edad + comorbilidad crónica
// Score 0-71 · cada 5 puntos = +25% mortalidad aproximada
// ===================================================================

export interface ApacheInput {
  /** Temperatura rectal °C */
  tempC: number;
  /** MAP mmHg = (sistólica + 2*diastólica) / 3 */
  map: number;
  /** Frecuencia cardíaca lpm */
  fc: number;
  /** Frecuencia respiratoria rpm */
  fr: number;
  /** Oxigenación: si FiO2 ≥ 0.5 usar A-aDO2 (mmHg), si no usar PaO2 (mmHg) */
  fio2: number;
  /** A-aDO2 mmHg (se usa si FiO2 ≥ 0.5) */
  aADO2?: number;
  /** PaO2 mmHg (se usa si FiO2 < 0.5) */
  pao2?: number;
  /** pH arterial */
  pHArterial: number;
  /** Sodio sérico mEq/L */
  naMeqL: number;
  /** Potasio sérico mEq/L */
  kMeqL: number;
  /** Creatinina mg/dL */
  creatininaMg: number;
  /** ¿Hay AKI (lesión renal aguda)? — duplica el score de creatinina */
  aki: boolean;
  /** Hematocrito % */
  hto: number;
  /** Leucocitos × 10³/µL */
  leucosMil: number;
  /** Glasgow 3-15 */
  glasgow: number;
  /** Edad en años */
  edad: number;
  /** Antecedente crónico severo (cirrosis, IC NYHA IV, EPOC severo, ERC en diálisis, inmunodepresión) */
  cronicaSevera: boolean;
  /** ¿Postquirúrgico no electivo o no quirúrgico? (true) vs postquirúrgico electivo (false) */
  noElectivo: boolean;
}

export interface ApacheResult {
  /** Acute Physiology Score (suma de 12 variables) */
  aps: number;
  /** Puntos por edad */
  edadPts: number;
  /** Puntos por comorbilidad crónica */
  cronicaPts: number;
  /** Score total */
  total: number;
  /** Estimación de mortalidad aproximada según rangos publicados */
  mortalidadAprox: string;
  /** Severidad clasificada */
  severidad: "baja" | "moderada" | "alta" | "muy_alta";
}

function apsTemp(c: number): number {
  if (c >= 41) return 4;
  if (c >= 39) return 3;
  if (c >= 38.5) return 1;
  if (c >= 36) return 0;
  if (c >= 34) return 1;
  if (c >= 32) return 2;
  if (c >= 30) return 3;
  return 4;
}
function apsMap(m: number): number {
  if (m >= 160) return 4;
  if (m >= 130) return 3;
  if (m >= 110) return 2;
  if (m >= 70) return 0;
  if (m >= 50) return 2;
  return 4;
}
function apsHR(h: number): number {
  if (h >= 180) return 4;
  if (h >= 140) return 3;
  if (h >= 110) return 2;
  if (h >= 70) return 0;
  if (h >= 55) return 2;
  if (h >= 40) return 3;
  return 4;
}
function apsRR(r: number): number {
  if (r >= 50) return 4;
  if (r >= 35) return 3;
  if (r >= 25) return 1;
  if (r >= 12) return 0;
  if (r >= 10) return 1;
  if (r >= 6) return 2;
  return 4;
}
function apsOxigenacion(fio2: number, aADO2?: number, pao2?: number): number {
  if (fio2 >= 0.5) {
    const a = aADO2 ?? 0;
    if (a >= 500) return 4;
    if (a >= 350) return 3;
    if (a >= 200) return 2;
    return 0;
  }
  const p = pao2 ?? 80;
  if (p > 70) return 0;
  if (p >= 61) return 1;
  if (p >= 55) return 3;
  return 4;
}
function apsPH(p: number): number {
  if (p >= 7.7) return 4;
  if (p >= 7.6) return 3;
  if (p >= 7.5) return 1;
  if (p >= 7.33) return 0;
  if (p >= 7.25) return 2;
  if (p >= 7.15) return 3;
  return 4;
}
function apsNa(n: number): number {
  if (n >= 180) return 4;
  if (n >= 160) return 3;
  if (n >= 155) return 2;
  if (n >= 150) return 1;
  if (n >= 130) return 0;
  if (n >= 120) return 2;
  if (n >= 111) return 3;
  return 4;
}
function apsK(k: number): number {
  if (k >= 7) return 4;
  if (k >= 6) return 3;
  if (k >= 5.5) return 1;
  if (k >= 3.5) return 0;
  if (k >= 3) return 1;
  if (k >= 2.5) return 2;
  return 4;
}
function apsCreat(cr: number, aki: boolean): number {
  let p = 0;
  if (cr >= 3.5) p = 4;
  else if (cr >= 2) p = 3;
  else if (cr >= 1.5) p = 2;
  else if (cr >= 0.6) p = 0;
  else p = 2;
  return aki ? p * 2 : p;
}
function apsHto(h: number): number {
  if (h >= 60) return 4;
  if (h >= 50) return 2;
  if (h >= 46) return 1;
  if (h >= 30) return 0;
  if (h >= 20) return 2;
  return 4;
}
function apsLeucos(l: number): number {
  if (l >= 40) return 4;
  if (l >= 20) return 2;
  if (l >= 15) return 1;
  if (l >= 3) return 0;
  if (l >= 1) return 2;
  return 4;
}
function apsGlasgow(g: number): number {
  return 15 - g;
}
function edadPuntos(edad: number): number {
  if (edad < 45) return 0;
  if (edad <= 54) return 2;
  if (edad <= 64) return 3;
  if (edad <= 74) return 5;
  return 6;
}

export function calcularApacheII(input: ApacheInput): ApacheResult {
  const aps =
    apsTemp(input.tempC) +
    apsMap(input.map) +
    apsHR(input.fc) +
    apsRR(input.fr) +
    apsOxigenacion(input.fio2, input.aADO2, input.pao2) +
    apsPH(input.pHArterial) +
    apsNa(input.naMeqL) +
    apsK(input.kMeqL) +
    apsCreat(input.creatininaMg, input.aki) +
    apsHto(input.hto) +
    apsLeucos(input.leucosMil) +
    apsGlasgow(input.glasgow);

  const edadPts = edadPuntos(input.edad);
  const cronicaPts = input.cronicaSevera ? (input.noElectivo ? 5 : 2) : 0;
  const total = aps + edadPts + cronicaPts;

  let mortalidadAprox: string;
  let severidad: ApacheResult["severidad"];
  if (total <= 4) {
    mortalidadAprox = "~4%";
    severidad = "baja";
  } else if (total <= 9) {
    mortalidadAprox = "~8%";
    severidad = "baja";
  } else if (total <= 14) {
    mortalidadAprox = "~15%";
    severidad = "moderada";
  } else if (total <= 19) {
    mortalidadAprox = "~25%";
    severidad = "moderada";
  } else if (total <= 24) {
    mortalidadAprox = "~40%";
    severidad = "alta";
  } else if (total <= 29) {
    mortalidadAprox = "~55%";
    severidad = "alta";
  } else if (total <= 34) {
    mortalidadAprox = "~75%";
    severidad = "muy_alta";
  } else {
    mortalidadAprox = "~85%";
    severidad = "muy_alta";
  }

  return { aps, edadPts, cronicaPts, total, mortalidadAprox, severidad };
}

// ===================================================================
// FAST-HUG — Vincent 2005
// 7 items que cada paciente UCI debe revisar al menos 1 vez/día
// ===================================================================

export interface FastHugInput {
  feeding: boolean; // alimentación enteral/parenteral iniciada o documentada
  analgesia: boolean; // escala dolor evaluada
  sedation: boolean; // escala RASS evaluada
  thromboprophylaxis: boolean; // HBPM o mecánica
  headOfBed: boolean; // cabecera ≥ 30°
  ulcerProphylaxis: boolean; // IBP o sucralfato
  glucoseControl: boolean; // glucosa en target 140-180
}

export interface FastHugResult {
  /** Cuántos items cumplen */
  cumplidos: number;
  /** Cuántos items faltan */
  pendientes: number;
  /** Lista de items que NO cumplen */
  pendientesLista: string[];
  /** Bundle completo */
  bundleCompleto: boolean;
  /** Compliance % */
  compliance: number;
}

const FAST_HUG_LABELS: Record<keyof FastHugInput, string> = {
  feeding: "Feeding (nutrición)",
  analgesia: "Analgesia (escala dolor)",
  sedation: "Sedation (escala RASS)",
  thromboprophylaxis: "Thromboprophylaxis (HBPM o mecánica)",
  headOfBed: "Head of bed ≥ 30°",
  ulcerProphylaxis: "Ulcer prophylaxis (IBP o sucralfato)",
  glucoseControl: "Glucose control (140-180 mg/dL)",
};

export function calcularFastHug(input: FastHugInput): FastHugResult {
  const items = Object.entries(input) as Array<[keyof FastHugInput, boolean]>;
  const cumplidos = items.filter(([, v]) => v).length;
  const pendientesLista = items
    .filter(([, v]) => !v)
    .map(([k]) => FAST_HUG_LABELS[k]);
  return {
    cumplidos,
    pendientes: 7 - cumplidos,
    pendientesLista,
    bundleCompleto: cumplidos === 7,
    compliance: Math.round((cumplidos / 7) * 100),
  };
}

// ===================================================================
// CAM-ICU — Ely 2001
// Confusion Assessment Method para Intensive Care Unit.
// 4 features. Delirium = (1 + 2) AND (3 OR 4)
// ===================================================================

export interface CamIcuInput {
  /** Feature 1 — inicio agudo o curso fluctuante del estado mental */
  feature1_inicioAgudoFluctuante: boolean;
  /** Feature 2 — inatención (test de letras o números) */
  feature2_inatencion: boolean;
  /** Feature 3 — pensamiento desorganizado (4 preguntas estándar + orden) */
  feature3_pensamientoDesorganizado: boolean;
  /** Feature 4 — nivel alterado de conciencia (RASS ≠ 0) */
  feature4_concienciaAlterada: boolean;
}

export interface CamIcuResult {
  delirium: boolean;
  /** Resumen interpretable */
  interpretacion: string;
}

export function evaluarCamIcu(input: CamIcuInput): CamIcuResult {
  const condicionAB = input.feature1_inicioAgudoFluctuante && input.feature2_inatencion;
  const condicionCoD =
    input.feature3_pensamientoDesorganizado ||
    input.feature4_concienciaAlterada;
  const delirium = condicionAB && condicionCoD;
  let interpretacion: string;
  if (delirium) {
    interpretacion =
      "CAM-ICU POSITIVO — paciente en delirium. Investigar causa (PAD-IS: pain, analgesia, delirium, immobility, sleep) y aplicar bundle no farmacológico antes de fármacos.";
  } else if (!input.feature1_inicioAgudoFluctuante && !input.feature2_inatencion) {
    interpretacion = "CAM-ICU NEGATIVO — sin delirium detectado. Continuar screening cada turno.";
  } else if (!condicionAB) {
    interpretacion =
      "CAM-ICU NEGATIVO — faltan features 1 o 2. No es delirium por criterios CAM-ICU.";
  } else {
    interpretacion =
      "CAM-ICU NEGATIVO — features 1 y 2 positivas pero 3 y 4 negativas. Re-evaluar en próximo turno.";
  }
  return { delirium, interpretacion };
}
