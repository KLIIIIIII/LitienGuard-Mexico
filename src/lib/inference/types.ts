/**
 * Tipos del motor de inferencia bayesiana clínica.
 *
 * El motor opera sobre tres entidades:
 *   - Disease: candidato de diagnóstico con su prevalencia poblacional
 *     (prior probability before any finding).
 *   - Finding: hallazgo clínico observable (ECG, eco, lab, historia, etc).
 *   - LikelihoodRatio: cuánto debe ajustarse la probabilidad de una
 *     enfermedad dada la presencia (LR+) o ausencia (LR-) de un finding.
 *
 * Las LRs deben estar respaldadas por literatura citada con `source`.
 * Si no se conoce el LR de un finding para una enfermedad, se asume 1
 * (no informativo) — no se inventa.
 */

export type FindingId = string;
export type DiseaseId = string;
export type FindingCategory =
  | "ecg"
  | "echo"
  | "lab"
  | "history"
  | "exam"
  | "genetic";

export interface Disease {
  id: DiseaseId;
  label: string;
  /** Prevalencia base en la población de referencia (HFpEF cohort) */
  prior: number;
}

export interface Finding {
  id: FindingId;
  label: string;
  category: FindingCategory;
  /** Breve descripción clínica del hallazgo */
  detail?: string;
}

export interface LikelihoodRatio {
  finding: FindingId;
  disease: DiseaseId;
  /** LR cuando el finding está presente */
  lrPlus: number;
  /** LR cuando el finding está ausente (típicamente 0.3–0.9) */
  lrMinus: number;
  /** Fuente verbatim con citación */
  source: string;
  /** Confianza en el estimado del LR */
  confidence: "high" | "medium" | "low";
}

export interface FindingObservation {
  finding: FindingId;
  /** true = presente, false = ausente y evaluado, null = no evaluado */
  present: boolean | null;
}

export interface InferenceResult {
  disease: Disease;
  /** Probabilidad posterior (0–1) */
  posterior: number;
  /** Log-odds posterior (útil para depuración) */
  logOdds: number;
  /** Findings que más contribuyeron al posterior (positiva o negativamente) */
  evidence: Array<{
    finding: Finding;
    present: boolean;
    logLRcontribution: number;
    source: string;
  }>;
}

export interface BenchmarkResult {
  cohort: {
    total: number;
    distribution: Record<DiseaseId, number>;
  };
  /** Métricas por enfermedad — AUC, sensibilidad y especificidad para detección binaria */
  metricsByDisease: Record<
    DiseaseId,
    {
      auc: number;
      sensitivity90Spec: number;
      sensitivity95Spec: number;
      brierScore: number;
      n_positive: number;
      n_negative: number;
    }
  >;
  /** Accuracy top-1: ¿el dx con mayor posterior coincide con el verdadero? */
  top1Accuracy: number;
  /** Top-3: ¿el verdadero está entre los 3 con mayor posterior? */
  top3Accuracy: number;
  /** Casos individuales sampleados para inspección */
  examples?: Array<{
    trueDisease: DiseaseId;
    findings: FindingObservation[];
    topPrediction: { disease: DiseaseId; posterior: number };
    inferenceTrace: InferenceResult[];
  }>;
  /** Metadatos del run */
  generatedAt: string;
  seed: number;
}
