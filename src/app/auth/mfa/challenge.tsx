"use client";

import { useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { submitMfaChallenge } from "./actions";

export function MfaChallenge({
  factorId,
  nextPath,
}: {
  factorId: string;
  nextPath: string;
}) {
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await submitMfaChallenge(factorId, code, nextPath);
      if (r.status === "error") setError(r.message);
      // success path triggers redirect on the server
    });
  }

  return (
    <form onSubmit={onSubmit} className="lg-card space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-validation-soft">
          <ShieldCheck className="h-5 w-5 text-validation" strokeWidth={2} />
        </div>
        <div>
          <p className="lg-eyebrow-validation">Segundo factor</p>
          <h2 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
            Ingresa tu código 2FA
          </h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Abre tu app de autenticación y escribe el código de 6 dígitos.
          </p>
        </div>
      </div>

      <div>
        <label
          htmlFor="totp"
          className="block text-caption font-medium text-ink-strong"
        >
          Código
        </label>
        <input
          id="totp"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          autoComplete="one-time-code"
          autoFocus
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className="lg-input mt-1 font-mono text-lg tracking-[0.4em]"
          placeholder="000000"
          disabled={pending}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || code.length !== 6}
        className="lg-cta-primary w-full justify-center disabled:opacity-60"
      >
        {pending ? "Verificando…" : "Verificar y continuar"}
      </button>
    </form>
  );
}
