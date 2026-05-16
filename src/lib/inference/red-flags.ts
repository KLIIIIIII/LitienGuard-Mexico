/**
 * Red flags por síntoma — capa de alertas.
 *
 * Mientras el médico documenta un motivo de consulta o el scribe
 * transcribe una nota, el cerebro escanea por síntomas con red flags
 * conocidos y los muestra al margen. NO es diagnóstico — es alerta de
 * "no te vayas sin descartar X".
 *
 * Diseño:
 *   Cada entry agrupa un síntoma de presentación común con sus banderas
 *   rojas asociadas. Cada bandera tiene una severidad (now/soon/monitor)
 *   y una lista de diagnósticos críticos a descartar (con IDs del
 *   catálogo bayesiano cuando aplique).
 *
 *   Fuentes principales (citas internas, no expuestas en UI pública):
 *     - ACEP Clinical Policies (urgencias)
 *     - AHA / ASA stroke and headache guidelines
 *     - NICE Guidelines síntomas red flags
 *     - GPC IMSS / CENETEC por síntoma específico
 *     - BMJ Best Practice red flag tables
 *     - UpToDate red flag summaries
 */

import type { DiseaseId } from "./types";

export type RedFlagUrgency = "now" | "soon" | "monitor";

export interface RedFlag {
  /** Texto corto del red flag — se muestra en alert sidebar */
  flag: string;
  /** Explicación clínica corta de POR QUÉ es bandera */
  rationale: string;
  /** Qué diagnósticos críticos descartar (referencia al catálogo) */
  ruleOut: Array<{ disease: DiseaseId | string; label: string }>;
  /** Urgencia operacional sugerida */
  urgency: RedFlagUrgency;
  /** Fuente primaria (vive solo en código) */
  source: string;
}

export interface SymptomRedFlags {
  /** Identificador del síntoma — kebab-case */
  id: string;
  /** Nombre del síntoma como lo escribe el médico */
  label: string;
  /** Aliases / sinónimos en español MX para detección */
  aliases: string[];
  flags: RedFlag[];
}

export const SYMPTOM_RED_FLAGS: SymptomRedFlags[] = [
  // =================================================================
  // CEFALEA
  // =================================================================
  {
    id: "cefalea",
    label: "Cefalea",
    aliases: [
      "cefalea",
      "dolor de cabeza",
      "jaqueca",
      "cefalalgia",
      "headache",
    ],
    flags: [
      {
        flag: "Cefalea trueno (máxima intensidad en < 1 minuto)",
        rationale:
          "Inicio explosivo es la señal más específica de hemorragia subaracnoidea aneurismática. Sensibilidad ~75%, especificidad 95%. TC sin contraste en < 6h es 100% sensible.",
        ruleOut: [
          { disease: "sah", label: "Hemorragia subaracnoidea" },
          { disease: "hemorrhagic-stroke", label: "HIP" },
        ],
        urgency: "now",
        source: "AHA aSAH 2023 · Hoh · cefalea centinela",
      },
      {
        flag: "Cefalea + signos meníngeos + fiebre",
        rationale:
          "Tríada clásica de meningitis bacteriana. Mortalidad 10-25% en adulto si retraso en antibiótico > 6h. Punción lumbar idealmente en < 1h.",
        ruleOut: [
          { disease: "bacterial-meningitis", label: "Meningitis bacteriana" },
        ],
        urgency: "now",
        source: "van de Beek · NEJM 2016 · meningitis adulto",
      },
      {
        flag: "Cefalea nueva en > 50 años",
        rationale:
          "Arteritis de células gigantes, masa intracraneal o HSA centinela. Solicitar VSG/PCR, fondo de ojo y considerar imagen.",
        ruleOut: [
          { disease: "sah", label: "Hemorragia subaracnoidea" },
          { disease: "other-cardio", label: "Arteritis temporal" },
        ],
        urgency: "soon",
        source: "ICHD-3 (2018) · cefaleas secundarias > 50 años",
      },
      {
        flag: "Cefalea con déficit neurológico focal",
        rationale:
          "EVC isquémico, HIP, masa o disección. Imagen urgente.",
        ruleOut: [
          { disease: "ischemic-stroke-acute", label: "EVC isquémico" },
          { disease: "hemorrhagic-stroke", label: "HIP" },
        ],
        urgency: "now",
        source: "AHA AIS 2024 · stroke con cefalea",
      },
      {
        flag: "Cefalea + inmunosupresión",
        rationale:
          "Infección oportunista (criptococosis, toxoplasma) o linfoma SNC. Solicitar imagen + punción lumbar.",
        ruleOut: [
          { disease: "bacterial-meningitis", label: "Meningitis / encefalitis" },
        ],
        urgency: "soon",
        source: "IDSA Cryptococcal 2018",
      },
      {
        flag: "Cefalea con cambio de patrón o progresiva",
        rationale:
          "Cefalea que cambia carácter, frecuencia o intensidad en semanas — sospecha lesión ocupante de espacio.",
        ruleOut: [{ disease: "other-cardio", label: "Masa intracraneal" }],
        urgency: "soon",
        source: "BMJ Best Practice · cefalea secundaria",
      },
    ],
  },

  // =================================================================
  // DOLOR TORÁCICO
  // =================================================================
  {
    id: "dolor-toracico",
    label: "Dolor torácico",
    aliases: [
      "dolor de pecho",
      "dolor torácico",
      "dolor toracico",
      "opresión torácica",
      "chest pain",
    ],
    flags: [
      {
        flag: "Dolor opresivo + diaforesis + irradiación brazo izquierdo",
        rationale:
          "Síndrome coronario agudo hasta no descartar. ECG en < 10 min, troponina hs y considerar cateterismo si STEMI.",
        ruleOut: [
          { disease: "ischemic-cm", label: "Cardiopatía isquémica aguda" },
        ],
        urgency: "now",
        source: "ESC ACS 2023 · Byrne",
      },
      {
        flag: "Dolor torácico + síncope o presíncope",
        rationale:
          "Embolia pulmonar masiva, disección aórtica, estenosis aórtica severa.",
        ruleOut: [
          { disease: "severe-as", label: "Estenosis aórtica severa" },
          { disease: "ischemic-cm", label: "Isquemia con choque" },
        ],
        urgency: "now",
        source: "ESC ACS 2023 · síncope perfusión",
      },
      {
        flag: "Dolor torácico + mujer joven sin factores de riesgo",
        rationale:
          "SCAD (disección coronaria espontánea) es 1ª causa de IAM en mujer < 50 años. NO asumir aterosclerosis — coronariografía con OCT.",
        ruleOut: [{ disease: "scad", label: "SCAD" }],
        urgency: "now",
        source: "Hayes · NEJM 2020 · SCAD en mujer joven",
      },
      {
        flag: "Dolor torácico tipo desgarro irradiado a espalda",
        rationale:
          "Disección aórtica. Mortalidad 1-2%/hora sin tratamiento. CT angio aorta urgente.",
        ruleOut: [{ disease: "other-cardio", label: "Disección aórtica" }],
        urgency: "now",
        source: "ESC Aortic 2024",
      },
      {
        flag: "Dolor torácico + disnea súbita + taquicardia",
        rationale:
          "Embolia pulmonar. Wells score + dímero D + AngioTC.",
        ruleOut: [{ disease: "other-cardio", label: "Embolia pulmonar" }],
        urgency: "now",
        source: "ESC Pulmonary Embolism 2019",
      },
    ],
  },

  // =================================================================
  // DISNEA AGUDA
  // =================================================================
  {
    id: "disnea-aguda",
    label: "Disnea aguda",
    aliases: ["disnea", "falta de aire", "ahogo", "dyspnea"],
    flags: [
      {
        flag: "Disnea aguda + crepitantes bilaterales + JVD",
        rationale:
          "IC aguda descompensada. BNP/NT-proBNP, eco urgente, diurético IV.",
        ruleOut: [{ disease: "adhf-acute", label: "IC aguda descompensada" }],
        urgency: "now",
        source: "AHA HFA 2017 · congestión aguda",
      },
      {
        flag: "Disnea súbita + dolor pleurítico",
        rationale: "Embolia pulmonar o neumotórax. AngioTC o rx tórax inmediata.",
        ruleOut: [
          { disease: "other-cardio", label: "Embolia pulmonar" },
          { disease: "cap-pneumonia", label: "Neumotórax" },
        ],
        urgency: "now",
        source: "ESC Pulmonary Embolism 2019",
      },
      {
        flag: "Disnea + saturación < 92% en aire ambiente",
        rationale: "Hipoxemia significativa. Gases arteriales, oxígeno y buscar causa.",
        ruleOut: [
          { disease: "cap-pneumonia", label: "Neumonía severa" },
          { disease: "adhf-acute", label: "Edema agudo de pulmón" },
        ],
        urgency: "now",
        source: "ATS/IDSA CAP 2019 · severidad",
      },
      {
        flag: "Disnea + sibilancias monofónicas + tos crónica fumador",
        rationale: "EPOC exacerbado vs cáncer broncogénico con obstrucción.",
        ruleOut: [{ disease: "other-cardio", label: "EPOC severo / neoplasia" }],
        urgency: "soon",
        source: "GOLD 2024",
      },
    ],
  },

  // =================================================================
  // DOLOR ABDOMINAL AGUDO
  // =================================================================
  {
    id: "dolor-abdominal-agudo",
    label: "Dolor abdominal agudo",
    aliases: [
      "dolor abdominal",
      "dolor de estómago",
      "dolor de panza",
      "abdominal pain",
    ],
    flags: [
      {
        flag: "Dolor abdominal + rebote + rigidez",
        rationale: "Peritonitis. Imagen y cirugía urgente.",
        ruleOut: [{ disease: "sepsis", label: "Peritonitis / sepsis abdominal" }],
        urgency: "now",
        source: "ACEP Acute Abdominal Pain 2024",
      },
      {
        flag: "Dolor abdominal + hipotensión + AAA conocido",
        rationale:
          "Ruptura de aneurisma de aorta abdominal. Mortalidad >80% sin cirugía.",
        ruleOut: [{ disease: "other-cardio", label: "AAA roto" }],
        urgency: "now",
        source: "ESVS AAA 2019",
      },
      {
        flag: "Dolor abdominal + mujer embarazo posible + amenorrea",
        rationale: "Embarazo ectópico — siempre β-hCG + US transvaginal.",
        ruleOut: [{ disease: "other-cardio", label: "Embarazo ectópico" }],
        urgency: "now",
        source: "ACOG Ectopic 2018",
      },
      {
        flag: "Dolor abdominal severo + ictericia + fiebre (Charcot)",
        rationale:
          "Colangitis ascendente. Tríada de Charcot — antibiótico IV + CPRE.",
        ruleOut: [{ disease: "sepsis", label: "Colangitis / sepsis biliar" }],
        urgency: "now",
        source: "Tokyo Guidelines 2018",
      },
    ],
  },

  // =================================================================
  // SANGRADO VAGINAL
  // =================================================================
  {
    id: "sangrado-vaginal",
    label: "Sangrado vaginal anormal",
    aliases: ["sangrado vaginal", "metrorragia", "sangrado intermenstrual"],
    flags: [
      {
        flag: "Sangrado postmenopáusico",
        rationale:
          "Cáncer de endometrio hasta no descartar. US transvaginal + biopsia endometrial.",
        ruleOut: [
          { disease: "endometrial-cancer", label: "Cáncer de endometrio" },
          { disease: "cervical-cancer", label: "Cáncer cervicouterino" },
        ],
        urgency: "soon",
        source: "NCCN Uterine Neoplasms 2024",
      },
      {
        flag: "Sangrado postcoital recurrente",
        rationale: "Cáncer cervicouterino — colposcopía y biopsia.",
        ruleOut: [{ disease: "cervical-cancer", label: "Cáncer cervicouterino" }],
        urgency: "soon",
        source: "NCCN Cervical Cancer 2024",
      },
      {
        flag: "Sangrado abundante + hipotensión",
        rationale:
          "Hemorragia ginecológica con compromiso hemodinámico. Estabilización y transfusión.",
        ruleOut: [{ disease: "other-cardio", label: "Hemorragia activa" }],
        urgency: "now",
        source: "ACOG AUB 2019",
      },
    ],
  },

  // =================================================================
  // FIEBRE EN ADULTO
  // =================================================================
  {
    id: "fiebre-adulto",
    label: "Fiebre en adulto",
    aliases: ["fiebre", "calentura", "hipertermia"],
    flags: [
      {
        flag: "Fiebre + alteración mental + hipotensión",
        rationale:
          "Choque séptico. Cultivos, lactato, antibiótico < 1h, fluidos.",
        ruleOut: [{ disease: "sepsis", label: "Sepsis / choque séptico" }],
        urgency: "now",
        source: "Surviving Sepsis Campaign 2024",
      },
      {
        flag: "Fiebre + soplo nuevo + estigmas embólicos",
        rationale: "Endocarditis infecciosa — Duke-ISCVID, hemocultivos, eco.",
        ruleOut: [{ disease: "endocarditis", label: "Endocarditis infecciosa" }],
        urgency: "now",
        source: "Duke-ISCVID 2023 · Fowler",
      },
      {
        flag: "Fiebre prolongada + sudores nocturnos + pérdida peso",
        rationale:
          "Tuberculosis activa, linfoma, endocarditis subaguda, VIH.",
        ruleOut: [
          { disease: "tuberculosis-active", label: "Tuberculosis activa" },
          { disease: "endocarditis", label: "Endocarditis subaguda" },
        ],
        urgency: "soon",
        source: "WHO TB Report 2024",
      },
      {
        flag: "Fiebre en paciente neutropénico (postquimio)",
        rationale: "Neutropenia febril — emergencia oncológica. Antibiótico < 1h.",
        ruleOut: [{ disease: "sepsis", label: "Sepsis en neutropenia" }],
        urgency: "now",
        source: "IDSA Neutropenic Fever 2018",
      },
    ],
  },

  // =================================================================
  // SÍNCOPE
  // =================================================================
  {
    id: "sincope",
    label: "Síncope",
    aliases: ["síncope", "desmayo", "pérdida transitoria de conciencia"],
    flags: [
      {
        flag: "Síncope con el esfuerzo",
        rationale:
          "Estenosis aórtica severa, HCM, arritmia maligna. Eco urgente.",
        ruleOut: [
          { disease: "severe-as", label: "Estenosis aórtica severa" },
          { disease: "hcm", label: "HCM" },
        ],
        urgency: "soon",
        source: "ESC Syncope 2018",
      },
      {
        flag: "Síncope sin pródromo + historia familiar muerte súbita",
        rationale: "Canalopatía o cardiomiopatía hereditaria.",
        ruleOut: [
          { disease: "arvc", label: "ARVC" },
          { disease: "hcm", label: "HCM" },
        ],
        urgency: "soon",
        source: "ESC Syncope 2018",
      },
      {
        flag: "Síncope con dolor torácico o disnea",
        rationale: "TEP masivo, IAM, disección aórtica.",
        ruleOut: [
          { disease: "ischemic-cm", label: "Isquemia aguda" },
          { disease: "other-cardio", label: "Embolia pulmonar / disección" },
        ],
        urgency: "now",
        source: "ESC Syncope 2018",
      },
    ],
  },

  // =================================================================
  // LUMBALGIA
  // =================================================================
  {
    id: "lumbalgia",
    label: "Lumbalgia",
    aliases: ["dolor lumbar", "lumbalgia", "low back pain"],
    flags: [
      {
        flag: "Lumbalgia + incontinencia urinaria o fecal + anestesia en silla de montar",
        rationale: "Síndrome de cauda equina — RM urgente, descompresión < 48h.",
        ruleOut: [{ disease: "other-cardio", label: "Cauda equina" }],
        urgency: "now",
        source: "NICE Low Back Pain 2020",
      },
      {
        flag: "Lumbalgia + pérdida de peso + cáncer conocido",
        rationale: "Metástasis vertebrales / compresión medular.",
        ruleOut: [
          { disease: "breast-cancer", label: "Metástasis óseas" },
          { disease: "other-cardio", label: "Mieloma" },
        ],
        urgency: "soon",
        source: "NICE Spinal Mets 2008",
      },
      {
        flag: "Lumbalgia + fiebre + IV drug use o inmunosupresión",
        rationale: "Discitis / osteomielitis vertebral / absceso epidural.",
        ruleOut: [{ disease: "sepsis", label: "Espondilodiscitis" }],
        urgency: "now",
        source: "IDSA Native Vertebral Osteomyelitis 2015",
      },
    ],
  },
];

/**
 * Detecta red flags activos en un texto libre (nota SOAP, contexto
 * clínico). Match básico por inclusión de aliases del síntoma.
 *
 * Devuelve lista de síntomas detectados con sus banderas. No filtra
 * por relevancia clínica — esa decisión es del médico.
 */
export function detectRedFlagsInText(text: string): SymptomRedFlags[] {
  const lower = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const matches: SymptomRedFlags[] = [];
  for (const sym of SYMPTOM_RED_FLAGS) {
    const found = sym.aliases.some((alias) =>
      lower.includes(
        alias
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, ""),
      ),
    );
    if (found) matches.push(sym);
  }
  return matches;
}

/**
 * Resumen útil para mostrar en panel: cuenta de red flags por urgencia.
 */
export function summarizeRedFlags(symptoms: SymptomRedFlags[]): {
  now: number;
  soon: number;
  monitor: number;
} {
  let now = 0,
    soon = 0,
    monitor = 0;
  for (const sym of symptoms) {
    for (const f of sym.flags) {
      if (f.urgency === "now") now++;
      else if (f.urgency === "soon") soon++;
      else monitor++;
    }
  }
  return { now, soon, monitor };
}
