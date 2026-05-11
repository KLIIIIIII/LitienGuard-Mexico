"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, AlertCircle, Check } from "lucide-react";
import { toggleShareWithCollective } from "./actions";

export function CollectiveToggle({
  initial,
  practiceCount,
}: {
  initial: boolean;
  practiceCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onToggle() {
    const next = !enabled;
    if (
      !next &&
      practiceCount > 0 &&
      !confirm(
        `Vas a dejar de compartir. Esto eliminará ${practiceCount} fragmento(s) anonimizados que ya alimentan el cerebro colectivo. ¿Continuar?`,
      )
    ) {
      return;
    }
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await toggleShareWithCollective(next);
      if (result.status === "ok") {
        setEnabled(next);
        setSaved(true);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="lg-card space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
            Cerebro colectivo
          </h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Al activar, tus notas SOAP firmadas se anonimizan (sin nombre,
            iniciales, edad redondeada a década) y se agregan al cerebro como
            «práctica observada». Otros médicos las verán etiquetadas
            claramente como referencia secundaria. Tú no aparecerás
            identificado.
          </p>
          <p className="mt-2 text-caption text-ink-soft">
            La práctica observada NO se usa para alimentar el SOAP automático
            del modelo —solo aparece en la búsqueda manual del Cerebro—.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={onToggle}
          disabled={pending}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${
            enabled ? "bg-validation" : "bg-line-strong"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-surface shadow transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {practiceCount > 0 && enabled && (
        <p className="text-caption text-ink-soft">
          Tienes <strong>{practiceCount}</strong> fragmento{practiceCount === 1 ? "" : "s"}{" "}
          anonimizado{practiceCount === 1 ? "" : "s"} en el cerebro colectivo.
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-rose" />
          <span>{error}</span>
        </div>
      )}

      {saved && !error && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-validation-soft bg-validation-soft px-3 py-2 text-caption text-ink-strong"
        >
          <Check className="mt-0.5 h-3.5 w-3.5 text-validation" />
          <span>Preferencia guardada.</span>
        </div>
      )}
    </div>
  );
}
