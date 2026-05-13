"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Loader2,
  FileText,
  Eye,
} from "lucide-react";
import { setPdfBranding } from "./actions";

export function PdfBrandingForm({
  currentTitulo,
  currentSubtitulo,
  consultorioNombre,
}: {
  currentTitulo: string | null;
  currentSubtitulo: string | null;
  consultorioNombre: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [titulo, setTitulo] = useState(currentTitulo ?? "");
  const [subtitulo, setSubtitulo] = useState(currentSubtitulo ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Preview values — lo que se va a ver en el PDF
  const previewTitulo = titulo.trim() || "LitienGuard";
  const previewSubtitulo =
    subtitulo.trim() ||
    (titulo.trim()
      ? consultorioNombre ?? ""
      : "Inteligencia médica para México");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    startTransition(async () => {
      const r = await setPdfBranding({
        titulo: titulo.trim() || null,
        subtitulo: subtitulo.trim() || null,
      });
      if (r.status === "ok") {
        setOk(true);
        router.refresh();
      } else {
        setErr(r.message);
      }
    });
  }

  function resetToDefault() {
    setTitulo("");
    setSubtitulo("");
  }

  return (
    <form onSubmit={onSubmit} className="lg-card space-y-5">
      <div>
        <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
          Branding de PDFs
        </h2>
        <p className="mt-1 text-body-sm text-ink-muted">
          Personaliza el encabezado de los PDFs que reciben tus pacientes
          (SOAP, recetas, odontograma, diferencial). Por default usan el
          nombre de LitienGuard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="pdf-titulo"
            className="block text-caption font-medium text-ink-strong"
          >
            Título del encabezado
          </label>
          <input
            id="pdf-titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder={consultorioNombre ?? "Clínica Dental [tu nombre]"}
            maxLength={80}
            className="lg-input"
            disabled={pending}
            suppressHydrationWarning
          />
          <p className="text-caption text-ink-soft">
            Aparece grande en la parte superior del PDF. Déjalo vacío para
            usar &ldquo;LitienGuard&rdquo;.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="pdf-subtitulo"
            className="block text-caption font-medium text-ink-strong"
          >
            Subtítulo (opcional)
          </label>
          <input
            id="pdf-subtitulo"
            type="text"
            value={subtitulo}
            onChange={(e) => setSubtitulo(e.target.value)}
            placeholder="Atención dental integral"
            maxLength={120}
            className="lg-input"
            disabled={pending}
            suppressHydrationWarning
          />
          <p className="text-caption text-ink-soft">
            Línea descriptiva debajo del título.
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-dashed border-line bg-surface-alt p-5">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="h-3.5 w-3.5 text-ink-soft" strokeWidth={2} />
          <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft">
            Vista previa del header
          </p>
        </div>
        <div className="rounded-lg border-2 border-ink bg-canvas p-5">
          <div className="border-b-2 border-ink pb-3">
            <p className="text-[0.55rem] uppercase tracking-[0.16em] font-bold text-validation">
              {titulo.trim() ? "Documento clínico" : "LitienGuard · Documento clínico"}
            </p>
            <p className="mt-1 text-[1.4rem] font-bold tracking-tight text-ink-strong leading-none">
              {previewTitulo}
            </p>
            {previewSubtitulo && (
              <p className="mt-1 text-[0.65rem] text-ink-muted">
                {previewSubtitulo}
              </p>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <FileText
              className="h-3 w-3 text-ink-quiet"
              strokeWidth={2}
            />
            <p className="text-[0.6rem] italic text-ink-quiet">
              [Contenido del PDF: SOAP, receta, odontograma…]
            </p>
          </div>
        </div>
        <p className="mt-3 text-caption text-ink-soft leading-relaxed">
          El footer mantiene siempre &ldquo;Estructura conforme NOM-024-SSA3 ·
          LFPDPPP&rdquo; por cumplimiento legal.
        </p>
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
      {ok && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-validation bg-validation-soft px-3 py-2 text-caption text-ink-strong"
        >
          <Check className="h-3.5 w-3.5 text-validation" />
          <span>
            Branding guardado. Los próximos PDFs usarán este encabezado.
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="lg-cta-primary disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando…
            </>
          ) : (
            "Guardar branding"
          )}
        </button>
        {(titulo || subtitulo) && (
          <button
            type="button"
            onClick={resetToDefault}
            disabled={pending}
            className="text-caption text-ink-muted hover:text-ink-strong disabled:opacity-60"
          >
            Volver al default LitienGuard
          </button>
        )}
      </div>
    </form>
  );
}
