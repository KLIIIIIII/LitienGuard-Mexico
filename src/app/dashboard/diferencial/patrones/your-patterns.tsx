"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  Network,
  Target,
  GitFork,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import type { PersonalPatterns } from "@/lib/patterns/detect-personal";

interface Props {
  patterns: PersonalPatterns;
}

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

// Curva de easing top-tier para entradas
const easeOut: number[] = [0.16, 1, 0.3, 1];

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

export function YourPatterns({ patterns }: Props) {
  if (!patterns.hasEnoughData) {
    return <EmptyState total={patterns.total} />;
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* KPIs del loop */}
      <motion.section variants={fadeUp}>
        <SectionHeader
          icon={Activity}
          eyebrow="Tu loop de calidad"
          title="Cómo se cierra tu razonamiento clínico"
          description="El loop completo: caso → diagnóstico → outcome → aprendizaje. Estos números cambian solo con tu trabajo, nadie más."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={CheckCircle2}
            tone="validation"
            label="% con outcome"
            value={`${pct(patterns.loop.conOutcome, patterns.total)}%`}
            detail={`${patterns.loop.conOutcome} de ${patterns.total} casos cerrados`}
          />
          <KpiCard
            icon={GitFork}
            tone="warn"
            label="Override rate"
            value={`${pct(patterns.loop.overrides, patterns.loop.conDx)}%`}
            detail={`Te apartaste del top-1 en ${patterns.loop.overrides}`}
          />
          <KpiCard
            icon={Clock}
            tone="muted"
            label="Latencia outcome"
            value={
              patterns.loop.latenciaPromedioDias === null
                ? "—"
                : `${patterns.loop.latenciaPromedioDias} d`
            }
            detail="Días promedio del caso al outcome"
          />
          <KpiCard
            icon={AlertTriangle}
            tone={
              patterns.loop.pendientesRecordatorio > 0 ? "warn" : "muted"
            }
            label="Pendientes >7d"
            value={String(patterns.loop.pendientesRecordatorio)}
            detail="Casos con dx sin outcome marcado"
          />
        </div>
      </motion.section>

      {/* Diagnósticos frecuentes */}
      {patterns.diagnosticosFrecuentes.length > 0 && (
        <motion.section variants={fadeUp}>
          <SectionHeader
            icon={TrendingUp}
            eyebrow="Tu mapa diagnóstico"
            title="Lo que más estás viendo"
            description="Los diagnósticos que más aparecen en tus consultas — perfil clínico de tu práctica."
          />
          <div className="mt-4 lg-card space-y-2.5">
            {patterns.diagnosticosFrecuentes.map((d, idx) => {
              const max = patterns.diagnosticosFrecuentes[0]?.count ?? 1;
              const widthPct = Math.round((d.count / max) * 100);
              return (
                <motion.div
                  key={d.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.05 + idx * 0.04,
                    ease: easeOut,
                  }}
                >
                  <div className="flex items-baseline justify-between gap-3 text-body-sm">
                    <span className="text-ink-strong truncate flex-1 min-w-0">
                      <span className="text-ink-quiet tabular-nums mr-1.5">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      {d.label}
                    </span>
                    <span className="text-caption text-ink-muted tabular-nums shrink-0">
                      {d.count} {d.count === 1 ? "caso" : "casos"}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{
                        duration: 0.7,
                        delay: 0.2 + idx * 0.04,
                        ease: easeOut,
                      }}
                      className="h-full rounded-full bg-validation"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Co-ocurrencias */}
      {patterns.coOcurrencias.length > 0 && (
        <motion.section variants={fadeUp}>
          <SectionHeader
            icon={Network}
            eyebrow="Patrones de comorbilidad"
            title="Diagnósticos que viajan juntos en tus pacientes"
            description="Pares de enfermedades que aparecen en el mismo paciente — comorbilidades reales que tú estás viendo en tu consulta."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {patterns.coOcurrencias.map((c, idx) => (
              <motion.div
                key={`${c.dxA}-${c.dxB}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 0.05 + idx * 0.04,
                  ease: easeOut,
                }}
                className="rounded-xl border border-line bg-surface p-4"
              >
                <p className="text-body-sm font-semibold text-ink-strong leading-snug">
                  {c.dxA}
                  <span className="mx-2 text-ink-quiet">↔</span>
                  {c.dxB}
                </p>
                <p className="mt-1 text-caption text-ink-muted">
                  En{" "}
                  <span className="font-semibold text-validation tabular-nums">
                    {c.count}
                  </span>{" "}
                  {c.count === 1 ? "paciente" : "pacientes"} de tu práctica
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* PPV personal */}
      {patterns.ppvPersonal.length > 0 && (
        <motion.section variants={fadeUp}>
          <SectionHeader
            icon={Target}
            eyebrow="Tu calibración personal"
            title="PPV cuando el motor te puso esto como top-1"
            description="¿Qué tan seguido se confirmó cuando el motor te puso esta enfermedad como la más probable? Tu calibración personal, no la del libro."
          />
          <div className="mt-4 space-y-2.5">
            {patterns.ppvPersonal.map((p, idx) => {
              const ppvPct = Math.round(p.ppv * 100);
              const toneClasses =
                ppvPct >= 70
                  ? { text: "text-validation", bg: "bg-validation" }
                  : ppvPct >= 40
                    ? { text: "text-warn", bg: "bg-warn" }
                    : { text: "text-rose", bg: "bg-rose" };
              const denom = p.confirmados + p.refutados + p.parciales;
              return (
                <motion.div
                  key={p.disease}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: 0.05 + idx * 0.04,
                    ease: easeOut,
                  }}
                  className="lg-card"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-semibold text-ink-strong">
                        {p.label}
                      </p>
                      <p className="text-caption text-ink-soft">
                        {p.confirmados} confirmados · {p.parciales} parciales ·{" "}
                        {p.refutados} refutados · {p.total - denom} pendientes
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-h2 font-bold tabular-nums leading-none ${toneClasses.text}`}
                      >
                        {ppvPct}%
                      </p>
                      <p className="mt-1 text-caption text-ink-muted">
                        PPV personal
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ppvPct}%` }}
                      transition={{
                        duration: 0.7,
                        delay: 0.2 + idx * 0.04,
                        ease: easeOut,
                      }}
                      className={`h-full rounded-full ${toneClasses.bg}`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Override patterns */}
      {patterns.overridePatterns.length > 0 && (
        <motion.section variants={fadeUp}>
          <SectionHeader
            icon={GitFork}
            eyebrow="Cuándo te apartas del motor"
            title="Tus overrides — donde tu juicio diverge del motor"
            description="Casos donde el motor sugirió A pero tú elegiste B. Repetir el mismo override es señal: o el motor está mal calibrado para tu población, o vale la pena re-revisar."
          />
          <div className="mt-4 space-y-3">
            {patterns.overridePatterns.map((o, idx) => (
              <motion.div
                key={`${o.motorPropuso}-${o.medicoEligio}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: 0.05 + idx * 0.05,
                  ease: easeOut,
                }}
                className="rounded-xl border border-warn-soft bg-warn-soft/20 p-4"
              >
                <div className="flex items-center gap-3 text-body-sm">
                  <span className="rounded bg-surface px-2 py-0.5 text-caption text-ink-muted line-through">
                    {o.motorPropuso}
                  </span>
                  <span className="text-warn font-semibold">→</span>
                  <span className="font-semibold text-ink-strong">
                    {o.medicoEligio}
                  </span>
                  <span className="ml-auto shrink-0 rounded-full bg-warn-soft px-2 py-0.5 text-caption font-semibold text-warn tabular-nums">
                    {o.count}×
                  </span>
                </div>
                {o.razones.length > 0 && (
                  <ul className="mt-2 space-y-1 text-caption text-ink-muted">
                    {o.razones.map((r, ri) => (
                      <li key={ri} className="leading-relaxed">
                        <span className="text-ink-quiet">›</span> {r}
                        {r.length >= 140 && "…"}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}

function EmptyState({ total }: { total: number }) {
  const faltan = Math.max(5 - total, 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOut }}
      className="rounded-xl border-2 border-dashed border-line bg-surface-alt/40 p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.6,
          delay: 0.15,
          ease: easeOut,
        }}
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-validation-soft"
      >
        <Network className="h-6 w-6 text-validation" strokeWidth={2} />
      </motion.div>
      <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
        Aún no hay suficientes patrones para mostrar
      </h3>
      <p className="mt-2 max-w-md mx-auto text-body-sm text-ink-muted leading-relaxed">
        Llevas {total} {total === 1 ? "caso" : "casos"} guardados. Necesitamos al
        menos 5 para empezar a ver patrones emergentes en tu práctica. Mientras
        tanto, mira la pestaña de <strong>Referencia académica</strong> con
        patrones canónicos curados.
      </p>
      {faltan > 0 && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-validation-soft px-4 py-1.5 text-caption font-semibold text-validation">
          Te faltan {faltan} {faltan === 1 ? "caso" : "casos"} para activar
          esta vista
        </div>
      )}
    </motion.div>
  );
}

function SectionHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: typeof Activity;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-validation-soft">
          <Icon className="h-3.5 w-3.5 text-validation" strokeWidth={2.4} />
        </div>
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
          {eyebrow}
        </p>
      </div>
      <h2 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
        {title}
      </h2>
      <p className="mt-1 max-w-prose text-caption text-ink-muted leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  tone,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  tone: "validation" | "warn" | "rose" | "muted";
  label: string;
  value: string;
  detail: string;
}) {
  const toneIcon = {
    validation: "text-validation",
    warn: "text-warn",
    rose: "text-rose",
    muted: "text-ink-quiet",
  } as const;
  return (
    <div className="lg-card">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${toneIcon[tone]}`} strokeWidth={2} />
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
          {label}
        </p>
      </div>
      <p className="mt-2 text-h2 font-bold tabular-nums text-ink-strong">
        {value}
      </p>
      <p className="text-caption text-ink-muted">{detail}</p>
    </div>
  );
}
