import type { ReactNode } from "react";
import { ChevronRight, Lock } from "lucide-react";

/**
 * Marco visual que envuelve un demo del landing para que se lea como
 * "screenshot real" de la app LitienGuard: barra de ventana, URL bar y
 * breadcrumb del dashboard.
 *
 * El propósito es que el visitante NO confunda el demo con un mockup
 * genérico de SaaS — debe sentir "esto es exactamente lo que veré al
 * iniciar sesión".
 */
export function AppChrome({
  path,
  breadcrumb,
  badge,
  children,
}: {
  /** Path mostrado en el URL bar, ej "dashboard/cerebro/caso/68". */
  path: string;
  /** Breadcrumb de la app, mostrado debajo del URL bar. */
  breadcrumb: string[];
  /** Texto del badge en la esquina superior derecha. */
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-canvas shadow-soft overflow-hidden">
      {/* Window controls + URL bar */}
      <div className="flex items-center gap-3 border-b border-line bg-surface-alt px-4 py-2.5">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="h-2.5 w-2.5 rounded-full bg-rose/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-validation/60" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="inline-flex w-full max-w-md items-center gap-2 rounded-md border border-line bg-canvas px-2.5 py-1">
            <Lock className="h-3 w-3 text-validation shrink-0" strokeWidth={2.4} />
            <p className="truncate text-[0.7rem] font-mono text-ink-muted">
              litienguard.mx/{path}
            </p>
          </div>
        </div>
        {badge && (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-validation-soft bg-validation-soft px-2 py-0.5 text-[0.65rem] font-semibold text-validation">
            {badge}
          </span>
        )}
      </div>

      {/* Breadcrumb tipo app */}
      <div className="flex items-center gap-1.5 border-b border-line bg-surface px-5 py-2.5 text-caption text-ink-muted">
        <span className="font-semibold text-ink-strong">LitienGuard</span>
        {breadcrumb.map((seg, idx) => (
          <span key={`${seg}-${idx}`} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-ink-quiet" strokeWidth={2.2} />
            <span
              className={
                idx === breadcrumb.length - 1
                  ? "font-semibold text-ink-strong"
                  : ""
              }
            >
              {seg}
            </span>
          </span>
        ))}
      </div>

      {/* App content area */}
      <div className="bg-canvas p-5 sm:p-6">{children}</div>
    </div>
  );
}
