"use client";

import { useState, useTransition } from "react";
import { Send, Check, AlertCircle, Loader2 } from "lucide-react";
import { enviarRecallManual } from "../actions";

export function RecallTrigger({
  pacienteId,
  email,
  nombre,
  mesesSinConsulta,
  recallEnviadoAt,
}: {
  pacienteId: string;
  email: string | null;
  nombre: string;
  mesesSinConsulta: number | null;
  recallEnviadoAt: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState("");
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await enviarRecallManual(fd);
      if (r.status === "ok") {
        setOk(r.message ?? "Recordatorio enviado");
        setMensaje("");
      } else {
        setErr(r.message);
      }
    });
  }

  if (!email) {
    return (
      <div className="rounded-2xl border border-warn-soft bg-warn-soft/30 p-5">
        <AlertCircle className="h-5 w-5 text-warn" strokeWidth={2} />
        <p className="mt-2 text-body-sm font-semibold text-ink-strong">
          Sin correo registrado
        </p>
        <p className="mt-1 text-caption text-ink-muted leading-relaxed">
          Para enviar recordatorio por correo, agrega el email del paciente
          desde su edición. Si solo tienes teléfono, puedes contactarlo
          directamente.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-validation-soft bg-validation-soft/30 p-5">
      <div className="flex items-start gap-2">
        <Send
          className="mt-0.5 h-4 w-4 text-validation"
          strokeWidth={2.2}
        />
        <div>
          <p className="text-caption uppercase tracking-eyebrow font-semibold text-validation">
            Enviar recordatorio
          </p>
          <p className="mt-1 text-body-sm font-semibold text-ink-strong">
            Invita a {nombre} a una cita de mantenimiento
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input type="hidden" name="pacienteId" value={pacienteId} />
        <div>
          <label
            htmlFor="mensaje"
            className="block text-caption font-medium text-ink-strong"
          >
            Nota personal{" "}
            <span className="text-ink-soft">(opcional)</span>
          </label>
          <textarea
            id="mensaje"
            name="mensajePersonalizado"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={3}
            maxLength={800}
            placeholder="Ej: Sería bueno hacer un control de tu presión y revisar el plan de tratamiento."
            className="lg-input mt-1.5 resize-y"
            disabled={pending}
            suppressHydrationWarning
          />
          <p className="mt-1 text-caption text-ink-soft">
            {mensaje.length} / 800. Aparece destacada en el correo.
          </p>
        </div>

        {err && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-rose" />
            <span>{err}</span>
          </div>
        )}
        {ok && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-validation bg-validation-soft px-3 py-2 text-caption text-ink-strong"
          >
            <Check className="h-3.5 w-3.5 text-validation" />
            <span>{ok}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="lg-cta-primary w-full justify-center disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar a {email}
            </>
          )}
        </button>

        <p className="text-caption text-ink-soft leading-relaxed">
          {recallEnviadoAt ? (
            <>
              Último recordatorio:{" "}
              {new Date(recallEnviadoAt).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
              . Procura no saturar al paciente con envíos frecuentes.
            </>
          ) : mesesSinConsulta !== null ? (
            <>
              El paciente lleva {mesesSinConsulta}{" "}
              {mesesSinConsulta === 1 ? "mes" : "meses"} sin consulta.
            </>
          ) : (
            "No hay fecha de última consulta registrada."
          )}
        </p>
      </form>
    </div>
  );
}
