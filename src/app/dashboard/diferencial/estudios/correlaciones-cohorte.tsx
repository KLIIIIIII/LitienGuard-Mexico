import {
  AlertTriangle,
  Network,
  FlaskConical,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import type { StudyCorrelations } from "@/lib/patterns/detect-study-correlations";

interface Props {
  correlations: StudyCorrelations;
}

const LAB_LABEL: Record<string, string> = {
  potasio: "Potasio sérico",
  troponina: "Troponina",
  glucosa: "Glucosa",
  lactato: "Lactato",
  creatinina: "Creatinina",
  hemoglobina: "Hemoglobina",
  sodio: "Sodio sérico",
  ggt: "GGT",
  inr: "INR",
  bilirrubina: "Bilirrubina",
};

function labLabel(test: string): string {
  return LAB_LABEL[test] ?? test;
}

export function CorrelacionesCohorte({ correlations }: Props) {
  if (!correlations.hasEnoughData) {
    return (
      <section className="rounded-2xl border border-dashed border-line bg-surface px-6 py-8 text-center">
        <Network className="mx-auto h-7 w-7 text-ink-quiet" strokeWidth={1.6} />
        <p className="mt-3 text-body-sm font-semibold text-ink-strong">
          Aún no hay suficiente data para detectar correlaciones
        </p>
        <p className="mt-1 max-w-prose mx-auto text-caption text-ink-muted leading-relaxed">
          Las correlaciones aparecen cuando hay ≥10 estudios registrados o
          ≥3 pacientes con el mismo diagnóstico confirmado y un estudio
          anormal asociado.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-5 rounded-2xl border border-line bg-surface p-6">
      <header>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-validation" strokeWidth={2} />
          <p className="text-caption font-semibold uppercase tracking-eyebrow text-validation">
            Correlaciones detectadas en tu cohorte
          </p>
        </div>
        <h2 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
          Lo que el motor encuentra cruzando tus pacientes
        </h2>
        <p className="mt-2 max-w-3xl text-caption text-ink-muted leading-relaxed">
          {correlations.totalEventosLab} resultados de laboratorio y{" "}
          {correlations.totalEventosImaging} estudios de imagen cruzados con los
          diagnósticos confirmados en tu padrón. Los patrones que se repiten
          se vuelven obvios cuando el motor los acumula.
        </p>
      </header>

      {/* Patrones multi-score severos — alerta inmediata */}
      {correlations.patronesMultiScore.length > 0 && (
        <div className="rounded-xl border border-code-red/30 bg-code-red-bg/20 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-code-red" strokeWidth={2} />
            <p className="text-caption font-semibold uppercase tracking-eyebrow text-code-red">
              Patrones multi-score críticos
            </p>
          </div>
          <ul className="mt-3 space-y-3">
            {correlations.patronesMultiScore.map((p) => (
              <li
                key={`${p.scoreA}-${p.scoreB}`}
                className="rounded-lg border border-line bg-surface p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-body-sm font-semibold text-ink-strong">
                    {p.scoreA} {p.cuandoA}{" "}
                    <span className="font-normal text-ink-quiet">+</span>{" "}
                    {p.scoreB} {p.cuandoB}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-code-red-bg/40 px-2 py-0.5 text-caption font-semibold text-code-red">
                    {p.pacientes} paciente{p.pacientes === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1.5 text-caption text-ink-muted leading-relaxed">
                  {p.hint}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Correlaciones dx ↔ estudio */}
      {correlations.correlacionesDxEstudio.length > 0 && (
        <div>
          <div className="flex items-center gap-2">
            <Network className="h-3.5 w-3.5 text-ink-quiet" strokeWidth={2} />
            <p className="text-caption font-semibold uppercase tracking-eyebrow text-ink-soft">
              Diagnóstico ↔ Estudio anormal
            </p>
          </div>
          <ul className="mt-3 grid gap-2 lg:grid-cols-2">
            {correlations.correlacionesDxEstudio.map((c) => (
              <li
                key={`${c.diseaseId}-${c.estudio}`}
                className="rounded-lg border border-line bg-surface-alt/30 p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-caption font-semibold text-ink-strong">
                    {c.diseaseLabel}
                    <span className="mx-1.5 text-ink-quiet">↔</span>
                    <span className="text-validation">{labLabel(c.estudio)}</span>
                  </p>
                  <span className="font-mono tabular-nums text-caption font-semibold text-ink-strong">
                    {Math.round(c.ratio * 100)}%
                  </span>
                </div>
                <p className="mt-1 font-mono text-caption text-ink-quiet tabular-nums">
                  {c.pacientesConCorrelacion} de {c.pacientesTotalDx} pacientes con
                  el dx tienen {labLabel(c.estudio)} fuera de rango
                </p>
                <p className="mt-1.5 text-caption text-ink-muted leading-relaxed">
                  {c.hint}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top críticos */}
      {correlations.criticosTop.length > 0 && (
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical
              className="h-3.5 w-3.5 text-ink-quiet"
              strokeWidth={2}
            />
            <p className="text-caption font-semibold uppercase tracking-eyebrow text-ink-soft">
              Valores críticos más frecuentes
            </p>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-line">
            <table className="min-w-full divide-y divide-line">
              <thead className="bg-surface-alt">
                <tr>
                  <th className="px-3 py-2 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                    Estudio
                  </th>
                  <th className="px-3 py-2 text-right text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                    Críticos
                  </th>
                  <th className="px-3 py-2 text-right text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                    Anormales
                  </th>
                  <th className="px-3 py-2 text-right text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                    Pacientes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {correlations.criticosTop.map((c) => (
                  <tr key={c.test} className="hover:bg-surface-alt/40">
                    <td className="px-3 py-2 text-body-sm font-medium text-ink-strong">
                      {labLabel(c.test)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-body-sm font-semibold text-code-red">
                      {c.totalCritico}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-caption text-ink-muted">
                      {c.totalAnormal}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-caption text-ink-strong">
                      {c.pacientesAfectados}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-caption text-ink-soft leading-relaxed border-t border-line pt-3">
        <TrendingUp className="inline h-3 w-3 mr-1" strokeWidth={2} />
        El motor procesa toda tu cohorte cada vez que abres esta página —
        nuevos pacientes y estudios entran al cruce automáticamente.
      </p>
    </section>
  );
}
