"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertCircle, X, UserCheck } from "lucide-react";
import { approvePreregistro, dismissPreregistro } from "./actions";

const TIPO_LABELS: Record<string, string> = {
  medico: "Médico",
  paciente: "Paciente",
  hospital: "Hospital o clínica",
  otro: "Otro",
};

interface PreregistroRow {
  id: string;
  email: string;
  tipo: string;
  nombre: string | null;
  mensaje: string | null;
  created_at: string;
}

export function ApprovePreregistroRow({ prereg }: { prereg: PreregistroRow }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"medico" | "admin">("medico");
  const [tier, setTier] = useState<"free" | "pilot" | "pro" | "enterprise">(
    prereg.tipo === "medico" ? "pilot" : "free",
  );
  const [feedback, setFeedback] = useState<
    | { type: "ok"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);

  function onApprove(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const fd = new FormData();
    fd.set("preregistroId", prereg.id);
    fd.set("role", role);
    fd.set("subscription_tier", tier);
    startTransition(async () => {
      const r = await approvePreregistro(fd);
      if (r.status === "ok") {
        setFeedback({ type: "ok", message: r.message });
      } else if (r.status === "error") {
        setFeedback({ type: "error", message: r.message });
      }
    });
  }

  function onDismiss() {
    if (!confirm(`¿Descartar la solicitud de ${prereg.email}?`)) return;
    setFeedback(null);
    startTransition(async () => {
      const r = await dismissPreregistro(prereg.id);
      if (r.status === "error") {
        setFeedback({ type: "error", message: r.message });
      }
    });
  }

  const fechaStr = new Date(prereg.created_at).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-body-sm font-semibold text-ink-strong">
              {prereg.nombre ?? prereg.email}
            </p>
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-caption text-accent">
              {TIPO_LABELS[prereg.tipo] ?? prereg.tipo}
            </span>
          </div>
          {prereg.nombre && (
            <p className="text-caption text-ink-muted">{prereg.email}</p>
          )}
          {prereg.mensaje && (
            <p className="mt-2 text-caption text-ink-muted whitespace-pre-wrap">
              {prereg.mensaje}
            </p>
          )}
          <p className="mt-2 text-caption text-ink-soft">Recibida {fechaStr}</p>
        </div>
        <div className="shrink-0 flex gap-2">
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-validation bg-validation-soft px-3 py-1.5 text-caption font-semibold text-validation hover:bg-validation hover:text-surface disabled:opacity-50"
            >
              <UserCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
              Aprobar e invitar
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-caption text-ink-muted hover:bg-rose-soft hover:text-rose disabled:opacity-50"
            title="Descartar solicitud"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.2} />
            Descartar
          </button>
        </div>
      </div>

      {open && (
        <form
          onSubmit={onApprove}
          className="mt-4 border-t border-line pt-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-caption font-medium text-ink-strong">
                Rol
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "medico" | "admin")}
                disabled={pending}
                className="lg-input"
              >
                <option value="medico">Médico</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-caption font-medium text-ink-strong">
                Plan asignado
              </label>
              <select
                value={tier}
                onChange={(e) =>
                  setTier(
                    e.target.value as "free" | "pilot" | "pro" | "enterprise",
                  )
                }
                disabled={pending}
                className="lg-input"
              >
                <option value="free">Free · Explorador (sin scribe)</option>
                <option value="pilot">Pilot · Esencial (100 SOAPs/mes)</option>
                <option value="pro">Pro · Profesional (300 SOAPs + agenda + recetas)</option>
                <option value="enterprise">Enterprise · Clínica</option>
              </select>
            </div>
          </div>

          {feedback && (
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-caption ${
                feedback.type === "ok"
                  ? "border-validation-soft bg-validation-soft text-validation"
                  : "border-rose-soft bg-rose-soft text-ink-strong"
              }`}
            >
              {feedback.type === "ok" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {feedback.message}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="lg-cta-primary disabled:opacity-60"
            >
              {pending ? "Procesando…" : "Crear invitación"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setFeedback(null);
              }}
              disabled={pending}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-body-sm text-ink-strong hover:bg-surface-alt disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
