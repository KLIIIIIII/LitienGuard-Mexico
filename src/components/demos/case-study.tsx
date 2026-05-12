import { Quote, Stethoscope, TrendingUp, Heart } from "lucide-react";

interface MetricBlock {
  icon: typeof Quote;
  label: string;
  value: string;
  context: string;
}

const METRICS: MetricBlock[] = [
  {
    icon: Heart,
    label: "Pacientes HFrEF en GDMT óptima",
    value: "67%",
    context: "vs 18% basal · CHAMP-HF MX",
  },
  {
    icon: Stethoscope,
    label: "Override del médico documentado",
    value: "23%",
    context: "razón fisiopatológica registrada",
  },
  {
    icon: TrendingUp,
    label: "Reducción NT-proBNP a 12 sem",
    value: "−38%",
    context: "promedio cohorte ICC-FEVIr",
  },
];

export function CaseStudy() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
      <div className="grid lg:grid-cols-[1.1fr_minmax(0,1fr)]">
        <div className="border-b border-line bg-surface-alt p-8 lg:border-b-0 lg:border-r">
          <Quote className="h-8 w-8 text-validation" strokeWidth={1.6} />
          <p className="mt-5 text-body italic text-ink-strong leading-relaxed">
            «Lo que me convenció es que el cerebro me cita textual la guía
            con el número de página, y diferencia clase de recomendación con
            nivel de evidencia. Tengo 14 años de cardiología y sigo
            aprendiendo cosas que me había perdido.
          </p>
          <p className="mt-3 text-body italic text-ink-strong leading-relaxed">
            Cuando paso por encima de la sugerencia — porque sí pasa, hay
            contexto que el sistema no ve — la decisión queda registrada con
            mi razonamiento. Al final del mes veo qué overrides resultaron
            mejor o peor que la guía. Es la primera vez que tengo ese loop.»
          </p>

          <div className="mt-6 flex items-center gap-3 border-t border-line pt-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-validation-soft">
              <span className="text-body-sm font-bold text-validation">DR</span>
            </div>
            <div>
              <p className="text-body-sm font-semibold text-ink-strong">
                Dr. M.A. · cardiólogo intervencionista
              </p>
              <p className="text-caption text-ink-muted">
                CDMX · 14 años de práctica · piloto LitienGuard sem 9
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
            Cohorte propia · 12 semanas
          </p>
          <p className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
            34 pacientes HFrEF · 41 ajustes GDMT
          </p>

          <div className="mt-6 space-y-4">
            {METRICS.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="flex items-start gap-4 border-b border-line pb-4 last:border-b-0 last:pb-0"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-validation-soft text-validation">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="flex-1">
                    <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                      {m.label}
                    </p>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className="text-h1 font-bold text-ink-strong leading-none">
                        {m.value}
                      </span>
                      <span className="text-caption text-ink-muted">
                        {m.context}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-caption text-ink-soft leading-relaxed">
            Datos del panel propio del médico, exportables como CSV.
            Identidad anonimizada con consentimiento; ciudad y especialidad
            publicadas; cohorte verificable por cruce con el cerebro
            colectivo (anonimizado).
          </p>
        </div>
      </div>
    </div>
  );
}
