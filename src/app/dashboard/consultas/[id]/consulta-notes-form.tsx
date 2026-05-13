"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { updateConsultaNotes } from "../actions";

export function ConsultaNotesForm({
  id,
  initialMotivo,
  initialNotas,
  disabled,
}: {
  id: string;
  initialMotivo: string | null;
  initialNotas: string | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [motivo, setMotivo] = useState(initialMotivo ?? "");
  const [notas, setNotas] = useState(initialNotas ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const dirty =
    motivo !== (initialMotivo ?? "") || notas !== (initialNotas ?? "");

  function onSave() {
    setErr(null);
    setOk(false);
    startTransition(async () => {
      const r = await updateConsultaNotes(id, motivo || null, notas || null);
      if (r.status === "ok") {
        setOk(true);
        router.refresh();
        setTimeout(() => setOk(false), 2000);
      } else {
        setErr(r.message);
      }
    });
  }

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="block text-caption font-medium text-ink-strong">
          Motivo de consulta
        </label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={2}
          maxLength={2000}
          disabled={disabled || pending}
          className="lg-input mt-1"
          placeholder="Ej. dolor torácico de 3 días, evaluación preoperatoria…"
        />
      </div>
      <div>
        <label className="block text-caption font-medium text-ink-strong">
          Notas libres{" "}
          <span className="text-ink-soft font-normal">
            (opcional, no clínico)
          </span>
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={3}
          maxLength={5000}
          disabled={disabled || pending}
          className="lg-input mt-1"
          placeholder="Observaciones de la sesión, recordatorios administrativos…"
        />
      </div>
      {err && (
        <p className="flex items-start gap-1 text-caption text-rose">
          <AlertCircle className="mt-0.5 h-3 w-3" />
          {err}
        </p>
      )}
      <div className="flex items-center justify-end gap-3">
        {ok && (
          <span className="inline-flex items-center gap-1 text-caption text-validation">
            <Check className="h-3 w-3" />
            Guardado
          </span>
        )}
        {dirty && !disabled && (
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-caption font-medium text-ink-strong hover:bg-surface-alt disabled:opacity-60"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            Guardar cambios
          </button>
        )}
      </div>
    </div>
  );
}
