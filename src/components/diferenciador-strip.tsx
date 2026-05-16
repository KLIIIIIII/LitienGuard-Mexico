import { Brain, Quote, Users, Workflow } from "lucide-react";

const DIFFERENCES = [
  {
    icon: Brain,
    title: "Un cerebro clínico curado por médicos",
    desc: "No es una IA genérica. Cada recomendación viene con su guía clínica oficial, su fuerza de evidencia y su cita textual. Sin inventar nada.",
  },
  {
    icon: Users,
    title: "Aprende de tu práctica y de la colectiva",
    desc: "El sistema observa los patrones de tus propias decisiones y los contrasta con la evidencia académica + lo que otros médicos hacen en la red. Te ajustas más rápido.",
  },
  {
    icon: Workflow,
    title: "Healthcare Operating System completo",
    desc: "Va mucho más allá del expediente. Cerebro clínico, ciclo de ingresos hospitalario, navegación del paciente y cumplimiento de la Reforma 2026, todo en una sola plataforma que sí se habla entre sí.",
  },
  {
    icon: Quote,
    title: "Sin enviar PII a un LLM externo",
    desc: "Lo que se procesa con modelos de lenguaje está anonimizado por arquitectura. Tu información clínica no entrena modelos de terceros, ni vive en su nube indefinidamente.",
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
