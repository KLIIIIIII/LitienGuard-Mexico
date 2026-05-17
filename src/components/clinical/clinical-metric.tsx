import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { TrendChart } from "./trend-chart";

export type ClinicalMetricProps = {
  label: string;
  value: string | number;
  /** Unit shown next to value (e.g., "mg/dL", "lpm", "%") */
  unit?: string;
  /** Delta from previous measure: positive = up, negative = down */
  delta?: number;
  /** Whether the delta direction is good or bad clinically */
  deltaInterpretation?: "good" | "bad" | "neutral";
  /** Reference range, e.g., "70–110" */
  reference?: string;
  /** Critical flag — renders with code-red treatment */
  critical?: boolean;
  /** Sparkline data points (most recent last) */
  trend?: number[];
  /** Icon shown in the corner */
  icon?: LucideIcon;
  /** Caption below value (e.g., "Hace 3 min", "última medición") */
  caption?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  className?: string;
};

const VALUE_SIZE = {
  sm: "text-h3",
  md: "text-h2",
  lg: "text-h1",
} as const;

/**
 * ClinicalMetric — número grande + label + delta + trend.
 *
 * Cumple AMIA visibility + minimalism: muestra lo esencial. Tabular
 * nums siempre activos. Color semántico para indicar urgencia.
 *
 * Diseñado para grids 2–4 columnas en flowsheets UCI / dashboards.
 */
export function ClinicalMetric({
  label,
  value,
  unit,
  delta,
  deltaInterpretation = "neutral",
  reference,
  critical,
  trend,
  icon: Icon,
  caption,
  size = "md",
  className,
}: ClinicalMetricProps) {
  const valueColor = critical
    ? "text-code-red"
    : "text-ink-strong";

  const deltaColor =
    deltaInterpretation === "good"
      ? "text-code-green"
      : deltaInterpretation === "bad"
        ? "text-code-red"
        : "text-ink-muted";

  const DeltaIcon =
    delta === undefined
      ? null
      : delta > 0
        ? ArrowUp
        : delta < 0
          ? ArrowDown
          : Minus;

  const containerBg = critical
    ? "border-code-red/40 bg-code-red-bg/40"
    : "border-line bg-surface";

  return (
    <div
      className={`rounded-xl border ${containerBg} px-4 py-3 shadow-soft ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
          {label}
        </p>
        {Icon && (
          <Icon
            className={`h-3.5 w-3.5 shrink-0 ${critical ? "text-code-red" : "text-ink-quiet"}`}
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <span
          className={`${VALUE_SIZE[size]} font-bold tabular-nums ${valueColor}`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-caption text-ink-muted">{unit}</span>
        )}
        {DeltaIcon && delta !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 text-caption font-semibold ${deltaColor}`}
            aria-label={`Cambio ${delta > 0 ? "aumento" : delta < 0 ? "disminución" : "sin cambio"}`}
          >
            <DeltaIcon className="h-3 w-3" strokeWidth={2.4} />
            <span className="tabular-nums">{Math.abs(delta)}</span>
          </span>
        )}
      </div>

      {trend && trend.length > 1 && (
        <div className="mt-2">
          <TrendChart
            data={trend}
            tone={critical ? "critical" : "neutral"}
            height={24}
          />
        </div>
      )}

      <div className="mt-1.5 flex items-center justify-between gap-2 text-caption text-ink-quiet">
        {reference && (
          <span className="tabular-nums">Ref {reference}</span>
        )}
        {caption && <span>{caption}</span>}
      </div>
    </div>
  );
}
