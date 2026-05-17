import type { ReactNode } from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import type { Severity } from "@/lib/design/tokens";

const TONE_CLASSES: Record<
  Severity,
  {
    icon: typeof AlertTriangle;
    border: string;
    bg: string;
    text: string;
    accent: string;
  }
> = {
  critical: {
    icon: AlertTriangle,
    border: "border-code-red/40",
    bg: "bg-code-red-bg/60",
    text: "text-code-red",
    accent: "text-code-red",
  },
  warning: {
    icon: AlertCircle,
    border: "border-code-amber/40",
    bg: "bg-code-amber-bg/60",
    text: "text-code-amber",
    accent: "text-code-amber",
  },
  success: {
    icon: CheckCircle2,
    border: "border-code-green/40",
    bg: "bg-code-green-bg/40",
    text: "text-code-green",
    accent: "text-code-green",
  },
  info: {
    icon: Info,
    border: "border-accent/30",
    bg: "bg-accent-soft/40",
    text: "text-ink-strong",
    accent: "text-accent",
  },
};

/**
 * ClinicalAlert — banner con severidad + acción inline.
 *
 * Cumple AMIA useful messages (específico + accionable), error prevention
 * (alerta visible antes de daño) + contrarresta automation bias (FDA CDS):
 * usa título claro y cita verbatim cuando hay fuente.
 */
export function ClinicalAlert({
  severity = "info",
  title,
  description,
  cite,
  action,
  dismissable,
  onDismiss,
  className,
}: {
  severity?: Severity;
  title: string;
  description?: ReactNode;
  /** Verbatim citation to source — counteracts automation bias */
  cite?: string;
  action?: ReactNode;
  dismissable?: boolean;
  onDismiss?: () => void;
  className?: string;
}) {
  const tone = TONE_CLASSES[severity];
  const Icon = tone.icon;

  return (
    <div
      role={severity === "critical" ? "alert" : "status"}
      aria-live={severity === "critical" ? "assertive" : "polite"}
      className={`flex items-start gap-3 rounded-xl border ${tone.border} ${tone.bg} p-4 ${className ?? ""}`}
    >
      <Icon
        className={`mt-0.5 h-5 w-5 shrink-0 ${tone.accent}`}
        strokeWidth={2.2}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className={`text-body-sm font-semibold ${tone.text}`}>
          {title}
        </p>
        {description && (
          <div className="mt-0.5 text-caption text-ink-muted leading-relaxed">
            {description}
          </div>
        )}
        {cite && (
          <p className="mt-1.5 text-caption italic text-ink-soft font-serif">
            “{cite}”
          </p>
        )}
        {action && <div className="mt-2.5">{action}</div>}
      </div>
      {dismissable && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Descartar alerta"
          className="-mr-1 -mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-quiet hover:bg-surface-alt hover:text-ink-strong"
        >
          ×
        </button>
      )}
    </div>
  );
}
