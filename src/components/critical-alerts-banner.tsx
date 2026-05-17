"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown, ChevronUp, X, Loader2 } from "lucide-react";
import { acknowledgeAlert, acknowledgeAllAlerts } from "@/app/dashboard/alerts/actions";

type FindingItem = {
  label: string;
  severity: "critical" | "warning";
  match: string;
};

export type CriticalAlertItem = {
  id: string;
  modulo: "laboratorio" | "radiologia" | string;
  paciente_iniciales: string | null;
  findings: FindingItem[];
  snippet: string;
  severity: "critical" | "warning";
  created_at: string;
};

export function CriticalAlertsBanner({
  alerts,
}: {
  alerts: CriticalAlertItem[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const visible = alerts.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const criticals = visible.filter((a) => a.severity === "critical").length;
  const warnings = visible.length - criticals;
  const isAllCritical = criticals === visible.length;
  const isAllWarning = criticals === 0;

  const tone = isAllCritical
    ? { border: "border-code-red", bg: "bg-code-red-bg/60", text: "text-code-red", icon: "text-code-red" }
    : isAllWarning
      ? { border: "border-code-amber", bg: "bg-code-amber-bg/60", text: "text-code-amber", icon: "text-code-amber" }
      : { border: "border-code-red", bg: "bg-code-red-bg/40", text: "text-code-red", icon: "text-code-red" };

  function dismissOne(id: string) {
    setDismissed((s) => new Set(s).add(id));
    startTransition(async () => {
      await acknowledgeAlert(id);
    });
  }

  function dismissAll() {
    setDismissed(new Set(visible.map((a) => a.id)));
    startTransition(async () => {
      await acknowledgeAllAlerts();
    });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="alert"
      aria-live="assertive"
      className={`rounded-xl border-2 ${tone.border} ${tone.bg} p-4`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <AlertTriangle
            className={`mt-0.5 h-5 w-5 shrink-0 ${tone.icon} ${isAllCritical ? "animate-pulse" : ""}`}
            strokeWidth={2.2}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className={`text-body-sm font-bold ${tone.text}`}>
              {criticals > 0 &&
                `${criticals} valor${criticals === 1 ? "" : "es"} crítico${criticals === 1 ? "" : "s"}`}
              {criticals > 0 && warnings > 0 && " · "}
              {warnings > 0 && `${warnings} de atención`}
              {` · pendiente${visible.length === 1 ? "" : "s"} de revisar`}
            </p>
            <p className="mt-0.5 text-caption text-ink-muted">
              Hallazgos detectados automáticamente en resultados de lab o
              reportes de imagen. ACR Critical Findings Communication
              Guidelines exige acknowledge.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-caption font-semibold text-ink-strong hover:underline"
            aria-expanded={expanded}
          >
            {expanded ? "Ocultar" : "Ver detalle"}
            {expanded ? (
              <ChevronUp className="h-3 w-3" strokeWidth={2.4} />
            ) : (
              <ChevronDown className="h-3 w-3" strokeWidth={2.4} />
            )}
          </button>
          <button
            type="button"
            onClick={dismissAll}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-surface px-3 py-1 text-caption font-semibold text-ink-strong hover:border-ink-strong disabled:opacity-50"
          >
            {pending && (
              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.4} />
            )}
            Confirmar todas
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {visible.slice(0, 8).map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-line bg-surface p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-bold uppercase tracking-eyebrow ${
                          a.severity === "critical"
                            ? "bg-code-red-bg text-code-red"
                            : "bg-code-amber-bg text-code-amber"
                        }`}
                      >
                        {a.severity === "critical" ? "Crítico" : "Atención"}
                      </span>
                      <span className="text-caption text-ink-soft capitalize">
                        {a.modulo}
                      </span>
                      {a.paciente_iniciales && (
                        <span className="text-caption font-semibold text-ink-strong">
                          {a.paciente_iniciales}
                        </span>
                      )}
                      <span className="text-caption text-ink-quiet tabular-nums">
                        {new Date(a.created_at).toLocaleString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {a.findings.slice(0, 4).map((f, i) => (
                        <li
                          key={i}
                          className="text-caption text-ink-strong"
                        >
                          <span className="font-semibold">{f.label}</span>
                          <span className="ml-1 text-ink-muted italic">
                            “{f.match}”
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissOne(a.id)}
                    disabled={pending}
                    aria-label="Confirmar alerta"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink-strong disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2.2} />
                  </button>
                </div>
              </li>
            ))}
            {visible.length > 8 && (
              <li className="text-caption text-ink-muted text-center">
                + {visible.length - 8} alertas adicionales
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
