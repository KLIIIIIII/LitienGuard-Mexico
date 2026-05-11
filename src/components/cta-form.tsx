"use client";

import { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  preregistroSchema,
  type PreregistroInput,
  TIPO_LABELS,
} from "@/lib/preregistro";
import { submitPreregistro } from "@/app/actions/preregistro";
import { Eyebrow } from "@/components/eyebrow";
import { TurnstileWidget } from "@/components/turnstile-widget";

export function CtaForm() {
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState<null | string>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const onToken = useCallback((t: string | null) => setTurnstileToken(t), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PreregistroInput>({
    resolver: zodResolver(preregistroSchema),
    defaultValues: { tipo: "medico" },
  });

  function onSubmit(data: PreregistroInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await submitPreregistro(data, turnstileToken);
      if (result.status === "ok") {
        setSuccess(result.message);
        reset();
      } else if (result.status === "error") {
        setServerError(result.message);
      }
    });
  }

  return (
    <div className="lg-card relative overflow-hidden">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center py-8 text-center"
          >
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.15,
                type: "spring",
                damping: 12,
                stiffness: 180,
              }}
              viewBox="0 0 64 64"
              className="h-16 w-16"
              aria-hidden
            >
              <circle cx="32" cy="32" r="30" fill="#E5EDE8" />
              <motion.path
                d="M20 33 L29 42 L45 24"
                fill="none"
                stroke="#4A6B5B"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.35, duration: 0.6, ease: "easeOut" }}
              />
            </motion.svg>
            <h3 className="mt-5 text-h2 font-semibold tracking-tight text-ink-strong">
              Solicitud recibida.
            </h3>
            <p className="mt-2 max-w-sm text-body-sm text-ink-muted">
              {success}
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-5"
          >
            <div>
              <Eyebrow tone="validation">Pre-registro piloto</Eyebrow>
              <h3 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
                Cuéntanos quién eres.
              </h3>
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
                className={cn(
                  "lg-input",
                  errors.email && "border-rose focus:border-rose",
                )}
                disabled={pending}
                aria-invalid={!!errors.email}
                suppressHydrationWarning
                {...register("email")}
              />
              {errors.email && (
                <p className="text-caption text-rose">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="tipo"
                className="block text-caption font-medium text-ink-strong"
              >
                Tipo de usuario
              </label>
              <select
                id="tipo"
                className={cn("lg-input", "appearance-none pr-10")}
                disabled={pending}
                {...register("tipo")}
              >
                {(
                  Object.keys(TIPO_LABELS) as Array<keyof typeof TIPO_LABELS>
                ).map((k) => (
                  <option key={k} value={k}>
                    {TIPO_LABELS[k]}
                  </option>
                ))}
              </select>
              {errors.tipo && (
                <p className="text-caption text-rose">{errors.tipo.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="nombre"
                className="block text-caption font-medium text-ink-strong"
              >
                Nombre <span className="text-ink-soft">(opcional)</span>
              </label>
              <input
                id="nombre"
                type="text"
                placeholder="Cómo te llamas"
                className="lg-input"
                disabled={pending}
                suppressHydrationWarning
                {...register("nombre")}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="mensaje"
                className="block text-caption font-medium text-ink-strong"
              >
                Mensaje <span className="text-ink-soft">(opcional)</span>
              </label>
              <textarea
                id="mensaje"
                placeholder="Especialidad, hospital, qué te interesa..."
                rows={3}
                className="lg-input resize-none"
                disabled={pending}
                {...register("mensaje")}
              />
            </div>

            {turnstileSiteKey && (
              <TurnstileWidget siteKey={turnstileSiteKey} onToken={onToken} />
            )}

            {serverError && (
              <p
                role="alert"
                className="rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong"
              >
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={pending || (!!turnstileSiteKey && !turnstileToken)}
              className="lg-cta-primary w-full justify-center disabled:opacity-60"
            >
              {pending ? "Enviando…" : "Solicitar acceso piloto"}
              {!pending && <Check className="h-4 w-4" strokeWidth={2} />}
            </button>

            <p className="text-caption text-ink-soft">
              Al enviar aceptas nuestro{" "}
              <a href="/aviso-privacidad" className="underline">
                aviso de privacidad
              </a>
              . No compartiremos tus datos.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
