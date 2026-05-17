/**
 * Inteligencia multivariable — 20 cruces clínicos curados con guía citada.
 *
 * Sprint Z-α del plan documentado en
 * `knowledge/strategic_thinking/litienguard_av_inteligencia_multivariable.md`.
 *
 * Cada cruce conecta ≥2 diagnósticos del cerebro existente (DISEASES en
 * knowledge-base.ts) y produce una recomendación de manejo anclada a
 * una guía internacional publicada. SIN guía → fuera.
 *
 * Mapeo a FHIR: los `snomedCodes` permiten alinearse a Condition.code
 * cuando habilitemos SMART on FHIR (Camino A — Q4 2026).
 *
 * Filosofía:
 *   - El médico mantiene el diagnóstico. El sistema solo orquesta lo
 *     ya confirmado.
 *   - "Detección" = match de dx confirmados, NO diagnóstico automático.
 *   - Cada cruce es trazable: source = cita verbatim.
 *
 * NO inventar cruces sin guía. Si un patrón clínico es real pero no hay
 * cita publicada, se documenta como pendiente en el doc estratégico.
 */

import type { DiseaseId } from "./types";
import type { ModuloHospital } from "../modulos-eventos";

export type SeveridadCruce = "critica" | "importante" | "informativa";

/**
 * Estructura lógica de las condiciones que disparan el cruce.
 *
 * `diseaseIds` es un array de arrays. Lógica:
 *   AND entre arrays externos × OR entre IDs dentro de cada array.
 *
 * Ejemplo: [["dm2-typical", "prediabetes"], ["hfref", "hfpef-idiopathic"]]
 *   significa: (dm2-typical OR prediabetes) AND (hfref OR hfpef-idiopathic)
 *
 * `contextoRequerido` permite expresar findings adicionales (TFG, embarazo,
 * edad, etc.) que no son DiseaseIds pero refinan el match. Todos los
 * findings adicionales son AND con el bloque de diseaseIds.
 */
export interface CruceClinico {
  /** ID interno único — kebab-case */
  id: string;

  /** Nombre clínico legible */
  nombre: string;

  /** Descripción corta de la situación clínica */
  descripcion: string;

  /**
   * Combinación de diagnósticos requerida.
   * Array externo = AND, array interno = OR.
   * Ver doc de la interfaz para sintaxis.
   */
  diseaseIds: DiseaseId[][];

  /**
   * Filtros adicionales opcionales. Findings clínicos free-text se
   * matchean por substring case-insensitive sobre notas/datos del
   * paciente. Edad y embarazo se evalúan contra el padrón.
   */
  contextoRequerido?: {
    embarazo?: boolean;
    edadMin?: number;
    edadMax?: number;
    /** Findings clínicos como string libre — match substring */
    findingsAny?: string[];
  };

  /** SNOMED CT codes para mapeo FHIR Condition.code futuro */
  snomedCodes: string[];

  /** Recomendación clínica principal — qué hacer */
  recomendacion: string;

  /** Severidad — afecta cómo se renderiza la alerta */
  severidad: SeveridadCruce;

  /** Workflows donde aplica. "todos" si es transversal */
  workflowsAplicables: ModuloHospital[] | "todos";

  /** Cita verbatim de la guía — OBLIGATORIO */
  source: string;

  /** Fármacos relacionados (opcional) */
  farmacos?: {
    obligatorios?: string[];
    contraindicados?: string[];
  };
}

// ===================================================================
// Los 20 cruces — agrupados por dominio
// ===================================================================

export const CRUCES_CLINICOS: CruceClinico[] = [
  // -------------------------------------------------------------
  // Cardio + Endocrino + Renal (5)
  // -------------------------------------------------------------
  {
    id: "dm-ic-sglt2",
    nombre: "DM + Insuficiencia Cardíaca → SGLT2 obligatorio",
    descripcion:
      "Paciente con diabetes tipo 2 o prediabetes que tiene insuficiencia cardíaca de cualquier fenotipo. SGLT2 mejora pronóstico independiente del control glucémico.",
    diseaseIds: [
      ["dm2-typical", "prediabetes"],
      ["hfref", "hfpef-idiopathic", "hfmref", "adhf-acute"],
    ],
    snomedCodes: ["44054006", "84114007"],
    recomendacion:
      "Iniciar dapagliflozina 10 mg/día o empagliflozina 10 mg/día. Verificar TFG > 25 antes de iniciar.",
    severidad: "importante",
    workflowsAplicables: "todos",
    source:
      "AHA/ACC/HFSA 2022 Guideline for the Management of Heart Failure — Class I recommendation; ADA Standards of Care 2024 §10 Cardiovascular Disease and Risk Management",
    farmacos: { obligatorios: ["dapagliflozina", "empagliflozina"] },
  },
  {
    id: "dm-erc-fármacos",
    nombre: "DM + Enfermedad Renal Crónica → ajuste de fármacos",
    descripcion:
      "Paciente con DM2 y deterioro de función renal. Varios antidiabéticos requieren ajuste o están contraindicados según TFG.",
    diseaseIds: [["dm2-typical"]],
    contextoRequerido: {
      findingsAny: ["TFG < 60", "ERC", "creatinina elevada", "albuminuria"],
    },
    snomedCodes: ["44054006", "709044004"],
    recomendacion:
      "TFG < 30: contraindica metformina. TFG 30-45: máxima 1 g/día. SGLT2 con ajustes. Si albuminuria persistente: considerar finerenona 10-20 mg/día.",
    severidad: "critica",
    workflowsAplicables: "todos",
    source:
      "KDIGO 2022 Clinical Practice Guideline for Diabetes Management in Chronic Kidney Disease",
    farmacos: { contraindicados: ["metformina (si TFG<30)"] },
  },
  {
    id: "sindrome-cardiorenal-tipo1",
    nombre: "Síndrome cardiorenal tipo 1 — IC aguda + AKI",
    descripcion:
      "Paciente con descompensación aguda de IC que desarrolla lesión renal aguda. Manejo de diuréticos requiere especial cuidado para no agravar.",
    diseaseIds: [["adhf-acute"]],
    contextoRequerido: {
      findingsAny: ["AKI", "creatinina ascendiendo", "lesión renal aguda"],
    },
    snomedCodes: ["84114007", "14669001"],
    recomendacion:
      "Diuréticos IV (no orales), titulación lenta. Vigilar K sérico. Evitar AINEs y contraste yodado si no es esencial. Considerar ultrafiltración si refractario.",
    severidad: "critica",
    workflowsAplicables: ["urgencias", "uci"],
    source:
      "KDIGO 2022 CKD Guideline §3.2 + AHA/HFSA 2022 HF Guideline §7.6 (cardiorenal)",
  },
  {
    id: "stemi-dm-sglt2-postiam",
    nombre: "STEMI + DM → SGLT2 post-infarto",
    descripcion:
      "Paciente con infarto STEMI y DM2 conocida. SGLT2 mejora outcomes cardiovasculares cuando se inicia precozmente post-IAM.",
    diseaseIds: [["ischemic-cm"], ["dm2-typical"]],
    contextoRequerido: { findingsAny: ["STEMI", "IAM agudo"] },
    snomedCodes: ["401303003", "44054006"],
    recomendacion:
      "Considerar iniciar empagliflozina o dapagliflozina dentro de los 14 días post-IAM, independientemente de la FEVI.",
    severidad: "importante",
    workflowsAplicables: ["urgencias", "uci", "cardiologia"],
    source:
      "ESC 2023 STEMI Guidelines · Class IIa; DAPA-MI 2024 + EMPULSE 2022 trials",
    farmacos: { obligatorios: ["empagliflozina", "dapagliflozina"] },
  },
  {
    id: "hta-embarazo-preeclampsia",
    nombre: "Hipertensión + Embarazo → preeclampsia screen y manejo",
    descripcion:
      "Paciente embarazada con HTA. Necesita screening específico de preeclampsia y selección cuidadosa de antihipertensivos seguros en gestación.",
    diseaseIds: [["hypertensive-hd"]],
    contextoRequerido: { embarazo: true },
    snomedCodes: ["38341003", "77386006"],
    recomendacion:
      "Preferir metildopa, labetalol o nifedipino. EVITAR IECA y ARA-II (teratógenos). Screening: proteinuria 24h, plaquetas, transaminasas, ácido úrico. Aspirina 100 mg/día si riesgo alto.",
    severidad: "critica",
    workflowsAplicables: "todos",
    source:
      "ACOG Practice Bulletin 222 (2020 update); ISSHP 2021 Classification, Diagnosis and Management of Hypertensive Disorders of Pregnancy",
    farmacos: {
      obligatorios: ["metildopa", "labetalol", "nifedipino"],
      contraindicados: ["IECA (enalapril, lisinopril)", "ARA-II (losartán)"],
    },
  },

  // -------------------------------------------------------------
  // Cardio + Onco (3)
  // -------------------------------------------------------------
  {
    id: "mama-her2-cardiotox",
    nombre: "Cáncer mama HER2+ + antraciclinas o trastuzumab → cardiotox",
    descripcion:
      "Paciente con cáncer de mama HER2+ recibiendo regímenes con antraciclinas o trastuzumab. Riesgo significativo de cardiotoxicidad.",
    diseaseIds: [["breast-cancer"]],
    contextoRequerido: {
      findingsAny: ["HER2+", "antraciclinas", "trastuzumab", "doxorubicina"],
    },
    snomedCodes: ["254837009", "24927001"],
    recomendacion:
      "Ecocardiograma baseline antes de tx. Cada 3 meses durante terapia. Anual post-tx. Suspender o ajustar si ΔFEVI > 10 puntos o FEVI < 50%.",
    severidad: "importante",
    workflowsAplicables: ["oncologia", "cardiologia"],
    source:
      "ESC 2022 Guidelines on Cardio-Oncology · §4 Anthracyclines and HER2 therapy; ASCO 2017 Practice Guideline Prevention of Cardiac Dysfunction",
  },
  {
    id: "inmunoterapia-endocrinopatia",
    nombre: "Inmunoterapia (PD-1/PD-L1) → endocrinopatía inmunomediada",
    descripcion:
      "Paciente recibiendo inhibidores de checkpoint inmunológico. Las endocrinopatías irAE (tiroiditis, hipofisitis, suprarrenal) son frecuentes y a veces fatales.",
    diseaseIds: [
      [
        "breast-cancer",
        "cervical-cancer",
        "ovarian-cancer",
        "endometrial-cancer",
      ],
    ],
    contextoRequerido: {
      findingsAny: [
        "pembrolizumab",
        "nivolumab",
        "atezolizumab",
        "ipilimumab",
        "checkpoint",
      ],
    },
    snomedCodes: ["363346000", "237623005"],
    recomendacion:
      "Screening antes de cada ciclo: TSH, T4L, cortisol AM, glucosa. Si síntomas inespecíficos (fatiga, hipotensión, cefalea), considerar hipofisitis y solicitar resonancia hipofisaria.",
    severidad: "importante",
    workflowsAplicables: ["oncologia", "endocrinologia"],
    source:
      "ESMO Immuno-Oncology Clinical Practice Guidelines 2024; NCCN Management of Immunotherapy-Related Toxicities v1.2024",
  },
  {
    id: "linfoma-rt-mediastino",
    nombre: "Linfoma + Radioterapia mediastinal → cardiotox tardía",
    descripcion:
      "Paciente con antecedente de radioterapia mediastinal por linfoma (especialmente Hodgkin). Riesgo de valvulopatía, EAC y miocardiopatía restrictiva tardías (10-30 años post).",
    diseaseIds: [],
    contextoRequerido: {
      findingsAny: [
        "linfoma Hodgkin",
        "radioterapia mediastino",
        "RT mediastinal previa",
      ],
    },
    snomedCodes: ["118600007", "108290001"],
    recomendacion:
      "Ecocardiograma bianual durante 20+ años post-RT. Cribado de coronariopatía a los 10 años. Valoración valvular específica.",
    severidad: "informativa",
    workflowsAplicables: ["oncologia", "cardiologia"],
    source:
      "ESC 2022 Cardio-Oncology Guidelines · §7 Late effects of cancer therapy",
  },

  // -------------------------------------------------------------
  // Cardio + Neuro (3)
  // -------------------------------------------------------------
  {
    id: "evc-fa-anticoagulacion",
    nombre: "EVC isquémico + Fibrilación Auricular → anticoagulación",
    descripcion:
      "Paciente con EVC isquémico agudo o reciente que tiene fibrilación auricular conocida o detectada en monitoreo. La anticoagulación reduce el riesgo de recurrencia significativamente.",
    diseaseIds: [["ischemic-stroke-acute"]],
    contextoRequerido: {
      findingsAny: ["fibrilación auricular", "FA", "AF"],
    },
    snomedCodes: ["422504002", "49436004"],
    recomendacion:
      "Calcular CHA₂DS₂-VASc y HAS-BLED. Iniciar DOAC (apixaban, rivaroxaban, edoxaban) salvo válvula mecánica o EM severa (donde se prefiere warfarina). Timing según tamaño del infarto.",
    severidad: "critica",
    workflowsAplicables: ["urgencias", "uci", "neurologia", "cardiologia"],
    source:
      "AHA/ASA 2021 Guideline for Prevention of Stroke in Patients with Stroke and TIA; 2023 ACC/AHA/ACCP/HRS Guideline for AF — Class I",
    farmacos: { obligatorios: ["apixaban", "rivaroxaban", "edoxaban"] },
  },
  {
    id: "evc-htacrisis-cauteloso",
    nombre: "EVC isquémico agudo + Crisis hipertensiva → no bajar PA agresivamente",
    descripcion:
      "Paciente con EVC isquémico agudo que también presenta crisis hipertensiva. Bajar la PA agresivamente disminuye la perfusión de la penumbra y empeora outcomes.",
    diseaseIds: [["ischemic-stroke-acute"], ["hypertensive-hd"]],
    snomedCodes: ["422504002", "38341003"],
    recomendacion:
      "NO bajar PA agresivamente. Si candidato a tPA: bajar a < 185/110 antes y < 180/105 las primeras 24h. Si NO candidato: permitir hasta 220/120. Reducción máxima del 15% en 24h.",
    severidad: "critica",
    workflowsAplicables: ["urgencias", "uci", "neurologia"],
    source:
      "AHA/ASA 2019 Guidelines for Early Management of Acute Ischemic Stroke · Class I Level B-NR",
  },
  {
    id: "migrana-aura-riesgo-evc",
    nombre: "Migraña con aura + Factores de RV → riesgo EVC aumentado",
    descripcion:
      "Paciente con migraña con aura que además tiene factores de riesgo vascular (tabaquismo, ACO con estrógeno, edad > 35). Riesgo de EVC isquémico 2-3× elevado.",
    diseaseIds: [["migraine-aura"]],
    contextoRequerido: {
      edadMin: 35,
      findingsAny: ["tabaquismo", "anticonceptivos orales", "estrogen"],
    },
    snomedCodes: ["4473006", "230690007"],
    recomendacion:
      "NO usar anticonceptivos con estrógeno (contraindicación absoluta). Cesación tabáquica. Considerar profilaxis migrañosa (topiramato, propranolol) si frecuente.",
    severidad: "importante",
    workflowsAplicables: ["neurologia"],
    source:
      "AHA/ASA 2021 Primary Prevention of Stroke · Class I para evitar estrogen-containing OCP en mujeres con migraña con aura",
    farmacos: {
      contraindicados: [
        "anticonceptivos orales combinados con estrógeno",
      ],
    },
  },

  // -------------------------------------------------------------
  // Endo + Neuro + Onco (3)
  // -------------------------------------------------------------
  {
    id: "epilepsia-embarazo-aed",
    nombre: "Epilepsia + Embarazo → ajuste de anticonvulsivantes",
    descripcion:
      "Paciente con epilepsia que está embarazada o en edad fértil sin anticoncepción adecuada. Valproato y carbamazepina son teratógenos significativos.",
    diseaseIds: [["epilepsy"]],
    contextoRequerido: { embarazo: true },
    snomedCodes: ["84757009", "77386006"],
    recomendacion:
      "EVITAR valproato y carbamazepina. Preferir levetiracetam o lamotrigina en monoterapia a la dosis efectiva más baja. Ácido fólico 4-5 mg/día periconcepcional y primer trimestre. Niveles séricos trimestrales.",
    severidad: "critica",
    workflowsAplicables: "todos",
    source:
      "AAN/AES Practice Parameter 2009 (reaffirmed 2022) · Management Issues for Women with Epilepsy; NICE NG217 Epilepsies in Pregnancy 2022",
    farmacos: {
      obligatorios: ["levetiracetam", "lamotrigina", "ácido fólico 4-5 mg/día"],
      contraindicados: ["valproato", "carbamazepina"],
    },
  },
  {
    id: "cushing-screening-comorbid",
    nombre: "Cushing endógeno → screening DM + HTA + osteoporosis",
    descripcion:
      "Paciente con diagnóstico confirmado de Cushing endógeno. El hipercortisolismo causa DM2 secundaria, HTA y osteoporosis en > 60% de los casos.",
    diseaseIds: [["cushing"]],
    snomedCodes: ["47270006"],
    recomendacion:
      "Al confirmar Cushing, screening obligatorio: HbA1c (DM2 inducida), MAPA 24h (HTA secundaria), densitometría ósea (osteoporosis). Tratar comorbilidades en paralelo al tratamiento etiológico.",
    severidad: "importante",
    workflowsAplicables: ["endocrinologia"],
    source:
      "Endocrine Society Clinical Practice Guideline 2015 — Treatment of Cushing's Syndrome",
  },
  {
    id: "hipotiroidismo-dislipidemia",
    nombre: "Hipotiroidismo + Dislipidemia → tratar tiroides primero",
    descripcion:
      "Paciente con hipotiroidismo y LDL elevado. La dislipidemia frecuentemente se normaliza al corregir el hipotiroidismo, evitando innecesariamente el inicio de estatina.",
    diseaseIds: [["hypothyroidism"]],
    contextoRequerido: {
      findingsAny: ["LDL elevado", "dislipidemia", "colesterol alto"],
    },
    snomedCodes: ["40930008", "55822004"],
    recomendacion:
      "Iniciar levotiroxina y titular hasta TSH normal antes de prescribir estatina. Reevaluar perfil lipídico 8-12 semanas post-TSH normalizada. Solo si LDL persiste alto: iniciar estatina.",
    severidad: "informativa",
    workflowsAplicables: ["endocrinologia"],
    source:
      "ATA Guidelines for Treatment of Hypothyroidism 2014; AACE/ACE Guidelines for Management of Dyslipidemia 2017",
  },

  // -------------------------------------------------------------
  // Infecto + cualquiera (3)
  // -------------------------------------------------------------
  {
    id: "sepsis-dm-glucosa-target",
    nombre: "Sepsis + DM → glucosa target 140-180 mg/dL",
    descripcion:
      "Paciente diabético con sepsis o shock séptico. El control glucémico estricto reduce mortalidad pero la hipoglucemia es deletérea en sepsis.",
    diseaseIds: [["sepsis"], ["dm2-typical"]],
    snomedCodes: ["91302008", "44054006"],
    recomendacion:
      "Insulina IV continua titulada para mantener glucosa 140-180 mg/dL. NO bajar de 110 (hipoglucemia se asocia a mortalidad). Monitorizar capilar cada 1-2h hasta estabilidad.",
    severidad: "critica",
    workflowsAplicables: ["urgencias", "uci"],
    source:
      "Surviving Sepsis Campaign 2021 International Guidelines · weak recommendation; ADA Standards of Care 2024 §16 Diabetes Care in Hospital",
  },
  {
    id: "cancer-tev-tromboprofilaxis",
    nombre: "Cáncer activo + Khorana ≥ 2 → tromboprofilaxis",
    descripcion:
      "Paciente con cáncer activo en tratamiento ambulatorio con score Khorana de riesgo intermedio-alto. La tromboprofilaxis reduce TEV sin aumento significativo de sangrado.",
    diseaseIds: [
      [
        "breast-cancer",
        "cervical-cancer",
        "ovarian-cancer",
        "endometrial-cancer",
      ],
    ],
    contextoRequerido: {
      findingsAny: ["Khorana ≥ 2", "quimioterapia activa", "alto riesgo TEV"],
    },
    snomedCodes: ["363346000", "128053003"],
    recomendacion:
      "Ambulatorio con Khorana ≥ 2: apixaban 2.5 mg c/12h o rivaroxaban 10 mg/día durante 6 meses. Hospitalizado: HBPM (enoxaparina 40 mg SC/día).",
    severidad: "importante",
    workflowsAplicables: ["oncologia", "quirofano", "uci"],
    source:
      "ASCO 2023 Guideline Update: Venous Thromboembolism Prophylaxis and Treatment in Patients with Cancer; NCCN Cancer-Associated VTE v3.2024",
    farmacos: { obligatorios: ["apixaban", "rivaroxaban", "enoxaparina"] },
  },
  {
    id: "endocarditis-uso-iv",
    nombre: "Endocarditis + Uso de drogas IV → sospechar S. aureus tricúspide",
    descripcion:
      "Paciente con endocarditis y antecedente de uso de drogas IV. Patrón típico: válvula tricúspide + S. aureus, frecuentemente con embolismo pulmonar séptico.",
    diseaseIds: [["endocarditis"]],
    contextoRequerido: {
      findingsAny: [
        "uso drogas IV",
        "drogadicción intravenosa",
        "user drogas inyectables",
      ],
    },
    snomedCodes: ["56819008", "75691007"],
    recomendacion:
      "Sospechar S. aureus + válvula tricúspide. Ecocardiograma transtorácico + transesofágico. Hemocultivos seriados antes de ATB. Evaluar TC tórax por émbolos sépticos. Equipo multidisciplinario (Endocarditis Team).",
    severidad: "importante",
    workflowsAplicables: ["urgencias", "uci", "cardiologia"],
    source:
      "AHA/IDSA Infective Endocarditis Guidelines 2023 Update · §6 Right-sided IE in PWID",
  },

  // -------------------------------------------------------------
  // Otros (3)
  // -------------------------------------------------------------
  {
    id: "epoc-ic-betabloq",
    nombre: "EPOC + IC con FEr → beta-bloqueador cardioselectivo",
    descripcion:
      "Paciente con EPOC e insuficiencia cardíaca con FE reducida. Beta-bloqueador es indicación I para HFrEF pero requiere cardioselectividad para no precipitar broncoespasmo.",
    diseaseIds: [["hfref"]],
    contextoRequerido: { findingsAny: ["EPOC", "enfermedad pulmonar obstructiva"] },
    snomedCodes: ["13645005", "84114007"],
    recomendacion:
      "Preferir bisoprolol, metoprolol succinato o nebivolol (cardioselectivos). Iniciar a dosis baja, titular cada 2 semanas. SABA/LAMA/ICS para EPOC sin restricción. Vigilar broncoespasmo inicial.",
    severidad: "importante",
    workflowsAplicables: ["cardiologia", "uci"],
    source:
      "GOLD 2024 Strategy for the Diagnosis, Management and Prevention of COPD; AHA/ACC/HFSA 2022 Heart Failure Guideline",
    farmacos: {
      obligatorios: ["bisoprolol", "metoprolol succinato", "nebivolol"],
    },
  },
  {
    id: "demencia-hospitaliz-beers",
    nombre: "Demencia + Hospitalización → screening delirium + Beers list",
    descripcion:
      "Paciente con demencia hospitalizado por cualquier causa. Alto riesgo de delirium superpuesto a demencia (DSD), peor pronóstico. Beers list identifica fármacos a evitar.",
    diseaseIds: [["alzheimer-dementia", "vascular-dementia"]],
    contextoRequerido: {
      findingsAny: ["hospitalización", "urgencias", "UCI"],
    },
    snomedCodes: ["52448006", "2873000"],
    recomendacion:
      "Screening con CAM-ICU cada 8h. EVITAR Beers list: difenhidramina, lorazepam, benzodiacepinas, opioides altos, anticolinérgicos. Si sedación necesaria: dexmedetomidina > benzo.",
    severidad: "importante",
    workflowsAplicables: ["urgencias", "uci"],
    source:
      "AGS Beers Criteria 2023 Update for Potentially Inappropriate Medication Use in Older Adults; SCCM ICU Liberation Bundle (A-F)",
    farmacos: {
      contraindicados: [
        "difenhidramina",
        "lorazepam",
        "benzodiacepinas",
        "anticolinérgicos",
      ],
    },
  },
  {
    id: "erc-anemia-epo-fe",
    nombre: "ERC + Anemia → corrección con hierro y EPO",
    descripcion:
      "Paciente con ERC y anemia. Tratamiento secuencial: optimizar hierro primero, después agentes estimulantes de eritropoyesis si persiste.",
    diseaseIds: [],
    contextoRequerido: {
      findingsAny: [
        "TFG < 60",
        "ERC estadio 3",
        "ERC estadio 4",
        "Hb < 11",
        "anemia",
      ],
    },
    snomedCodes: ["709044004", "271737000"],
    recomendacion:
      "Corregir hierro primero (ferritina objetivo > 100 ng/mL, TSAT > 20%). Si Hb persiste < 10 con hierro adecuado: epoetina alfa o darbepoetina. Objetivo Hb 10-11.5 g/dL — NO normalizar (riesgo CV).",
    severidad: "informativa",
    workflowsAplicables: "todos",
    source:
      "KDIGO Clinical Practice Guideline for Anemia in Chronic Kidney Disease 2012; KDOQI US Commentary 2013",
  },
];

// ===================================================================
// Helpers de inspección (no son el detector — eso va en Sprint β)
// ===================================================================

/** Cantidad total de cruces curados */
export const CRUCES_COUNT = CRUCES_CLINICOS.length;

/** Cruces por severidad — útil para KPIs del hub */
export function crucesBySeverity(): Record<SeveridadCruce, number> {
  return CRUCES_CLINICOS.reduce(
    (acc, c) => {
      acc[c.severidad] = (acc[c.severidad] ?? 0) + 1;
      return acc;
    },
    { critica: 0, importante: 0, informativa: 0 } as Record<
      SeveridadCruce,
      number
    >,
  );
}

/** Lookup directo por id (estable, sin allocations) */
const CRUCES_BY_ID = new Map(CRUCES_CLINICOS.map((c) => [c.id, c]));
export function getCruceById(id: string): CruceClinico | null {
  return CRUCES_BY_ID.get(id) ?? null;
}
