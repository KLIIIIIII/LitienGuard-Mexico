/**
 * Lab Pathway — critical value detection, reflex testing, delta check.
 *
 * Anclado internamente a:
 *   - Joint Commission NPSG 02.03.01 (critical results notification)
 *   - CLSI EP-series (laboratory standards)
 *   - Lundberg Crit Lab Med 2007 (critical value concept history)
 *
 * Branding al usuario: "Motor LitienGuard · Lab Pathway".
 * Citas académicas internas para audit / clinical safety case.
 *
 * Funciones puras — testeables con Vitest.
 */

// ===================================================================
// Critical value lookup
// ===================================================================

export type LabTest =
  | "glucosa"
  | "potasio"
  | "sodio"
  | "calcio"
  | "creatinina"
  | "hemoglobina"
  | "plaquetas"
  | "leucocitos"
  | "inr"
  | "troponina"
  | "lactato"
  | "ph_arterial"
  | "pco2"
  | "po2"
  | "tsh"
  | "hba1c";

export interface LabResultInput {
  test: LabTest;
  /** Valor numérico observado */
  valor: number;
  /** Edad del paciente para rangos pediátricos cuando aplica */
  edad?: number;
  /** Sexo del paciente para rangos sexo-específicos */
  sexo?: "M" | "F" | "O";
}

export type Severidad = "normal" | "anormal" | "critico_bajo" | "critico_alto";

export interface LabInterpretation {
  test: LabTest;
  valor: number;
  unidad: string;
  severidad: Severidad;
  /** Rango de referencia mostrado al usuario (sin cita externa) */
  rango: string;
  /** Mensaje clínico breve */
  mensaje: string;
  /** Si es crítico, acción sugerida */
  accionSugerida?: string;
}

/**
 * Tabla de valores críticos. Rangos compilados internamente desde
 * lineamientos institucionales — al usuario solo se le muestra el rango,
 * no la fuente.
 */
const LAB_CONFIG: Record<
  LabTest,
  {
    unidad: string;
    rangoNormalBajo: number;
    rangoNormalAlto: number;
    criticoBajo: number;
    criticoAlto: number;
    label: string;
  }
> = {
  glucosa: {
    unidad: "mg/dL",
    rangoNormalBajo: 70,
    rangoNormalAlto: 99,
    criticoBajo: 50,
    criticoAlto: 500,
    label: "Glucosa",
  },
  potasio: {
    unidad: "mEq/L",
    rangoNormalBajo: 3.5,
    rangoNormalAlto: 5.0,
    criticoBajo: 2.5,
    criticoAlto: 6.5,
    label: "Potasio",
  },
  sodio: {
    unidad: "mEq/L",
    rangoNormalBajo: 135,
    rangoNormalAlto: 145,
    criticoBajo: 120,
    criticoAlto: 160,
    label: "Sodio",
  },
  calcio: {
    unidad: "mg/dL",
    rangoNormalBajo: 8.5,
    rangoNormalAlto: 10.5,
    criticoBajo: 6.5,
    criticoAlto: 13,
    label: "Calcio total",
  },
  creatinina: {
    unidad: "mg/dL",
    rangoNormalBajo: 0.6,
    rangoNormalAlto: 1.3,
    criticoBajo: 0,
    criticoAlto: 5,
    label: "Creatinina",
  },
  hemoglobina: {
    unidad: "g/dL",
    rangoNormalBajo: 12,
    rangoNormalAlto: 17,
    criticoBajo: 7,
    criticoAlto: 20,
    label: "Hemoglobina",
  },
  plaquetas: {
    unidad: "× 10³/µL",
    rangoNormalBajo: 150,
    rangoNormalAlto: 450,
    criticoBajo: 20,
    criticoAlto: 1000,
    label: "Plaquetas",
  },
  leucocitos: {
    unidad: "× 10³/µL",
    rangoNormalBajo: 4,
    rangoNormalAlto: 11,
    criticoBajo: 1,
    criticoAlto: 30,
    label: "Leucocitos",
  },
  inr: {
    unidad: "ratio",
    rangoNormalBajo: 0.9,
    rangoNormalAlto: 1.2,
    criticoBajo: 0,
    criticoAlto: 5,
    label: "INR",
  },
  troponina: {
    unidad: "ng/mL",
    rangoNormalBajo: 0,
    rangoNormalAlto: 0.04,
    criticoBajo: 0,
    criticoAlto: 0.5,
    label: "Troponina I",
  },
  lactato: {
    unidad: "mmol/L",
    rangoNormalBajo: 0.5,
    rangoNormalAlto: 2.2,
    criticoBajo: 0,
    criticoAlto: 4,
    label: "Lactato",
  },
  ph_arterial: {
    unidad: "",
    rangoNormalBajo: 7.35,
    rangoNormalAlto: 7.45,
    criticoBajo: 7.2,
    criticoAlto: 7.6,
    label: "pH arterial",
  },
  pco2: {
    unidad: "mmHg",
    rangoNormalBajo: 35,
    rangoNormalAlto: 45,
    criticoBajo: 20,
    criticoAlto: 70,
    label: "pCO₂",
  },
  po2: {
    unidad: "mmHg",
    rangoNormalBajo: 80,
    rangoNormalAlto: 100,
    criticoBajo: 50,
    criticoAlto: 500,
    label: "pO₂",
  },
  tsh: {
    unidad: "µUI/mL",
    rangoNormalBajo: 0.4,
    rangoNormalAlto: 4.5,
    criticoBajo: 0,
    criticoAlto: 100,
    label: "TSH",
  },
  hba1c: {
    unidad: "%",
    rangoNormalBajo: 4,
    rangoNormalAlto: 5.6,
    criticoBajo: 0,
    criticoAlto: 14,
    label: "HbA1c",
  },
};

const ACCION_CRITICA: Record<LabTest, string> = {
  glucosa:
    "Hipoglucemia severa: dextrosa 50% IV 25-50 mL · Hiperglucemia >500: descartar DKA/HHS",
  potasio:
    "Hipo: monitor cardíaco + reposición · Hiper >6.5: gluconato Ca, insulina+dextrosa, kayexalato, considerar diálisis",
  sodio:
    "Hipo <120: solución salina 3% lenta (corrección <10 mEq/24h por mielinólisis) · Hiper >160: descartar diabetes insípida",
  calcio:
    "Hipo: gluconato Ca IV · Hiper >13: hidratación + bisfosfonato + calcitonina",
  creatinina:
    "Investigar AKI: causa prerrenal vs intrarrenal vs postrenal · Suspender nefrotóxicos · Ajustar fármacos",
  hemoglobina:
    "Hb <7: considerar transfusión · Hb >20: descartar policitemia vera, deshidratación",
  plaquetas:
    "Plaq <20: riesgo sangrado espontáneo, considerar transfusión · Plaq >1000: descartar trombocitemia esencial",
  leucocitos:
    "Leuco <1: neutropenia severa — aislamiento, ATB amplio si fiebre · Leuco >30: descartar leucemia",
  inr:
    "INR >5 sin sangrado: suspender warfarina, vit K oral · INR >9 o sangrado: vit K IV + concentrado complejo protrombínico",
  troponina:
    "Troponina >0.5: descartar SCA — EKG seriado, activar código IAM si STEMI",
  lactato:
    "Lactato >4: sospechar shock séptico — bundle sepsis 1h, hidratación agresiva, búsqueda foco infeccioso",
  ph_arterial:
    "Acidosis severa <7.2: identificar causa (DKA, sepsis, intoxicación) · Alcalosis severa >7.6: respiratoria vs metabólica",
  pco2:
    "Hipocapnia <20: hiperventilación · Hipercapnia >70: insuficiencia respiratoria — considerar VMI",
  po2: "pO₂ <50: insuficiencia respiratoria severa — O₂ suplementario, considerar VMI",
  tsh:
    "TSH >100: descartar coma mixedematoso — levotiroxina IV + hidrocortisona",
  hba1c:
    "HbA1c >14: descontrol severo, riesgo complicaciones agudas — intensificar manejo",
};

/**
 * Interpreta un valor de lab y devuelve severidad + recomendación.
 * Pure function — testeable.
 */
export function interpretarLab(input: LabResultInput): LabInterpretation {
  const config = LAB_CONFIG[input.test];
  const { valor } = input;

  let severidad: Severidad;
  if (valor <= config.criticoBajo) severidad = "critico_bajo";
  else if (valor >= config.criticoAlto) severidad = "critico_alto";
  else if (valor < config.rangoNormalBajo || valor > config.rangoNormalAlto)
    severidad = "anormal";
  else severidad = "normal";

  const rango = `${config.rangoNormalBajo}-${config.rangoNormalAlto} ${config.unidad}`;

  let mensaje: string;
  if (severidad === "normal") mensaje = "Dentro de rango de referencia";
  else if (severidad === "anormal") mensaje = "Fuera de rango pero no crítico";
  else if (severidad === "critico_bajo")
    mensaje = `Valor crítico bajo — notificación inmediata requerida`;
  else mensaje = `Valor crítico alto — notificación inmediata requerida`;

  const result: LabInterpretation = {
    test: input.test,
    valor,
    unidad: config.unidad,
    severidad,
    rango,
    mensaje,
  };
  if (severidad === "critico_bajo" || severidad === "critico_alto") {
    result.accionSugerida = ACCION_CRITICA[input.test];
  }
  return result;
}

export function getLabLabel(test: LabTest): string {
  return LAB_CONFIG[test].label;
}

export function getLabUnidad(test: LabTest): string {
  return LAB_CONFIG[test].unidad;
}

// ===================================================================
// Reflex testing rules
// ===================================================================

export interface ReflexRecommendation {
  trigger: string;
  recommendedTest: string;
  rationale: string;
}

/**
 * Cuando un test viene con valor anormal/crítico, sugiere tests
 * reflejos automáticamente (Motor LitienGuard · Lab Pathway).
 */
export function detectarReflexTests(
  interpretation: LabInterpretation,
): ReflexRecommendation[] {
  const recs: ReflexRecommendation[] = [];

  if (interpretation.test === "tsh") {
    if (interpretation.valor > 4.5) {
      recs.push({
        trigger: "TSH elevada",
        recommendedTest: "T4 libre",
        rationale:
          "TSH > 4.5 sugiere hipotiroidismo — confirmar con T4 libre y considerar anti-TPO",
      });
    } else if (interpretation.valor < 0.4) {
      recs.push({
        trigger: "TSH suprimida",
        recommendedTest: "T4 libre + T3 libre",
        rationale:
          "TSH < 0.4 sugiere hipertiroidismo — confirmar con T4L + T3L; considerar TRAb si Graves",
      });
    }
  }

  if (
    interpretation.test === "potasio" &&
    interpretation.severidad !== "normal"
  ) {
    recs.push({
      trigger: "K fuera de rango",
      recommendedTest: "EKG 12 derivaciones",
      rationale:
        "Hipo/hiperkalemia con riesgo arrítmico — EKG inmediato para evaluar ondas T y QRS",
    });
  }

  if (
    interpretation.test === "creatinina" &&
    interpretation.valor > 1.3
  ) {
    recs.push({
      trigger: "Creatinina elevada",
      recommendedTest: "TFG estimada + EGO + relación albúmina/creatinina",
      rationale:
        "Caracterizar enfermedad renal — estimación TFG por CKD-EPI, descartar proteinuria",
    });
  }

  if (interpretation.test === "troponina" && interpretation.valor > 0.04) {
    recs.push({
      trigger: "Troponina elevada",
      recommendedTest: "Troponina seriada en 1-3h + EKG",
      rationale:
        "Confirmar curva ascendente/descendente para diagnóstico IAM tipo 1 vs daño miocárdico crónico",
    });
  }

  if (interpretation.test === "hba1c" && interpretation.valor >= 6.5) {
    recs.push({
      trigger: "HbA1c diagnóstica de DM",
      recommendedTest: "Glucosa ayuno + perfil lipídico + EGO + creatinina",
      rationale:
        "Confirmación diagnóstica + screening complicaciones (renal, retinopatía, dislipidemia)",
    });
  }

  if (interpretation.test === "lactato" && interpretation.valor > 2.2) {
    recs.push({
      trigger: "Lactato elevado",
      recommendedTest: "Gasometría arterial + hemocultivos × 2",
      rationale:
        "Lactato > 2.2 sospecha hipoperfusión — descartar sepsis con cultivos + evaluar acidosis con gases",
    });
  }

  return recs;
}

// ===================================================================
// Delta check — cambio anómalo vs valor previo
// ===================================================================

export interface DeltaCheckInput {
  test: LabTest;
  valorActual: number;
  valorPrevio: number;
  /** Días entre valor previo y actual */
  diasEntre: number;
}

export interface DeltaCheckResult {
  /** Cambio absoluto */
  deltaAbsoluto: number;
  /** Cambio porcentual */
  deltaPorcentual: number;
  /** Si el cambio supera el umbral de delta check */
  esDeltaAnormal: boolean;
  /** Severidad del cambio */
  severidad: "estable" | "cambio_relevante" | "cambio_critico";
  /** Mensaje al clínico */
  mensaje: string;
}

/**
 * Umbrales delta check por test. Si %delta supera el umbral, alertar.
 * Internamente calibrados — al user solo se muestra "cambio relevante".
 */
const DELTA_UMBRAL: Record<LabTest, { porcentaje: number; ventanaDias: number }> = {
  glucosa: { porcentaje: 50, ventanaDias: 7 },
  potasio: { porcentaje: 20, ventanaDias: 3 },
  sodio: { porcentaje: 10, ventanaDias: 7 },
  calcio: { porcentaje: 20, ventanaDias: 7 },
  creatinina: { porcentaje: 50, ventanaDias: 7 },
  hemoglobina: { porcentaje: 25, ventanaDias: 14 },
  plaquetas: { porcentaje: 50, ventanaDias: 7 },
  leucocitos: { porcentaje: 100, ventanaDias: 7 },
  inr: { porcentaje: 50, ventanaDias: 7 },
  troponina: { porcentaje: 100, ventanaDias: 1 },
  lactato: { porcentaje: 100, ventanaDias: 1 },
  ph_arterial: { porcentaje: 5, ventanaDias: 1 },
  pco2: { porcentaje: 25, ventanaDias: 1 },
  po2: { porcentaje: 25, ventanaDias: 1 },
  tsh: { porcentaje: 100, ventanaDias: 90 },
  hba1c: { porcentaje: 20, ventanaDias: 90 },
};

export function detectarDeltaCheck(input: DeltaCheckInput): DeltaCheckResult {
  const config = DELTA_UMBRAL[input.test];
  const deltaAbsoluto = input.valorActual - input.valorPrevio;
  const deltaPorcentual =
    input.valorPrevio !== 0
      ? Math.round((Math.abs(deltaAbsoluto) / input.valorPrevio) * 100)
      : 0;

  const dentroVentana = input.diasEntre <= config.ventanaDias;
  const esDeltaAnormal = dentroVentana && deltaPorcentual >= config.porcentaje;

  let severidad: DeltaCheckResult["severidad"];
  let mensaje: string;

  if (!esDeltaAnormal) {
    severidad = "estable";
    mensaje = "Cambio dentro de variación esperada vs medición previa";
  } else if (deltaPorcentual >= config.porcentaje * 2) {
    severidad = "cambio_critico";
    mensaje = `Cambio del ${deltaPorcentual}% en ${input.diasEntre} días — revisar inmediatamente y considerar repetir`;
  } else {
    severidad = "cambio_relevante";
    mensaje = `Cambio del ${deltaPorcentual}% en ${input.diasEntre} días — relevante clínicamente`;
  }

  return { deltaAbsoluto, deltaPorcentual, esDeltaAnormal, severidad, mensaje };
}
