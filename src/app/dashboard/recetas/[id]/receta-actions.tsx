"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { firmarReceta, anularReceta } from "../actions";

export function RecetaActions({
  recetaId,
  status,
}: {
  recetaId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [askAnular, setAskAnular] = useState(false);
  const [motivo, setMotivo] = useState("");

  function onFirmar() {
    setError(null);
    startTransition(async () => {
      const r = await firmarReceta(recetaId);
      if (r.status === "error") setError(r.message);
      else router.refresh();
    });
  }

  function onAnular() {
    setError(null);
    startTransition(async () => {
      const r = await anularReceta(recetaId, motivo);
      if (r.status === "error") {
        setError(r.message);
      } else {
        setAskAnular(false);
        setMotivo("");
        router.refresh();
      }
    });
  }

  function onDownloadPdf() {
    window.open(`/api/recetas/${recetaId}/pdf`, "_blank");
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong">
          <AlertCircle className="h-4 w-4 text-rose" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {status === "borrador" && (
          <button
            type="button"
            onClick={onFirmar}
            disabled={pending}
            className="lg-cta-primary disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            {pending ? "Firmando…" : "Firmar receta"}
          </button>
        )}

        {(status === "firmada" || status === "borrador") && (
          <button
            type="button"
            onClick={onDownloadPdf}
            className="lg-cta-ghost"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </button>
        )}

        {status !== "anulada" && (
          <button
            type="button"
            onClick={() => setAskAnular(true)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-soft px-4 py-2 text-body-sm text-rose hover:bg-rose-soft disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Anular
          </button>
        )}
      </div>

      {askAnular && (
        <div className="rounded-xl border border-rose-soft bg-rose-soft px-4 py-3">
          <p className="text-body-sm font-semibold text-ink-strong">
            Anular receta
          </p>
          <p className="mt-1 text-caption text-ink-muted">
            Una receta anulada queda en el sistema con un motivo registrado.
            Esta acción no se puede deshacer.
          </p>
          <div className="mt-3 space-y-2">
            <label
              htmlFor="motivo"
              className="block text-caption font-medium text-ink-strong"
            >
              Motivo de la anulación
            </label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Paciente reportó alergia a la metformina después de emitir la receta."
              rows={2}
              maxLength={500}
              disabled={pending}
              className="lg-input resize-y"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onAnular}
                disabled={pending || motivo.trim().length < 5}
                className="rounded-lg bg-rose px-4 py-2 text-body-sm font-medium text-surface hover:bg-rose/90 disabled:opacity-50"
              >
                {pending ? "Anulando…" : "Confirmar anulación"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAskAnular(false);
                  setMotivo("");
                  setError(null);
                }}
                disabled={pending}
                className="rounded-lg border border-line bg-surface px-4 py-2 text-body-sm text-ink-strong hover:bg-surface-alt disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
