/**
 * Generador de cohorte sintética de pacientes para validación
 * retrospectiva del motor bayesiano.
 *
 * Estrategia:
 *   1. Sample disease ~ multinomial(prevalence distribution)
 *   2. Para cada (finding, true_disease): sample presence con probabilidad
 *      derivada del LR+ y la prevalencia del finding en controles
 *
 * Las distribuciones de presencia por enfermedad se calibran de literatura
 * publicada (Mayo 2021, Phelan 2012, Westin 2022). Los pacientes
 * sintéticos no son inventados; representan distribuciones realistas
 * basadas en la evidencia.
 *
 * Generador determinístico con seed para reproducibilidad.
 */

import type {
  Disease,
  FindingObservation,
  LikelihoodRatio,
} from "./types";
import { DISEASES, FINDINGS, LIKELIHOOD_RATIOS } from "./knowledge-base";

// PRNG determinístico simple (mulberry32) para reproducibilidad
function makePRNG(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleCategorical<T>(
  rng: () => number,
  items: T[],
  weights: number[],
): T {
  const total = weights.reduce((s, w) => s + w, 0);
  const r = rng() * total;
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (r <= acc) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Probabilidad base de que un finding esté presente en controles
 * (pacientes que no tienen la enfermedad). Estimaciones de literatura.
 */
const BASE_PREVALENCE: Record<string, number> = {
  // ECG
  "ecg-low-voltage-paradox": 0.05,
  "ecg-pseudoinfarct": 0.07,
  "ecg-conduction-disease": 0.1,
  "ecg-short-pr": 0.03,
  "ecg-epsilon-wave": 0.005,
  "ecg-twi-right-precordial": 0.04,
  "ecg-stelevation-no-territory": 0.03,
  "ecg-prolonged-qt": 0.03,
  "ecg-sinus-tachycardia-fixed": 0.08,
  // Eco
  "echo-apical-sparing": 0.03,
  "echo-thick-walls": 0.18,
  "echo-biatrial-enlarge": 0.12,
  "echo-granular-sparkle": 0.06,
  "echo-asymmetric-septal": 0.04,
  "echo-apical-ballooning": 0.005,
  "echo-rv-dilation-akinesia": 0.01,
  "echo-septal-bounce": 0.02,
  // Lab — cardio
  "lab-ntprobnp-disproportionate": 0.15,
  "lab-flc-abnormal": 0.05,
  "lab-troponin-rising": 0.1,
  "lab-pyp-scan-positive": 0.03,
  "lab-alpha-gal-low": 0.005,
  // Lab — endocrino / infecto / metabólico
  "lab-tsh-elevated": 0.05,
  "lab-tsh-suppressed": 0.02,
  "lab-cortisol-am-low": 0.01,
  "lab-cortisol-am-elevated": 0.01,
  "lab-metanephrines-elevated": 0.005,
  "lab-hypokalemia": 0.04,
  "lab-blood-cultures-positive": 0.02,
  "lab-lactate-elevated": 0.06,
  "lab-procalcitonin-elevated": 0.07,
  "lab-chest-infiltrate": 0.08,
  // Historia
  "history-cts-bilateral": 0.04,
  "history-family-neuropathy": 0.03,
  "history-family-scd": 0.03,
  "history-recent-viral": 0.3,
  "history-emotional-stress": 0.15,
  "history-fever": 0.12,
  "history-thunderclap-headache": 0.01,
  "history-night-sweats-weight-loss": 0.04,
  "history-bp-paroxysmal": 0.02,
  // Examen
  "exam-orthostasis": 0.08,
  "exam-angiokeratoma": 0.005,
  "exam-focal-deficit-acute": 0.03,
  "exam-meningismus": 0.01,
  "exam-new-murmur": 0.04,
  "exam-altered-mental-status": 0.06,
  "exam-bradykinesia-tremor": 0.02,
  "exam-cushingoid-features": 0.005,
  "exam-hyperpigmentation": 0.01,
  // Genética
  "genetic-gla-mutation": 0.003,
};

/**
 * Probabilidad condicional de un finding dada una enfermedad,
 * derivada del LR+ y la prevalencia base de finding en controles.
 *   P(F+|D+) = LR+ × P(F+|D-) / [1 - P(F+|D-) + LR+ × P(F+|D-)]
 * Aproximación bayesiana asumiendo independencia condicional.
 */
function findingPresenceGivenDisease(
  finding: string,
  disease: string,
  lrs: LikelihoodRatio[],
): number {
  const baseRate = BASE_PREVALENCE[finding] ?? 0.05;
  const lr = lrs.find((x) => x.finding === finding && x.disease === disease);
  const lrPlus = lr?.lrPlus ?? 1;

  // Bayesian conversion of LR+ to sensitivity given specificity (1 - baseRate)
  // Approximation: P(F+|D+) ≈ LR+ × baseRate when baseRate small
  const numerator = lrPlus * baseRate;
  const denominator = 1 - baseRate + lrPlus * baseRate;
  return Math.min(0.99, Math.max(0.001, numerator / denominator));
}

export interface SyntheticPatient {
  id: string;
  trueDisease: string;
  observations: FindingObservation[];
}

export interface CohortConfig {
  size: number;
  seed: number;
  /** Distribución de enfermedades en la cohorte; default usa priors */
  diseaseWeights?: Record<string, number>;
  /** Probabilidad de que un finding sea no-evaluado (missing). Realista en mundo real. */
  missingnessRate?: number;
}

export function generateCohort(
  config: CohortConfig,
  diseases: Disease[] = DISEASES,
  lrs: LikelihoodRatio[] = LIKELIHOOD_RATIOS,
): SyntheticPatient[] {
  const rng = makePRNG(config.seed);
  const missRate = config.missingnessRate ?? 0.15;

  // Weights for sampling true disease — default to literature priors
  const weights = diseases.map(
    (d) => config.diseaseWeights?.[d.id] ?? d.prior,
  );

  const patients: SyntheticPatient[] = [];

  for (let i = 0; i < config.size; i++) {
    const disease = sampleCategorical(rng, diseases, weights);

    const observations: FindingObservation[] = FINDINGS.map((f) => {
      // Each finding has a chance of being "not evaluated" — mirrors
      // real-world clinic where only some labs/studies are ordered.
      if (rng() < missRate) {
        return { finding: f.id, present: null };
      }

      const probPresent = findingPresenceGivenDisease(f.id, disease.id, lrs);
      return { finding: f.id, present: rng() < probPresent };
    });

    patients.push({
      id: `synth-${i + 1}`,
      trueDisease: disease.id,
      observations,
    });
  }

  return patients;
}
