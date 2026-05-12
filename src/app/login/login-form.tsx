"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import { requestMagicLink, type LoginState } from "./actions";
import { TurnstileWidget } from "@/components/turnstile-widget";

export function LoginForm({ initialEmail = "" }: { initialEmail?: string }) {
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<LoginState>({ status: "idle" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const onToken = useCallback((t: string | null) => setTurnstileToken(t), []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "idle" });
    startTransition(async () => {
      const result = await requestMagicLink(email, turnstileToken);
      setState(result);
    });
  }

  return (
    <div className="lg-card">
      <AnimatePresence mode="wait">
        {state.status === "ok" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center py-6 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-validation-soft">
              <Mail className="h-7 w-7 text-validation" />
            </div>
            <h2 className="mt-5 text-h2 font-semibold tracking-tight text-ink-strong">
              Revisa tu correo.
            </h2>
            <p className="mt-2 max-w-sm text-body-sm text-ink-muted">
              {state.message}
            </p>
            <p className="mt-6 text-caption text-ink-soft">
              El link expira en 1 hora. Si no llega, revisa la carpeta de spam.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={onSubmit}
            noValidate
            className="space-y-5"
          >
            <div>
              <p className="lg-eyebrow-validation">Acceso piloto</p>
              <h2 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
                Entra a LitienGuard.
              </h2>
              <p className="mt-2 text-body-sm text-ink-muted">
                Magic link sin contraseñas. Solo correos invitados al piloto
                pueden entrar.
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

            {state.status === "error" && (
              <p
                role="alert"
                className="rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong"
              >
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={
                pending || !email || (!!turnstileSiteKey && !turnstileToken)
              }
              className="lg-cta-primary w-full justify-center disabled:opacity-60"
            >
              {pending ? "Enviando…" : "Enviar magic link"}
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
        )}
      </AnimatePresence>
    </div>
  );
}
