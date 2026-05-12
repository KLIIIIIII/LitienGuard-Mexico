import { Smile, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { AppChrome } from "@/components/demos/app-chrome";

/**
 * Demo visual del odontograma — réplica fiel del componente real
 * de /dashboard/odontograma con piezas marcadas en distintos estados,
 * envuelto en AppChrome para que se lea como screenshot real de la app.
 */

type ToothState =
  | "sano"
  | "caries"
  | "restaurado"
  | "endodoncia"
  | "corona"
  | "implante"
  | "ausente";

interface StateStyle {
  fill: string;
  border: string;
  textColor: string;
  label: string;
}

const STATE: Record<ToothState, StateStyle> = {
  sano: {
    fill: "#FFFFFF",
    border: "#D8D4C8",
    textColor: "#2C2B27",
    label: "Sano",
  },
  caries: {
    fill: "#FBE9C8",
    border: "#D49B3F",
    textColor: "#7A4F0F",
    label: "Caries",
  },
  restaurado: {
    fill: "#D6E8DC",
    border: "#4A6B5B",
    textColor: "#274B39",
    label: "Restaurado",
  },
  endodoncia: {
    fill: "#D0DEED",
    border: "#3F6B95",
    textColor: "#1F3F5E",
    label: "Endodoncia",
  },
  corona: {
    fill: "#2C2B27",
    border: "#2C2B27",
    textColor: "#FFFFFF",
    label: "Corona",
  },
  implante: {
    fill: "#8E8B7E",
    border: "#5C5A52",
    textColor: "#FFFFFF",
    label: "Implante",
  },
  ausente: {
    fill: "#F4F2EB",
    border: "#B8B4A8",
    textColor: "#8B887F",
    label: "Ausente",
  },
};

const UPPER_ROW: number[] = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
];
const LOWER_ROW: number[] = [
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

const DEMO_STATES: Record<number, ToothState> = {
  16: "caries",
  17: "restaurado",
  21: "corona",
  26: "restaurado",
  36: "caries",
  37: "endodoncia",
  38: "ausente",
  46: "implante",
};

type Severity = "alta" | "media" | "baja";

const PLAN: Array<{ pieza: string; accion: string; severity: Severity }> = [
  {
    pieza: "16",
    accion: "Resina compuesta clase II vestíbulo-oclusal",
    severity: "media",
  },
  {
    pieza: "36",
    accion: "Resina compuesta clase I oclusal",
    severity: "media",
  },
  {
    pieza: "21",
    accion: "Control de corona protésica · 6 meses",
    severity: "baja",
  },
  {
    pieza: "38",
    accion: "Evaluación quirúrgica · radiografía panorámica",
    severity: "baja",
  },
];

export function DentalOdontogramDemo() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-validation-soft via-accent-soft to-transparent opacity-50 blur-3xl"
      />

      <AppChrome
        path="dashboard/odontograma"
        breadcrumb={["Dashboard", "Odontograma", "Caso · L.M."]}
        badge="Mapa dental interactivo"
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* LEFT — Odontograma */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                  Paciente
                </p>
                <p className="mt-1 text-body-sm font-semibold text-ink-strong">
                  L.M. · 38 años · F
                </p>
                <p className="text-caption text-ink-muted leading-snug">
                  Notación FDI · Última visita 14 abr 2026
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-[0.6rem] font-bold text-warn">
                <Smile className="h-2.5 w-2.5" strokeWidth={2.4} />
                8 piezas con hallazgos
              </span>
            </div>

            {/* Arcada superior */}
            <ToothArchRow
              label="Arcada superior"
              teeth={UPPER_ROW}
              states={DEMO_STATES}
            />

            <div className="h-px bg-line-soft" aria-hidden />

            {/* Arcada inferior */}
            <ToothArchRow
              label="Arcada inferior"
              teeth={LOWER_ROW}
              states={DEMO_STATES}
            />

            {/* Leyenda */}
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-alt px-3 py-2">
              {(
                ["caries", "restaurado", "endodoncia", "corona", "implante", "ausente"] as ToothState[]
              ).map((s) => {
                const style = STATE[s];
                return (
                  <div key={s} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-[2px] border"
                      style={{
                        backgroundColor: style.fill,
                        borderColor: style.border,
                        borderStyle: s === "ausente" ? "dashed" : "solid",
                      }}
                    />
                    <span className="text-[0.65rem] text-ink-muted">
                      {style.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* RIGHT — Plan de tratamiento sugerido */}
          <section className="space-y-3">
            <div className="flex items-center gap-1.5">
              <FileText
                className="h-3.5 w-3.5 text-validation"
                strokeWidth={2.2}
              />
              <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-validation">
                Plan de tratamiento sugerido
              </p>
            </div>

            <div className="space-y-2">
              {PLAN.map((p) => (
                <PlanRow key={p.pieza} {...p} />
              ))}
            </div>

            {/* Nota del dentista */}
            <div className="rounded-xl border border-line bg-canvas px-3 py-2.5 space-y-1.5">
              <p className="text-[0.62rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                Nota clínica · firmada
              </p>
              <p className="text-caption italic leading-snug text-ink-strong">
                &quot;Paciente sin sintomatología dolorosa. Caries oclusales en
                16 y 36 con apariencia activa, indicación de resina compuesta.
                Resto sin urgencia. Cita control en 3 meses.&quot;
              </p>
              <p className="text-[0.58rem] font-mono text-ink-soft pt-0.5 border-t border-line">
                Dra. P.S. · Cédula 7842316 · 14 abr 2026
              </p>
            </div>

            {/* Lista exportable */}
            <div className="flex items-center gap-2 rounded-lg border border-validation bg-validation-soft px-3 py-2">
              <CheckCircle2
                className="h-3.5 w-3.5 text-validation shrink-0"
                strokeWidth={2.4}
              />
              <p className="text-[0.65rem] text-ink-strong leading-tight">
                <span className="font-semibold">Listo para exportar:</span>{" "}
                PDF firmable + consentimiento informado del paciente
              </p>
            </div>
          </section>
        </div>
      </AppChrome>
    </div>
  );
}

function ToothArchRow({
  label,
  teeth,
  states,
}: {
  label: string;
  teeth: number[];
  states: Record<number, ToothState>;
}) {
  return (
    <div>
      <p className="text-[0.6rem] uppercase tracking-eyebrow text-ink-soft mb-1.5">
        {label}
      </p>
      <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-0.5 sm:gap-1">
        {teeth.map((n, i) => {
          const s: ToothState = states[n] ?? "sano";
          const style = STATE[s];
          const showGap = i === 7;
          return (
            <div
              key={n}
              className={`relative aspect-[3/4] rounded-md border-2 flex items-center justify-center text-[0.55rem] sm:text-[0.6rem] font-mono font-semibold ${
                showGap ? "ml-1" : ""
              }`}
              style={{
                backgroundColor: style.fill,
                borderColor: style.border,
                color: style.textColor,
                borderStyle: s === "ausente" ? "dashed" : "solid",
              }}
              title={`Diente ${n} — ${style.label}`}
            >
              {n}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanRow({
  pieza,
  accion,
  severity,
}: {
  pieza: string;
  accion: string;
  severity: Severity;
}) {
  const sevColor =
    severity === "alta"
      ? "text-rose"
      : severity === "media"
        ? "text-warn"
        : "text-validation";
  const sevLabel =
    severity === "alta"
      ? "Prioridad alta"
      : severity === "media"
        ? "Prioridad media"
        : "Prioridad baja";

  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-validation-soft font-mono text-[0.62rem] font-bold text-validation">
            {pieza}
          </span>
          <p className="text-caption text-ink-strong leading-snug">{accion}</p>
        </div>
        <span className={`text-[0.58rem] font-semibold ${sevColor} shrink-0`}>
          <AlertCircle className="inline h-2.5 w-2.5 mr-0.5" strokeWidth={2.4} />
          {sevLabel}
        </span>
      </div>
    </div>
  );
}
