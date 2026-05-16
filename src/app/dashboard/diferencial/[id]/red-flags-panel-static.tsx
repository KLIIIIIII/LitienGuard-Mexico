import { AlertCircle, AlertTriangle, Clock } from "lucide-react";
import type { SymptomRedFlags } from "@/lib/inference/red-flags";

/**
 * Versión read-only del panel de red flags — server component renderable
 * directo en server page. Pasa `flags` ya detectados (sync de
 * detectRedFlagsInText) y `summary` ya calculado.
 */
export function RedFlagsPanelStatic({
  flags,
  summary,
}: {
  flags: SymptomRedFlags[];
  summary: { now: number; soon: number; monitor: number };
}) {
  if (flags.length === 0) return null;
  const hasUrgent = summary.now > 0;

  return (
    <section
      className={`rounded-xl border-2 p-4 sm:p-5 ${
        hasUrgent
          ? "border-rose bg-rose-soft/30"
          : "border-warn bg-warn-soft/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            hasUrgent ? "bg-rose text-canvas" : "bg-warn text-canvas"
          }`}
        >
          {hasUrgent ? (
            <AlertCircle className="h-5 w-5" strokeWidth={2.2} />
          ) : (
            <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            Red flags presentes en el caso
          </h2>
          <p className="mt-1 text-caption text-ink-muted">
            {summary.now > 0 && (
              <>
                <strong className="font-semibold text-rose">
                  {summary.now} urgentes
                </strong>{" "}
                ·{" "}
              </>
            )}
            {summary.soon > 0 && (
              <>
                <strong className="font-semibold text-warn">
                  {summary.soon} pronto
                </strong>{" "}
                ·{" "}
              </>
            )}
            {summary.monitor > 0 && (
              <strong className="font-semibold text-ink-muted">
                {summary.monitor} a monitorear
              </strong>
            )}
          </p>
          <div className="mt-4 space-y-3">
            {flags.map((symFlags) => (
              <div
                key={symFlags.id}
                className="rounded-lg border border-line/60 bg-surface p-3"
              >
                <p className="text-caption uppercase tracking-eyebrow font-semibold text-ink-soft">
                  {symFlags.label}
                </p>
                <ul className="mt-2 space-y-2">
                  {symFlags.flags.map((flag, fi) => {
                    const Icon =
                      flag.urgency === "now"
                        ? AlertCircle
                        : flag.urgency === "soon"
                          ? AlertTriangle
                          : Clock;
                    const cls =
                      flag.urgency === "now"
                        ? "bg-rose"
                        : flag.urgency === "soon"
                          ? "bg-warn"
                          : "bg-ink-quiet";
                    return (
                      <li key={fi} className="text-body-sm">
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${cls}`}
                          >
                            <Icon
                              className="h-3 w-3 text-canvas"
                              strokeWidth={2.4}
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-ink-strong leading-snug">
                              {flag.flag}
                            </p>
                            <p className="mt-0.5 text-caption text-ink-muted leading-snug">
                              {flag.rationale}
                            </p>
                            {flag.ruleOut.length > 0 && (
                              <p className="mt-1 text-caption text-ink-soft">
                                Descartar:{" "}
                                {flag.ruleOut.map((r) => r.label).join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
