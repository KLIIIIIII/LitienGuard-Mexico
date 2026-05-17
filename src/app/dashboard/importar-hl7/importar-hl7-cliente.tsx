"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Pill,
  Stethoscope,
  Activity,
  X,
} from "lucide-react";
import type { Hl7ParseResult } from "@/lib/import-from-hl7";
import { previewHl7, importarHl7 } from "./actions";

const easeOut: number[] = [0.16, 1, 0.3, 1];

export function ImportarHl7Cliente() {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<Hl7ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ creados: number; dups: number } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Archivo excede 2 MB. Divídelo en partes.");
      return;
    }
    setFileName(file.name);
    setError(null);
    setPreview(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") setContent(text);
    };
    reader.readAsText(file);
  }

  function onPreview() {
    if (!content.trim()) return;
    setError(null);
    setResult(null);
    startTransition(async () => {
      const r = await previewHl7(content);
      if (r.status === "ok") setPreview(r.result);
      else setError(r.message);
    });
  }

  function onImport() {
    if (!preview) return;
    setError(null);
    startTransition(async () => {
      const r = await importarHl7(preview.mensajes);
      if (r.status === "ok") {
        setResult({ creados: r.pacientesCreados, dups: r.pacientesDuplicados });
      } else {
        setError(r.message);
      }
    });
  }

  function reset() {
    setContent("");
    setFileName(null);
    setPreview(null);
    setError(null);
    setResult(null);
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Upload */}
      <section className="lg-card space-y-3">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          1. Sube tu archivo HL7
        </h2>
        {!fileName ? (
          <label
            htmlFor="hl7-input"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface-alt/40 p-10 cursor-pointer hover:bg-surface-alt transition-colors"
          >
            <Upload className="h-8 w-8 text-ink-quiet mb-3" strokeWidth={1.8} />
            <p className="text-body-sm font-semibold text-ink-strong">
              Click para subir archivo HL7
            </p>
            <p className="mt-1 text-caption text-ink-muted">
              Extensiones aceptadas: .hl7 .txt · máximo 2 MB
            </p>
            <input
              id="hl7-input"
              type="file"
              accept=".hl7,.txt,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-line bg-surface p-3">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-validation" strokeWidth={2} />
              <span className="text-body-sm font-semibold text-ink-strong truncate">
                {fileName}
              </span>
              <span className="text-caption text-ink-muted shrink-0">
                {(content.length / 1024).toFixed(1)} KB
              </span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink-strong"
              aria-label="Quitar"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.4} />
            </button>
          </div>
        )}

        {fileName && !preview && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onPreview}
              disabled={pending}
              className="lg-cta-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
                  Parseando…
                </>
              ) : (
                <>Parsear y mostrar preview</>
              )}
            </button>
          </div>
        )}
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
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose" strokeWidth={2} />
            <p className="text-body-sm text-ink-strong">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border-2 border-validation bg-validation-soft/40 p-4"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-validation"
                strokeWidth={2.2}
              />
              <div>
                <p className="text-body-sm font-semibold text-ink-strong">
                  Importación completada
                </p>
                <p className="mt-1 text-caption text-ink-muted">
                  {result.creados} {result.creados === 1 ? "paciente creado" : "pacientes creados"}
                  {result.dups > 0 &&
                    ` · ${result.dups} ${result.dups === 1 ? "duplicado omitido" : "duplicados omitidos"}`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 2: Preview */}
      <AnimatePresence>
        {preview && !result && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
                2. Revisa y confirma
              </h2>
              <p className="mt-1 text-caption text-ink-muted">
                Detectamos {preview.mensajes.length}{" "}
                {preview.mensajes.length === 1 ? "mensaje clínico" : "mensajes clínicos"}{" "}
                en {preview.totalSegmentos} segmentos HL7.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <KpiCard
                icon={Stethoscope}
                label="Pacientes"
                value={preview.mensajes.filter((m) => m.paciente).length}
              />
              <KpiCard
                icon={Activity}
                label="Diagnósticos"
                value={preview.mensajes.reduce(
                  (s, m) => s + m.diagnosticos.length,
                  0,
                )}
              />
              <KpiCard
                icon={Pill}
                label="Medicamentos"
                value={preview.mensajes.reduce(
                  (s, m) => s + m.medicamentos.length,
                  0,
                )}
              />
              <KpiCard
                icon={FileText}
                label="Observaciones"
                value={preview.mensajes.reduce(
                  (s, m) => s + m.observaciones.length,
                  0,
                )}
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto rounded-xl border border-line bg-surface p-3">
              {preview.mensajes.slice(0, 30).map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-line/60 bg-surface-alt/30 p-3"
                >
                  {m.paciente ? (
                    <p className="text-body-sm font-semibold text-ink-strong">
                      {m.paciente.nombre}{" "}
                      {m.paciente.apellido_paterno ?? ""}{" "}
                      {m.paciente.apellido_materno ?? ""}
                      {m.paciente.fecha_nacimiento && (
                        <span className="ml-1 font-normal text-ink-muted">
                          · {m.paciente.fecha_nacimiento}
                        </span>
                      )}
                      {m.paciente.sexo && (
                        <span className="ml-1 font-normal text-ink-muted">
                          · {m.paciente.sexo}
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-body-sm text-ink-muted italic">
                      Mensaje sin paciente (solo diagnósticos / medicamentos)
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-2 text-caption text-ink-muted">
                    {m.diagnosticos.length > 0 && (
                      <span>{m.diagnosticos.length} dx</span>
                    )}
                    {m.medicamentos.length > 0 && (
                      <span>{m.medicamentos.length} rx</span>
                    )}
                    {m.alergias.length > 0 && (
                      <span>{m.alergias.length} alergias</span>
                    )}
                    {m.observaciones.length > 0 && (
                      <span>{m.observaciones.length} obs</span>
                    )}
                  </div>
                </div>
              ))}
              {preview.mensajes.length > 30 && (
                <p className="text-center text-caption text-ink-soft py-2">
                  + {preview.mensajes.length - 30} mensajes más
                </p>
              )}
            </div>

            {preview.parseErrors.length > 0 && (
              <div className="rounded-lg border border-warn-soft bg-warn-soft/30 p-3">
                <p className="text-caption uppercase tracking-eyebrow font-semibold text-warn">
                  {preview.parseErrors.length} advertencias de parseo
                </p>
                <ul className="mt-1 space-y-0.5">
                  {preview.parseErrors.slice(0, 5).map((e, i) => (
                    <li key={i} className="text-caption text-ink-muted">
                      • {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={reset}
                disabled={pending}
                className="lg-cta-ghost"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onImport}
                disabled={pending || preview.mensajes.length === 0}
                className="lg-cta-primary inline-flex items-center gap-2 disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
                    Importando…
                  </>
                ) : (
                  <>Importar {preview.mensajes.length}{" "}
                  {preview.mensajes.length === 1 ? "paciente" : "pacientes"}</>
                )}
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Stethoscope;
  label: string;
  value: number;
}) {
  return (
    <div className="lg-card">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-validation" strokeWidth={2} />
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
          {label}
        </p>
      </div>
      <p className="mt-2 text-h2 font-bold tabular-nums text-ink-strong">
        {value}
      </p>
    </div>
  );
}
