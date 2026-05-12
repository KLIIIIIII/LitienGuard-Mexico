/**
 * Knowledge base del motor de inferencia v3 — multidominio.
 *
 * 28 enfermedades · 51 findings · ~180 likelihood ratios todos respaldados
 * por literatura citada.
 *
 * Dominios cubiertos:
 *   - Cardiomiopatías / restrictivo / agudo (12 dx)
 *   - Endocrinología (6 dx)
 *   - Neurología (5 dx)
 *   - Infectología (5 dx)
 *
 * Fuentes principales por dominio:
 *
 * Cardio:
 *   - 2025 ACC Concise Clinical Guidance for ATTR-CM (JACC sept 2025)
 *   - Phelan · Heart 2012 · apical sparing strain
 *   - Westin · JACC 2022 · pre-cardiac amyloid
 *   - Grogan · Mayo Clin Proc 2021 · AI-ECG
 *   - AHA-ACC 2024 HCM Guidelines (Ommen)
 *   - Falk · JACC 2016 · cardiac amyloid algorithm
 *   - Maurer · NEJM 2018 ATTR-ACT (tafamidis)
 *   - Bouwer · EHJ 2024 · Fabry cardiomyopathy
 *   - Linhart · EHJ 2020 · Fabry cardiac
 *   - Caforio · EHJ 2013 · ESC myocarditis
 *   - Templin · NEJM 2015 · InterTAK takotsubo
 *   - Ghadri · EHJ 2018 · InterTAK criteria
 *   - Welch · Circulation 2014 · constrictive pericarditis
 *   - Geske · JACC 2016 · restrictive vs constrictive
 *   - Marcus · Circulation 2010 · ARVC Task Force
 *   - HRS 2014 · Cardiac sarcoidosis
 *   - Gillmore · Circulation 2016 · PYP scan ATTR-CM
 *
 * Endocrino:
 *   - Singer · NEJM 2021 · Hypothyroidism review
 *   - AACE/ACE 2012 · Hypothyroidism Guidelines (Garber)
 *   - Ross · Thyroid 2016 · ATA Hyperthyroidism Guidelines
 *   - Nieman · NEJM 2015 · Cushing's syndrome
 *   - Endocrine Society 2008 · Cushing Guidelines (Nieman)
 *   - Bornstein · J Clin Endocrinol Metab 2016 · Primary Adrenal Insufficiency
 *   - Lenders · J Clin Endocrinol Metab 2014 · Pheochromocytoma & Paraganglioma
 *   - Funder · J Clin Endocrinol Metab 2016 · Primary Aldosteronism Guidelines
 *
 * Neuro:
 *   - Powers · Stroke 2019 · AHA/ASA Acute Ischemic Stroke Guidelines
 *   - Hoh · Stroke 2023 · AHA/ASA aSAH Guidelines
 *   - Thompson · Lancet Neurol 2024 · McDonald Criteria MS (revised)
 *   - ICHD-3 · Cephalalgia 2018 · IHS Migraine Criteria
 *   - Postuma · Mov Disord 2015 · MDS Parkinson's Clinical Diagnostic Criteria
 *
 * Infecto:
 *   - Singer · JAMA 2016 · Sepsis-3 Definitions
 *   - Evans · Crit Care Med 2021 · Surviving Sepsis Campaign
 *   - Fowler · Clin Infect Dis 2023 · Duke-ISCVID 2023 Endocarditis Criteria
 *   - Baddour · Circulation 2015 · AHA Infective Endocarditis
 *   - Metlay · Am J Respir Crit Care Med 2019 · ATS/IDSA CAP Guidelines
 *   - van de Beek · NEJM 2016 · Acute bacterial meningitis
 *   - Tunkel · Clin Infect Dis 2004 · IDSA Bacterial Meningitis
 *   - WHO 2024 · Global Tuberculosis Report
 *   - Lewinsohn · Clin Infect Dis 2017 · ATS/IDSA TB Diagnosis Guidelines
 */

import type { Disease, Finding, LikelihoodRatio } from "./types";

// ============================================================
// Enfermedades candidatas — 28 dx en 4 dominios
// ============================================================
export const DISEASES: Disease[] = [
  // ---- Cardio (12) ----
  {
    id: "attr-cm",
    label: "ATTR-CM (amiloidosis cardíaca por transtiretina)",
    prior: 0.025,
  },
  {
    id: "al-amyloid",
    label: "AL amyloid (amiloidosis de cadenas ligeras)",
    prior: 0.012,
  },
  {
    id: "hfpef-idiopathic",
    label: "HFpEF idiopática / multifactorial",
    prior: 0.18,
  },
  {
    id: "hypertensive-hd",
    label: "Cardiopatía hipertensiva con LVH",
    prior: 0.085,
  },
  {
    id: "hcm",
    label: "Cardiomiopatía hipertrófica (HCM sarcomérica)",
    prior: 0.025,
  },
  {
    id: "cardiac-sarcoid",
    label: "Sarcoidosis cardíaca",
    prior: 0.015,
  },
  {
    id: "fabry",
    label: "Enfermedad de Fabry (cardíaca)",
    prior: 0.005,
  },
  {
    id: "myocarditis-acute",
    label: "Miocarditis aguda",
    prior: 0.025,
  },
  {
    id: "takotsubo",
    label: "Cardiomiopatía de Takotsubo",
    prior: 0.018,
  },
  {
    id: "constrictive-pericarditis",
    label: "Pericarditis constrictiva",
    prior: 0.012,
  },
  {
    id: "arvc",
    label: "Cardiomiopatía arritmogénica del VD (ARVC)",
    prior: 0.012,
  },
  {
    id: "other-cardio",
    label: "Otras cardiomiopatías / restrictivo",
    prior: 0.025,
  },

  // ---- Endocrino (6) ----
  {
    id: "hypothyroidism",
    label: "Hipotiroidismo primario",
    prior: 0.06,
  },
  {
    id: "hyperthyroidism",
    label: "Hipertiroidismo / tirotoxicosis",
    prior: 0.025,
  },
  {
    id: "cushing",
    label: "Síndrome de Cushing",
    prior: 0.005,
  },
  {
    id: "addison",
    label: "Insuficiencia suprarrenal primaria (Addison)",
    prior: 0.005,
  },
  {
    id: "pheochromocytoma",
    label: "Feocromocitoma / paraganglioma",
    prior: 0.003,
  },
  {
    id: "primary-hyperaldosteronism",
    label: "Hiperaldosteronismo primario",
    prior: 0.012,
  },

  // ---- Neuro (5) ----
  {
    id: "ischemic-stroke-acute",
    label: "ACV isquémico agudo",
    prior: 0.05,
  },
  {
    id: "sah",
    label: "Hemorragia subaracnoidea",
    prior: 0.008,
  },
  {
    id: "multiple-sclerosis",
    label: "Esclerosis múltiple",
    prior: 0.008,
  },
  {
    id: "migraine-aura",
    label: "Migraña con aura",
    prior: 0.07,
  },
  {
    id: "parkinsons",
    label: "Enfermedad de Parkinson",
    prior: 0.025,
  },

  // ---- Infecto (5) ----
  {
    id: "sepsis",
    label: "Sepsis / shock séptico",
    prior: 0.06,
  },
  {
    id: "endocarditis",
    label: "Endocarditis infecciosa",
    prior: 0.012,
  },
  {
    id: "cap-pneumonia",
    label: "Neumonía adquirida en la comunidad",
    prior: 0.08,
  },
  {
    id: "bacterial-meningitis",
    label: "Meningitis bacteriana aguda",
    prior: 0.008,
  },
  {
    id: "tuberculosis-active",
    label: "Tuberculosis pulmonar activa",
    prior: 0.012,
  },
];

// ============================================================
// Findings clínicos — 51 hallazgos en 6 categorías
// ============================================================
export const FINDINGS: Finding[] = [
  // ---------------- ECG (9) ----------------
  {
    id: "ecg-low-voltage-paradox",
    label: "ECG bajo voltaje con LVH eco",
    category: "ecg",
    detail: "QRS <5 mm en miembros con masa VI ↑ por eco",
  },
  {
    id: "ecg-pseudoinfarct",
    label: "Patrón pseudo-infarto en ECG",
    category: "ecg",
    detail: "Ondas Q anteriores sin antecedente de IAM",
  },
  {
    id: "ecg-conduction-disease",
    label: "Trastorno de conducción AV",
    category: "ecg",
    detail: "BAV 1°, 2° o BCRD/BCRI sin causa clara",
  },
  {
    id: "ecg-short-pr",
    label: "PR corto sin pre-excitación clásica",
    category: "ecg",
    detail: "PR <120 ms sin onda delta franca",
  },
  {
    id: "ecg-epsilon-wave",
    label: "Onda épsilon V1-V3",
    category: "ecg",
    detail: "Deflexión post-QRS de baja amplitud en precordiales derechas",
  },
  {
    id: "ecg-twi-right-precordial",
    label: "Inversión T en V1-V3 sin BCRD",
    category: "ecg",
    detail: "T negativa V1-V3 en adulto sin bloqueo de rama derecha",
  },
  {
    id: "ecg-stelevation-no-territory",
    label: "Elevación ST sin territorio coronario",
    category: "ecg",
    detail: "Difusa, no respeta distribución de coronaria epicárdica",
  },
  {
    id: "ecg-prolonged-qt",
    label: "QT prolongado adquirido",
    category: "ecg",
    detail: "QTc >470 ms (M) / 480 ms (F) sin fármaco que lo explique",
  },
  {
    id: "ecg-sinus-tachycardia-fixed",
    label: "Taquicardia sinusal sostenida",
    category: "ecg",
    detail: "FC >100 mantenida en reposo, no responde a maniobras",
  },

  // ---------------- Eco (8) ----------------
  {
    id: "echo-apical-sparing",
    label: "Apical sparing en strain longitudinal",
    category: "echo",
    detail: "Strain apical conservado, basal severamente reducido",
  },
  {
    id: "echo-thick-walls",
    label: "Engrosamiento ventricular >12 mm",
    category: "echo",
    detail: "Pared septal o posterior >12 mm",
  },
  {
    id: "echo-biatrial-enlarge",
    label: "Dilatación biauricular",
    category: "echo",
    detail: "Volumen indexado de ambas aurículas elevado",
  },
  {
    id: "echo-granular-sparkle",
    label: "Sparkle granular del miocardio",
    category: "echo",
    detail: "Apariencia granular/punteada característica",
  },
  {
    id: "echo-asymmetric-septal",
    label: "Hipertrofia septal asimétrica",
    category: "echo",
    detail: "Cociente septal/posterior >1.3",
  },
  {
    id: "echo-apical-ballooning",
    label: "Abalonamiento apical / disquinesia apical",
    category: "echo",
    detail: "Aquinesia apical con hipercinesia basal en sístole",
  },
  {
    id: "echo-rv-dilation-akinesia",
    label: "Dilatación VD con segmentos aquinéticos",
    category: "echo",
    detail: "VD dilatado con áreas aquinéticas/disquinéticas regionales",
  },
  {
    id: "echo-septal-bounce",
    label: "Rebote septal en diástole / variación respirofásica",
    category: "echo",
    detail: "Movimiento septal anormal diastólico + variación >25% mitral",
  },

  // ---------------- Lab (15) ----------------
  {
    id: "lab-ntprobnp-disproportionate",
    label: "NT-proBNP desproporcionado a NYHA",
    category: "lab",
    detail: "NT-proBNP >1000 con NYHA II",
  },
  {
    id: "lab-flc-abnormal",
    label: "Cociente FLC κ/λ anormal",
    category: "lab",
    detail: "Ratio <0.26 o >1.65",
  },
  {
    id: "lab-troponin-rising",
    label: "Troponina elevada/ascendente sin coronario",
    category: "lab",
    detail: "Hs-troponina alta con coronariografía sin obstrucción",
  },
  {
    id: "lab-pyp-scan-positive",
    label: "PYP scan grado 2-3",
    category: "lab",
    detail: "Captación miocárdica difusa grado 2 o 3 (Perugini)",
  },
  {
    id: "lab-alpha-gal-low",
    label: "α-galactosidasa A leucocitaria baja",
    category: "lab",
    detail: "Actividad enzimática baja en leucocitos (hombres)",
  },
  {
    id: "lab-tsh-elevated",
    label: "TSH elevada >5 mUI/L",
    category: "lab",
    detail: "Con T4 libre normal o baja",
  },
  {
    id: "lab-tsh-suppressed",
    label: "TSH suprimida <0.1 mUI/L",
    category: "lab",
    detail: "Con T4/T3 normal o elevadas",
  },
  {
    id: "lab-cortisol-am-low",
    label: "Cortisol matutino bajo <5 µg/dL",
    category: "lab",
    detail: "Cortisol AM con respuesta inadecuada a ACTH",
  },
  {
    id: "lab-cortisol-am-elevated",
    label: "Cortisol elevado / falla de supresión con dexametasona",
    category: "lab",
    detail: "UFC 24h elevado o no supresión con DXM 1mg nocturna",
  },
  {
    id: "lab-metanephrines-elevated",
    label: "Metanefrinas plasmáticas/urinarias elevadas",
    category: "lab",
    detail: "Metanefrinas o normetanefrinas >2x límite superior",
  },
  {
    id: "lab-hypokalemia",
    label: "Hipokalemia inexplicada <3.5 mEq/L",
    category: "lab",
    detail: "Sin uso de diuréticos ni pérdidas evidentes",
  },
  {
    id: "lab-blood-cultures-positive",
    label: "Hemocultivos positivos persistentes",
    category: "lab",
    detail: "≥2 sets positivos con organismo típico de endocarditis",
  },
  {
    id: "lab-lactate-elevated",
    label: "Lactato elevado >2 mmol/L",
    category: "lab",
    detail: "Con perfusión clínica comprometida",
  },
  {
    id: "lab-procalcitonin-elevated",
    label: "Procalcitonina elevada >0.5 ng/mL",
    category: "lab",
    detail: "Marcador bacteriano sistémico",
  },
  {
    id: "lab-chest-infiltrate",
    label: "Infiltrado pulmonar en Rx tórax",
    category: "lab",
    detail: "Consolidación, infiltrado intersticial o cavitación",
  },

  // ---------------- Historia (9) ----------------
  {
    id: "history-cts-bilateral",
    label: "Síndrome del túnel del carpo bilateral",
    category: "history",
    detail: "Especialmente con cirugía descompresiva previa",
  },
  {
    id: "history-family-neuropathy",
    label: "Historia familiar de neuropatía idiopática",
    category: "history",
  },
  {
    id: "history-family-scd",
    label: "Historia familiar de muerte súbita o HCM",
    category: "history",
    detail: "Familiar de 1° grado <50 años",
  },
  {
    id: "history-recent-viral",
    label: "Infección viral reciente (2-4 sem)",
    category: "history",
    detail: "Cuadro respiratorio o gastrointestinal viral previo",
  },
  {
    id: "history-emotional-stress",
    label: "Estrés emocional/físico severo reciente",
    category: "history",
    detail: "Trigger psicológico o físico mayor en las últimas 72 hrs",
  },
  {
    id: "history-fever",
    label: "Fiebre documentada >38°C",
    category: "history",
    detail: "Sostenida o picos, con o sin escalofríos",
  },
  {
    id: "history-thunderclap-headache",
    label: "Cefalea súbita en trueno",
    category: "history",
    detail: "Intensidad máxima alcanzada en <1 minuto",
  },
  {
    id: "history-night-sweats-weight-loss",
    label: "Sudoración nocturna + pérdida de peso",
    category: "history",
    detail: "Síntomas constitucionales >2 semanas",
  },
  {
    id: "history-bp-paroxysmal",
    label: "Hipertensión paroxística con sudoración / palpitaciones",
    category: "history",
    detail: "Episodios <1 hr con sudoración, cefalea, taquicardia",
  },

  // ---------------- Examen (9) ----------------
  {
    id: "exam-orthostasis",
    label: "Hipotensión ortostática / disautonomía",
    category: "exam",
  },
  {
    id: "exam-angiokeratoma",
    label: "Angiokeratomas cutáneos",
    category: "exam",
    detail: "Pápulas rojo-púrpura en pelvis, ombligo, escroto",
  },
  {
    id: "exam-focal-deficit-acute",
    label: "Déficit neurológico focal de inicio agudo",
    category: "exam",
    detail: "Hemiparesia, afasia, disartria, hemianopsia <24 hrs",
  },
  {
    id: "exam-meningismus",
    label: "Rigidez nucal / signos meníngeos",
    category: "exam",
    detail: "Rigidez nucal + Kernig o Brudzinski positivos",
  },
  {
    id: "exam-new-murmur",
    label: "Soplo cardíaco nuevo",
    category: "exam",
    detail: "Regurgitante o cambio respecto a exploraciones previas",
  },
  {
    id: "exam-altered-mental-status",
    label: "Alteración del estado mental",
    category: "exam",
    detail: "Confusión, somnolencia, agitación o coma de inicio agudo",
  },
  {
    id: "exam-bradykinesia-tremor",
    label: "Bradiquinesia + temblor de reposo",
    category: "exam",
    detail: "Lentitud progresiva con temblor 4-6 Hz unilateral inicial",
  },
  {
    id: "exam-cushingoid-features",
    label: "Hábito cushingoide",
    category: "exam",
    detail: "Facies de luna + giba dorsal + obesidad central + estrías violáceas",
  },
  {
    id: "exam-hyperpigmentation",
    label: "Hiperpigmentación palmar / mucosa oral",
    category: "exam",
    detail: "Pliegues palmares, mucosa oral, areolas — patrón addisoniano",
  },

  // ---------------- Genética (1) ----------------
  {
    id: "genetic-gla-mutation",
    label: "Mutación GLA conocida",
    category: "genetic",
    detail: "Variante patogénica confirmada en gen GLA (Fabry)",
  },
];

// ============================================================
// Likelihood ratios — ~180 pares (finding, disease) con LR+ y LR-
// LRs ≈ 1 (no informativos) se omiten para mantener la matriz manejable.
// ============================================================
export const LIKELIHOOD_RATIOS: LikelihoodRatio[] = [
  // ===== ATTR-CM =====
  {
    finding: "ecg-low-voltage-paradox",
    disease: "attr-cm",
    lrPlus: 3.5,
    lrMinus: 0.65,
    source: "Mayo Clin Proc 2021 · Grogan · AI-ECG validation set",
    confidence: "high",
  },
  {
    finding: "ecg-pseudoinfarct",
    disease: "attr-cm",
    lrPlus: 2.8,
    lrMinus: 0.85,
    source: "Falk · JACC 2016 · Cardiac Amyloid Review",
    confidence: "medium",
  },
  {
    finding: "ecg-conduction-disease",
    disease: "attr-cm",
    lrPlus: 2.2,
    lrMinus: 0.8,
    source: "2025 ACC Concise Clinical Guidance for ATTR-CM · JACC",
    confidence: "medium",
  },
  {
    finding: "echo-apical-sparing",
    disease: "attr-cm",
    lrPlus: 12,
    lrMinus: 0.35,
    source: "Phelan · Heart 2012 · n=130 · sens 93% spec 82%",
    confidence: "high",
  },
  {
    finding: "echo-thick-walls",
    disease: "attr-cm",
    lrPlus: 2.5,
    lrMinus: 0.2,
    source: "Falk · JACC 2016",
    confidence: "high",
  },
  {
    finding: "echo-biatrial-enlarge",
    disease: "attr-cm",
    lrPlus: 3.2,
    lrMinus: 0.45,
    source: "Falk · JACC 2016 · diagnostic algorithm",
    confidence: "medium",
  },
  {
    finding: "echo-granular-sparkle",
    disease: "attr-cm",
    lrPlus: 2.6,
    lrMinus: 0.85,
    source: "Falk · JACC 2016 · review observational",
    confidence: "medium",
  },
  {
    finding: "lab-ntprobnp-disproportionate",
    disease: "attr-cm",
    lrPlus: 2.1,
    lrMinus: 0.45,
    source: "Maurer · NEJM 2018 ATTR-ACT · baseline characteristics",
    confidence: "medium",
  },
  {
    finding: "lab-flc-abnormal",
    disease: "attr-cm",
    lrPlus: 0.6,
    lrMinus: 1.2,
    source: "Falk · JACC 2016 · differential AL vs ATTR",
    confidence: "high",
  },
  {
    finding: "lab-pyp-scan-positive",
    disease: "attr-cm",
    lrPlus: 35,
    lrMinus: 0.05,
    source: "Gillmore · Circulation 2016 · PYP grade 2-3 spec 100% sens 97%",
    confidence: "high",
  },
  {
    finding: "history-cts-bilateral",
    disease: "attr-cm",
    lrPlus: 6.0,
    lrMinus: 0.5,
    source: "Westin · JACC 2022 · CTS precedes ATTR-CM 5-10 years",
    confidence: "high",
  },
  {
    finding: "history-family-neuropathy",
    disease: "attr-cm",
    lrPlus: 4.0,
    lrMinus: 0.7,
    source: "2025 ACC Concise Clinical Guidance · ATTRv hereditaria",
    confidence: "high",
  },
  {
    finding: "exam-orthostasis",
    disease: "attr-cm",
    lrPlus: 2.4,
    lrMinus: 0.7,
    source: "Coelho · NEJM 2013 · autonomic in ATTRv",
    confidence: "medium",
  },

  // ===== AL Amyloid =====
  {
    finding: "lab-flc-abnormal",
    disease: "al-amyloid",
    lrPlus: 25,
    lrMinus: 0.05,
    source: "Falk · JACC 2016 · FLC + electroforesis screening AL",
    confidence: "high",
  },
  {
    finding: "echo-apical-sparing",
    disease: "al-amyloid",
    lrPlus: 8,
    lrMinus: 0.35,
    source: "Phelan · Heart 2012 · AL subset",
    confidence: "high",
  },
  {
    finding: "ecg-low-voltage-paradox",
    disease: "al-amyloid",
    lrPlus: 4.5,
    lrMinus: 0.55,
    source: "Falk · JACC 2016",
    confidence: "high",
  },
  {
    finding: "echo-biatrial-enlarge",
    disease: "al-amyloid",
    lrPlus: 3.0,
    lrMinus: 0.45,
    source: "Falk · JACC 2016",
    confidence: "medium",
  },
  {
    finding: "exam-orthostasis",
    disease: "al-amyloid",
    lrPlus: 2.8,
    lrMinus: 0.65,
    source: "Falk · JACC 2016",
    confidence: "medium",
  },
  {
    finding: "lab-pyp-scan-positive",
    disease: "al-amyloid",
    lrPlus: 1.5,
    lrMinus: 0.9,
    source: "Gillmore · Circulation 2016 · ~20% AL PYP+ grado leve",
    confidence: "medium",
  },

  // ===== HCM =====
  {
    finding: "echo-asymmetric-septal",
    disease: "hcm",
    lrPlus: 8,
    lrMinus: 0.18,
    source: "AHA-ACC HCM 2024 Guidelines · diagnostic criteria",
    confidence: "high",
  },
  {
    finding: "echo-thick-walls",
    disease: "hcm",
    lrPlus: 3.5,
    lrMinus: 0.1,
    source: "AHA-ACC HCM 2024 Guidelines",
    confidence: "high",
  },
  {
    finding: "history-family-scd",
    disease: "hcm",
    lrPlus: 10,
    lrMinus: 0.7,
    source: "AHA-ACC HCM 2024 · familial history HCM",
    confidence: "high",
  },
  {
    finding: "ecg-pseudoinfarct",
    disease: "hcm",
    lrPlus: 2.0,
    lrMinus: 0.85,
    source: "AHA-ACC HCM 2024",
    confidence: "medium",
  },
  {
    finding: "ecg-low-voltage-paradox",
    disease: "hcm",
    lrPlus: 0.5,
    lrMinus: 1.1,
    source: "AHA-ACC HCM 2024 · voltaje alto típicamente",
    confidence: "medium",
  },
  {
    finding: "history-cts-bilateral",
    disease: "hcm",
    lrPlus: 0.7,
    lrMinus: 1.05,
    source: "Westin · JACC 2022 · differential vs amyloid",
    confidence: "medium",
  },
  {
    finding: "ecg-twi-right-precordial",
    disease: "hcm",
    lrPlus: 2.2,
    lrMinus: 0.9,
    source: "Yamaguchi · Am J Cardiol 1979 · HCM apical TWI gigante",
    confidence: "medium",
  },

  // ===== Cardiopatía hipertensiva =====
  {
    finding: "echo-thick-walls",
    disease: "hypertensive-hd",
    lrPlus: 1.8,
    lrMinus: 0.4,
    source: "ESC HTN 2018 · LVH remodeling",
    confidence: "medium",
  },
  {
    finding: "echo-asymmetric-septal",
    disease: "hypertensive-hd",
    lrPlus: 0.8,
    lrMinus: 1.05,
    source: "ESC HTN 2018 · concentric remodeling más común",
    confidence: "medium",
  },
  {
    finding: "ecg-low-voltage-paradox",
    disease: "hypertensive-hd",
    lrPlus: 0.4,
    lrMinus: 1.15,
    source: "ESC HTN 2018 · LVH eléctrico esperado",
    confidence: "high",
  },
  {
    finding: "echo-apical-sparing",
    disease: "hypertensive-hd",
    lrPlus: 0.5,
    lrMinus: 1.1,
    source: "Phelan · Heart 2012 · controls",
    confidence: "high",
  },

  // ===== HFpEF idiopática =====
  {
    finding: "echo-thick-walls",
    disease: "hfpef-idiopathic",
    lrPlus: 1.0,
    lrMinus: 1.0,
    source: "ESC HF 2021 · HFpEF heterogénea",
    confidence: "low",
  },
  {
    finding: "lab-ntprobnp-disproportionate",
    disease: "hfpef-idiopathic",
    lrPlus: 1.0,
    lrMinus: 0.9,
    source: "ESC HF 2021",
    confidence: "low",
  },
  {
    finding: "echo-apical-sparing",
    disease: "hfpef-idiopathic",
    lrPlus: 0.3,
    lrMinus: 1.1,
    source: "Phelan · Heart 2012 · controls HFpEF",
    confidence: "high",
  },
  {
    finding: "history-cts-bilateral",
    disease: "hfpef-idiopathic",
    lrPlus: 0.4,
    lrMinus: 1.1,
    source: "Westin · JACC 2022 · controls",
    confidence: "high",
  },

  // ===== Sarcoidosis cardíaca =====
  {
    finding: "ecg-conduction-disease",
    disease: "cardiac-sarcoid",
    lrPlus: 5.5,
    lrMinus: 0.4,
    source: "HRS 2014 Sarcoidosis · BAV alto grado en <60 años",
    confidence: "high",
  },
  {
    finding: "echo-thick-walls",
    disease: "cardiac-sarcoid",
    lrPlus: 1.5,
    lrMinus: 0.7,
    source: "HRS 2014 Sarcoidosis · patchy involvement",
    confidence: "medium",
  },
  {
    finding: "echo-apical-sparing",
    disease: "cardiac-sarcoid",
    lrPlus: 0.5,
    lrMinus: 1.1,
    source: "HRS 2014 Sarcoidosis",
    confidence: "medium",
  },
  {
    finding: "lab-troponin-rising",
    disease: "cardiac-sarcoid",
    lrPlus: 1.8,
    lrMinus: 0.85,
    source: "HRS 2014 Sarcoidosis · active inflammation",
    confidence: "medium",
  },

  // ===== Fabry =====
  {
    finding: "ecg-short-pr",
    disease: "fabry",
    lrPlus: 7,
    lrMinus: 0.4,
    source: "Linhart · EHJ 2020 · ECG features Fabry",
    confidence: "high",
  },
  {
    finding: "echo-thick-walls",
    disease: "fabry",
    lrPlus: 3,
    lrMinus: 0.15,
    source: "Bouwer · EHJ 2024 · LVH casi universal en Fabry cardíaco",
    confidence: "high",
  },
  {
    finding: "echo-asymmetric-septal",
    disease: "fabry",
    lrPlus: 0.8,
    lrMinus: 1.05,
    source: "Linhart · EHJ 2020 · concéntrica más común",
    confidence: "medium",
  },
  {
    finding: "echo-apical-sparing",
    disease: "fabry",
    lrPlus: 0.6,
    lrMinus: 1.05,
    source: "Bouwer · EHJ 2024 · strain Fabry vs amyloid",
    confidence: "medium",
  },
  {
    finding: "exam-angiokeratoma",
    disease: "fabry",
    lrPlus: 30,
    lrMinus: 0.7,
    source: "Linhart · EHJ 2020 · angiokeratoma patognomónico",
    confidence: "high",
  },
  {
    finding: "genetic-gla-mutation",
    disease: "fabry",
    lrPlus: 200,
    lrMinus: 0.05,
    source: "Linhart · EHJ 2020 · diagnóstico genético confirmatorio",
    confidence: "high",
  },
  {
    finding: "lab-alpha-gal-low",
    disease: "fabry",
    lrPlus: 50,
    lrMinus: 0.1,
    source: "Linhart · EHJ 2020 · enzima leucocitaria en hombres",
    confidence: "high",
  },
  {
    finding: "history-family-neuropathy",
    disease: "fabry",
    lrPlus: 3.5,
    lrMinus: 0.7,
    source: "Bouwer · EHJ 2024 · neuropatía dolorosa Fabry",
    confidence: "medium",
  },

  // ===== Miocarditis aguda =====
  {
    finding: "history-recent-viral",
    disease: "myocarditis-acute",
    lrPlus: 6,
    lrMinus: 0.35,
    source: "Caforio · EHJ 2013 · ESC myocarditis position paper",
    confidence: "high",
  },
  {
    finding: "lab-troponin-rising",
    disease: "myocarditis-acute",
    lrPlus: 7,
    lrMinus: 0.2,
    source: "Caforio · EHJ 2013 · troponina criterio diagnóstico",
    confidence: "high",
  },
  {
    finding: "ecg-stelevation-no-territory",
    disease: "myocarditis-acute",
    lrPlus: 5,
    lrMinus: 0.5,
    source: "Caforio · EHJ 2013 · pericarditis acompañante",
    confidence: "high",
  },
  {
    finding: "ecg-prolonged-qt",
    disease: "myocarditis-acute",
    lrPlus: 2.5,
    lrMinus: 0.8,
    source: "Caforio · EHJ 2013",
    confidence: "medium",
  },
  {
    finding: "echo-thick-walls",
    disease: "myocarditis-acute",
    lrPlus: 1.6,
    lrMinus: 0.75,
    source: "Caforio · EHJ 2013 · edema miocárdico",
    confidence: "low",
  },

  // ===== Takotsubo =====
  {
    finding: "history-emotional-stress",
    disease: "takotsubo",
    lrPlus: 15,
    lrMinus: 0.3,
    source: "Templin · NEJM 2015 · InterTAK registry n=1750",
    confidence: "high",
  },
  {
    finding: "echo-apical-ballooning",
    disease: "takotsubo",
    lrPlus: 35,
    lrMinus: 0.1,
    source: "Ghadri · EHJ 2018 · InterTAK criteria typical",
    confidence: "high",
  },
  {
    finding: "lab-troponin-rising",
    disease: "takotsubo",
    lrPlus: 3,
    lrMinus: 0.4,
    source: "Templin · NEJM 2015 · troponina elevada modesta",
    confidence: "high",
  },
  {
    finding: "ecg-stelevation-no-territory",
    disease: "takotsubo",
    lrPlus: 3.5,
    lrMinus: 0.5,
    source: "Ghadri · EHJ 2018",
    confidence: "high",
  },
  {
    finding: "ecg-prolonged-qt",
    disease: "takotsubo",
    lrPlus: 4,
    lrMinus: 0.5,
    source: "Ghadri · EHJ 2018 · QT prolongado subagudo característico",
    confidence: "high",
  },

  // ===== Pericarditis constrictiva =====
  {
    finding: "echo-septal-bounce",
    disease: "constrictive-pericarditis",
    lrPlus: 18,
    lrMinus: 0.2,
    source: "Welch · Circulation 2014 · Mayo criteria · sens 94% spec 81%",
    confidence: "high",
  },
  {
    finding: "echo-thick-walls",
    disease: "constrictive-pericarditis",
    lrPlus: 0.6,
    lrMinus: 1.1,
    source: "Geske · JACC 2016 · paredes normales en constrictiva pura",
    confidence: "high",
  },
  {
    finding: "echo-biatrial-enlarge",
    disease: "constrictive-pericarditis",
    lrPlus: 1.2,
    lrMinus: 0.85,
    source: "Geske · JACC 2016",
    confidence: "low",
  },
  {
    finding: "echo-apical-sparing",
    disease: "constrictive-pericarditis",
    lrPlus: 0.6,
    lrMinus: 1.05,
    source: "Geske · JACC 2016 · strain conservado",
    confidence: "medium",
  },
  {
    finding: "lab-ntprobnp-disproportionate",
    disease: "constrictive-pericarditis",
    lrPlus: 0.4,
    lrMinus: 1.2,
    source: "Geske · JACC 2016 · BNP relativamente bajo (<200)",
    confidence: "high",
  },

  // ===== ARVC =====
  {
    finding: "ecg-epsilon-wave",
    disease: "arvc",
    lrPlus: 50,
    lrMinus: 0.7,
    source: "Marcus · Circulation 2010 · ARVC Task Force criterio mayor",
    confidence: "high",
  },
  {
    finding: "ecg-twi-right-precordial",
    disease: "arvc",
    lrPlus: 9,
    lrMinus: 0.3,
    source: "Marcus · Circulation 2010 · TWI V1-V3 criterio mayor",
    confidence: "high",
  },
  {
    finding: "echo-rv-dilation-akinesia",
    disease: "arvc",
    lrPlus: 22,
    lrMinus: 0.25,
    source: "Marcus · Circulation 2010 · imaging criterio mayor",
    confidence: "high",
  },
  {
    finding: "history-family-scd",
    disease: "arvc",
    lrPlus: 6,
    lrMinus: 0.7,
    source: "Marcus · Circulation 2010 · familial component ARVC",
    confidence: "high",
  },
  {
    finding: "echo-thick-walls",
    disease: "arvc",
    lrPlus: 0.5,
    lrMinus: 1.05,
    source: "Marcus · Circulation 2010 · VI usualmente normal",
    confidence: "medium",
  },

  // ===== Hipotiroidismo =====
  {
    finding: "lab-tsh-elevated",
    disease: "hypothyroidism",
    lrPlus: 40,
    lrMinus: 0.05,
    source: "AACE/ACE 2012 · Garber · TSH elevada criterio bioquímico definitorio",
    confidence: "high",
  },
  {
    finding: "lab-tsh-suppressed",
    disease: "hypothyroidism",
    lrPlus: 0.05,
    lrMinus: 1.4,
    source: "AACE/ACE 2012 · TSH suprimida descarta hipo primario",
    confidence: "high",
  },
  {
    finding: "ecg-sinus-tachycardia-fixed",
    disease: "hypothyroidism",
    lrPlus: 0.4,
    lrMinus: 1.1,
    source: "Singer · NEJM 2021 · bradicardia más común en hipo",
    confidence: "medium",
  },
  {
    finding: "lab-ntprobnp-disproportionate",
    disease: "hypothyroidism",
    lrPlus: 1.4,
    lrMinus: 0.85,
    source: "Singer · NEJM 2021 · derrame pericárdico mixedematoso",
    confidence: "low",
  },

  // ===== Hipertiroidismo =====
  {
    finding: "lab-tsh-suppressed",
    disease: "hyperthyroidism",
    lrPlus: 50,
    lrMinus: 0.03,
    source: "Ross · Thyroid 2016 · ATA Hyperthyroidism · TSH supresada criterio",
    confidence: "high",
  },
  {
    finding: "lab-tsh-elevated",
    disease: "hyperthyroidism",
    lrPlus: 0.05,
    lrMinus: 1.3,
    source: "Ross · Thyroid 2016 · TSH alta descarta hiper primario",
    confidence: "high",
  },
  {
    finding: "ecg-sinus-tachycardia-fixed",
    disease: "hyperthyroidism",
    lrPlus: 5,
    lrMinus: 0.4,
    source: "Ross · Thyroid 2016 · taquicardia sinusal manifestación clave",
    confidence: "high",
  },
  {
    finding: "lab-ntprobnp-disproportionate",
    disease: "hyperthyroidism",
    lrPlus: 1.6,
    lrMinus: 0.85,
    source: "Ross · Thyroid 2016 · gasto cardíaco aumentado",
    confidence: "medium",
  },

  // ===== Síndrome de Cushing =====
  {
    finding: "lab-cortisol-am-elevated",
    disease: "cushing",
    lrPlus: 35,
    lrMinus: 0.1,
    source: "Nieman · NEJM 2015 · UFC + DXM supresión screening sens 95%",
    confidence: "high",
  },
  {
    finding: "lab-cortisol-am-low",
    disease: "cushing",
    lrPlus: 0.02,
    lrMinus: 1.3,
    source: "Endocrine Society 2008 · Cushing · cortisol bajo descarta",
    confidence: "high",
  },
  {
    finding: "exam-cushingoid-features",
    disease: "cushing",
    lrPlus: 18,
    lrMinus: 0.4,
    source: "Nieman · NEJM 2015 · estrías violáceas + miopatía proximal",
    confidence: "high",
  },
  {
    finding: "lab-hypokalemia",
    disease: "cushing",
    lrPlus: 4,
    lrMinus: 0.85,
    source: "Nieman · NEJM 2015 · mineralocorticoide-like ectopic ACTH",
    confidence: "medium",
  },

  // ===== Addison =====
  {
    finding: "lab-cortisol-am-low",
    disease: "addison",
    lrPlus: 30,
    lrMinus: 0.1,
    source: "Bornstein · JCEM 2016 · cortisol AM <5 + ACTH high criterio",
    confidence: "high",
  },
  {
    finding: "lab-cortisol-am-elevated",
    disease: "addison",
    lrPlus: 0.02,
    lrMinus: 1.3,
    source: "Bornstein · JCEM 2016 · cortisol alto descarta",
    confidence: "high",
  },
  {
    finding: "exam-hyperpigmentation",
    disease: "addison",
    lrPlus: 25,
    lrMinus: 0.45,
    source: "Bornstein · JCEM 2016 · ACTH-driven MSH effect, patognomónico",
    confidence: "high",
  },
  {
    finding: "exam-orthostasis",
    disease: "addison",
    lrPlus: 3.5,
    lrMinus: 0.6,
    source: "Bornstein · JCEM 2016 · hipotensión por deficiencia mineralocorticoide",
    confidence: "high",
  },
  {
    finding: "history-fever",
    disease: "addison",
    lrPlus: 2.5,
    lrMinus: 0.85,
    source: "Bornstein · JCEM 2016 · crisis suprarrenal puede simular sepsis",
    confidence: "medium",
  },

  // ===== Feocromocitoma =====
  {
    finding: "lab-metanephrines-elevated",
    disease: "pheochromocytoma",
    lrPlus: 80,
    lrMinus: 0.03,
    source: "Lenders · JCEM 2014 · metanefrinas fraccionadas sens 99%",
    confidence: "high",
  },
  {
    finding: "history-bp-paroxysmal",
    disease: "pheochromocytoma",
    lrPlus: 20,
    lrMinus: 0.35,
    source: "Lenders · JCEM 2014 · tríada cefalea+sudoración+palpitaciones",
    confidence: "high",
  },
  {
    finding: "ecg-sinus-tachycardia-fixed",
    disease: "pheochromocytoma",
    lrPlus: 3,
    lrMinus: 0.75,
    source: "Lenders · JCEM 2014 · catecolaminas circulantes",
    confidence: "medium",
  },
  {
    finding: "lab-hypokalemia",
    disease: "pheochromocytoma",
    lrPlus: 0.7,
    lrMinus: 1.05,
    source: "Lenders · JCEM 2014 · sin patrón consistente",
    confidence: "low",
  },

  // ===== Hiperaldosteronismo primario =====
  {
    finding: "lab-hypokalemia",
    disease: "primary-hyperaldosteronism",
    lrPlus: 12,
    lrMinus: 0.55,
    source: "Funder · JCEM 2016 · K+ bajo en 40% PA, criterio screening",
    confidence: "high",
  },
  {
    finding: "history-bp-paroxysmal",
    disease: "primary-hyperaldosteronism",
    lrPlus: 0.5,
    lrMinus: 1.1,
    source: "Funder · JCEM 2016 · HTN sostenida no paroxística típicamente",
    confidence: "medium",
  },
  {
    finding: "lab-metanephrines-elevated",
    disease: "primary-hyperaldosteronism",
    lrPlus: 0.5,
    lrMinus: 1.05,
    source: "Funder · JCEM 2016 · diferencial vs feocromocitoma",
    confidence: "medium",
  },

  // ===== ACV isquémico agudo =====
  {
    finding: "exam-focal-deficit-acute",
    disease: "ischemic-stroke-acute",
    lrPlus: 18,
    lrMinus: 0.1,
    source: "Powers · Stroke 2019 · AHA/ASA déficit focal súbito criterio clave",
    confidence: "high",
  },
  {
    finding: "history-thunderclap-headache",
    disease: "ischemic-stroke-acute",
    lrPlus: 0.5,
    lrMinus: 1.1,
    source: "Powers · Stroke 2019 · cefalea más común en hemorrágico",
    confidence: "high",
  },
  {
    finding: "exam-altered-mental-status",
    disease: "ischemic-stroke-acute",
    lrPlus: 2.5,
    lrMinus: 0.8,
    source: "Powers · Stroke 2019 · grandes territorios o tálamo",
    confidence: "medium",
  },
  {
    finding: "exam-meningismus",
    disease: "ischemic-stroke-acute",
    lrPlus: 0.4,
    lrMinus: 1.05,
    source: "Powers · Stroke 2019 · diferencial vs HSA y meningitis",
    confidence: "medium",
  },

  // ===== HSA (Hemorragia subaracnoidea) =====
  {
    finding: "history-thunderclap-headache",
    disease: "sah",
    lrPlus: 35,
    lrMinus: 0.1,
    source: "Hoh · Stroke 2023 · AHA/ASA aSAH · trueno cefalea criterio mayor",
    confidence: "high",
  },
  {
    finding: "exam-meningismus",
    disease: "sah",
    lrPlus: 8,
    lrMinus: 0.5,
    source: "Hoh · Stroke 2023 · meningismo por sangre subaracnoidea",
    confidence: "high",
  },
  {
    finding: "exam-altered-mental-status",
    disease: "sah",
    lrPlus: 4,
    lrMinus: 0.55,
    source: "Hoh · Stroke 2023 · Hunt-Hess grado II-V",
    confidence: "high",
  },
  {
    finding: "exam-focal-deficit-acute",
    disease: "sah",
    lrPlus: 2.5,
    lrMinus: 0.75,
    source: "Hoh · Stroke 2023 · vasoespasmo o sangrado focal",
    confidence: "medium",
  },

  // ===== Esclerosis múltiple =====
  {
    finding: "exam-focal-deficit-acute",
    disease: "multiple-sclerosis",
    lrPlus: 3,
    lrMinus: 0.4,
    source: "Thompson · Lancet Neurol 2024 · McDonald 2024 · brote clínico",
    confidence: "high",
  },
  {
    finding: "history-thunderclap-headache",
    disease: "multiple-sclerosis",
    lrPlus: 0.3,
    lrMinus: 1.05,
    source: "Thompson · Lancet Neurol 2024 · cefalea atípica MS",
    confidence: "medium",
  },
  {
    finding: "exam-altered-mental-status",
    disease: "multiple-sclerosis",
    lrPlus: 0.6,
    lrMinus: 1.05,
    source: "Thompson · Lancet Neurol 2024 · estado mental usualmente conservado",
    confidence: "medium",
  },

  // ===== Migraña con aura =====
  {
    finding: "history-thunderclap-headache",
    disease: "migraine-aura",
    lrPlus: 0.4,
    lrMinus: 1.05,
    source: "ICHD-3 2018 · IHS · cefalea típicamente moderada-grave gradual",
    confidence: "high",
  },
  {
    finding: "exam-focal-deficit-acute",
    disease: "migraine-aura",
    lrPlus: 4,
    lrMinus: 0.5,
    source: "ICHD-3 2018 · aura visual/sensitiva reversible",
    confidence: "high",
  },
  {
    finding: "exam-meningismus",
    disease: "migraine-aura",
    lrPlus: 0.2,
    lrMinus: 1.05,
    source: "ICHD-3 2018 · sin signos meníngeos",
    confidence: "high",
  },
  {
    finding: "history-fever",
    disease: "migraine-aura",
    lrPlus: 0.3,
    lrMinus: 1.05,
    source: "ICHD-3 2018 · sin fiebre en migraña primaria",
    confidence: "high",
  },

  // ===== Parkinson =====
  {
    finding: "exam-bradykinesia-tremor",
    disease: "parkinsons",
    lrPlus: 25,
    lrMinus: 0.05,
    source: "Postuma · Mov Disord 2015 · MDS criterio nuclear obligatorio",
    confidence: "high",
  },
  {
    finding: "exam-focal-deficit-acute",
    disease: "parkinsons",
    lrPlus: 0.1,
    lrMinus: 1.05,
    source: "Postuma · Mov Disord 2015 · curso insidioso, no agudo",
    confidence: "high",
  },
  {
    finding: "exam-orthostasis",
    disease: "parkinsons",
    lrPlus: 2.5,
    lrMinus: 0.85,
    source: "Postuma · Mov Disord 2015 · disautonomía en EP",
    confidence: "medium",
  },

  // ===== Sepsis =====
  {
    finding: "lab-lactate-elevated",
    disease: "sepsis",
    lrPlus: 8,
    lrMinus: 0.35,
    source: "Singer · JAMA 2016 · Sepsis-3 · lactato >2 marca shock séptico",
    confidence: "high",
  },
  {
    finding: "history-fever",
    disease: "sepsis",
    lrPlus: 4,
    lrMinus: 0.5,
    source: "Evans · CCM 2021 · SSC · fiebre componente SIRS clásico",
    confidence: "high",
  },
  {
    finding: "lab-procalcitonin-elevated",
    disease: "sepsis",
    lrPlus: 5,
    lrMinus: 0.45,
    source: "Evans · CCM 2021 · PCT marcador bacteriano sistémico",
    confidence: "high",
  },
  {
    finding: "exam-altered-mental-status",
    disease: "sepsis",
    lrPlus: 3.5,
    lrMinus: 0.6,
    source: "Singer · JAMA 2016 · qSOFA Glasgow <15",
    confidence: "high",
  },
  {
    finding: "ecg-sinus-tachycardia-fixed",
    disease: "sepsis",
    lrPlus: 3,
    lrMinus: 0.5,
    source: "Evans · CCM 2021 · FC >90 SIRS",
    confidence: "medium",
  },
  {
    finding: "lab-blood-cultures-positive",
    disease: "sepsis",
    lrPlus: 12,
    lrMinus: 0.5,
    source: "Evans · CCM 2021 · bacteremia confirma origen infeccioso",
    confidence: "high",
  },

  // ===== Endocarditis infecciosa =====
  {
    finding: "lab-blood-cultures-positive",
    disease: "endocarditis",
    lrPlus: 30,
    lrMinus: 0.15,
    source: "Fowler · CID 2023 · Duke-ISCVID · hemocultivos criterio mayor",
    confidence: "high",
  },
  {
    finding: "exam-new-murmur",
    disease: "endocarditis",
    lrPlus: 15,
    lrMinus: 0.35,
    source: "Baddour · Circulation 2015 · AHA · soplo nuevo criterio mayor",
    confidence: "high",
  },
  {
    finding: "history-fever",
    disease: "endocarditis",
    lrPlus: 6,
    lrMinus: 0.2,
    source: "Fowler · CID 2023 · fiebre >38° criterio menor Duke",
    confidence: "high",
  },
  {
    finding: "lab-procalcitonin-elevated",
    disease: "endocarditis",
    lrPlus: 2.5,
    lrMinus: 0.75,
    source: "Baddour · Circulation 2015 · bacteremia y proceso inflamatorio",
    confidence: "medium",
  },
  {
    finding: "exam-focal-deficit-acute",
    disease: "endocarditis",
    lrPlus: 3,
    lrMinus: 0.85,
    source: "Baddour · Circulation 2015 · embolismo séptico cerebral",
    confidence: "medium",
  },

  // ===== Neumonía adquirida en la comunidad =====
  {
    finding: "lab-chest-infiltrate",
    disease: "cap-pneumonia",
    lrPlus: 25,
    lrMinus: 0.05,
    source: "Metlay · AJRCCM 2019 · ATS/IDSA · infiltrado radiológico definitorio",
    confidence: "high",
  },
  {
    finding: "history-fever",
    disease: "cap-pneumonia",
    lrPlus: 3.5,
    lrMinus: 0.4,
    source: "Metlay · AJRCCM 2019 · fiebre con síntomas respiratorios",
    confidence: "high",
  },
  {
    finding: "lab-procalcitonin-elevated",
    disease: "cap-pneumonia",
    lrPlus: 3,
    lrMinus: 0.55,
    source: "Metlay · AJRCCM 2019 · PCT favorece etiología bacteriana",
    confidence: "medium",
  },
  {
    finding: "ecg-sinus-tachycardia-fixed",
    disease: "cap-pneumonia",
    lrPlus: 1.8,
    lrMinus: 0.75,
    source: "Metlay · AJRCCM 2019 · respuesta inflamatoria sistémica",
    confidence: "low",
  },
  {
    finding: "lab-lactate-elevated",
    disease: "cap-pneumonia",
    lrPlus: 1.6,
    lrMinus: 0.85,
    source: "Metlay · AJRCCM 2019 · sepsis pulmonar severa",
    confidence: "low",
  },

  // ===== Meningitis bacteriana aguda =====
  {
    finding: "exam-meningismus",
    disease: "bacterial-meningitis",
    lrPlus: 22,
    lrMinus: 0.2,
    source: "van de Beek · NEJM 2016 · rigidez nucal criterio clínico clave",
    confidence: "high",
  },
  {
    finding: "history-fever",
    disease: "bacterial-meningitis",
    lrPlus: 8,
    lrMinus: 0.15,
    source: "Tunkel · CID 2004 · IDSA · tríada clásica",
    confidence: "high",
  },
  {
    finding: "exam-altered-mental-status",
    disease: "bacterial-meningitis",
    lrPlus: 6,
    lrMinus: 0.3,
    source: "van de Beek · NEJM 2016 · tríada (fiebre+nucalgia+conf)",
    confidence: "high",
  },
  {
    finding: "history-thunderclap-headache",
    disease: "bacterial-meningitis",
    lrPlus: 0.6,
    lrMinus: 1.05,
    source: "van de Beek · NEJM 2016 · cefalea progresiva, no súbita",
    confidence: "medium",
  },
  {
    finding: "lab-procalcitonin-elevated",
    disease: "bacterial-meningitis",
    lrPlus: 4,
    lrMinus: 0.45,
    source: "van de Beek · NEJM 2016 · diferencial viral/bacteriana",
    confidence: "high",
  },
  {
    finding: "lab-blood-cultures-positive",
    disease: "bacterial-meningitis",
    lrPlus: 4.5,
    lrMinus: 0.55,
    source: "Tunkel · CID 2004 · bacteremia en 60% MBA",
    confidence: "high",
  },

  // ===== Tuberculosis pulmonar activa =====
  {
    finding: "history-night-sweats-weight-loss",
    disease: "tuberculosis-active",
    lrPlus: 15,
    lrMinus: 0.3,
    source: "Lewinsohn · CID 2017 · ATS/IDSA TB · síntomas constitucionales",
    confidence: "high",
  },
  {
    finding: "lab-chest-infiltrate",
    disease: "tuberculosis-active",
    lrPlus: 6,
    lrMinus: 0.2,
    source: "Lewinsohn · CID 2017 · cavitación apical patrón típico",
    confidence: "high",
  },
  {
    finding: "history-fever",
    disease: "tuberculosis-active",
    lrPlus: 2.5,
    lrMinus: 0.55,
    source: "WHO 2024 Global TB Report · fiebre subaguda",
    confidence: "high",
  },
  {
    finding: "lab-procalcitonin-elevated",
    disease: "tuberculosis-active",
    lrPlus: 0.6,
    lrMinus: 1.05,
    source: "Lewinsohn · CID 2017 · PCT típicamente normal en TB",
    confidence: "medium",
  },
];

// ============================================================
// Helpers de lookup
// ============================================================
export function findFinding(id: string): Finding | undefined {
  return FINDINGS.find((f) => f.id === id);
}

export function findDisease(id: string): Disease | undefined {
  return DISEASES.find((d) => d.id === id);
}

export function lrsForDisease(disease: string): LikelihoodRatio[] {
  return LIKELIHOOD_RATIOS.filter((lr) => lr.disease === disease);
}
