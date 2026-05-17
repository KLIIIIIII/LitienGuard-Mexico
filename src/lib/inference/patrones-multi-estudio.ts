/**
 * K1 — Patrones multi-estudio diagnósticos.
 *
 * 25 patrones canónicos curados que cruzan ≥2 estudios diagnósticos
 * para llegar a una conclusión clínica robusta. Cada patrón:
 *
 *   - Estudios involucrados (refs a estudios-diagnosticos.ts)
 *   - Hallazgos esperados en cada uno
 *   - Diagnóstico sugerido (ref al DISEASES del cerebro)
 *   - Workflow secuencial (qué pedir primero, qué después)
 *   - Confianza si todos los hallazgos coinciden
 *   - Citas internas a fuente
 *
 * El motor cruza la lista de estudios + resultados que el médico
 * ingresa y devuelve los patrones que aplican parcial o totalmente.
 */

import type { DiseaseId } from "./types";

export type CategoriaPatron =
  | "cardio"
  | "endocrino"
  | "neuro"
  | "infecto"
  | "onco"
  | "gineco"
  | "renal"
  | "hepato"
  | "respira";

export type ConfianzaPatron = "alta" | "media" | "baja";

export interface EstudioRequerido {
  /** ID del estudio del catálogo */
  estudioId: string;
  /** Hallazgo esperado descrito clínicamente */
  hallazgoEsperado: string;
  /** Es estudio obligatorio (true) o complementario (false) */
  requerido: boolean;
}

export interface PatronMultiEstudio {
  id: string;
  nombre: string;
  categoria: CategoriaPatron;
  descripcion: string;
  /** Lista de estudios involucrados — orden indica secuencia sugerida */
  estudiosClave: EstudioRequerido[];
  /** Dx del catálogo (DISEASES) al que apunta el patrón */
  diagnosticoSugerido: DiseaseId | string;
  /** Texto clínico claro del dx */
  diagnosticoLabel: string;
  /** Confianza del patrón si TODOS los hallazgos están presentes */
  confianza: ConfianzaPatron;
  /** Workflow recomendado paso a paso */
  workflowPasos: string[];
  /** Alertas o consideraciones críticas */
  alertas?: string[];
  /** Cita interna a fuente clínica */
  source: string;
}

export const PATRONES_MULTI_ESTUDIO: PatronMultiEstudio[] = [
  // =================================================================
  // CARDIOLOGÍA (8)
  // =================================================================
  {
    id: "attr-cm-confirmatorio",
    nombre: "ATTR-CM diagnóstico definitivo no invasivo",
    categoria: "cardio",
    descripcion:
      "Combinación que confirma amiloidosis cardíaca por transtiretina sin necesidad de biopsia endomiocárdica.",
    estudiosClave: [
      {
        estudioId: "ecocardiograma-transtoracico",
        hallazgoEsperado: "Engrosamiento septal ≥ 12 mm con apical sparing en strain",
        requerido: true,
      },
      {
        estudioId: "flc-cadenas-ligeras",
        hallazgoEsperado: "Cociente kappa/lambda normal (negativo para AL)",
        requerido: true,
      },
      {
        estudioId: "gammagrafia-pyp",
        hallazgoEsperado: "Captación cardíaca grado 2 o 3 (Perugini)",
        requerido: true,
      },
      {
        estudioId: "ekg-12-derivaciones",
        hallazgoEsperado: "Voltaje QRS bajo en miembros (< 5 mm) con LVH por eco",
        requerido: false,
      },
      {
        estudioId: "rm-cardio",
        hallazgoEsperado: "LGE difuso transmural sin patrón coronario",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "attr-cm",
    diagnosticoLabel: "ATTR-CM (amiloidosis cardíaca por transtiretina)",
    confianza: "alta",
    workflowPasos: [
      "1. Ecocardiograma con strain — busca apical sparing",
      "2. FLC kappa/lambda — descartar AL primero",
      "3. Si FLC negativo + sospecha clínica → Gammagrafía Tc-PYP",
      "4. Si PYP grado 2-3 + FLC negativo = ATTR-CM (criterios Gillmore)",
      "5. Considerar genotipificación TTR si edad < 70 años",
    ],
    alertas: [
      "FLC kappa/lambda DEBE hacerse antes del PYP — si positivo, descartar AL con inmunoelectroforesis e inmunofijación",
      "Tafamidis cambia el pronóstico — referir a cardiología especializada inmediatamente tras dx",
    ],
    source: "Gillmore · Circulation 2016 · criterios diagnóstico no invasivo ATTR-CM",
  },
  {
    id: "ea-severa-lflg",
    nombre: "Estenosis aórtica severa low-flow low-gradient real vs pseudo",
    categoria: "cardio",
    descripcion:
      "Distinguir EA severa LFLG real (que se beneficia de TAVI/SAVR) vs pseudo-severa por bajo flujo.",
    estudiosClave: [
      {
        estudioId: "ecocardiograma-transtoracico",
        hallazgoEsperado: "Área valvular ≤ 1 cm² con gradiente medio < 40 mmHg",
        requerido: true,
      },
      {
        estudioId: "eco-estres-dobutamina",
        hallazgoEsperado: "Con dobutamina: gradiente sube > 40 mmHg y área se mantiene < 1 cm²",
        requerido: true,
      },
      {
        estudioId: "ct-angio-coronaria",
        hallazgoEsperado: "Score de calcio aórtico > 2000 (hombres) o > 1300 (mujeres)",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "severe-as",
    diagnosticoLabel: "Estenosis aórtica severa LFLG verdadera",
    confianza: "alta",
    workflowPasos: [
      "1. Eco con sospecha LFLG: FEVI baja o llenado restrictivo",
      "2. DSE: si gradiente recruta > 40 mmHg con área estable → severa real",
      "3. Si DSE no concluyente: CT con calcio score",
      "4. Referir a cirugía / TAVI si confirma severa",
    ],
    alertas: [
      "NO indicar intervención sólo con gradiente bajo y FEVI baja — confirmar con DSE o calcio score",
    ],
    source: "ESC/EACTS Valvular 2021 · Vahanian · algoritmo LFLG",
  },
  {
    id: "scad-confirmatorio",
    nombre: "SCAD (disección coronaria espontánea) en mujer joven",
    categoria: "cardio",
    descripcion:
      "Sospecha en mujer < 50 años con IAM sin factores de riesgo aterogénicos clásicos.",
    estudiosClave: [
      {
        estudioId: "ekg-12-derivaciones",
        hallazgoEsperado: "Cambios isquémicos agudos (elevación ST, T negativas)",
        requerido: true,
      },
      {
        estudioId: "troponina-hs",
        hallazgoEsperado: "Troponina elevada con patrón cinético de IAM",
        requerido: true,
      },
      {
        estudioId: "ct-angio-coronaria",
        hallazgoEsperado:
          "Flap intimal o hematoma intramural visible (o coronariografía con OCT/IVUS)",
        requerido: true,
      },
      {
        estudioId: "ecocardiograma-transtoracico",
        hallazgoEsperado: "Alteración segmentaria de contractilidad en territorio coronario",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "scad",
    diagnosticoLabel: "Disección espontánea de arteria coronaria",
    confianza: "alta",
    workflowPasos: [
      "1. Mujer < 50 con IAM + sin DM/HAS/dislipidemia → sospecha SCAD",
      "2. EKG + troponina urgentes",
      "3. CT angio coronaria O coronariografía con OCT/IVUS (mejor)",
      "4. Manejo conservador (anticoagulación, no stent salvo flujo TIMI < 2)",
      "5. Screen displasia fibromuscular en otros lechos",
    ],
    alertas: [
      "NO asumir aterosclerosis sin imagen confirmatoria",
      "Stent puede empeorar disección — coordinar con hemodinamia experta",
      "Recurrencia 10-30% a 10 años — screen FMD y conexionsanos",
    ],
    source: "Hayes · NEJM 2020 · review SCAD · AHA SCAD Statement 2018",
  },
  {
    id: "ic-aguda-descompensada",
    nombre: "IC aguda descompensada — work-up de urgencias",
    categoria: "cardio",
    descripcion:
      "Disnea aguda + congestión + sospecha de IC. Diferenciar etiología y guiar manejo agudo.",
    estudiosClave: [
      {
        estudioId: "nt-probnp",
        hallazgoEsperado: "Elevado para edad (> 450 < 55a; > 900 55-74a; > 1800 ≥75a)",
        requerido: true,
      },
      {
        estudioId: "ekg-12-derivaciones",
        hallazgoEsperado: "Cambios sugerentes (LVH, isquemia, FA)",
        requerido: true,
      },
      {
        estudioId: "ecocardiograma-transtoracico",
        hallazgoEsperado: "FEVI + función diastólica + valvulopatías",
        requerido: true,
      },
      {
        estudioId: "troponina-hs",
        hallazgoEsperado: "Para descartar isquemia precipitante",
        requerido: true,
      },
      {
        estudioId: "quimica-sanguinea",
        hallazgoEsperado: "Función renal + electrolitos antes de diuréticos",
        requerido: true,
      },
    ],
    diagnosticoSugerido: "adhf-acute",
    diagnosticoLabel: "Insuficiencia cardíaca aguda descompensada",
    confianza: "alta",
    workflowPasos: [
      "1. NT-proBNP en triage de disnea aguda",
      "2. EKG en < 10 min — descartar IAM",
      "3. Eco precoz (< 24h) — clasificar HFrEF/HFmrEF/HFpEF",
      "4. Furosemida IV 1-2 mg/kg si congestión",
      "5. Buscar causa precipitante: isquemia, arritmia, HTA, infección, mala adherencia",
    ],
    alertas: [
      "BNP < 100 pg/mL en disnea hace IC altamente improbable (VPN 96%)",
      "Vigilar K antes y durante diuresis intensiva",
    ],
    source: "ESC HF 2023 / AHA HFA 2017 · algoritmo ADHF",
  },
  {
    id: "fa-paroxistica-criptogenica",
    nombre: "FA paroxística oculta tras EVC criptogénico",
    categoria: "cardio",
    descripcion:
      "Hasta 30% de EVC criptogénicos esconden FA paroxística que cambia el manejo a anticoagulación.",
    estudiosClave: [
      {
        estudioId: "ekg-12-derivaciones",
        hallazgoEsperado: "Ritmo sinusal de admisión (excluye FA persistente)",
        requerido: true,
      },
      {
        estudioId: "holter-24h",
        hallazgoEsperado: "Sin episodios — NO descarta paroxística",
        requerido: false,
      },
      {
        estudioId: "monitor-eventos-30d",
        hallazgoEsperado: "Episodios > 30 segundos de FA — diagnóstico positivo",
        requerido: true,
      },
      {
        estudioId: "ecocardiograma-transtoracico",
        hallazgoEsperado: "AI dilatada (> 34 mL/m²) apoya sustrato",
        requerido: false,
      },
      {
        estudioId: "nt-probnp",
        hallazgoEsperado: "Elevado apoya sustrato auricular",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "fa_paroxistica_oculta",
    diagnosticoLabel: "FA paroxística oculta",
    confianza: "alta",
    workflowPasos: [
      "1. EVC criptogénico + workup completo negativo → sospecha FA paroxística",
      "2. Holter 24h primero (cubre 5-10% adicional)",
      "3. Si Holter negativo: loop recorder 30+ días (cubre 12-30%)",
      "4. Si FA confirmada > 30 seg: iniciar anticoagulación",
    ],
    alertas: [
      "Loop recorder reduce recurrencia de EVC ~70% en este grupo",
      "NO retrasar anticoagulación esperando otros estudios si FA confirmada",
    ],
    source: "Sanna · NEJM CRYSTAL-AF · Healey EMBRACE",
  },
  {
    id: "isquemica-cronica-workup",
    nombre: "Cardiopatía isquémica crónica — work-up no invasivo",
    categoria: "cardio",
    descripcion:
      "Paciente con angina estable + factores de riesgo. Estratificar antes de coronariografía.",
    estudiosClave: [
      {
        estudioId: "ekg-12-derivaciones",
        hallazgoEsperado: "Q patológicas o cambios T-ST sugerentes",
        requerido: true,
      },
      {
        estudioId: "ecocardiograma-transtoracico",
        hallazgoEsperado: "Alteración regional de contractilidad en territorio coronario",
        requerido: true,
      },
      {
        estudioId: "ct-angio-coronaria",
        hallazgoEsperado: "Estenosis significativa (> 50%) o calcio score alto",
        requerido: true,
      },
      {
        estudioId: "perfil-lipidico",
        hallazgoEsperado: "LDL para iniciar estatina",
        requerido: true,
      },
      {
        estudioId: "hba1c",
        hallazgoEsperado: "Descartar DM concomitante",
        requerido: true,
      },
    ],
    diagnosticoSugerido: "ischemic-cm",
    diagnosticoLabel: "Cardiopatía isquémica crónica",
    confianza: "alta",
    workflowPasos: [
      "1. EKG basal + perfil lipídico + HbA1c",
      "2. Eco con strain — buscar territorios afectados",
      "3. CT angio coronaria (primera línea no invasiva por ESC 2024)",
      "4. Si estenosis significativa → coronariografía",
      "5. Estatina alta intensidad + aspirina + IECA si HAS",
    ],
    source: "ESC Chronic Coronary Syndromes 2024 · Vrints",
  },
  {
    id: "ic-fer-fenotipo",
    nombre: "IC con FE reducida — fenotipo y manejo de pilares",
    categoria: "cardio",
    descripcion:
      "HFrEF requiere los 4 pilares: ARNi/IECA, BB, MRA, ISGLT2. Identificar etiología y barreras de manejo.",
    estudiosClave: [
      {
        estudioId: "ecocardiograma-transtoracico",
        hallazgoEsperado: "FEVI ≤ 40% por Simpson biplano",
        requerido: true,
      },
      {
        estudioId: "nt-probnp",
        hallazgoEsperado: "Elevado",
        requerido: true,
      },
      {
        estudioId: "ct-angio-coronaria",
        hallazgoEsperado: "Descartar isquémica como etiología",
        requerido: false,
      },
      {
        estudioId: "rm-cardio",
        hallazgoEsperado:
          "Caracterización tisular si sospecha de infiltración o miocarditis",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "hfref",
    diagnosticoLabel: "Insuficiencia cardíaca con FE reducida",
    confianza: "alta",
    workflowPasos: [
      "1. Confirmar FEVI ≤ 40% con eco",
      "2. NT-proBNP basal para seguimiento",
      "3. Iniciar 4 pilares simultáneamente (no secuencial)",
      "4. Buscar causa: isquémica > idiopática > infiltrativa > otras",
      "5. Visita en 2 semanas para titulación de dosis",
    ],
    alertas: [
      "Cuadro Básico IMSS NO incluye SGLT2i — gestionar acceso privado o estudio compasivo",
      "Bisoprolol contraindicado en descompensación aguda — esperar a estable",
    ],
    source: "ESC HF 2023 · McDonagh · 4 pilares HFrEF",
  },

  // =================================================================
  // ENDOCRINO (5)
  // =================================================================
  {
    id: "dka-diagnostico",
    nombre: "Cetoacidosis diabética — criterios bioquímicos",
    categoria: "endocrino",
    descripcion:
      "Emergencia metabólica en DM1, LADA, o DM2 con estrés precipitante.",
    estudiosClave: [
      {
        estudioId: "glucemia-ayuno",
        hallazgoEsperado: "Glucemia > 250 mg/dL típica (puede ser euglucémica con SGLT2)",
        requerido: true,
      },
      {
        estudioId: "gasometria-arterial",
        hallazgoEsperado: "pH < 7.30 + HCO3 < 18",
        requerido: true,
      },
      {
        estudioId: "ego",
        hallazgoEsperado: "Cetonuria ++ o más (o beta-hidroxibutirato > 3 mmol/L)",
        requerido: true,
      },
      {
        estudioId: "quimica-sanguinea",
        hallazgoEsperado: "K + función renal — vigilar antes de insulina IV",
        requerido: true,
      },
      {
        estudioId: "lactato",
        hallazgoEsperado: "Descartar coexistencia con sepsis o hipoperfusión",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "dka",
    diagnosticoLabel: "Cetoacidosis diabética",
    confianza: "alta",
    workflowPasos: [
      "1. Glucemia + gasometría + EGO al ingreso",
      "2. Si K < 3.3 mEq/L: reponer ANTES de iniciar insulina",
      "3. Insulina IV 0.1 U/kg/h + fluidos IV agresivos",
      "4. Monitoreo horario: glucemia, K, anion gap, pH",
      "5. Buscar precipitante: infección, infarto, mala adherencia",
    ],
    alertas: [
      "DKA euglucémica posible con SGLT2i — sospechar aunque glucemia sea normal",
      "Hipokalemia es la complicación más letal del tratamiento",
    ],
    source: "ADA-EASD DKA Consensus 2023 · Umpierrez",
  },
  {
    id: "lada-vs-dm2",
    nombre: "LADA vs DM2 típica — distinción crítica",
    categoria: "endocrino",
    descripcion:
      "5-10% de adultos diagnosticados como DM2 son realmente LADA. Cambia manejo (insulina temprana).",
    estudiosClave: [
      {
        estudioId: "anti-gad",
        hallazgoEsperado: "Anti-GAD positivo confirma autoinmunidad",
        requerido: true,
      },
      {
        estudioId: "peptido-c",
        hallazgoEsperado: "Péptido C bajo (< 0.6 ng/mL) en LADA avanzada",
        requerido: true,
      },
      {
        estudioId: "hba1c",
        hallazgoEsperado: "Elevada al diagnóstico",
        requerido: true,
      },
    ],
    diagnosticoSugerido: "lada",
    diagnosticoLabel: "LADA (diabetes autoinmune latente del adulto)",
    confianza: "alta",
    workflowPasos: [
      "1. Adulto delgado con DM aparente + falla rápida a hipoglucemiantes → sospechar LADA",
      "2. Anti-GAD + Péptido C basal",
      "3. Si anti-GAD positivo: diagnóstico de LADA",
      "4. Manejo: insulina basal temprana (no esperar falla completa)",
      "5. Considerar referir a endocrinología",
    ],
    alertas: [
      "Sulfonilureas aceleran agotamiento de células beta en LADA — evitar como primera línea",
    ],
    source: "Hattersley Diabetologia 2023",
  },
  {
    id: "mody-criterios",
    nombre: "MODY (diabetes monogénica) — criterios de sospecha",
    categoria: "endocrino",
    descripcion:
      "DM con patrón autosómico dominante + edad joven + sin obesidad. 2% de DM diagnosticada antes de los 25.",
    estudiosClave: [
      {
        estudioId: "anti-gad",
        hallazgoEsperado: "Negativo (excluye DM1/LADA)",
        requerido: true,
      },
      {
        estudioId: "peptido-c",
        hallazgoEsperado: "Conservado (> 1.0 ng/mL) a pesar de años de evolución",
        requerido: true,
      },
      {
        estudioId: "hba1c",
        hallazgoEsperado: "Hiperglucemia confirmada",
        requerido: true,
      },
    ],
    diagnosticoSugerido: "mody",
    diagnosticoLabel: "MODY (Maturity-Onset Diabetes of the Young)",
    confianza: "media",
    workflowPasos: [
      "1. Paciente < 30 años + historia familiar 3 generaciones consecutivas con DM",
      "2. Sin obesidad + sin cetoacidosis al inicio",
      "3. Anti-GAD negativo + péptido C preservado",
      "4. Referir a genética para tipificación (HNF1A, GCK, HNF4A)",
      "5. Algunos subtipos responden a sulfonilureas (sin insulina)",
    ],
    source: "Hattersley Diabetologia 2023",
  },
  {
    id: "cushing-endogeno-cribado",
    nombre: "Síndrome de Cushing endógeno — cribado diagnóstico",
    categoria: "endocrino",
    descripcion:
      "Sospecha en fenotipo cushingoide + HAS + DM2 reciente + debilidad proximal.",
    estudiosClave: [
      {
        estudioId: "cortisol-salival-nocturno",
        hallazgoEsperado: "Cortisol salival a medianoche elevado (pérdida de ritmo)",
        requerido: true,
      },
      {
        estudioId: "quimica-sanguinea",
        hallazgoEsperado: "Hipokalemia o hiperglucemia secundaria",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "cushing",
    diagnosticoLabel: "Síndrome de Cushing endógeno",
    confianza: "media",
    workflowPasos: [
      "1. Sospecha clínica: estrías purpúreas + debilidad proximal + plétora",
      "2. Cribado: 2 de 3 pruebas positivas (cortisol salival nocturno x2, cortisol libre urinario, supresión con dexametasona 1mg)",
      "3. Si positivo: ACTH para diferenciar Cushing ACTH-dependiente vs no-dependiente",
      "4. Imagen: RM hipófisis o TC suprarrenales según ACTH",
      "5. Referir a endocrinología urgente",
    ],
    source: "Nieman · Endocrine Society Guidelines 2024",
  },
  {
    id: "hipotiroidismo-evaluacion",
    nombre: "Hipotiroidismo — etiología y manejo",
    categoria: "endocrino",
    descripcion:
      "Confirmación de hipotiroidismo + etiología autoinmune (Hashimoto) más frecuente.",
    estudiosClave: [
      {
        estudioId: "perfil-tiroideo",
        hallazgoEsperado: "TSH elevada con T4L baja (clínico) o normal (subclínico)",
        requerido: true,
      },
      {
        estudioId: "anti-tpo",
        hallazgoEsperado: "Positivo confirma origen autoinmune (Hashimoto)",
        requerido: true,
      },
      {
        estudioId: "perfil-lipidico",
        hallazgoEsperado: "LDL elevado secundario reversible",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "hypothyroidism",
    diagnosticoLabel: "Hipotiroidismo primario",
    confianza: "alta",
    workflowPasos: [
      "1. TSH + T4L para confirmar",
      "2. Anti-TPO para etiología",
      "3. Iniciar levotiroxina 1.6 mcg/kg/día ajustado por edad y comorbilidades",
      "4. Re-evaluar TSH a 6-8 semanas",
    ],
    alertas: [
      "Cuidado en cardiópatas: titular muy gradual (12.5-25 mcg inicial)",
      "Ferropenia + IBP + calcio reducen absorción — separar 4h",
    ],
    source: "ATA Hypothyroidism Guidelines 2014 / 2023 update",
  },

  // =================================================================
  // NEUROLOGÍA (4)
  // =================================================================
  {
    id: "evc-isquemico-vs-hemorragico",
    nombre: "EVC isquémico vs hemorrágico — diferenciación de urgencias",
    categoria: "neuro",
    descripcion:
      "Distinción crítica (< 4.5h ventana trombolisis isquémico vs HIP que contraindica).",
    estudiosClave: [
      {
        estudioId: "tac-cerebro-sin-contraste",
        hallazgoEsperado:
          "Sangre intraparenquimatosa = HIP; sin sangre = isquémico hasta no demostrar",
        requerido: true,
      },
      {
        estudioId: "glucemia-ayuno",
        hallazgoEsperado: "Descartar hipoglucemia como mimic (< 60 mg/dL)",
        requerido: true,
      },
      {
        estudioId: "ekg-12-derivaciones",
        hallazgoEsperado: "FA o IAM como fuente embólica",
        requerido: true,
      },
      {
        estudioId: "angio-tc-cerebro",
        hallazgoEsperado: "Localizar oclusión LVO (M1 / ACI / basilar) para trombectomía",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "ischemic-stroke-acute",
    diagnosticoLabel: "EVC isquémico (vs hemorrágico)",
    confianza: "alta",
    workflowPasos: [
      "1. Activación código stroke al primer contacto",
      "2. TC sin contraste en < 25 min de ingreso",
      "3. Glucemia + EKG paralelo",
      "4. Si isquémico + < 4.5h + NIHSS ≥ 4: trombólisis IV",
      "5. Si LVO: angio-TC + trombectomía hasta 24h post-síntoma",
    ],
    alertas: [
      "Hipoglucemia es el mimic más común — siempre descartar antes de trombólisis",
      "Anticoagulado con INR > 1.7 o DOAC reciente: NO trombólisis (preferir trombectomía)",
    ],
    source: "AHA/ASA Acute Ischemic Stroke 2024 · Powers / Hill",
  },
  {
    id: "hsa-aneurismatica-workup",
    nombre: "HSA aneurismática — work-up tras cefalea trueno",
    categoria: "neuro",
    descripcion:
      "Cefalea explosiva máxima en < 1 minuto requiere descartar HSA. Mortalidad 30-50%.",
    estudiosClave: [
      {
        estudioId: "tac-cerebro-sin-contraste",
        hallazgoEsperado: "Sangre en cisternas basales o ventrículos = HSA confirmada",
        requerido: true,
      },
      {
        estudioId: "lcr-citoquimico",
        hallazgoEsperado: "Eritrocitos persistentes + xantocromía (si TC negativa)",
        requerido: false,
      },
      {
        estudioId: "angio-tc-cerebro",
        hallazgoEsperado: "Localizar aneurisma (98% sensibilidad para aneurismas > 3 mm)",
        requerido: true,
      },
    ],
    diagnosticoSugerido: "sah",
    diagnosticoLabel: "Hemorragia subaracnoidea aneurismática",
    confianza: "alta",
    workflowPasos: [
      "1. Cefalea trueno → TC sin contraste urgente (sensibilidad 100% si < 6h)",
      "2. Si TC negativa pero alta sospecha: punción lumbar 6-12h post-onset",
      "3. Si HSA confirmada: angio-TC para localizar aneurisma",
      "4. Referir a neurocirugía/neurointervencionismo URGENTE",
      "5. Vigilar vasospasmo y resangrado primeras 72h",
    ],
    alertas: [
      "TC sin contraste pierde sensibilidad después de 12h — punción lumbar obligatoria",
      "Nimodipino oral desde día 1 para vasospasmo",
    ],
    source: "AHA aSAH Guidelines 2023 · Hoh",
  },
  {
    id: "demencia-diferencial",
    nombre: "Demencia — diferencial Alzheimer vs vascular vs otra",
    categoria: "neuro",
    descripcion:
      "Deterioro cognitivo progresivo > 6 meses. Distinguir Alzheimer (insidioso) vs vascular (escalonado).",
    estudiosClave: [
      {
        estudioId: "perfil-tiroideo",
        hallazgoEsperado: "Descartar hipotiroidismo como mimic",
        requerido: true,
      },
      {
        estudioId: "biometria-hematica",
        hallazgoEsperado: "Descartar anemia, deficiencia B12",
        requerido: true,
      },
      {
        estudioId: "rm-cerebro",
        hallazgoEsperado:
          "Atrofia hipocampal = Alzheimer; lesiones substancia blanca = vascular",
        requerido: true,
      },
    ],
    diagnosticoSugerido: "alzheimer-dementia",
    diagnosticoLabel: "Demencia tipo Alzheimer (vs vascular)",
    confianza: "media",
    workflowPasos: [
      "1. MMSE / MoCA basal en consulta",
      "2. Lab: TSH, B12, hemograma para descartar causas reversibles",
      "3. RM cerebro: atrofia hipocampal + Fazekas",
      "4. Considerar PET-FDG si dx incierto",
      "5. Plan integral: cognitivo + social + cuidador",
    ],
    alertas: [
      "Hipotiroidismo y B12 baja son mimics tratables — siempre descartar primero",
      "Curso escalonado + factores CV apunta a vascular: optimizar HAS/DM/dislipidemia",
    ],
    source: "AAN Dementia 2022 · NIA-AA 2018 Research Framework",
  },
  {
    id: "epilepsia-clasificacion",
    nombre: "Epilepsia — clasificación y elección de antiepiléptico",
    categoria: "neuro",
    descripcion:
      "≥ 2 crisis no provocadas separadas por > 24h. Clasificar focal vs generalizada guía manejo.",
    estudiosClave: [
      {
        estudioId: "eeg-basal",
        hallazgoEsperado: "Actividad epileptiforme interictal (puntas, ondas agudas)",
        requerido: true,
      },
      {
        estudioId: "rm-cerebro",
        hallazgoEsperado: "Descartar lesión estructural (mesial temporal, tumor, cicatriz)",
        requerido: true,
      },
      {
        estudioId: "video-eeg-prolongado",
        hallazgoEsperado: "Para crisis difíciles de clasificar o pre-cirugía",
        requerido: false,
      },
      {
        estudioId: "biometria-hematica",
        hallazgoEsperado: "Pre-tratamiento basal",
        requerido: true,
      },
      {
        estudioId: "quimica-sanguinea",
        hallazgoEsperado: "Hepática + renal antes de antiepiléptico",
        requerido: true,
      },
    ],
    diagnosticoSugerido: "epilepsy",
    diagnosticoLabel: "Epilepsia (clasificar focal vs generalizada)",
    confianza: "alta",
    workflowPasos: [
      "1. Historia clínica detallada de la crisis (semiología, duración, postictal)",
      "2. EEG basal 20-30 min",
      "3. RM cerebro con protocolo epilepsia",
      "4. Si EEG basal negativo y alta sospecha: video-EEG ambulatorio",
      "5. Elegir antiepiléptico: levetiracetam (amplio espectro) o valproato (generalizadas)",
    ],
    alertas: [
      "Valproato CONTRAINDICADO en mujer fértil sin anticoncepción (teratogénico)",
      "Levetiracetam puede causar irritabilidad — revisar a 4-8 semanas",
    ],
    source: "ILAE 2017 Operational Classification · Fisher",
  },

  // =================================================================
  // GINECO-ONCOLOGÍA (4)
  // =================================================================
  {
    id: "cancer-mama-workup",
    nombre: "Cáncer de mama — work-up diagnóstico completo",
    categoria: "gineco",
    descripcion:
      "Tras hallazgo de masa palpable o BIRADS 4-5. Tipificación inmunohistoquímica define manejo.",
    estudiosClave: [
      {
        estudioId: "mastografia",
        hallazgoEsperado: "BIRADS 4 o 5 (lesión sospechosa o altamente sugerente)",
        requerido: true,
      },
      {
        estudioId: "us-abdominal",
        hallazgoEsperado: "Ultrasonido mamario complementario",
        requerido: true,
      },
      {
        estudioId: "biopsia-aguja-gruesa",
        hallazgoEsperado: "Diagnóstico histológico confirmatorio",
        requerido: true,
      },
      {
        estudioId: "inmunohistoquimica",
        hallazgoEsperado: "ER, PR, HER2, Ki67 para subtipo molecular",
        requerido: true,
      },
      {
        estudioId: "pet-ct-oncologico",
        hallazgoEsperado: "Estadificación si tumor ≥ T2 o sospecha metástasis",
        requerido: false,
      },
      {
        estudioId: "brca-secuenciacion",
        hallazgoEsperado: "Si edad < 50 o historia familiar fuerte",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "breast-cancer",
    diagnosticoLabel: "Cáncer de mama (subtipo según IHQ)",
    confianza: "alta",
    workflowPasos: [
      "1. Masa palpable o BIRADS 4-5 → mastografía + US dirigido",
      "2. Biopsia con aguja gruesa (preferida sobre PAAF)",
      "3. Si maligno: IHQ para ER/PR/HER2/Ki67 → define subtipo",
      "4. Estadificación según T-N-M",
      "5. Comité oncológico para plan multimodal",
    ],
    source: "NCCN Breast Cancer 2024 · ACR BI-RADS Atlas 2024",
  },
  {
    id: "cervix-workup-completo",
    nombre: "Cáncer cervicouterino — confirmación diagnóstica",
    categoria: "gineco",
    descripcion:
      "Tras citología anormal o VPH 16/18 positivo. Colposcopia + biopsia define manejo.",
    estudiosClave: [
      {
        estudioId: "citologia-papanicolaou",
        hallazgoEsperado: "HSIL, ASC-H, AGC o células malignas",
        requerido: true,
      },
      {
        estudioId: "vph-genotipificacion",
        hallazgoEsperado: "VPH 16 o 18 positivo (70% de cáncer cervical)",
        requerido: true,
      },
      {
        estudioId: "colposcopia",
        hallazgoEsperado: "Zona blanco-acética / iodo-negativa con biopsia",
        requerido: true,
      },
      {
        estudioId: "biopsia-tisular",
        hallazgoEsperado: "Confirmación histológica de CIN3+ o invasión",
        requerido: true,
      },
      {
        estudioId: "rm-cerebro",
        hallazgoEsperado: "Estadificación pélvica si invasión confirmada",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "cervical-cancer",
    diagnosticoLabel: "Cáncer cervicouterino",
    confianza: "alta",
    workflowPasos: [
      "1. Citología → si anormal → genotipificación VPH",
      "2. Colposcopia con biopsia dirigida",
      "3. Si invasión confirmada: estadificación con RM pélvica + TC abdomen-tórax",
      "4. Comité oncológico para definir cirugía vs radio-quimio",
    ],
    source: "NCCN Cervical Cancer 2024 · ASCCP 2024",
  },
  {
    id: "ovario-workup",
    nombre: "Cáncer de ovario — sospecha y confirmación",
    categoria: "gineco",
    descripcion:
      "Masa pélvica + CA-125 elevado en mujer postmenopáusica = alta sospecha.",
    estudiosClave: [
      {
        estudioId: "us-transvaginal",
        hallazgoEsperado: "Masa anexial compleja con componentes sólidos",
        requerido: true,
      },
      {
        estudioId: "ca125",
        hallazgoEsperado: "CA-125 > 35 U/mL (especialmente postmenopáusica)",
        requerido: true,
      },
      {
        estudioId: "tac-abdomen-pelvis",
        hallazgoEsperado: "Estadificación + ascitis + carcinomatosis peritoneal",
        requerido: true,
      },
      {
        estudioId: "biopsia-tisular",
        hallazgoEsperado: "Diagnóstico histológico tras cirugía staging",
        requerido: true,
      },
      {
        estudioId: "brca-secuenciacion",
        hallazgoEsperado: "BRCA + cambia manejo (inhibidor PARP)",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "ovarian-cancer",
    diagnosticoLabel: "Cáncer de ovario",
    confianza: "alta",
    workflowPasos: [
      "1. Síntoma vago (saciedad precoz, distensión, dolor pélvico) > 12 días/mes en mujer > 50",
      "2. US transvaginal + CA-125",
      "3. Si masa compleja: TC abdomen-pelvis para estadificación",
      "4. Cirugía staging por ginecólogo oncólogo (NO biopsia transcutánea)",
      "5. BRCA testing post-diagnóstico (germline + somatic)",
    ],
    alertas: [
      "Biopsia transcutánea de ovario está CONTRAINDICADA — siembra peritoneal",
      "Referir a ginecología oncológica antes de cirugía exploratoria",
    ],
    source: "NCCN Ovarian Cancer 2024",
  },
  {
    id: "endometrio-postmenopausico",
    nombre: "Cáncer de endometrio — sangrado postmenopáusico",
    categoria: "gineco",
    descripcion:
      "Cualquier sangrado postmenopáusico debe evaluarse. VPP 5-15% para cáncer endometrial.",
    estudiosClave: [
      {
        estudioId: "us-transvaginal",
        hallazgoEsperado: "Endometrio > 4-5 mm en postmenopáusica = biopsiar",
        requerido: true,
      },
      {
        estudioId: "biopsia-tisular",
        hallazgoEsperado: "Biopsia endometrial (Pipelle o D&C)",
        requerido: true,
      },
      {
        estudioId: "inmunohistoquimica",
        hallazgoEsperado: "p53, ER, PR para tipificación (Lynch screening)",
        requerido: true,
      },
      {
        estudioId: "rm-cerebro",
        hallazgoEsperado: "Estadificación pélvica + miometrio",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "endometrial-cancer",
    diagnosticoLabel: "Cáncer de endometrio",
    confianza: "alta",
    workflowPasos: [
      "1. Sangrado postmenopáusico → US transvaginal",
      "2. Si endometrio > 4-5 mm: biopsia endometrial",
      "3. Si confirmado: RM pélvica para invasión miometrial",
      "4. IHQ MMR (Lynch screening) en TODOS los casos",
      "5. Comité oncológico para definir manejo",
    ],
    source: "NCCN Uterine Neoplasms 2024 · ESGO/ESMO/ESP 2024",
  },

  // =================================================================
  // INFECTOLOGÍA (3)
  // =================================================================
  {
    id: "sepsis-temprana",
    nombre: "Sepsis temprana — bundle de 1 hora",
    categoria: "infecto",
    descripcion:
      "Reconocimiento temprano salva vidas. qSOFA ≥ 2 + sospecha infección + lactato > 2 = sepsis.",
    estudiosClave: [
      {
        estudioId: "hemocultivo",
        hallazgoEsperado: "Crecimiento bacteriano (toma ANTES de antibiótico)",
        requerido: true,
      },
      {
        estudioId: "lactato",
        hallazgoEsperado: "> 2 mmol/L = hipoperfusión; > 4 = severa",
        requerido: true,
      },
      {
        estudioId: "biometria-hematica",
        hallazgoEsperado: "Leucocitos > 12k o < 4k",
        requerido: true,
      },
      {
        estudioId: "procalcitonina",
        hallazgoEsperado: "Eleva en bacteriana, normal en viral",
        requerido: false,
      },
      {
        estudioId: "gasometria-arterial",
        hallazgoEsperado: "Acidosis metabólica + alcalosis respiratoria compensatoria",
        requerido: false,
      },
      {
        estudioId: "ego",
        hallazgoEsperado: "Identificar foco urinario",
        requerido: true,
      },
    ],
    diagnosticoSugerido: "sepsis",
    diagnosticoLabel: "Sepsis / shock séptico",
    confianza: "alta",
    workflowPasos: [
      "1. qSOFA ≥ 2 + sospecha infección → activar bundle",
      "2. < 1h: lactato + hemocultivos x2 + antibiótico empírico + fluidos 30 mL/kg",
      "3. Identificar foco: pulmón / urinario / abdomen / piel / SNC",
      "4. Re-evaluar lactato a 2-4h — si no baja: ajustar manejo",
      "5. Vasopresor si MAP < 65 mmHg post-fluidos: noradrenalina primera línea",
    ],
    alertas: [
      "Antibiótico < 1h salva vidas — no esperar resultados de cultivos",
      "Lactato > 4 mmol/L → admisión a UCI",
    ],
    source: "Surviving Sepsis Campaign 2024 · Singer Sepsis-3",
  },
  {
    id: "endocarditis-duke",
    nombre: "Endocarditis infecciosa — criterios Duke-ISCVID",
    categoria: "infecto",
    descripcion:
      "Fiebre prolongada + soplo nuevo + factores de riesgo. Mortalidad alta sin tratamiento dirigido.",
    estudiosClave: [
      {
        estudioId: "hemocultivo",
        hallazgoEsperado: "3 sets de hemocultivos espaciados (mayor de Duke)",
        requerido: true,
      },
      {
        estudioId: "ecocardiograma-transtoracico",
        hallazgoEsperado: "Vegetación, absceso, dehiscencia (mayor de Duke)",
        requerido: true,
      },
      {
        estudioId: "biometria-hematica",
        hallazgoEsperado: "Anemia normocítica + elevación de reactantes",
        requerido: true,
      },
      {
        estudioId: "pet-ct-oncologico",
        hallazgoEsperado: "Captación valvular sugerente (criterio menor)",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "endocarditis",
    diagnosticoLabel: "Endocarditis infecciosa",
    confianza: "alta",
    workflowPasos: [
      "1. Sospecha clínica: fiebre + soplo nuevo o cambiante + estigmas embólicos",
      "2. 3 sets de hemocultivos ANTES de antibiótico",
      "3. Eco transtorácico → si negativo y alta sospecha: transesofágico",
      "4. Antibiótico empírico amplio (vancomicina + cefalosporina anti-pseudomona)",
      "5. Referir a equipo de endocarditis (cardio + infecto + cirugía)",
    ],
    alertas: [
      "Endocarditis con embolia cerebral previa o vegetación > 10 mm → cirugía urgente",
      "S. aureus es el más letal — cobertura debe incluirlo siempre",
    ],
    source: "Duke-ISCVID 2023 · Fowler · ESC Endocarditis 2023",
  },
  {
    id: "tb-pulmonar-confirmacion",
    nombre: "Tuberculosis pulmonar activa — confirmación diagnóstica",
    categoria: "infecto",
    descripcion:
      "Tos > 2 semanas + síntomas constitucionales. México: incidencia 25/100,000 (variable por estado).",
    estudiosClave: [
      {
        estudioId: "tac-torax-sin-contraste",
        hallazgoEsperado: "Cavitaciones apicales, infiltrado nodular, adenopatías hiliar",
        requerido: true,
      },
      {
        estudioId: "biometria-hematica",
        hallazgoEsperado: "Anemia normocítica + linfocitos bajos",
        requerido: true,
      },
      {
        estudioId: "broncoscopia",
        hallazgoEsperado: "Si esputo negativo y alta sospecha: lavado bronquial para BAAR",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "tuberculosis-active",
    diagnosticoLabel: "Tuberculosis pulmonar activa",
    confianza: "alta",
    workflowPasos: [
      "1. Sintomático respiratorio > 2 semanas → 3 esputos seriados para BAAR + GeneXpert",
      "2. Rx tórax: patrón clásico (apical + cavitaciones)",
      "3. Si esputo positivo: iniciar TAES (HRZE) ya en 1ra consulta",
      "4. Reportar a Programa Nacional de TB (obligatorio)",
      "5. Estudio de contactos cercanos",
    ],
    alertas: [
      "GeneXpert MTB/RIF detecta resistencia a rifampicina en 2 horas — pedir si disponible",
      "TAES (Tratamiento Acortado Estrictamente Supervisado): 2 meses HRZE + 4 meses HR",
      "Vigilar hepatotoxicidad mensual",
    ],
    source: "WHO TB Guidelines 2024 · CENAPRECE TAES",
  },

  // =================================================================
  // OTROS (1)
  // =================================================================
  {
    id: "anemia-ferropenica-causa",
    nombre: "Anemia ferropénica — investigación de causa",
    categoria: "hepato",
    descripcion:
      "Causa más común en mujer mexicana edad reproductiva: hipermenorrea + ENSANUT 13% prevalencia.",
    estudiosClave: [
      {
        estudioId: "biometria-hematica",
        hallazgoEsperado: "Hb < 12 (mujer) o < 13 (hombre) + VCM < 80",
        requerido: true,
      },
      {
        estudioId: "ferritina-saturacion",
        hallazgoEsperado: "Ferritina < 30 ng/mL confirma ferropenia",
        requerido: true,
      },
      {
        estudioId: "ego",
        hallazgoEsperado: "Descartar pérdida urinaria oculta",
        requerido: false,
      },
      {
        estudioId: "endoscopia-digestiva-alta",
        hallazgoEsperado: "Si > 50 años o sin causa obvia: descartar lesión GI alta",
        requerido: false,
      },
      {
        estudioId: "colonoscopia",
        hallazgoEsperado: "Si > 50 años: descartar lesión colon",
        requerido: false,
      },
    ],
    diagnosticoSugerido: "ferropenia_gi",
    diagnosticoLabel: "Anemia ferropénica + causa subyacente",
    confianza: "alta",
    workflowPasos: [
      "1. BH + ferritina + saturación de transferrina",
      "2. Mujer joven con hipermenorrea: tratar hierro + ginecología",
      "3. Mujer > 50 o sin causa obvia: EDA + colonoscopia",
      "4. Hierro VO 60-120 mg/día Fe elemental + vitamina C",
      "5. Reevaluar Hb a 8 semanas: debe subir > 1 g/dL",
    ],
    alertas: [
      "NUNCA recetar hierro VO sin investigar causa — riesgo de pasar por alto cáncer colorrectal",
      "Si malabsorción sospechada (celíaca): IgA tTG + biopsia duodenal",
    ],
    source: "WHO 2024 · ENSANUT MX 2023 · Camaschella NEJM 2023",
  },
];

// =================================================================
// Helpers
// =================================================================

export function findPatron(id: string): PatronMultiEstudio | undefined {
  return PATRONES_MULTI_ESTUDIO.find((p) => p.id === id);
}

export function patronesPorCategoria(
  categoria: CategoriaPatron,
): PatronMultiEstudio[] {
  return PATRONES_MULTI_ESTUDIO.filter((p) => p.categoria === categoria);
}

export function patronesQueUsanEstudio(
  estudioId: string,
): PatronMultiEstudio[] {
  return PATRONES_MULTI_ESTUDIO.filter((p) =>
    p.estudiosClave.some((e) => e.estudioId === estudioId),
  );
}

export const CATEGORIA_PATRON_LABELS: Record<CategoriaPatron, string> = {
  cardio: "Cardiología",
  endocrino: "Endocrinología",
  neuro: "Neurología",
  infecto: "Infectología",
  onco: "Oncología",
  gineco: "Gineco-oncología",
  renal: "Nefrología",
  hepato: "Hepatología / Hematología",
  respira: "Neumología",
};
