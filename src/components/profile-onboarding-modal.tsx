"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  Smile,
  Building2,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { setProfileType } from "@/app/dashboard/onboarding/actions";

type ProfileTypeChoice = "medico_general" | "dentista" | "hospital";

interface ProfileOption {
  value: ProfileTypeChoice;
  icon: typeof Stethoscope;
  title: string;
  description: string;
  examples: string;
}

const OPTIONS: ProfileOption[] = [
  {
    value: "medico_general",
    icon: Stethoscope,
    title: "Medicina general o especialidad",
    description:
      "Tu práctica gira alrededor de la consulta clínica con diagnóstico diferencial y prescripción.",
    examples: "Internista, cardiólogo, endocrinólogo, pediatra, geriatra",
  },
  {
    value: "dentista",
    icon: Smile,
    title: "Odontología",
    description:
      "Tu práctica incluye odontograma, planes de tratamiento dental y procedimientos por pieza.",
    examples: "Odontología general, endodoncia, periodoncia, ortodoncia",
  },
  {
    value: "hospital",
    icon: Building2,
    title: "Hospital o clínica multi-médico",
    description:
      "Coordinas a varios profesionales y necesitas ciclo de ingresos, dashboard ejecutivo y reporteo.",
    examples: "Director médico, administrador hospitalario, dueño de clínica",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function ProfileOnboardingModal() {
  const [selected, setSelected] = useState<ProfileTypeChoice | null>(null);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [step, setStep] = useState<"pregunta" | "guardando" | "listo">(
    "pregunta",
  );

  // Bloquear scroll del body mientras está abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function onConfirm() {
    if (!selected || pending) return;
    setErr(null);
    setStep("guardando");
    startTransition(async () => {
      const r = await setProfileType(selected);
      if (r.status === "ok") {
        setStep("listo");
        // El revalidatePath del action recarga el layout; pequeño delay
        // para que se vea la animación de éxito antes del unmount.
        setTimeout(() => {
          // Forzar refresh para que el sidebar y dashboard se filtren
          window.location.reload();
        }, 1200);
      } else {
        setErr(r.message);
        setStep("pregunta");
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-canvas"
      role="dialog"
      aria-modal
      aria-labelledby="onboarding-title"
    >
      {/* Aurora sutil de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.4, scale: 1.1 }}
          transition={{ duration: 2.5, ease: EASE }}
          className="absolute -left-32 -top-32 h-[60vh] w-[60vh] rounded-full bg-validation-soft blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 0.35, scale: 1.1 }}
          transition={{ duration: 2.5, ease: EASE, delay: 0.2 }}
          className="absolute -bottom-32 -right-32 h-[55vh] w-[55vh] rounded-full bg-accent-soft blur-3xl"
        />
      </div>

      <div className="relative z-10 w-full max-w-3xl px-6 py-10 sm:py-16">
        <AnimatePresence mode="wait">
          {step === "pregunta" && (
            <motion.div
              key="pregunta"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="space-y-10"
            >
              {/* Header */}
              <div className="space-y-3 text-center">
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
                  className="text-[0.72rem] uppercase tracking-[0.18em] font-semibold text-validation"
                >
                  LitienGuard · Bienvenida
                </motion.p>
                <motion.h1
                  id="onboarding-title"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.18 }}
                  className="mx-auto max-w-xl text-ink-strong leading-[1.08] tracking-[-0.02em] font-semibold"
                  style={{
                    fontSize: "clamp(1.875rem, 4vw, 2.75rem)",
                  }}
                >
                  Una pregunta antes de empezar.
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.26 }}
                  className="mx-auto max-w-lg text-body text-ink-muted"
                >
                  Adaptamos la interfaz a tu práctica. Esto define qué
                  módulos ves en tu panel.
                </motion.p>
              </div>

              {/* Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                {OPTIONS.map((opt, idx) => {
                  const Icon = opt.icon;
                  const active = selected === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelected(opt.value)}
                      disabled={pending}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: EASE,
                        delay: 0.32 + idx * 0.08,
                      }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      className={`group relative flex flex-col items-start gap-3 overflow-hidden rounded-2xl border bg-surface p-6 text-left transition-all ${
                        active
                          ? "border-validation shadow-lift ring-1 ring-validation"
                          : "border-line shadow-soft hover:border-line-strong"
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                          active
                            ? "bg-validation text-canvas"
                            : "bg-validation-soft text-validation"
                        }`}
                      >
                        <Icon className="h-6 w-6" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h2 className="text-body font-semibold leading-tight text-ink-strong">
                          {opt.title}
                        </h2>
                        <p className="text-caption leading-relaxed text-ink-muted">
                          {opt.description}
                        </p>
                      </div>
                      <p className="text-[0.65rem] leading-snug italic text-ink-soft">
                        Ej: {opt.examples}
                      </p>
                      <AnimatePresence>
                        {active && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: EASE }}
                            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-validation text-canvas"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  );
                })}
              </div>

              {err && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="text-center text-caption text-rose"
                >
                  {err}
                </motion.p>
              )}

              {/* Continue */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.6 }}
                className="flex flex-col items-center gap-3"
              >
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!selected || pending}
                  className="lg-cta-primary disabled:opacity-50"
                >
                  Continuar
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
                <p className="text-caption text-ink-soft">
                  Podrás cambiar esto después desde Configuración.
                </p>
              </motion.div>
            </motion.div>
          )}

          {(step === "guardando" || step === "listo") && (
            <motion.div
              key="guardando"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex flex-col items-center gap-4 py-20 text-center"
            >
              {step === "guardando" ? (
                <>
                  <Loader2
                    className="h-10 w-10 animate-spin text-validation"
                    strokeWidth={1.8}
                  />
                  <p className="text-body text-ink-muted">
                    Personalizando tu panel…
                  </p>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    damping: 12,
                    stiffness: 200,
                  }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-validation-soft">
                    <Check
                      className="h-7 w-7 text-validation"
                      strokeWidth={2.4}
                    />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-h2 font-semibold text-ink-strong">
                      Todo listo.
                    </h2>
                    <p className="text-body-sm text-ink-muted">
                      Cargando tu panel personalizado…
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
