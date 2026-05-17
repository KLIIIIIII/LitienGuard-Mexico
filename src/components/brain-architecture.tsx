"use client";

/* ============================================================
   Brain Architecture — ilustración de un cerebro literal.

   Una escena: cerebro estilizado al centro con 6 funciones
   satélite. Sin tabs, sin paneles densos. Inspiración: Adara,
   Anthropic, Stripe. Animaciones sutiles, copy mínimo.

   Cada función es 1 verbo + 1 spec corta. El cerebro pulsa, los
   conectores se dibujan, los pulsos viajan al hover. Las métricas
   reales del knowledge-base.ts van debajo en una línea.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import {
  Mic,
  Search,
  Network,
  Database,
  ShieldAlert,
  Quote,
} from "lucide-react";
import { Eyebrow } from "@/components/eyebrow";
import { formatNumberMX, cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ============================================================
   CountUp
   ============================================================ */
function CountUp({
  value,
  suffix = "",
  duration = 1.4,
}: {
  value: number;
  suffix?: string;
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
      {formatNumberMX(Math.round(display))}
      {suffix}
    </span>
  );
}

/* ============================================================
   Satellite nodes around the brain
   ============================================================ */
type Node = {
  key: string;
  verb: string;
  spec: string;
  Icon: typeof Mic;
  /** Position angle in degrees, 0 = right, -90 = top, clockwise. */
  angle: number;
};

const NODES: Node[] = [
  { key: "escucha", verb: "Escucha", spec: "Scribe ambient · es-MX", Icon: Mic, angle: -150 },
  { key: "busca", verb: "Busca", spec: "BM25 + vector · cita verbatim", Icon: Search, angle: -90 },
  { key: "razona", verb: "Razona", spec: "Bayes · priors MX", Icon: Network, angle: -30 },
  { key: "recuerda", verb: "Recuerda", spec: "Tus pacientes · 124 patrones", Icon: Database, angle: 30 },
  { key: "protege", verb: "Protege", spec: "67 red flags · alergias", Icon: ShieldAlert, angle: 90 },
  { key: "cita", verb: "Cita", spec: "Verbatim · 0 % alucinación", Icon: Quote, angle: 150 },
];

/* ============================================================
   Brain SVG (top view, stylized)
   ============================================================ */
function BrainSvg({ hoveredAngle }: { hoveredAngle: number | null }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 sm:h-[300px] sm:w-[300px] lg:h-[340px] lg:w-[340px]"
      aria-hidden
    >
      <defs>
        <radialGradient id="brain-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgb(var(--validation))" stopOpacity="0.35" />
          <stop offset="60%" stopColor="rgb(var(--validation))" stopOpacity="0.05" />
          <stop offset="100%" stopColor="rgb(var(--validation))" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="brain-fill" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="rgb(var(--surface))" />
          <stop offset="100%" stopColor="rgb(var(--surface-alt))" />
        </radialGradient>
      </defs>

      {/* Outer glow */}
      <motion.circle
        cx="100"
        cy="100"
        r="90"
        fill="url(#brain-glow)"
        animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 100px" }}
      />

      {/* Brain outline */}
      <motion.path
        d="M 100 22
           C 70 22, 45 38, 38 65
           C 30 75, 26 88, 28 100
           C 24 115, 28 135, 42 150
           C 52 168, 75 178, 100 178
           C 125 178, 148 168, 158 150
           C 172 135, 176 115, 172 100
           C 174 88, 170 75, 162 65
           C 155 38, 130 22, 100 22 Z"
        fill="url(#brain-fill)"
        stroke="rgb(var(--accent))"
        strokeWidth="1.6"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.6, ease: EASE }}
      />

      {/* Central fissure */}
      <motion.path
        d="M 100 25 Q 104 55 100 100 Q 96 145 100 175"
        fill="none"
        stroke="rgb(var(--accent))"
        strokeWidth="0.9"
        strokeOpacity="0.7"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ delay: 0.6, duration: 1.0, ease: EASE }}
      />

      {/* Left hemisphere sulci */}
      {[
        "M 45 55 Q 65 65 55 85 Q 45 105 65 122",
        "M 38 90 Q 58 100 50 122 Q 45 140 65 152",
        "M 60 38 Q 78 48 68 70",
        "M 50 138 Q 70 145 80 160",
      ].map((d, i) => (
        <motion.path
          key={`L-${i}`}
          d={d}
          fill="none"
          stroke="rgb(var(--ink-quiet))"
          strokeWidth="0.7"
          strokeOpacity="0.55"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.8 + i * 0.12, duration: 0.9, ease: EASE }}
        />
      ))}

      {/* Right hemisphere sulci (mirror) */}
      {[
        "M 155 55 Q 135 65 145 85 Q 155 105 135 122",
        "M 162 90 Q 142 100 150 122 Q 155 140 135 152",
        "M 140 38 Q 122 48 132 70",
        "M 150 138 Q 130 145 120 160",
      ].map((d, i) => (
        <motion.path
          key={`R-${i}`}
          d={d}
          fill="none"
          stroke="rgb(var(--ink-quiet))"
          strokeWidth="0.7"
          strokeOpacity="0.55"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.85 + i * 0.12, duration: 0.9, ease: EASE }}
        />
      ))}

      {/* Synaptic dots traveling on sulci */}
      {[
        { cx: 55, cy: 70, delay: 2.0 },
        { cx: 145, cy: 70, delay: 2.3 },
        { cx: 60, cy: 130, delay: 2.6 },
        { cx: 140, cy: 130, delay: 2.9 },
        { cx: 100, cy: 60, delay: 3.2 },
        { cx: 100, cy: 140, delay: 3.5 },
      ].map((p, i) => (
        <motion.circle
          key={`syn-${i}`}
          cx={p.cx}
          cy={p.cy}
          r="1.4"
          fill="rgb(var(--validation))"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{
            delay: p.delay,
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1.5 + i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Nucleus — beating core */}
      <motion.circle
        cx="100"
        cy="100"
        r="5"
        fill="rgb(var(--validation))"
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 100px" }}
      />
      <motion.circle
        cx="100"
        cy="100"
        r="10"
        fill="rgb(var(--validation))"
        opacity={0.18}
        animate={{ scale: [1, 1.4, 1], opacity: [0.18, 0.05, 0.18] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 100px" }}
      />

      {/* On hover: pulse traveling from nucleus toward the hovered node */}
      {hoveredAngle !== null && (
        <motion.circle
          key={hoveredAngle}
          r="2.4"
          fill="rgb(var(--accent))"
          initial={{ cx: 100, cy: 100, opacity: 0 }}
          animate={{
            cx: 100 + Math.cos((hoveredAngle * Math.PI) / 180) * 78,
            cy: 100 + Math.sin((hoveredAngle * Math.PI) / 180) * 78,
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 0.9, ease: EASE }}
        />
      )}
    </svg>
  );
}

/* ============================================================
   Satellite node component
   ============================================================ */
function SatelliteNode({
  node,
  delay,
  onHover,
}: {
  node: Node;
  delay: number;
  onHover: (angle: number | null) => void;
}) {
  const Ic = node.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay, duration: 0.6, ease: EASE }}
      onMouseEnter={() => onHover(node.angle)}
      onMouseLeave={() => onHover(null)}
      className="group flex w-[150px] cursor-default flex-col items-center text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface shadow-soft transition-all duration-300 group-hover:border-accent group-hover:shadow-lift">
        <Ic className="h-5 w-5 text-accent transition-transform duration-300 group-hover:scale-110" strokeWidth={1.8} />
      </div>
      <p className="mt-2.5 text-body-sm font-semibold tracking-tight text-ink-strong">
        {node.verb}
      </p>
      <p className="mt-0.5 font-mono text-[10px] leading-snug text-ink-muted">
        {node.spec}
      </p>
    </motion.div>
  );
}

/* ============================================================
   Connector lines (brain → nodes) — drawn in SVG behind nodes
   ============================================================ */
function Connectors({ size }: { size: number }) {
  const center = size / 2;
  const brainRadius = size * 0.235; // just outside the brain silhouette
  const nodeRadius = size * 0.36; // where the node center sits

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0"
      aria-hidden
    >
      {NODES.map((n, i) => {
        const rad = (n.angle * Math.PI) / 180;
        const x1 = center + Math.cos(rad) * brainRadius;
        const y1 = center + Math.sin(rad) * brainRadius;
        const x2 = center + Math.cos(rad) * nodeRadius;
        const y2 = center + Math.sin(rad) * nodeRadius;
        return (
          <g key={n.key}>
            <motion.line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgb(var(--line-strong))"
              strokeWidth="1"
              strokeDasharray="3 3"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 1.4 + i * 0.08, duration: 0.6, ease: EASE }}
            />
          </g>
        );
      })}
    </svg>
  );
}

/* ============================================================
   Main brain composition
   ============================================================ */
function BrainScene() {
  const [hoveredAngle, setHoveredAngle] = useState<number | null>(null);

  // Responsive scene size — uses CSS vars on container, JS for connector math
  // We render at a logical size and let CSS scale.
  const SIZE = 600;
  const center = SIZE / 2;
  const nodeRadius = SIZE * 0.36;

  return (
    <div className="relative mx-auto" style={{ width: SIZE, maxWidth: "100%" }}>
      {/* Square aspect canvas */}
      <div
        className="relative mx-auto"
        style={{ width: SIZE, height: SIZE, maxWidth: "100%" }}
      >
        <Connectors size={SIZE} />
        <BrainSvg hoveredAngle={hoveredAngle} />

        {/* Satellite nodes positioned in a circle */}
        {NODES.map((n, i) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = center + Math.cos(rad) * nodeRadius;
          const y = center + Math.sin(rad) * nodeRadius;
          return (
            <div
              key={n.key}
              className="absolute"
              style={{
                left: x,
                top: y,
                transform: "translate(-50%, -50%)",
              }}
            >
              <SatelliteNode
                node={n}
                delay={1.6 + i * 0.1}
                onHover={setHoveredAngle}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Mobile fallback — vertical layout
   ============================================================ */
function BrainSceneMobile() {
  const [hoveredAngle, setHoveredAngle] = useState<number | null>(null);
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[280px] w-[280px]">
        <BrainSvg hoveredAngle={hoveredAngle} />
      </div>
      <div className="mt-6 grid w-full grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
        {NODES.map((n, i) => (
          <SatelliteNode
            key={n.key}
            node={n}
            delay={0.6 + i * 0.08}
            onHover={setHoveredAngle}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Metrics line below
   ============================================================ */
const METRICS = [
  { v: 51, l: "dx curados" },
  { v: 124, l: "findings" },
  { v: 124, l: "patrones" },
  { v: 67, l: "red flags" },
  { v: 32, l: "estados MX" },
];

function MetricsLine() {
  return (
    <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 border-t border-line pt-10">
      {METRICS.map((m, i) => (
        <motion.div
          key={m.l}
          initial={{ opacity: 0, y: 6 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: i * 0.06, duration: 0.5 }}
          className="text-center"
        >
          <p className="font-mono text-h2 font-semibold tracking-tight text-ink-strong">
            <CountUp value={m.v} />
          </p>
          <p className="mt-0.5 text-caption text-ink-muted">{m.l}</p>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center"
      >
        <p className="font-mono text-h2 font-semibold tracking-tight text-validation">
          0 %
        </p>
        <p className="mt-0.5 text-caption text-ink-muted">alucinación</p>
      </motion.div>
    </div>
  );
}

/* ============================================================
   Main export
   ============================================================ */
export function BrainArchitecture() {
  return (
    <section className="relative border-b border-line bg-surface-alt">
      {/* Subtle blueprint grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(31,30,27,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(31,30,27,0.025) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="lg-shell relative py-24">
        {/* Heading */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <Eyebrow>Arquitectura clínica</Eyebrow>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Un cerebro que{" "}
            <span className="lg-serif-italic text-validation">
              escucha, razona y cita
            </span>
            .
          </h2>
          <p className="mt-4 text-body text-ink-muted">
            Seis funciones, una sola arquitectura. Cada recomendación lleva
            su referencia bibliográfica original.
          </p>
        </div>

        {/* Desktop scene */}
        <div className="hidden lg:block">
          <BrainScene />
        </div>

        {/* Mobile/tablet scene */}
        <div className={cn("block lg:hidden")}>
          <BrainSceneMobile />
        </div>

        {/* Metrics */}
        <MetricsLine />
      </div>
    </section>
  );
}
