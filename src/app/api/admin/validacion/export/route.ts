import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { runBenchmark } from "@/lib/inference/validation";
import {
  DISEASES,
  FINDINGS,
  LIKELIHOOD_RATIOS,
} from "@/lib/inference/knowledge-base";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "no auth" }, { status: 401 });

  const { data: profile } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const cohortSize = Math.min(
    10000,
    Math.max(100, Number(url.searchParams.get("size") ?? 1000)),
  );
  const seed = Number(url.searchParams.get("seed") ?? 42);

  const benchmark = runBenchmark({
    cohortSize,
    seed,
    includeExamples: false,
  });

  const report = {
    schema_version: "1.0",
    generated_at: benchmark.generatedAt,
    seed: benchmark.seed,
    cohort: {
      total: benchmark.cohort.total,
      distribution: benchmark.cohort.distribution,
    },
    knowledge_base_version: {
      diseases: DISEASES.length,
      findings: FINDINGS.length,
      likelihood_ratios: LIKELIHOOD_RATIOS.length,
    },
    aggregate_metrics: {
      top1_accuracy: benchmark.top1Accuracy,
      top3_accuracy: benchmark.top3Accuracy,
    },
    per_disease: DISEASES.map((d) => {
      const m = benchmark.metricsByDisease[d.id];
      return {
        disease_id: d.id,
        disease_label: d.label,
        prior: d.prior,
        n_positive: m?.n_positive ?? 0,
        n_negative: m?.n_negative ?? 0,
        auc: m?.auc ?? null,
        sensitivity_at_90_specificity: m?.sensitivity90Spec ?? null,
        sensitivity_at_95_specificity: m?.sensitivity95Spec ?? null,
        brier_score: m?.brierScore ?? null,
      };
    }),
    methodology: {
      cohort: "Synthetic patients sampled multinomially from disease priors. Findings sampled conditionally on disease using published LR+ and finding base prevalence.",
      inference: "Bayesian update in log-odds space with multinomial normalization across all candidates.",
      auc: "One-vs-rest binary AUC via trapezoidal rule on full ROC.",
      brier: "Mean squared error of predicted probability vs true label.",
      reproducibility: `Deterministic given (seed=${seed}, cohortSize=${cohortSize}). Mulberry32 PRNG.`,
      caveat: "Synthetic cohort calibrated with published LRs is NOT equivalent to prospective real-world validation. Treat as engineering benchmark, not clinical proof.",
    },
    citations_sample: LIKELIHOOD_RATIOS.slice(0, 8).map((lr) => ({
      finding: lr.finding,
      disease: lr.disease,
      lr_plus: lr.lrPlus,
      source: lr.source,
    })),
  };

  void recordAudit({
    userId: user.id,
    action: "admin.validacion_exported",
    metadata: { cohort_size: cohortSize, seed },
  });

  const json = JSON.stringify(report, null, 2);
  const filename = `litienguard-validation-n${cohortSize}-seed${seed}.json`;

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
