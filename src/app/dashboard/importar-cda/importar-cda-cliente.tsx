"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import type { CdaDocumento } from "@/lib/import-from-cda";
import { previewCda, importarCda } from "./actions";

const easeOut: number[] = [0.16, 1, 0.3, 1];

export function ImportarCdaCliente() {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [doc, setDoc] = useState<CdaDocumento | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Archivo excede 2 MB.");
      return;
    }
    setFileName(file.name);
    setError(null);
    setDoc(null);
    setCreated(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") setContent(text);
    };
    reader.readAsText(file);
  }

  function onPreview() {
    setError(null);
    setCreated(null);
    startTransition(async () => {
      const r = await previewCda(content);
      if (r.status === "ok") setDoc(r.documento);
      else setError(r.message);
    });
  }

  function onImport() {
    if (!doc) return;
    setError(null);
    startTransition(async () => {
      const r = await importarCda(doc);
      if (r.status === "ok") setCreated(r.pacienteId);
      else setError(r.message);
    });
  }

  function reset() {
    setContent("");
    setFileName(null);
    setDoc(null);
    setError(null);
    setCreated(null);
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Upload */}
      <section className="lg-card space-y-3">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          1. Sube tu archivo CDA
        </h2>
        {!fileName ? (
          <label
            htmlFor="cda-input"
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface-alt/40 p-10 cursor-pointer hover:bg-surface-alt transition-colors"
          >
            <Upload className="h-8 w-8 text-ink-quiet mb-3" strokeWidth={1.8} />
            <p className="text-body-sm font-semibold text-ink-strong">
              Click para subir archivo CDA
            </p>
            <p className="mt-1 text-caption text-ink-muted">
              Extensiones: .xml .cda · máximo 2 MB
            </p>
            <input
              id="cda-input"
              type="file"
              accept=".xml,.cda,text/xml,application/xml"
              onChange={handleFile}
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

        {fileName && !doc && (
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
                <>Parsear CDA</>
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
        {created && (
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
              <div className="flex-1">
                <p className="text-body-sm font-semibold text-ink-strong">
                  Paciente importado correctamente
                </p>
                <Link
                  href={`/dashboard/pacientes/${created}`}
                  className="mt-1 inline-flex items-center gap-1 text-caption font-semibold text-validation hover:underline"
                >
                  Ver paciente →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 2: Preview */}
      <AnimatePresence>
        {doc && !created && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="space-y-4"
          >
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              2. Revisa y confirma
            </h2>

            {/* Paciente */}
            {doc.paciente ? (
              <div className="lg-card space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-validation" strokeWidth={2} />
                  <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                    Datos del paciente
                  </p>
                </div>
                <p className="text-body-sm font-semibold text-ink-strong">
                  {doc.paciente.nombre}{" "}
                  {doc.paciente.apellido_paterno ?? ""}{" "}
                  {doc.paciente.apellido_materno ?? ""}
                </p>
                <div className="grid gap-1 sm:grid-cols-2 text-caption text-ink-muted">
                  {doc.paciente.fecha_nacimiento && (
                    <p>Fecha de nacimiento: {doc.paciente.fecha_nacimiento}</p>
                  )}
                  {doc.paciente.sexo && <p>Sexo: {doc.paciente.sexo}</p>}
                  {doc.paciente.telefono && (
                    <p>Teléfono: {doc.paciente.telefono}</p>
                  )}
                  {doc.paciente.externalId && (
                    <p>ID externo: {doc.paciente.externalId}</p>
                  )}
                  {doc.fecha && <p>Fecha del documento: {doc.fecha}</p>}
                </div>
              </div>
            ) : (
              <div className="lg-card text-body-sm text-rose">
                El CDA no contiene datos del paciente — no se puede importar.
              </div>
            )}

            {/* Secciones */}
            {doc.secciones.length > 0 && (
              <div className="lg-card space-y-3">
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                  {doc.secciones.length}{" "}
                  {doc.secciones.length === 1 ? "sección clínica" : "secciones clínicas"}
                </p>
                <ul className="space-y-2">
                  {doc.secciones.slice(0, 12).map((s, i) => (
                    <li
                      key={i}
                      className="rounded border border-line bg-surface-alt/40 p-3"
                    >
                      <p className="text-body-sm font-semibold text-ink-strong">
                        {s.titulo}
                      </p>
                      {s.texto && (
                        <p className="mt-1 text-caption text-ink-muted leading-relaxed line-clamp-3">
                          {s.texto}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {doc.warnings.length > 0 && (
              <div className="rounded-lg border border-warn-soft bg-warn-soft/30 p-3">
                <p className="text-caption uppercase tracking-eyebrow font-semibold text-warn">
                  Advertencias
                </p>
                <ul className="mt-1 space-y-0.5">
                  {doc.warnings.map((w, i) => (
                    <li key={i} className="text-caption text-ink-muted">
                      • {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {doc.paciente && (
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
                  disabled={pending}
                  className="lg-cta-primary inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
                      Importando…
                    </>
                  ) : (
                    <>Importar paciente</>
                  )}
                </button>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
