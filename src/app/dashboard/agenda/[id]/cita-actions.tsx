"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Pencil, UserX, AlertCircle } from "lucide-react";
import { changeCitaStatus, deleteCita } from "../actions";

export function CitaActions({
  citaId,
  status,
}: {
  citaId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [askCancel, setAskCancel] = useState(false);
  const [motivo, setMotivo] = useState("");

  function changeStatus(
    next: "confirmada" | "completada" | "no_asistio",
  ) {
    setError(null);
    startTransition(async () => {
      const r = await changeCitaStatus(citaId, next);
      if (r.status === "error") setError(r.message);
      else router.refresh();
    });
  }

  function onCancel() {
    setError(null);
    startTransition(async () => {
      const r = await changeCitaStatus(citaId, "cancelada", motivo);
      if (r.status === "error") {
        setError(r.message);
      } else {
        setAskCancel(false);
        setMotivo("");
        router.refresh();
      }
    });
  }

  function onDelete() {
    if (!confirm("¿Eliminar esta cita permanentemente? Esta acción no se puede deshacer.")) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await deleteCita(citaId);
      if (r.status === "error") setError(r.message);
      else router.push("/dashboard/agenda");
    });
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
        {status === "agendada" && (
          <button
            type="button"
            onClick={() => changeStatus("confirmada")}
            disabled={pending}
            className="lg-cta-primary disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirmar
          </button>
        )}

        {(status === "agendada" || status === "confirmada") && (
          <>
            <button
              type="button"
              onClick={() => changeStatus("completada")}
              disabled={pending}
              className="lg-cta-ghost disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              Marcar completada
            </button>
            <button
              type="button"
              onClick={() => changeStatus("no_asistio")}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg border border-warn-soft px-4 py-2 text-body-sm text-warn hover:bg-warn-soft disabled:opacity-50"
            >
              <UserX className="h-4 w-4" />
              No asistió
            </button>
          </>
        )}

        <Link
          href={`/dashboard/agenda/${citaId}/editar`}
          className="lg-cta-ghost"
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Link>

        {status !== "cancelada" && (status === "agendada" || status === "confirmada") && (
          <button
            type="button"
            onClick={() => setAskCancel(true)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-soft px-4 py-2 text-body-sm text-rose hover:bg-rose-soft disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Cancelar cita
          </button>
        )}

        {(status === "cancelada" || status === "completada" || status === "no_asistio") && (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-soft px-4 py-2 text-body-sm text-rose hover:bg-rose-soft disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Eliminar permanentemente
          </button>
        )}
      </div>

      {askCancel && (
        <div className="rounded-xl border border-rose-soft bg-rose-soft px-4 py-3">
          <p className="text-body-sm font-semibold text-ink-strong">
            Cancelar la cita
          </p>
          <p className="mt-1 text-caption text-ink-muted">
            Captura un motivo. La cita queda en el registro como cancelada.
          </p>
          <div className="mt-3 space-y-2">
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo de la cancelación"
              rows={2}
              maxLength={500}
              disabled={pending}
              className="lg-input resize-y"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={pending || motivo.trim().length < 3}
                className="rounded-lg bg-rose px-4 py-2 text-body-sm font-medium text-surface hover:bg-rose/90 disabled:opacity-50"
              >
                {pending ? "Cancelando…" : "Confirmar cancelación"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAskCancel(false);
                  setMotivo("");
                  setError(null);
                }}
                disabled={pending}
                className="rounded-lg border border-line bg-surface px-4 py-2 text-body-sm text-ink-strong hover:bg-surface-alt disabled:opacity-50"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
