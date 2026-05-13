"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { closeConsulta, cancelConsulta, reopenConsulta } from "../actions";

export function ConsultaActions({
  id,
  status,
  motivoCancelacion,
}: {
  id: string;
  status: "abierta" | "cerrada" | "cancelada";
  motivoCancelacion: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showCancel, setShowCancel] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function onClose() {
    setErr(null);
    startTransition(async () => {
      const r = await closeConsulta(id);
      if (r.status === "ok") {
        router.refresh();
      } else {
        setErr(r.message);
      }
    });
  }

  function onCancel() {
    setErr(null);
    if (!motivo.trim()) {
      setErr("Indica el motivo de cancelación");
      return;
    }
    startTransition(async () => {
      const r = await cancelConsulta(id, motivo);
      if (r.status === "ok") {
        setShowCancel(false);
        router.refresh();
      } else {
        setErr(r.message);
      }
    });
  }

  function onReopen() {
    setErr(null);
    startTransition(async () => {
      const r = await reopenConsulta(id);
      if (r.status === "ok") {
        router.refresh();
      } else {
        setErr(r.message);
      }
    });
  }

  if (status === "abierta") {
    return (
      <div className="lg-card space-y-3">
        <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft">
          Estado
        </p>
        {showCancel ? (
          <div className="space-y-2">
            <label className="block text-caption font-medium text-ink-strong">
              Motivo de cancelación
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="lg-input"
              rows={2}
              maxLength={500}
              placeholder="Ej. paciente no asistió, reagendado…"
            />
            {err && (
              <p className="flex items-start gap-1 text-caption text-rose">
                <AlertCircle className="mt-0.5 h-3 w-3" />
                {err}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCancel(false);
                  setMotivo("");
                  setErr(null);
                }}
                disabled={pending}
                className="text-caption text-ink-muted hover:text-ink-strong"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={pending}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-rose px-3 py-1.5 text-caption font-medium text-surface disabled:opacity-60"
              >
                {pending && <Loader2 className="h-3 w-3 animate-spin" />}
                Confirmar cancelación
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="w-full lg-cta-primary justify-center disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
              )}
              Cerrar consulta
            </button>
            <button
              type="button"
              onClick={() => setShowCancel(true)}
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-line text-caption text-ink-muted py-1.5 hover:bg-surface-alt"
            >
              <XCircle className="h-3 w-3" strokeWidth={2} />
              Cancelar consulta
            </button>
            {err && (
              <p className="flex items-start gap-1 text-caption text-rose">
                <AlertCircle className="mt-0.5 h-3 w-3" />
                {err}
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  if (status === "cerrada") {
    return (
      <div className="lg-card space-y-3">
        <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft">
          Estado
        </p>
        <p className="text-caption text-ink-muted">
          Esta consulta ya está cerrada. Los artefactos siguen siendo
          editables (firma de notas, anulación de recetas).
        </p>
        <button
          type="button"
          onClick={onReopen}
          disabled={pending}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-line text-caption text-ink-muted py-1.5 hover:bg-surface-alt disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RotateCcw className="h-3 w-3" strokeWidth={2} />
          )}
          Reabrir consulta
        </button>
        {err && (
          <p className="flex items-start gap-1 text-caption text-rose">
            <AlertCircle className="mt-0.5 h-3 w-3" />
            {err}
          </p>
        )}
      </div>
    );
  }

  // cancelada
  return (
    <div className="lg-card space-y-2">
      <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft">
        Cancelada
      </p>
      {motivoCancelacion && (
        <p className="text-caption text-ink-muted">
          <strong className="font-semibold text-ink-strong">Motivo:</strong>{" "}
          {motivoCancelacion}
        </p>
      )}
      <button
        type="button"
        onClick={onReopen}
        disabled={pending}
        className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-line text-caption text-ink-muted py-1.5 hover:bg-surface-alt disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RotateCcw className="h-3 w-3" strokeWidth={2} />
        )}
        Reabrir
      </button>
    </div>
  );
}
