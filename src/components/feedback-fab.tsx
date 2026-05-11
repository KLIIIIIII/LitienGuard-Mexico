"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  Send,
  AlertCircle,
  Check,
  X,
  Bug,
  Lightbulb,
  HeartHandshake,
  HelpCircle,
} from "lucide-react";
import { enviarFeedback, type FeedbackInput } from "@/app/actions/feedback";

const TIPOS: Array<{
  value: FeedbackInput["tipo"];
  label: string;
  icon: typeof Bug;
}> = [
  { value: "bug", label: "Bug / Error", icon: Bug },
  { value: "sugerencia", label: "Sugerencia", icon: Lightbulb },
  { value: "elogio", label: "Elogio", icon: HeartHandshake },
  { value: "pregunta", label: "Pregunta", icon: HelpCircle },
];

const SEVERIDADES: Array<{
  value: FeedbackInput["severidad"];
  label: string;
}> = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

export function FeedbackFab() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [tipo, setTipo] = useState<FeedbackInput["tipo"]>("bug");
  const [severidad, setSeveridad] =
    useState<FeedbackInput["severidad"]>("media");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Hide FAB on auth pages where it would distract
  const hidden =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/aviso-privacidad") ||
    pathname.startsWith("/terminos");

  useEffect(() => {
    if (!open) return;
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open]);

  function reset() {
    setTitulo("");
    setDescripcion("");
    setSeveridad("media");
    setTipo("bug");
    setError(null);
    setOk(false);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (descripcion.trim().length < 10) {
      setError("Describe el problema con al menos 10 caracteres.");
      return;
    }
    startTransition(async () => {
      const result = await enviarFeedback({
        tipo,
        severidad,
        titulo: titulo.trim() || undefined,
        descripcion: descripcion.trim(),
        url:
          typeof window !== "undefined" ? window.location.href : undefined,
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });
      if (result.status === "ok") {
        setOk(true);
        setTimeout(() => {
          setOpen(false);
          reset();
        }, 1800);
      } else {
        setError(result.message);
      }
    });
  }

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Reportar problema o sugerencia"
        className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-surface shadow-deep transition-transform hover:scale-105 sm:h-14 sm:w-14"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            ref={ref}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-line bg-surface shadow-deep"
          >
            <div className="flex items-start justify-between border-b border-line-soft px-5 py-4">
              <div>
                <p className="lg-eyebrow-validation">Reportar</p>
                <h2 className="mt-1 text-h3 font-semibold text-ink-strong">
                  Cuéntanos qué pasó
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="rounded-md p-1 text-ink-quiet hover:bg-surface-alt hover:text-ink-strong"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {ok ? (
              <div className="flex flex-col items-center px-5 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-validation-soft">
                  <Check className="h-5 w-5 text-validation" />
                </div>
                <p className="mt-3 text-body font-semibold text-ink-strong">
                  ¡Gracias!
                </p>
                <p className="mt-1 text-body-sm text-ink-muted">
                  Recibimos tu reporte. Lo revisaremos pronto.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4 px-5 py-4">
                <div className="space-y-1.5">
                  <label className="block text-caption font-medium text-ink-strong">
                    Tipo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIPOS.map((t) => {
                      const Icon = t.icon;
                      const active = tipo === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setTipo(t.value)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-body-sm transition-colors ${
                            active
                              ? "border-validation bg-validation-soft text-validation"
                              : "border-line bg-surface text-ink-strong hover:border-line-strong"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {tipo === "bug" && (
                  <div className="space-y-1.5">
                    <label className="block text-caption font-medium text-ink-strong">
                      Severidad
                    </label>
                    <div className="flex gap-2">
                      {SEVERIDADES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setSeveridad(s.value)}
                          className={`flex-1 rounded-lg border px-2 py-1.5 text-caption transition-colors ${
                            severidad === s.value
                              ? "border-warn bg-warn-soft text-warn"
                              : "border-line bg-surface text-ink-muted hover:border-line-strong"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="fb-titulo"
                    className="block text-caption font-medium text-ink-strong"
                  >
                    Título <span className="text-ink-soft">(opcional)</span>
                  </label>
                  <input
                    id="fb-titulo"
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Resumen breve"
                    className="lg-input"
                    maxLength={120}
                    disabled={pending}
                    suppressHydrationWarning
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="fb-desc"
                    className="block text-caption font-medium text-ink-strong"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="fb-desc"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="¿Qué intentabas hacer? ¿Qué pasó?"
                    rows={4}
                    className="lg-input resize-y"
                    minLength={10}
                    maxLength={2000}
                    required
                    disabled={pending}
                    suppressHydrationWarning
                  />
                  <p className="text-caption text-ink-soft">
                    Adjuntamos automáticamente la URL y tu navegador. No
                    incluyas datos identificables de pacientes.
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong"
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-rose" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="lg-cta-primary flex-1 justify-center disabled:opacity-60"
                  >
                    <Send className="h-4 w-4" />
                    {pending ? "Enviando…" : "Enviar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
