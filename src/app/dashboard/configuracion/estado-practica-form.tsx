"use client";

import { useState, useTransition } from "react";
import { MapPin, Check, Loader2 } from "lucide-react";
import { ESTADOS_MX, type EstadoMx } from "@/lib/inference/epidemio-estados-mx";
import { guardarEstadoPractica } from "./actions";

interface Props {
  initial: EstadoMx | null;
}

export function EstadoPracticaForm({ initial }: Props) {
  const [estado, setEstado] = useState<EstadoMx | "">(initial ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value as EstadoMx | "";
    setEstado(val);
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const r = await guardarEstadoPractica(val || null);
      if (r.status === "ok") {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(r.message);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-ink-quiet" strokeWidth={2} />
        <label
          htmlFor="estado-practica"
          className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold"
        >
          Estado donde practicas
        </label>
      </div>
      <p className="text-caption text-ink-muted leading-relaxed">
        El motor bayesiano calibra los priors a la epidemiología del estado —
        TB es 2-3× más común en Chiapas/Oaxaca, cardiometabólico más en NL/
        Tamaulipas, cervix más en sureste, etc. Sin seleccionar, usa
        prevalencias nacionales.
      </p>
      <div className="flex items-center gap-2">
        <select
          id="estado-practica"
          value={estado}
          onChange={onChange}
          disabled={pending}
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-body-sm text-ink-strong focus:border-validation focus:outline-none disabled:opacity-50"
        >
          <option value="">— Sin seleccionar (prevalencias nacionales) —</option>
          {ESTADOS_MX.map((e) => (
            <option key={e.code} value={e.code}>
              {e.label}
            </option>
          ))}
        </select>
        {pending && (
          <Loader2 className="h-4 w-4 animate-spin text-ink-quiet" strokeWidth={2.2} />
        )}
        {saved && !pending && (
          <span className="inline-flex items-center gap-1 text-caption text-validation font-semibold">
            <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
            Guardado
          </span>
        )}
      </div>
      {error && <p className="text-caption text-rose">{error}</p>}
    </div>
  );
}
