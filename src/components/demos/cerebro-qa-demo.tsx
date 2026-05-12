import { Search, BookOpen, Quote } from "lucide-react";

export function CerebroQaDemo() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
      <div className="flex items-center gap-2 border-b border-line pb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <BookOpen className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
            Ejemplo · Cerebro clínico
          </p>
          <p className="text-body-sm font-semibold text-ink-strong">
            Consulta a evidencia con cita verbatim
          </p>
        </div>
      </div>

      {/* Pregunta */}
      <div className="mt-5">
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft mb-2">
          Pregunta clínica
        </p>
        <div className="flex items-start gap-2 rounded-lg border border-line bg-surface-alt px-4 py-3">
          <Search
            className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted"
            strokeWidth={2}
          />
          <p className="text-body-sm text-ink-strong">
            ¿Cuándo iniciar SGLT2 en DM2 con TFG entre 30 y 45?
          </p>
        </div>
      </div>

      {/* Respuesta */}
      <div className="mt-5">
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft mb-2">
          Resultado · 0.31 s
        </p>

        <div className="rounded-lg border-l-4 border-l-accent bg-accent-soft/30 px-4 py-3">
          <div className="flex items-start gap-2">
            <Quote className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
            <p className="text-body-sm italic text-ink-strong leading-relaxed">
              «En pacientes con DM2 y enfermedad renal crónica con TFGe ≥20
              mL/min/1.73 m², se recomienda iniciar un inhibidor de SGLT2 con
              evidencia probada de beneficio renal (empagliflozina,
              dapagliflozina) independientemente del control glucémico.»
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-accent-soft pt-2">
            <span className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-caption text-ink-strong">
              KDIGO 2024
            </span>
            <span className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-caption text-ink-strong">
              Capítulo 4 · pág. 38
            </span>
            <span className="inline-flex items-center rounded-full bg-validation-soft px-2 py-0.5 text-caption font-semibold text-validation">
              Recomendación 1A
            </span>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-line bg-surface px-3 py-2">
            <p className="text-caption text-ink-soft">Fuente</p>
            <p className="text-caption font-semibold text-ink-strong">
              Guía KDIGO
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface px-3 py-2">
            <p className="text-caption text-ink-soft">Tipo</p>
            <p className="text-caption font-semibold text-ink-strong">
              Guía clínica
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface px-3 py-2">
            <p className="text-caption text-ink-soft">Nivel</p>
            <p className="text-caption font-semibold text-ink-strong">
              Fuerte / Alta
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-accent-soft bg-accent-soft/30 px-4 py-3">
        <p className="text-caption text-accent leading-relaxed">
          <strong>Cero alucinación.</strong> Cada respuesta cita texto verbatim
          de la guía con número de página y fuerza de evidencia. Si la
          evidencia no existe en el cerebro, el sistema lo dice — no inventa.
        </p>
      </div>
    </div>
  );
}
