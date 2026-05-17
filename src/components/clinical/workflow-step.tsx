"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Clock, ChevronDown } from "lucide-react";

export type WorkflowStepProps = {
  number: number;
  title: string;
  detail?: ReactNode;
  /** Target time (e.g., "≤ 10 min", "0-30 min") */
  targetTime?: string;
  /** Has the step been completed */
  completed?: boolean;
  /** Active = currently being worked on */
  active?: boolean;
  /** Onclick to toggle completion */
  onToggle?: () => void;
  /** Optional expandable content (sub-tasks, links to guidelines) */
  expandable?: ReactNode;
  /** Severity if this step is overdue/critical */
  tone?: "default" | "critical" | "warning" | "success";
};

const TONE_CLASSES = {
  default: {
    border: "border-line",
    bg: "bg-surface",
    iconColor: "text-ink-muted",
  },
  critical: {
    border: "border-code-red/40",
    bg: "bg-code-red-bg/30",
    iconColor: "text-code-red",
  },
  warning: {
    border: "border-code-amber/40",
    bg: "bg-code-amber-bg/30",
    iconColor: "text-code-amber",
  },
  success: {
    border: "border-code-green/40",
    bg: "bg-code-green-bg/30",
    iconColor: "text-code-green",
  },
} as const;

/**
 * WorkflowStep — paso individual de un protocolo (sepsis bundle, time-out,
 * código stroke, etc.).
 *
 * Cumple AMIA closure (estado de finalización claro), visibility (paso
 * activo destacado), control (checkable + uncheckable).
 */
export function WorkflowStep({
  number,
  title,
  detail,
  targetTime,
  completed,
  active,
  onToggle,
  expandable,
  tone = "default",
}: WorkflowStepProps) {
  const [expanded, setExpanded] = useState(false);
  const t = TONE_CLASSES[tone];
  const completedClass = completed
    ? "border-code-green/30 bg-code-green-bg/20 opacity-90"
    : `${t.border} ${t.bg}`;
  const activeRing = active ? "ring-2 ring-accent/40" : "";

  return (
    <li
      className={`rounded-lg border p-3 transition-all ${completedClass} ${activeRing}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          disabled={!onToggle}
          className="mt-0.5 shrink-0 disabled:cursor-default"
          aria-label={
            completed ? `Desmarcar paso ${number}` : `Marcar paso ${number} completado`
          }
          aria-pressed={completed}
        >
          {completed ? (
            <CheckCircle2
              className="h-5 w-5 text-code-green"
              strokeWidth={2.4}
            />
          ) : (
            <Circle
              className={`h-5 w-5 ${active ? "text-accent" : "text-ink-quiet"}`}
              strokeWidth={2}
            />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-caption font-bold tabular-nums text-ink-soft">
              {String(number).padStart(2, "0")}
            </span>
            <p
              className={`text-body-sm font-semibold ${
                completed
                  ? "text-ink-muted line-through"
                  : "text-ink-strong"
              }`}
            >
              {title}
            </p>
            {targetTime && (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2 py-0.5 text-caption text-ink-muted">
                <Clock className="h-3 w-3" strokeWidth={2.2} />
                <span className="tabular-nums">{targetTime}</span>
              </span>
            )}
          </div>
          {detail && (
            <div
              className={`mt-0.5 text-caption leading-relaxed ${
                completed ? "text-ink-quiet" : "text-ink-muted"
              }`}
            >
              {detail}
            </div>
          )}

          {expandable && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-accent hover:underline"
            >
              <ChevronDown
                className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
                strokeWidth={2.4}
              />
              {expanded ? "Ocultar detalle" : "Ver detalle"}
            </button>
          )}

          <AnimatePresence>
            {expanded && expandable && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded bg-surface-alt/50 p-2">
                  {expandable}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </li>
  );
}
