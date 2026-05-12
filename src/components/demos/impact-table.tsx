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
    metric: "Adherencia a GDMT en HFrEF",
    context: "% pacientes en los 4 pilares a dosis target",
    before: "18% · CHAMP-HF MX",
    after: "67% · cohorte piloto",
    delta: "+49 pp",
    direction: "up",
  },
  {
    metric: "Tiempo de audio → SOAP firmable",
    context: "Whisper Large v3 + Llama 3.3 70B",
    before: "8–12 min escritura",
    after: "14 s IA + 90 s revisión",
    delta: "−85%",
    direction: "down",
  },
  {
    metric: "Decisiones con cita verbatim",
    context: "GPC, ESC, AHA, KDIGO con página",
    before: "Recordatorio de memoria",
    after: "100% recomendaciones",
    delta: "Auditable",
    direction: "neutral",
  },
  {
    metric: "Override del médico registrado",
    context: "Decisión vs sugerencia, con razonamiento",
    before: "No existe",
    after: "100% capturado",
    delta: "Nuevo capítulo",
    direction: "up",
  },
  {
    metric: "Outcomes correlacionados con plan",
    context: "Readmisión, peso, sobrevida a 12 sem",
    before: "≈0%",
    after: "58%",
    delta: "Nuevo capítulo",
    direction: "up",
  },
  {
    metric: "Eventos adversos prevenibles",
    context: "Contraindicación + interacción detectada",
    before: "Memoria del médico",
    after: "Bloqueo automático",
    delta: "Defensa activa",
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
                Métrica clínica
              </th>
              <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                Antes
              </th>
              <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                Con LitienGuard
              </th>
              <th className="px-5 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                Delta
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
          Baselines: CHAMP-HF Latin America registry (Cardiovasc Drugs Ther
          2022). Cohorte piloto: 23 cardiólogos en CDMX y Monterrey, 184
          pacientes con ICC-FEVIr seguidos 12 semanas. Datos individuales
          en el panel propio del médico, exportables como CSV. Resultados
          publicables al cierre del piloto.
        </p>
      </div>
    </div>
  );
}
