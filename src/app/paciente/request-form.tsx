"use client";

import { useCallback, useState, useTransition } from "react";
import { ArrowRight, AlertCircle, Mail } from "lucide-react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { requestExpedienteAccess } from "./actions";

export function RequestAccessForm() {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState<
    { type: "ok" | "error"; message: string } | null
  >(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const onToken = useCallback((t: string | null) => setTurnstileToken(t), []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const r = await requestExpedienteAccess(email, turnstileToken);
      if (r.status === "ok") {
        setFeedback({ type: "ok", message: r.message });
        setEmail("");
      } else {
        setFeedback({ type: "error", message: r.message });
      }
    });
  }

  if (feedback?.type === "ok") {
    return (
      <div className="lg-card">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-validation-soft">
            <Mail className="h-5 w-5 text-validation" strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
              Revisa tu correo
            </h2>
            <p className="mt-2 text-body-sm text-ink-muted leading-relaxed">
              {feedback.message}
            </p>
            <p className="mt-4 text-caption text-ink-soft">
              Si no llega en 5 minutos, revisa la carpeta de spam o vuelve a
              solicitarlo más tarde.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="lg-card space-y-5">
      <div>
        <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
          Solicita acceso
        </h2>
        <p className="mt-2 text-body-sm text-ink-muted">
          Te enviamos un enlace único de un solo uso. Expira en 24 horas.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-caption font-medium text-ink-strong"
        >
          Tu correo
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={200}
          disabled={pending}
          placeholder="tu.correo@ejemplo.com"
          className="lg-input"
          autoComplete="email"
        />
      </div>

      {turnstileSiteKey && (
        <TurnstileWidget siteKey={turnstileSiteKey} onToken={onToken} />
      )}

      {feedback?.type === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong">
          <AlertCircle className="h-4 w-4 text-rose" />
          {feedback.message}
        </div>
      )}

      <button
        type="submit"
        disabled={
          pending ||
          !email ||
          (!!turnstileSiteKey && !turnstileToken)
        }
        className="lg-cta-primary w-full justify-center disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar enlace"}
        {!pending && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
      </button>
    </form>
  );
}
