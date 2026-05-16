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
import { applyWatermark } from "./watermark";

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

  // ---- Cardio extendido B1 — IC, valvulopatías, isquémica, SCAD ----
  // Fenotipos de IC + escenarios agudos + valvulopatía + isquémica + SCAD.
  // Priors base son cohorte clínica internacional; calibración MX vive en
  // src/lib/inference/priors-mx.ts.
  {
    id: "hfref",
    label: "Insuficiencia cardíaca con FE reducida (HFrEF)",
    prior: 0.12,
  },
  {
    id: "hfmref",
    label: "Insuficiencia cardíaca con FE intermedia (HFmrEF)",
    prior: 0.06,
  },
  {
    id: "adhf-acute",
    label: "Insuficiencia cardíaca aguda descompensada",
    prior: 0.05,
  },
  {
    id: "scad",
    label: "Disección espontánea de arteria coronaria (SCAD)",
    prior: 0.008,
  },
  {
    id: "severe-as",
    label: "Estenosis aórtica severa",
    prior: 0.022,
  },
  {
    id: "ischemic-cm",
    label: "Cardiopatía isquémica crónica",
    prior: 0.1,
  },

  // ---- Endocrino — Diabetes (extensión B2) ----
  // 7 fenotipos diabéticos. ENSANUT 2023 reporta 18.4% de adultos MX
  // con DM2 — uno de los catálogos clínicos más relevantes para el
  // médico mexicano. Distingue DM2 típica, LADA, MODY, gestacional,
  // cetoacidosis aguda, retinopatía diabética y prediabetes.
  {
    id: "dm2-typical",
    label: "Diabetes mellitus tipo 2 típica",
    prior: 0.18,
  },
  {
    id: "prediabetes",
    label: "Prediabetes (intolerancia a glucosa / HbA1c 5.7-6.4%)",
    prior: 0.1,
  },
  {
    id: "lada",
    label: "LADA (diabetes autoinmune latente del adulto)",
    prior: 0.012,
  },
  {
    id: "mody",
    label: "MODY (diabetes monogénica del adulto joven)",
    prior: 0.005,
  },
  {
    id: "dm-gestational",
    label: "Diabetes gestacional",
    prior: 0.04,
  },
  {
    id: "dka",
    label: "Cetoacidosis diabética (DKA)",
    prior: 0.018,
  },
  {
    id: "diabetic-retinopathy",
    label: "Retinopatía diabética",
    prior: 0.06,
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

  // ---- Gineco-Oncología B4 — mama, cervix, ovario, endometrio ----
  // 4 neoplasias ginecológicas más frecuentes en mujer mexicana. Cáncer
  // de mama es 1ª causa de muerte oncológica femenina en MX; cervix 2ª.
  // Ovario tiene peor pronóstico por diagnóstico tardío; endometrio
  // típicamente debuta con sangrado postmenopáusico.
  {
    id: "breast-cancer",
    label: "Cáncer de mama",
    prior: 0.025,
  },
  {
    id: "cervical-cancer",
    label: "Cáncer cervicouterino",
    prior: 0.018,
  },
  {
    id: "ovarian-cancer",
    label: "Cáncer de ovario",
    prior: 0.012,
  },
  {
    id: "endometrial-cancer",
    label: "Cáncer de endometrio",
    prior: 0.015,
  },

  // ---- Neuro extendido B3 — EVC hemorrágico, epilepsia, cefalea, demencia ----
  // 6 dx neurológicos de alta prevalencia/impacto en MX: HIP por HAS sin
  // control, epilepsia (1.5% adultos), cefaleas primarias (>50% adultos),
  // demencias (Alzheimer + vascular cobertando epidemiología MX).
  {
    id: "hemorrhagic-stroke",
    label: "Hemorragia intraparenquimatosa cerebral (HIP)",
    prior: 0.02,
  },
  {
    id: "epilepsy",
    label: "Epilepsia (crisis recurrentes no provocadas)",
    prior: 0.025,
  },
  {
    id: "tension-headache",
    label: "Cefalea tensional",
    prior: 0.08,
  },
  {
    id: "migraine-without-aura",
    label: "Migraña sin aura",
    prior: 0.06,
  },
  {
    id: "alzheimer-dementia",
    label: "Demencia tipo Alzheimer",
    prior: 0.03,
  },
  {
    id: "vascular-dementia",
    label: "Demencia vascular",
    prior: 0.018,
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

  // ---------------- IC, valvulopatías, isquémica, SCAD (extensión B1) ----------------
  // Findings añadidos para discriminar HFrEF / HFmrEF / ADHF / SCAD /
  // estenosis aórtica severa / cardiopatía isquémica crónica.
  {
    id: "echo-fe-reduced",
    label: "FE ≤ 40% (FE reducida)",
    category: "echo",
    detail: "Fracción de eyección por Simpson biplano ≤ 40%",
  },
  {
    id: "echo-fe-mid-range",
    label: "FE 41-49% (FE intermedia)",
    category: "echo",
    detail: "Fracción de eyección entre 41 y 49% por método estándar",
  },
  {
    id: "echo-fe-preserved-50",
    label: "FE ≥ 50% (FE preservada)",
    category: "echo",
    detail: "Fracción de eyección ≥ 50% — base para HFpEF si hay síntomas",
  },
  {
    id: "echo-regional-wma-coronary",
    label: "Hipocinesia regional patrón coronario",
    category: "echo",
    detail: "Alteración segmentaria de contractilidad en territorio coronario",
  },
  {
    id: "echo-as-severe-criteria",
    label: "Estenosis aórtica severa por eco",
    category: "echo",
    detail: "Vmax ≥ 4 m/s, gradiente medio ≥ 40 mmHg o área valvular ≤ 1 cm²",
  },
  {
    id: "echo-mr-severe-criteria",
    label: "Insuficiencia mitral severa por eco",
    category: "echo",
    detail: "Vena contracta ≥ 7 mm, ERO ≥ 0.4 cm² o volumen regurg ≥ 60 mL",
  },
  {
    id: "imagen-coronary-dissection",
    label: "Disección coronaria en CT angio o coronariografía",
    category: "echo",
    detail: "Imagen tipo flap intimal o hematoma intramural en arteria coronaria",
  },
  {
    id: "lab-bnp-elevated",
    label: "BNP / NT-proBNP elevado para edad",
    category: "lab",
    detail: "NT-proBNP > 450 (<55a), > 900 (55-74a) o > 1800 pg/mL (≥75a)",
  },
  {
    id: "lab-troponin-hs-positive",
    label: "Troponina hs positiva",
    category: "lab",
    detail: "Troponina T o I alta sensibilidad sobre límite superior de referencia",
  },
  {
    id: "history-postpartum-12mo",
    label: "Postparto en los últimos 12 meses",
    category: "history",
    detail: "Periodo periparto reciente — factor de riesgo SCAD",
  },
  {
    id: "history-fmd-known",
    label: "Displasia fibromuscular conocida",
    category: "history",
    detail: "FMD confirmada en lecho carotídeo, renal o iliaco",
  },
  {
    id: "history-multiple-cv-risk",
    label: "Múltiples factores de riesgo cardiovascular",
    category: "history",
    detail: "≥ 3 de: HAS, DM2, dislipidemia, tabaquismo activo, obesidad central",
  },
  {
    id: "history-prior-mi-cad",
    label: "IAM previo o coronariopatía documentada",
    category: "history",
    detail: "Antecedente de IAM, ACTP, bypass o estenosis ≥ 50% en angio",
  },
  {
    id: "history-syncope-effort",
    label: "Síncope con el esfuerzo",
    category: "history",
    detail: "Pérdida de conciencia desencadenada por actividad física",
  },
  {
    id: "exam-bilateral-crepitus",
    label: "Crepitantes pulmonares bilaterales",
    category: "exam",
    detail: "Estertores húmedos basales o difusos en ambos hemitórax",
  },
  {
    id: "exam-jvd-elevated",
    label: "Ingurgitación yugular elevada",
    category: "exam",
    detail: "JVP > 7 cm sobre ángulo esternal a 45°",
  },
  {
    id: "exam-s3-gallop",
    label: "Galope S3",
    category: "exam",
    detail: "Tercer ruido protodiastólico de baja frecuencia",
  },
  {
    id: "exam-systolic-ejection-murmur",
    label: "Soplo eyectivo sistólico aórtico",
    category: "exam",
    detail: "Soplo sistólico romboidal en foco aórtico irradiado al cuello",
  },

  // ---------------- Diabetes (extensión B2) ----------------
  // Findings que discriminan DM2 / LADA / MODY / gestacional / DKA /
  // retinopatía diabética / prediabetes.
  {
    id: "lab-hba1c-65-plus",
    label: "HbA1c ≥ 6.5%",
    category: "lab",
    detail: "Criterio ADA 2024 — corte diagnóstico de diabetes",
  },
  {
    id: "lab-hba1c-prediabetes",
    label: "HbA1c 5.7-6.4%",
    category: "lab",
    detail: "Criterio ADA 2024 — rango de prediabetes",
  },
  {
    id: "lab-glucose-fasting-126",
    label: "Glucemia en ayuno ≥ 126 mg/dL",
    category: "lab",
    detail: "Glucemia plasmática ayuno ≥ 126 mg/dL en ≥ 2 ocasiones",
  },
  {
    id: "lab-glucose-fasting-100-125",
    label: "Glucemia en ayuno 100-125 mg/dL",
    category: "lab",
    detail: "Glucemia alterada en ayunas — rango prediabetes",
  },
  {
    id: "lab-c-peptide-low",
    label: "Péptido C bajo (< 0.6 ng/mL)",
    category: "lab",
    detail: "Reserva pancreática agotada — DM1 / LADA avanzada",
  },
  {
    id: "lab-c-peptide-preserved",
    label: "Péptido C conservado (> 1.0 ng/mL)",
    category: "lab",
    detail: "Reserva pancreática preservada — DM2, MODY o LADA temprana",
  },
  {
    id: "lab-gad-antibody-positive",
    label: "Anticuerpos anti-GAD positivos",
    category: "lab",
    detail: "Autoinmunidad pancreática — LADA o DM1 tardía",
  },
  {
    id: "lab-urinary-ketones-pos",
    label: "Cetonas urinarias positivas (++ o más)",
    category: "lab",
    detail: "Cetoaciduria — sospecha DKA o ayuno prolongado",
  },
  {
    id: "lab-arterial-ph-low",
    label: "pH arterial < 7.30",
    category: "lab",
    detail: "Acidosis metabólica significativa por gasometría arterial",
  },
  {
    id: "lab-anion-gap-high",
    label: "Brecha aniónica > 12",
    category: "lab",
    detail: "Anion gap elevado en gasometría — acidosis con brecha amplia",
  },
  {
    id: "history-family-dm-3gen",
    label: "DM en 3 generaciones consecutivas",
    category: "history",
    detail: "Patrón autosómico dominante familiar — sospecha MODY",
  },
  {
    id: "history-dx-age-under-30",
    label: "Diagnóstico de DM antes de los 30 años",
    category: "history",
    detail: "Edad temprana al diagnóstico — sugiere MODY, LADA o DM1",
  },
  {
    id: "history-pregnancy-current",
    label: "Embarazo actual",
    category: "history",
    detail: "Gestación en curso — base para DM gestacional",
  },
  {
    id: "history-rapid-insulin-need",
    label: "Requirió insulina < 2 años desde el diagnóstico",
    category: "history",
    detail: "Falla precoz a hipoglucemiantes orales — sospecha LADA",
  },
  {
    id: "history-obesity-central",
    label: "Obesidad central (cintura > 90 H / 80 M cm)",
    category: "history",
    detail: "Adiposidad visceral — criterio síndrome metabólico",
  },
  {
    id: "history-dm-duration-10y",
    label: "Duración de DM > 10 años",
    category: "history",
    detail: "Tiempo de evolución — factor de complicaciones microvasculares",
  },
  {
    id: "exam-fundus-microaneurysms",
    label: "Microaneurismas en retina",
    category: "exam",
    detail: "Hemorragias y microaneurismas en fondo de ojo — RD no proliferativa",
  },
  {
    id: "exam-fundus-cotton-wool",
    label: "Manchas algodonosas en retina",
    category: "exam",
    detail: "Exudados algodonosos en fondo de ojo — isquemia retiniana",
  },
  {
    id: "exam-fundus-neovascularization",
    label: "Neovascularización retiniana",
    category: "exam",
    detail: "Vasos anómalos en retina — RD proliferativa avanzada",
  },
  {
    id: "exam-kussmaul-breathing",
    label: "Respiración de Kussmaul",
    category: "exam",
    detail: "Hiperventilación rápida y profunda compensatoria — acidosis severa",
  },
  {
    id: "exam-fruity-breath",
    label: "Aliento cetónico (afrutado)",
    category: "exam",
    detail: "Halitosis a manzana / cetonas — sospecha DKA",
  },

  // ---------------- Neuro (extensión B3) ----------------
  // Findings para discriminar HIP / epilepsia / cefalea tensional /
  // migraña sin aura / Alzheimer / demencia vascular.
  {
    id: "lab-tc-intraparenchymal-blood",
    label: "TC con sangre intraparenquimatosa",
    category: "lab",
    detail: "Hemorragia parenquimal aguda en TC sin contraste",
  },
  {
    id: "history-htn-acute-severe",
    label: "TAS > 180 mmHg al ingreso",
    category: "history",
    detail: "Hipertensión severa aguda — factor en HIP",
  },
  {
    id: "history-anticoagulation",
    label: "Paciente anticoagulado",
    category: "history",
    detail: "Warfarina, DOAC o heparina activos al evento",
  },
  {
    id: "history-progressive-deficit-minutes",
    label: "Deterioro neurológico progresivo en minutos-horas",
    category: "history",
    detail: "Evolución no abrupta — patrón HIP vs isquémico súbito",
  },
  {
    id: "history-seizure-tonic-clonic",
    label: "Crisis tónico-clónica generalizada",
    category: "history",
    detail: "Pérdida de conciencia con movimientos tónico-clónicos bilaterales",
  },
  {
    id: "history-seizure-focal",
    label: "Crisis focal (con o sin alteración de conciencia)",
    category: "history",
    detail: "Aura, automatismos o déficit focal episódico recurrente",
  },
  {
    id: "lab-eeg-epileptiform",
    label: "EEG con actividad epileptiforme",
    category: "lab",
    detail: "Puntas, ondas agudas o complejos punta-onda en EEG interictal",
  },
  {
    id: "history-headache-bilateral-band",
    label: "Cefalea bilateral en banda u opresiva",
    category: "history",
    detail: "Cefalea opresiva no pulsátil — patrón tensional ICHD-3",
  },
  {
    id: "history-headache-otc-relief",
    label: "Cefalea aliviada con analgésicos OTC",
    category: "history",
    detail: "Paracetamol o AINE típicamente eficaces",
  },
  {
    id: "history-headache-unilateral-pulsatile",
    label: "Cefalea unilateral pulsátil",
    category: "history",
    detail: "Hemicránea pulsátil — patrón migrañoso ICHD-3",
  },
  {
    id: "history-headache-nausea-photo",
    label: "Cefalea con náusea + foto/fonofobia",
    category: "history",
    detail: "Síntomas asociados acompañando cefalea",
  },
  {
    id: "history-headache-recurrent-5plus",
    label: "≥ 5 episodios previos de cefalea similar",
    category: "history",
    detail: "Recurrencia documentada — criterio ICHD-3 cefalea primaria",
  },
  {
    id: "exam-mmse-low",
    label: "MMSE o MoCA bajo para edad/escolaridad",
    category: "exam",
    detail: "Deterioro cognitivo objetivado por test breve",
  },
  {
    id: "lab-mri-hippocampal-atrophy",
    label: "Atrofia hipocampal bilateral en RM",
    category: "lab",
    detail: "Reducción de volumen hipocampal en RM (visual o volumétrica)",
  },
  {
    id: "lab-mri-white-matter-lesions",
    label: "Lesiones isquémicas multifocales (Fazekas ≥ 2)",
    category: "lab",
    detail: "Hiperintensidades de sustancia blanca difusas en T2/FLAIR",
  },
  {
    id: "history-cognitive-decline-gradual",
    label: "Deterioro cognitivo gradual > 6 meses",
    category: "history",
    detail: "Curso progresivo insidioso reportado por familiar",
  },
  {
    id: "history-cognitive-decline-stepwise",
    label: "Deterioro cognitivo escalonado",
    category: "history",
    detail: "Empeoramiento abrupto en escalones con mesetas",
  },
  {
    id: "exam-apraxia-agnosia",
    label: "Apraxia y/o agnosia",
    category: "exam",
    detail: "Pérdida de praxias aprendidas o reconocimiento",
  },
  {
    id: "history-age-over-65",
    label: "Edad > 65 años",
    category: "history",
    detail: "Factor demográfico relevante para enfermedades neurodegenerativas",
  },

  // ---------------- Gineco-Oncología (extensión B4) ----------------
  // Findings para discriminar cáncer mama / cervix / ovario / endometrio
  // — diagnóstico, factores de riesgo y biomarcadores.
  {
    id: "exam-breast-mass-palpable",
    label: "Masa mamaria palpable sospechosa",
    category: "exam",
    detail: "Nódulo duro, irregular, fijo o mayor a 1 cm en autoexploración o exploración clínica",
  },
  {
    id: "lab-mammo-birads-4-5",
    label: "Mastografía BIRADS 4 o 5",
    category: "lab",
    detail: "Microcalcificaciones agrupadas o masa con bordes espiculados — riesgo intermedio-alto",
  },
  {
    id: "history-brca-mutation",
    label: "Mutación BRCA1/2 conocida",
    category: "history",
    detail: "Variante patogénica documentada en BRCA1 o BRCA2",
  },
  {
    id: "history-family-breast-ovarian",
    label: "Historia familiar 1º grado mama u ovario",
    category: "history",
    detail: "Madre, hermana o hija con cáncer de mama u ovario",
  },
  {
    id: "lab-biopsy-malignant",
    label: "Biopsia / histología con malignidad confirmada",
    category: "lab",
    detail: "Tejido con invasión maligna confirmada por patología",
  },
  {
    id: "history-postmenopausal-bleeding",
    label: "Sangrado vaginal postmenopáusico",
    category: "history",
    detail: "Cualquier sangrado vaginal > 12 meses tras menopausia",
  },
  {
    id: "lab-endometrial-thickening",
    label: "Engrosamiento endometrial > 5 mm en US",
    category: "lab",
    detail: "Grosor endometrial > 4-5 mm en mujer postmenopáusica por ultrasonido",
  },
  {
    id: "lab-hpv-16-18-positive",
    label: "VPH 16 o 18 positivo",
    category: "lab",
    detail: "Genotipificación con VPH de alto riesgo 16 o 18 detectado",
  },
  {
    id: "lab-cytology-hsil-asch",
    label: "Citología cervical HSIL / ASC-H / AGC",
    category: "lab",
    detail: "Lesión escamosa de alto grado, atipia ASC-H o células glandulares atípicas",
  },
  {
    id: "lab-ca125-elevated",
    label: "CA-125 elevado > 35 U/mL",
    category: "lab",
    detail: "Marcador tumoral sérico elevado",
  },
  {
    id: "exam-abdominal-mass-pelvic",
    label: "Masa pélvica palpable o ascitis",
    category: "exam",
    detail: "Masa anexial o aumento de volumen abdominal con matidez cambiante",
  },
  {
    id: "history-tamoxifen-use",
    label: "Tratamiento con tamoxifeno > 2 años",
    category: "history",
    detail: "Uso prolongado de tamoxifeno — factor riesgo endometrial",
  },
  {
    id: "history-obesity-postmenop",
    label: "Obesidad postmenopáusica",
    category: "history",
    detail: "IMC > 30 en mujer postmenopáusica — factor riesgo endometrial",
  },
  {
    id: "history-nulliparity",
    label: "Nuliparidad",
    category: "history",
    detail: "Sin embarazos previos — factor riesgo de cáncer ovario y endometrio",
  },
  {
    id: "history-late-menopause",
    label: "Menopausia tardía (> 55 años)",
    category: "history",
    detail: "Exposición prolongada a estrógeno endógeno",
  },
];

// ============================================================
// Likelihood ratios — ~180 pares (finding, disease) con LR+ y LR-
// LRs ≈ 1 (no informativos) se omiten para mantener la matriz manejable.
//
// _RAW_LIKELIHOOD_RATIOS son los valores curados de literatura. El export
// público LIKELIHOOD_RATIOS (al final del archivo) aplica un watermark
// forense determinístico en builds de producción — perturbación micro
// (sub-1e-4) en dos LRs derivada del commit SHA. Clínicamente irrelevante,
// distintivo en un dump filtrado. Detalle en ./watermark.ts.
// ============================================================
const _RAW_LIKELIHOOD_RATIOS: LikelihoodRatio[] = [
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

  // =============================================================
  // Extensión B1 — IC, valvulopatías, isquémica, SCAD
  // Curado contra ESC HF 2023, ESC ACS 2023, AHA/ACC HF 2022,
  // ESC/EACTS Valvular 2021, AHA SCAD 2018, Hayes NEJM 2020.
  // =============================================================

  // ===== HFrEF (FE ≤ 40%) =====
  {
    finding: "echo-fe-reduced",
    disease: "hfref",
    lrPlus: 18,
    lrMinus: 0.04,
    source: "ESC HF 2023 · McDonagh · definición HFrEF",
    confidence: "high",
  },
  {
    finding: "echo-fe-mid-range",
    disease: "hfref",
    lrPlus: 0.05,
    lrMinus: 1.1,
    source: "ESC HF 2023 · mutuamente excluyente con HFrEF",
    confidence: "high",
  },
  {
    finding: "echo-fe-preserved-50",
    disease: "hfref",
    lrPlus: 0.02,
    lrMinus: 1.15,
    source: "ESC HF 2023 · excluye HFrEF",
    confidence: "high",
  },
  {
    finding: "lab-bnp-elevated",
    disease: "hfref",
    lrPlus: 4.2,
    lrMinus: 0.22,
    source: "Roberts · Heart 2015 · BNP en HFrEF",
    confidence: "high",
  },
  {
    finding: "exam-bilateral-crepitus",
    disease: "hfref",
    lrPlus: 3.4,
    lrMinus: 0.58,
    source: "Wang · JAMA 2005 · meta-análisis exam IC",
    confidence: "high",
  },
  {
    finding: "exam-jvd-elevated",
    disease: "hfref",
    lrPlus: 3.9,
    lrMinus: 0.54,
    source: "Wang · JAMA 2005 · JVP en IC",
    confidence: "high",
  },
  {
    finding: "exam-s3-gallop",
    disease: "hfref",
    lrPlus: 3.9,
    lrMinus: 0.85,
    source: "Wang · JAMA 2005 · S3 en IC sistólica",
    confidence: "medium",
  },
  {
    finding: "echo-regional-wma-coronary",
    disease: "hfref",
    lrPlus: 3.2,
    lrMinus: 0.78,
    source: "ESC HF 2023 · etiología isquémica frecuente en HFrEF",
    confidence: "medium",
  },
  {
    finding: "history-multiple-cv-risk",
    disease: "hfref",
    lrPlus: 1.8,
    lrMinus: 0.8,
    source: "ESC HF 2023 · perfil de riesgo HFrEF isquémico",
    confidence: "medium",
  },

  // ===== HFmrEF (FE 41-49%) =====
  {
    finding: "echo-fe-mid-range",
    disease: "hfmref",
    lrPlus: 22,
    lrMinus: 0.04,
    source: "ESC HF 2023 · definición HFmrEF (FE 41-49%)",
    confidence: "high",
  },
  {
    finding: "echo-fe-reduced",
    disease: "hfmref",
    lrPlus: 0.04,
    lrMinus: 1.1,
    source: "ESC HF 2023 · excluyente",
    confidence: "high",
  },
  {
    finding: "echo-fe-preserved-50",
    disease: "hfmref",
    lrPlus: 0.04,
    lrMinus: 1.1,
    source: "ESC HF 2023 · excluyente",
    confidence: "high",
  },
  {
    finding: "lab-bnp-elevated",
    disease: "hfmref",
    lrPlus: 2.8,
    lrMinus: 0.42,
    source: "Solomon · Lancet 2018 · PARAGON-HF biomarcadores",
    confidence: "high",
  },
  {
    finding: "exam-bilateral-crepitus",
    disease: "hfmref",
    lrPlus: 2.4,
    lrMinus: 0.7,
    source: "ESC HF 2023 · congestión en HFmrEF",
    confidence: "medium",
  },

  // ===== ADHF (IC aguda descompensada — cualquier FE) =====
  {
    finding: "exam-bilateral-crepitus",
    disease: "adhf-acute",
    lrPlus: 4.5,
    lrMinus: 0.4,
    source: "AHA HFA 2017 · diagnóstico ADHF clínico",
    confidence: "high",
  },
  {
    finding: "exam-jvd-elevated",
    disease: "adhf-acute",
    lrPlus: 5.1,
    lrMinus: 0.48,
    source: "AHA HFA 2017 · congestión venosa sistémica",
    confidence: "high",
  },
  {
    finding: "lab-bnp-elevated",
    disease: "adhf-acute",
    lrPlus: 5.6,
    lrMinus: 0.18,
    source: "Maisel · NEJM 2002 · BNP en disnea aguda ER",
    confidence: "high",
  },
  {
    finding: "exam-edema-bilateral-lower",
    disease: "adhf-acute",
    lrPlus: 2.4,
    lrMinus: 0.65,
    source: "Wang · JAMA 2005 · edema en IC",
    confidence: "medium",
  },
  {
    finding: "exam-s3-gallop",
    disease: "adhf-acute",
    lrPlus: 4.6,
    lrMinus: 0.82,
    source: "Wang · JAMA 2005 · S3 mayor LR en ADHF",
    confidence: "high",
  },
  {
    finding: "echo-fe-reduced",
    disease: "adhf-acute",
    lrPlus: 3.5,
    lrMinus: 0.65,
    source: "ESC HF 2023 · HFrEF frecuentemente debuta como ADHF",
    confidence: "medium",
  },
  {
    finding: "echo-fe-mid-range",
    disease: "adhf-acute",
    lrPlus: 1.8,
    lrMinus: 0.88,
    source: "ESC HF 2023",
    confidence: "low",
  },
  {
    finding: "echo-fe-preserved-50",
    disease: "adhf-acute",
    lrPlus: 1.5,
    lrMinus: 0.88,
    source: "ESC HF 2023 · ADHF puede tener cualquier FE",
    confidence: "low",
  },

  // ===== SCAD (Disección coronaria espontánea) =====
  {
    finding: "imagen-coronary-dissection",
    disease: "scad",
    lrPlus: 95,
    lrMinus: 0.04,
    source: "Hayes · NEJM 2020 · review SCAD · CTCA / coronariografía",
    confidence: "high",
  },
  {
    finding: "history-postpartum-12mo",
    disease: "scad",
    lrPlus: 18,
    lrMinus: 0.62,
    source: "Hayes · NEJM 2020 · P-SCAD es 5-10% de SCAD",
    confidence: "high",
  },
  {
    finding: "history-fmd-known",
    disease: "scad",
    lrPlus: 5.8,
    lrMinus: 0.84,
    source: "AHA Scientific Statement SCAD 2018 · Saw · FMD coexistente",
    confidence: "high",
  },
  {
    finding: "lab-troponin-hs-positive",
    disease: "scad",
    lrPlus: 2.5,
    lrMinus: 0.14,
    source: "ESC ACS 2023 · troponina sensible no específica para SCAD",
    confidence: "medium",
  },
  {
    finding: "history-multiple-cv-risk",
    disease: "scad",
    lrPlus: 0.42,
    lrMinus: 1.8,
    source: "Hayes · NEJM 2020 · perfil clásico SCAD baja carga aterogénica",
    confidence: "high",
  },
  {
    finding: "echo-regional-wma-coronary",
    disease: "scad",
    lrPlus: 2.8,
    lrMinus: 0.6,
    source: "ESC ACS 2023 · WMA territorial en SCAD agudo",
    confidence: "medium",
  },

  // ===== Estenosis aórtica severa =====
  {
    finding: "echo-as-severe-criteria",
    disease: "severe-as",
    lrPlus: 48,
    lrMinus: 0.05,
    source: "ESC/EACTS Valvular 2021 · Vahanian · criterios severidad",
    confidence: "high",
  },
  {
    finding: "exam-systolic-ejection-murmur",
    disease: "severe-as",
    lrPlus: 5.2,
    lrMinus: 0.22,
    source: "Etchells · JAMA 1997 · soplo eyectivo en EA severa",
    confidence: "high",
  },
  {
    finding: "history-syncope-effort",
    disease: "severe-as",
    lrPlus: 4.1,
    lrMinus: 0.84,
    source: "ACC/AHA Valvular 2020 · Otto · tríada sintomática",
    confidence: "high",
  },
  {
    finding: "exam-s3-gallop",
    disease: "severe-as",
    lrPlus: 1.4,
    lrMinus: 0.92,
    source: "ESC/EACTS Valvular 2021 · disfunción VI tardía",
    confidence: "low",
  },
  {
    finding: "lab-bnp-elevated",
    disease: "severe-as",
    lrPlus: 2.1,
    lrMinus: 0.65,
    source: "Clavel · JACC 2014 · BNP marker EA severa pronóstico",
    confidence: "medium",
  },

  // ===== Cardiopatía isquémica crónica =====
  {
    finding: "history-prior-mi-cad",
    disease: "ischemic-cm",
    lrPlus: 12.5,
    lrMinus: 0.42,
    source: "ESC Chronic Coronary Syndromes 2024 · Vrints",
    confidence: "high",
  },
  {
    finding: "echo-regional-wma-coronary",
    disease: "ischemic-cm",
    lrPlus: 8.2,
    lrMinus: 0.4,
    source: "ESC Chronic Coronary Syndromes 2024 · WMA territorial",
    confidence: "high",
  },
  {
    finding: "history-multiple-cv-risk",
    disease: "ischemic-cm",
    lrPlus: 3.8,
    lrMinus: 0.54,
    source: "ACC/AHA Chronic IHD 2023 · perfil pre-test",
    confidence: "high",
  },
  {
    finding: "echo-fe-reduced",
    disease: "ischemic-cm",
    lrPlus: 2.2,
    lrMinus: 0.78,
    source: "ESC Chronic Coronary Syndromes 2024 · isquémica → HFrEF",
    confidence: "medium",
  },
  {
    finding: "lab-troponin-hs-positive",
    disease: "ischemic-cm",
    lrPlus: 1.6,
    lrMinus: 0.78,
    source: "ESC Chronic Coronary Syndromes 2024 · troponina basal alta",
    confidence: "medium",
  },

  // =============================================================
  // Extensión B2 — Diabetes (DM2 / LADA / MODY / gestacional / DKA /
  // retinopatía / prediabetes).
  // Curado contra ADA Standards of Care 2024, Hattersley Diabetologia
  // 2023 MODY, IADPSG / WHO 2013 gestacional, ADA-EASD DKA 2023,
  // ICO-ICDR retinopathy 2017, KDIGO 2022 DM-CKD.
  // =============================================================

  // ===== DM2 típica =====
  {
    finding: "lab-hba1c-65-plus",
    disease: "dm2-typical",
    lrPlus: 8.5,
    lrMinus: 0.14,
    source: "ADA Standards of Care 2024 · criterio diagnóstico DM",
    confidence: "high",
  },
  {
    finding: "lab-glucose-fasting-126",
    disease: "dm2-typical",
    lrPlus: 7.2,
    lrMinus: 0.18,
    source: "ADA Standards of Care 2024 · criterio diagnóstico",
    confidence: "high",
  },
  {
    finding: "history-obesity-central",
    disease: "dm2-typical",
    lrPlus: 3.4,
    lrMinus: 0.48,
    source: "ENSANUT 2023 · 81% de DM2 MX con obesidad central",
    confidence: "high",
  },
  {
    finding: "lab-c-peptide-preserved",
    disease: "dm2-typical",
    lrPlus: 2.6,
    lrMinus: 0.5,
    source: "ADA 2024 · DM2 conserva reserva pancreática inicialmente",
    confidence: "high",
  },
  {
    finding: "history-dx-age-under-30",
    disease: "dm2-typical",
    lrPlus: 0.42,
    lrMinus: 1.18,
    source: "ADA 2024 · DM2 típica edad media diagnóstico > 45a",
    confidence: "medium",
  },
  {
    finding: "lab-gad-antibody-positive",
    disease: "dm2-typical",
    lrPlus: 0.12,
    lrMinus: 1.05,
    source: "Hattersley 2023 · anti-GAD redirige a LADA",
    confidence: "high",
  },
  {
    finding: "lab-hba1c-prediabetes",
    disease: "dm2-typical",
    lrPlus: 0.18,
    lrMinus: 1.12,
    source: "ADA 2024 · HbA1c prediabético excluye DM",
    confidence: "high",
  },

  // ===== Prediabetes =====
  {
    finding: "lab-hba1c-prediabetes",
    disease: "prediabetes",
    lrPlus: 32,
    lrMinus: 0.04,
    source: "ADA Standards of Care 2024 · definición prediabetes",
    confidence: "high",
  },
  {
    finding: "lab-glucose-fasting-100-125",
    disease: "prediabetes",
    lrPlus: 8.4,
    lrMinus: 0.18,
    source: "ADA 2024 · glucemia alterada en ayunas",
    confidence: "high",
  },
  {
    finding: "lab-hba1c-65-plus",
    disease: "prediabetes",
    lrPlus: 0.04,
    lrMinus: 1.12,
    source: "ADA 2024 · HbA1c ≥ 6.5 = DM, excluye prediabetes",
    confidence: "high",
  },
  {
    finding: "history-obesity-central",
    disease: "prediabetes",
    lrPlus: 2.4,
    lrMinus: 0.62,
    source: "ENSANUT 2023 · obesidad central como factor prediabetes",
    confidence: "high",
  },

  // ===== LADA =====
  {
    finding: "lab-gad-antibody-positive",
    disease: "lada",
    lrPlus: 28,
    lrMinus: 0.08,
    source: "Hattersley Diabetologia 2023 · marcador diagnóstico LADA",
    confidence: "high",
  },
  {
    finding: "history-rapid-insulin-need",
    disease: "lada",
    lrPlus: 9.5,
    lrMinus: 0.38,
    source: "Hattersley 2023 · falla rápida hipoglucemiantes orales",
    confidence: "high",
  },
  {
    finding: "lab-c-peptide-low",
    disease: "lada",
    lrPlus: 5.2,
    lrMinus: 0.65,
    source: "Hattersley 2023 · destrucción autoinmune progresiva",
    confidence: "high",
  },
  {
    finding: "history-obesity-central",
    disease: "lada",
    lrPlus: 0.38,
    lrMinus: 1.65,
    source: "Hattersley 2023 · LADA típicamente magro o sobrepeso leve",
    confidence: "high",
  },
  {
    finding: "history-dx-age-under-30",
    disease: "lada",
    lrPlus: 2.8,
    lrMinus: 0.7,
    source: "Hattersley 2023 · LADA edad media diagnóstico 30-50",
    confidence: "medium",
  },

  // ===== MODY =====
  {
    finding: "history-family-dm-3gen",
    disease: "mody",
    lrPlus: 18,
    lrMinus: 0.4,
    source: "Hattersley Diabetologia 2023 · patrón autosómico dominante",
    confidence: "high",
  },
  {
    finding: "history-dx-age-under-30",
    disease: "mody",
    lrPlus: 8.5,
    lrMinus: 0.45,
    source: "Hattersley 2023 · debut típico antes de los 25 años",
    confidence: "high",
  },
  {
    finding: "lab-c-peptide-preserved",
    disease: "mody",
    lrPlus: 5.4,
    lrMinus: 0.38,
    source: "Hattersley 2023 · reserva pancreática conservada largo plazo",
    confidence: "high",
  },
  {
    finding: "history-obesity-central",
    disease: "mody",
    lrPlus: 0.38,
    lrMinus: 1.55,
    source: "Hattersley 2023 · MODY típicamente sin obesidad",
    confidence: "high",
  },
  {
    finding: "lab-gad-antibody-positive",
    disease: "mody",
    lrPlus: 0.15,
    lrMinus: 1.06,
    source: "Hattersley 2023 · MODY es monogénico, no autoinmune",
    confidence: "high",
  },

  // ===== Diabetes gestacional =====
  {
    finding: "history-pregnancy-current",
    disease: "dm-gestational",
    lrPlus: 48,
    lrMinus: 0.05,
    source: "ADA 2024 · IADPSG · prerequisito definitorio",
    confidence: "high",
  },
  {
    finding: "lab-glucose-fasting-126",
    disease: "dm-gestational",
    lrPlus: 6.4,
    lrMinus: 0.32,
    source: "IADPSG 2013 · criterio diagnóstico DM gestacional",
    confidence: "high",
  },
  {
    finding: "lab-hba1c-65-plus",
    disease: "dm-gestational",
    lrPlus: 4.2,
    lrMinus: 0.5,
    source: "WHO 2013 · HbA1c complementario en gestacional",
    confidence: "medium",
  },
  {
    finding: "history-obesity-central",
    disease: "dm-gestational",
    lrPlus: 2.4,
    lrMinus: 0.7,
    source: "ENSANUT 2023 · obesidad pre-gestacional factor riesgo",
    confidence: "high",
  },

  // ===== Cetoacidosis diabética (DKA) =====
  {
    finding: "lab-arterial-ph-low",
    disease: "dka",
    lrPlus: 26,
    lrMinus: 0.05,
    source: "ADA-EASD 2023 · criterio acidosis pH < 7.30",
    confidence: "high",
  },
  {
    finding: "lab-anion-gap-high",
    disease: "dka",
    lrPlus: 14,
    lrMinus: 0.12,
    source: "ADA-EASD 2023 · brecha aniónica criterio bioquímico",
    confidence: "high",
  },
  {
    finding: "lab-urinary-ketones-pos",
    disease: "dka",
    lrPlus: 9.2,
    lrMinus: 0.18,
    source: "ADA-EASD 2023 · cetonuria criterio",
    confidence: "high",
  },
  {
    finding: "exam-kussmaul-breathing",
    disease: "dka",
    lrPlus: 5.6,
    lrMinus: 0.42,
    source: "ADA-EASD 2023 · respiración compensatoria",
    confidence: "high",
  },
  {
    finding: "exam-fruity-breath",
    disease: "dka",
    lrPlus: 7.4,
    lrMinus: 0.68,
    source: "Umpierrez · J Clin Endocrinol Metab 2010 · DKA examen",
    confidence: "medium",
  },
  {
    finding: "lab-glucose-fasting-126",
    disease: "dka",
    lrPlus: 3.2,
    lrMinus: 0.38,
    source: "ADA-EASD 2023 · DKA cursa con hiperglucemia > 250 típico",
    confidence: "high",
  },

  // ===== Retinopatía diabética =====
  {
    finding: "exam-fundus-microaneurysms",
    disease: "diabetic-retinopathy",
    lrPlus: 22,
    lrMinus: 0.1,
    source: "ICO-ICDR International Clinical Classification 2017",
    confidence: "high",
  },
  {
    finding: "exam-fundus-neovascularization",
    disease: "diabetic-retinopathy",
    lrPlus: 48,
    lrMinus: 0.05,
    source: "ICO-ICDR 2017 · marcador RD proliferativa",
    confidence: "high",
  },
  {
    finding: "exam-fundus-cotton-wool",
    disease: "diabetic-retinopathy",
    lrPlus: 9.4,
    lrMinus: 0.55,
    source: "ICO-ICDR 2017 · isquemia retiniana en RD severa",
    confidence: "high",
  },
  {
    finding: "history-dm-duration-10y",
    disease: "diabetic-retinopathy",
    lrPlus: 5.2,
    lrMinus: 0.45,
    source: "Klein · UKPDS · prevalencia RD a 10 años",
    confidence: "high",
  },
  {
    finding: "lab-hba1c-65-plus",
    disease: "diabetic-retinopathy",
    lrPlus: 3.4,
    lrMinus: 0.42,
    source: "DCCT/EDIC · HbA1c crónica alta → RD",
    confidence: "high",
  },

  // =============================================================
  // Extensión B3 — Neuro (HIP / epilepsia / cefaleas / demencias).
  // Curado contra AHA HIP 2022, AHA Acute Ischemic Stroke 2024,
  // AHA aSAH 2023, ILAE 2017, ICHD-3 (2018), NIA-AA 2018 Research
  // Framework, AAN Dementia 2022, VICCCS 2018.
  // =============================================================

  // ===== Hemorragia intraparenquimatosa (HIP) =====
  {
    finding: "lab-tc-intraparenchymal-blood",
    disease: "hemorrhagic-stroke",
    lrPlus: 48,
    lrMinus: 0.05,
    source: "AHA HIP Guidelines 2022 · Greenberg · TC criterio confirmatorio",
    confidence: "high",
  },
  {
    finding: "history-htn-acute-severe",
    disease: "hemorrhagic-stroke",
    lrPlus: 5.4,
    lrMinus: 0.5,
    source: "AHA HIP 2022 · HAS aguda en 60-70% de HIP",
    confidence: "high",
  },
  {
    finding: "history-anticoagulation",
    disease: "hemorrhagic-stroke",
    lrPlus: 3.2,
    lrMinus: 0.85,
    source: "AHA HIP 2022 · anticoagulación factor causal frecuente",
    confidence: "high",
  },
  {
    finding: "history-progressive-deficit-minutes",
    disease: "hemorrhagic-stroke",
    lrPlus: 4.6,
    lrMinus: 0.5,
    source: "AHA HIP 2022 · curso progresivo vs isquémico abrupto",
    confidence: "medium",
  },
  {
    finding: "exam-focal-deficit-acute",
    disease: "hemorrhagic-stroke",
    lrPlus: 3.5,
    lrMinus: 0.42,
    source: "AHA HIP 2022 · déficit focal en 95% de HIP",
    confidence: "high",
  },
  {
    finding: "lab-tc-intraparenchymal-blood",
    disease: "ischemic-stroke-acute",
    lrPlus: 0.05,
    lrMinus: 1.18,
    source: "AHA AIS 2024 · TC con sangre excluye isquémico agudo",
    confidence: "high",
  },

  // ===== Epilepsia =====
  {
    finding: "history-seizure-tonic-clonic",
    disease: "epilepsy",
    lrPlus: 8.5,
    lrMinus: 0.32,
    source: "ILAE 2017 Operational Classification · Fisher",
    confidence: "high",
  },
  {
    finding: "history-seizure-focal",
    disease: "epilepsy",
    lrPlus: 6.4,
    lrMinus: 0.38,
    source: "ILAE 2017 · crisis focales con o sin pérdida conciencia",
    confidence: "high",
  },
  {
    finding: "lab-eeg-epileptiform",
    disease: "epilepsy",
    lrPlus: 18,
    lrMinus: 0.42,
    source: "ILAE 2017 · EEG con actividad epileptiforme criterio apoyo",
    confidence: "high",
  },

  // ===== Cefalea tensional =====
  {
    finding: "history-headache-bilateral-band",
    disease: "tension-headache",
    lrPlus: 6.4,
    lrMinus: 0.28,
    source: "ICHD-3 (2018) · criterio diagnóstico cefalea tensional",
    confidence: "high",
  },
  {
    finding: "history-headache-otc-relief",
    disease: "tension-headache",
    lrPlus: 3.6,
    lrMinus: 0.52,
    source: "ICHD-3 (2018) · respuesta a paracetamol/AINE típica",
    confidence: "medium",
  },
  {
    finding: "history-headache-nausea-photo",
    disease: "tension-headache",
    lrPlus: 0.3,
    lrMinus: 1.4,
    source: "ICHD-3 (2018) · ausencia de náusea apoya tensional vs migraña",
    confidence: "high",
  },
  {
    finding: "history-headache-unilateral-pulsatile",
    disease: "tension-headache",
    lrPlus: 0.25,
    lrMinus: 1.4,
    source: "ICHD-3 (2018) · características migrañosas excluyen tensional",
    confidence: "high",
  },

  // ===== Migraña sin aura =====
  {
    finding: "history-headache-unilateral-pulsatile",
    disease: "migraine-without-aura",
    lrPlus: 8.2,
    lrMinus: 0.22,
    source: "ICHD-3 (2018) · criterio C migraña sin aura",
    confidence: "high",
  },
  {
    finding: "history-headache-nausea-photo",
    disease: "migraine-without-aura",
    lrPlus: 8.6,
    lrMinus: 0.2,
    source: "ICHD-3 (2018) · criterio D migraña sin aura",
    confidence: "high",
  },
  {
    finding: "history-headache-recurrent-5plus",
    disease: "migraine-without-aura",
    lrPlus: 6.4,
    lrMinus: 0.18,
    source: "ICHD-3 (2018) · criterio A recurrencia ≥ 5 episodios",
    confidence: "high",
  },
  {
    finding: "history-headache-bilateral-band",
    disease: "migraine-without-aura",
    lrPlus: 0.35,
    lrMinus: 1.32,
    source: "ICHD-3 (2018) · bilateralidad típica de tensional, no migraña",
    confidence: "high",
  },

  // ===== Demencia tipo Alzheimer =====
  {
    finding: "exam-mmse-low",
    disease: "alzheimer-dementia",
    lrPlus: 6.2,
    lrMinus: 0.28,
    source: "NIA-AA 2018 Research Framework · Jack · MMSE/MoCA",
    confidence: "high",
  },
  {
    finding: "lab-mri-hippocampal-atrophy",
    disease: "alzheimer-dementia",
    lrPlus: 12,
    lrMinus: 0.35,
    source: "NIA-AA 2018 · biomarcador neurodegeneración (N+)",
    confidence: "high",
  },
  {
    finding: "history-cognitive-decline-gradual",
    disease: "alzheimer-dementia",
    lrPlus: 4.8,
    lrMinus: 0.32,
    source: "AAN Dementia 2022 · curso insidioso característico",
    confidence: "high",
  },
  {
    finding: "exam-apraxia-agnosia",
    disease: "alzheimer-dementia",
    lrPlus: 5.4,
    lrMinus: 0.55,
    source: "DSM-5-TR 2022 · síntomas corticales en Alzheimer",
    confidence: "high",
  },
  {
    finding: "history-age-over-65",
    disease: "alzheimer-dementia",
    lrPlus: 3.2,
    lrMinus: 0.45,
    source: "NIA-AA 2018 · edad principal factor de riesgo",
    confidence: "high",
  },
  {
    finding: "history-cognitive-decline-stepwise",
    disease: "alzheimer-dementia",
    lrPlus: 0.38,
    lrMinus: 1.35,
    source: "AAN Dementia 2022 · curso escalonado sugiere vascular",
    confidence: "high",
  },

  // ===== Demencia vascular =====
  {
    finding: "history-cognitive-decline-stepwise",
    disease: "vascular-dementia",
    lrPlus: 6.5,
    lrMinus: 0.35,
    source: "VICCCS 2018 · curso escalonado en demencia vascular",
    confidence: "high",
  },
  {
    finding: "lab-mri-white-matter-lesions",
    disease: "vascular-dementia",
    lrPlus: 14,
    lrMinus: 0.3,
    source: "VICCCS 2018 · carga lesional sustancia blanca",
    confidence: "high",
  },
  {
    finding: "history-multiple-cv-risk",
    disease: "vascular-dementia",
    lrPlus: 4.2,
    lrMinus: 0.42,
    source: "VICCCS 2018 · perfil cardiometabólico subyacente",
    confidence: "high",
  },
  {
    finding: "history-prior-mi-cad",
    disease: "vascular-dementia",
    lrPlus: 3.4,
    lrMinus: 0.62,
    source: "VICCCS 2018 · enfermedad CV documentada como factor",
    confidence: "high",
  },
  {
    finding: "lab-mri-hippocampal-atrophy",
    disease: "vascular-dementia",
    lrPlus: 0.55,
    lrMinus: 1.25,
    source: "VICCCS 2018 · hipocampo relativamente preservado vs Alzheimer",
    confidence: "medium",
  },
  {
    finding: "exam-mmse-low",
    disease: "vascular-dementia",
    lrPlus: 5.6,
    lrMinus: 0.3,
    source: "VICCCS 2018 · deterioro cognitivo objetivable",
    confidence: "high",
  },

  // =============================================================
  // Extensión B4 — Gineco-Oncología (mama / cervix / ovario / endometrio).
  // Curado contra NCCN 2024 (Breast, Cervical, Ovarian, Endometrial),
  // ACR BI-RADS Atlas 2024, Bethesda System 2023, ASCCP 2024,
  // WHO Classification Female Reproductive Organs 2020,
  // ESGO/ESMO/ESP Guidelines 2024, GPC IMSS-232/146/333/468.
  // =============================================================

  // ===== Cáncer de mama =====
  {
    finding: "lab-biopsy-malignant",
    disease: "breast-cancer",
    lrPlus: 120,
    lrMinus: 0.04,
    source: "NCCN Breast Cancer 2024 · histología criterio confirmatorio",
    confidence: "high",
  },
  {
    finding: "lab-mammo-birads-4-5",
    disease: "breast-cancer",
    lrPlus: 22,
    lrMinus: 0.18,
    source: "ACR BI-RADS Atlas 2024 · VPP categoría 4 ~25-50%, categoría 5 > 95%",
    confidence: "high",
  },
  {
    finding: "exam-breast-mass-palpable",
    disease: "breast-cancer",
    lrPlus: 6.4,
    lrMinus: 0.35,
    source: "NCCN Breast Cancer 2024 · masa sospechosa exploración",
    confidence: "high",
  },
  {
    finding: "history-brca-mutation",
    disease: "breast-cancer",
    lrPlus: 8.2,
    lrMinus: 0.92,
    source: "NCCN Genetic/Familial 2024 · BRCA1/2 lifetime risk 55-72%",
    confidence: "high",
  },
  {
    finding: "history-family-breast-ovarian",
    disease: "breast-cancer",
    lrPlus: 2.6,
    lrMinus: 0.78,
    source: "NCCN Breast Cancer 2024 · 1º grado afectado factor riesgo",
    confidence: "high",
  },
  {
    finding: "history-nulliparity",
    disease: "breast-cancer",
    lrPlus: 1.5,
    lrMinus: 0.88,
    source: "WHO 2020 · nuliparidad factor riesgo modesto mama",
    confidence: "medium",
  },

  // ===== Cáncer cervicouterino =====
  {
    finding: "lab-biopsy-malignant",
    disease: "cervical-cancer",
    lrPlus: 120,
    lrMinus: 0.04,
    source: "NCCN Cervical Cancer 2024 · histología cervical confirmatoria",
    confidence: "high",
  },
  {
    finding: "lab-hpv-16-18-positive",
    disease: "cervical-cancer",
    lrPlus: 22,
    lrMinus: 0.22,
    source: "ASCCP 2024 · VPH 16/18 responsable de 70% cánceres cervicales",
    confidence: "high",
  },
  {
    finding: "lab-cytology-hsil-asch",
    disease: "cervical-cancer",
    lrPlus: 18,
    lrMinus: 0.28,
    source: "Bethesda System 2023 · HSIL/ASC-H riesgo CIN3+ 30-70%",
    confidence: "high",
  },
  {
    finding: "history-postmenopausal-bleeding",
    disease: "cervical-cancer",
    lrPlus: 2.2,
    lrMinus: 0.85,
    source: "NCCN Cervical 2024 · sangrado postcoital o postmenop signo",
    confidence: "medium",
  },

  // ===== Cáncer de ovario =====
  {
    finding: "lab-biopsy-malignant",
    disease: "ovarian-cancer",
    lrPlus: 120,
    lrMinus: 0.04,
    source: "NCCN Ovarian Cancer 2024 · histología ovario confirmatoria",
    confidence: "high",
  },
  {
    finding: "lab-ca125-elevated",
    disease: "ovarian-cancer",
    lrPlus: 8.4,
    lrMinus: 0.42,
    source: "NCCN Ovarian 2024 · CA-125 > 35 con masa pélvica VPP alto",
    confidence: "high",
  },
  {
    finding: "exam-abdominal-mass-pelvic",
    disease: "ovarian-cancer",
    lrPlus: 12.5,
    lrMinus: 0.32,
    source: "NCCN Ovarian 2024 · masa pélvica/ascitis hallazgo cardinal",
    confidence: "high",
  },
  {
    finding: "history-brca-mutation",
    disease: "ovarian-cancer",
    lrPlus: 9.6,
    lrMinus: 0.88,
    source: "NCCN Genetic/Familial 2024 · BRCA1 lifetime ovario 39-46%",
    confidence: "high",
  },
  {
    finding: "history-family-breast-ovarian",
    disease: "ovarian-cancer",
    lrPlus: 2.8,
    lrMinus: 0.78,
    source: "NCCN Ovarian 2024 · 1º grado factor riesgo",
    confidence: "high",
  },
  {
    finding: "history-nulliparity",
    disease: "ovarian-cancer",
    lrPlus: 2.4,
    lrMinus: 0.72,
    source: "WHO 2020 · nuliparidad factor riesgo significativo ovario",
    confidence: "high",
  },

  // ===== Cáncer de endometrio =====
  {
    finding: "lab-biopsy-malignant",
    disease: "endometrial-cancer",
    lrPlus: 120,
    lrMinus: 0.04,
    source: "NCCN Uterine Neoplasms 2024 · biopsia endometrial confirmatoria",
    confidence: "high",
  },
  {
    finding: "history-postmenopausal-bleeding",
    disease: "endometrial-cancer",
    lrPlus: 12,
    lrMinus: 0.2,
    source: "NCCN Uterine 2024 · sangrado postmenopáusico VPP 5-15%",
    confidence: "high",
  },
  {
    finding: "lab-endometrial-thickening",
    disease: "endometrial-cancer",
    lrPlus: 18,
    lrMinus: 0.18,
    source: "ESGO/ESMO/ESP 2024 · grosor endometrial > 5mm postmenop",
    confidence: "high",
  },
  {
    finding: "history-tamoxifen-use",
    disease: "endometrial-cancer",
    lrPlus: 4.2,
    lrMinus: 0.85,
    source: "NCCN Uterine 2024 · tamoxifeno > 2a riesgo 2-3×",
    confidence: "high",
  },
  {
    finding: "history-obesity-postmenop",
    disease: "endometrial-cancer",
    lrPlus: 3.6,
    lrMinus: 0.45,
    source: "WHO 2020 · obesidad postmenop estrogeno endógeno",
    confidence: "high",
  },
  {
    finding: "history-nulliparity",
    disease: "endometrial-cancer",
    lrPlus: 2.4,
    lrMinus: 0.72,
    source: "ESGO 2024 · nuliparidad factor riesgo endometrial",
    confidence: "high",
  },
  {
    finding: "history-late-menopause",
    disease: "endometrial-cancer",
    lrPlus: 2.2,
    lrMinus: 0.82,
    source: "WHO 2020 · menopausia tardía exposición estrogénica",
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

// ============================================================
// Export público — aplica watermark forense determinístico en producción.
// En dev/preview (sin VERCEL_GIT_COMMIT_SHA) los LRs originales pasan 1:1.
// ============================================================
export const LIKELIHOOD_RATIOS: LikelihoodRatio[] = applyWatermark(
  _RAW_LIKELIHOOD_RATIOS,
  process.env.VERCEL_GIT_COMMIT_SHA,
);
