"use client";

import { useEffect, useState, useTransition } from "react";
import {
  X,
  Check,
  AlertCircle,
  Loader2,
  CircleDollarSign,
} from "lucide-react";
import {
  submitPricingSurvey,
  dismissPricingSurvey,
} from "@/app/dashboard/pricing-survey/actions";

type Sentimiento = "caro" | "justo" | "barato";

interface Props {
  precioActualMxn: number;
  tierLabel: string;
}

/**
 * Modal proactivo de encuesta de pricing. Solo se renderiza cuando
 * el layout server-side determina que cumple las condiciones de
 * elegibilidad (días >= 3, no respondido, no descartado, tier
 * pilot/esencial). Por eso aquí no hay lógica de detección — confía
 * en que el parent decidió mostrarlo.
 */
export function PricingSurveyModal({ precioActualMxn, tierLabel }: Props) {
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();
  const [sentimiento, setSentimiento] = useState<Sentimiento | null>(null);
  const [precioJusto, setPrecioJusto] = useState<string>("");
  const [comentario, setComentario] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [step, setStep] = useState<"pregunta" | "gracias">("pregunta");

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sentimiento) {
      setErr("Selecciona una opción primero");
      return;
    }
    setErr(null);
    const parsedPrecio = precioJusto
      ? parseInt(precioJusto.replace(/[^0-9]/g, ""), 10)
      : null;
    startTransition(async () => {
      const r = await submitPricingSurvey({
        sentimiento,
        precio_justo_mxn:
          parsedPrecio && !Number.isNaN(parsedPrecio) ? parsedPrecio : null,
        comentario: comentario.trim(),
      });
      if (r.status === "ok") {
        setStep("gracias");
        setTimeout(() => setOpen(false), 2500);
      } else {
        setErr(r.message);
      }
    });
  }

  function onDismiss() {
    startTransition(async () => {
      await dismissPricingSurvey();
      setOpen(false);
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="pricing-survey-title"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-canvas shadow-deep">
        {step === "pregunta" ? (
          <form onSubmit={onSubmit}>
            <header className="flex items-start justify-between gap-3 border-b border-line bg-surface px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-validation-soft p-2 text-validation">
                  <CircleDollarSign className="h-4 w-4" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-caption uppercase tracking-eyebrow font-semibold text-validation">
                    Una pregunta rápida
                  </p>
                  <h2
                    id="pricing-survey-title"
                    className="mt-0.5 text-h3 font-semibold tracking-tight text-ink-strong"
                  >
                    ¿Cómo se siente el precio de tu plan?
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onDismiss}
                disabled={pending}
                aria-label="Cerrar encuesta"
                className="rounded-md p-1 text-ink-quiet hover:bg-surface-alt hover:text-ink-strong"
              >
                <X className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </header>

            <div className="space-y-5 px-5 py-5">
              <p className="text-body-sm text-ink-muted leading-relaxed">
                Tu plan{" "}
                <span className="font-semibold text-ink-strong">
                  {tierLabel}
                </span>{" "}
                cuesta{" "}
                <span className="font-semibold text-ink-strong">
                  MXN {precioActualMxn}/mes
                </span>
                . Tu respuesta nos ayuda a ajustar precios antes del
                lanzamiento comercial. Toma 30 segundos.
              </p>

              <fieldset className="space-y-2">
                <legend className="text-caption font-medium text-ink-strong">
                  Para lo que ofrecemos, este precio se siente:
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {(["caro", "justo", "barato"] as Sentimiento[]).map((s) => {
                    const active = sentimiento === s;
                    const label =
                      s === "caro"
                        ? "Caro"
                        : s === "justo"
                          ? "Justo"
                          : "Barato";
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSentimiento(s)}
                        disabled={pending}
                        className={`rounded-lg border px-3 py-2.5 text-body-sm font-semibold transition-all ${
                          active
                            ? s === "caro"
                              ? "border-rose bg-rose-soft text-rose"
                              : s === "barato"
                                ? "border-validation bg-validation-soft text-validation"
                                : "border-accent bg-accent-soft text-accent"
                            : "border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink-strong"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="space-y-1.5">
                <label
                  htmlFor="precio-justo"
                  className="block text-caption font-medium text-ink-strong"
                >
                  ¿Cuál sería el precio mensual que sí pagarías sin dudar?{" "}
                  <span className="text-ink-soft">(opcional, en MXN)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
                    MXN
                  </span>
                  <input
                    id="precio-justo"
                    type="text"
                    inputMode="numeric"
                    value={precioJusto}
                    onChange={(e) =>
                      setPrecioJusto(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="499"
                    className="lg-input pl-14"
                    disabled={pending}
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="comentario"
                  className="block text-caption font-medium text-ink-strong"
                >
                  ¿Algo más?{" "}
                  <span className="text-ink-soft">(opcional)</span>
                </label>
                <textarea
                  id="comentario"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={3}
                  maxLength={800}
                  placeholder="Lo más útil para ti / lo que falta / qué cambiarías..."
                  className="lg-input resize-y"
                  disabled={pending}
                  suppressHydrationWarning
                />
              </div>

              {err && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-rose" />
                  <span>{err}</span>
                </div>
              )}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3">
              <button
                type="button"
                onClick={onDismiss}
                disabled={pending}
                className="text-caption text-ink-muted hover:text-ink-strong disabled:opacity-60"
              >
                Ahora no
              </button>
              <button
                type="submit"
                disabled={pending || !sentimiento}
                className="lg-cta-primary disabled:opacity-60"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Enviar respuesta
                  </>
                )}
              </button>
            </footer>
          </form>
        ) : (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-validation-soft">
              <Check
                className="h-6 w-6 text-validation"
                strokeWidth={2.4}
              />
            </div>
            <h2 className="mt-4 text-h3 font-semibold text-ink-strong">
              Gracias
            </h2>
            <p className="mt-1 max-w-sm text-body-sm text-ink-muted">
              Tu respuesta queda registrada. La usamos para ajustar precios
              antes del lanzamiento comercial.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
