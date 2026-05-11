"use client";

import { useEffect, useState } from "react";
import { Download, Save, RotateCcw } from "lucide-react";
import {
  Odontogram,
  TOOTH_STATES,
  defaultOdontogram,
  type OdontogramState,
  type ToothState,
} from "@/components/odontogram";

const STORAGE_KEY = "litienguard.odontogram.draft";

interface DraftPayload {
  paciente: string;
  fecha: string;
  notas: string;
  state: OdontogramState;
  savedAt: string;
}

export function OdontogramEditor({ medicoEmail }: { medicoEmail: string }) {
  const [activeState, setActiveState] = useState<ToothState>("caries");
  const [state, setState] = useState<OdontogramState>(defaultOdontogram());
  const [paciente, setPaciente] = useState("");
  const [fecha, setFecha] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [notas, setNotas] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Restore draft from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as DraftPayload;
      if (draft.state) setState(draft.state);
      if (draft.paciente) setPaciente(draft.paciente);
      if (draft.fecha) setFecha(draft.fecha);
      if (draft.notas) setNotas(draft.notas);
      if (draft.savedAt) setSavedAt(draft.savedAt);
    } catch (e) {
      console.warn("[odontogram] restore failed:", e);
    }
  }, []);

  function onSaveDraft() {
    const now = new Date().toISOString();
    const payload: DraftPayload = { paciente, fecha, notas, state, savedAt: now };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSavedAt(now);
  }

  function onReset() {
    if (!confirm("¿Limpiar el odontograma y empezar de nuevo?")) return;
    setState(defaultOdontogram());
    setPaciente("");
    setNotas("");
    setSavedAt(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  async function onExportPdf() {
    onSaveDraft();
    const params = new URLSearchParams({
      paciente,
      fecha,
      notas,
      medico: medicoEmail,
      state: JSON.stringify(state),
    });
    window.open(`/api/odontograma/pdf?${params.toString()}`, "_blank");
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
          Dental
        </p>
        <h1 className="mt-1 text-h1 font-semibold tracking-tight text-ink-strong">
          Odontograma
        </h1>
        <p className="mt-2 max-w-2xl text-body-sm text-ink-muted">
          Marca cada pieza con su estado actual. El registro queda guardado
          localmente en este dispositivo y se exporta a PDF listo para imprimir
          y firmar con el paciente.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="paciente"
            className="block text-caption font-medium text-ink-strong"
          >
            Paciente
          </label>
          <input
            id="paciente"
            type="text"
            value={paciente}
            onChange={(e) => setPaciente(e.target.value)}
            placeholder="Nombre completo"
            maxLength={120}
            className="lg-input"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="fecha"
            className="block text-caption font-medium text-ink-strong"
          >
            Fecha
          </label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="lg-input"
          />
        </div>
      </div>

      <div>
        <p className="text-caption font-medium text-ink-strong mb-2">
          Selecciona el estado a aplicar (click una pieza dental para marcarla):
        </p>
        <div className="flex flex-wrap gap-2">
          {TOOTH_STATES.map((s) => {
            const isActive = activeState === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setActiveState(s.value)}
                className={`flex items-center gap-2 rounded-lg border-2 px-3 py-1.5 text-caption font-medium transition-all ${
                  isActive
                    ? "border-validation bg-validation-soft text-validation"
                    : "border-line bg-surface text-ink-muted hover:border-line-strong"
                }`}
              >
                <span
                  className="h-3 w-3 rounded-sm border"
                  style={{
                    backgroundColor: s.fill,
                    borderColor: s.border,
                    borderStyle: s.value === "ausente" ? "dashed" : "solid",
                  }}
                />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <Odontogram
        state={state}
        onChange={setState}
        activeState={activeState}
      />

      <div>
        <label
          htmlFor="notas"
          className="block text-caption font-medium text-ink-strong"
        >
          Notas y plan de tratamiento
        </label>
        <textarea
          id="notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Hallazgos relevantes, plan de tratamiento, secuencia recomendada, costos estimados, observaciones..."
          rows={5}
          className="lg-input mt-1.5 resize-y"
          maxLength={2000}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSaveDraft}
          className="lg-cta-ghost"
        >
          <Save className="h-4 w-4" />
          Guardar borrador
        </button>
        <button
          type="button"
          onClick={onExportPdf}
          disabled={!paciente.trim()}
          className="lg-cta-primary disabled:opacity-50"
          title={paciente.trim() ? "Exportar PDF" : "Captura el nombre del paciente primero"}
        >
          <Download className="h-4 w-4" />
          Exportar PDF para firma
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-body-sm text-ink-muted hover:bg-surface-alt"
        >
          <RotateCcw className="h-4 w-4" />
          Reiniciar
        </button>
        {savedAt && (
          <span className="text-caption text-ink-soft">
            Guardado · {new Date(savedAt).toLocaleString("es-MX")}
          </span>
        )}
      </div>

      <p className="text-caption text-ink-soft leading-relaxed max-w-2xl">
        El borrador se guarda únicamente en este navegador (no se sincroniza
        entre dispositivos en esta versión). El PDF generado puede imprimirse
        para firma física del paciente conforme lo requiere la NOM-024-SSA3 y
        la práctica fiscal mexicana.
      </p>
    </div>
  );
}
