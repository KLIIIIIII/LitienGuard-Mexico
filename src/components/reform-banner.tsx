import { Eyebrow } from "@/components/eyebrow";
import { Sparkles } from "lucide-react";

export function ReformBanner() {
  return (
    <section className="border-b border-line bg-warn-soft">
      <div className="lg-shell flex flex-col gap-6 py-14 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warn text-canvas">
            <Sparkles className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div>
            <Eyebrow tone="warn">Reforma LGS Salud Digital · DOF 2026</Eyebrow>
            <h2 className="mt-2 max-w-2xl text-h2 font-semibold tracking-tight text-ink-strong">
              Telemedicina, SINBA/SINAIS y Credencial Paciente 2026 — ya son
              ley.
            </h2>
            <p className="mt-3 max-w-2xl text-body-sm text-ink-muted">
              LitienGuard nace compatible con la reforma. Reporteo SINBA
              automático para hospitales, identidad clínica unificada para
              pacientes, registro de teleconsulta para médicos. La pregunta ya
              no es si — es con quién.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
