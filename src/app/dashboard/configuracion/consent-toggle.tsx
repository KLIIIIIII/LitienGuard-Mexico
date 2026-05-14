"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, AlertCircle, Check } from "lucide-react";
import { acceptConsentimientoPacientes } from "./actions";

export function ConsentToggle({
  aceptado,
  fechaAceptacion,
}: {
  aceptado: boolean;
  fechaAceptacion: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(aceptado);
  const [error, setError] = useState<string | null>(null);

  function onToggle() {
    if (done) return; // ya aceptado, no se puede deshacer
    setError(null);
    startTransition(async () => {
      const result = await acceptConsentimientoPacientes();
      if (result.status === "ok") {
        setDone(true);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  const fecha = fechaAceptacion
    ? new Date(fechaAceptacion).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="lg-card space-y-4" id="consentimiento">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-validation-soft text-validation">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
            Consentimiento de pacientes
          </h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Para guardar datos personales de tus pacientes en LitienGuard,
            necesitas informarles y obtener su consentimiento. Así lo exige
            la Ley Federal de Protección de Datos Personales (LFPDPPP).
          </p>
          <p className="mt-2 text-caption text-ink-soft">
            Al activar esto confirmas que informarás a cada paciente antes de
            registrar sus datos y que les harás saber cómo ejercer sus
            derechos ARCO (Acceso, Rectificación, Cancelación, Oposición).
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={done}
          onClick={onToggle}
          disabled={pending || done}
          title={done ? "Ya confirmado — no se puede desactivar" : "Activar"}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            done ? "bg-validation" : "bg-line-strong"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-surface shadow transition-transform ${
              done ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {done && fecha && (
        <div className="flex items-center gap-2 rounded-lg border border-validation-soft bg-validation-soft px-3 py-2 text-caption text-ink-strong">
          <Check className="h-3.5 w-3.5 text-validation" />
          <span>Confirmado el {fecha}. Ya puedes registrar datos de pacientes.</span>
        </div>
      )}

      {!done && (
        <p className="text-caption text-warn">
          Mientras no lo actives, no podrás agregar pacientes nuevos.
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-rose" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
