"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Clock,
  Activity,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { FINDINGS } from "@/lib/inference/knowledge-base";
import type { SymptomRedFlags } from "@/lib/inference/red-flags";
import type { SimilarCase } from "@/lib/patient-memory";
import type { MultiHopResult } from "@/lib/inference/multi-hop";
import {
  analizarNotaSoap,
  type AnalizarNotaResult,
} from "./actions";

const easeOut: number[] = [0.16, 1, 0.3, 1];

export function AnalizarForm() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalizarNotaResult | null>(null);
  const [pending, startTransition] = useTransition();

  function onAnalizar() {
    if (text.trim().length < 40) return;
    setResult(null);
    startTransition(async () => {
      const r = await analizarNotaSoap(text);
      setResult(r);
    });
  }

  return (
    <div className="space-y-6">
      {/* Input */}
      <section className="lg-card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="nota-soap"
            className="text-body-sm font-semibold text-ink-strong"
          >
            Pega aquí tu nota SOAP
          </label>
          <span className="text-caption tabular-nums text-ink-quiet">
            {text.length} / 8000
          </span>
        </div>
        <textarea
          id="nota-soap"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          maxLength={8000}
          placeholder="Ejemplo:&#10;&#10;Subjetivo: Mujer de 38 años acude por palpitaciones de 3 meses, fatiga matutina, intolerancia al frío, ganancia de 6 kg sin cambio dietético...&#10;&#10;Objetivo: PA 138/88, FC 56, bocio difuso grado I...&#10;&#10;Lab: TSH 12.4, T4L 0.9...&#10;&#10;Funciona con cualquier formato que uses en tu EHR — el cerebro extrae los hallazgos automáticamente."
          disabled={pending}
          className="lg-input resize-y font-mono text-caption leading-relaxed"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-caption text-ink-soft">
            Mínimo 40 caracteres · máximo 8,000
          </p>
          <button
            type="button"
            onClick={onAnalizar}
            disabled={pending || text.trim().length < 40}
            className="lg-cta-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
                Analizando…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" strokeWidth={2.4} />
                Analizar con cerebro
              </>
            )}
          </button>
        </div>
      </section>

      {/* Error */}
      <AnimatePresence>
        {result?.status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 rounded-xl border border-rose-soft bg-rose-soft/40 p-4"
          >
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-rose"
              strokeWidth={2}
            />
            <p className="text-body-sm text-ink-strong">{result.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result?.status === "ok" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="space-y-6"
          >
            {/* Red flags banner */}
            {result.redFlags.length > 0 && (
              <RedFlagsPanel
                flags={result.redFlags}
                summary={result.redFlagsSummary}
              />
            )}

            {/* Top diferenciales */}
            <section className="lg-card space-y-3">
              <header>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-validation" strokeWidth={2} />
                  <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                    Diferencial bayesiano · Calibrado MX
                  </p>
                </div>
                <h2 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
                  Top 5 diagnósticos que explican tus hallazgos
                </h2>
                <p className="mt-1 text-caption text-ink-muted">
                  Posteriores calculados con prevalencias mexicanas. Ordenados
                  por probabilidad relativa.
                </p>
              </header>
              <div className="space-y-2 mt-3">
                {result.topDx.map((dx, idx) => {
                  const pct = Math.round(dx.posterior * 100);
                  return (
                    <motion.div
                      key={dx.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.1 + idx * 0.06,
                        ease: easeOut,
                      }}
                      className={`rounded-lg border px-3 py-2.5 ${
                        idx === 0
                          ? "border-validation bg-validation-soft/30"
                          : "border-line"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-body-sm font-semibold text-ink-strong flex-1 min-w-0">
                          {(idx + 1).toString().padStart(2, "0")} · {dx.label}
                        </p>
                        <span
                          className={`text-h3 font-bold tabular-nums shrink-0 ${
                            idx === 0 ? "text-validation" : "text-ink-muted"
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            duration: 0.6,
                            delay: 0.25 + idx * 0.06,
                          }}
                          className={`h-full rounded-full ${
                            idx === 0 ? "bg-validation" : "bg-ink-quiet"
                          }`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <Link
                href={`/dashboard/diferencial`}
                className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-validation hover:underline"
              >
                Abrir caso completo con razonamiento generativo
                <ExternalLink className="h-3 w-3" strokeWidth={2.4} />
              </Link>
            </section>

            {/* Razonamiento multi-hop (D7) */}
            {result.multiHop.chain.length > 0 && (
              <MultiHopPanel multiHop={result.multiHop} />
            )}

            {/* Casos parecidos en tu práctica (D3) */}
            {result.similarCases.length > 0 && (
              <SimilarCasesPanel cases={result.similarCases} />
            )}

            {/* Findings extraídos */}
            {result.extractions.length > 0 && (
              <section className="lg-card space-y-3">
                <header>
                  <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                    Hallazgos detectados
                  </p>
                  <h2 className="mt-1 text-h3 font-semibold tracking-tight text-ink-strong">
                    {result.extractions.length} findings extraídos de tu nota
                  </h2>
                </header>
                <ul className="space-y-1.5 mt-2">
                  {result.extractions.map((e, i) => {
                    const f = FINDINGS.find((x) => x.id === e.finding_id);
                    if (!f) return null;
                    return (
                      <motion.li
                        key={e.finding_id + i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.05 + i * 0.025 }}
                        className="flex items-start gap-2 text-body-sm"
                      >
                        <span
                          className={`mt-0.5 inline-flex items-center rounded px-1.5 py-0.5 text-[0.6rem] font-bold ${
                            e.present === true
                              ? "bg-validation-soft text-validation"
                              : e.present === false
                                ? "bg-rose-soft text-rose"
                                : "bg-surface-alt text-ink-quiet"
                          }`}
                        >
                          {e.present === true
                            ? "✓ PRES"
                            : e.present === false
                              ? "✗ AUS"
                              : "?"}
                        </span>
                        <span className="text-ink-strong">{f.label}</span>
                      </motion.li>
                    );
                  })}
                </ul>
              </section>
            )}

            <p className="text-caption text-ink-soft">
              Latencia: {result.latencyMs} ms · ID forense: {result._wm}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RedFlagsPanel({
  flags,
  summary,
}: {
  flags: SymptomRedFlags[];
  summary: { now: number; soon: number; monitor: number };
}) {
  if (flags.length === 0) return null;
  const hasUrgent = summary.now > 0;

  return (
    <section
      className={`rounded-xl border-2 p-4 sm:p-5 ${
        hasUrgent
          ? "border-rose bg-rose-soft/30"
          : "border-warn bg-warn-soft/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            hasUrgent ? "bg-rose text-canvas" : "bg-warn text-canvas"
          }`}
        >
          {hasUrgent ? (
            <AlertCircle className="h-5 w-5" strokeWidth={2.2} />
          ) : (
            <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            Red flags detectados en tu nota
          </h2>
          <p className="mt-1 text-caption text-ink-muted">
            {summary.now > 0 && (
              <>
                <strong className="font-semibold text-rose">
                  {summary.now} urgentes
                </strong>{" "}
                ·{" "}
              </>
            )}
            {summary.soon > 0 && (
              <>
                <strong className="font-semibold text-warn">
                  {summary.soon} pronto
                </strong>{" "}
                ·{" "}
              </>
            )}
            {summary.monitor > 0 && (
              <>
                <strong className="font-semibold text-ink-muted">
                  {summary.monitor} a monitorear
                </strong>
              </>
            )}
          </p>
          <div className="mt-4 space-y-3">
            {Array.isArray(flags) &&
              flags.map((symFlags) => (
                <div
                  key={symFlags.id}
                  className="rounded-lg border border-line/60 bg-surface p-3"
                >
                  <p className="text-caption uppercase tracking-eyebrow font-semibold text-ink-soft">
                    {symFlags.label}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {symFlags.flags.map((flag, fi) => (
                      <li key={fi} className="text-body-sm">
                        <div className="flex items-start gap-2">
                          <UrgencyDot urgency={flag.urgency} />
                          <div className="min-w-0">
                            <p className="font-medium text-ink-strong leading-snug">
                              {flag.flag}
                            </p>
                            <p className="mt-0.5 text-caption text-ink-muted leading-snug">
                              {flag.rationale}
                            </p>
                            {flag.ruleOut.length > 0 && (
                              <p className="mt-1 text-caption text-ink-soft">
                                Descartar:{" "}
                                {flag.ruleOut
                                  .map((r) => r.label)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MultiHopPanel({ multiHop }: { multiHop: MultiHopResult }) {
  return (
    <section className="lg-card space-y-4">
      <header>
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
          Razonamiento clínico encadenado
        </p>
        <h2 className="mt-1 text-h3 font-semibold tracking-tight text-ink-strong">
          Diagnóstico → Evidencia → Manejo
        </h2>
        <p className="mt-1 text-caption text-ink-muted">
          Tres pasos verificables por cada diagnóstico. Cada nodo cita su
          fuente. Calculado en {multiHop.latencyMs} ms.
        </p>
      </header>
      <div className="space-y-4">
        {multiHop.chain.map((node, idx) => {
          const pct = Math.round(node.dx.posterior * 100);
          return (
            <motion.article
              key={node.dx.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: 0.1 + idx * 0.08,
                ease: easeOut,
              }}
              className="rounded-xl border border-line bg-surface p-4"
            >
              {/* Hop 1 — Diagnóstico */}
              <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-validation text-canvas text-[0.6rem] font-bold">
                    1
                  </span>
                  <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                    Diagnóstico
                  </p>
                </div>
                <span className="text-h3 font-bold tabular-nums text-validation">
                  {pct}%
                </span>
              </div>
              <p className="mt-2 text-body-sm font-semibold text-ink-strong">
                {node.dx.label}
              </p>

              {/* Hop 2 — Evidencia */}
              {node.guidelines.length > 0 && (
                <>
                  <div className="mt-4 flex items-center gap-2 border-b border-line pb-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-validation text-canvas text-[0.6rem] font-bold">
                      2
                    </span>
                    <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                      Evidencia clínica
                    </p>
                  </div>
                  <ul className="mt-2 space-y-2">
                    {node.guidelines.map((g, gi) => (
                      <li
                        key={gi}
                        className="rounded border border-line/60 bg-surface-alt/40 p-2.5"
                      >
                        <p className="text-caption font-semibold text-ink-strong">
                          {g.title}
                          <span className="ml-1 font-normal text-ink-muted">
                            · {g.source} · pág. {g.page}
                          </span>
                        </p>
                        <p className="mt-1 text-caption text-ink-muted leading-relaxed">
                          {g.snippet}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Hop 3 — Manejo */}
              {(node.farmacos.length > 0 ||
                node.farmacosFueraCB.length > 0) && (
                <>
                  <div className="mt-4 flex items-center gap-2 border-b border-line pb-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-validation text-canvas text-[0.6rem] font-bold">
                      3
                    </span>
                    <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                      Manejo sugerido
                    </p>
                  </div>
                  <div className="mt-2 space-y-2">
                    {node.farmacos.length > 0 && (
                      <div>
                        <p className="text-caption font-semibold text-validation">
                          En Cuadro Básico institucional
                        </p>
                        <ul className="mt-1 space-y-1.5">
                          {node.farmacos.slice(0, 3).map((f, fi) => (
                            <li
                              key={fi}
                              className="rounded border border-validation-soft bg-validation-soft/30 p-2"
                            >
                              <p className="text-caption font-semibold text-ink-strong">
                                {f.nombreGenerico}
                              </p>
                              <p className="text-caption text-ink-muted">
                                {f.grupo} · {f.presentacionIMSS}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {node.farmacosFueraCB.length > 0 && (
                      <div>
                        <p className="text-caption font-semibold text-warn">
                          Fuera de Cuadro Básico (privado / consulta seguro)
                        </p>
                        <ul className="mt-1 space-y-1">
                          {node.farmacosFueraCB.slice(0, 2).map((f, fi) => (
                            <li
                              key={fi}
                              className="rounded border border-warn-soft bg-warn-soft/20 p-2"
                            >
                              <p className="text-caption font-semibold text-ink-strong">
                                {f.nombreGenerico}
                              </p>
                              <p className="text-caption text-ink-muted">
                                {f.grupo}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

function SimilarCasesPanel({ cases }: { cases: SimilarCase[] }) {
  return (
    <section className="lg-card space-y-3">
      <header>
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
          Casos parecidos en tu práctica
        </p>
        <h2 className="mt-1 text-h3 font-semibold tracking-tight text-ink-strong">
          {cases.length} {cases.length === 1 ? "caso similar" : "casos similares"} que ya viste
        </h2>
        <p className="mt-1 text-caption text-ink-muted">
          El cerebro encontró estos casos parecidos en tus consultas previas.
          Útil para comparar manejo y outcome.
        </p>
      </header>
      <ul className="space-y-2">
        {cases.map((c, idx) => {
          const sim = Math.round(c.similarity * 100);
          return (
            <motion.li
              key={c.source_id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.05 + idx * 0.04, ease: easeOut }}
              className="rounded-lg border border-line bg-surface p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-ink-strong line-clamp-2 leading-snug">
                    {c.content_preview ?? "Sin preview"}
                  </p>
                  <p className="mt-1 text-caption text-ink-soft">
                    {new Date(c.created_at).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-h3 font-bold tabular-nums text-validation">
                    {sim}%
                  </p>
                  <p className="text-caption text-ink-muted">similitud</p>
                </div>
              </div>
              {c.source_type === "diferencial_session" && (
                <a
                  href={`/dashboard/diferencial/${c.source_id}`}
                  className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-validation hover:underline"
                >
                  Abrir caso →
                </a>
              )}
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}

function UrgencyDot({ urgency }: { urgency: "now" | "soon" | "monitor" }) {
  const cls =
    urgency === "now"
      ? "bg-rose"
      : urgency === "soon"
        ? "bg-warn"
        : "bg-ink-quiet";
  const Icon = urgency === "now" ? AlertCircle : urgency === "soon" ? AlertTriangle : Clock;
  return (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${cls}`}
    >
      <Icon className="h-3 w-3 text-canvas" strokeWidth={2.4} />
    </span>
  );
}
