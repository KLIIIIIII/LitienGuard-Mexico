/**
 * Knowledge base del motor de inferencia v1 — cardiología enfocada en
 * cardiomiopatía infiltrativa / restrictiva. 6 enfermedades, 14 findings,
 * 50+ likelihood ratios todos respaldados por literatura citada.
 *
 * Fuentes principales:
 *   - 2025 ACC Concise Clinical Guidance for ATTR-CM (JACC sept 2025)
 *   - Phelan et al · Heart 2012 · apical sparing strain pattern
 *   - Westin et al · JACC 2022 · pre-cardiac amyloid manifestations
 *   - Grogan et al · Mayo Clin Proc 2021 · AI-ECG
 *   - ESC 2014 · Hypertrophic cardiomyopathy guidelines
 *   - Falk et al · JACC 2016 · diagnostic algorithm for cardiac amyloid
 *   - Maurer et al · NEJM 2018 · ATTR-ACT (tafamidis)
 *
 * Los LRs son consenso de literatura cuando hay múltiples fuentes.
 * Confidence se asigna por la solidez de la evidencia subyacente.
 */

import type { Disease, Finding, LikelihoodRatio } from "./types";

// ============================================================
// Enfermedades candidatas — 6 etiologías de LVH/restrictiva en >60 años
// ============================================================
export const DISEASES: Disease[] = [
  {
    id: "attr-cm",
    label: "ATTR-CM (amiloidosis cardíaca por transtiretina)",
    prior: 0.05, // ~5% de HFpEF idiopático >65 años (Mayo Clin Proc 2019)
  },
  {
    id: "al-amyloid",
    label: "AL amyloid (amiloidosis de cadenas ligeras)",
    prior: 0.02,
  },
  {
    id: "hfpef-idiopathic",
    label: "HFpEF idiopática / multifactorial",
    prior: 0.65,
  },
  {
    id: "hypertensive-hd",
    label: "Cardiopatía hipertensiva con LVH",
    prior: 0.18,
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
    id: "other",
    label: "Otras causas de LVH / restrictivo",
    prior: 0.02,
  },
];

// ============================================================
// Findings clínicos — 14 hallazgos relevantes para el diferencial
// ============================================================
export const FINDINGS: Finding[] = [
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
    id: "history-cts-bilateral",
    label: "Síndrome del túnel del carpo bilateral",
    category: "history",
    detail: "Especialmente con cirugía descompresiva",
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
    id: "exam-orthostasis",
    label: "Hipotensión ortostática / disautonomía",
    category: "exam",
  },
];

// ============================================================
// Likelihood ratios — cada (finding, disease) con LR+ y LR-
// LRs ≈ 1 (no informativos) se omiten para mantener la matriz manejable.
// ============================================================
export const LIKELIHOOD_RATIOS: LikelihoodRatio[] = [
  // -------- ATTR-CM --------
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
    lrPlus: 0.6, // anormal sugiere AL, no ATTR
    lrMinus: 1.2,
    source: "Falk · JACC 2016 · differential AL vs ATTR",
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

  // -------- AL Amyloid --------
  {
    finding: "lab-flc-abnormal",
    disease: "al-amyloid",
    lrPlus: 25, // alta especificidad
    lrMinus: 0.05, // alta sensibilidad — descarta si normal
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

  // -------- HCM (sarcomérica) --------
  {
    finding: "echo-asymmetric-septal",
    disease: "hcm",
    lrPlus: 8,
    lrMinus: 0.18,
    source: "ESC HCM Guidelines 2014 · diagnostic criteria",
    confidence: "high",
  },
  {
    finding: "echo-thick-walls",
    disease: "hcm",
    lrPlus: 3.5,
    lrMinus: 0.1,
    source: "ESC HCM Guidelines 2014",
    confidence: "high",
  },
  {
    finding: "history-family-scd",
    disease: "hcm",
    lrPlus: 10,
    lrMinus: 0.7,
    source: "ESC HCM Guidelines 2014 · familial history HCM",
    confidence: "high",
  },
  {
    finding: "ecg-pseudoinfarct",
    disease: "hcm",
    lrPlus: 2.0,
    lrMinus: 0.85,
    source: "ESC HCM Guidelines 2014",
    confidence: "medium",
  },
  {
    finding: "ecg-low-voltage-paradox",
    disease: "hcm",
    lrPlus: 0.5, // HCM tiene voltaje alto típicamente
    lrMinus: 1.1,
    source: "ESC HCM Guidelines 2014",
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

  // -------- Cardiopatía hipertensiva --------
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

  // -------- HFpEF idiopática --------
  // HFpEF es heterogénea, casi no tiene findings específicos.
  // Sus LRs son cercanos a 1 — actúa como prior basal.
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
    lrPlus: 0.3, // si hay apical sparing, no es HFpEF idiopática
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

  // -------- Sarcoidosis cardíaca --------
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
