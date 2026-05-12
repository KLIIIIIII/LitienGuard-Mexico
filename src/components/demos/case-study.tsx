import { Quote, Clock, FileCheck, Users } from "lucide-react";

interface MetricBlock {
  icon: typeof Quote;
  label: string;
  value: string;
  context: string;
}

const METRICS: MetricBlock[] = [
  {
    icon: Clock,
    label: "Horas recuperadas",
    value: "5.2",
    context: "al día, en promedio",
  },
  {
    icon: FileCheck,
    label: "Notas firmadas",
    value: "342",
    context: "en el primer mes",
  },
  {
    icon: Users,
    label: "Adherencia al plan",
    value: "67%",
    context: "outcomes registrados",
  },
];

export function CaseStudy() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
      <div className="grid lg:grid-cols-[1.1fr_minmax(0,1fr)]">
        {/* Quote side */}
        <div className="border-b border-line bg-surface-alt p-8 lg:border-b-0 lg:border-r">
          <Quote className="h-8 w-8 text-validation" strokeWidth={1.6} />
          <p className="mt-5 text-body italic text-ink-strong leading-relaxed">
            «Lo que más cambió fue que llego a casa con energía. Antes me
            quedaba al cierre del consultorio terminando notas hasta las 9 pm.
            Ahora superviso el SOAP que el sistema arma, firmo, y salgo. La
            calidad de la nota es mejor que la mía a las 8 pm cansado.»
          </p>

          <div className="mt-6 flex items-center gap-3 border-t border-line pt-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-validation-soft">
              <span className="text-body-sm font-bold text-validation">DR</span>
            </div>
            <div>
              <p className="text-body-sm font-semibold text-ink-strong">
                Cardiólogo intervencionista
              </p>
              <p className="text-caption text-ink-muted">
                CDMX · 14 años de práctica · piloto LitienGuard
              </p>
            </div>
          </div>
        </div>

        {/* Metrics side */}
        <div className="p-8">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
            Impacto medido
          </p>
          <p className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
            Primer mes de uso intensivo
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
            Caso anonimizado del piloto. Identidad y especialidad publicadas
            con consentimiento; métricas individuales obtenidas del panel de
            calidad del médico.
          </p>
        </div>
      </div>
    </div>
  );
}
