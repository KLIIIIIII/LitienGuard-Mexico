import { Brain, Quote, Users, Workflow } from "lucide-react";

const DIFFERENCES = [
  {
    icon: Brain,
    title: "Capa de inteligencia, no reemplazo",
    desc: "LitienGuard convive con tu Nimbo, SaludTotal o el sistema que ya uses. Agregamos diferencial diagnóstico y red flags — no te pedimos migrar todo.",
  },
  {
    icon: Quote,
    title: "Cita verbatim a guía mexicana",
    desc: "Cada recomendación viene con su guía clínica oficial, fuerza de evidencia y cita textual con número de página del documento fuente. Sin inventar nada.",
  },
  {
    icon: Users,
    title: "Aprende de tu propia práctica",
    desc: "Outcomes, override patterns y patrones detectados desde TUS pacientes — no de cohortes US. Tu calibración personal por enfermedad.",
  },
  {
    icon: Workflow,
    title: "Compatible Reforma LGS 2026",
    desc: "SINBA, credencial paciente, interop, NOM-024 y LFPDPPP integrados desde el día uno. Cuando llegue la obligación regulatoria, ya estás listo.",
  },
];

/**
 * Differentiation strip — subtle competitor positioning without naming
 * specific competitors. Aimed at audiences who've evaluated other Mexican
 * EHRs and need a reason to choose LitienGuard.
 */
export function DiferenciadorStrip({
  eyebrow = "Por qué LitienGuard, no otro expediente clínico",
  title = "Cuatro razones que se notan desde la primera consulta.",
}: {
  eyebrow?: string;
  title?: string;
}) {
  return (
    <section className="border-b border-line bg-canvas">
      <div className="lg-shell py-16">
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
          {eyebrow}
        </p>
        <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
          {title}
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {DIFFERENCES.map((d) => {
            const Icon = d.icon;
            return (
              <div
                key={d.title}
                className="rounded-xl border border-line bg-surface p-5 shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-validation-soft text-validation">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div>
                    <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
                      {d.title}
                    </h3>
                    <p className="mt-1.5 text-body-sm text-ink-muted leading-relaxed">
                      {d.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
