/**
 * Scores y bundles de Quirófano.
 *
 * Anclados a literatura primaria:
 *   - WHO Surgical Safety Checklist (2009) — global standard, validado
 *     en Haynes et al. NEJM 2009 (reducción 47% mortalidad, 36%
 *     complicaciones en 8 hospitales mundiales).
 *   - RCRI: Lee T.H. et al. Circulation 1999 — Revised Cardiac Risk
 *     Index para cirugía no cardíaca. Validado en >4,000 pacientes.
 *
 * Funciones puras — testeables con Vitest.
 */

// ===================================================================
// WHO Surgical Safety Checklist — 3 pausas (Haynes NEJM 2009)
// ===================================================================

/** Sign-In — antes de inducción anestésica */
export interface WhoSignInInput {
  /** Identificación paciente confirmada (≥2 identificadores) */
  identificacionConfirmada: boolean;
  /** Sitio quirúrgico marcado o N/A */
  sitioMarcado: boolean;
  /** Consentimiento informado firmado */
  consentimientoFirmado: boolean;
  /** Verificación máquina de anestesia y medicamentos */
  verificacionAnestesia: boolean;
  /** Pulsioxímetro colocado y funcionando */
  pulsioximetro: boolean;
  /** Alergias conocidas evaluadas */
  alergiasEvaluadas: boolean;
  /** Riesgo vía aérea difícil / aspiración evaluado */
  viaAereaEvaluada: boolean;
  /** Riesgo de sangrado > 500 mL (7 mL/kg en niños) evaluado y acceso adecuado */
  riesgoSangradoEvaluado: boolean;
}

/** Time-Out — antes de incisión */
export interface WhoTimeOutInput {
  /** Todos los miembros del equipo se presentaron por nombre y rol */
  presentacionEquipo: boolean;
  /** Cirujano + anestesiólogo + enfermería confirmaron paciente, sitio y procedimiento */
  confirmacionTresVias: boolean;
  /** Eventos críticos anticipados del cirujano (pasos críticos, duración, sangrado esperado) */
  eventosCirujanoAnticipados: boolean;
  /** Anestesiólogo revisó preocupaciones específicas del paciente */
  preocupacionesAnestesia: boolean;
  /** Enfermería confirmó esterilidad indicadores e inquietudes de equipo */
  enfermeriaConfirmoEsterilidad: boolean;
  /** Profilaxis antibiótica administrada en los últimos 60 min (o N/A) */
  profilaxisAntibiotica: boolean;
  /** Imagenología esencial mostrada (o N/A) */
  imagenologiaDisponible: boolean;
}

/** Sign-Out — antes de salir del quirófano */
export interface WhoSignOutInput {
  /** Nombre del procedimiento registrado */
  procedimientoRegistrado: boolean;
  /** Conteo de gasas, instrumentos y agujas correcto (o N/A) */
  conteoCorrecto: boolean;
  /** Etiquetado de muestras correcto (nombre paciente, sitio anatómico) */
  etiquetadoMuestras: boolean;
  /** Problemas con equipo identificados y reportados */
  problemasEquipo: boolean;
  /** Preocupaciones clave de manejo post-operatorio comunicadas al equipo de recuperación */
  comunicacionPostop: boolean;
}

export interface WhoChecklistResult {
  /** Cuántos items totales completados de las 3 pausas (max 20) */
  totalCompletados: number;
  /** Total posible (20) */
  totalPosible: number;
  /** Compliance % */
  compliance: number;
  /** ¿Las 3 pausas están al 100%? */
  bundleCompleto: boolean;
  /** Items pendientes por pausa */
  pendientes: {
    signIn: string[];
    timeOut: string[];
    signOut: string[];
  };
}

const SIGN_IN_LABELS: Record<keyof WhoSignInInput, string> = {
  identificacionConfirmada: "Identificación paciente confirmada",
  sitioMarcado: "Sitio quirúrgico marcado",
  consentimientoFirmado: "Consentimiento informado firmado",
  verificacionAnestesia: "Verificación máquina anestesia + medicamentos",
  pulsioximetro: "Pulsioxímetro colocado y funcional",
  alergiasEvaluadas: "Alergias conocidas evaluadas",
  viaAereaEvaluada: "Riesgo vía aérea difícil evaluado",
  riesgoSangradoEvaluado: "Riesgo sangrado evaluado y accesos preparados",
};

const TIME_OUT_LABELS: Record<keyof WhoTimeOutInput, string> = {
  presentacionEquipo: "Equipo se presentó por nombre y rol",
  confirmacionTresVias: "Confirmación 3 vías paciente / sitio / procedimiento",
  eventosCirujanoAnticipados: "Cirujano anticipó eventos críticos",
  preocupacionesAnestesia: "Anestesia revisó preocupaciones del paciente",
  enfermeriaConfirmoEsterilidad: "Enfermería confirmó esterilidad + equipo",
  profilaxisAntibiotica: "Profilaxis antibiótica ≤ 60 min (o N/A)",
  imagenologiaDisponible: "Imagenología esencial mostrada (o N/A)",
};

const SIGN_OUT_LABELS: Record<keyof WhoSignOutInput, string> = {
  procedimientoRegistrado: "Nombre del procedimiento registrado",
  conteoCorrecto: "Conteo gasas / instrumentos / agujas correcto",
  etiquetadoMuestras: "Etiquetado de muestras correcto",
  problemasEquipo: "Problemas de equipo reportados (si hubo)",
  comunicacionPostop: "Manejo postoperatorio comunicado al equipo recuperación",
};

export function evaluarWhoChecklist(
  signIn: WhoSignInInput,
  timeOut: WhoTimeOutInput,
  signOut: WhoSignOutInput,
): WhoChecklistResult {
  const siEntries = Object.entries(signIn) as Array<[keyof WhoSignInInput, boolean]>;
  const toEntries = Object.entries(timeOut) as Array<[keyof WhoTimeOutInput, boolean]>;
  const soEntries = Object.entries(signOut) as Array<[keyof WhoSignOutInput, boolean]>;

  const siCount = siEntries.filter(([, v]) => v).length;
  const toCount = toEntries.filter(([, v]) => v).length;
  const soCount = soEntries.filter(([, v]) => v).length;
  const totalCompletados = siCount + toCount + soCount;
  const totalPosible =
    siEntries.length + toEntries.length + soEntries.length;

  return {
    totalCompletados,
    totalPosible,
    compliance: Math.round((totalCompletados / totalPosible) * 100),
    bundleCompleto: totalCompletados === totalPosible,
    pendientes: {
      signIn: siEntries
        .filter(([, v]) => !v)
        .map(([k]) => SIGN_IN_LABELS[k]),
      timeOut: toEntries
        .filter(([, v]) => !v)
        .map(([k]) => TIME_OUT_LABELS[k]),
      signOut: soEntries
        .filter(([, v]) => !v)
        .map(([k]) => SIGN_OUT_LABELS[k]),
    },
  };
}

// ===================================================================
// RCRI — Lee T.H. Circulation 1999
// Revised Cardiac Risk Index para cirugía no cardíaca
// Cada criterio = 1 punto. Score 0-6.
// ===================================================================

export interface RcriInput {
  /** Cirugía de alto riesgo (intraperitoneal, intratorácica, vascular suprainguinal) */
  cirugiaAltoRiesgo: boolean;
  /** Historia de cardiopatía isquémica */
  cardiopatiaIsquemica: boolean;
  /** Historia de insuficiencia cardíaca congestiva */
  insuficienciaCardiaca: boolean;
  /** Historia de enfermedad cerebrovascular (EVC o TIA) */
  evcTia: boolean;
  /** Diabetes con tratamiento insulínico */
  diabetesInsulina: boolean;
  /** Creatinina sérica preoperatoria > 2.0 mg/dL */
  creatininaAlta: boolean;
}

export interface RcriResult {
  total: number;
  /** Clase Lee 1999 */
  clase: "I" | "II" | "III" | "IV";
  /** Tasa de eventos CV mayores estimada */
  riesgoEventoMayor: string;
  /** Recomendación general */
  recomendacion: string;
}

export function calcularRcri(input: RcriInput): RcriResult {
  const items = [
    input.cirugiaAltoRiesgo,
    input.cardiopatiaIsquemica,
    input.insuficienciaCardiaca,
    input.evcTia,
    input.diabetesInsulina,
    input.creatininaAlta,
  ];
  const total = items.filter(Boolean).length;

  let clase: RcriResult["clase"];
  let riesgoEventoMayor: string;
  let recomendacion: string;

  if (total === 0) {
    clase = "I";
    riesgoEventoMayor = "~0.4%";
    recomendacion =
      "Riesgo bajo. Proceder con cirugía. Manejo perioperatorio estándar.";
  } else if (total === 1) {
    clase = "II";
    riesgoEventoMayor = "~0.9%";
    recomendacion =
      "Riesgo bajo. Proceder con cirugía. Considerar monitorización estándar.";
  } else if (total === 2) {
    clase = "III";
    riesgoEventoMayor = "~6.6%";
    recomendacion =
      "Riesgo intermedio. Considerar prueba funcional cardíaca según capacidad funcional. Beta-bloqueador perioperatorio si tolerado.";
  } else {
    clase = "IV";
    riesgoEventoMayor = "≥ 11%";
    recomendacion =
      "Riesgo alto. Optimización médica preoperatoria mandatoria. Considerar ecocardiograma + stress test. Discutir riesgo/beneficio con paciente y familia.";
  }

  return { total, clase, riesgoEventoMayor, recomendacion };
}
