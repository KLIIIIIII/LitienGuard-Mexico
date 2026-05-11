"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Copy,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { disableMfa, enrollMfa, verifyMfa } from "./actions";

type EnrollData = { factorId: string; qr: string; secret: string };

export function MfaPanel({
  userEmail,
  existingFactorId,
  existingFactorName,
}: {
  userEmail: string;
  existingFactorId: string | null;
  existingFactorName: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enroll, setEnroll] = useState<EnrollData | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState(false);
  const [justDisabled, setJustDisabled] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [copied, setCopied] = useState(false);

  function onStartEnroll() {
    setError(null);
    setJustActivated(false);
    setJustDisabled(false);
    startTransition(async () => {
      const r = await enrollMfa();
      if (r.status === "error") setError(r.message);
      else setEnroll({ factorId: r.factorId, qr: r.qr, secret: r.secret });
    });
  }

  function onVerify() {
    if (!enroll) return;
    setError(null);
    startTransition(async () => {
      const r = await verifyMfa(enroll.factorId, code);
      if (r.status === "error") {
        setError(r.message);
      } else {
        setEnroll(null);
        setCode("");
        setJustActivated(true);
        // Quietly refresh server props in background so the next render
        // reflects the verified factor — no hard reload, no race condition.
        router.refresh();
      }
    });
  }

  function onDisable() {
    if (!existingFactorId) return;
    setError(null);
    startTransition(async () => {
      const r = await disableMfa(existingFactorId);
      if (r.status === "error") {
        setError(r.message);
      } else {
        setConfirmDisable(false);
        setJustDisabled(true);
        router.refresh();
      }
    });
  }

  function copySecret() {
    if (!enroll) return;
    navigator.clipboard.writeText(enroll.secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  // STATE 1: already enrolled (verified factor exists)
  if (existingFactorId) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-validation-soft">
            <ShieldCheck className="h-5 w-5 text-validation" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
              {justActivated ? "Listo — 2FA activado" : "2FA activado"}
            </h2>
            <p className="mt-1 text-body-sm text-ink-muted">
              {justActivated
                ? "Tu cuenta ya está protegida con un segundo factor. La próxima vez que entres te pediremos el código de 6 dígitos."
                : `Cuenta protegida con autenticación de dos factores.${existingFactorName ? ` (${existingFactorName})` : ""}`}
            </p>
            {!justActivated && (
              <p className="mt-3 text-caption text-ink-soft">
                Para desactivarlo necesitas haber iniciado sesión con tu código
                MFA. Si pierdes tu celular, contacta al administrador.
              </p>
            )}
          </div>
        </div>

        {!confirmDisable ? (
          <button
            type="button"
            onClick={() => setConfirmDisable(true)}
            disabled={pending}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-rose-soft px-4 py-2 text-body-sm text-rose hover:bg-rose-soft disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Desactivar 2FA
          </button>
        ) : (
          <div className="mt-5 rounded-lg border border-rose-soft bg-rose-soft px-4 py-3">
            <p className="text-body-sm text-ink-strong">
              ¿Seguro que quieres desactivar 2FA?
            </p>
            <p className="mt-1 text-caption text-ink-muted">
              Tu cuenta quedará protegida solo por magic link.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onDisable}
                disabled={pending}
                className="rounded-lg bg-rose px-4 py-2 text-body-sm font-medium text-surface hover:bg-rose/90 disabled:opacity-50"
              >
                {pending ? "Desactivando…" : "Sí, desactivar"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDisable(false)}
                disabled={pending}
                className="rounded-lg border border-line px-4 py-2 text-body-sm text-ink-strong hover:bg-surface-alt disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong">
            {error}
          </p>
        )}
      </div>
    );
  }

  // STATE 2: mid-enrollment (QR shown, awaiting code)
  if (enroll) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warn-soft">
            <Smartphone className="h-5 w-5 text-warn" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
              Escanea el QR con tu autenticador
            </h2>
            <p className="mt-1 text-body-sm text-ink-muted">
              Usa Google Authenticator, Authy, 1Password o cualquier app TOTP.
              Después escribe el código de 6 dígitos que aparece.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-[auto,1fr]">
          <div className="rounded-xl border border-line bg-surface-alt p-3">
            <Image
              src={enroll.qr}
              alt="QR para autenticador"
              width={192}
              height={192}
              className="h-48 w-48"
              unoptimized
            />
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-caption text-ink-soft">
                ¿No puedes escanear? Copia el secreto manualmente:
              </p>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-line bg-surface-alt px-3 py-2 font-mono text-body-sm text-ink-strong break-all">
                  {enroll.secret}
                </code>
                <button
                  type="button"
                  onClick={copySecret}
                  className="rounded-lg border border-line px-3 py-2 text-caption text-ink-strong hover:bg-surface-alt"
                  title="Copiar"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-validation" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-caption text-ink-soft">
                Cuenta: <span className="font-mono">{userEmail}</span>
              </p>
            </div>

            <div>
              <label
                htmlFor="totp"
                className="block text-caption font-medium text-ink-strong"
              >
                Código de 6 dígitos
              </label>
              <input
                id="totp"
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                autoComplete="one-time-code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="lg-input mt-1 max-w-[160px] font-mono text-lg tracking-[0.4em]"
                placeholder="000000"
                disabled={pending}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onVerify}
                disabled={pending || code.length !== 6}
                className="lg-cta-primary disabled:opacity-50"
              >
                {pending ? "Verificando…" : "Activar 2FA"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEnroll(null);
                  setCode("");
                  setError(null);
                }}
                disabled={pending}
                className="rounded-lg border border-line px-4 py-2 text-body-sm text-ink-strong hover:bg-surface-alt disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STATE 3: not enrolled — show CTA
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-warn-soft">
          <ShieldAlert className="h-5 w-5 text-warn" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
            Activa 2FA en tu cuenta
          </h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Opcional pero altamente recomendado. Recibirás un código de 6
            dígitos en tu celular cada vez que entres a LitienGuard.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-caption text-ink-muted">
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-validation" />
          Protege expedientes médicos si alguien accede a tu correo
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-validation" />
          Compatible con Google Authenticator, Authy, 1Password
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-validation" />
          Puedes desactivarlo cuando quieras
        </li>
      </ul>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong">
          {error}
        </p>
      )}
      {justDisabled && (
        <p className="mt-4 rounded-lg border border-validation-soft bg-validation-soft px-3 py-2 text-caption text-validation">
          2FA desactivado. Si cambias de opinión puedes volver a activarlo aquí mismo.
        </p>
      )}

      <button
        type="button"
        onClick={onStartEnroll}
        disabled={pending}
        className="lg-cta-primary mt-5 disabled:opacity-60"
      >
        {pending ? "Generando QR…" : "Activar 2FA"}
      </button>
    </div>
  );
}
