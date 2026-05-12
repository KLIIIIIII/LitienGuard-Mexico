"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  Heart,
  FlaskConical,
  Dna,
  Users,
  Sparkles,
  Brain,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Amiloidosis cardíaca por transtiretina (ATTR-CM): una de las
 * enfermedades más subdiagnosticadas en cardiología. Retraso promedio
 * 4 años desde primeros síntomas hasta diagnóstico (Lousada I et al,
 * Adv Ther 2015).
 *
 * Cada señal aislada es no-específica. La combinación de las 6 es
 * altamente sugestiva. El cerebro detecta el patrón en la primera
 * consulta porque correlaciona datos de orígenes distintos que un
 * médico individual rara vez tiene a la vista al mismo tiempo.
 *
 * Citas verbatim del cerebro:
 *   - Mayo Clinic AI-ECG · Lancet Digit Health 2021 · AUC 0.91
 *   - ATTR-ACT · NEJM 2018 · tafamidis HR 0.70 mortalidad
 *   - ACC/AHA 2023 Expert Consensus Decision Pathway
 *   - ESC 2021 Position Paper cardiac amyloidosis
 */

interface Signal {
  icon: LucideIcon;
  source: string;
  finding: string;
  detail: string;
  alone: string;
}

const SIGNALS: Signal[] = [
  {
    icon: Activity,
    source: "ECG",
    finding: "Bajo voltaje en derivaciones de miembros",
    detail: "QRS <5 mm + criterios eléctricos para HVI ausentes pese a masa VI aumentada por eco",
    alone: "No específico",
  },
  {
    icon: Heart,
    source: "Ecocardiograma",
    finding: "Apical sparing pattern",
    detail: "Strain longitudinal apical conservado, basal severamente reducido — patrón \"cherry-on-top\"",
    alone: "Sensibilidad 93%",
  },
  {
    icon: FlaskConical,
    source: "Biomarcadores",
    finding: "NT-proBNP desproporcionado",
    detail: "1240 pg/mL con NYHA II — discrepancia clínico-laboratorial",
    alone: "No específico",
  },
  {
    icon: Dna,
    source: "Cadenas ligeras libres",
    finding: "Ratio κ/λ normal",
    detail: "Descarta amiloidosis AL — orienta diagnóstico diferencial hacia ATTR",
    alone: "Excluye AL",
  },
  {
    icon: Users,
    source: "Historia familiar",
    finding: "Neuropatía periférica idiopática",
    detail: "Variante V122I prevalente en población mexicana (≈3% en algunos subgrupos)",
    alone: "Sospecha hereditaria",
  },
  {
    icon: Brain,
    source: "Anamnesis dirigida",
    finding: "Síndrome del túnel del carpo bilateral",
    detail: "Cirugía CTS bilateral en 2017 — precede a fase cardíaca hasta 5–10 años",
    alone: "Red flag retrospectivo",
  },
];

export function AmyloidDetectionDemo() {
  const reduce = useReducedMotion();

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-soft overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-line bg-surface-alt px-6 py-5">
        <div>
          <p className="text-caption font-semibold uppercase tracking-eyebrow text-validation">
            Detección compleja · enfermedad subdiagnosticada
          </p>
          <h3 className="mt-1 text-h2 font-semibold tracking-tight text-ink-strong">
            Amiloidosis cardíaca por transtiretina
          </h3>
          <p className="mt-1.5 text-body-sm text-ink-muted leading-relaxed max-w-prose">
            Hombre 71 años, diagnóstico previo de ICC-FEVI preservada hace
            3 años. Antecedente de cirugía bilateral por síndrome del túnel
            del carpo en 2017. Familiar con neuropatía periférica
            idiopática.
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end shrink-0">
          <span className="inline-flex items-center rounded-full bg-rose-soft px-2.5 py-0.5 text-caption font-semibold text-rose">
            4 años de retraso promedio
          </span>
          <span className="mt-1 text-caption text-ink-soft">
            sin detección multi-señal
          </span>
        </div>
      </div>

      <div className="px-6 py-6">
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
          Convergencia de 6 señales independientes
        </p>
        <p className="mt-1 text-body-sm text-ink-muted leading-relaxed max-w-prose">
          Cada hallazgo aislado es no-específico — por eso esta enfermedad
          se pierde. El cerebro correlaciona orígenes distintos en una sola
          lectura.
        </p>

        {/* Signals grid + convergence */}
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
          {/* Left column: signals 1-3 */}
          <ul className="space-y-3">
            {SIGNALS.slice(0, 3).map((s, i) => (
              <SignalCard key={s.source} signal={s} index={i} reduce={reduce} />
            ))}
          </ul>

          {/* Center: convergence node */}
          <div className="hidden lg:flex flex-col items-center justify-center px-2">
            <ConvergenceLine reduce={reduce} />
            <ConvergenceNode reduce={reduce} />
            <ConvergenceLine reduce={reduce} reverse />
          </div>

          {/* Right column: signals 4-6 */}
          <ul className="space-y-3">
            {SIGNALS.slice(3, 6).map((s, i) => (
              <SignalCard
                key={s.source}
                signal={s}
                index={i + 3}
                reduce={reduce}
                mirrored
              />
            ))}
          </ul>
        </div>

        {/* Mobile-only synthesis card (replaces center column) */}
        <div className="lg:hidden mt-4">
          <ConvergenceNodeMobile reduce={reduce} />
        </div>

        {/* Synthesis result */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: "-80px" }}
          className="mt-8 rounded-xl border-2 border-validation bg-validation-soft/40 p-5"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-validation text-surface">
              <Sparkles className="h-5 w-5" strokeWidth={2.2} />
            </span>
            <div className="flex-1">
              <p className="text-caption font-semibold uppercase tracking-eyebrow text-validation">
                Síntesis del cerebro · primera consulta
              </p>
              <p className="mt-1 text-body-sm text-ink-strong">
                <strong>Probabilidad posterior de ATTR-CM: 87%.</strong>{" "}
                Recomienda PYP scan (no invasivo) para confirmar; si positivo,
                evaluar inicio de tafamidis 61 mg/día.
              </p>
              <blockquote className="mt-3 border-l-2 border-validation pl-3 text-caption italic text-ink-muted leading-relaxed">
                «Tafamidis reduced all-cause mortality and cardiovascular-related
                hospitalizations in patients with transthyretin amyloid
                cardiomyopathy.»
                <span className="block mt-1 not-italic text-ink-soft">
                  Maurer et al., NEJM 2018 · ATTR-ACT trial · HR 0.70 mortalidad
                  · NNT 7.5 a 30 meses
                </span>
              </blockquote>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3 border-t border-validation/30 pt-4">
            <Stat label="Sin LitienGuard" value="4 años" detail="retraso diagnóstico promedio" tone="rose" />
            <Stat label="Con LitienGuard" value="1ª consulta" detail="detección por correlación" tone="validation" />
            <Stat label="Impacto terapéutico" value="HR 0.70" detail="mortalidad si tafamidis temprano" tone="accent" />
          </div>
        </motion.div>

        <p className="mt-5 text-caption text-ink-soft leading-relaxed">
          Caso ilustrativo basado en presentación típica de ATTR-CM en
          México. Probabilidad calculada por consenso de Mayo Clinic
          AI-ECG (AUC 0.91, Lancet Digit Health 2021) más criterios ESC
          2021 y ACC/AHA 2023. El sistema no diagnostica — orienta y
          documenta la cadena de evidencia.
        </p>
      </div>
    </div>
  );
}

function SignalCard({
  signal,
  index,
  reduce,
  mirrored = false,
}: {
  signal: Signal;
  index: number;
  reduce: boolean | null;
  mirrored?: boolean;
}) {
  const Icon = signal.icon;
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, x: mirrored ? 20 : -20 }}
      whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
      transition={{
        delay: 0.1 + index * 0.12,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      viewport={{ once: true, margin: "-80px" }}
      className="rounded-lg border border-line bg-surface p-3.5"
    >
      <div className="flex items-start gap-3">
        <motion.span
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          whileInView={reduce ? undefined : { scale: 1, opacity: 1 }}
          transition={{
            delay: 0.2 + index * 0.12,
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
          }}
          viewport={{ once: true, margin: "-80px" }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </motion.span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
              {signal.source}
            </p>
            <span className="text-[0.62rem] text-ink-quiet">{signal.alone}</span>
          </div>
          <p className="mt-1 text-body-sm font-semibold text-ink-strong leading-snug">
            {signal.finding}
          </p>
          <p className="mt-1 text-caption text-ink-muted leading-relaxed">
            {signal.detail}
          </p>
        </div>
      </div>
    </motion.li>
  );
}

function ConvergenceLine({
  reverse = false,
  reduce,
}: {
  reverse?: boolean;
  reduce: boolean | null;
}) {
  return (
    <svg
      width="40"
      height="120"
      viewBox="0 0 40 120"
      fill="none"
      className="my-2"
      aria-hidden
    >
      {[0, 1, 2].map((i) => {
        const y1 = reverse ? 8 : 8 + i * 36;
        const x1 = reverse ? 4 : 4;
        const x2 = 36;
        const y2 = 60;
        return (
          <motion.line
            key={i}
            x1={x1}
            y1={reverse ? 8 + i * 36 : y1}
            x2={x2}
            y2={y2}
            stroke="#274B39"
            strokeWidth="1"
            strokeOpacity="0.35"
            strokeDasharray="4 3"
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            whileInView={reduce ? undefined : { pathLength: 1, opacity: 1 }}
            transition={{
              delay: 0.4 + i * 0.12,
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1],
            }}
            viewport={{ once: true, margin: "-80px" }}
          />
        );
      })}
    </svg>
  );
}

function ConvergenceNode({ reduce }: { reduce: boolean | null }) {
  return (
    <motion.div
      initial={reduce ? false : { scale: 0.5, opacity: 0 }}
      whileInView={
        reduce
          ? undefined
          : { scale: [0.5, 1.06, 1], opacity: [0, 1, 1] }
      }
      transition={{
        delay: 1.0,
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1],
        times: [0, 0.6, 1],
      }}
      viewport={{ once: true, margin: "-80px" }}
      className="relative flex h-20 w-20 items-center justify-center rounded-full bg-validation shadow-deep"
    >
      <Sparkles className="h-7 w-7 text-surface" strokeWidth={2.2} />
      {!reduce && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-validation"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            delay: 1.3,
            duration: 1.6,
            repeat: 1,
            ease: "easeOut",
          }}
        />
      )}
    </motion.div>
  );
}

function ConvergenceNodeMobile({ reduce }: { reduce: boolean | null }) {
  return (
    <motion.div
      initial={reduce ? false : { scale: 0.7, opacity: 0 }}
      whileInView={reduce ? undefined : { scale: 1, opacity: 1 }}
      transition={{
        delay: 0.9,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      }}
      viewport={{ once: true, margin: "-80px" }}
      className="flex items-center gap-3 rounded-lg border border-validation bg-validation-soft/60 px-4 py-3"
    >
      <ChevronRight
        className="h-4 w-4 text-validation rotate-90"
        strokeWidth={2.4}
      />
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-validation text-surface">
        <Sparkles className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <p className="text-body-sm font-semibold text-validation">
        Cerebro correlaciona las 6 señales
      </p>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "rose" | "validation" | "accent";
}) {
  const toneCls =
    tone === "rose"
      ? "text-rose"
      : tone === "validation"
        ? "text-validation"
        : "text-accent";
  return (
    <div className="rounded-lg bg-surface p-3 border border-line">
      <p className="text-[0.62rem] uppercase tracking-eyebrow text-ink-soft">
        {label}
      </p>
      <p className={`mt-1 text-h2 font-bold leading-none ${toneCls}`}>
        {value}
      </p>
      <p className="mt-1 text-caption text-ink-muted leading-tight">
        {detail}
      </p>
    </div>
  );
}
