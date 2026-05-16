"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  Activity,
  Network,
  TrendingUp,
  Target,
  GraduationCap,
  ArrowRight,
  X,
  Check,
} from "lucide-react";
import { markPatronesTutorial } from "./actions";

const TRUST_PILLARS = [
  "Guías oficiales mexicanas",
  "Organismos internacionales",
  "Sociedades de especialidad",
  "Literatura peer-reviewed",
  "Universidades elite",
  "Normas oficiales mexicanas",
];

const easeOut: number[] = [0.16, 1, 0.3, 1];

interface Props {
  /** Si el tour debe arrancar automáticamente (primera vez). */
  autoOpen: boolean;
}

export function OnboardingModal({ autoOpen }: Props) {
  const [open, setOpen] = useState(autoOpen);
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();

  const steps = useSteps();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleSkip();
      if (e.key === "ArrowRight" && step < steps.length - 1) setStep(step + 1);
      if (e.key === "ArrowLeft" && step > 0) setStep(step - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  function handleNext() {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  }

  function handleComplete() {
    startTransition(async () => {
      await markPatronesTutorial("completed");
      setOpen(false);
    });
  }

  function handleSkip() {
    startTransition(async () => {
      await markPatronesTutorial("skipped");
      setOpen(false);
    });
  }

  function handleOpen() {
    setStep(0);
    setOpen(true);
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-caption font-semibold text-ink-strong hover:bg-surface-alt transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-validation" strokeWidth={2.4} />
          Ver tour de bienvenida
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            style={{
              background:
                "radial-gradient(circle at 50% 40%, rgba(15, 80, 70, 0.6), rgba(0, 0, 0, 0.75))",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            onClick={handleSkip}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ duration: 0.5, ease: easeOut }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-canvas shadow-2xl"
              style={{
                boxShadow:
                  "0 25px 80px -20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
              }}
            >
              {/* Close */}
              <button
                type="button"
                onClick={handleSkip}
                disabled={pending}
                className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink-strong disabled:opacity-50"
                aria-label="Saltar tour"
              >
                <X className="h-4 w-4" strokeWidth={2.4} />
              </button>

              {/* Step content */}
              <div className="relative px-6 pb-6 pt-10 sm:px-10 sm:pb-10 sm:pt-14 min-h-[480px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.45, ease: easeOut }}
                    className="space-y-6"
                  >
                    {steps[step]}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-alt/60 px-6 py-3 sm:px-10">
                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setStep(i)}
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: i === step ? 24 : 8,
                        background:
                          i === step
                            ? "var(--lg-validation, #0a8b7a)"
                            : i < step
                              ? "var(--lg-validation-soft, #c2e8e1)"
                              : "var(--lg-line, #e3dfd6)",
                      }}
                      aria-label={`Ir al paso ${i + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      disabled={pending}
                      className="rounded-lg border border-line bg-surface px-3 py-1.5 text-caption font-semibold text-ink-strong hover:bg-canvas disabled:opacity-50"
                    >
                      Atrás
                    </button>
                  )}
                  <motion.button
                    type="button"
                    onClick={handleNext}
                    disabled={pending}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex items-center gap-2 rounded-lg bg-validation px-4 py-1.5 text-caption font-semibold text-canvas hover:bg-validation/90 disabled:opacity-50"
                  >
                    {step === steps.length - 1 ? (
                      <>
                        <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                        Empezar
                      </>
                    ) : (
                      <>
                        Siguiente
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.6} />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// =====================================================================
// Pasos del tour — cada uno una pieza visual completa
// =====================================================================

function useSteps(): React.ReactNode[] {
  return [
    <Step1Listen key="s1" />,
    <Step2Detect key="s2" />,
    <Step3Insight key="s3" />,
    <Step4Calibrated key="s4" />,
    <Step5Ready key="s5" />,
  ];
}

function StepHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="space-y-2">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: easeOut }}
        className="text-caption uppercase tracking-eyebrow font-semibold text-validation"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: easeOut }}
        className="text-h2 font-semibold tracking-tight text-ink-strong"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.2, ease: easeOut }}
        className="text-body-sm text-ink-muted leading-relaxed max-w-prose"
      >
        {description}
      </motion.p>
    </header>
  );
}

// ---------- Step 1: El cerebro escucha tu práctica ----------
function Step1Listen() {
  return (
    <>
      <StepHeader
        eyebrow="Paso 1 de 5"
        title="El cerebro escucha tu práctica."
        description="Cada diagnóstico que registras, cada receta que firmas, cada outcome que marcas — son datos que el cerebro absorbe para reconocer cómo trabajas TÚ."
      />
      <div className="relative mt-2 flex h-44 items-center justify-center">
        {/* Pulsos concéntricos */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.6, opacity: 0.4 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              delay: i * 0.7,
              ease: "easeOut",
            }}
            className="absolute h-24 w-24 rounded-full border-2 border-validation"
          />
        ))}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: easeOut }}
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-validation shadow-lg"
          style={{ boxShadow: "0 0 40px rgba(10, 139, 122, 0.4)" }}
        >
          <Activity
            className="h-9 w-9 text-canvas"
            strokeWidth={2.2}
          />
        </motion.div>
      </div>
    </>
  );
}

// ---------- Step 2: Identifica patrones (heatmap auto-construyéndose) ----------
function Step2Detect() {
  // Pequeña matriz 4×4 que se "rellena" con stagger
  const cells = Array.from({ length: 16 }).map((_, i) => {
    // Cada celda con un LR distinto para mostrar variedad
    const lrs = [12.4, 0.4, 6.2, 1.1, 0.3, 8.6, 1.0, 4.2, 14.8, 2.1, 0.6, 9.1, 0.9, 5.4, 18.6, 1.4];
    return lrs[i] ?? 1;
  });

  function cellBg(lr: number): string {
    if (lr >= 0.9 && lr <= 1.1) return "var(--lg-surface-alt, #f3f1ec)";
    const logLr = lr > 1 ? Math.log2(lr) : -Math.log2(1 / lr);
    const t = Math.min(Math.abs(logLr) / 4.32, 1);
    const hue = lr > 1 ? 170 : 350;
    const sat = lr > 1 ? 55 : 60;
    const lum = Math.round(90 - t * 58);
    return `hsl(${hue} ${sat}% ${lum}%)`;
  }

  return (
    <>
      <StepHeader
        eyebrow="Paso 2 de 5"
        title="Identifica patrones en tus diagnósticos."
        description="El cerebro construye un mapa de tus casos: qué diagnósticos haces más, qué enfermedades viajan juntas en tus pacientes, dónde diverges del motor."
      />
      <div className="mt-2 flex justify-center">
        <div className="grid grid-cols-4 gap-1.5">
          {cells.map((lr, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.3 + i * 0.05,
                ease: easeOut,
              }}
              style={{ background: cellBg(lr) }}
              className="h-12 w-12 rounded-md sm:h-14 sm:w-14"
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ---------- Step 3: Insight emergiendo ----------
function Step3Insight() {
  return (
    <>
      <StepHeader
        eyebrow="Paso 3 de 5"
        title="Te muestra lo que tú no ves."
        description="¿Sabías que en tus últimos 12 casos de DM2, en 3 marcaste cetoacidosis al inicio? Eso es un patrón de posible LADA. El cerebro encuentra estas señales que se pierden entre consultas."
      />
      <div className="mt-2 flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: easeOut }}
          className="relative w-full max-w-md rounded-xl border-2 border-validation bg-validation-soft/40 p-5"
          style={{ boxShadow: "0 20px 50px -20px rgba(10, 139, 122, 0.35)" }}
        >
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.8,
              ease: easeOut,
            }}
            className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-validation"
          >
            <Sparkles
              className="h-4 w-4 text-canvas"
              strokeWidth={2.4}
            />
          </motion.div>
          <p className="text-caption uppercase tracking-eyebrow font-semibold text-validation">
            Patrón detectado
          </p>
          <p className="mt-2 text-body-sm font-semibold text-ink-strong">
            En 3 de tus últimos 8 casos de DM2 marcaste cetoacidosis al
            inicio.
          </p>
          <p className="mt-2 text-caption text-ink-muted leading-relaxed">
            Considera tipear con anti-GAD + péptido C — podría ser LADA, no
            DM2 clásico (ADA Standards 2024).
          </p>
        </motion.div>
      </div>
    </>
  );
}

// ---------- Step 4: Calibrado contra literatura clínica ----------
function Step4Calibrated() {
  return (
    <>
      <StepHeader
        eyebrow="Paso 4 de 5"
        title="Calibrado contra literatura clínica seria."
        description="Cada patrón canónico viene con razonamiento clínico explícito y referencias a fuentes primarias verificables:"
      />
      <div className="mt-2 flex flex-wrap justify-center gap-1.5 max-w-xl mx-auto">
        {TRUST_PILLARS.map((pillar, i) => (
          <motion.span
            key={pillar}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.35,
              delay: 0.25 + i * 0.04,
              ease: easeOut,
            }}
            className="rounded-full border border-line bg-surface px-3 py-1 text-caption font-medium text-ink-strong"
          >
            {pillar}
          </motion.span>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8, ease: easeOut }}
        className="mx-auto mt-3 flex max-w-md items-center gap-2 rounded-lg bg-surface-alt/60 px-4 py-2"
      >
        <GraduationCap
          className="h-4 w-4 shrink-0 text-validation"
          strokeWidth={2}
        />
        <p className="text-caption text-ink-muted">
          Lectura primaria asociada a cada patrón, accesible al expandir.
        </p>
      </motion.div>
    </>
  );
}

// ---------- Step 5: Ready ----------
function Step5Ready() {
  return (
    <>
      <StepHeader
        eyebrow="Paso 5 de 5"
        title="Empieza ahora."
        description="La pestaña Patrones tiene dos vistas: tus patrones personales (auto-detectados desde tu data) y la referencia académica curada. Las dos hablan español MX y conviven con tu flujo de scribe + diferencial."
      />
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {[
          {
            icon: TrendingUp,
            title: "Tus patrones",
            description:
              "Diagnósticos frecuentes, comorbilidad, calibración personal — todo desde tus casos.",
            delay: 0.4,
          },
          {
            icon: Network,
            title: "Referencia académica",
            description:
              "12 patrones canónicos curados de Harvard, Mayo, Hopkins, MIT, Karolinska y más.",
            delay: 0.55,
          },
        ].map(({ icon: Icon, title, description, delay }) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: easeOut }}
            className="rounded-xl border border-line bg-surface p-4"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-validation-soft">
              <Icon
                className="h-4 w-4 text-validation"
                strokeWidth={2.2}
              />
            </div>
            <p className="mt-2 text-body-sm font-semibold text-ink-strong">
              {title}
            </p>
            <p className="mt-1 text-caption text-ink-muted leading-relaxed">
              {description}
            </p>
          </motion.div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.85 }}
        className="flex items-center justify-center gap-2"
      >
        <Target
          className="h-3.5 w-3.5 text-validation"
          strokeWidth={2.4}
        />
        <p className="text-caption text-ink-muted">
          El motor orienta — tú decides.
        </p>
      </motion.div>
    </>
  );
}
