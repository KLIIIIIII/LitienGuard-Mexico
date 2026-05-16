"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessageCircle,
  X,
  Bug,
  Lightbulb,
  Heart,
  HelpCircle,
  Send,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  enviarFeedback,
  type FeedbackInput,
  type FeedbackResult,
} from "@/app/actions/feedback";

const easeOut: number[] = [0.16, 1, 0.3, 1];

type Tipo = "bug" | "sugerencia" | "elogio" | "pregunta";
type Severidad = "baja" | "media" | "alta" | "critica";

const TIPOS: Array<{
  id: Tipo;
  label: string;
  icon: typeof Bug;
  tone: string;
}> = [
  { id: "bug", label: "Bug", icon: Bug, tone: "rose" },
  { id: "sugerencia", label: "Sugerencia", icon: Lightbulb, tone: "validation" },
  { id: "elogio", label: "Elogio", icon: Heart, tone: "warn" },
  { id: "pregunta", label: "Pregunta", icon: HelpCircle, tone: "muted" },
];

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<Tipo>("sugerencia");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [severidad, setSeveridad] = useState<Severidad>("media");
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setTitulo("");
    setDescripcion("");
    setSeveridad("media");
    setTipo("sugerencia");
    setResult(null);
  }

  function handleClose() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  function onEnviar() {
    if (descripcion.trim().length < 10) return;
    setResult(null);
    startTransition(async () => {
      const input: FeedbackInput = {
        tipo,
        severidad,
        titulo: titulo.trim() || undefined,
        descripcion: descripcion.trim(),
        url: typeof window !== "undefined" ? window.location.href : undefined,
        user_agent:
          typeof window !== "undefined"
            ? window.navigator.userAgent.slice(0, 500)
            : undefined,
      };
      const r = await enviarFeedback(input);
      setResult(r);
      if (r.status === "ok") {
        setTimeout(handleClose, 1500);
      }
    });
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.4, ease: easeOut }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-validation text-canvas shadow-lg hover:bg-validation/90 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
        style={{ boxShadow: "0 10px 30px -5px rgba(10, 139, 122, 0.4)" }}
        aria-label="Enviar feedback"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
            style={{
              background: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.35, ease: easeOut }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl bg-canvas p-5 shadow-2xl sm:p-6"
              style={{
                boxShadow: "0 25px 60px -15px rgba(0,0,0,0.4)",
              }}
            >
              <button
                type="button"
                onClick={handleClose}
                disabled={pending}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink-strong disabled:opacity-50"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" strokeWidth={2.4} />
              </button>

              <div className="space-y-4">
                <div>
                  <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
                    Cuéntanos qué piensas
                  </h2>
                  <p className="mt-1 text-caption text-ink-muted">
                    Tu feedback va directo al equipo. Respondemos en menos
                    de 48 horas.
                  </p>
                </div>

                {/* Tipo selector */}
                <div>
                  <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold mb-2">
                    Tipo
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TIPOS.map((t) => {
                      const Icon = t.icon;
                      const active = tipo === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTipo(t.id)}
                          className={`flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-2 transition-all ${
                            active
                              ? "border-validation bg-validation-soft/40"
                              : "border-line bg-surface hover:bg-surface-alt"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              active ? "text-validation" : "text-ink-quiet"
                            }`}
                            strokeWidth={2.2}
                          />
                          <span
                            className={`text-caption font-semibold ${
                              active ? "text-ink-strong" : "text-ink-muted"
                            }`}
                          >
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Título (opcional) */}
                <div>
                  <label
                    htmlFor="fb-titulo"
                    className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold"
                  >
                    Título (opcional)
                  </label>
                  <input
                    id="fb-titulo"
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    maxLength={120}
                    disabled={pending}
                    placeholder="Resumen corto"
                    className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-body-sm text-ink-strong focus:border-validation focus:outline-none"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label
                    htmlFor="fb-desc"
                    className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="fb-desc"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    disabled={pending}
                    placeholder={
                      tipo === "bug"
                        ? "Qué intentabas hacer, qué pasó, qué esperabas que pasara"
                        : tipo === "sugerencia"
                          ? "Cuéntanos tu idea o feature que te gustaría tener"
                          : tipo === "elogio"
                            ? "Qué funcionó bien, qué te gustó"
                            : "Tu pregunta"
                    }
                    className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-body-sm text-ink-strong focus:border-validation focus:outline-none resize-y"
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-caption text-ink-soft">
                      Mínimo 10 caracteres
                    </p>
                    <p className="text-caption tabular-nums text-ink-quiet">
                      {descripcion.length} / 2000
                    </p>
                  </div>
                </div>

                {/* Severidad (solo para bug) */}
                {tipo === "bug" && (
                  <div>
                    <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold mb-2">
                      Severidad
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["baja", "media", "alta", "critica"] as const).map(
                        (s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSeveridad(s)}
                            className={`rounded-md border px-2 py-1.5 text-caption font-semibold capitalize transition-colors ${
                              severidad === s
                                ? s === "critica"
                                  ? "border-rose bg-rose-soft text-rose"
                                  : s === "alta"
                                    ? "border-warn bg-warn-soft text-warn"
                                    : "border-validation bg-validation-soft text-validation"
                                : "border-line bg-surface text-ink-muted hover:bg-surface-alt"
                            }`}
                          >
                            {s}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Error */}
                {result?.status === "error" && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft/40 p-3">
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-rose"
                      strokeWidth={2}
                    />
                    <p className="text-caption text-ink-strong">
                      {result.message}
                    </p>
                  </div>
                )}

                {/* Success */}
                {result?.status === "ok" && (
                  <div className="flex items-center gap-2 rounded-lg border border-validation bg-validation-soft p-3">
                    <Check
                      className="h-4 w-4 shrink-0 text-validation"
                      strokeWidth={2.4}
                    />
                    <p className="text-caption font-semibold text-validation">
                      ¡Recibido! Gracias.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={pending}
                    className="rounded-md border border-line bg-surface px-3 py-1.5 text-caption font-semibold text-ink-strong hover:bg-surface-alt disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    type="button"
                    onClick={onEnviar}
                    disabled={pending || descripcion.trim().length < 10}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.1 }}
                    className="inline-flex items-center gap-1.5 rounded-md bg-validation px-4 py-1.5 text-caption font-semibold text-canvas hover:bg-validation/90 disabled:opacity-50"
                  >
                    {pending ? (
                      <>
                        <Loader2
                          className="h-3.5 w-3.5 animate-spin"
                          strokeWidth={2.4}
                        />
                        Enviando…
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" strokeWidth={2.4} />
                        Enviar
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
