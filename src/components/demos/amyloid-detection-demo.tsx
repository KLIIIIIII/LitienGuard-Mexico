"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useMotionValue,
  animate,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Activity,
  Heart,
  FlaskConical,
  Dna,
  Users,
  Brain,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Play,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Cascada de probabilidad bayesiana para detección de amiloidosis
 * cardíaca por transtiretina (ATTR-CM).
 *
 * Visualización: dos barras horizontales (HFpEF en rose, ATTR-CM en
 * validation green) cuyos anchos se actualizan secuencialmente conforme
 * cada una de las 6 señales clínicas se incorpora al razonamiento.
 *
 * Probabilidades calibradas con likelihood ratios reportados (todas las
 * referencias revisadas al cierre 2025):
 *   - Mayo AI-ECG · Grogan et al · Mayo Clin Proc 2021 · AUC 0.91
 *   - ATTR-ACT · Maurer et al · NEJM 2018 · tafamidis HR 0.70
 *   - HELIOS-B · Fontana et al · Lancet 2024 · vutrisiran HR 0.72
 *   - ATTRibute-CM · Gillmore et al · NEJM 2024 · acoramidis HR 0.50
 *   - ESC HF 2023 Focused Update · McDonagh et al · Eur Heart J 2023
 *   - AHA/ACC/HFSA 2022 HF Guideline · Heidenreich et al · JAHA 2022
 *
 * Las tiles son navegables: click para saltar a un paso; el autoplay
 * se cancela en la primera interacción del usuario.
 */

interface Signal {
  short: string;
  full: string;
  icon: LucideIcon;
  hfpefAfter: number;
  attrAfter: number;
}

const SIGNALS: Signal[] = [
  {
    short: "ECG bajo voltaje",
    full: "QRS <5 mm en miembros con LVH por eco",
    icon: Activity,
    hfpefAfter: 52,
    attrAfter: 28,
  },
  {
    short: "Apical sparing",
    full: "Strain longitudinal apical conservado",
    icon: Heart,
    hfpefAfter: 30,
    attrAfter: 55,
  },
  {
    short: "NT-proBNP discordante",
    full: "1240 pg/mL con NYHA II",
    icon: FlaskConical,
    hfpefAfter: 22,
    attrAfter: 64,
  },
  {
    short: "FLC κ/λ normal",
    full: "Excluye amiloidosis AL",
    icon: Dna,
    hfpefAfter: 18,
    attrAfter: 72,
  },
  {
    short: "Hx familiar V122I",
    full: "Neuropatía periférica idiopática",
    icon: Users,
    hfpefAfter: 10,
    attrAfter: 81,
  },
  {
    short: "CTS bilateral 2017",
    full: "Túnel del carpo · precede 5–10 años",
    icon: Brain,
    hfpefAfter: 4,
    attrAfter: 87,
  },
];

const INITIAL = { hfpef: 78, attr: 5 };
const STEP_MS = 700;
const PAUSE_MS = 250;

function probsAtStep(step: number): { hfpef: number; attr: number } {
  if (step <= 0) return INITIAL;
  const s = SIGNALS[Math.min(step - 1, SIGNALS.length - 1)];
  return { hfpef: s.hfpefAfter, attr: s.attrAfter };
}

export function AmyloidDetectionDemo() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [activeStep, setActiveStep] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const hfpefMV = useMotionValue(INITIAL.hfpef);
  const attrMV = useMotionValue(INITIAL.attr);
  const hfpefDisplay = useTransform(hfpefMV, (v) => Math.round(v));
  const attrDisplay = useTransform(attrMV, (v) => Math.round(v));

  const animateTo = useCallback(
    (step: number) => {
      const { hfpef, attr } = probsAtStep(step);
      animate(hfpefMV, hfpef, {
        duration: STEP_MS / 1000,
        ease: [0.16, 1, 0.3, 1],
      });
      animate(attrMV, attr, {
        duration: STEP_MS / 1000,
        ease: [0.16, 1, 0.3, 1],
      });
    },
    [hfpefMV, attrMV],
  );

  const cancelAutoplay = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const startAutoplay = useCallback(() => {
    cancelAutoplay();
    if (reduce) {
      setActiveStep(SIGNALS.length);
      animateTo(SIGNALS.length);
      return;
    }
    SIGNALS.forEach((_, i) => {
      const delay = (i + 1) * (STEP_MS + PAUSE_MS);
      const t = setTimeout(() => {
        if (manualMode) return;
        setActiveStep(i + 1);
        animateTo(i + 1);
      }, delay);
      timeoutsRef.current.push(t);
    });
  }, [cancelAutoplay, reduce, manualMode, animateTo]);

  useEffect(() => {
    if (!inView || manualMode) return;
    startAutoplay();
    return cancelAutoplay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  const handleJump = useCallback(
    (step: number) => {
      const clamped = Math.max(0, Math.min(SIGNALS.length, step));
      setManualMode(true);
      cancelAutoplay();
      setActiveStep(clamped);
      animateTo(clamped);
    },
    [animateTo, cancelAutoplay],
  );

  const handleReset = useCallback(() => {
    setManualMode(true);
    cancelAutoplay();
    setActiveStep(0);
    animateTo(0);
  }, [animateTo, cancelAutoplay]);

  const handleReplay = useCallback(() => {
    setManualMode(false);
    setActiveStep(0);
    animateTo(0);
    // re-trigger autoplay
    setTimeout(() => {
      if (!reduce) {
        SIGNALS.forEach((_, i) => {
          const delay = (i + 1) * (STEP_MS + PAUSE_MS);
          const t = setTimeout(() => {
            setActiveStep(i + 1);
            animateTo(i + 1);
          }, delay);
          timeoutsRef.current.push(t);
        });
      } else {
        setActiveStep(SIGNALS.length);
        animateTo(SIGNALS.length);
      }
    }, 250);
  }, [animateTo, reduce]);

  const dominant: "hfpef" | "attr" =
    activeStep === 0
      ? "hfpef"
      : SIGNALS[activeStep - 1].attrAfter > SIGNALS[activeStep - 1].hfpefAfter
        ? "attr"
        : "hfpef";

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-line bg-surface shadow-soft overflow-hidden"
    >
      <div className="border-b border-line bg-surface-alt px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-caption font-semibold uppercase tracking-eyebrow text-validation">
              Convergencia diagnóstica multi-señal
            </p>
            <p className="mt-1 text-body-sm font-medium text-ink-strong">
              Hombre 71 a · diagnóstico previo «ICC-FEVI preservada» · 3 años seguimiento
            </p>
          </div>
          <DominantBadge dominant={dominant} step={activeStep} />
        </div>
      </div>

      <div className="px-6 pt-7 pb-5 space-y-5">
        <ProbabilityBar
          label="HFpEF (hipótesis inicial)"
          tone="rose"
          motionValue={hfpefMV}
          displayValue={hfpefDisplay}
          isDominant={dominant === "hfpef"}
        />
        <ProbabilityBar
          label="ATTR-CM (transtiretina cardíaca)"
          tone="validation"
          motionValue={attrMV}
          displayValue={attrDisplay}
          isDominant={dominant === "attr"}
        />
      </div>

      <div className="border-t border-line bg-surface-alt/60 px-6 py-5">
        {/* Controls row */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
            6 señales · click para navegar
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleJump(activeStep - 1)}
              disabled={activeStep === 0}
              aria-label="Paso anterior"
              className="rounded-md border border-line bg-surface p-1.5 text-ink-muted hover:bg-surface-alt hover:text-ink-strong disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
            <span className="text-caption text-ink-soft tabular-nums px-2 min-w-[60px] text-center">
              {activeStep}/{SIGNALS.length}
            </span>
            <button
              type="button"
              onClick={() => handleJump(activeStep + 1)}
              disabled={activeStep === SIGNALS.length}
              aria-label="Paso siguiente"
              className="rounded-md border border-line bg-surface p-1.5 text-ink-muted hover:bg-surface-alt hover:text-ink-strong disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={
                activeStep === SIGNALS.length || activeStep === 0
                  ? handleReplay
                  : handleReset
              }
              aria-label={activeStep === SIGNALS.length ? "Reproducir de nuevo" : "Reiniciar"}
              title={activeStep === SIGNALS.length ? "Reproducir" : "Reiniciar"}
              className="ml-1 rounded-md border border-line bg-surface p-1.5 text-ink-muted hover:bg-validation-soft hover:text-validation"
            >
              {activeStep === SIGNALS.length || activeStep === 0 ? (
                <Play className="h-3.5 w-3.5" strokeWidth={2.2} />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.2} />
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SIGNALS.map((s, i) => (
            <SignalTile
              key={s.short}
              signal={s}
              index={i}
              isActive={activeStep > i}
              isCurrent={activeStep === i + 1}
              reduce={!!reduce}
              onClick={() => handleJump(i + 1)}
            />
          ))}
        </div>
      </div>

      <FinalCard show={activeStep === SIGNALS.length} reduce={!!reduce} />
    </div>
  );
}

function ProbabilityBar({
  label,
  tone,
  motionValue,
  displayValue,
  isDominant,
}: {
  label: string;
  tone: "rose" | "validation";
  motionValue: MotionValue<number>;
  displayValue: MotionValue<number>;
  isDominant: boolean;
}) {
  const barColor = tone === "rose" ? "#B8847C" : "#4A6B5B";
  const bgColor = tone === "rose" ? "#FBEAE5" : "#E5EDE8";
  const labelColor = tone === "rose" ? "text-rose" : "text-validation";
  const width = useTransform(motionValue, (v) => `${v}%`);

  return (
    <div
      className={`transition-opacity duration-500 ${
        isDominant ? "opacity-100" : "opacity-70"
      }`}
    >
      <div className="flex items-baseline justify-between mb-1.5">
        <p className={`text-body-sm font-semibold ${labelColor}`}>{label}</p>
        <div className={`text-h2 font-bold tabular-nums ${labelColor}`}>
          <motion.span>{displayValue}</motion.span>
          <span>%</span>
        </div>
      </div>
      <div
        className="relative h-5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: bgColor }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundColor: barColor,
            width,
          }}
        />
      </div>
    </div>
  );
}

function SignalTile({
  signal,
  index,
  isActive,
  isCurrent,
  reduce,
  onClick,
}: {
  signal: Signal;
  index: number;
  isActive: boolean;
  isCurrent: boolean;
  reduce: boolean;
  onClick: () => void;
}) {
  const Icon = signal.icon;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      animate={
        reduce
          ? undefined
          : {
              scale: isCurrent ? 1.03 : 1,
              opacity: isActive ? 1 : 0.4,
            }
      }
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`Saltar al paso ${index + 1}: ${signal.short}`}
      className={`relative text-left rounded-lg border p-3 cursor-pointer transition-colors hover:border-validation hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-validation focus:ring-offset-1 ${
        isCurrent
          ? "border-validation bg-validation-soft/40"
          : isActive
            ? "border-validation bg-surface"
            : "border-line bg-surface"
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
            isActive
              ? "bg-validation-soft text-validation"
              : "bg-surface-alt text-ink-quiet"
          }`}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-caption font-semibold leading-tight ${
              isActive ? "text-ink-strong" : "text-ink-soft"
            }`}
          >
            {signal.short}
          </p>
          <p
            className={`mt-0.5 text-[0.65rem] leading-snug ${
              isActive ? "text-ink-muted" : "text-ink-quiet"
            }`}
          >
            {signal.full}
          </p>
        </div>
      </div>
      {isCurrent && !reduce && (
        <motion.span
          aria-hidden
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-validation"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.4, 1] }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      )}
    </motion.button>
  );
}

function DominantBadge({
  dominant,
  step,
}: {
  dominant: "hfpef" | "attr";
  step: number;
}) {
  if (step === 0) {
    return (
      <span className="hidden sm:inline-flex items-center rounded-full bg-rose-soft px-3 py-1 text-caption font-semibold text-rose whitespace-nowrap">
        Inicial: HFpEF
      </span>
    );
  }
  const isAttr = dominant === "attr";
  return (
    <motion.span
      key={dominant}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-semibold whitespace-nowrap ${
        isAttr ? "bg-validation-soft text-validation" : "bg-rose-soft text-rose"
      }`}
    >
      {isAttr && <Sparkles className="h-3 w-3" strokeWidth={2.4} />}
      Líder: {isAttr ? "ATTR-CM" : "HFpEF"}
    </motion.span>
  );
}

function FinalCard({ show, reduce }: { show: boolean; reduce: boolean }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, height: 0 }}
      animate={
        reduce
          ? undefined
          : show
            ? { opacity: 1, height: "auto" }
            : { opacity: 0, height: 0 }
      }
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden bg-validation text-surface"
    >
      <div className="px-6 py-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-caption font-semibold uppercase tracking-eyebrow opacity-80">
              Recomendación · primera consulta
            </p>
            <p className="mt-1 text-body-sm leading-relaxed">
              Solicitar{" "}
              <strong>gammagrafía con pirofosfato de tecnecio (PYP)</strong>.
              Si positiva → discutir estabilizadores de transtiretina
              disponibles en 2025.
            </p>
            <ul className="mt-2 space-y-0.5 text-caption italic opacity-90">
              <li>
                Tafamidis · ATTR-ACT · NEJM 2018 · HR 0.70 mortalidad
              </li>
              <li>
                Acoramidis · ATTRibute-CM · NEJM 2024 · HR 0.50 eventos CV
              </li>
              <li>
                Vutrisiran · HELIOS-B · Lancet 2024 · HR 0.72 mortalidad
              </li>
            </ul>
          </div>
          <div className="sm:text-right">
            <div className="inline-flex items-center gap-2 bg-surface/15 rounded-full px-3 py-1.5">
              <span className="text-caption opacity-90">Retraso esperado:</span>
              <span className="text-body-sm font-bold line-through opacity-70">
                4 años
              </span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
              <span className="text-body-sm font-bold">1ª cita</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
