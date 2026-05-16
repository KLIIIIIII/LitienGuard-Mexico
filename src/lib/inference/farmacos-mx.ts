/**
 * Fármacos del Cuadro Básico IMSS + CAUSES — capa de fármacos MX.
 *
 * Diferenciador único del cerebro vs. asistentes diagnósticos
 * internacionales: cuando el cerebro sugiere un manejo, lo aterriza
 * al catálogo nacional accesible al médico mexicano (público y
 * privado). Si un fármaco NO está en Cuadro Básico IMSS, lo marca
 * como "consulta seguro privado" — evita recomendar manejo que el
 * paciente no podrá costear o el médico institucional no podrá
 * prescribir.
 *
 * Fuentes:
 *   - Cuadro Básico de Medicamentos del Sector Salud (CSG/CCNPMIS)
 *     edición 2024
 *   - CAUSES 2024 (sucesor INSABI/Seguro Popular)
 *   - GPC IMSS por enfermedad
 *   - COFEPRIS Lista de Medicamentos Genéricos Intercambiables
 *
 * Cobertura inicial: fármacos clave para los dominios del catálogo
 * bayesiano (cardio, endocrino/DM, neuro, gineco-onco, infecto).
 */

import type { DiseaseId } from "./types";

export interface FarmacoMx {
  /** Nombre genérico — denominación común internacional (DCI) */
  nombreGenerico: string;
  /** Presentaciones IMSS típicas (códigos / formas farmacéuticas) */
  presentacionIMSS: string;
  /** Indicaciones principales — referencias al catálogo del motor */
  indicaciones: string[];
  /** ¿Está en Cuadro Básico institucional? */
  cuadroBasico: boolean;
  /** ¿Está cubierto en CAUSES (sector primer nivel)? */
  causes: boolean;
  /** Alertas críticas — interacciones, contraindicaciones, dosis */
  alertas?: string[];
  /** Grupo farmacológico para clasificación visual */
  grupo: string;
  /** Fuente verbatim de la indicación */
  source: string;
}

export const FARMACOS_MX: FarmacoMx[] = [
  // ============================================================
  // Diabetes / Endocrino
  // ============================================================
  {
    nombreGenerico: "Metformina",
    presentacionIMSS: "Tabletas 500 mg y 850 mg · 010.000.4148 / 4149",
    indicaciones: ["dm2-typical", "prediabetes"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Contraindicada si TFG < 30 mL/min/1.73m²",
      "Suspender 48h antes de contraste yodado",
      "Riesgo de acidosis láctica con sepsis o IC severa",
    ],
    grupo: "Hipoglucemiante oral (biguanida)",
    source: "GPC IMSS-718 DM2 · primera línea ADA 2024",
  },
  {
    nombreGenerico: "Glibenclamida",
    presentacionIMSS: "Tabletas 5 mg · 010.000.1042",
    indicaciones: ["dm2-typical"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Riesgo de hipoglucemia prolongada en adulto mayor",
      "Evitar si TFG < 50 mL/min — preferir gliclazida o linagliptina",
      "Aumento de peso característico",
    ],
    grupo: "Hipoglucemiante oral (sulfonilurea)",
    source: "GPC IMSS-718 · segunda línea cuando metformina insuficiente",
  },
  {
    nombreGenerico: "Insulina humana NPH",
    presentacionIMSS: "Frasco ámpula 100 UI/mL · 010.000.1024",
    indicaciones: ["dm2-typical", "lada", "dka", "dm-gestational"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Refrigeración 2-8°C — no congelar",
      "Vigilar hipoglucemia nocturna",
      "Inicio 1-2h, pico 4-12h, duración 12-18h",
    ],
    grupo: "Insulina intermedia",
    source: "GPC IMSS-718 · esquema basal-bolus",
  },
  {
    nombreGenerico: "Insulina rápida (regular)",
    presentacionIMSS: "Frasco ámpula 100 UI/mL · 010.000.1051",
    indicaciones: ["dka", "dm2-typical", "lada"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Para DKA: infusión IV 0.1 UI/kg/h",
      "Vigilar K sérico — bajar lento",
      "Acción 30 min-1h, duración 4-6h",
    ],
    grupo: "Insulina rápida",
    source: "ADA-EASD DKA Consensus 2023",
  },
  {
    nombreGenerico: "Empagliflozina",
    presentacionIMSS: "Tabletas 10 mg y 25 mg · NO en Cuadro Básico",
    indicaciones: ["dm2-typical", "hfref", "hfmref"],
    cuadroBasico: false,
    causes: false,
    alertas: [
      "NO en Cuadro Básico IMSS — paciente paga, ~$1,800 MXN/mes",
      "Suspender si TFG < 20 mL/min",
      "Riesgo infección genitourinaria y cetoacidosis euglucémica",
    ],
    grupo: "ISGLT2",
    source: "ESC HF 2023 · pilar tratamiento HFrEF · DAPA-HF / EMPEROR",
  },
  {
    nombreGenerico: "Levotiroxina sódica",
    presentacionIMSS: "Tabletas 100 mcg · 010.000.4068",
    indicaciones: ["hypothyroidism"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Tomar en ayuno 30-60 min antes de alimentos",
      "Ajustar dosis cada 6-8 semanas por TSH",
      "Interacción con calcio, hierro, IBPs",
    ],
    grupo: "Hormona tiroidea",
    source: "ATA Hypothyroidism Guidelines 2014 · Garber",
  },

  // ============================================================
  // Cardiovascular — HAS, IC, isquémica
  // ============================================================
  {
    nombreGenerico: "Enalapril",
    presentacionIMSS: "Tabletas 10 mg y 20 mg · 010.000.2501 / 2502",
    indicaciones: ["hfref", "hypertensive-hd", "ischemic-cm"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Vigilar K sérico y creatinina",
      "Suspender si embarazo (teratogénico)",
      "Tos seca en 10-15% de pacientes — cambiar a ARA-II",
    ],
    grupo: "IECA",
    source: "ESC HF 2023 / ESC HTA 2023 — primera línea HFrEF y HAS",
  },
  {
    nombreGenerico: "Losartán",
    presentacionIMSS: "Tabletas 50 mg · 010.000.5104",
    indicaciones: ["hfref", "hypertensive-hd"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Alternativa a IECA si tos",
      "Vigilar K y creatinina",
      "Contraindicado en embarazo",
    ],
    grupo: "ARA-II",
    source: "ESC HTA 2023 · primera línea HAS",
  },
  {
    nombreGenerico: "Amlodipino",
    presentacionIMSS: "Tabletas 5 mg y 10 mg · 010.000.2520 / 2521",
    indicaciones: ["hypertensive-hd", "ischemic-cm"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Edema maleolar 10-20%",
      "Evitar combinar con bloqueadores beta sin razón clara",
      "Ajustar dosis en cirrosis",
    ],
    grupo: "Calcioantagonista dihidropiridínico",
    source: "ESC HTA 2023 · combinación clase A + C primera línea",
  },
  {
    nombreGenerico: "Hidroclorotiazida",
    presentacionIMSS: "Tabletas 25 mg · 010.000.2300",
    indicaciones: ["hypertensive-hd"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Vigilar K, Na y ácido úrico",
      "Menos eficaz si TFG < 30 — cambiar a furosemida",
      "Foto-sensibilidad ocasional",
    ],
    grupo: "Diurético tiazídico",
    source: "ESC HTA 2023 · tercera línea o combinación",
  },
  {
    nombreGenerico: "Furosemida",
    presentacionIMSS: "Tabletas 40 mg, ámpulas 20 mg · 010.000.2307 / 2308",
    indicaciones: ["adhf-acute", "hfref", "hfmref"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Vigilar K, Na, función renal",
      "Dosis IV típica 40-80 mg cada 6-12h en ADHF",
      "Ototoxicidad con dosis altas IV rápidas",
    ],
    grupo: "Diurético de asa",
    source: "AHA HFA 2017 / ESC HF 2023 · congestión aguda",
  },
  {
    nombreGenerico: "Espironolactona",
    presentacionIMSS: "Tabletas 25 mg · 010.000.2309",
    indicaciones: ["hfref", "hypertensive-hd"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Vigilar K — riesgo hiperkalemia",
      "Ginecomastia y mastalgia (5-10%)",
      "Reducir dosis si TFG < 30",
    ],
    grupo: "Antagonista mineralocorticoide",
    source: "ESC HF 2023 · pilar HFrEF · RALES / EMPHASIS-HF",
  },
  {
    nombreGenerico: "Bisoprolol",
    presentacionIMSS: "Tabletas 5 mg · 010.000.2147",
    indicaciones: ["hfref", "ischemic-cm", "hypertensive-hd"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Iniciar dosis baja y titular cada 2 semanas",
      "Evitar en descompensación aguda",
      "Vigilar FC y PA",
    ],
    grupo: "Betabloqueador cardioselectivo",
    source: "ESC HF 2023 · pilar HFrEF · CIBIS-II",
  },
  {
    nombreGenerico: "Atorvastatina",
    presentacionIMSS: "Tabletas 20 mg y 40 mg · 010.000.2552 / 2553",
    indicaciones: ["ischemic-cm", "ischemic-stroke-acute", "dm2-typical"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Vigilar transaminasas y CK si síntomas musculares",
      "Interacción con macrólidos y antifúngicos azoles",
      "Embarazo categoría X",
    ],
    grupo: "Estatina alta intensidad",
    source: "ACC/AHA Lipid Guidelines 2018 · ASCVD",
  },
  {
    nombreGenerico: "Ácido acetilsalicílico",
    presentacionIMSS: "Tabletas 100 mg · 010.000.2105",
    indicaciones: ["ischemic-cm", "ischemic-stroke-acute"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Antiagregación 75-100 mg/día prevención secundaria",
      "Vigilar sangrado GI",
      "NO en HIP aguda",
    ],
    grupo: "Antiagregante plaquetario",
    source: "ESC ACS 2023 / AHA AIS 2024",
  },

  // ============================================================
  // Neuro — epilepsia, cefalea, ictus
  // ============================================================
  {
    nombreGenerico: "Levetiracetam",
    presentacionIMSS: "Tabletas 500 mg, ámpulas 100 mg/mL · 010.000.5489",
    indicaciones: ["epilepsy"],
    cuadroBasico: true,
    causes: false,
    alertas: [
      "Ajustar dosis si TFG < 60",
      "Cambios conductuales (irritabilidad) en 10-15%",
      "No requiere niveles séricos",
    ],
    grupo: "Antiepiléptico de amplio espectro",
    source: "ILAE 2017 · primera línea crisis focal y generalizada",
  },
  {
    nombreGenerico: "Ácido valproico",
    presentacionIMSS: "Tabletas 200 mg · 010.000.2611",
    indicaciones: ["epilepsy"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Hepatotoxicidad — vigilar transaminasas",
      "Teratogénico — evitar en mujer fértil sin anticoncepción",
      "Pancreatitis, trombocitopenia",
    ],
    grupo: "Antiepiléptico",
    source: "ILAE 2017 · primera línea crisis generalizadas",
  },
  {
    nombreGenerico: "Paracetamol",
    presentacionIMSS: "Tabletas 500 mg · 010.000.0104",
    indicaciones: ["tension-headache", "migraine-without-aura"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Dosis máxima 3-4 g/día — hepatotoxicidad",
      "Cuidado en hepatopatía",
    ],
    grupo: "Analgésico simple",
    source: "ICHD-3 2018 · primera línea cefalea no severa",
  },
  {
    nombreGenerico: "Ibuprofeno",
    presentacionIMSS: "Tabletas 400 mg · 010.000.0105",
    indicaciones: ["tension-headache", "migraine-without-aura"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Gastropatía — usar con omeprazol si crónico",
      "Nefrotoxicidad si TFG < 60",
      "Evitar combinar con anticoagulantes",
    ],
    grupo: "AINE",
    source: "ICHD-3 2018 / GPC IMSS cefalea primaria",
  },
  {
    nombreGenerico: "Donepezilo",
    presentacionIMSS: "Tabletas 5 mg y 10 mg · 010.000.5489 (limitado)",
    indicaciones: ["alzheimer-dementia"],
    cuadroBasico: false,
    causes: false,
    alertas: [
      "NO ampliamente disponible en IMSS — gestionar receta privada",
      "Bradicardia, síncope — precaución con bloqueadores",
      "Náusea, diarrea al iniciar",
    ],
    grupo: "Inhibidor acetilcolinesterasa",
    source: "AAN Dementia 2022 · Alzheimer leve a moderado",
  },

  // ============================================================
  // Infecto
  // ============================================================
  {
    nombreGenerico: "Amoxicilina",
    presentacionIMSS: "Cápsulas 500 mg · 010.000.1903",
    indicaciones: ["cap-pneumonia"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Alergia a betalactámicos — usar macrólido",
      "Diarrea, rash",
      "Dosis 1g cada 8h por 7 días en CAP",
    ],
    grupo: "Penicilina amplio espectro",
    source: "ATS/IDSA CAP 2019 · ambulatorio sin comorbilidad",
  },
  {
    nombreGenerico: "Ceftriaxona",
    presentacionIMSS: "Ámpulas 1 g · 010.000.1937",
    indicaciones: ["sepsis", "cap-pneumonia", "bacterial-meningitis"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Meningitis: 2 g cada 12h IV",
      "Sepsis: 1-2 g cada 24h",
      "Evitar en neonatos con bilirrubina alta",
    ],
    grupo: "Cefalosporina 3ª gen",
    source: "Surviving Sepsis Campaign 2024 · empírico amplio",
  },
  {
    nombreGenerico: "Vancomicina",
    presentacionIMSS: "Ámpulas 500 mg · 010.000.1941",
    indicaciones: ["sepsis", "endocarditis"],
    cuadroBasico: true,
    causes: false,
    alertas: [
      "Niveles plasmáticos — pico 25-40, valle 10-20",
      "Síndrome del hombre rojo si infusión rápida",
      "Nefrotoxicidad si combinada con aminoglucósidos",
    ],
    grupo: "Glucopéptido (anti-MRSA)",
    source: "IDSA MRSA 2011 · cobertura empírica",
  },
  {
    nombreGenerico: "Isoniazida + Rifampicina + Pirazinamida + Etambutol (HRZE)",
    presentacionIMSS: "Tabletas fijas · 010.000.1971 (esquema TAES)",
    indicaciones: ["tuberculosis-active"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Fase intensiva 2 meses · fase mantenimiento 4 meses",
      "Hepatotoxicidad — vigilar AST/ALT mensuales",
      "Coloración rojiza orina (rifampicina) — normal",
      "Etambutol: vigilar agudeza visual",
    ],
    grupo: "Antifímicos primera línea (TAES)",
    source: "WHO TB Guidelines 2024 / GPC IMSS TB",
  },

  // ============================================================
  // Gineco-onco — quimioterapia base, tamoxifeno
  // ============================================================
  {
    nombreGenerico: "Tamoxifeno",
    presentacionIMSS: "Tabletas 20 mg · 010.000.1759",
    indicaciones: ["breast-cancer"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Riesgo de cáncer endometrial 2-3× (vigilancia con US transvaginal)",
      "Riesgo de TEV — evitar inmovilidad prolongada",
      "Hot flashes frecuentes",
    ],
    grupo: "SERM (modulador receptor estrógeno)",
    source: "NCCN Breast Cancer 2024 · cáncer mama RH+",
  },
  {
    nombreGenerico: "Letrozol",
    presentacionIMSS: "Tabletas 2.5 mg · 010.000.5485",
    indicaciones: ["breast-cancer"],
    cuadroBasico: true,
    causes: false,
    alertas: [
      "Solo en mujer postmenopáusica confirmada",
      "Densitometría ósea anual — riesgo osteoporosis",
      "Mialgias, artralgias frecuentes",
    ],
    grupo: "Inhibidor aromatasa",
    source: "NCCN Breast Cancer 2024 · cáncer mama RH+ postmenop",
  },

  // ============================================================
  // SCAD / cardio agudo
  // ============================================================
  {
    nombreGenerico: "Clopidogrel",
    presentacionIMSS: "Tabletas 75 mg · 010.000.5172",
    indicaciones: ["ischemic-cm", "ischemic-stroke-acute"],
    cuadroBasico: true,
    causes: true,
    alertas: [
      "Antiagregación dual con aspirina post-stent",
      "Sangrado — vigilar",
      "Interacción con omeprazol — preferir pantoprazol",
    ],
    grupo: "Antiagregante (P2Y12)",
    source: "ESC ACS 2023 · DAPT post-stent",
  },
];

/**
 * Buscar fármacos indicados para una enfermedad del catálogo.
 * Útil para el panel de manejo del cerebro: dado el dx top-1, sugerir
 * tratamientos del Cuadro Básico IMSS antes de los privados.
 */
export function farmacosParaDiagnostico(diseaseId: string): FarmacoMx[] {
  return FARMACOS_MX.filter((f) =>
    f.indicaciones.includes(diseaseId as DiseaseId),
  );
}

/**
 * Distinguir qué fármacos están en Cuadro Básico institucional y cuáles
 * el médico tendrá que recetar en privado. Útil para gestión de
 * expectativas con el paciente.
 */
export function clasificarPorCobertura(diseaseId: string): {
  cuadroBasico: FarmacoMx[];
  fueraCuadroBasico: FarmacoMx[];
} {
  const list = farmacosParaDiagnostico(diseaseId);
  return {
    cuadroBasico: list.filter((f) => f.cuadroBasico),
    fueraCuadroBasico: list.filter((f) => !f.cuadroBasico),
  };
}
