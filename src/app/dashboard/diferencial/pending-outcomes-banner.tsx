import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

interface PendingRow {
  id: string;
  paciente_iniciales: string | null;
  medico_diagnostico_principal: string | null;
  antiguedad_dias: number;
}

interface Props {
  pendientes: PendingRow[];
}

export function PendingOutcomesBanner({ pendientes }: Props) {
  if (pendientes.length === 0) return null;

  const top = pendientes.slice(0, 3);
  const restantes = pendientes.length - top.length;

  return (
    <section className="rounded-xl border border-warn-soft bg-warn-soft/30 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warn-soft text-warn">
          <Clock className="h-4 w-4" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-body font-semibold text-ink-strong">
            {pendientes.length === 1
              ? "1 caso pendiente de outcome"
              : `${pendientes.length} casos pendientes de outcome`}
          </h2>
          <p className="mt-0.5 text-caption text-ink-muted">
            Marcaste diagnóstico hace más de 7 días y aún no registras qué pasó.
            El loop de calidad necesita el cierre para funcionar.
          </p>

          <ul className="mt-3 space-y-1.5">
            {top.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/diferencial/${p.id}`}
                  className="group flex items-center gap-2 rounded-lg border border-line/60 bg-surface px-3 py-2 text-body-sm transition-colors hover:border-warn hover:bg-surface-alt"
                >
                  <span className="text-ink-strong truncate flex-1 min-w-0">
                    {p.paciente_iniciales ?? "Paciente"}
                    {p.medico_diagnostico_principal && (
                      <>
                        <span className="text-ink-quiet"> · </span>
                        <span className="text-ink-muted truncate">
                          {p.medico_diagnostico_principal}
                        </span>
                      </>
                    )}
                  </span>
                  <span className="shrink-0 text-caption text-warn tabular-nums">
                    {p.antiguedad_dias}d
                  </span>
                  <ArrowRight
                    className="h-3.5 w-3.5 shrink-0 text-ink-quiet transition-transform group-hover:translate-x-0.5 group-hover:text-warn"
                    strokeWidth={2.2}
                  />
                </Link>
              </li>
            ))}
          </ul>

          {restantes > 0 && (
            <Link
              href="/dashboard/diferencial/historial?pendientes=1"
              className="mt-3 inline-flex items-center gap-1 text-caption font-semibold text-warn hover:underline"
            >
              Ver los {restantes} restantes
              <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
