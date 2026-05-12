import { Mic, FileText, CheckCircle2 } from "lucide-react";

interface Step {
  time: string;
  label: string;
  detail: string;
  highlight?: boolean;
}

const STEPS: Step[] = [
  {
    time: "0:00",
    label: "Inicia la consulta",
    detail: "El médico activa el Scribe con un toque. La grabación corre en el dispositivo, no en la nube.",
  },
  {
    time: "13:42",
    label: "Termina la consulta",
    detail: "Audio crudo: 13 min 42 s. El paciente sale del consultorio.",
  },
  {
    time: "13:46",
    label: "Whisper Large v3 transcribe",
    detail: "Transcripción en español MX, identifica turnos de habla. Tiempo: 3.8 s.",
  },
  {
    time: "13:54",
    label: "Llama 3.3 70B estructura SOAP",
    detail: "Subjetivo · Objetivo · Análisis · Plan. Cada recomendación lleva cita verbatim del cerebro.",
  },
  {
    time: "13:55",
    label: "Nota lista para revisar",
    detail: "El médico revisa, ajusta, firma. Total: 13 segundos de IA + 90 s de revisión humana.",
    highlight: true,
  },
];

export function ScribeTimelineDemo() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
      <div className="flex items-center gap-2 border-b border-line pb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-validation-soft text-validation">
          <Mic className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
            Ejemplo · Scribe ambient
          </p>
          <p className="text-body-sm font-semibold text-ink-strong">
            Una consulta de cardiología, de inicio a SOAP firmable
          </p>
        </div>
      </div>

      <ol className="mt-5 space-y-4">
        {STEPS.map((step, idx) => {
          const isLast = idx === STEPS.length - 1;
          return (
            <li key={step.time} className="relative pl-7">
              {!isLast && (
                <span
                  aria-hidden
                  className="absolute left-[10px] top-5 h-full w-px bg-line"
                />
              )}
              <span
                aria-hidden
                className={`absolute left-0 top-1 flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] font-bold ${
                  step.highlight
                    ? "bg-validation text-surface"
                    : "bg-validation-soft text-validation"
                }`}
              >
                {step.highlight ? (
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
                ) : (
                  idx + 1
                )}
              </span>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-caption font-semibold text-ink-soft">
                  {step.time}
                </span>
                <p className="text-body-sm font-semibold text-ink-strong">
                  {step.label}
                </p>
              </div>
              <p className="mt-0.5 text-caption text-ink-muted leading-relaxed">
                {step.detail}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 rounded-lg border border-validation-soft bg-validation-soft/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-validation" strokeWidth={2} />
          <p className="text-caption font-semibold text-validation">
            Recuperación promedio
          </p>
        </div>
        <p className="mt-1.5 text-body-sm text-ink-strong">
          <span className="text-h2 font-bold text-validation">~5 hrs</span>
          <span className="ml-2 text-caption text-ink-muted">
            recuperadas al día en un médico con 12 consultas
          </span>
        </p>
      </div>
    </div>
  );
}
