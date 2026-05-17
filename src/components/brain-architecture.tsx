"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import {
  Mic,
  Search,
  Network,
  FileText,
  ArrowRight,
  Quote,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Eyebrow } from "@/components/eyebrow";
import { formatNumberMX } from "@/lib/utils";

/* ============================================================
   Brain Architecture
   Diagrama de 4 capas: Input → Retrieval Híbrido → Cerebro
   Bayesiano → Output con cita verbatim.
   Estilo: Mayo Clinic Platform / Cleveland Clinic AI.
   ============================================================ */

const EASE = [0.16, 1, 0.3, 1] as const;

function CountUp({
  value,
  suffix = "",
  prefix = "",
  duration = 1.6,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView) return;
    const c = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => c.stop();
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {formatNumberMX(Math.round(display))}
      {suffix}
    </span>
  );
}

/* ---------- Capa 01: INPUT ---------- */
function LayerInput() {
  const finds = ["dolor opresivo", "diaforesis", "TA 88/52", "67 a / mujer"];
  return (
    <div className="space-y-3.5">
      {/* Scribe header + waveform */}
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-alt px-2.5 py-1.5">
        <Mic className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
        <p className="font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-ink-muted">
          Scribe · es-MX
        </p>
        <div className="ml-auto flex items-end gap-[2px]">
          {[5, 8, 12, 7, 10, 6, 9, 4].map((h, i) => (
            <motion.span
              key={i}
              className="block w-[2px] rounded-sm bg-validation"
              initial={{ scaleY: 0.2 }}
              animate={{ scaleY: [0.2, 1, 0.4, 1, 0.3] }}
              transition={{
                duration: 1.4,
                delay: i * 0.08,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
              style={{ height: h, transformOrigin: "bottom" }}
            />
          ))}
        </div>
      </div>

      {/* Transcript */}
      <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
        <p className="text-[11px] leading-relaxed text-ink-strong">
          <span className="text-ink-quiet">› </span>
          Mujer 67 a, dolor torácico{" "}
          <mark className="rounded bg-warn-soft px-0.5 text-ink-strong">
            opresivo
          </mark>{" "}
          irradiado a mandíbula,{" "}
          <mark className="rounded bg-warn-soft px-0.5 text-ink-strong">
            diaforesis
          </mark>
          , TA{" "}
          <mark className="rounded bg-rose-soft px-0.5 text-ink-strong">
            88/52
          </mark>
          …
        </p>
      </div>

      {/* Findings extraídos */}
      <div>
        <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-ink-soft">
          Findings estructurados
        </p>
        <div className="flex flex-wrap gap-1">
          {finds.map((f, i) => (
            <motion.span
              key={f}
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
              className="rounded-full border border-validation-soft bg-validation-soft px-2 py-0.5 font-mono text-[10px] font-medium text-validation"
            >
              {f}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Capa 02: RETRIEVAL HÍBRIDO ---------- */
function LayerRetrieval() {
  const bm25 = ["STEMI anterior", "Killip IV", "Tn ↑↑"];
  const vec = ["IAM con shock", "Sd. coronario", "Choque cardiogénico"];

  return (
    <div className="space-y-3">
      {/* Dual lanes */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-line bg-surface-alt px-2 py-2">
          <p className="mb-1.5 flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-ink-soft">
            <span>BM25</span>
            <span className="text-ink-quiet">keyword</span>
          </p>
          <ul className="space-y-1">
            {bm25.map((r, i) => (
              <motion.li
                key={r}
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                className="flex items-center gap-1.5 font-mono text-[10px] text-ink-strong"
              >
                <span className="text-ink-quiet">{(i + 1).toString().padStart(2, "0")}</span>
                <span className="truncate">{r}</span>
              </motion.li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-line bg-surface-alt px-2 py-2">
          <p className="mb-1.5 flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-ink-soft">
            <span>Vector</span>
            <span className="text-ink-quiet">cosine</span>
          </p>
          <ul className="space-y-1">
            {vec.map((r, i) => (
              <motion.li
                key={r}
                initial={{ opacity: 0, x: 6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                className="flex items-center gap-1.5 font-mono text-[10px] text-ink-strong"
              >
                <span className="text-ink-quiet">{(i + 1).toString().padStart(2, "0")}</span>
                <span className="truncate">{r}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* Merge → RRF */}
      <div className="relative">
        {/* connector lines */}
        <svg
          viewBox="0 0 100 14"
          preserveAspectRatio="none"
          className="absolute inset-x-0 -top-1 h-3 w-full"
          aria-hidden
        >
          <motion.path
            d="M 18 0 Q 50 7 50 14"
            stroke="rgb(var(--accent))"
            strokeWidth="0.6"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
          />
          <motion.path
            d="M 82 0 Q 50 7 50 14"
            stroke="rgb(var(--accent))"
            strokeWidth="0.6"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: 0.55, duration: 0.7, ease: EASE }}
          />
        </svg>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="mt-3 rounded-lg border border-accent-soft bg-accent-soft/60 px-2.5 py-2"
        >
          <p className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-accent">
              RRF · fusión
            </span>
            <span className="font-mono text-[10px] text-ink-muted">k = 60</span>
          </p>
          <p className="font-mono text-[11px] font-medium text-ink-strong">
            01 · IAM con elevación ST anterior
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- Capa 03: CEREBRO BAYESIANO ---------- */
function LayerBrain() {
  // 4 findings → 3 dx with posterior bars
  const dx = [
    { name: "IAM anterior", post: 87, tone: "rose" as const },
    { name: "TEP masivo", post: 7, tone: "warn" as const },
    { name: "Disección Ao", post: 4, tone: "muted" as const },
  ];

  return (
    <div className="space-y-3">
      {/* Graph */}
      <div className="rounded-lg border border-line bg-surface-alt px-2 py-2.5">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-ink-soft">
          Inferencia · log-odds
        </p>
        <svg viewBox="0 0 200 70" className="w-full" aria-hidden>
          {/* Findings row (top) */}
          {[20, 70, 130, 180].map((x, i) => (
            <g key={`f-${i}`}>
              <motion.circle
                cx={x}
                cy={10}
                r={3}
                fill="rgb(var(--validation))"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.3 }}
              />
            </g>
          ))}
          {/* Dx row (bottom) */}
          {[40, 100, 160].map((x, i) => (
            <motion.circle
              key={`d-${i}`}
              cx={x}
              cy={58}
              r={4}
              fill={
                i === 0 ? "rgb(var(--rose))" : "rgb(var(--ink-quiet))"
              }
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: 0.6 + i * 0.06, duration: 0.3 }}
            />
          ))}
          {/* Edges (likelihood ratios) */}
          {[
            [20, 40], [20, 100],
            [70, 40], [70, 100], [70, 160],
            [130, 40], [130, 160],
            [180, 40], [180, 100], [180, 160],
          ].map(([fx, dxx], i) => (
            <motion.line
              key={`e-${i}`}
              x1={fx}
              y1={10}
              x2={dxx}
              y2={58}
              stroke={
                dxx === 40 ? "rgb(var(--rose))" : "rgb(var(--ink-quiet))"
              }
              strokeWidth={dxx === 40 ? 0.7 : 0.35}
              strokeOpacity={dxx === 40 ? 0.85 : 0.45}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: 0.25 + i * 0.04, duration: 0.6, ease: EASE }}
            />
          ))}
          {/* Labels */}
          <text x="0" y="6" fontSize="5" fill="rgb(var(--ink-soft))" fontFamily="ui-monospace, monospace">
            findings
          </text>
          <text x="0" y="68" fontSize="5" fill="rgb(var(--ink-soft))" fontFamily="ui-monospace, monospace">
            dx
          </text>
        </svg>
      </div>

      {/* Posterior bars */}
      <div className="space-y-1.5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-ink-soft">
          Posterior
        </p>
        {dx.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="w-[88px] truncate font-mono text-[10px] text-ink-strong">
              {d.name}
            </span>
            <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft">
              <motion.div
                className={
                  d.tone === "rose"
                    ? "h-full bg-rose"
                    : d.tone === "warn"
                      ? "h-full bg-warn"
                      : "h-full bg-ink-quiet"
                }
                initial={{ width: 0 }}
                whileInView={{ width: `${d.post}%` }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: 1.0 + i * 0.1, duration: 0.9, ease: EASE }}
              />
            </div>
            <span className="w-7 text-right font-mono text-[10px] tabular-nums text-ink-strong">
              {d.post}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Capa 04: OUTPUT VERBATIM ---------- */
function LayerOutput() {
  return (
    <div className="space-y-3">
      {/* Differential header */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="rounded-lg border border-rose-soft bg-rose-soft/40 px-3 py-2.5"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-rose">
              Diagnóstico principal
            </p>
            <p className="mt-0.5 text-[12px] font-semibold leading-snug text-ink-strong">
              IAM con elevación ST · anterior
            </p>
          </div>
          <p className="font-mono text-h3 font-semibold tabular-nums text-rose">
            <CountUp value={87} suffix="%" duration={1.4} />
          </p>
        </div>
      </motion.div>

      {/* Verbatim citation */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="rounded-lg border border-line bg-surface px-3 py-2.5"
      >
        <div className="flex items-start gap-1.5">
          <Quote
            className="mt-0.5 h-3 w-3 shrink-0 text-validation"
            strokeWidth={2}
          />
          <p className="text-[11px] leading-relaxed text-ink-strong">
            PCI primaria en{" "}
            <span className="font-semibold">&lt; 90 min</span> desde primer
            contacto médico.
          </p>
        </div>
        <p className="mt-1.5 pl-4 font-mono text-[10px] text-ink-muted">
          AHA/ACC 2022 · Class I · LOE A · Lawton et al · p. 18
        </p>
      </motion.div>

      {/* Red flag badge */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="flex items-center gap-1.5"
      >
        <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(var(--code-red-bg))] px-2 py-0.5 font-mono text-[10px] font-semibold text-[rgb(var(--code-red))]">
          <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2.4} />
          Red flag · choque cardiogénico
        </span>
      </motion.div>
    </div>
  );
}

/* ---------- Layer Panel wrapper ---------- */
function LayerPanel({
  index,
  Icon,
  title,
  caption,
  children,
  delay,
}: {
  index: string;
  Icon: typeof Mic;
  title: string;
  caption: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay, duration: 0.7, ease: EASE }}
      className="relative flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-soft"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-ink-quiet">
          Capa {index}
        </p>
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface-alt">
          <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
        </div>
      </div>

      <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
        {title}
      </h3>
      <p className="mt-1 text-caption leading-snug text-ink-muted">
        {caption}
      </p>

      <div className="mt-5">{children}</div>
    </motion.div>
  );
}

/* ---------- Flow line (horizontal, behind panels on lg) ---------- */
function FlowLine() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 lg:block"
    >
      {/* Dashed line — only the bits in the gaps will show; panels cover the rest */}
      <div className="h-px w-full bg-[linear-gradient(to_right,transparent_0,transparent_calc(25%-12px),rgb(var(--line-strong))_calc(25%-12px),rgb(var(--line-strong))_calc(25%+12px),transparent_calc(25%+12px),transparent_calc(50%-12px),rgb(var(--line-strong))_calc(50%-12px),rgb(var(--line-strong))_calc(50%+12px),transparent_calc(50%+12px),transparent_calc(75%-12px),rgb(var(--line-strong))_calc(75%-12px),rgb(var(--line-strong))_calc(75%+12px),transparent_calc(75%+12px))]" />
      {/* Arrow marks at each gap */}
      {[25, 50, 75].map((pct, i) => (
        <motion.div
          key={pct}
          className="absolute top-1/2 -translate-y-1/2 text-accent"
          style={{ left: `${pct}%`, transform: "translate(-50%, -50%)" }}
          initial={{ opacity: 0, x: -4 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.4 + i * 0.2, duration: 0.4 }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 2 L7 5 L2 8"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

/* ---------- Metrics strip ---------- */
const METRICS: { value: number; label: string; suffix?: string }[] = [
  { value: 51, label: "diagnósticos curados" },
  { value: 124, label: "findings estructurados" },
  { value: 330, label: "likelihood ratios" },
  { value: 32, label: "estados MX · priors regional" },
  { value: 26, label: "fármacos Cuadro Básico IMSS" },
  { value: 0, label: "% de alucinación tolerada", suffix: "%" },
];

function MetricsStrip() {
  return (
    <div className="mt-14 border-t border-line pt-8">
      <p className="mb-6 font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-ink-soft">
        Cobertura del cerebro · v0.5
      </p>
      <div className="grid grid-cols-2 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
        {METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.06, duration: 0.5 }}
          >
            <p className="font-mono text-h2 font-semibold tracking-tight text-ink-strong tabular-nums">
              <CountUp value={m.value} suffix={m.suffix ?? ""} />
            </p>
            <p className="mt-1 text-caption leading-snug text-ink-muted">
              {m.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Main component ---------- */
export function BrainArchitecture() {
  return (
    <section className="border-b border-line bg-surface-alt">
      <div className="lg-shell py-20">
        {/* Heading */}
        <div className="mx-auto mb-14 max-w-3xl">
          <Eyebrow>Arquitectura</Eyebrow>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Anatomía del cerebro clínico.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">
            Cuatro capas convierten una consulta en una recomendación
            citada. Sin caja negra: cada paso es inspeccionable y cada
            recomendación lleva su referencia bibliográfica original.
          </p>
        </div>

        {/* 4 layers */}
        <div className="relative grid gap-6 lg:grid-cols-4 lg:gap-5">
          {/* Subtle horizontal flow line — only the gap regions, behind panels */}
          <FlowLine />

          <LayerPanel
            index="01"
            Icon={Mic}
            title="Input"
            caption="Scribe ambient en español MX. Transcripción + extracción estructurada de findings clínicos."
            delay={0}
          >
            <LayerInput />
          </LayerPanel>

          <LayerPanel
            index="02"
            Icon={Search}
            title="Retrieval híbrido"
            caption="BM25 keyword + búsqueda semántica (pgvector cosine) fusionadas con Reciprocal Rank Fusion."
            delay={0.12}
          >
            <LayerRetrieval />
          </LayerPanel>

          <LayerPanel
            index="03"
            Icon={Network}
            title="Inferencia bayesiana"
            caption="Log-odds normalizados sobre likelihood ratios. Multi-hop dx → guía → fármaco con priors regionales MX."
            delay={0.24}
          >
            <LayerBrain />
          </LayerPanel>

          <LayerPanel
            index="04"
            Icon={FileText}
            title="Output con cita verbatim"
            caption="Diferencial calibrado, red flags por síntoma y recomendación con referencia bibliográfica original."
            delay={0.36}
          >
            <LayerOutput />
          </LayerPanel>
        </div>

        {/* Trust line below panels */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-caption text-ink-muted"
        >
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-validation" strokeWidth={2.4} />
            Procesamiento privado por defecto
          </span>
          <span className="text-ink-quiet">·</span>
          <span className="inline-flex items-center gap-1.5">
            <ArrowRight className="h-3 w-3 text-accent" strokeWidth={2} />
            Cada paso inspeccionable
          </span>
          <span className="text-ink-quiet">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Quote className="h-3 w-3 text-validation" strokeWidth={2} />
            Cero alucinación tolerada
          </span>
        </motion.div>

        {/* Metrics strip */}
        <MetricsStrip />
      </div>
    </section>
  );
}
