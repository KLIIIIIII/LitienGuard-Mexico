"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { cancelByToken } from "./actions";

export function CancelCitaForm({ token }: { token: string }) {
  const router = useRouter();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

  const [pending, startTransition] = useTransition();
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const onToken = useCallback((t: string | null) => setTurnstileToken(t), []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (motivo.trim().length < 3) {
      setError("Cuéntanos brevemente el motivo.");
      return;
    }
    startTransition(async () => {
      const r = await cancelByToken(token, motivo);
      if (r.status === "ok") {
        setSuccess(true);
        // After success, refresh server data so the page renders the cancelled state
        setTimeout(() => router.refresh(), 600);
      } else {
        setError(r.message);
      }
    });
  }

  if (success) {
    return (
      <div className="lg-card border-validation-soft">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-validation"
            strokeWidth={2}
          />
          <div>
            <p className="text-body-sm font-semibold text-ink-strong">
              Cita cancelada con éxito
            </p>
            <p className="mt-1 text-caption text-ink-muted">
              Notificamos al consultorio. El horario quedó liberado.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="lg-card space-y-4">
      <div>
        <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Confirmar cancelación
        </h3>
        <p className="mt-1 text-body-sm text-ink-muted">
          Esta acción no se puede revertir desde aquí. Si te equivocas, contacta
          al consultorio para reagendar.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-caption font-medium text-ink-strong">
          Motivo de la cancelación <span className="text-rose">*</span>
        </label>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={pending}
          placeholder="Surgió un imprevisto. Necesito reagendar para la próxima semana."
          className="lg-input resize-y"
          required
        />
        <p className="text-caption text-ink-soft">
          Esto nos ayuda a mejorar el servicio y aviso al consultorio.
        </p>
      </div>

      {turnstileSiteKey && (
        <TurnstileWidget siteKey={turnstileSiteKey} onToken={onToken} />
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong">
          <AlertCircle className="h-4 w-4 text-rose" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={
            pending ||
            motivo.trim().length < 3 ||
            (!!turnstileSiteKey && !turnstileToken)
          }
          className="inline-flex items-center gap-2 rounded-lg bg-rose px-5 py-2.5 text-body-sm font-medium text-surface hover:bg-rose/90 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          {pending ? "Cancelando…" : "Confirmar cancelación"}
        </button>
        <Link
          href="/"
          className="inline-flex items-center rounded-lg border border-line bg-surface px-5 py-2.5 text-body-sm text-ink-strong hover:bg-surface-alt"
        >
          Volver al inicio
        </Link>
      </div>
    </form>
  );
}
