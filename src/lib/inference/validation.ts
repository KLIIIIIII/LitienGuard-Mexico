/**
 * Validation harness — ejecuta el motor bayesiano sobre una cohorte
 * sintética y produce métricas estandarizadas: AUC, sensibilidad a
 * especificidades fijas, Brier score, y top-N accuracy.
 *
 * Estas métricas son las que un investigador clínico revisaría para
 * decidir si el sistema vale validación prospectiva.
 */

import type {
  BenchmarkResult,
  DiseaseId,
  FindingObservation,
  InferenceResult,
} from "./types";
import { DISEASES } from "./knowledge-base";
import { inferDifferential } from "./bayesian";
import { generateCohort, type CohortConfig } from "./synthetic-cohort";

/**
 * Calcula AUC por trapezoidal rule sobre pares (predicción, label).
 * Implementación O(n²) suficiente para n≤5000.
 */
function computeAUC(
  scores: number[],
  labels: number[],
): { auc: number; sens90: number; sens95: number } {
  if (scores.length !== labels.length) return { auc: 0, sens90: 0, sens95: 0 };

  // Pair up and sort by descending score
  const pairs = scores
    .map((s, i) => ({ score: s, label: labels[i] }))
    .sort((a, b) => b.score - a.score);

  let tp = 0;
  let fp = 0;
  const positives = labels.reduce((s, l) => s + l, 0);
  const negatives = labels.length - positives;
  if (positives === 0 || negatives === 0) {
    return { auc: 0, sens90: 0, sens95: 0 };
  }

  // ROC curve traversal
  const rocPoints: Array<{ fpr: number; tpr: number }> = [
    { fpr: 0, tpr: 0 },
  ];
  for (const { label } of pairs) {
    if (label === 1) tp++;
    else fp++;
    rocPoints.push({ fpr: fp / negatives, tpr: tp / positives });
  }

  // AUC via trapezoid
  let auc = 0;
  for (let i = 1; i < rocPoints.length; i++) {
    const a = rocPoints[i - 1];
    const b = rocPoints[i];
    auc += ((b.fpr - a.fpr) * (a.tpr + b.tpr)) / 2;
  }

  // Sensitivity at 90% / 95% specificity
  const sens = (targetSpec: number) => {
    const targetFpr = 1 - targetSpec;
    let best = 0;
    for (const p of rocPoints) {
      if (p.fpr <= targetFpr && p.tpr > best) best = p.tpr;
    }
    return best;
  };

  return {
    auc,
    sens90: sens(0.9),
    sens95: sens(0.95),
  };
}

/**
 * Brier score (mean squared error of probabilistic predictions).
 * Más bajo = mejor calibración.
 */
function brierScore(scores: number[], labels: number[]): number {
  if (scores.length !== labels.length || scores.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < scores.length; i++) {
    const diff = scores[i] - labels[i];
    sum += diff * diff;
  }
  return sum / scores.length;
}

interface RunBenchmarkOptions {
  cohortSize?: number;
  seed?: number;
  includeExamples?: boolean;
  exampleCount?: number;
  diseaseWeights?: Record<string, number>;
}

export function runBenchmark(
  opts: RunBenchmarkOptions = {},
): BenchmarkResult {
  const config: CohortConfig = {
    size: opts.cohortSize ?? 1000,
    seed: opts.seed ?? 42,
    diseaseWeights: opts.diseaseWeights,
  };

  const cohort = generateCohort(config);

  // Run inference on each patient
  type Row = {
    trueDisease: string;
    observations: FindingObservation[];
    posteriors: Map<DiseaseId, number>;
    inference: InferenceResult[];
  };
  const rows: Row[] = cohort.map((p) => {
    const inference = inferDifferential(p.observations);
    const posteriors = new Map<DiseaseId, number>();
    for (const r of inference) posteriors.set(r.disease.id, r.posterior);
    return {
      trueDisease: p.trueDisease,
      observations: p.observations,
      posteriors,
      inference,
    };
  });

  // Per-disease binary classification metrics
  const metricsByDisease: BenchmarkResult["metricsByDisease"] = {};
  const distribution: Record<DiseaseId, number> = {};

  for (const d of DISEASES) {
    distribution[d.id] = rows.filter((r) => r.trueDisease === d.id).length;
    const scores: number[] = rows.map((r) => r.posteriors.get(d.id) ?? 0);
    const labels: number[] = rows.map((r) =>
      r.trueDisease === d.id ? 1 : 0,
    );

    const { auc, sens90, sens95 } = computeAUC(scores, labels);
    const brier = brierScore(scores, labels);

    const nPositive = labels.reduce((s: number, l: number) => s + l, 0);
    metricsByDisease[d.id] = {
      auc,
      sensitivity90Spec: sens90,
      sensitivity95Spec: sens95,
      brierScore: brier,
      n_positive: nPositive,
      n_negative: labels.length - nPositive,
    };
  }

  // Top-N accuracy
  let top1 = 0;
  let top3 = 0;
  for (const r of rows) {
    const top = r.inference.map((x) => x.disease.id);
    if (top[0] === r.trueDisease) top1++;
    if (top.slice(0, 3).includes(r.trueDisease)) top3++;
  }

  // Optionally include sample cases for inspection
  const examples = opts.includeExamples
    ? rows
        .filter((r) => r.trueDisease === "attr-cm" || r.trueDisease === "hcm")
        .slice(0, opts.exampleCount ?? 5)
        .map((r) => ({
          trueDisease: r.trueDisease,
          findings: r.observations,
          topPrediction: {
            disease: r.inference[0].disease.id,
            posterior: r.inference[0].posterior,
          },
          inferenceTrace: r.inference,
        }))
    : undefined;

  return {
    cohort: { total: cohort.length, distribution },
    metricsByDisease,
    top1Accuracy: top1 / rows.length,
    top3Accuracy: top3 / rows.length,
    examples,
    generatedAt: new Date().toISOString(),
    seed: config.seed,
  };
}
