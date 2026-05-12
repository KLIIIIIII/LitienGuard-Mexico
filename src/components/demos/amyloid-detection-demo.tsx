"use client";

import { useEffect, useRef, useState } from "react";
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
 * El crossover (cuando ATTR-CM supera a HFpEF) es el momento dramático
 * visual. Probabilidades calibradas con likelihood ratios reportados:
 *   - Mayo Clinic AI-ECG · Lancet Digit Health 2021 · AUC 0.91
 *   - ESC 2021 Position Paper on cardiac amyloidosis
 *   - ACC/AHA 2023 Expert Consensus Decision Pathway
 *   - ATTR-ACT · NEJM 2018 · tafamidis HR 0.70
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

export function AmyloidDetectionDemo() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [activeStep, setActiveStep] = useState(0);

  const hfpefMV = useMotionValue(INITIAL.hfpef);
  const attrMV = useMotionValue(INITIAL.attr);
  const hfpefDisplay = useTransform(hfpefMV, (v) => Math.round(v));
  const attrDisplay = useTransform(attrMV, (v) => Math.round(v));

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      const last = SIGNALS[SIGNALS.length - 1];
      hfpefMV.set(last.hfpefAfter);
      attrMV.set(last.attrAfter);
      setActiveStep(SIGNALS.length);
      return;
    }

    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    SIGNALS.forEach((s, i) => {
      const delay = (i + 1) * (STEP_MS + PAUSE_MS);
      const t = setTimeout(() => {
        if (cancelled) return;
        setActiveStep(i + 1);
        animate(hfpefMV, s.hfpefAfter, {
          duration: STEP_MS / 1000,
          ease: [0.16, 1, 0.3, 1],
        });
        animate(attrMV, s.attrAfter, {
          duration: STEP_MS / 1000,
          ease: [0.16, 1, 0.3, 1],
        });
      }, delay);
      timeouts.push(t);
    });

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [inView, reduce, hfpefMV, attrMV]);

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
        <div className="flex items-center justify-between mb-4">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
            6 señales · ninguna específica por sí sola
          </p>
          <p className="text-caption text-ink-soft tabular-nums">
            paso {activeStep}/{SIGNALS.length}
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SIGNALS.map((s, i) => (
            <SignalTile
              key={s.short}
              signal={s}
              isActive={activeStep > i}
              isCurrent={activeStep === i + 1}
              reduce={!!reduce}
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
  isActive,
  isCurrent,
  reduce,
}: {
  signal: Signal;
  isActive: boolean;
  isCurrent: boolean;
  reduce: boolean;
}) {
  const Icon = signal.icon;
  return (
    <motion.div
      animate={
        reduce
          ? undefined
          : {
              scale: isCurrent ? 1.03 : 1,
              opacity: isActive ? 1 : 0.35,
            }
      }
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-lg border p-3 transition-colors ${
        isActive ? "border-validation bg-surface" : "border-line bg-surface"
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
    </motion.div>
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
              Si positiva → iniciar <strong>tafamidis 61 mg/día</strong>.
            </p>
            <p className="mt-2 text-caption italic opacity-90">
              ATTR-ACT · NEJM 2018 · HR 0.70 mortalidad · NNT 7.5 a 30 meses
            </p>
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
