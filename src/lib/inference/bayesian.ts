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
  findDisease,
  lrsForDisease,
} from "./knowledge-base";

export { findDisease };

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
 *
 * Si `priorOverride` se proporciona, se usa en lugar de `disease.prior`.
 * Útil para inyectar calibración LATAM/MX sin tocar el catálogo base.
 */
function inferSingleDisease(
  disease: Disease,
  observations: FindingObservation[],
  lrs: LikelihoodRatio[],
  priorOverride?: number,
): InferenceResult {
  const diseaseLrs = lrs.filter((lr) => lr.disease === disease.id);
  const evidence: InferenceResult["evidence"] = [];

  const effectivePrior =
    priorOverride !== undefined ? priorOverride : disease.prior;
  let logOdds = priorLogOdds(effectivePrior);

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

export interface InferenceOptions {
  /**
   * Override de priors por enfermedad — vector parcial o completo.
   * Si una enfermedad no aparece en el record, usa su prior del catálogo.
   * Útil para inyectar la capa LATAM/MX desde priors-mx.ts.
   */
  priorsOverride?: Record<string, number>;
}

/**
 * Inferencia sobre todas las enfermedades candidatas con normalización
 * multinomial. Devuelve el ranking ordenado por probabilidad posterior.
 *
 * Pasar `options.priorsOverride` ajusta el motor a una población distinta
 * a la cohorte de calibración del catálogo (típicamente, prevalencias MX
 * vs cohortes internacionales).
 */
export function inferDifferential(
  observations: FindingObservation[],
  diseases: Disease[] = DISEASES,
  lrs: LikelihoodRatio[] = LIKELIHOOD_RATIOS,
  options: InferenceOptions = {},
): InferenceResult[] {
  const priors = options.priorsOverride;
  const raw = diseases.map((d) =>
    inferSingleDisease(d, observations, lrs, priors?.[d.id]),
  );

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

/**
 * Findings con mayor poder discriminativo para una enfermedad dada,
 * que el médico aún NO ha evaluado. Útil para guiar el siguiente paso
 * de la evaluación clínica: "para confirmar o descartar tu hipótesis,
 * busca estos hallazgos primero".
 *
 * Poder discriminativo = |log(LR+ / LR-)| — qué tanto mueve la
 * probabilidad si el finding está presente vs ausente.
 */
export interface SuggestedFinding {
  finding: import("./types").Finding;
  lrPlus: number;
  lrMinus: number;
  /** Poder discriminativo en log-units (mayor = más informativo) */
  discriminativePower: number;
  source: string;
  confidence: "high" | "medium" | "low";
}

export function suggestFindingsToConfirm(
  diseaseId: string,
  observations: FindingObservation[],
  topN = 8,
  lrs: LikelihoodRatio[] = LIKELIHOOD_RATIOS,
): SuggestedFinding[] {
  const observedIds = new Set(
    observations.filter((o) => o.present !== null).map((o) => o.finding),
  );

  const candidates: SuggestedFinding[] = [];
  for (const lr of lrs) {
    if (lr.disease !== diseaseId) continue;
    if (observedIds.has(lr.finding)) continue;
    const finding = findFinding(lr.finding);
    if (!finding) continue;

    const safeMinus = Math.max(1e-3, lr.lrMinus);
    const safePlus = Math.max(1e-3, lr.lrPlus);
    const power = Math.abs(Math.log(safePlus / safeMinus));

    candidates.push({
      finding,
      lrPlus: lr.lrPlus,
      lrMinus: lr.lrMinus,
      discriminativePower: power,
      source: lr.source,
      confidence: lr.confidence,
    });
  }

  candidates.sort((a, b) => b.discriminativePower - a.discriminativePower);
  return candidates.slice(0, topN);
}
