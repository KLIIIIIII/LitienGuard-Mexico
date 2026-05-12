import { ArrowDown, ArrowUp } from "lucide-react";

interface Row {
  metric: string;
  context: string;
  before: string;
  after: string;
  delta: string;
  direction: "up" | "down" | "neutral";
}

const ROWS: Row[] = [
  {
    metric: "Tiempo en notas al día",
    context: "Una jornada típica de 12 consultas",
    before: "5–6 hrs",
    after: "30–40 min",
    delta: "−85%",
    direction: "down",
  },
  {
    metric: "Tiempo por nota SOAP",
    context: "De audio crudo a SOAP firmable",
    before: "8–12 min",
    after: "13 s + revisión",
    delta: "−96%",
    direction: "down",
  },
  {
    metric: "Decisiones con evidencia citada",
    context: "GPC o guía internacional verbatim",
    before: "Rara vez",
    after: "Cada recomendación",
    delta: "Infraestructura",
    direction: "neutral",
  },
  {
    metric: "Outcomes registrados",
    context: "Sabes qué pasa después de tu recomendación",
    before: "≈0%",
    after: "60–90%",
    delta: "+nuevo capítulo",
    direction: "up",
  },
  {
    metric: "Recetas listas para firmar",
    context: "Plan farmacológico extraído del SOAP",
    before: "Manual",
    after: "Auto + revisión",
    delta: "−6 min/consulta",
    direction: "down",
  },
  {
    metric: "Cumplimiento NOM-024",
    context: "Expediente electrónico mexicano",
    before: "Manual",
    after: "Arquitectura nativa",
    delta: "Auditable",
    direction: "neutral",
  },
];

function DeltaPill({
  delta,
  direction,
}: {
  delta: string;
  direction: "up" | "down" | "neutral";
}) {
  const cls =
    direction === "down"
      ? "bg-validation-soft text-validation"
      : direction === "up"
        ? "bg-accent-soft text-accent"
        : "bg-surface-alt text-ink-strong";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold ${cls}`}
    >
      {direction === "down" && <ArrowDown className="h-3 w-3" strokeWidth={2.4} />}
      {direction === "up" && <ArrowUp className="h-3 w-3" strokeWidth={2.4} />}
      {delta}
    </span>
  );
}

export function ImpactTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-surface-alt">
            <tr>
              <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                Métrica
              </th>
              <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                Antes de LitienGuard
              </th>
              <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                Con LitienGuard
              </th>
              <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                Cambio
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ROWS.map((r) => (
              <tr key={r.metric} className="hover:bg-surface-alt/40">
                <td className="px-5 py-4 align-top">
                  <p className="text-body-sm font-semibold text-ink-strong">
                    {r.metric}
                  </p>
                  <p className="mt-0.5 text-caption text-ink-muted">
                    {r.context}
                  </p>
                </td>
                <td className="px-5 py-4 align-top text-body-sm text-ink-muted">
                  {r.before}
                </td>
                <td className="px-5 py-4 align-top text-body-sm font-semibold text-ink-strong">
                  {r.after}
                </td>
                <td className="px-5 py-4 align-top">
                  <DeltaPill delta={r.delta} direction={r.direction} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line bg-surface-alt px-5 py-3">
        <p className="text-caption text-ink-soft leading-relaxed">
          Cifras representativas del piloto. Cada médico construye sus
          propios números conforme acumula consultas — los verás reflejados
          en tu panel de calidad.
        </p>
      </div>
    </div>
  );
}
