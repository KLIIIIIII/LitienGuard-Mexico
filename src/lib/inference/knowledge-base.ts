/**
 * Knowledge base del motor de inferencia v2 — cardiomiopatías + agudo +
 * restrictivo. 12 enfermedades, 29 findings, ~100 likelihood ratios todos
 * respaldados por literatura citada.
 *
 * Fuentes principales:
 *   - 2025 ACC Concise Clinical Guidance for ATTR-CM (JACC sept 2025)
 *   - Phelan et al · Heart 2012 · apical sparing strain pattern
 *   - Westin et al · JACC 2022 · pre-cardiac amyloid manifestations
 *   - Grogan et al · Mayo Clin Proc 2021 · AI-ECG
 *   - ESC 2014 / AHA-ACC 2024 · Hypertrophic cardiomyopathy guidelines
 *   - Falk et al · JACC 2016 · diagnostic algorithm for cardiac amyloid
 *   - Maurer et al · NEJM 2018 · ATTR-ACT (tafamidis)
 *   - Bouwer et al · Eur Heart J 2024 · Fabry cardiomyopathy review
 *   - Linhart et al · Eur Heart J 2020 · Fabry cardiac involvement
 *   - Caforio et al · Eur Heart J 2013 · ESC myocarditis position paper
 *   - Templin et al · NEJM 2015 · InterTAK registry takotsubo
 *   - Ghadri et al · Eur Heart J 2018 · InterTAK diagnostic criteria
 *   - Welch et al · Circulation 2014 · constrictive pericarditis criteria
 *   - Geske et al · JACC 2016 · differentiating restrictive vs constrictive
 *   - Marcus et al · Circulation 2010 · ARVC Task Force Criteria (revised)
 *   - HRS 2014 · Sarcoidosis Cardíaca expert consensus
 *
 * Los LRs son consenso de literatura cuando hay múltiples fuentes.
 * Confidence se asigna por la solidez de la evidencia subyacente.
 */

import type { Disease, Finding, LikelihoodRatio } from "./types";

// ============================================================
// Enfermedades candidatas — 12 etiologías de cardiomiopatía / falla cardíaca
// con LVH, restrictivo o presentación aguda
// ============================================================
export const DISEASES: Disease[] = [
  {
    id: "attr-cm",
    label: "ATTR-CM (amiloidosis cardíaca por transtiretina)",
    prior: 0.04,
  },
  {
    id: "al-amyloid",
    label: "AL amyloid (amiloidosis de cadenas ligeras)",
    prior: 0.02,
  },
  {
    id: "hfpef-idiopathic",
    label: "HFpEF idiopática / multifactorial",
    prior: 0.55,
  },
  {
    id: "hypertensive-hd",
    label: "Cardiopatía hipertensiva con LVH",
    prior: 0.15,
  },
  {
    id: "hcm",
    label: "Cardiomiopatía hipertrófica (HCM sarcomérica)",
    prior: 0.05,
  },
  {
    id: "cardiac-sarcoid",
    label: "Sarcoidosis cardíaca",
    prior: 0.03,
  },
  {
    id: "fabry",
    label: "Enfermedad de Fabry (cardíaca)",
    prior: 0.01,
  },
  {
    id: "myocarditis-acute",
    label: "Miocarditis aguda",
    prior: 0.04,
  },
  {
    id: "takotsubo",
    label: "Cardiomiopatía de Takotsubo",
    prior: 0.03,
  },
  {
    id: "constrictive-pericarditis",
    label: "Pericarditis constrictiva",
    prior: 0.02,
  },
  {
    id: "arvc",
    label: "Cardiomiopatía arritmogénica del VD (ARVC)",
    prior: 0.02,
  },
  {
    id: "other",
    label: "Otras causas de LVH / restrictivo / cardiomiopatía",
    prior: 0.04,
  },
];

// ============================================================
// Findings clínicos — 29 hallazgos relevantes para el diferencial
// ============================================================
export const FINDINGS: Finding[] = [
  // ---------------- ECG (8) ----------------
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

  // ---------------- Lab (5) ----------------
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

  // ---------------- Historia (5) ----------------
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

  // ---------------- Examen (2) ----------------
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

  // ---------------- Genética (1) ----------------
  {
    id: "genetic-gla-mutation",
    label: "Mutación GLA conocida",
    category: "genetic",
    detail: "Variante patogénica confirmada en gen GLA (Fabry)",
  },
];

// ============================================================
// Likelihood ratios — cada (finding, disease) con LR+ y LR-
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
    source: "AHA-ACC HCM 2024 · HCM tiene voltaje alto típicamente",
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
    source: "Linhart · Eur Heart J 2020 · ECG features Fabry",
    confidence: "high",
  },
  {
    finding: "echo-thick-walls",
    disease: "fabry",
    lrPlus: 3,
    lrMinus: 0.15,
    source: "Bouwer · Eur Heart J 2024 · LVH casi universal en Fabry cardíaco",
    confidence: "high",
  },
  {
    finding: "echo-asymmetric-septal",
    disease: "fabry",
    lrPlus: 0.8,
    lrMinus: 1.05,
    source: "Linhart · Eur Heart J 2020 · concéntrica más común",
    confidence: "medium",
  },
  {
    finding: "echo-apical-sparing",
    disease: "fabry",
    lrPlus: 0.6,
    lrMinus: 1.05,
    source: "Bouwer · Eur Heart J 2024 · strain Fabry vs amyloid",
    confidence: "medium",
  },
  {
    finding: "exam-angiokeratoma",
    disease: "fabry",
    lrPlus: 30,
    lrMinus: 0.7,
    source: "Linhart · Eur Heart J 2020 · angiokeratoma patognomónico",
    confidence: "high",
  },
  {
    finding: "genetic-gla-mutation",
    disease: "fabry",
    lrPlus: 200,
    lrMinus: 0.05,
    source: "Linhart · Eur Heart J 2020 · diagnóstico genético confirmatorio",
    confidence: "high",
  },
  {
    finding: "lab-alpha-gal-low",
    disease: "fabry",
    lrPlus: 50,
    lrMinus: 0.1,
    source: "Linhart · Eur Heart J 2020 · enzima leucocitaria en hombres",
    confidence: "high",
  },
  {
    finding: "history-family-neuropathy",
    disease: "fabry",
    lrPlus: 3.5,
    lrMinus: 0.7,
    source: "Bouwer · Eur Heart J 2024 · neuropatía dolorosa Fabry",
    confidence: "medium",
  },

  // ===== Miocarditis aguda =====
  {
    finding: "history-recent-viral",
    disease: "myocarditis-acute",
    lrPlus: 6,
    lrMinus: 0.35,
    source: "Caforio · Eur Heart J 2013 · ESC myocarditis position paper",
    confidence: "high",
  },
  {
    finding: "lab-troponin-rising",
    disease: "myocarditis-acute",
    lrPlus: 7,
    lrMinus: 0.2,
    source: "Caforio · Eur Heart J 2013 · troponina criterio diagnóstico",
    confidence: "high",
  },
  {
    finding: "ecg-stelevation-no-territory",
    disease: "myocarditis-acute",
    lrPlus: 5,
    lrMinus: 0.5,
    source: "Caforio · Eur Heart J 2013 · pericarditis acompañante",
    confidence: "high",
  },
  {
    finding: "ecg-prolonged-qt",
    disease: "myocarditis-acute",
    lrPlus: 2.5,
    lrMinus: 0.8,
    source: "Caforio · Eur Heart J 2013",
    confidence: "medium",
  },
  {
    finding: "echo-thick-walls",
    disease: "myocarditis-acute",
    lrPlus: 1.6,
    lrMinus: 0.75,
    source: "Caforio · Eur Heart J 2013 · edema miocárdico",
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
    source: "Ghadri · Eur Heart J 2018 · InterTAK criteria typical",
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
    source: "Ghadri · Eur Heart J 2018",
    confidence: "high",
  },
  {
    finding: "ecg-prolonged-qt",
    disease: "takotsubo",
    lrPlus: 4,
    lrMinus: 0.5,
    source: "Ghadri · Eur Heart J 2018 · QT prolongado característico subagudo",
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
    source: "Marcus · Circulation 2010 · ARVC Task Force criterion mayor",
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
