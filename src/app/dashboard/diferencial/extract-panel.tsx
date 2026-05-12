"use client";

import { useState, useTransition } from "react";
import {
  Wand2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronDown,
  Quote,
  FileText,
} from "lucide-react";
import { FINDINGS } from "@/lib/inference/knowledge-base";
import { extractFindingsFromText } from "./actions";

type ExtractedItem = {
  finding_id: string;
  present: boolean | null;
  confidence: "alta" | "media" | "baja";
  evidence: string;
};

export function ExtractPanel({
  onApply,
  hasExistingFindings,
}: {
  onApply: (extractions: Map<string, boolean | null>) => void;
  hasExistingFindings: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [extractions, setExtractions] = useState<ExtractedItem[] | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  function onExtract() {
    setError(null);
    setExtractions(null);
    startTransition(async () => {
      const r = await extractFindingsFromText(text);
      if (r.status === "ok") {
        setExtractions(r.extractions);
        setLatency(r.latencyMs);
      } else {
        setError(r.message);
      }
    });
  }

  function onApplyAll() {
    if (!extractions) return;
    if (
      hasExistingFindings &&
      !confirm(
        "Ya tienes findings marcados. ¿Sobreescribir con la extracción automática?",
      )
    ) {
      return;
    }
    const map = new Map<string, boolean | null>();
    for (const e of extractions) {
      if (e.present !== null) {
        map.set(e.finding_id, e.present);
      }
    }
    onApply(map);
    setOpen(false);
    setText("");
    setExtractions(null);
  }

  function onClear() {
    setText("");
    setExtractions(null);
    setError(null);
    setLatency(null);
  }

  const presentCount = extractions?.filter((e) => e.present === true).length ?? 0;
  const absentCount = extractions?.filter((e) => e.present === false).length ?? 0;
  const notMentionedCount =
    extractions?.filter((e) => e.present === null).length ?? 0;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border-2 border-dashed border-validation-soft bg-validation-soft/30 px-4 py-3 text-left hover:bg-validation-soft/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Wand2 className="h-5 w-5 text-validation shrink-0" strokeWidth={2} />
          <div className="flex-1">
            <p className="text-body-sm font-semibold text-ink-strong">
              Pegar nota clínica → extraer findings automáticamente
            </p>
            <p className="mt-0.5 text-caption text-ink-muted leading-snug">
              Pega H&P, transcripción de scribe o notas. El motor extrae los 29
              findings con cita verbatim. Tú revisas y aceptas.
            </p>
          </div>
          <ChevronDown
            className="h-4 w-4 text-ink-quiet shrink-0"
            strokeWidth={2.2}
          />
        </div>
      </button>
    );
  }

  return (
    <section className="lg-card space-y-4 border-2 border-validation-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-validation" strokeWidth={2} />
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            Extracción automática
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="rounded p-1 text-ink-quiet hover:bg-surface-alt hover:text-ink-strong disabled:opacity-50"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="block text-caption font-medium text-ink-strong">
          Texto clínico (H&P, transcripción, notas)
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          maxLength={8000}
          placeholder={`Ejemplo:
Paciente masculino 71 años con HFpEF dx 3 años. Refiere disnea progresiva y CTS bilateral operado 2017. ECG: bajo voltaje en miembros con QRS 4mm. Eco: HVI concéntrica 14mm con strain longitudinal apical conservado y reducido a nivel basal. PYP scan: captación grado 3 difusa. Electroforesis y FLC normales. NT-proBNP 4200 con NYHA II...`}
          disabled={pending}
          className="lg-input resize-y font-mono text-caption leading-relaxed"
        />
        <div className="flex items-center justify-between text-caption text-ink-soft">
          <span>{text.length}/8000 caracteres</span>
          {text.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              disabled={pending}
              className="text-rose hover:underline disabled:opacity-50"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong">
          <AlertCircle className="h-4 w-4 text-rose shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onExtract}
          disabled={pending || text.trim().length < 20}
          className="lg-cta-primary disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Extrayendo…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Extraer findings
            </>
          )}
        </button>
        {text.trim().length > 0 && text.trim().length < 20 && (
          <p className="text-caption text-ink-muted self-center">
            Mínimo 20 caracteres
          </p>
        )}
      </div>

      {extractions && (
        <div className="space-y-3 border-t border-line pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-validation-soft px-2 py-0.5 text-caption font-semibold text-validation">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
                {presentCount} presente{presentCount !== 1 && "s"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-soft px-2 py-0.5 text-caption font-semibold text-rose">
                <X className="h-3 w-3" strokeWidth={2.4} />
                {absentCount} ausente{absentCount !== 1 && "s"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2 py-0.5 text-caption text-ink-muted">
                <FileText className="h-3 w-3" />
                {notMentionedCount} no mencionados
              </span>
            </div>
            {latency && (
              <span className="text-caption text-ink-soft tabular-nums">
                {(latency / 1000).toFixed(1)} s
              </span>
            )}
          </div>

          {presentCount + absentCount > 0 ? (
            <ExtractionList items={extractions} />
          ) : (
            <p className="rounded-lg border border-dashed border-line bg-surface-alt/40 px-3 py-3 text-caption text-ink-muted text-center">
              No se identificaron findings en el texto. Revisa el contenido o
              marca manualmente.
            </p>
          )}

          {presentCount + absentCount > 0 && (
            <div className="flex flex-wrap gap-3 border-t border-line pt-3">
              <button
                type="button"
                onClick={onApplyAll}
                disabled={pending}
                className="lg-cta-primary disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                Aplicar al panel ({presentCount + absentCount})
              </button>
              <button
                type="button"
                onClick={() => setExtractions(null)}
                disabled={pending}
                className="lg-cta-ghost"
              >
                Descartar extracción
              </button>
            </div>
          )}
        </div>
      )}

      <p className="text-caption text-ink-soft leading-relaxed">
        La extracción es asistiva — siempre revisa cada finding antes de
        aceptar. El texto no se almacena después de procesar.
      </p>
    </section>
  );
}

function ExtractionList({ items }: { items: ExtractedItem[] }) {
  const present = items.filter((e) => e.present === true);
  const absent = items.filter((e) => e.present === false);

  return (
    <div className="space-y-3">
      {present.length > 0 && (
        <div>
          <p className="mb-2 text-caption uppercase tracking-eyebrow text-validation font-semibold">
            Detectados como presentes ({present.length})
          </p>
          <div className="space-y-1.5">
            {present.map((e) => (
              <ExtractionRow key={e.finding_id} item={e} />
            ))}
          </div>
        </div>
      )}
      {absent.length > 0 && (
        <div>
          <p className="mb-2 text-caption uppercase tracking-eyebrow text-rose font-semibold">
            Detectados como ausentes ({absent.length})
          </p>
          <div className="space-y-1.5">
            {absent.map((e) => (
              <ExtractionRow key={e.finding_id} item={e} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExtractionRow({ item }: { item: ExtractedItem }) {
  const finding = FINDINGS.find((f) => f.id === item.finding_id);
  if (!finding) return null;

  const confColor =
    item.confidence === "alta"
      ? "bg-validation-soft text-validation"
      : item.confidence === "media"
        ? "bg-warn-soft text-warn"
        : "bg-surface-alt text-ink-muted";

  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        item.present
          ? "border-validation-soft bg-validation-soft/20"
          : "border-rose-soft bg-rose-soft/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-body-sm font-medium text-ink-strong leading-tight">
          {finding.label}
        </p>
        <span
          className={`shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[0.6rem] font-bold ${confColor}`}
        >
          {item.confidence.toUpperCase()}
        </span>
      </div>
      {item.evidence && (
        <div className="mt-1.5 flex items-start gap-1.5 border-t border-line-soft pt-1.5">
          <Quote
            className="mt-0.5 h-3 w-3 shrink-0 text-ink-quiet"
            strokeWidth={2.2}
          />
          <p className="text-[0.7rem] italic text-ink-muted leading-snug">
            “{item.evidence}”
          </p>
        </div>
      )}
    </div>
  );
}
