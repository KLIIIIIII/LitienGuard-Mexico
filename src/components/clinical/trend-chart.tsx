"use client";

export type TrendChartTone = "neutral" | "good" | "bad" | "critical";

const TONE_STROKE: Record<TrendChartTone, string> = {
  neutral: "rgb(var(--ink-muted))",
  good: "rgb(var(--code-green))",
  bad: "rgb(var(--code-amber))",
  critical: "rgb(var(--code-red))",
};

const TONE_FILL: Record<TrendChartTone, string> = {
  neutral: "rgb(var(--ink-muted) / 0.12)",
  good: "rgb(var(--code-green) / 0.15)",
  bad: "rgb(var(--code-amber) / 0.15)",
  critical: "rgb(var(--code-red) / 0.18)",
};

/**
 * TrendChart — sparkline mínimo para signos vitales / labs en 24h.
 *
 * Cumple AMIA visibility + HIMSS effective info presentation: tendencia
 * temporal sin necesidad de chart completo. SVG puro, sin libs.
 */
export function TrendChart({
  data,
  width = 120,
  height = 32,
  tone = "neutral",
  showDots = false,
  ariaLabel,
}: {
  data: number[];
  width?: number;
  height?: number;
  tone?: TrendChartTone;
  showDots?: boolean;
  ariaLabel?: string;
}) {
  if (!data || data.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="rounded bg-surface-alt/50"
        aria-hidden="true"
      />
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const xStep = (width - 2 * padding) / (data.length - 1);
  const ySpan = height - 2 * padding;

  const points = data.map((v, i) => {
    const x = padding + i * xStep;
    const y = padding + ySpan - ((v - min) / range) * ySpan;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const areaPath =
    linePath +
    ` L ${(width - padding).toFixed(2)} ${(height - padding).toFixed(2)}` +
    ` L ${padding.toFixed(2)} ${(height - padding).toFixed(2)} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={
        ariaLabel ?? `Tendencia de ${data.length} mediciones, último ${data[data.length - 1]}`
      }
      className="block"
    >
      <path d={areaPath} fill={TONE_FILL[tone]} />
      <path
        d={linePath}
        fill="none"
        stroke={TONE_STROKE[tone]}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={1.5}
            fill={TONE_STROKE[tone]}
          />
        ))}
      {/* Highlight last point */}
      <circle
        cx={points[points.length - 1]?.x}
        cy={points[points.length - 1]?.y}
        r={2.2}
        fill={TONE_STROKE[tone]}
      />
    </svg>
  );
}
