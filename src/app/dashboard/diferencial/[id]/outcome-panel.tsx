"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { setOutcome, deleteSession } from "./actions";

type OutcomeValue = "pendiente" | "confirmado" | "refutado" | "parcial";

const OUTCOME_OPTIONS: Array<{
  value: OutcomeValue;
  label: string;
  detail: string;
  icon: typeof CheckCircle2;
  color: string;
}> = [
  {
    value: "pendiente",
    label: "Pendiente",
    detail: "Aún esperando estudios confirmatorios o seguimiento",
    icon: Clock,
    color: "text-ink-quiet border-line bg-surface-alt",
  },
  {
    value: "confirmado",
    label: "Confirmado",
    detail: "El top-1 del motor fue correcto — confirmado por estudio o seguimiento",
    icon: CheckCircle2,
    color: "text-validation border-validation-soft bg-validation-soft/40",
  },
  {
    value: "parcial",
    label: "Parcial",
    detail: "Familia de diagnóstico correcta, subtipo distinto",
    icon: AlertTriangle,
    color: "text-warn border-warn-soft bg-warn-soft/40",
  },
  {
    value: "refutado",
    label: "Refutado",
    detail: "El motor erró — diagnóstico distinto confirmado",
    icon: AlertCircle,
    color: "text-rose border-rose-soft bg-rose-soft/40",
  },
];

export function OutcomePanel({
  id,
  initialOutcome,
  outcomeAt,
  initialNotes,
}: {
  id: string;
  initialOutcome: string | null;
  outcomeAt: string | null;
  initialNotes: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [outcome, setOutcomeState] = useState<OutcomeValue>(
    (initialOutcome as OutcomeValue) ?? "pendiente",
  );
  const [notas, setNotas] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function onSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const r = await setOutcome(id, outcome, notas);
      if (r.status === "ok") {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      } else {
        setError(r.message);
      }
    });
  }

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const r = await deleteSession(id);
      if (r.status === "ok") {
        router.push("/dashboard/diferencial/historial");
      } else {
        setError(r.message);
      }
    });
  }

  return (
    <section className="lg-card space-y-4">
      <div>
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Outcome del caso
        </h2>
        <p className="mt-1 text-caption text-ink-muted">
          Cuando obtengas el resultado de los estudios confirmatorios, marca
          el outcome aquí. Esta información alimenta el loop de calidad.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {OUTCOME_OPTIONS.map((opt) => {
          const isSelected = outcome === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setOutcomeState(opt.value)}
              disabled={pending}
              className={`text-left rounded-lg border-2 px-3 py-2.5 transition-all disabled:opacity-50 ${
                isSelected ? opt.color : "border-line bg-surface hover:bg-surface-alt"
              }`}
            >
              <div className="flex items-start gap-2">
                <Icon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    isSelected ? "" : "text-ink-quiet"
                  }`}
                  strokeWidth={2.2}
                />
                <div>
                  <p
                    className={`text-body-sm font-semibold ${
                      isSelected ? "" : "text-ink-strong"
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p
                    className={`mt-0.5 text-caption leading-snug ${
                      isSelected ? "opacity-90" : "text-ink-muted"
                    }`}
                  >
                    {opt.detail}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-1">
        <label className="block text-caption font-medium text-ink-strong">
          ¿Qué pasó? (opcional)
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Resultado del PYP scan, biopsia, control a las 4 semanas. Este campo guarda lo que ocurrió realmente — no se mezcla con tus notas de la consulta."
          disabled={pending}
          className="lg-input resize-y"
        />
        <p className="text-caption text-ink-soft">
          Campo separado del de la consulta — guarda el outcome real para el
          loop de calidad.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong">
          <AlertCircle className="h-4 w-4 text-rose" />
          {error}
        </div>
      )}

      {outcomeAt && (
        <p className="text-caption text-ink-soft">
          Último cambio:{" "}
          {new Date(outcomeAt).toLocaleString("es-MX", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-line pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="lg-cta-primary disabled:opacity-60"
        >
          {pending ? "Guardando…" : saved ? "✓ Guardado" : "Guardar outcome"}
        </button>

        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-soft px-4 py-2 text-body-sm text-rose hover:bg-rose-soft disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar caso
          </button>
        ) : (
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="rounded-lg bg-rose px-4 py-2 text-body-sm font-medium text-surface hover:bg-rose/90 disabled:opacity-50"
            >
              {pending ? "Eliminando…" : "Sí, eliminar definitivamente"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={pending}
              className="rounded-lg border border-line px-4 py-2 text-body-sm text-ink-strong hover:bg-surface-alt disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
