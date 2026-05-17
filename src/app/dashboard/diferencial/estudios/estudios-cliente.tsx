"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Check,
  X,
  Loader2,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Activity,
} from "lucide-react";
import { findEstudio } from "@/lib/inference/estudios-diagnosticos";
import type {
  CategoriaEstudio,
  DisponibilidadIMSS,
} from "@/lib/inference/estudios-diagnosticos";
import type { PatronCobertura } from "@/lib/inference/motor-estudios";
import { evaluarEstudios } from "./actions";

const easeOut: number[] = [0.16, 1, 0.3, 1];

const CATEGORIA_LABELS: Record<CategoriaEstudio, string> = {
  imagenologia: "Imagenología",
  laboratorio: "Laboratorio y fluidos",
  endoscopia: "Endoscopias",
  fisiologico: "Estudios fisiológicos",
  patologia: "Patología y genética",
};

const DISPONIBILIDAD_DOTS: Record<DisponibilidadIMSS, { color: string; label: string }> = {
  rutina: { color: "bg-validation", label: "IMSS rutina" },
  limitada: { color: "bg-warn", label: "IMSS con cita" },
  "tercer-nivel": { color: "bg-rose", label: "Tercer nivel" },
  "privado-solo": { color: "bg-ink-quiet", label: "Solo privado" },
};

interface EstudioOption {
  id: string;
  nombre: string;
  categoria: CategoriaEstudio;
  descripcion: string;
  disponibilidadIMSS: DisponibilidadIMSS;
  costoPrivadoMxn: { min: number; max: number } | null;
}

interface Props {
  estudios: EstudioOption[];
  totalPatrones: number;
}

interface EstudioSeleccionado {
  estudioId: string;
  hallazgoPresente: boolean;
}

export function EstudiosCliente({ estudios, totalPatrones }: Props) {
  const [seleccionados, setSeleccionados] = useState<EstudioSeleccionado[]>([]);
  const [filtro, setFiltro] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaEstudio | "todos">(
    "todos",
  );
  const [resultados, setResultados] = useState<PatronCobertura[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtrados = useMemo(() => {
    const lower = filtro.toLowerCase();
    return estudios.filter((e) => {
      const matchCat =
        categoriaActiva === "todos" || e.categoria === categoriaActiva;
      const matchTxt =
        !lower ||
        e.nombre.toLowerCase().includes(lower) ||
        e.descripcion.toLowerCase().includes(lower);
      return matchCat && matchTxt;
    });
  }, [estudios, filtro, categoriaActiva]);

  function getSeleccion(estudioId: string): EstudioSeleccionado | undefined {
    return seleccionados.find((s) => s.estudioId === estudioId);
  }

  function setSeleccion(estudioId: string, hallazgoPresente: boolean | null) {
    setSeleccionados((prev) => {
      const otros = prev.filter((s) => s.estudioId !== estudioId);
      if (hallazgoPresente === null) return otros;
      return [...otros, { estudioId, hallazgoPresente }];
    });
    setResultados(null);
  }

  function reset() {
    setSeleccionados([]);
    setResultados(null);
    setError(null);
  }

  function onEvaluar() {
    setError(null);
    setResultados(null);
    startTransition(async () => {
      const r = await evaluarEstudios(seleccionados);
      if (r.status === "ok") setResultados(r.patrones);
      else setError(r.message);
    });
  }

  const totalSeleccionados = seleccionados.length;
  const totalPositivos = seleccionados.filter((s) => s.hallazgoPresente).length;

  return (
    <div className="space-y-6">
      {/* Resumen + acciones */}
      <section className="lg-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
              Tu selección
            </p>
            <p className="mt-1 text-body-sm font-semibold text-ink-strong">
              {totalSeleccionados} {totalSeleccionados === 1 ? "estudio" : "estudios"} marcados
              <span className="ml-2 text-validation">{totalPositivos} positivos</span>
            </p>
          </div>
          <div className="hidden sm:block text-caption text-ink-muted">
            {totalPatrones} patrones canónicos disponibles para evaluar
          </div>
        </div>
        <div className="flex gap-2">
          {totalSeleccionados > 0 && (
            <button
              type="button"
              onClick={reset}
              className="lg-cta-ghost"
            >
              Limpiar
            </button>
          )}
          <button
            type="button"
            onClick={onEvaluar}
            disabled={pending || totalPositivos === 0}
            className="lg-cta-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
                Evaluando…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" strokeWidth={2.4} />
                Buscar patrones
              </>
            )}
          </button>
        </div>
      </section>

      {/* Error */}
      <AnimatePresence>
        {error && (
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
            <p className="text-body-sm text-ink-strong">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultados */}
      <AnimatePresence>
        {resultados && resultados.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="space-y-3"
          >
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              {resultados.length}{" "}
              {resultados.length === 1
                ? "patrón detectado"
                : "patrones detectados"}
            </h2>
            {resultados.map((cob, idx) => (
              <PatronCard key={cob.patron.id} cobertura={cob} index={idx} />
            ))}
          </motion.section>
        )}
        {resultados && resultados.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg-card text-center py-8"
          >
            <Activity className="mx-auto h-8 w-8 text-ink-quiet mb-3" strokeWidth={1.8} />
            <p className="text-body-sm font-semibold text-ink-strong">
              No se detectó ningún patrón con esta combinación
            </p>
            <p className="mt-1 text-caption text-ink-muted">
              Prueba marcando más estudios con hallazgo positivo o cambia la
              selección. El motor necesita al menos 2-3 estudios para detectar
              patrones complejos.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros + búsqueda */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["todos", "imagenologia", "laboratorio", "endoscopia", "fisiologico", "patologia"] as const).map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaActiva(cat)}
                className={`rounded-full px-3 py-1.5 text-caption font-semibold transition-colors ${
                  categoriaActiva === cat
                    ? "bg-validation text-canvas"
                    : "border border-line bg-surface text-ink-strong hover:bg-surface-alt"
                }`}
              >
                {cat === "todos" ? "Todos" : CATEGORIA_LABELS[cat]}
              </button>
            ),
          )}
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-quiet"
            strokeWidth={2}
          />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar estudio por nombre o descripción"
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-body-sm text-ink-strong focus:border-validation focus:outline-none"
          />
        </div>
      </section>

      {/* Grid de estudios */}
      <section className="grid gap-2 sm:grid-cols-2">
        {filtrados.map((e) => {
          const sel = getSeleccion(e.id);
          return (
            <EstudioRow
              key={e.id}
              estudio={e}
              seleccion={sel}
              onSet={(val) => setSeleccion(e.id, val)}
            />
          );
        })}
        {filtrados.length === 0 && (
          <p className="sm:col-span-2 text-center text-caption text-ink-muted py-6">
            No hay estudios con ese filtro.
          </p>
        )}
      </section>
    </div>
  );
}

// =====================================================================
// Estudio row — selector tri-state (sin marcar / positivo / negativo)
// =====================================================================

function EstudioRow({
  estudio,
  seleccion,
  onSet,
}: {
  estudio: EstudioOption;
  seleccion: EstudioSeleccionado | undefined;
  onSet: (val: boolean | null) => void;
}) {
  const dispo = DISPONIBILIDAD_DOTS[estudio.disponibilidadIMSS];
  const isPos = seleccion?.hallazgoPresente === true;
  const isNeg = seleccion?.hallazgoPresente === false;

  return (
    <div
      className={`rounded-lg border bg-surface p-3 ${
        isPos
          ? "border-validation bg-validation-soft/30"
          : isNeg
            ? "border-line opacity-70"
            : "border-line hover:border-line-strong"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${dispo.color}`} title={dispo.label} />
            <p className="text-body-sm font-semibold text-ink-strong truncate">
              {estudio.nombre}
            </p>
          </div>
          <p className="mt-0.5 text-caption text-ink-muted line-clamp-2 leading-snug">
            {estudio.descripcion}
          </p>
          {estudio.costoPrivadoMxn && (
            <p className="mt-1 text-caption text-ink-soft">
              ~$
              {estudio.costoPrivadoMxn.min.toLocaleString("es-MX")} -
              ${estudio.costoPrivadoMxn.max.toLocaleString("es-MX")} MXN privado
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onSet(isPos ? null : true)}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
              isPos
                ? "border-validation bg-validation text-canvas"
                : "border-line bg-surface text-ink-quiet hover:bg-validation-soft hover:text-validation"
            }`}
            title="Positivo"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={() => onSet(isNeg ? null : false)}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
              isNeg
                ? "border-ink-quiet bg-ink-quiet text-canvas"
                : "border-line bg-surface text-ink-quiet hover:bg-surface-alt"
            }`}
            title="Negativo"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Pattern card — muestra qué patrón se detectó con sus estudios
// =====================================================================

function PatronCard({
  cobertura,
  index,
}: {
  cobertura: PatronCobertura;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const conf = cobertura.patron.confianza;
  const confColor =
    conf === "alta"
      ? "border-validation bg-validation-soft/30"
      : conf === "media"
        ? "border-warn bg-warn-soft/30"
        : "border-line bg-surface-alt/30";

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 + index * 0.05, ease: easeOut }}
      className={`rounded-xl border-2 ${confColor} p-4 sm:p-5`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-eyebrow ${
                conf === "alta"
                  ? "bg-validation text-canvas"
                  : conf === "media"
                    ? "bg-warn text-canvas"
                    : "bg-ink-quiet text-canvas"
              }`}
            >
              Confianza {conf}
            </span>
            <span className="text-caption text-ink-muted tabular-nums">
              {cobertura.score}% match
            </span>
          </div>
          <h3 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
            {cobertura.patron.nombre}
          </h3>
          <p className="mt-1 text-body-sm font-medium text-validation">
            → {cobertura.patron.diagnosticoLabel}
          </p>
          <p className="mt-2 text-caption text-ink-muted leading-relaxed">
            {cobertura.patron.descripcion}
          </p>
        </div>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-ink-muted transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          strokeWidth={2.2}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4 border-t border-line/60 pt-4">
              {/* Estudios favorables */}
              {cobertura.estudiosFavorables.length > 0 && (
                <div>
                  <p className="text-caption uppercase tracking-eyebrow text-validation font-semibold">
                    Estudios que apoyan este patrón ({cobertura.estudiosFavorables.length})
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {cobertura.estudiosFavorables.map((e, i) => {
                      const meta = findEstudio(e.estudioId);
                      return (
                        <li key={i} className="text-caption text-ink-strong">
                          <Check
                            className="mr-1 inline h-3 w-3 text-validation"
                            strokeWidth={2.4}
                          />
                          <span className="font-semibold">{meta?.nombre ?? e.estudioId}:</span>{" "}
                          <span className="text-ink-muted">{e.hallazgoEsperado}</span>
                          {e.requerido && (
                            <span className="ml-1 rounded bg-validation-soft px-1 text-[0.6rem] font-bold uppercase text-validation">
                              clave
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Estudios faltantes */}
              {cobertura.estudiosFaltantes.length > 0 && (
                <div>
                  <p className="text-caption uppercase tracking-eyebrow text-warn font-semibold">
                    Estudios sugeridos para confirmar ({cobertura.estudiosFaltantes.length})
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {cobertura.estudiosFaltantes.map((e, i) => {
                      const meta = findEstudio(e.estudioId);
                      return (
                        <li key={i} className="text-caption text-ink-strong">
                          <span className="mr-1 inline h-3 w-3 text-ink-quiet">○</span>
                          <span className="font-semibold">{meta?.nombre ?? e.estudioId}:</span>{" "}
                          <span className="text-ink-muted">{e.hallazgoEsperado}</span>
                          {e.requerido && (
                            <span className="ml-1 rounded bg-warn-soft px-1 text-[0.6rem] font-bold uppercase text-warn">
                              clave
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Workflow */}
              <div>
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                  Workflow sugerido
                </p>
                <ol className="mt-2 space-y-1 text-caption text-ink-strong leading-relaxed">
                  {cobertura.patron.workflowPasos.map((paso, i) => (
                    <li key={i}>{paso}</li>
                  ))}
                </ol>
              </div>

              {/* Alertas */}
              {cobertura.patron.alertas && cobertura.patron.alertas.length > 0 && (
                <div className="rounded-lg border border-rose-soft bg-rose-soft/30 p-3">
                  <p className="text-caption uppercase tracking-eyebrow text-rose font-semibold flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" strokeWidth={2.4} />
                    Alertas críticas
                  </p>
                  <ul className="mt-1 space-y-1 text-caption text-ink-strong leading-relaxed">
                    {cobertura.patron.alertas.map((a, i) => (
                      <li key={i}>• {a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
