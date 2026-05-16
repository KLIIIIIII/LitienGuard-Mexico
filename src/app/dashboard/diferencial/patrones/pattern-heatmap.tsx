"use client";

import { useState } from "react";
import type { CanonicalPattern } from "@/lib/patterns/canonical-patterns";
import { FINDING_CATEGORY_COLORS } from "@/lib/patterns/canonical-patterns";

interface Props {
  pattern: CanonicalPattern;
}

/**
 * Colores HSL anclados al sistema visual:
 *   verde (apoya): hue 170 (validation teal)
 *   rose (refuta): hue 350
 * La luminosity se calcula desde log(LR) — más intenso = más informativo.
 */
function cellStyle(lr: number): {
  background: string;
  color: string;
  border: string;
} {
  if (lr >= 0.9 && lr <= 1.1) {
    return {
      background: "var(--lg-surface-alt, #f3f1ec)",
      color: "var(--lg-ink-quiet, #8a8479)",
      border: "transparent",
    };
  }
  const logLr =
    lr > 1 ? Math.log2(lr) : -Math.log2(1 / lr);
  // log2(20) ≈ 4.32 → escala hasta LR=20 o 1/20
  const t = Math.min(Math.abs(logLr) / 4.32, 1);
  const hue = lr > 1 ? 170 : 350;
  const satBase = lr > 1 ? 55 : 60;
  // Luminosity: 90% (subtle) → 32% (intenso)
  const lum = Math.round(90 - t * 58);
  const fg = lum < 55 ? "#ffffff" : lr > 1 ? "#0a3d36" : "#5a1424";
  const border =
    lum < 55 ? "transparent" : `hsl(${hue} ${satBase + 5}% ${lum - 12}%)`;
  return {
    background: `hsl(${hue} ${satBase}% ${lum}%)`,
    color: fg,
    border,
  };
}

function fmtLr(lr: number): string {
  if (lr >= 10) return lr.toFixed(0);
  if (lr >= 1) return lr.toFixed(1);
  if (lr >= 0.1) return lr.toFixed(2);
  return lr.toFixed(2);
}

interface HoverInfo {
  fi: number;
  di: number;
  lr: number;
}

export function PatternHeatmap({ pattern }: Props) {
  const [hover, setHover] = useState<HoverInfo | null>(null);

  return (
    <div className="space-y-5">
      {/* Heatmap */}
      <div className="overflow-x-auto rounded-xl border border-line bg-surface p-4 sm:p-6">
        <table className="w-full border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="text-left text-caption uppercase tracking-eyebrow text-ink-soft pb-2 pr-3 align-bottom">
                Finding ↓ vs. Diagnóstico →
              </th>
              {pattern.diagnoses.map((dx, di) => (
                <th
                  key={dx.id}
                  className={`min-w-[110px] max-w-[150px] px-1.5 pb-2 align-bottom text-left text-caption font-semibold ${
                    hover?.di === di ? "text-validation" : "text-ink-strong"
                  }`}
                >
                  <div className="leading-tight">{dx.label}</div>
                  {dx.prevalenciaMx && (
                    <div className="mt-0.5 text-[0.62rem] font-normal text-ink-quiet leading-tight">
                      {dx.prevalenciaMx}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pattern.findings.map((f, fi) => (
              <tr key={f.id}>
                <th
                  scope="row"
                  className={`text-left align-middle py-1 pr-3 text-caption font-medium ${
                    hover?.fi === fi ? "text-validation" : "text-ink-strong"
                  }`}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[0.58rem] uppercase tracking-eyebrow font-semibold ${FINDING_CATEGORY_COLORS[f.category]}`}
                    >
                      {f.category}
                    </span>
                    <span className="leading-tight max-w-[200px]">
                      {f.label}
                    </span>
                  </div>
                </th>
                {pattern.diagnoses.map((dx, di) => {
                  const lr = pattern.matrix[fi]?.[di] ?? 1;
                  const style = cellStyle(lr);
                  const isHover = hover?.fi === fi && hover?.di === di;
                  return (
                    <td
                      key={dx.id}
                      onMouseEnter={() => setHover({ fi, di, lr })}
                      onMouseLeave={() => setHover(null)}
                      className="relative h-12 rounded-md text-center text-body-sm font-bold tabular-nums transition-all cursor-default"
                      style={{
                        background: style.background,
                        color: style.color,
                        outline: isHover
                          ? "2px solid var(--lg-validation, #0a8b7a)"
                          : `1px solid ${style.border}`,
                        outlineOffset: isHover ? "1px" : "0",
                      }}
                    >
                      {fmtLr(lr)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover detail panel — siempre montado, contenido cambia */}
      <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-alt/60 px-4 py-3 min-h-[64px]">
        {hover ? (
          <>
            <div
              className="mt-0.5 h-6 w-6 shrink-0 rounded-md flex items-center justify-center text-[0.6rem] font-bold tabular-nums"
              style={cellStyle(hover.lr)}
            >
              {fmtLr(hover.lr)}
            </div>
            <div className="text-caption leading-relaxed text-ink-strong">
              <strong className="font-semibold">
                {pattern.findings[hover.fi]?.label}
              </strong>{" "}
              {hover.lr >= 0.9 && hover.lr <= 1.1 ? (
                <>
                  es <span className="text-ink-muted">no informativo</span>{" "}
                  para
                </>
              ) : hover.lr > 1 ? (
                <>
                  <span className="text-validation font-semibold">
                    apoya
                  </span>{" "}
                  el diagnóstico de
                </>
              ) : (
                <>
                  <span className="text-rose font-semibold">refuta</span>{" "}
                  el diagnóstico de
                </>
              )}{" "}
              <strong className="font-semibold">
                {pattern.diagnoses[hover.di]?.label}
              </strong>
              {hover.lr > 1.1 && (
                <span className="text-ink-muted">
                  {" "}
                  · LR+ ≈ {fmtLr(hover.lr)} (probabilidad post-test sube)
                </span>
              )}
              {hover.lr < 0.9 && (
                <span className="text-ink-muted">
                  {" "}
                  · LR− ≈ {fmtLr(hover.lr)} (probabilidad post-test baja)
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-caption text-ink-muted">
            Pasa el cursor por una celda para ver el likelihood ratio
            específico y su interpretación.
          </p>
        )}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-4 text-caption text-ink-muted">
        <span className="font-semibold text-ink-strong">Lectura del color:</span>
        {[
          { lr: 15, label: "Apoya fuerte (LR+ > 10)" },
          { lr: 3, label: "Apoya" },
          { lr: 1, label: "Neutral" },
          { lr: 0.4, label: "Refuta" },
          { lr: 0.1, label: "Refuta fuerte (LR− < 0.2)" },
        ].map(({ lr, label }) => (
          <span key={label} className="inline-flex items-center gap-2">
            <span
              className="h-4 w-4 rounded border"
              style={{
                background: cellStyle(lr).background,
                borderColor: cellStyle(lr).border,
              }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
