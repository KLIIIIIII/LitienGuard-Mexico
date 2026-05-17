"use client";

import { useState, useTransition, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  Brain,
} from "lucide-react";
import { mapHeaders, importBatch } from "@/app/dashboard/import/actions";
import { parseCsv } from "@/lib/adaptive-import";
import { ENTITY_FIELDS, type EntityKey } from "@/lib/adaptive-import";

type Mapping = {
  csvColumn: string;
  targetField: string | null;
  confidence: "alta" | "media" | "baja";
  transformation: string | null;
  note: string | null;
};

type Stage = "upload" | "mapping" | "previewing" | "done";

export function AdaptiveImporter({ entity }: { entity: EntityKey }) {
  const [stage, setStage] = useState<Stage>("upload");
  const [filename, setFilename] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [overallNotes, setOverallNotes] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    rowsOk: number;
    rowsError: number;
    errors: string[];
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const fields = useMemo(() => [...ENTITY_FIELDS[entity]], [entity]);

  function reset() {
    setStage("upload");
    setFilename(null);
    setHeaders([]);
    setRows([]);
    setMappings([]);
    setOverallNotes(null);
    setWarnings([]);
    setError(null);
    setResult(null);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Archivo excede 5 MB.");
      return;
    }
    setError(null);
    setFilename(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== "string") return;
      try {
        const parsed = parseCsv(text);
        if (parsed.headers.length === 0 || parsed.rows.length === 0) {
          setError("El archivo está vacío o no tiene encabezados.");
          return;
        }
        setHeaders(parsed.headers);
        setRows(parsed.rows);
        analyze(parsed.headers, parsed.rows);
      } catch (err) {
        setError(
          err instanceof Error
            ? `No se pudo leer el CSV: ${err.message}`
            : "No se pudo leer el CSV.",
        );
      }
    };
    reader.readAsText(file);
  }

  function analyze(hdr: string[], rws: string[][]) {
    setStage("mapping");
    startTransition(async () => {
      const r = await mapHeaders({
        entity,
        headers: hdr,
        sampleRows: rws.slice(0, 5),
      });
      if (r.status === "ok") {
        setMappings(r.mapping.mappings);
        setOverallNotes(r.mapping.overallNotes);
        setWarnings(r.mapping.warnings);
      } else {
        setError(r.message);
        setStage("upload");
      }
    });
  }

  function updateMapping(csvCol: string, targetField: string | null) {
    setMappings((prev) =>
      prev.map((m) =>
        m.csvColumn === csvCol ? { ...m, targetField } : m,
      ),
    );
  }

  function onConfirm() {
    setStage("previewing");
    const rowObjects = rows.map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = r[i] ?? "";
      });
      return obj;
    });

    startTransition(async () => {
      const r = await importBatch({
        entity,
        mapping: mappings,
        rows: rowObjects,
      });
      if (r.status === "ok") {
        setResult({
          rowsOk: r.rowsOk,
          rowsError: r.rowsError,
          errors: r.errors,
        });
        setStage("done");
      } else {
        setError(r.message);
        setStage("mapping");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <ol className="flex items-center gap-2 text-caption">
        <Step n={1} label="Sube tu archivo" active={stage === "upload"} done={stage !== "upload"} />
        <div className="h-px flex-1 bg-line" />
        <Step n={2} label="Revisa mapping" active={stage === "mapping"} done={stage === "previewing" || stage === "done"} />
        <div className="h-px flex-1 bg-line" />
        <Step n={3} label="Importa" active={stage === "previewing" || stage === "done"} done={stage === "done"} />
      </ol>

      {/* Upload */}
      {stage === "upload" && (
        <section className="rounded-2xl border-2 border-dashed border-line bg-surface p-8 text-center">
          <FileSpreadsheet
            className="mx-auto h-10 w-10 text-ink-quiet mb-3"
            strokeWidth={1.6}
          />
          <p className="text-body-sm font-semibold text-ink-strong">
            Sube cualquier CSV — el sistema lo entiende
          </p>
          <p className="mt-1 max-w-md mx-auto text-caption text-ink-muted leading-relaxed">
            El asistente IA analiza las columnas que tengas (cualquier
            orden, cualquier nombre, en español o inglés) y propone cómo
            mapearlas a nuestro schema. Tú confirmas antes de importar.
          </p>
          <label
            htmlFor="csv-input"
            className="lg-cta-primary mt-5 inline-flex items-center gap-2 cursor-pointer"
          >
            <Upload className="h-4 w-4" strokeWidth={2.2} />
            Seleccionar archivo CSV
          </label>
          <input
            id="csv-input"
            type="file"
            accept=".csv,text/csv,application/vnd.ms-excel"
            onChange={onFile}
            className="hidden"
          />
          <p className="mt-3 text-caption text-ink-quiet">
            Máximo 5 MB · delimitador automático (`,` `;` `\t`)
          </p>
        </section>
      )}

      {/* Error global */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft/40 p-3"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose" strokeWidth={2} />
            <p className="text-caption text-ink-strong">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto h-5 w-5 inline-flex items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt"
              aria-label="Cerrar"
            >
              <X className="h-3 w-3" strokeWidth={2.2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mapping stage */}
      {stage === "mapping" && (
        <section className="space-y-4">
          {/* File header */}
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                  Archivo cargado
                </p>
                <p className="mt-0.5 text-body-sm font-semibold text-ink-strong">
                  {filename}
                </p>
                <p className="text-caption text-ink-muted">
                  {headers.length} columnas · {rows.length} filas
                </p>
              </div>
              <button
                type="button"
                onClick={reset}
                className="lg-cta-ghost text-caption"
                disabled={pending}
              >
                Cambiar archivo
              </button>
            </div>
          </div>

          {/* Loading state */}
          {pending && mappings.length === 0 && (
            <div className="rounded-xl border border-line bg-surface p-6 text-center">
              <Brain
                className="mx-auto h-8 w-8 text-validation animate-pulse mb-3"
                strokeWidth={2}
              />
              <p className="text-body-sm font-semibold text-ink-strong">
                Analizando estructura del CSV…
              </p>
              <p className="mt-1 text-caption text-ink-muted">
                El asistente está leyendo tus columnas y proponiendo
                mapping. ~3-5 segundos.
              </p>
            </div>
          )}

          {/* Notes from AI */}
          {overallNotes && (
            <div className="rounded-xl border border-accent/40 bg-accent-soft/30 p-4">
              <div className="flex items-start gap-2">
                <Sparkles
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  strokeWidth={2.2}
                />
                <div>
                  <p className="text-caption uppercase tracking-eyebrow text-accent font-semibold">
                    Observación del asistente
                  </p>
                  <p className="mt-1 text-body-sm text-ink-strong leading-relaxed">
                    {overallNotes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="rounded-xl border border-warn-soft bg-warn-soft/40 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0 text-warn"
                  strokeWidth={2.2}
                />
                <div className="flex-1">
                  <p className="text-caption uppercase tracking-eyebrow text-warn font-semibold">
                    Advertencias ({warnings.length})
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {warnings.map((w, i) => (
                      <li key={i} className="text-caption text-ink-strong">
                        • {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Mapping table */}
          {mappings.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              <div className="bg-surface-alt px-4 py-2.5 border-b border-line">
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                  Mapping propuesto · revisa y ajusta si quieres
                </p>
              </div>
              <ul className="divide-y divide-line-soft">
                {mappings.map((m) => {
                  const sampleValue = rows[0]?.[headers.indexOf(m.csvColumn)] ?? "";
                  return (
                    <li
                      key={m.csvColumn}
                      className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto_1fr] items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-body-sm font-semibold text-ink-strong truncate font-mono">
                          {m.csvColumn}
                        </p>
                        {sampleValue && (
                          <p className="mt-0.5 text-caption text-ink-muted truncate">
                            <span className="italic">ej.</span>{" "}
                            <code>{sampleValue.slice(0, 60)}</code>
                          </p>
                        )}
                      </div>
                      <ArrowRight
                        className="h-3.5 w-3.5 text-ink-quiet hidden sm:block"
                        strokeWidth={2}
                      />
                      <div className="flex items-center gap-2 min-w-0">
                        <select
                          value={m.targetField ?? ""}
                          onChange={(e) =>
                            updateMapping(
                              m.csvColumn,
                              e.target.value === "" ? null : e.target.value,
                            )
                          }
                          className="lg-input flex-1 text-caption"
                        >
                          <option value="">— Ignorar columna —</option>
                          {fields.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.key} — {f.desc.slice(0, 50)}
                            </option>
                          ))}
                        </select>
                        <ConfidenceBadge level={m.confidence} mapped={Boolean(m.targetField)} />
                      </div>
                      {(m.transformation || m.note) && (
                        <div className="sm:col-span-3 -mt-1.5 ml-1 text-caption text-ink-muted">
                          {m.transformation && (
                            <span className="italic">
                              ⚙ {m.transformation}
                            </span>
                          )}
                          {m.transformation && m.note && (
                            <span className="mx-1.5">·</span>
                          )}
                          {m.note && <span>{m.note}</span>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Confirm */}
          {mappings.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-caption text-ink-muted">
                {mappings.filter((m) => m.targetField).length} de{" "}
                {mappings.length} columnas mapeadas. Al importar se crearán{" "}
                <strong className="text-ink-strong">
                  {rows.length} {entity === "pacientes" ? "pacientes" : entity === "recetas" ? "recetas" : "consultas"}
                </strong>
                .
              </p>
              <button
                type="button"
                onClick={onConfirm}
                disabled={
                  pending ||
                  mappings.filter((m) => m.targetField).length === 0
                }
                className="lg-cta-primary inline-flex items-center gap-2 disabled:opacity-50"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
                ) : (
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
                )}
                Confirmar e importar {rows.length} filas
              </button>
            </div>
          )}
        </section>
      )}

      {/* Previewing */}
      {stage === "previewing" && (
        <section className="rounded-xl border border-line bg-surface p-6 text-center">
          <Loader2
            className="mx-auto h-8 w-8 text-validation animate-spin mb-3"
            strokeWidth={2}
          />
          <p className="text-body-sm font-semibold text-ink-strong">
            Importando {rows.length} filas…
          </p>
          <p className="mt-1 text-caption text-ink-muted">
            Las primeras 50-100 filas en ~10s. Mantén la pestaña abierta.
          </p>
        </section>
      )}

      {/* Done */}
      {stage === "done" && result && (
        <section
          className={`rounded-xl border-2 p-5 ${
            result.rowsError === 0
              ? "border-code-green bg-code-green-bg/30"
              : "border-warn-soft bg-warn-soft/30"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.rowsError === 0 ? (
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-code-green"
                strokeWidth={2.2}
              />
            ) : (
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-warn"
                strokeWidth={2.2}
              />
            )}
            <div className="flex-1">
              <p className="text-body-sm font-bold text-ink-strong">
                {result.rowsOk} filas importadas correctamente
                {result.rowsError > 0 && ` · ${result.rowsError} con error`}
              </p>
              {result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="text-caption font-semibold cursor-pointer text-ink-strong">
                    Ver errores ({result.errors.length})
                  </summary>
                  <ul className="mt-1.5 space-y-0.5 max-h-40 overflow-y-auto">
                    {result.errors.map((e, i) => (
                      <li key={i} className="text-caption text-ink-muted">
                        • {e}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="lg-cta-ghost text-caption"
                >
                  Importar otro archivo
                </button>
                <a
                  href={`/dashboard/${entity}`}
                  className="lg-cta-primary text-caption"
                >
                  Ver registros importados
                </a>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Step({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <li className="flex items-center gap-2 shrink-0">
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-caption font-bold ${
          done
            ? "bg-code-green text-canvas"
            : active
              ? "bg-validation text-canvas"
              : "bg-surface-alt text-ink-quiet"
        }`}
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.4} /> : n}
      </span>
      <span
        className={`text-caption ${active ? "font-semibold text-ink-strong" : done ? "text-ink-muted" : "text-ink-quiet"}`}
      >
        {label}
      </span>
    </li>
  );
}

function ConfidenceBadge({
  level,
  mapped,
}: {
  level: "alta" | "media" | "baja";
  mapped: boolean;
}) {
  if (!mapped)
    return (
      <span className="inline-flex items-center rounded-full bg-surface-alt px-2 py-0.5 text-caption text-ink-quiet">
        ignorar
      </span>
    );
  const map = {
    alta: { label: "Alta", cls: "bg-code-green-bg text-code-green" },
    media: { label: "Media", cls: "bg-code-amber-bg text-code-amber" },
    baja: { label: "Baja", cls: "bg-code-red-bg text-code-red" },
  };
  const d = map[level];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-semibold uppercase tracking-eyebrow ${d.cls}`}
      title={`Confianza ${d.label}`}
    >
      {d.label}
    </span>
  );
}
