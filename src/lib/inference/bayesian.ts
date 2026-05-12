/**
 * Motor bayesiano de razonamiento clínico multi-señal.
 *
 * Para cada enfermedad candidata, calcula:
 *   posterior_odds = prior_odds × ∏ (LR_finding_i)
 *
 * donde LR_finding_i = LR+ si finding presente, LR- si ausente, 1 si no
 * evaluado. Convierte odds a probabilidad y normaliza el vector para
 * que las posteriores sumen 1 entre todas las enfermedades candidatas
 * (multinomial Bayes asumiendo independencia condicional aproximada).
 *
 * Implementación en log-odds para estabilidad numérica.
 */

import type {
  Disease,
  FindingObservation,
  InferenceResult,
  LikelihoodRatio,
} from "./types";
import {
  DISEASES,
  LIKELIHOOD_RATIOS,
  findFinding,
  lrsForDisease,
} from "./knowledge-base";

function priorLogOdds(prior: number): number {
  const clamped = Math.max(1e-6, Math.min(1 - 1e-6, prior));
  return Math.log(clamped / (1 - clamped));
}

function lrToLogLR(lr: number): number {
  return Math.log(Math.max(1e-6, lr));
}

function logOddsToProb(logOdds: number): number {
  // p = e^x / (1 + e^x), estable para |x| grande
  if (logOdds >= 0) {
    const e = Math.exp(-logOdds);
    return 1 / (1 + e);
  }
  const e = Math.exp(logOdds);
  return e / (1 + e);
}

/**
 * Calcula el log-odds posterior y desglose de contribución por finding
 * para una sola enfermedad.
 */
function inferSingleDisease(
  disease: Disease,
  observations: FindingObservation[],
  lrs: LikelihoodRatio[],
): InferenceResult {
  const diseaseLrs = lrs.filter((lr) => lr.disease === disease.id);
  const evidence: InferenceResult["evidence"] = [];

  let logOdds = priorLogOdds(disease.prior);

  for (const obs of observations) {
    if (obs.present === null) continue;
    const lr = diseaseLrs.find((x) => x.finding === obs.finding);
    if (!lr) continue;
    const finding = findFinding(obs.finding);
    if (!finding) continue;

    const lrValue = obs.present ? lr.lrPlus : lr.lrMinus;
    const contribution = lrToLogLR(lrValue);
    logOdds += contribution;

    if (Math.abs(contribution) > 0.05) {
      evidence.push({
        finding,
        present: obs.present,
        logLRcontribution: contribution,
        source: lr.source,
      });
    }
  }

  evidence.sort(
    (a, b) => Math.abs(b.logLRcontribution) - Math.abs(a.logLRcontribution),
  );

  return {
    disease,
    posterior: logOddsToProb(logOdds),
    logOdds,
    evidence,
  };
}

/**
 * Inferencia sobre todas las enfermedades candidatas con normalización
 * multinomial. Devuelve el ranking ordenado por probabilidad posterior.
 */
export function inferDifferential(
  observations: FindingObservation[],
  diseases: Disease[] = DISEASES,
  lrs: LikelihoodRatio[] = LIKELIHOOD_RATIOS,
): InferenceResult[] {
  const raw = diseases.map((d) => inferSingleDisease(d, observations, lrs));

  // Normalize so posteriors sum to 1 — convert each from independent-prob
  // to relative-share across the candidate set.
  const sum = raw.reduce((s, r) => s + r.posterior, 0);
  if (sum === 0) {
    return raw.sort((a, b) => b.posterior - a.posterior);
  }
  const normalized = raw.map((r) => ({
    ...r,
    posterior: r.posterior / sum,
  }));

  return normalized.sort((a, b) => b.posterior - a.posterior);
}

export { lrsForDisease };
