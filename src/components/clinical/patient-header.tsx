import { AlertTriangle, User, IdCard, Calendar, Activity } from "lucide-react";
import { StatusBadge } from "./status-badge";

export type PatientHeaderProps = {
  iniciales?: string | null;
  nombre?: string | null;
  edad?: number | null;
  sexo?: "M" | "F" | "X" | null;
  mrn?: string | null;
  fechaNacimiento?: string | null;
  alergias?: string[] | null;
  alertasActivas?: Array<{
    tipo: "code_red" | "code_stroke" | "code_iam" | "sepsis" | "warning";
    label: string;
    transcurridoMin?: number;
  }>;
  /** Compact mode hides DOB and uses a single line layout */
  compact?: boolean;
};

const ALERTA_LABELS: Record<
  NonNullable<PatientHeaderProps["alertasActivas"]>[number]["tipo"],
  { label: string; tone: "critical" | "warning" }
> = {
  code_red: { label: "Código rojo", tone: "critical" },
  code_stroke: { label: "Código stroke", tone: "critical" },
  code_iam: { label: "Código IAM", tone: "critical" },
  sepsis: { label: "Sepsis bundle", tone: "critical" },
  warning: { label: "Atención", tone: "warning" },
};

/**
 * PatientHeader — banner persistente con identidad del paciente.
 *
 * Cumple HIMSS "preservation of context": el clínico nunca pierde de
 * vista al paciente activo. Cumple AMIA visibility (estado del workflow
 * visible) + memory minimization (no recordar MRN).
 *
 * Diseñado para colocarse `sticky top-0` debajo del top-bar global.
 */
export function PatientHeader({
  iniciales,
  nombre,
  edad,
  sexo,
  mrn,
  fechaNacimiento,
  alergias,
  alertasActivas = [],
  compact = false,
}: PatientHeaderProps) {
  const displayName = nombre?.trim() || iniciales || "Paciente sin identificar";
  const sexoLabel = sexo === "M" ? "M" : sexo === "F" ? "F" : sexo === "X" ? "X" : null;
  const edadLabel = edad != null ? `${edad}a` : null;
  const demoLine = [edadLabel, sexoLabel].filter(Boolean).join(" · ");
  const hasAlergias = alergias && alergias.length > 0;
  const hasAlertas = alertasActivas.length > 0;

  return (
    <header
      role="banner"
      aria-label="Identificación del paciente"
      className="sticky top-[72px] z-30 border-b border-line bg-surface/95 backdrop-blur-sm"
    >
      <div className="lg-shell flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-2.5 lg:px-10">
        {/* Identidad */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <User className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-ink-strong truncate">
              {displayName}
            </p>
            {demoLine && (
              <p className="text-caption text-ink-muted tabular-nums">
                {demoLine}
              </p>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-muted">
          {mrn && (
            <span className="inline-flex items-center gap-1">
              <IdCard className="h-3 w-3" strokeWidth={2} />
              <span className="tabular-nums">MRN {mrn}</span>
            </span>
          )}
          {!compact && fechaNacimiento && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" strokeWidth={2} />
              <span className="tabular-nums">{fechaNacimiento}</span>
            </span>
          )}
        </div>

        {/* Alergias */}
        {hasAlergias && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle
              className="h-3.5 w-3.5 text-code-amber"
              strokeWidth={2.2}
              aria-hidden="true"
            />
            <span className="text-caption font-semibold text-code-amber uppercase tracking-eyebrow">
              {alergias.length === 1
                ? alergias[0]
                : `${alergias.length} alergias`}
            </span>
          </div>
        )}

        {/* Códigos activos */}
        {hasAlertas && (
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {alertasActivas.map((a, i) => {
              const def = ALERTA_LABELS[a.tipo];
              return (
                <StatusBadge
                  key={i}
                  tone={def.tone}
                  icon={Activity}
                  pulse={def.tone === "critical"}
                  size="md"
                >
                  {a.label || def.label}
                  {a.transcurridoMin != null && (
                    <span className="ml-1 tabular-nums opacity-80">
                      {a.transcurridoMin}min
                    </span>
                  )}
                </StatusBadge>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
