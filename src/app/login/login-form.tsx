"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, ArrowLeft, KeyRound } from "lucide-react";
import {
  requestMagicLink,
  verifyOtpCode,
  type LoginState,
  type VerifyState,
} from "./actions";
import { TurnstileWidget } from "@/components/turnstile-widget";

type Step = "email" | "verify";

const EASE = [0.22, 1, 0.36, 1] as const;

export function LoginForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

  const [pending, startTransition] = useTransition();
  const [verifying, startVerifying] = useTransition();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(initialEmail);
  const [emailState, setEmailState] = useState<LoginState>({ status: "idle" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifyState, setVerifyState] = useState<VerifyState>({
    status: "idle",
  });
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const onToken = useCallback((t: string | null) => setTurnstileToken(t), []);

  function onSendEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailState({ status: "idle" });
    startTransition(async () => {
      const result = await requestMagicLink(email, turnstileToken);
      setEmailState(result);
      if (result.status === "ok") {
        setStep("verify");
        // Autofocus el primer input del código
        setTimeout(() => inputRefs.current[0]?.focus(), 350);
      }
    });
  }

  function onChangeDigit(idx: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    setVerifyState({ status: "idle" });

    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }

    // Auto-submit cuando se complete
    const joined = next.join("");
    if (joined.length === 6 && /^\d{6}$/.test(joined)) {
      submitCode(joined);
    }
  }

  function onKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      e.preventDefault();
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").trim();
    const digits = text.replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length === 0) return;
    const padded = [...digits, ...Array(6 - digits.length).fill("")];
    setCode(padded);
    const targetIdx = Math.min(digits.length, 5);
    inputRefs.current[targetIdx]?.focus();
    if (digits.length === 6) {
      submitCode(digits.join(""));
    }
  }

  function submitCode(token: string) {
    setVerifyState({ status: "idle" });
    startVerifying(async () => {
      const r = await verifyOtpCode(email, token);
      setVerifyState(r);
      if (r.status === "ok") {
        router.push("/dashboard");
        router.refresh();
      } else if (r.status === "mfa_required") {
        router.push("/auth/mfa?next=/dashboard");
        router.refresh();
      } else {
        // Clear y enfocar primer input
        setCode(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    });
  }

  function backToEmail() {
    setStep("email");
    setCode(["", "", "", "", "", ""]);
    setVerifyState({ status: "idle" });
    setEmailState({ status: "idle" });
  }

  async function onResend() {
    setEmailState({ status: "idle" });
    startTransition(async () => {
      const result = await requestMagicLink(email, turnstileToken);
      setEmailState(result);
    });
  }

  // Atajo: enviar al presionar Enter cuando hay 6 dígitos
  useEffect(() => {
    function onEnter(e: KeyboardEvent) {
      if (step !== "verify" || verifying) return;
      if (e.key !== "Enter") return;
      const joined = code.join("");
      if (joined.length === 6) {
        e.preventDefault();
        submitCode(joined);
      }
    }
    window.addEventListener("keydown", onEnter);
    return () => window.removeEventListener("keydown", onEnter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, step, verifying]);

  return (
    <div className="lg-card">
      <AnimatePresence mode="wait">
        {step === "email" ? (
          <motion.form
            key="email-step"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: EASE }}
            onSubmit={onSendEmail}
            noValidate
            className="space-y-5"
          >
            <div>
              <p className="lg-eyebrow-validation">Acceso piloto</p>
              <h2 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
                Entra a LitienGuard.
              </h2>
              <p className="mt-2 text-body-sm text-ink-muted">
                Sin contraseñas. Te enviamos un código de 6 dígitos al
                correo. Solo cuentas invitadas al piloto pueden entrar.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-caption font-medium text-ink-strong"
              >
                Correo
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                placeholder="tu.correo@hospital.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="lg-input"
                disabled={pending}
                autoComplete="email"
                required
                suppressHydrationWarning
              />
            </div>

            {turnstileSiteKey && (
              <TurnstileWidget siteKey={turnstileSiteKey} onToken={onToken} />
            )}

            {emailState.status === "error" && (
              <p
                role="alert"
                className="rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong"
              >
                {emailState.message}
              </p>
            )}

            <button
              type="submit"
              disabled={
                pending || !email || (!!turnstileSiteKey && !turnstileToken)
              }
              className="lg-cta-primary w-full justify-center disabled:opacity-60"
            >
              {pending ? "Enviando código…" : "Enviar código"}
              {!pending && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
            </button>

            <p className="text-caption text-ink-soft">
              ¿No tienes acceso?{" "}
              <Link href="/#solicita-piloto" className="underline">
                Solicítalo aquí
              </Link>
              .
            </p>
          </motion.form>
        ) : (
          <motion.div
            key="verify-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="space-y-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-validation-soft text-validation">
                <KeyRound className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="lg-eyebrow-validation">Verificación</p>
                <h2 className="mt-1 text-h2 font-semibold tracking-tight text-ink-strong">
                  Revisa tu correo.
                </h2>
                <p className="mt-1 text-body-sm text-ink-muted">
                  Te enviamos un código de 6 dígitos a{" "}
                  <strong className="font-semibold text-ink-strong">
                    {email}
                  </strong>
                  . Pégalo o tecléalo abajo.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => onChangeDigit(idx, e.target.value)}
                  onKeyDown={(e) => onKeyDown(idx, e)}
                  onPaste={onPaste}
                  disabled={verifying}
                  aria-label={`Dígito ${idx + 1}`}
                  className="h-14 w-full max-w-[3.25rem] rounded-xl border-2 border-line bg-surface text-center text-h2 font-bold tabular-nums text-ink-strong focus:border-validation focus:outline-none focus:ring-2 focus:ring-validation-soft disabled:opacity-60"
                  autoComplete={idx === 0 ? "one-time-code" : "off"}
                  suppressHydrationWarning
                />
              ))}
            </div>

            {verifyState.status === "error" && (
              <p
                role="alert"
                className="rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong"
              >
                {verifyState.message}
              </p>
            )}
            {verifying && (
              <p className="text-center text-caption text-validation">
                Verificando código…
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                const joined = code.join("");
                if (joined.length === 6) submitCode(joined);
              }}
              disabled={verifying || code.join("").length !== 6}
              className="lg-cta-primary w-full justify-center disabled:opacity-60"
            >
              {verifying ? "Verificando…" : "Entrar"}
              {!verifying && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
            </button>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={backToEmail}
                disabled={verifying}
                className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong disabled:opacity-60"
              >
                <ArrowLeft className="h-3 w-3" strokeWidth={2} />
                Cambiar correo
              </button>
              <button
                type="button"
                onClick={onResend}
                disabled={pending || verifying}
                className="inline-flex items-center gap-1.5 text-caption text-validation hover:underline disabled:opacity-60"
              >
                <Mail className="h-3 w-3" strokeWidth={2} />
                {pending ? "Enviando…" : "Reenviar código"}
              </button>
            </div>

            <p className="text-center text-[0.7rem] text-ink-soft">
              También puedes entrar con el magic link del correo si estás
              en el mismo dispositivo. El código expira en 1 hora.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
