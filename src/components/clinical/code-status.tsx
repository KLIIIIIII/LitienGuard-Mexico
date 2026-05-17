"use client";

import { useEffect, useState } from "react";
import { Siren } from "lucide-react";

export type CodeKind =
  | "sepsis"
  | "stroke"
  | "iam"
  | "dka"
  | "trauma"
  | "rapid_response";

const KIND_LABELS: Record<CodeKind, string> = {
  sepsis: "Sepsis bundle",
  stroke: "Código stroke",
  iam: "Código IAM",
  dka: "DKA",
  trauma: "Trauma",
  rapid_response: "Respuesta rápida",
};

const KIND_TARGET_MIN: Record<CodeKind, number> = {
  sepsis: 60,
  stroke: 60,
  iam: 90,
  dka: 360,
  trauma: 60,
  rapid_response: 30,
};

/**
 * CodeStatus — indicador de código clínico activo con timer en vivo.
 *
 * Cumple AMIA visibility + feedback (timer visible siempre), HIMSS
 * minimize cognitive load (no recordar a qué hora se activó), FDA
 * automation bias (target time visible para que el clínico decida).
 *
 * El timer corre client-side, así que solo activarlo cuando hay un
 * código activo. Cuando completa o se cancela, desmontar.
 */
export function CodeStatus({
  kind,
  startedAt,
  customLabel,
  customTargetMin,
  compact,
}: {
  kind: CodeKind;
  /** ISO timestamp or Date when the code was activated */
  startedAt: string | Date;
  customLabel?: string;
  customTargetMin?: number;
  compact?: boolean;
}) {
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const target = customTargetMin ?? KIND_TARGET_MIN[kind];
  const label = customLabel ?? KIND_LABELS[kind];

  const [now, setNow] = useState<Date>(start);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30_000); // tick every 30s — clinical accuracy doesn't need sub-second
    return () => clearInterval(interval);
  }, []);

  const elapsedMs = Math.max(0, now.getTime() - start.getTime());
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const pct = Math.min(100, (elapsedMin / target) * 100);
  const overtime = elapsedMin > target;

  const tone = overtime
    ? "text-code-red"
    : pct > 70
      ? "text-code-amber"
      : "text-code-green";
  const bg = overtime
    ? "bg-code-red-bg/60 border-code-red/40"
    : pct > 70
      ? "bg-code-amber-bg/60 border-code-amber/40"
      : "bg-code-green-bg/40 border-code-green/30";

  if (compact) {
    return (
      <div
        role="status"
        aria-label={`${label} activo desde hace ${elapsedMin} minutos`}
        className={`inline-flex items-center gap-1.5 rounded-full border ${bg} px-2.5 py-1`}
      >
        <Siren
          className={`h-3 w-3 ${tone}`}
          strokeWidth={2.4}
          aria-hidden="true"
        />
        <span className={`text-caption font-semibold ${tone}`}>{label}</span>
        <span className="text-caption font-bold tabular-nums text-ink-strong">
          {elapsedMin}
          <span className="text-ink-soft">/{target}min</span>
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={`${label} activo desde hace ${elapsedMin} minutos, objetivo ${target} minutos`}
      className={`rounded-xl border ${bg} p-3`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Siren
            className={`h-4 w-4 ${tone} ${!overtime ? "animate-pulse" : ""}`}
            strokeWidth={2.2}
          />
          <p className={`text-body-sm font-bold ${tone}`}>{label}</p>
        </div>
        <p className="text-caption text-ink-muted tabular-nums">
          Iniciado{" "}
          {start.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-h2 font-bold tabular-nums ${tone}`}>
          {elapsedMin}
        </span>
        <span className="text-caption text-ink-muted">
          min / objetivo {target} min
        </span>
        {overtime && (
          <span className="ml-auto text-caption font-bold text-code-red uppercase tracking-eyebrow">
            +{elapsedMin - target} min sobre objetivo
          </span>
        )}
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className={`h-full transition-all duration-500 ${
            overtime
              ? "bg-code-red"
              : pct > 70
                ? "bg-code-amber"
                : "bg-code-green"
          }`}
          style={{ width: `${overtime ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}
