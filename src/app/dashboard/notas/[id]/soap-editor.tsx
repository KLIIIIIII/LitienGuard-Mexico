"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Save, Trash2, AlertCircle } from "lucide-react";
import { actualizarNota, eliminarNota } from "../../scribe/actions";

type SoapFields = {
  soap_subjetivo: string;
  soap_objetivo: string;
  soap_analisis: string;
  soap_plan: string;
};

const SECTIONS: Array<{
  key: keyof SoapFields;
  letter: string;
  label: string;
  hint: string;
}> = [
  {
    key: "soap_subjetivo",
    letter: "S",
    label: "Subjetivo",
    hint: "Motivo de consulta, padecimiento actual, antecedentes.",
  },
  {
    key: "soap_objetivo",
    letter: "O",
    label: "Objetivo",
    hint: "Signos vitales, exploración física, estudios.",
  },
  {
    key: "soap_analisis",
    letter: "A",
    label: "Análisis",
    hint: "Impresión diagnóstica y diferenciales.",
  },
  {
    key: "soap_plan",
    letter: "P",
    label: "Plan",
    hint: "Tratamiento, estudios, seguimiento.",
  },
];

export function SoapEditor({
  notaId,
  initial,
  initialStatus,
  readOnly,
}: {
  notaId: string;
  initial: SoapFields;
  initialStatus: "borrador" | "firmada" | "descartada";
  readOnly: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [data, setData] = useState<SoapFields>(initial);
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const dirty =
    data.soap_subjetivo !== initial.soap_subjetivo ||
    data.soap_objetivo !== initial.soap_objetivo ||
    data.soap_analisis !== initial.soap_analisis ||
    data.soap_plan !== initial.soap_plan;

  function update(key: keyof SoapFields, value: string) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function save(nextStatus?: "borrador" | "firmada" | "descartada") {
    setError(null);
    startTransition(async () => {
      const result = await actualizarNota({
        notaId,
        ...data,
        ...(nextStatus ? { status: nextStatus } : {}),
      });
      if (result.status === "ok") {
        setLastSaved(new Date());
        if (nextStatus) setStatus(nextStatus);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  function onDelete() {
    if (
      !confirm(
        "¿Eliminar esta nota? Esta acción no se puede deshacer.",
      )
    )
      return;
    startTransition(async () => {
      await eliminarNota(notaId);
      router.push("/dashboard/notas");
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        {SECTIONS.map((s) => (
          <div key={s.key} className="lg-card space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="lg-serif-italic text-h2 font-semibold text-validation">
                  {s.letter}
                </span>
                <div>
                  <h3 className="text-h3 font-semibold text-ink-strong">
                    {s.label}
                  </h3>
                  <p className="text-caption text-ink-soft">{s.hint}</p>
                </div>
              </div>
            </div>
            <textarea
              value={data[s.key]}
              onChange={(e) => update(s.key, e.target.value)}
              rows={Math.max(4, Math.min(20, data[s.key].split("\n").length + 1))}
              disabled={readOnly || pending}
              placeholder={`(sin información en ${s.label.toLowerCase()})`}
              className="lg-input min-h-[6rem] resize-y font-mono text-body-sm leading-relaxed"
              suppressHydrationWarning
            />
          </div>
        ))}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-rose-soft bg-rose-soft px-4 py-3 text-body-sm text-ink-strong"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 text-rose" />
          <span>{error}</span>
        </div>
      )}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface/95 px-4 py-3 shadow-deep backdrop-blur-sm">
        <button
          type="button"
          onClick={() => save()}
          disabled={!dirty || pending || readOnly}
          className="lg-cta-ghost disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {pending ? "Guardando…" : "Guardar borrador"}
        </button>

        {status !== "firmada" && (
          <button
            type="button"
            onClick={() => save("firmada")}
            disabled={pending}
            className="lg-cta-primary"
          >
            <Check className="h-4 w-4" />
            Firmar nota
          </button>
        )}

        {status === "firmada" && (
          <button
            type="button"
            onClick={() => save("borrador")}
            disabled={pending}
            className="lg-cta-ghost"
          >
            Reabrir como borrador
          </button>
        )}

        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-caption text-rose hover:bg-rose-soft"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </button>

        {lastSaved && (
          <span className="text-caption text-ink-soft">
            Guardado{" "}
            {lastSaved.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
