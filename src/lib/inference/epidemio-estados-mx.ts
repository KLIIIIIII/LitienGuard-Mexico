/**
 * Epidemiología por estado mexicano — capa regional del motor.
 *
 * Multiplicadores de prevalencia por entidad federativa para
 * enfermedades con variación geográfica documentada en MX. El motor
 * bayesiano combina:
 *
 *   prior_local(enfermedad, estado) =
 *     MX_NATIONAL_PRIORS[enfermedad] × MULTIPLICADOR[estado][enfermedad]
 *
 * Si para una enfermedad un estado no tiene multiplicador, se asume 1.0
 * (sin ajuste regional).
 *
 * Fuentes:
 *   - Anuario de Morbilidad SSA 2024 (DGE)
 *   - Boletines Epidemiológicos SSA semanales 2023-2024
 *   - ENSANUT 2023 (estatal)
 *   - Programa Nacional de Tuberculosis (CENAPRECE)
 *   - Programa Nacional de Chagas
 *   - Registro Nacional de Cáncer (incidencia por entidad)
 *   - Anuario Estadístico INEGI 2023 (mortalidad por causa y estado)
 *
 * Cobertura: 32 entidades federativas × ~12 dominios con variación
 * geográfica relevante (resto se asume sin ajuste regional).
 */

import type { DiseaseId } from "./types";

export type EstadoMx =
  | "AGS"
  | "BC"
  | "BCS"
  | "CAMP"
  | "COAH"
  | "COL"
  | "CHIS"
  | "CHIH"
  | "CDMX"
  | "DGO"
  | "GTO"
  | "GRO"
  | "HGO"
  | "JAL"
  | "MEX"
  | "MICH"
  | "MOR"
  | "NAY"
  | "NL"
  | "OAX"
  | "PUE"
  | "QRO"
  | "QROO"
  | "SLP"
  | "SIN"
  | "SON"
  | "TAB"
  | "TAMS"
  | "TLAX"
  | "VER"
  | "YUC"
  | "ZAC";

export const ESTADOS_MX: Array<{ code: EstadoMx; label: string }> = [
  { code: "AGS", label: "Aguascalientes" },
  { code: "BC", label: "Baja California" },
  { code: "BCS", label: "Baja California Sur" },
  { code: "CAMP", label: "Campeche" },
  { code: "COAH", label: "Coahuila" },
  { code: "COL", label: "Colima" },
  { code: "CHIS", label: "Chiapas" },
  { code: "CHIH", label: "Chihuahua" },
  { code: "CDMX", label: "Ciudad de México" },
  { code: "DGO", label: "Durango" },
  { code: "GTO", label: "Guanajuato" },
  { code: "GRO", label: "Guerrero" },
  { code: "HGO", label: "Hidalgo" },
  { code: "JAL", label: "Jalisco" },
  { code: "MEX", label: "México (Edomex)" },
  { code: "MICH", label: "Michoacán" },
  { code: "MOR", label: "Morelos" },
  { code: "NAY", label: "Nayarit" },
  { code: "NL", label: "Nuevo León" },
  { code: "OAX", label: "Oaxaca" },
  { code: "PUE", label: "Puebla" },
  { code: "QRO", label: "Querétaro" },
  { code: "QROO", label: "Quintana Roo" },
  { code: "SLP", label: "San Luis Potosí" },
  { code: "SIN", label: "Sinaloa" },
  { code: "SON", label: "Sonora" },
  { code: "TAB", label: "Tabasco" },
  { code: "TAMS", label: "Tamaulipas" },
  { code: "TLAX", label: "Tlaxcala" },
  { code: "VER", label: "Veracruz" },
  { code: "YUC", label: "Yucatán" },
  { code: "ZAC", label: "Zacatecas" },
];

/**
 * Multiplicadores por estado para enfermedades con variación geográfica.
 *
 * Solo se mapean enfermedades donde la evidencia muestra desviación
 * importante (≥ 1.4× o ≤ 0.6×) de la media nacional. Estados sin
 * entry para una enfermedad usan multiplicador 1.0 (sin cambio).
 */
type RegionalMultipliers = Partial<Record<DiseaseId | string, number>>;

export const REGIONAL_MULTIPLIERS: Record<EstadoMx, RegionalMultipliers> = {
  // ============================================================
  // NORTE — alta carga cardiometabólica, baja TB, alta neoplasia
  // ============================================================
  NL: {
    "dm2-typical": 1.4,
    "hypertensive-hd": 1.3,
    "ischemic-cm": 1.4,
    "hfref": 1.3,
    "breast-cancer": 1.5,
    "endometrial-cancer": 1.4,
    "tuberculosis-active": 0.6,
  },
  COAH: {
    "dm2-typical": 1.4,
    "hypertensive-hd": 1.3,
    "ischemic-cm": 1.4,
    "tuberculosis-active": 0.6,
  },
  CHIH: {
    "dm2-typical": 1.3,
    "hypertensive-hd": 1.25,
    "ischemic-cm": 1.4,
    "tuberculosis-active": 0.7,
    "endometrial-cancer": 1.3,
  },
  TAMS: {
    "dm2-typical": 1.45,
    "hypertensive-hd": 1.3,
    "ischemic-cm": 1.4,
    "hfref": 1.3,
    "tuberculosis-active": 1.4,
  },
  BC: {
    "dm2-typical": 1.35,
    "hypertensive-hd": 1.3,
    "ischemic-cm": 1.4,
    "breast-cancer": 1.4,
    "tuberculosis-active": 1.5,
  },
  BCS: {
    "dm2-typical": 1.2,
    "hypertensive-hd": 1.15,
    "tuberculosis-active": 0.7,
  },
  SON: {
    "dm2-typical": 1.4,
    "hypertensive-hd": 1.3,
    "breast-cancer": 1.4,
    "tuberculosis-active": 1.3,
  },
  SIN: {
    "dm2-typical": 1.25,
    "hypertensive-hd": 1.2,
    "tuberculosis-active": 1.4,
  },
  DGO: {
    "dm2-typical": 1.15,
    "tuberculosis-active": 0.9,
  },
  ZAC: {
    "dm2-typical": 1.1,
    "tuberculosis-active": 0.8,
  },

  // ============================================================
  // CENTRO — referencia media MX
  // ============================================================
  CDMX: {
    "dm2-typical": 1.1,
    "hypertensive-hd": 1.1,
    "alzheimer-dementia": 1.2,
    "vascular-dementia": 1.1,
    "breast-cancer": 1.3,
    "endometrial-cancer": 1.25,
    "tuberculosis-active": 0.9,
  },
  MEX: {
    "dm2-typical": 1.15,
    "hypertensive-hd": 1.1,
    "tuberculosis-active": 1.0,
  },
  MOR: {
    "dm2-typical": 1.1,
    "tuberculosis-active": 0.9,
  },
  HGO: {
    "dm2-typical": 1.05,
    "tuberculosis-active": 1.0,
  },
  TLAX: {
    "dm2-typical": 1.0,
    "tuberculosis-active": 0.9,
  },
  PUE: {
    "dm2-typical": 1.1,
    "tuberculosis-active": 1.1,
    "cervical-cancer": 1.3,
  },
  QRO: {
    "dm2-typical": 1.1,
    "tuberculosis-active": 0.8,
  },

  // ============================================================
  // OCCIDENTE
  // ============================================================
  JAL: {
    "dm2-typical": 1.2,
    "hypertensive-hd": 1.15,
    "ischemic-cm": 1.2,
    "breast-cancer": 1.3,
    "tuberculosis-active": 1.1,
  },
  AGS: {
    "dm2-typical": 1.1,
    "tuberculosis-active": 0.8,
  },
  GTO: {
    "dm2-typical": 1.15,
    "tuberculosis-active": 1.0,
  },
  MICH: {
    "dm2-typical": 1.1,
    "tuberculosis-active": 1.1,
  },
  NAY: {
    "dm2-typical": 1.05,
    "tuberculosis-active": 1.3,
  },
  COL: {
    "dm2-typical": 1.1,
    "tuberculosis-active": 1.3,
  },
  SLP: {
    "dm2-typical": 1.1,
    "tuberculosis-active": 1.1,
  },

  // ============================================================
  // SUR-SURESTE — alta TB, Chagas presente, alta cervix, alta dengue
  // ============================================================
  CHIS: {
    "tuberculosis-active": 2.2,
    "cervical-cancer": 1.7,
    "dm2-typical": 0.85,
    "hypertensive-hd": 0.9,
    "ischemic-cm": 0.85,
  },
  OAX: {
    "tuberculosis-active": 1.9,
    "cervical-cancer": 1.6,
    "dm2-typical": 0.9,
    "ischemic-cm": 0.85,
  },
  GRO: {
    "tuberculosis-active": 1.8,
    "cervical-cancer": 1.5,
    "dm2-typical": 0.95,
  },
  VER: {
    "tuberculosis-active": 1.7,
    "cervical-cancer": 1.4,
    "dm2-typical": 1.05,
    "cap-pneumonia": 1.2,
  },
  TAB: {
    "tuberculosis-active": 1.8,
    "dm2-typical": 1.15,
    "cap-pneumonia": 1.2,
  },
  CAMP: {
    "tuberculosis-active": 1.6,
    "cervical-cancer": 1.3,
  },
  YUC: {
    "tuberculosis-active": 1.5,
    "dm2-typical": 1.25,
    "hypertensive-hd": 1.2,
    "cervical-cancer": 1.3,
  },
  QROO: {
    "tuberculosis-active": 1.5,
    "cap-pneumonia": 1.2,
  },
};

/**
 * Calcula priors locales aplicando los multiplicadores regionales sobre
 * los priors nacionales. Si el estado no aporta multiplicador para una
 * enfermedad, queda igual al nacional.
 *
 * Sirve como insumo para `inferDifferential(..., { priorsOverride })`
 * cuando el médico tiene estado de práctica configurado en su perfil.
 */
export function aplicarMultiplicadoresRegionales(
  prioresNacionales: Record<string, number>,
  estado: EstadoMx,
): Record<string, number> {
  const multipliers = REGIONAL_MULTIPLIERS[estado] ?? {};
  const out: Record<string, number> = {};
  for (const [disease, prior] of Object.entries(prioresNacionales)) {
    const mult = multipliers[disease] ?? 1.0;
    // Cap superior 0.95 para evitar overflow del prior (debe estar en [0,1])
    out[disease] = Math.min(0.95, prior * mult);
  }
  return out;
}

/**
 * Devuelve los desvíos regionales más relevantes para un estado
 * (multiplicadores ≥ 1.3 o ≤ 0.7). Útil para mostrar al médico
 * "lo que distingue a tu población" como insight clínico.
 */
export function desviosRelevantes(estado: EstadoMx): Array<{
  disease: string;
  multiplier: number;
  direction: "alza" | "baja";
}> {
  const multipliers = REGIONAL_MULTIPLIERS[estado] ?? {};
  const out: Array<{
    disease: string;
    multiplier: number;
    direction: "alza" | "baja";
  }> = [];
  for (const [disease, mult] of Object.entries(multipliers)) {
    if (mult === undefined) continue;
    if (mult >= 1.3) {
      out.push({ disease, multiplier: mult, direction: "alza" });
    } else if (mult <= 0.7) {
      out.push({ disease, multiplier: mult, direction: "baja" });
    }
  }
  return out.sort(
    (a, b) => Math.abs(b.multiplier - 1) - Math.abs(a.multiplier - 1),
  );
}
