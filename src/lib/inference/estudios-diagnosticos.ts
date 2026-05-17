/**
 * K1 — Catálogo de estudios diagnósticos.
 *
 * 60+ estudios curados en 5 categorías: imagenología, laboratorio,
 * endoscopia, fisiológicos/eléctricos, patología y genética.
 *
 * Cada estudio incluye:
 *   - findingsPosibles: refs al FINDINGS catalog del cerebro
 *   - indicacionesPrincipales: refs a DISEASES del cerebro
 *   - disponibilidadIMSS: rutina / limitada / tercer-nivel / privado-solo
 *   - costoPrivadoMxn: rango orientativo para el médico
 *   - tiempoResultado: para planificar work-up
 *   - source: cita interna verbatim (no expuesta en UI público)
 *
 * Las fuentes son guías clínicas internacionales + experiencia clínica
 * mexicana. Los costos privados son orientativos al cierre 2026 — varían
 * por ciudad y proveedor.
 */

import type { DiseaseId, FindingId } from "./types";

export type CategoriaEstudio =
  | "imagenologia"
  | "laboratorio"
  | "endoscopia"
  | "fisiologico"
  | "patologia";

export type DisponibilidadIMSS =
  | "rutina"          // primer nivel + segundo nivel
  | "limitada"        // segundo nivel, con cita
  | "tercer-nivel"    // hospital especializado
  | "privado-solo";   // solo sector privado

export interface EstudioDiagnostico {
  id: string;
  nombre: string;
  categoria: CategoriaEstudio;
  /** Breve descripción clínica de qué hace */
  descripcion: string;
  /** Findings del cerebro que este estudio puede revelar */
  findingsPosibles: FindingId[];
  /** Enfermedades del catálogo para las que este estudio aporta evidencia */
  indicacionesPrincipales: DiseaseId[];
  /** Disponibilidad en sector público */
  disponibilidadIMSS: DisponibilidadIMSS;
  /** Rango orientativo de costo en sector privado */
  costoPrivadoMxn?: { min: number; max: number };
  /** Tiempo aproximado del resultado */
  tiempoResultado: string;
  /** Preparación previa requerida si aplica */
  preparacion?: string;
  /** Cita interna a fuente — NO se renderiza en UI público */
  source: string;
}

export const ESTUDIOS_DIAGNOSTICOS: EstudioDiagnostico[] = [
  // =================================================================
  // 1. IMAGENOLOGÍA (16)
  // =================================================================
  {
    id: "tac-torax-sin-contraste",
    nombre: "TAC de tórax sin contraste",
    categoria: "imagenologia",
    descripcion:
      "Tomografía axial computarizada de tórax sin medio de contraste. Útil para nódulos pulmonares, enfisema, fibrosis, derrame pleural.",
    findingsPosibles: ["lab-chest-infiltrate", "imagen-coronary-dissection"],
    indicacionesPrincipales: ["cap-pneumonia", "tuberculosis-active"],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 2500, max: 5500 },
    tiempoResultado: "Mismo día",
    source: "Fleischner Society Guidelines 2017 · ACR Appropriateness Criteria",
  },
  {
    id: "tac-torax-con-contraste",
    nombre: "TAC de tórax con contraste / Angio-TAC pulmonar",
    categoria: "imagenologia",
    descripcion:
      "TAC con medio de contraste intravenoso. Estándar para embolia pulmonar y caracterización tumoral.",
    findingsPosibles: ["lab-chest-infiltrate"],
    indicacionesPrincipales: ["other-cardio", "cap-pneumonia"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 4500, max: 9000 },
    tiempoResultado: "Mismo día",
    preparacion: "Ayuno 4h, función renal previa",
    source: "ESC Pulmonary Embolism Guidelines 2019",
  },
  {
    id: "tac-abdomen-pelvis",
    nombre: "TAC de abdomen y pelvis",
    categoria: "imagenologia",
    descripcion:
      "TAC abdominal completo. Crucial para dolor abdominal agudo, masas, aneurisma aórtico, apendicitis, oncología.",
    findingsPosibles: ["exam-abdominal-mass-pelvic"],
    indicacionesPrincipales: ["ovarian-cancer", "endometrial-cancer"],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 4000, max: 8500 },
    tiempoResultado: "Mismo día",
    source: "ACR Appropriateness Criteria · Acute Abdomen",
  },
  {
    id: "tac-cerebro-sin-contraste",
    nombre: "TAC de cráneo sin contraste",
    categoria: "imagenologia",
    descripcion:
      "Estudio rápido y disponible 24/7. Primera línea en sospecha de EVC, traumatismo, cefalea grave.",
    findingsPosibles: ["lab-tc-intraparenchymal-blood"],
    indicacionesPrincipales: ["hemorrhagic-stroke", "ischemic-stroke-acute", "sah"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 2000, max: 4500 },
    tiempoResultado: "Mismo día (urgencias)",
    source: "AHA/ASA Stroke Guidelines 2024 · clase IA en código stroke",
  },
  {
    id: "angio-tc-cerebro",
    nombre: "Angio-TAC de cerebro / cuello",
    categoria: "imagenologia",
    descripcion:
      "TAC con contraste vascular. Identifica aneurismas, estenosis carotídea, disecciones, ocludidos en stroke.",
    findingsPosibles: [],
    indicacionesPrincipales: ["sah", "ischemic-stroke-acute"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 5500, max: 12000 },
    tiempoResultado: "Mismo día",
    source: "AHA aSAH 2023 · estándar diagnóstico SAH aneurismática",
  },
  {
    id: "rm-cerebro",
    nombre: "Resonancia magnética de cerebro",
    categoria: "imagenologia",
    descripcion:
      "Mejor sensibilidad para lesiones isquémicas pequeñas, esclerosis múltiple, atrofia hipocampal, tumores.",
    findingsPosibles: [
      "lab-mri-hippocampal-atrophy",
      "lab-mri-white-matter-lesions",
    ],
    indicacionesPrincipales: [
      "alzheimer-dementia",
      "vascular-dementia",
      "multiple-sclerosis",
    ],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 6000, max: 14000 },
    tiempoResultado: "1-3 días",
    source: "NIA-AA 2018 · McDonald Criteria MS 2024 revised",
  },
  {
    id: "rm-cardio",
    nombre: "Resonancia magnética cardíaca (CMR)",
    categoria: "imagenologia",
    descripcion:
      "Gold standard para caracterización de tejido miocárdico, fibrosis (LGE), volúmenes, infiltración amiloide.",
    findingsPosibles: ["lge-subendocardico", "echo-thick-walls"],
    indicacionesPrincipales: [
      "attr-cm",
      "al-amyloid",
      "hcm",
      "cardiac-sarcoid",
      "myocarditis-acute",
    ],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 8000, max: 16000 },
    tiempoResultado: "2-5 días",
    source: "SCMR Position Statement 2020 · CMR en cardiomiopatías",
  },
  {
    id: "rm-lumbar",
    nombre: "Resonancia magnética lumbar",
    categoria: "imagenologia",
    descripcion:
      "Estándar para hernias discales, estenosis del canal, mielopatía. NO indicada en lumbalgia aguda sin red flags.",
    findingsPosibles: ["lumbar_stenosis"],
    indicacionesPrincipales: [],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 5500, max: 11000 },
    tiempoResultado: "1-3 días",
    source: "NICE Low Back Pain 2020 · indicaciones específicas",
  },
  {
    id: "ecocardiograma-transtoracico",
    nombre: "Ecocardiograma transtorácico (ETT)",
    categoria: "imagenologia",
    descripcion:
      "Estudio cardiaco no invasivo más usado. FE, función diastólica, válvulas, masa ventricular, derrame pericárdico.",
    findingsPosibles: [
      "echo-fe-reduced",
      "echo-fe-mid-range",
      "echo-fe-preserved-50",
      "echo-thick-walls",
      "echo-biatrial-enlarge",
      "echo-apical-sparing",
      "echo-as-severe-criteria",
      "echo-mr-severe-criteria",
      "echo-regional-wma-coronary",
    ],
    indicacionesPrincipales: [
      "hfref",
      "hfmref",
      "hfpef-idiopathic",
      "severe-as",
      "ischemic-cm",
      "attr-cm",
      "hcm",
    ],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 1800, max: 4500 },
    tiempoResultado: "Mismo día",
    source: "ASE Recommendations 2019 · estudio cardio inicial estándar",
  },
  {
    id: "eco-estres-dobutamina",
    nombre: "Eco estrés con dobutamina (DSE)",
    categoria: "imagenologia",
    descripcion:
      "Ecocardiografía durante infusión de dobutamina. Crucial para EA severa low-flow low-gradient vs pseudo-severa.",
    findingsPosibles: ["dse_recruta"],
    indicacionesPrincipales: ["severe-as", "ischemic-cm"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 5500, max: 11000 },
    tiempoResultado: "Mismo día",
    source: "ESC/EACTS Valvular 2021 · diagnóstico LFLG",
  },
  {
    id: "us-abdominal",
    nombre: "Ultrasonido abdominal",
    categoria: "imagenologia",
    descripcion:
      "Estudio no invasivo, sin radiación. Hígado, vesícula, riñones, bazo, aorta. Útil en embarazadas y niños.",
    findingsPosibles: ["esteatosis"],
    indicacionesPrincipales: ["masld", "sind_met"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 900, max: 2200 },
    tiempoResultado: "Mismo día",
    source: "ACR Practice Parameters · US abdominal",
  },
  {
    id: "us-transvaginal",
    nombre: "Ultrasonido transvaginal",
    categoria: "imagenologia",
    descripcion:
      "Imagen detallada de útero, ovarios, endometrio. Estándar en sangrado postmenopáusico y sospecha de masa anexial.",
    findingsPosibles: ["lab-endometrial-thickening"],
    indicacionesPrincipales: ["endometrial-cancer", "ovarian-cancer"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 1200, max: 2800 },
    tiempoResultado: "Mismo día",
    source: "ESGO/ESMO/ESP 2024 · diagnóstico cáncer endometrial",
  },
  {
    id: "mastografia",
    nombre: "Mastografía (mamografía)",
    categoria: "imagenologia",
    descripcion:
      "Tamizaje y diagnóstico de cáncer mamario. Reportada en sistema BI-RADS 0-6.",
    findingsPosibles: ["lab-mammo-birads-4-5"],
    indicacionesPrincipales: ["breast-cancer"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 800, max: 2200 },
    tiempoResultado: "1-2 días",
    source: "ACR BI-RADS Atlas 2024 · sistema reporteo estándar",
  },
  {
    id: "gammagrafia-pyp",
    nombre: "Gammagrafía cardíaca con Tc-PYP (pirofosfato)",
    categoria: "imagenologia",
    descripcion:
      "Medicina nuclear no invasiva. Estándar para diagnóstico de ATTR-CM sin necesidad de biopsia endomiocárdica.",
    findingsPosibles: ["lab-pyp-scan-positive"],
    indicacionesPrincipales: ["attr-cm"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 9000, max: 18000 },
    tiempoResultado: "1-3 días",
    source: "Gillmore criteria · Circulation 2016 · perlado grado ≥2 + FLC negativo = ATTR-CM",
  },
  {
    id: "pet-ct-oncologico",
    nombre: "PET-CT oncológico (18F-FDG)",
    categoria: "imagenologia",
    descripcion:
      "Estadificación y seguimiento oncológico. También útil para sarcoidosis cardíaca activa.",
    findingsPosibles: [],
    indicacionesPrincipales: [
      "breast-cancer",
      "ovarian-cancer",
      "endometrial-cancer",
      "cardiac-sarcoid",
    ],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 18000, max: 35000 },
    tiempoResultado: "2-5 días",
    source: "NCCN Imaging Guidelines · staging oncológico",
  },
  {
    id: "densitometria-osea",
    nombre: "Densitometría ósea (DEXA)",
    categoria: "imagenologia",
    descripcion:
      "Mide densidad mineral ósea. T-score < -2.5 = osteoporosis. Indicada en mujer postmenopáusica.",
    findingsPosibles: [],
    indicacionesPrincipales: [],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 1200, max: 2800 },
    tiempoResultado: "1-2 días",
    source: "ISCD Official Positions 2023",
  },
  {
    id: "ct-angio-coronaria",
    nombre: "AngioTAC coronaria (CTCA)",
    categoria: "imagenologia",
    descripcion:
      "Visualiza arterias coronarias. Calcio score y caracterización de placa. Diagnóstico no invasivo de SCAD y aterosclerosis.",
    findingsPosibles: [
      "imagen-coronary-dissection",
      "calcio_alto",
      "echo-regional-wma-coronary",
    ],
    indicacionesPrincipales: ["scad", "ischemic-cm", "severe-as"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 7500, max: 15000 },
    tiempoResultado: "1-3 días",
    source: "ESC Chronic Coronary Syndromes 2024 · CTCA primera línea",
  },

  // =================================================================
  // 2. LABORATORIO Y FLUIDOS (24)
  // =================================================================
  {
    id: "biometria-hematica",
    nombre: "Biometría hemática completa (BH)",
    categoria: "laboratorio",
    descripcion:
      "Eritrocitos, leucocitos con diferencial, plaquetas, Hb, Hto, VCM, HCM. Estudio basal universal.",
    findingsPosibles: ["leucos_anormales", "hb_baja", "vcm_bajo"],
    indicacionesPrincipales: [
      "sepsis",
      "cap-pneumonia",
      "ferropenia_menstrual",
      "ferropenia_gi",
    ],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 150, max: 400 },
    tiempoResultado: "Mismo día",
    source: "Cuadro Básico IMSS · estudio universal de laboratorio",
  },
  {
    id: "quimica-sanguinea",
    nombre: "Química sanguínea (glucosa, BUN, creatinina, electrolitos)",
    categoria: "laboratorio",
    descripcion:
      "Función renal y metabólica basal. Incluye Na, K, Cl, glucemia, urea, creatinina.",
    findingsPosibles: ["lab-hypokalemia"],
    indicacionesPrincipales: [],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 200, max: 600 },
    tiempoResultado: "Mismo día",
    source: "Estudio de rutina pre-quirúrgica y control crónicos",
  },
  {
    id: "perfil-lipidico",
    nombre: "Perfil lipídico",
    categoria: "laboratorio",
    descripcion:
      "Colesterol total, HDL, LDL, triglicéridos, no-HDL. Ayuno 9-12h recomendado.",
    findingsPosibles: ["tg_altos", "hdl_bajo", "ldl_alto"],
    indicacionesPrincipales: ["sind_met", "ischemic-cm"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 250, max: 600 },
    tiempoResultado: "Mismo día",
    preparacion: "Ayuno 9-12h",
    source: "ACC/AHA Lipid Guidelines 2018",
  },
  {
    id: "hba1c",
    nombre: "Hemoglobina glicada (HbA1c)",
    categoria: "laboratorio",
    descripcion:
      "Promedio de glucemia 3 meses. ≥6.5% = DM; 5.7-6.4% = prediabetes. No requiere ayuno.",
    findingsPosibles: ["lab-hba1c-65-plus", "lab-hba1c-prediabetes"],
    indicacionesPrincipales: ["dm2-typical", "prediabetes", "lada"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 250, max: 550 },
    tiempoResultado: "Mismo día",
    source: "ADA Standards of Care 2024",
  },
  {
    id: "glucemia-ayuno",
    nombre: "Glucemia plasmática en ayuno",
    categoria: "laboratorio",
    descripcion:
      "Glucosa en sangre tras ayuno. ≥126 mg/dL = DM; 100-125 = alterada en ayuno.",
    findingsPosibles: ["lab-glucose-fasting-126", "lab-glucose-fasting-100-125"],
    indicacionesPrincipales: ["dm2-typical", "prediabetes", "dka"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 80, max: 200 },
    tiempoResultado: "Mismo día",
    preparacion: "Ayuno 8h",
    source: "ADA Standards of Care 2024",
  },
  {
    id: "curva-tolerancia-glucosa",
    nombre: "Curva de tolerancia a la glucosa (75g)",
    categoria: "laboratorio",
    descripcion:
      "Glucemia basal + 2h post-carga 75g. Diagnóstico de DM gestacional (IADPSG) e intolerancia a glucosa.",
    findingsPosibles: [],
    indicacionesPrincipales: ["dm-gestational", "prediabetes"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 350, max: 800 },
    tiempoResultado: "Mismo día",
    preparacion: "Ayuno 8h, hidratación previa",
    source: "IADPSG / WHO 2013 · cribado gestacional",
  },
  {
    id: "perfil-tiroideo",
    nombre: "Perfil tiroideo (TSH + T4L + T3)",
    categoria: "laboratorio",
    descripcion:
      "TSH es la prueba más sensible. Alterada en hipotiroidismo subclínico, hipertiroidismo y patología hipofisaria.",
    findingsPosibles: ["lab-tsh-elevated", "lab-tsh-suppressed", "tsh_normal"],
    indicacionesPrincipales: ["hypothyroidism", "hyperthyroidism"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 600, max: 1400 },
    tiempoResultado: "1-2 días",
    source: "ATA Hypothyroidism Guidelines 2014 + Hyperthyroidism 2016",
  },
  {
    id: "anti-tpo",
    nombre: "Anticuerpos anti-TPO",
    categoria: "laboratorio",
    descripcion:
      "Marcador de tiroiditis autoinmune (Hashimoto). Predice progresión de hipotiroidismo subclínico.",
    findingsPosibles: ["ac_tpo"],
    indicacionesPrincipales: ["hypothyroidism"],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 450, max: 900 },
    tiempoResultado: "2-3 días",
    source: "ATA 2014 · evaluación etiológica hipotiroidismo",
  },
  {
    id: "nt-probnp",
    nombre: "NT-proBNP",
    categoria: "laboratorio",
    descripcion:
      "Péptido natriurético cardíaco. Eleva en sobrecarga de volumen / presión. Estándar para descartar IC.",
    findingsPosibles: [
      "lab-bnp-elevated",
      "lab-ntprobnp-disproportionate",
      "ntprobnp_alto",
    ],
    indicacionesPrincipales: ["adhf-acute", "hfref", "hfmref", "hfpef-idiopathic"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 600, max: 1400 },
    tiempoResultado: "Mismo día",
    source: "Maisel · NEJM 2002 · evaluación disnea aguda",
  },
  {
    id: "troponina-hs",
    nombre: "Troponina T o I alta sensibilidad (hs)",
    categoria: "laboratorio",
    descripcion:
      "Marcador específico de daño miocárdico. Patrón cinético (subida + descenso) define IAM.",
    findingsPosibles: ["lab-troponin-hs-positive", "lab-troponin-rising"],
    indicacionesPrincipales: ["ischemic-cm", "scad", "myocarditis-acute"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 350, max: 850 },
    tiempoResultado: "Mismo día (urgencias)",
    source: "ESC ACS 2023 · algoritmo 0/1h",
  },
  {
    id: "ego",
    nombre: "Examen general de orina (EGO)",
    categoria: "laboratorio",
    descripcion:
      "Físico + químico + sedimento. Detecta IVU, proteinuria, hematuria, glucosuria.",
    findingsPosibles: [],
    indicacionesPrincipales: ["sepsis"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 80, max: 250 },
    tiempoResultado: "Mismo día",
    source: "Estudio de rutina urológica y nefrológica",
  },
  {
    id: "urocultivo",
    nombre: "Urocultivo con antibiograma",
    categoria: "laboratorio",
    descripcion:
      "Confirmación bacteriológica de IVU + susceptibilidad antibiótica. > 10⁵ UFC/mL es significativo.",
    findingsPosibles: [],
    indicacionesPrincipales: ["sepsis"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 350, max: 800 },
    tiempoResultado: "48-72 horas",
    source: "IDSA UTI Guidelines",
  },
  {
    id: "hemocultivo",
    nombre: "Hemocultivo seriado (2 sets)",
    categoria: "laboratorio",
    descripcion:
      "Estándar para bacteremia, endocarditis, sepsis. 2 sets de sitios diferentes antes de antibiótico.",
    findingsPosibles: ["lab-blood-cultures-positive"],
    indicacionesPrincipales: ["sepsis", "endocarditis"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 600, max: 1800 },
    tiempoResultado: "48 horas (preliminar)",
    source: "Duke-ISCVID 2023 · 3 sets para endocarditis",
  },
  {
    id: "procalcitonina",
    nombre: "Procalcitonina (PCT)",
    categoria: "laboratorio",
    descripcion:
      "Marcador específico de infección bacteriana sistémica. Eleva en sepsis, no en virales.",
    findingsPosibles: ["lab-procalcitonina-elevated"],
    indicacionesPrincipales: ["sepsis", "cap-pneumonia"],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 700, max: 1600 },
    tiempoResultado: "Mismo día",
    source: "Surviving Sepsis Campaign 2024",
  },
  {
    id: "lactato",
    nombre: "Lactato sérico",
    categoria: "laboratorio",
    descripcion:
      "Marcador de hipoperfusión tisular. > 2 mmol/L sugiere sepsis con riesgo de mortalidad.",
    findingsPosibles: ["lactato_alto", "lab-lactate-elevated"],
    indicacionesPrincipales: ["sepsis", "dka"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 300, max: 700 },
    tiempoResultado: "Mismo día",
    source: "Surviving Sepsis Campaign 2024 · bundle 3-hora",
  },
  {
    id: "gasometria-arterial",
    nombre: "Gasometría arterial",
    categoria: "laboratorio",
    descripcion:
      "pH, pO2, pCO2, HCO3, base excess. Crucial en DKA, sepsis, EPOC exacerbado.",
    findingsPosibles: ["lab-arterial-ph-low", "lab-anion-gap-high"],
    indicacionesPrincipales: ["dka", "sepsis"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 350, max: 800 },
    tiempoResultado: "Mismo día (urgencias)",
    source: "ADA-EASD DKA Consensus 2023",
  },
  {
    id: "ferritina-saturacion",
    nombre: "Ferritina + saturación de transferrina",
    categoria: "laboratorio",
    descripcion:
      "Reservas de hierro. Ferritina < 30 ng/mL en mujer = ferropenia.",
    findingsPosibles: ["lab-ferritina-baja-b", "ferritina_baja"],
    indicacionesPrincipales: [
      "ferropenia_menstrual",
      "ferropenia_gi",
      "ferropenia_dieta",
    ],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 300, max: 750 },
    tiempoResultado: "1-2 días",
    source: "WHO 2024 · ENSANUT MX 2023",
  },
  {
    id: "anti-gad",
    nombre: "Anticuerpos anti-GAD",
    categoria: "laboratorio",
    descripcion:
      "Autoanticuerpos contra glutamato decarboxilasa. Marcador de LADA y DM1 tardía.",
    findingsPosibles: ["lab-gad-antibody-positive"],
    indicacionesPrincipales: ["lada"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 1500, max: 3500 },
    tiempoResultado: "3-7 días",
    source: "Hattersley Diabetologia 2023 · LADA diagnóstico",
  },
  {
    id: "peptido-c",
    nombre: "Péptido C",
    categoria: "laboratorio",
    descripcion:
      "Reserva pancreática de insulina endógena. Bajo en LADA avanzada / DM1; preservado en DM2 / MODY.",
    findingsPosibles: ["lab-c-peptide-low", "lab-c-peptide-preserved"],
    indicacionesPrincipales: ["lada", "mody", "dm2-typical"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 800, max: 1800 },
    tiempoResultado: "2-4 días",
    source: "Hattersley Diabetologia 2023",
  },
  {
    id: "ca125",
    nombre: "CA-125",
    categoria: "laboratorio",
    descripcion:
      "Marcador tumoral. Útil con masa pélvica y seguimiento de cáncer ovario.",
    findingsPosibles: ["lab-ca125-elevated"],
    indicacionesPrincipales: ["ovarian-cancer"],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 450, max: 950 },
    tiempoResultado: "2-3 días",
    source: "NCCN Ovarian Cancer 2024",
  },
  {
    id: "cortisol-salival-nocturno",
    nombre: "Cortisol salival a medianoche",
    categoria: "laboratorio",
    descripcion:
      "Cribado de Cushing. Pierde ritmo circadiano normal cuando hay hipercortisolismo.",
    findingsPosibles: ["lab-cortisol-am-elevated"],
    indicacionesPrincipales: ["cushing"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 700, max: 1500 },
    tiempoResultado: "3-7 días",
    source: "Nieman · Endocrine Society Guidelines 2024",
  },
  {
    id: "metanefrinas-plasma",
    nombre: "Metanefrinas fraccionadas en plasma",
    categoria: "laboratorio",
    descripcion:
      "Mejor prueba para descartar feocromocitoma. Toma estandarizada (sentado 30 min).",
    findingsPosibles: ["lab-metanephrines-elevated"],
    indicacionesPrincipales: ["pheochromocytoma"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 1800, max: 3800 },
    tiempoResultado: "5-10 días",
    source: "Lenders · Endocrine Society 2014",
  },
  {
    id: "lcr-citoquimico",
    nombre: "LCR citoquímico (punción lumbar)",
    categoria: "laboratorio",
    descripcion:
      "Glucosa, proteínas, células, lactato. Estándar en sospecha de meningitis, HSA con TC negativa.",
    findingsPosibles: [],
    indicacionesPrincipales: ["bacterial-meningitis", "sah", "multiple-sclerosis"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 1500, max: 4000 },
    tiempoResultado: "Mismo día",
    source: "IDSA Bacterial Meningitis 2004",
  },

  // =================================================================
  // 3. ENDOSCOPIAS (5)
  // =================================================================
  {
    id: "endoscopia-digestiva-alta",
    nombre: "Endoscopia digestiva alta (EDA)",
    categoria: "endoscopia",
    descripcion:
      "Evaluación esófago, estómago, duodeno. Diagnóstico de úlceras, varices, gastritis, sospecha de neoplasia.",
    findingsPosibles: ["sangrado_gi_oculto"],
    indicacionesPrincipales: ["ferropenia_gi"],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 3500, max: 9000 },
    tiempoResultado: "Mismo día (con biopsias 5-7 días)",
    preparacion: "Ayuno 8h",
    source: "ASGE Guidelines · GI endoscopy",
  },
  {
    id: "colonoscopia",
    nombre: "Colonoscopia",
    categoria: "endoscopia",
    descripcion:
      "Evaluación de todo el colon. Cribado de cáncer colorrectal (≥50 años), sangrado oculto, anemia ferropénica.",
    findingsPosibles: ["sangrado_gi_oculto"],
    indicacionesPrincipales: ["ferropenia_gi"],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 5000, max: 12000 },
    tiempoResultado: "Mismo día (con biopsias 5-7 días)",
    preparacion: "Limpieza intestinal 24h previa",
    source: "USPSTF Colorectal Cancer Screening 2024",
  },
  {
    id: "broncoscopia",
    nombre: "Broncoscopia",
    categoria: "endoscopia",
    descripcion:
      "Inspección de vías aéreas + biopsias. Útil en sospecha tumoral, hemoptisis, infecciones atípicas.",
    findingsPosibles: [],
    indicacionesPrincipales: ["tuberculosis-active"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 7000, max: 16000 },
    tiempoResultado: "Mismo día (biopsias 5-7 días)",
    source: "ATS/ERS Bronchoscopy Guidelines",
  },
  {
    id: "cistoscopia",
    nombre: "Cistoscopia",
    categoria: "endoscopia",
    descripcion:
      "Inspección de vejiga. Útil en hematuria, sospecha de neoplasia vesical, ITUs recurrentes.",
    findingsPosibles: [],
    indicacionesPrincipales: [],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 3500, max: 8500 },
    tiempoResultado: "Mismo día",
    source: "AUA Guidelines Hematuria 2020",
  },
  {
    id: "colposcopia",
    nombre: "Colposcopia con biopsia dirigida",
    categoria: "endoscopia",
    descripcion:
      "Estándar tras citología anormal (HSIL, ASC-H, AGC) o VPH 16/18 positivo. Biopsia dirigida a zonas sospechosas.",
    findingsPosibles: ["lab-cytology-hsil-asch"],
    indicacionesPrincipales: ["cervical-cancer"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 1500, max: 3800 },
    tiempoResultado: "Mismo día (biopsias 5-7 días)",
    source: "ASCCP 2024 · manejo de citologías anormales",
  },

  // =================================================================
  // 4. FISIOLÓGICOS / ELÉCTRICOS (8)
  // =================================================================
  {
    id: "ekg-12-derivaciones",
    nombre: "Electrocardiograma de 12 derivaciones",
    categoria: "fisiologico",
    descripcion:
      "Estudio cardiológico esencial. Detecta isquemia, arritmias, trastornos de conducción, bajo voltaje, hipertrofia.",
    findingsPosibles: [
      "ecg-low-voltage-paradox",
      "ecg-pseudoinfarct",
      "ecg-conduction-disease",
      "low_voltage_ecg",
    ],
    indicacionesPrincipales: [
      "attr-cm",
      "ischemic-cm",
      "scad",
      "hcm",
      "myocarditis-acute",
    ],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 250, max: 700 },
    tiempoResultado: "Inmediato",
    source: "AHA/ACC 2009 · ECG interpretación estándar",
  },
  {
    id: "holter-24h",
    nombre: "Monitor Holter de 24 horas",
    categoria: "fisiologico",
    descripcion:
      "Registro continuo del ritmo cardíaco. Útil en sospecha de FA paroxística, palpitaciones recurrentes, síncope.",
    findingsPosibles: ["holter_24h_neg"],
    indicacionesPrincipales: ["fa_paroxistica_oculta"],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 1800, max: 4500 },
    tiempoResultado: "3-7 días",
    source: "Heart Rhythm Society · evaluación arritmias",
  },
  {
    id: "monitor-eventos-30d",
    nombre: "Monitor de eventos / loop recorder (30 días)",
    categoria: "fisiologico",
    descripcion:
      "Detección de arritmias paroxísticas ocultas. Crítico tras EVC criptogénico.",
    findingsPosibles: [],
    indicacionesPrincipales: ["fa_paroxistica_oculta"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 5000, max: 14000 },
    tiempoResultado: "30 días",
    source: "Sanna · NEJM CRYSTAL-AF / EMBRACE",
  },
  {
    id: "eeg-basal",
    nombre: "Electroencefalograma basal (20-30 min)",
    categoria: "fisiologico",
    descripcion:
      "Registro de actividad eléctrica cerebral. Crítico para detectar epilepsia, encefalopatía.",
    findingsPosibles: ["lab-eeg-epileptiform"],
    indicacionesPrincipales: ["epilepsy"],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 1200, max: 3000 },
    tiempoResultado: "2-5 días",
    source: "ILAE 2017 · Operational Classification",
  },
  {
    id: "video-eeg-prolongado",
    nombre: "Video-EEG prolongado (24-72h)",
    categoria: "fisiologico",
    descripcion:
      "Monitorización simultánea de video + EEG. Estándar para crisis difíciles de clasificar.",
    findingsPosibles: ["lab-eeg-epileptiform"],
    indicacionesPrincipales: ["epilepsy"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 8000, max: 20000 },
    tiempoResultado: "Multi-día",
    source: "ILAE 2017",
  },
  {
    id: "electromiografia",
    nombre: "Electromiografía (EMG) + velocidad de conducción nerviosa",
    categoria: "fisiologico",
    descripcion:
      "Evalúa unión neuro-muscular y nervio periférico. Útil en polineuropatías (Fabry, ATTR), debilidad.",
    findingsPosibles: ["polineuropatia"],
    indicacionesPrincipales: ["fabry", "attr-cm"],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 2500, max: 6500 },
    tiempoResultado: "1-3 días",
    source: "AANEM Practice Parameters",
  },
  {
    id: "espirometria",
    nombre: "Espirometría con broncodilatador",
    categoria: "fisiologico",
    descripcion:
      "FEV1, FVC, FEV1/FVC, respuesta a broncodilatador. Diagnóstico de EPOC y asma.",
    findingsPosibles: [],
    indicacionesPrincipales: [],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 800, max: 2000 },
    tiempoResultado: "Inmediato",
    source: "GOLD 2024 · GINA 2024",
  },
  {
    id: "polisomnografia",
    nombre: "Polisomnografía (estudio de sueño)",
    categoria: "fisiologico",
    descripcion:
      "Diagnóstico de SAOS, narcolepsia, parasomnias. AHI ≥ 5 con síntomas = SAOS.",
    findingsPosibles: [],
    indicacionesPrincipales: [],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 7000, max: 16000 },
    tiempoResultado: "Multi-día",
    source: "AASM 2023",
  },

  // =================================================================
  // 5. PATOLOGÍA Y GENÉTICA (7)
  // =================================================================
  {
    id: "biopsia-tisular",
    nombre: "Biopsia tisular con estudio histopatológico",
    categoria: "patologia",
    descripcion:
      "Toma de fragmento tisular para análisis microscópico. Gold standard en oncología.",
    findingsPosibles: ["lab-biopsy-malignant"],
    indicacionesPrincipales: [
      "breast-cancer",
      "cervical-cancer",
      "ovarian-cancer",
      "endometrial-cancer",
    ],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 2500, max: 8500 },
    tiempoResultado: "5-10 días",
    source: "WHO Classification Tumors 2024",
  },
  {
    id: "biopsia-aguja-gruesa",
    nombre: "Biopsia con aguja gruesa (core needle biopsy)",
    categoria: "patologia",
    descripcion:
      "Biopsia percutánea de mama, tiroides, hígado. Permite caracterización histológica.",
    findingsPosibles: ["lab-biopsy-malignant"],
    indicacionesPrincipales: ["breast-cancer"],
    disponibilidadIMSS: "limitada",
    costoPrivadoMxn: { min: 3000, max: 7500 },
    tiempoResultado: "5-10 días",
    source: "NCCN Breast Cancer 2024",
  },
  {
    id: "citologia-papanicolaou",
    nombre: "Citología cervical (Papanicolaou)",
    categoria: "patologia",
    descripcion:
      "Cribado de lesiones precursoras de cáncer cervicouterino. Reportada en sistema Bethesda 2014.",
    findingsPosibles: ["lab-cytology-hsil-asch"],
    indicacionesPrincipales: ["cervical-cancer"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 300, max: 850 },
    tiempoResultado: "3-7 días",
    source: "Bethesda System 2023",
  },
  {
    id: "inmunohistoquimica",
    nombre: "Inmunohistoquímica (IHQ)",
    categoria: "patologia",
    descripcion:
      "Tipificación tumoral. En mama: ER, PR, HER2, Ki67. En ovario / endometrio: CK7, CK20, PAX-8, p53.",
    findingsPosibles: [],
    indicacionesPrincipales: ["breast-cancer", "ovarian-cancer", "endometrial-cancer"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 2500, max: 7000 },
    tiempoResultado: "7-14 días",
    source: "NCCN Breast / Ovarian / Uterine 2024",
  },
  {
    id: "vph-genotipificacion",
    nombre: "Genotipificación de VPH",
    categoria: "patologia",
    descripcion:
      "Identifica genotipos de alto riesgo. VPH 16 y 18 responsables del 70% de cáncer cervical.",
    findingsPosibles: ["lab-hpv-16-18-positive"],
    indicacionesPrincipales: ["cervical-cancer"],
    disponibilidadIMSS: "rutina",
    costoPrivadoMxn: { min: 1200, max: 2800 },
    tiempoResultado: "5-10 días",
    source: "ASCCP 2024 · cribado primario con VPH",
  },
  {
    id: "brca-secuenciacion",
    nombre: "Secuenciación BRCA1/2",
    categoria: "patologia",
    descripcion:
      "Estudio genético. Indicado en historia familiar de mama/ovario o pacientes jóvenes con neoplasia.",
    findingsPosibles: ["history-brca-mutation"],
    indicacionesPrincipales: ["breast-cancer", "ovarian-cancer"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 12000, max: 28000 },
    tiempoResultado: "3-6 semanas",
    source: "NCCN Genetic/Familial 2024",
  },
  {
    id: "flc-cadenas-ligeras",
    nombre: "FLC cadenas ligeras kappa/lambda séricas",
    categoria: "patologia",
    descripcion:
      "Detección de gammapatía monoclonal. Cribado para amiloidosis AL antes de gammagrafía PYP.",
    findingsPosibles: ["lab-flc-abnormal"],
    indicacionesPrincipales: ["al-amyloid", "attr-cm"],
    disponibilidadIMSS: "tercer-nivel",
    costoPrivadoMxn: { min: 1800, max: 4500 },
    tiempoResultado: "3-7 días",
    source: "Gillmore criteria · Circulation 2016",
  },
];

// =================================================================
// Helpers
// =================================================================

export function findEstudio(id: string): EstudioDiagnostico | undefined {
  return ESTUDIOS_DIAGNOSTICOS.find((e) => e.id === id);
}

export function estudiosPorCategoria(
  categoria: CategoriaEstudio,
): EstudioDiagnostico[] {
  return ESTUDIOS_DIAGNOSTICOS.filter((e) => e.categoria === categoria);
}

export function estudiosParaDiagnostico(
  diseaseId: string,
): EstudioDiagnostico[] {
  return ESTUDIOS_DIAGNOSTICOS.filter((e) =>
    e.indicacionesPrincipales.includes(diseaseId),
  );
}

export const CATEGORIA_LABELS: Record<CategoriaEstudio, string> = {
  imagenologia: "Imagenología",
  laboratorio: "Laboratorio y fluidos",
  endoscopia: "Endoscopias",
  fisiologico: "Estudios fisiológicos / eléctricos",
  patologia: "Patología y genética",
};

export const DISPONIBILIDAD_LABELS: Record<DisponibilidadIMSS, string> = {
  "rutina": "IMSS rutina",
  "limitada": "IMSS con cita",
  "tercer-nivel": "Tercer nivel",
  "privado-solo": "Solo privado",
};
