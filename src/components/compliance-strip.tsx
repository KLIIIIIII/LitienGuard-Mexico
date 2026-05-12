import { ShieldCheck, FileCheck, Lock, Sparkles } from "lucide-react";

const ITEMS = [
  {
    icon: FileCheck,
    label: "NOM-024-SSA3",
    detail: "Expediente clínico electrónico",
  },
  {
    icon: Lock,
    label: "LFPDPPP",
    detail: "Protección de datos personales",
  },
  {
    icon: ShieldCheck,
    label: "Reforma Salud Digital 2026",
    detail: "SINBA + Credencial Paciente",
  },
  {
    icon: Sparkles,
    label: "Filosofía COFEPRIS",
    detail: "Requerimientos sanitarios",
  },
];

/**
 * Compliance trust strip — appears below the hero on landing pages
 * targeting practitioners and institutions. Wording is deliberately
 * cautious ("construido siguiendo…") because formal certification with
 * the Secretaría de Salud is a pending milestone, not a current claim.
 */
export function ComplianceStrip() {
  return (
    <section className="border-b border-line bg-surface-alt">
      <div className="lg-shell py-7">
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
          Construido siguiendo
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-validation-soft text-validation">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <p className="text-body-sm font-semibold text-ink-strong leading-tight">
                    {item.label}
                  </p>
                  <p className="text-caption text-ink-muted leading-tight">
                    {item.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 max-w-prose text-caption text-ink-soft leading-relaxed">
          LitienGuard está construido siguiendo los requerimientos técnicos
          de la NOM-024-SSA3-2012, la Ley Federal de Protección de Datos
          Personales en Posesión de los Particulares y los lineamientos de la
          Reforma General de Salud Digital 2026. Certificación formal por la
          Secretaría de Salud y aval COFEPRIS en proceso conforme avanzamos
          en el piloto clínico.
        </p>
      </div>
    </section>
  );
}
