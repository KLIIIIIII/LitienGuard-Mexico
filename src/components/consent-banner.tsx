import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";

/**
 * Banner que aparece en agenda, consultas y pacientes cuando el médico
 * aún no ha confirmado que informará a sus pacientes sobre el uso de
 * sus datos (LFPDPPP). Incluye link directo al toggle en Configuración.
 */
export function ConsentBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-warn/40 bg-warn-soft px-4 py-3">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" strokeWidth={2} />
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-semibold text-ink-strong">
          Necesitas el consentimiento de tus pacientes
        </p>
        <p className="mt-0.5 text-caption text-ink-muted">
          Para guardar datos personales de pacientes en LitienGuard, la ley
          mexicana exige que los informes primero. Activa la confirmación en
          Configuración para habilitar estas funciones.
        </p>
      </div>
      <Link
        href="/dashboard/configuracion#consentimiento"
        className="flex shrink-0 items-center gap-1 rounded-lg bg-warn px-3 py-1.5 text-caption font-semibold text-surface transition-opacity hover:opacity-90"
      >
        Configurar
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
