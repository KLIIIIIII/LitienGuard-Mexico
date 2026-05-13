import type { ReactNode } from "react";
import { Lock, Signal, Wifi, BatteryMedium } from "lucide-react";

/**
 * Marco visual tipo iPhone Safari para demos donde la audiencia es el
 * paciente (que reserva o consulta desde móvil 99% del tiempo). Se
 * diferencia visualmente del AppChrome desktop — status bar con hora,
 * notch falso, dirección bar de Safari mobile abajo del status.
 *
 * Usar para contextos genuinamente móvil: portal del paciente,
 * recordatorios, formulario de reservación pública.
 */
export function AppChromeMobile({
  path,
  hora = "16:32",
  children,
}: {
  /** URL relativa que se muestra en address bar — sin "https://". */
  path: string;
  /** Hora mostrada en status bar (default "16:32"). */
  hora?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-[36px] border-[8px] border-ink bg-canvas shadow-deep">
      {/* Status bar iOS */}
      <div className="relative flex items-center justify-between bg-canvas px-7 py-2">
        <span className="font-mono text-[0.78rem] font-semibold text-ink-strong">
          {hora}
        </span>
        {/* Notch falso centrado */}
        <span
          aria-hidden
          className="absolute left-1/2 top-1.5 h-5 w-20 -translate-x-1/2 rounded-full bg-ink"
        />
        <div className="flex items-center gap-1 text-ink-strong">
          <Signal className="h-3 w-3" strokeWidth={2.4} />
          <Wifi className="h-3 w-3" strokeWidth={2.4} />
          <BatteryMedium className="h-3.5 w-3.5" strokeWidth={2.4} />
        </div>
      </div>

      {/* Safari mobile address bar */}
      <div className="border-b border-line bg-surface-alt px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg bg-canvas px-2.5 py-1.5">
          <Lock className="h-3 w-3 shrink-0 text-validation" strokeWidth={2.4} />
          <p className="truncate text-[0.72rem] font-mono text-ink-strong">
            {path}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="bg-canvas px-4 py-5">{children}</div>

      {/* Home indicator */}
      <div className="flex items-center justify-center bg-canvas py-2">
        <span
          aria-hidden
          className="h-1 w-28 rounded-full bg-ink/70"
        />
      </div>
    </div>
  );
}
