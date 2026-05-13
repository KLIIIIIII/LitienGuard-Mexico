import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { runBenchmark } from "@/lib/inference/validation";
import { DISEASES } from "@/lib/inference/knowledge-base";
import { Eyebrow } from "@/components/eyebrow";
import {
  CheckCircle2,
  TrendingUp,
  Database,
  Beaker,
  AlertCircle,
  Download,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Validación del motor — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function fmtAuc(n: number): string {
  return n.toFixed(3);
}

export default async function ValidacionPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Run the benchmark — small for instant page load
  const benchmark = runBenchmark({
    cohortSize: 1000,
    seed: 42,
    includeExamples: true,
    exampleCount: 3,
  });

  const attrCmMetrics = benchmark.metricsByDisease["attr-cm"];
  const headlineAuc = attrCmMetrics?.auc ?? 0;
  const headlineSens = attrCmMetrics?.sensitivity90Spec ?? 0;

  return (
    <div className="lg-shell py-12 lg:py-16 space-y-8">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <Eyebrow tone="validation">Validación retrospectiva</Eyebrow>
          <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Motor de inferencia bayesiano · benchmark sintético
          </h1>
          <p className="mt-3 max-w-prose text-body text-ink-muted">
            Cohorte sintética de{" "}
            {benchmark.cohort.total.toLocaleString("es-MX")} pacientes
            calibrada con likelihood ratios y prevalencias publicadas (Mayo
            Clin Proc 2021, Heart 2012, JACC 2016/2022, 2025 ACC, ESC HF
            2021, AHA-ACC HCM 2024, Sepsis-3, Duke-ISCVID 2023, ATS/IDSA
            2019). Genera findings clínicos según la enfermedad real, corre
            el motor, mide performance. Reproducible con seed ={" "}
            {benchmark.seed}.
          </p>
        </div>
        <a
          href="/api/admin/validacion/export?size=5000&seed=42"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-validation bg-validation-soft px-4 py-2 text-caption font-semibold text-validation hover:bg-validation hover:text-surface transition-colors"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
          Exportar reporte JSON (n=5000)
        </a>
      </header>

      {/* Headline metrics — ATTR-CM detection */}
      <section className="rounded-2xl border-2 border-validation bg-validation-soft/30 p-6">
        <p className="text-caption uppercase tracking-eyebrow text-validation">
          Métrica headline · detección de ATTR-CM
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-caption text-ink-muted">AUC</p>
            <p className="text-display font-bold text-validation tabular-nums">
              {fmtAuc(headlineAuc)}
            </p>
            <p className="text-caption text-ink-soft">
              vs Mayo AI-ECG 0.91 · echo AI EHJ 2025 0.93
            </p>
          </div>
          <div>
            <p className="text-caption text-ink-muted">Sens @ 90% spec</p>
            <p className="text-display font-bold text-validation tabular-nums">
              {fmtPct(headlineSens)}
            </p>
            <p className="text-caption text-ink-soft">
              en {attrCmMetrics?.n_positive ?? 0} casos ATTR-CM verdaderos
            </p>
          </div>
          <div>
            <p className="text-caption text-ink-muted">Top-1 accuracy global</p>
            <p className="text-display font-bold text-validation tabular-nums">
              {fmtPct(benchmark.top1Accuracy)}
            </p>
            <p className="text-caption text-ink-soft">
              diagnóstico más probable = verdadero
            </p>
          </div>
        </div>
      </section>

      {/* Per-disease metrics table */}
      <section>
        <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
          Métricas por diagnóstico
        </h2>
        <p className="mt-1 text-body-sm text-ink-muted">
          AUC binario one-vs-rest, sensibilidad a 90% y 95% de especificidad,
          Brier score (calibración — menor es mejor).
        </p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="min-w-full divide-y divide-line">
            <thead className="bg-surface-alt">
              <tr>
                <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                  Enfermedad
                </th>
                <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                  n (positivos)
                </th>
                <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                  AUC
                </th>
                <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                  Sens @ 90% spec
                </th>
                <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                  Brier
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {DISEASES.map((d) => {
                const m = benchmark.metricsByDisease[d.id];
                if (!m) return null;
                const aucClass =
                  m.auc >= 0.85
                    ? "text-validation font-semibold"
                    : m.auc >= 0.7
                      ? "text-warn"
                      : "text-rose";
                return (
                  <tr key={d.id}>
                    <td className="px-5 py-4 text-body-sm font-medium text-ink-strong">
                      {d.label}
                    </td>
                    <td className="px-5 py-4 text-body-sm text-ink-muted tabular-nums">
                      {m.n_positive}
                    </td>
                    <td
                      className={`px-5 py-4 text-body-sm tabular-nums ${aucClass}`}
                    >
                      {fmtAuc(m.auc)}
                    </td>
                    <td className="px-5 py-4 text-body-sm text-ink-strong tabular-nums">
                      {fmtPct(m.sensitivity90Spec)}
                    </td>
                    <td className="px-5 py-4 text-body-sm text-ink-muted tabular-nums">
                      {m.brierScore.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Example cases */}
      {benchmark.examples && benchmark.examples.length > 0 && (
        <section>
          <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
            Casos de inspección
          </h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Diagnóstico verdadero, top-1 del motor y top-3 con su probabilidad
            posterior.
          </p>
          <div className="mt-5 space-y-3">
            {benchmark.examples.map((ex, i) => {
              const correct = ex.topPrediction.disease === ex.trueDisease;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-line bg-surface p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                        Caso {i + 1} · verdadero
                      </p>
                      <p className="mt-0.5 text-body-sm font-semibold text-ink-strong">
                        {DISEASES.find((d) => d.id === ex.trueDisease)?.label ?? ex.trueDisease}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-caption font-semibold ${
                        correct
                          ? "bg-validation-soft text-validation"
                          : "bg-rose-soft text-rose"
                      }`}
                    >
                      {correct ? (
                        <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
                      ) : (
                        <AlertCircle className="h-3 w-3" strokeWidth={2.4} />
                      )}
                      {correct ? "Correcto" : "Incorrecto"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {ex.inferenceTrace.slice(0, 3).map((r) => (
                      <div
                        key={r.disease.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-alt px-3 py-2"
                      >
                        <div>
                          <p className="text-caption font-medium text-ink-strong">
                            {r.disease.label}
                          </p>
                          {r.evidence.slice(0, 2).map((e) => (
                            <p
                              key={e.finding.id}
                              className="text-[0.65rem] text-ink-muted"
                            >
                              ↳ {e.finding.label}{" "}
                              ({e.present ? "+" : "−"}) ·{" "}
                              {Math.abs(e.logLRcontribution).toFixed(2)}
                            </p>
                          ))}
                        </div>
                        <div className="text-body-sm font-bold text-validation tabular-nums">
                          {fmtPct(r.posterior)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Methodology */}
      <section className="rounded-xl border border-line bg-surface-alt p-6">
        <div className="flex items-start gap-3">
          <Database
            className="mt-0.5 h-5 w-5 shrink-0 text-validation"
            strokeWidth={2}
          />
          <div className="space-y-3">
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              Metodología
            </h2>
            <p className="text-body-sm text-ink-muted leading-relaxed">
              <strong>Cohorte:</strong> {benchmark.cohort.total} pacientes sintéticos
              generados con muestreo categórico sobre {DISEASES.length}{" "}
              enfermedades. Para cada paciente, los findings clínicos
              (ECG, eco, lab, historia, examen, genética) se muestrean con
              probabilidad calibrada a partir de los likelihood ratios
              publicados.
            </p>
            <p className="text-body-sm text-ink-muted leading-relaxed">
              <strong>Inferencia:</strong> motor bayesiano en log-odds. Para
              cada enfermedad: log_posterior = log_prior + Σ log(LR_finding_i),
              con LR+ si presente y LR- si ausente, ignorando findings no
              evaluados. Posteriores se normalizan multinomialmente.
            </p>
            <p className="text-body-sm text-ink-muted leading-relaxed">
              <strong>Métricas:</strong> AUC binario one-vs-rest por enfermedad,
              sensibilidad a especificidad fija 90% y 95%, Brier score,
              accuracy top-1 y top-3.
            </p>
            <p className="text-body-sm text-ink-muted leading-relaxed">
              <strong>Próximo paso:</strong> validación retrospectiva sobre
              MIMIC-IV (n≈17,800 adultos con/sin HF) y replicación sobre
              casos publicados (case reports open access). Validación
              prospectiva con cohorte multicéntrica mexicana pendiente de
              capital.
            </p>
          </div>
        </div>
      </section>

      {/* Provenance */}
      <section className="text-caption text-ink-soft leading-relaxed">
        <p>
          Generado {new Date(benchmark.generatedAt).toLocaleString("es-MX")} ·
          Seed determinístico {benchmark.seed} · Reproducible.
        </p>
        <p className="mt-1">
          <Beaker className="inline h-3 w-3 mr-1" strokeWidth={2} />
          Resultados sobre cohorte sintética calibrada con literatura. NO
          equivalen a validación prospectiva en pacientes reales.
        </p>
        <p className="mt-1">
          <TrendingUp className="inline h-3 w-3 mr-1" strokeWidth={2} />
          Benchmark de referencia: AI-ECG Mayo Clin Proc 2021 AUC 0.91 ·
          single-clip echo AI Eur Heart J 2025 AUC 0.93.
        </p>
      </section>
    </div>
  );
}
