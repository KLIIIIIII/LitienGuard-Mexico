import Link from "next/link";
import { Folder, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface SessionRow {
  id: string;
  paciente_iniciales: string | null;
  paciente_edad: number | null;
  contexto_clinico: string | null;
  top_diagnoses: Array<{ disease: string; label: string; posterior: number }> | null;
  medico_diagnostico_principal: string | null;
  outcome_confirmado: string | null;
  created_at: string;
}

export function HistorialList({
  sessions,
  compact = false,
}: {
  sessions: SessionRow[];
  compact?: boolean;
}) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center">
        <Folder
          className="mx-auto h-8 w-8 text-ink-quiet"
          strokeWidth={1.6}
        />
        <p className="mt-3 text-body-sm text-ink-muted">
          Aún no has guardado ningún caso.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <table className="min-w-full divide-y divide-line">
        <thead className="bg-surface-alt">
          <tr>
            <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
              Caso
            </th>
            <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
              Top sugerencia
            </th>
            {!compact && (
              <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                Tu dx
              </th>
            )}
            <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
              Outcome
            </th>
            <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
              Fecha
            </th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {sessions.map((s) => {
            const top = s.top_diagnoses?.[0];
            const fecha = new Date(s.created_at);
            const outcomeIcon =
              s.outcome_confirmado === "confirmado"
                ? CheckCircle2
                : s.outcome_confirmado === "refutado"
                  ? AlertCircle
                  : Clock;
            const outcomeColor =
              s.outcome_confirmado === "confirmado"
                ? "text-validation"
                : s.outcome_confirmado === "refutado"
                  ? "text-rose"
                  : "text-ink-quiet";
            const OutcomeIcon = outcomeIcon;
            return (
              <tr key={s.id} className="hover:bg-surface-alt/40">
                <td className="px-5 py-4">
                  <p className="text-body-sm font-semibold text-ink-strong">
                    {s.paciente_iniciales ?? "—"}
                    {s.paciente_edad ? ` · ${s.paciente_edad} a` : ""}
                  </p>
                  <p className="text-caption text-ink-soft font-mono">
                    {s.id.slice(0, 8).toUpperCase()}
                  </p>
                </td>
                <td className="px-5 py-4 text-body-sm text-ink-muted">
                  {top ? (
                    <>
                      <span className="text-ink-strong font-medium">
                        {top.label.split(" (")[0]}
                      </span>
                      <span className="ml-1 text-caption text-ink-soft tabular-nums">
                        {Math.round(top.posterior * 100)}%
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                {!compact && (
                  <td className="px-5 py-4 text-body-sm text-ink-muted">
                    {s.medico_diagnostico_principal ?? "—"}
                  </td>
                )}
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1 text-caption font-medium ${outcomeColor}`}
                  >
                    <OutcomeIcon className="h-3 w-3" strokeWidth={2.4} />
                    {s.outcome_confirmado ?? "pendiente"}
                  </span>
                </td>
                <td className="px-5 py-4 text-caption text-ink-muted">
                  {fecha.toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link
                    href={`/dashboard/diferencial/${s.id}`}
                    className="text-caption font-semibold text-validation hover:underline"
                  >
                    Abrir
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
