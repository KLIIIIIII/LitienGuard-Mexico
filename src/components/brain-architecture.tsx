"use client";

/* ============================================================
   Brain Architecture — pipeline interactivo del cerebro clínico.

   6 estaciones · conectores SVG con data-flow continuo · tabs
   clickeables con auto-rotación · detail panel por estación con
   mini-visualización + sub-componentes técnicos · métricas con
   count-ups · trust line.

   Estilo: Mayo Clinic Platform · Oracle Health · NVIDIA Omniverse.
   Datos: confirmados contra knowledge-base.ts, red-flags.ts,
   farmacos-mx.ts, patrones-multi-estudio.ts, epidemio-estados-mx.ts.
   ============================================================ */

import { useEffect, useRef, useState, type FC } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  animate,
  type Variants,
} from "framer-motion";
import {
  Mic,
  Search,
  Network,
  Brain,
  ShieldAlert,
  FileText,
  Lock,
  Sparkles,
  Quote,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Database,
  Layers,
} from "lucide-react";
import { Eyebrow } from "@/components/eyebrow";
import { formatNumberMX, cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const AUTOPLAY_MS = 6000;

/* ============================================================
   CountUp helper
   ============================================================ */
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

/* ============================================================
   Stations definition
   ============================================================ */
type StationKey =
  | "capture"
  | "retrieve"
  | "reason"
  | "remember"
  | "guard"
  | "deliver";

interface SubComponent {
  label: string;
  technical: string;
}

interface Station {
  key: StationKey;
  number: string;
  title: string;
  short: string;
  Icon: typeof Mic;
  tagline: string;
  description: string;
  subs: SubComponent[];
  spec: string;
}

const STATIONS: Station[] = [
  {
    key: "capture",
    number: "01",
    title: "Captura privada",
    short: "Capturar",
    Icon: Mic,
    tagline: "Scribe ambient · de-identificación · cifrado en reposo",
    description:
      "La conversación médico-paciente entra al sistema sin perder fidelidad clínica y sin nunca enviar datos identificables a modelos externos.",
    subs: [
      {
        label: "Scribe ambient es-MX",
        technical: "transcripción + extracción estructurada con LLM",
      },
      {
        label: "De-identification pre-embedding",
        technical: "regex iniciales → «paciente» antes de salir del servidor",
      },
      {
        label: "Cifrado app-level (AES-256 / KMS)",
        technical: "cerebro_chunks.content cifrado en reposo",
      },
      {
        label: "Importers HL7 v2 · CDA XML · OCR fotos",
        technical: "migración desde SaludTotal, MediSel, recetas papel",
      },
    ],
    spec: "es-MX nativo · 1.2 s latencia promedio · zero data retention upstream",
  },
  {
    key: "retrieve",
    number: "02",
    title: "Recuperación híbrida",
    short: "Recuperar",
    Icon: Search,
    tagline: "BM25 sparse · pgvector dense · cross-encoder · RRF k = 60",
    description:
      "Cada consulta dispara dos búsquedas paralelas sobre el corpus académico y se fusionan con Reciprocal Rank Fusion. Un cross-encoder re-rankea el top-50.",
    subs: [
      {
        label: "BM25 keyword sparse",
        technical: "índice invertido en memoria · refresh 60 s",
      },
      {
        label: "pgvector cosine (1536-d)",
        technical: "HNSW · text-embedding-3-small",
      },
      {
        label: "Cross-encoder re-rank",
        technical: "sube precisión vs cosine puro en top-50",
      },
      {
        label: "Reciprocal Rank Fusion · k = 60",
        technical: "score = Σ 1 / (k + rank_i)",
      },
    ],
    spec: "p50 retrieve 180 ms · 0 alucinación · cita verbatim garantizada",
  },
  {
    key: "reason",
    number: "03",
    title: "Inferencia bayesiana",
    short: "Razonar",
    Icon: Network,
    tagline: "Log-odds normalizados · priors regionales MX · multi-hop dx → guía → fármaco",
    description:
      "Motor multinomial Bayes en log-odds con ~300 likelihood ratios calibrados contra literatura. Los priors se ajustan por estado mexicano (32) antes de combinar.",
    subs: [
      {
        label: "51 dx × 124 findings × LR catalog",
        technical: "todos respaldados por cita académica original",
      },
      {
        label: "Priors regionales MX (32 estados)",
        technical: "Anuario Morbilidad SSA 2024 inyectado al prior",
      },
      {
        label: "Multi-hop 3 saltos",
        technical: "dx → guías AHA/ACC/ADA → fármacos Cuadro Básico IMSS",
      },
      {
        label: "LLM scaffold validation",
        technical: "Claude valida que el output respeta el bayes",
      },
    ],
    spec: "log-odds estable · independencia condicional aprox · 1.4 s p95",
  },
  {
    key: "remember",
    number: "04",
    title: "Memoria clínica",
    short: "Recordar",
    Icon: Brain,
    tagline: "Patient memory · patrones multi-estudio · outcome loop",
    description:
      "El cerebro recuerda los casos del médico. Cuando ve uno nuevo similar, lo señala. Los outcomes alimentan la calibración personal del modelo.",
    subs: [
      {
        label: "Patient memory · pgvector HNSW 1536-d",
        technical: "embeddings de-identificados · RLS por médico",
      },
      {
        label: "124 patrones multi-estudio canónicos",
        technical: "cruzan ≥2 estudios diagnósticos por dx",
      },
      {
        label: "Outcome loop con calibración personal",
        technical: "outcome del paciente ajusta prior del médico",
      },
      {
        label: "60 estudios diagnósticos catalogados",
        technical: "lab + imagen + funcionales con interpretación",
      },
    ],
    spec: "recall sub-200 ms · privacy-preserving · RLS Postgres",
  },
  {
    key: "guard",
    number: "05",
    title: "Seguridad clínica",
    short: "Resguardar",
    Icon: ShieldAlert,
    tagline: "Critical values · allergy hard-stop · 67 red flags · vigilancia pasiva",
    description:
      "Antes de mostrar cualquier output, el sistema verifica: ¿hay valores críticos? ¿hay alergia conflictiva? ¿el cuadro dispara alguna red flag?",
    subs: [
      {
        label: "Critical values (ACR + AHRQ + Joint Commission)",
        technical: "regex + NER sobre texto libre lab/imagen",
      },
      {
        label: "Allergy hard-stop pre-firma",
        technical: "cross-check meds × alergias por nombre + clase",
      },
      {
        label: "67 red flags por síntoma",
        technical: "8 síntomas core con 35+ banderas curadas",
      },
      {
        label: "Vigilancia pasiva durante escritura",
        technical: "stream del scribe activa alertas en tiempo real",
      },
    ],
    spec: "AMIA + AHRQ + ISMP + FDA CDS 2026 alignment",
  },
  {
    key: "deliver",
    number: "06",
    title: "Entrega con cita verbatim",
    short: "Entregar",
    Icon: FileText,
    tagline: "Diferencial calibrado · referencia bibliográfica · audit forense",
    description:
      "Cada recomendación sale con su cita: guía, página, autor, año. Cero alucinación tolerada. Cada query queda watermark + audit forense.",
    subs: [
      {
        label: "Cita verbatim guía + página + autor",
        technical: "snippet inmutable del corpus académico",
      },
      {
        label: "Diferencial calibrado top-3",
        technical: "posterior normalizado entre dx candidatos",
      },
      {
        label: "Query audit forense (signed log)",
        technical: "cada inferencia rastreable · cumplimiento NOM-024",
      },
      {
        label: "Watermark estadístico en LRs",
        technical: "anti reverse-engineering del cerebro",
      },
    ],
    spec: "0 % alucinación · auditable · firmable · trazable",
  },
];

/* ============================================================
   Mini visualizations per station
   ============================================================ */
function VizCapture() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2">
        <Mic className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-ink-muted">
          Scribe · es-MX
        </span>
        <div className="ml-auto flex items-end gap-[2px]">
          {[6, 10, 14, 8, 12, 6, 10, 4, 8].map((h, i) => (
            <motion.span
              key={i}
              className="block w-[2.5px] rounded-sm bg-validation"
              animate={{ scaleY: [0.2, 1, 0.4, 0.9, 0.3] }}
              transition={{
                duration: 1.6,
                delay: i * 0.07,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
              style={{ height: h, transformOrigin: "bottom" }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
        <p className="text-[11.5px] leading-relaxed text-ink-strong">
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

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-validation-soft bg-validation-soft/60 px-2.5 py-2">
          <p className="flex items-center gap-1 font-mono text-[9.5px] font-semibold uppercase tracking-eyebrow text-validation">
            <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.4} />
            De-identificado
          </p>
          <p className="mt-1 font-mono text-[10px] text-ink-muted">
            iniciales → «paciente»
          </p>
        </div>
        <div className="rounded-lg border border-accent-soft bg-accent-soft/60 px-2.5 py-2">
          <p className="flex items-center gap-1 font-mono text-[9.5px] font-semibold uppercase tracking-eyebrow text-accent">
            <Lock className="h-2.5 w-2.5" strokeWidth={2.4} />
            AES-256 · KMS
          </p>
          <p className="mt-1 font-mono text-[10px] text-ink-muted">
            cifrado en reposo
          </p>
        </div>
      </div>
    </div>
  );
}

function VizRetrieve() {
  const bm25 = [
    { rank: "01", text: "STEMI anterior · AHA 2022" },
    { rank: "02", text: "Killip IV · O'Gara 2013" },
    { rank: "03", text: "Choque cardiogénico" },
  ];
  const vec = [
    { rank: "01", text: "IAM con shock · ESC 2023" },
    { rank: "02", text: "Sd. coronario agudo" },
    { rank: "03", text: "Hipoperfusión sistémica" },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <RetrieveLane title="BM25" tag="sparse · keyword" rows={bm25} />
        <RetrieveLane title="Vector" tag="dense · cosine" rows={vec} />
      </div>

      <div className="relative">
        <svg
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
          className="absolute inset-x-0 -top-1 h-3 w-full"
          aria-hidden
        >
          <motion.path
            d="M 22 0 Q 50 6 50 12"
            stroke="rgb(var(--accent))"
            strokeWidth="0.5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: EASE }}
          />
          <motion.path
            d="M 78 0 Q 50 6 50 12"
            stroke="rgb(var(--accent))"
            strokeWidth="0.5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          />
        </svg>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="mt-3 rounded-lg border border-accent-soft bg-accent-soft/60 px-3 py-2"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-accent">
              RRF · fusión + re-rank
            </span>
            <span className="font-mono text-[10px] text-ink-muted">k = 60</span>
          </div>
          <p className="mt-1 font-mono text-[11px] font-medium text-ink-strong">
            01 · IAM con elevación ST anterior · AHA/ACC 2022 p. 18
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function RetrieveLane({
  title,
  tag,
  rows,
}: {
  title: string;
  tag: string;
  rows: { rank: string; text: string }[];
}) {
  return (
    <div className="rounded-lg border border-line bg-canvas px-2.5 py-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-ink-soft">
          {title}
        </span>
        <span className="font-mono text-[9.5px] text-ink-quiet">{tag}</span>
      </div>
      <ul className="space-y-1">
        {rows.map((r, i) => (
          <motion.li
            key={r.rank}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
            className="flex items-start gap-1.5 font-mono text-[10px] text-ink-strong"
          >
            <span className="text-ink-quiet">{r.rank}</span>
            <span className="truncate">{r.text}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function VizReason() {
  const dx = [
    { name: "IAM anterior", post: 87, tone: "rose" as const },
    { name: "TEP masivo", post: 7, tone: "warn" as const },
    { name: "Disección Ao", post: 4, tone: "muted" as const },
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-canvas px-3 py-3">
        <p className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-ink-soft">
            Inferencia · log-odds
          </span>
          <span className="font-mono text-[10px] text-ink-quiet">
            prior MX-09 inyectado
          </span>
        </p>
        <svg viewBox="0 0 200 60" className="w-full" aria-hidden>
          {[15, 70, 130, 185].map((x, i) => (
            <motion.circle
              key={`f-${i}`}
              cx={x}
              cy={8}
              r={2.8}
              fill="rgb(var(--validation))"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
            />
          ))}
          {[40, 100, 160].map((x, i) => (
            <motion.circle
              key={`d-${i}`}
              cx={x}
              cy={50}
              r={3.8}
              fill={i === 0 ? "rgb(var(--rose))" : "rgb(var(--ink-quiet))"}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55 + i * 0.08, duration: 0.3 }}
            />
          ))}
          {[
            [15, 40], [15, 100],
            [70, 40], [70, 100], [70, 160],
            [130, 40], [130, 160],
            [185, 40], [185, 100],
          ].map(([fx, dxx], i) => (
            <motion.line
              key={`e-${i}`}
              x1={fx}
              y1={8}
              x2={dxx}
              y2={50}
              stroke={dxx === 40 ? "rgb(var(--rose))" : "rgb(var(--ink-quiet))"}
              strokeWidth={dxx === 40 ? 0.8 : 0.35}
              strokeOpacity={dxx === 40 ? 0.9 : 0.4}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2 + i * 0.04, duration: 0.55, ease: EASE }}
            />
          ))}
          <text x="0" y="6" fontSize="4.5" fill="rgb(var(--ink-soft))" fontFamily="ui-monospace, monospace">
            findings
          </text>
          <text x="0" y="58" fontSize="4.5" fill="rgb(var(--ink-soft))" fontFamily="ui-monospace, monospace">
            dx
          </text>
        </svg>
      </div>

      <div className="space-y-1.5">
        {dx.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="w-[90px] truncate font-mono text-[10px] text-ink-strong">
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
                animate={{ width: `${d.post}%` }}
                transition={{ delay: 0.9 + i * 0.1, duration: 0.9, ease: EASE }}
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

function VizRemember() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-canvas px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-ink-soft">
            Casos similares · pgvector cosine
          </span>
          <span className="font-mono text-[9.5px] text-ink-quiet">HNSW</span>
        </div>
        <ul className="space-y-1.5">
          {[
            { date: "11-may", label: "Mujer 71 a · IAM anterior · alta vs", sim: 0.94 },
            { date: "03-mar", label: "Mujer 64 a · NSTEMI · DAPT iniciada", sim: 0.88 },
            { date: "18-feb", label: "Hombre 68 a · STEMI · PCI primaria", sim: 0.81 },
          ].map((c, i) => (
            <motion.li
              key={c.date}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.4 }}
              className="flex items-center gap-2 font-mono text-[10px]"
            >
              <span className="w-12 shrink-0 text-ink-quiet">{c.date}</span>
              <span className="flex-1 truncate text-ink-strong">{c.label}</span>
              <span className="w-12 shrink-0 text-right tabular-nums text-validation">
                {c.sim.toFixed(2)}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-validation-soft bg-validation-soft/40 px-3 py-2">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-validation" strokeWidth={2} />
          <p className="text-[10.5px] leading-snug text-ink-strong">
            Tu caso del{" "}
            <span className="font-mono font-semibold">11-may</span> evolucionó
            bien con esta misma combinación. El cerebro lo recordó.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "patient memory", n: "1536-d" },
          { label: "patrones", n: "124" },
          { label: "outcome loop", n: "activo" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-md border border-line bg-canvas px-2 py-1.5"
          >
            <p className="font-mono text-[10px] font-semibold text-ink-strong tabular-nums">
              {m.n}
            </p>
            <p className="mt-0.5 text-[9.5px] text-ink-quiet">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VizGuard() {
  const alerts = [
    {
      severity: "critical",
      icon: AlertTriangle,
      label: "Choque cardiogénico",
      source: "ACR + AHRQ",
    },
    {
      severity: "critical",
      icon: ShieldAlert,
      label: "Alergia: ASA documentada",
      source: "Allergy hard-stop",
    },
    {
      severity: "warning",
      icon: Activity,
      label: "TA < 90 sistólica + diaforesis",
      source: "Red flag · cardio #07",
    },
  ];
  return (
    <div className="space-y-2.5">
      {alerts.map((a, i) => {
        const A = a.icon;
        const isRed = a.severity === "critical";
        return (
          <motion.div
            key={a.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.4 }}
            className={cn(
              "rounded-lg border px-3 py-2",
              isRed
                ? "border-rose-soft bg-rose-soft/40"
                : "border-warn-soft bg-warn-soft/40",
            )}
          >
            <div className="flex items-start gap-2">
              <A
                className={cn(
                  "mt-0.5 h-3.5 w-3.5 shrink-0",
                  isRed ? "text-rose" : "text-warn",
                )}
                strokeWidth={2}
              />
              <div className="flex-1">
                <p className="text-[11px] font-semibold leading-snug text-ink-strong">
                  {a.label}
                </p>
                <p className="mt-0.5 font-mono text-[9.5px] text-ink-muted">
                  {a.source}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-eyebrow",
                  isRed
                    ? "bg-[rgb(var(--code-red-bg))] text-[rgb(var(--code-red))]"
                    : "bg-warn-soft text-warn",
                )}
              >
                {isRed ? "Crítica" : "Aviso"}
              </span>
            </div>
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-validation opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-validation" />
        </span>
        <span className="font-mono text-[10px] text-ink-muted">
          Vigilancia pasiva activa · stream del scribe
        </span>
      </motion.div>
    </div>
  );
}

function VizDeliver() {
  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="rounded-lg border border-rose-soft bg-rose-soft/40 px-3 py-2.5"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-eyebrow text-rose">
              Diagnóstico principal
            </p>
            <p className="mt-0.5 text-[12px] font-semibold leading-snug text-ink-strong">
              IAM con elevación ST · anterior
            </p>
          </div>
          <p className="font-mono text-h3 font-semibold tabular-nums text-rose">
            <CountUp value={87} suffix="%" duration={1.2} />
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="rounded-lg border border-line bg-canvas px-3 py-2.5"
      >
        <div className="flex items-start gap-2">
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
        <p className="mt-1.5 pl-5 font-mono text-[9.5px] text-ink-muted">
          AHA/ACC 2022 · Class I · LOE A · Lawton et al · p. 18
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="grid grid-cols-2 gap-2"
      >
        <div className="rounded-md border border-line bg-canvas px-2 py-1.5">
          <div className="flex items-center gap-1">
            <Database className="h-2.5 w-2.5 text-accent" strokeWidth={2} />
            <span className="font-mono text-[9.5px] font-semibold uppercase tracking-eyebrow text-ink-soft">
              Query audit
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[9.5px] text-ink-muted">
            signed log · NOM-024
          </p>
        </div>
        <div className="rounded-md border border-line bg-canvas px-2 py-1.5">
          <div className="flex items-center gap-1">
            <Lock className="h-2.5 w-2.5 text-accent" strokeWidth={2} />
            <span className="font-mono text-[9.5px] font-semibold uppercase tracking-eyebrow text-ink-soft">
              Watermark
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[9.5px] text-ink-muted">
            anti-RE en LRs
          </p>
        </div>
      </motion.div>
    </div>
  );
}

const VIZ_BY_KEY: Record<StationKey, FC> = {
  capture: VizCapture,
  retrieve: VizRetrieve,
  reason: VizReason,
  remember: VizRemember,
  guard: VizGuard,
  deliver: VizDeliver,
};

/* ============================================================
   Pipeline master view (horizontal tabs with animated flow)
   ============================================================ */
function PipelineMaster({
  active,
  setActive,
  paused,
  setPaused,
}: {
  active: number;
  setActive: (n: number) => void;
  paused: boolean;
  setPaused: (p: boolean) => void;
}) {
  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Mobile: vertical stack of tab buttons */}
      <div className="grid grid-cols-2 gap-1.5 lg:hidden">
        {STATIONS.map((s, i) => {
          const isActive = i === active;
          const S = s.Icon;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all",
                isActive
                  ? "border-accent bg-accent-soft/40 shadow-soft"
                  : "border-line bg-surface hover:border-line-strong",
              )}
              aria-pressed={isActive}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-mono font-semibold transition-colors",
                  isActive
                    ? "border-accent bg-accent text-canvas"
                    : "border-line bg-canvas text-ink-soft",
                )}
              >
                {s.number}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-ink-strong">
                  {s.short}
                </p>
                <p className="flex items-center gap-1 font-mono text-[9.5px] text-ink-muted">
                  <S className="h-2.5 w-2.5" strokeWidth={2} />
                  <span className="truncate">{s.title}</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Desktop: horizontal pipeline with animated SVG flow */}
      <div className="relative hidden lg:block">
        {/* Background flow line */}
        <svg
          viewBox="0 0 1000 40"
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-[26px] h-2 w-full"
          aria-hidden
        >
          <line
            x1="60"
            y1="20"
            x2="940"
            y2="20"
            stroke="rgb(var(--line-strong))"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          {/* Animated dot traveling the pipeline */}
          {!paused && (
            <motion.circle
              r="3"
              fill="rgb(var(--accent))"
              cy="20"
              initial={{ cx: 60 }}
              animate={{ cx: [60, 940] }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )}
        </svg>

        {/* Station buttons */}
        <div className="relative grid grid-cols-6 gap-2">
          {STATIONS.map((s, i) => {
            const isActive = i === active;
            const S = s.Icon;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={isActive}
                className="group relative flex flex-col items-center pt-0 text-center"
              >
                <span
                  className={cn(
                    "relative z-10 flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 bg-canvas transition-all duration-300",
                    isActive
                      ? "border-accent shadow-lift"
                      : "border-line group-hover:border-line-strong",
                  )}
                >
                  {/* Glow halo on active */}
                  {isActive && (
                    <motion.span
                      layoutId="station-halo"
                      className="absolute -inset-1.5 rounded-full border border-accent-soft"
                      transition={{ duration: 0.5, ease: EASE }}
                    />
                  )}
                  <S
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-accent" : "text-ink-soft",
                    )}
                    strokeWidth={isActive ? 2 : 1.6}
                  />
                </span>
                <p
                  className={cn(
                    "mt-2 font-mono text-[10px] font-semibold uppercase tracking-eyebrow transition-colors",
                    isActive ? "text-accent" : "text-ink-quiet",
                  )}
                >
                  {s.number}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-caption font-semibold tracking-tight transition-colors",
                    isActive ? "text-ink-strong" : "text-ink-muted",
                  )}
                >
                  {s.short}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Detail panel — shown for the active station
   ============================================================ */
const panelVariants: Variants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function DetailPanel({ index }: { index: number }) {
  const s = STATIONS[index];
  const Viz = VIZ_BY_KEY[s.key];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={s.key}
        variants={panelVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.45, ease: EASE }}
        className="grid gap-8 rounded-2xl border border-line bg-surface p-6 shadow-lift lg:grid-cols-[1.05fr_1fr] lg:p-10"
      >
        {/* Left: descriptive */}
        <div className="flex flex-col">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[44px] font-semibold leading-none tracking-tight text-ink-quiet/70">
              {s.number}
            </span>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-accent">
              {s.title}
            </span>
          </div>

          <h3 className="mt-4 text-h2 font-semibold tracking-tight text-ink-strong">
            {s.tagline}
          </h3>

          <p className="mt-3 text-body text-ink-muted leading-relaxed">
            {s.description}
          </p>

          {/* Sub-components */}
          <ul className="mt-6 space-y-3.5">
            {s.subs.map((sub, i) => (
              <motion.li
                key={sub.label}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                className="flex items-start gap-3"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                />
                <div>
                  <p className="text-body-sm font-medium text-ink-strong">
                    {sub.label}
                  </p>
                  <p className="mt-0.5 font-mono text-[10.5px] leading-relaxed text-ink-muted">
                    {sub.technical}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>

          {/* Spec footer */}
          <div className="mt-7 border-t border-line pt-4">
            <p className="font-mono text-[10.5px] text-ink-soft">{s.spec}</p>
          </div>
        </div>

        {/* Right: mini-viz */}
        <div className="flex flex-col rounded-xl border border-line bg-surface-alt/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-eyebrow text-ink-soft">
              <Layers className="h-3 w-3" strokeWidth={2} />
              Vista del módulo · vivo
            </span>
            <span className="flex items-center gap-1 font-mono text-[9.5px] text-ink-quiet">
              <span className="h-1.5 w-1.5 rounded-full bg-validation animate-pulse" />
              streaming
            </span>
          </div>
          <div className="flex-1">
            <Viz />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ============================================================
   Metrics strip
   ============================================================ */
const METRICS: { value: number; label: string; suffix?: string }[] = [
  { value: 51, label: "diagnósticos curados" },
  { value: 124, label: "findings estructurados" },
  { value: 124, label: "patrones multi-estudio" },
  { value: 67, label: "red flags por síntoma" },
  { value: 60, label: "estudios diagnósticos" },
  { value: 27, label: "fármacos Cuadro Básico IMSS" },
  { value: 32, label: "estados MX · priors regionales" },
  { value: 0, label: "% alucinación tolerada", suffix: "%" },
];

function MetricsStrip() {
  return (
    <div className="mt-16 border-t border-line pt-10">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-eyebrow text-ink-soft">
          Cobertura del cerebro · v0.5
        </p>
        <p className="font-mono text-[10px] text-ink-quiet">
          datos verificados contra knowledge-base.ts
        </p>
      </div>
      <div className="grid grid-cols-2 gap-y-7 sm:grid-cols-4 lg:grid-cols-8">
        {METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
          >
            <p className="font-mono text-h3 font-semibold tracking-tight text-ink-strong tabular-nums">
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

/* ============================================================
   Main component
   ============================================================ */
export function BrainArchitecture() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const sectionInView = useInView(sectionRef, { margin: "-20%" });

  // Auto-rotate every AUTOPLAY_MS while section in view & not paused
  useEffect(() => {
    if (!sectionInView || paused) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % STATIONS.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(interval);
  }, [sectionInView, paused]);

  return (
    <section
      ref={sectionRef}
      className="relative border-b border-line bg-surface-alt"
    >
      {/* Subtle blueprint grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(31,30,27,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(31,30,27,0.03) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="lg-shell relative py-24">
        {/* Heading */}
        <div className="mx-auto mb-12 max-w-3xl">
          <Eyebrow>Arquitectura clínica</Eyebrow>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Anatomía del cerebro.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">
            Seis estaciones transforman una conversación médico-paciente en una
            recomendación citada. Cada estación es inspeccionable. Cada
            recomendación lleva su referencia bibliográfica original.{" "}
            <span className="text-ink-soft">
              Auto-rota cada 6 s — pasa el cursor para detener, click para
              elegir.
            </span>
          </p>
        </div>

        {/* Pipeline tabs */}
        <PipelineMaster
          active={active}
          setActive={setActive}
          paused={paused}
          setPaused={setPaused}
        />

        {/* Detail panel */}
        <div
          className="mt-10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <DetailPanel index={active} />
        </div>

        {/* Progress dots under panel */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {STATIONS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ir a ${s.title}`}
              className="group p-1"
            >
              <span
                className={cn(
                  "block h-1 rounded-full transition-all duration-300",
                  i === active
                    ? "w-10 bg-accent"
                    : "w-5 bg-line-strong group-hover:bg-ink-quiet",
                )}
              />
            </button>
          ))}
        </div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-caption text-ink-muted"
        >
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-validation" strokeWidth={2.4} />
            Procesamiento privado por defecto
          </span>
          <span className="text-ink-quiet">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Quote className="h-3 w-3 text-validation" strokeWidth={2} />
            Cero alucinación tolerada
          </span>
          <span className="text-ink-quiet">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-accent" strokeWidth={2} />
            Cifrado en reposo · cumplimiento NOM-024
          </span>
          <span className="text-ink-quiet">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-accent" strokeWidth={2} />
            Cada paso inspeccionable
          </span>
        </motion.div>

        {/* Metrics strip */}
        <MetricsStrip />
      </div>
    </section>
  );
}
