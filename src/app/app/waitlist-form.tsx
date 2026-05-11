"use client";

import { useCallback, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Apple, Smartphone } from "lucide-react";
import { submitAppWaitlist, type WaitlistState } from "./actions";
import { TurnstileWidget } from "@/components/turnstile-widget";

const PLATAFORMAS: Array<{
  value: "iphone" | "android" | "ambas";
  label: string;
  icon: typeof Apple;
}> = [
  { value: "iphone", label: "iPhone", icon: Apple },
  { value: "android", label: "Android", icon: Smartphone },
  { value: "ambas", label: "Ambas", icon: Smartphone },
];

export function WaitlistForm() {
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [plataforma, setPlataforma] = useState<"iphone" | "android" | "ambas">(
    "iphone",
  );
  const [state, setState] = useState<WaitlistState>({ status: "idle" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const onToken = useCallback((t: string | null) => setTurnstileToken(t), []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "idle" });
    startTransition(async () => {
      const r = await submitAppWaitlist(
        { email, plataforma },
        turnstileToken,
      );
      setState(r);
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
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center py-6 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-validation-soft">
              <CheckCircle2
                className="h-6 w-6 text-validation"
                strokeWidth={2}
              />
            </div>
            <h3 className="mt-4 text-h2 font-semibold tracking-tight text-ink-strong">
              Listo, estás en la lista.
            </h3>
            <p className="mt-2 max-w-sm text-body-sm text-ink-muted">
              Te avisamos por correo cuando la app nativa esté disponible.
              Mientras tanto, puedes usar LitienGuard desde el navegador de tu
              celular — funciona idéntico.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            noValidate
            className="space-y-5"
          >
            <div>
              <p className="lg-eyebrow-validation">Lista de espera</p>
              <h3 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
                Únete a la lista.
              </h3>
              <p className="mt-2 text-body-sm text-ink-muted">
                Avísanos en qué plataforma la quieres y te escribimos en cuanto
                esté lista.
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

            <div className="space-y-2">
              <p className="text-caption font-medium text-ink-strong">
                ¿En qué plataforma la usarías?
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PLATAFORMAS.map((p) => {
                  const Icon = p.icon;
                  const active = plataforma === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPlataforma(p.value)}
                      disabled={pending}
                      className={`flex flex-col items-center justify-center gap-1 rounded-lg border px-3 py-3 transition-all ${
                        active
                          ? "border-validation bg-validation-soft text-validation"
                          : "border-line bg-surface text-ink-muted hover:border-line-strong"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                      <span className="text-caption font-medium">
                        {p.label}
                      </span>
                    </button>
                  );
                })}
              </div>
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
                pending ||
                !email ||
                (!!turnstileSiteKey && !turnstileToken)
              }
              className="lg-cta-primary w-full justify-center disabled:opacity-60"
            >
              {pending ? "Enviando…" : "Unirme a la lista"}
              {!pending && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
