"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Pill,
  UserPlus,
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react";
import type {
  AgendaExtraction,
  RecetaExtraction,
  PacienteExtraction,
  ConsultaExtraction,
  DocumentoTipo,
  ExtractFromImageResult,
} from "@/lib/extract-from-image";
import {
  extractImage,
  guardarAgenda,
  guardarPaciente,
} from "./actions";

const easeOut: number[] = [0.16, 1, 0.3, 1];

const TIPOS: Array<{
  id: DocumentoTipo;
  label: string;
  desc: string;
  icon: typeof Calendar;
}> = [
  {
    id: "agenda",
    label: "Agenda física",
    desc: "Foto de tu libreta con citas pendientes",
    icon: Calendar,
  },
  {
    id: "receta",
    label: "Receta médica",
    desc: "Receta manuscrita o impresa para historial",
    icon: Pill,
  },
  {
    id: "paciente",
    label: "Ficha de paciente",
    desc: "Ficha demográfica en papel a tu padrón",
    icon: UserPlus,
  },
  {
    id: "consulta",
    label: "Nota de consulta",
    desc: "SOAP en papel al expediente digital",
    icon: FileText,
  },
];

export function ImportarCliente() {
  const [tipo, setTipo] = useState<DocumentoTipo | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractFromImageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen excede 10 MB. Redúcela y vuelve a intentar.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl === "string") {
        setImageDataUrl(dataUrl);
        setResult(null);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  }

  function onAnalizar() {
    if (!tipo || !imageDataUrl) return;
    setError(null);
    setResult(null);
    startTransition(async () => {
      const r = await extractImage(imageDataUrl, tipo);
      if (r.status === "error") {
        setError(r.message);
      } else {
        setResult(r.result);
        if (r.result.status === "error") {
          setError(r.result.message ?? "El cerebro no pudo procesar la imagen.");
        }
      }
    });
  }

  function reset() {
    setImageDataUrl(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      {/* Selector de tipo */}
      <section className="space-y-3">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          1. ¿Qué tipo de documento es?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TIPOS.map((t) => {
            const Icon = t.icon;
            const active = tipo === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTipo(t.id);
                  reset();
                }}
                className={`group text-left rounded-xl border-2 p-4 transition-all ${
                  active
                    ? "border-validation bg-validation-soft/40 shadow-sm"
                    : "border-line bg-surface hover:border-ink-quiet hover:bg-surface-alt"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    active
                      ? "bg-validation text-canvas"
                      : "bg-surface-alt text-ink-muted group-hover:text-ink-strong"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                </div>
                <p
                  className={`mt-2 text-body-sm font-semibold ${
                    active ? "text-ink-strong" : "text-ink-strong"
                  }`}
                >
                  {t.label}
                </p>
                <p className="mt-0.5 text-caption text-ink-muted leading-snug">
                  {t.desc}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Upload */}
      {tipo && (
        <section className="space-y-3">
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            2. Sube la foto
          </h2>
          {!imageDataUrl ? (
            <label
              htmlFor="image-input"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-surface-alt/40 p-10 cursor-pointer hover:bg-surface-alt transition-colors"
            >
              <Upload
                className="h-8 w-8 text-ink-quiet mb-3"
                strokeWidth={1.8}
              />
              <p className="text-body-sm font-semibold text-ink-strong">
                Click para subir o tomar foto
              </p>
              <p className="mt-1 text-caption text-ink-muted">
                JPG, PNG o HEIC · máximo 10 MB
              </p>
              <input
                id="image-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative rounded-xl border border-line bg-surface p-4">
              <img
                src={imageDataUrl}
                alt="Preview"
                className="mx-auto max-h-96 rounded-lg"
              />
              <button
                type="button"
                onClick={reset}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-canvas border border-line text-ink-muted hover:text-ink-strong"
                aria-label="Quitar imagen"
              >
                <X className="h-4 w-4" strokeWidth={2.4} />
              </button>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onAnalizar}
                  disabled={pending}
                  className="lg-cta-primary inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {pending ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        strokeWidth={2.4}
                      />
                      Analizando…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" strokeWidth={2.4} />
                      Analizar con cerebro
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3 rounded-xl border border-rose-soft bg-rose-soft/40 p-4"
          >
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-rose"
              strokeWidth={2}
            />
            <p className="text-body-sm text-ink-strong">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result preview */}
      <AnimatePresence>
        {result?.status === "ok" && result.data && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
                3. Revisa el preview y guarda
              </h2>
              <p className="mt-1 text-caption text-ink-muted">
                El cerebro extrajo esto en {result.latencyMs} ms. Si algo no
                te cuadra, edita los campos antes de guardar.
              </p>
            </div>
            {result.tipo === "agenda" && (
              <AgendaPreview data={result.data as AgendaExtraction} />
            )}
            {result.tipo === "receta" && (
              <RecetaPreview data={result.data as RecetaExtraction} />
            )}
            {result.tipo === "paciente" && (
              <PacientePreview data={result.data as PacienteExtraction} />
            )}
            {result.tipo === "consulta" && (
              <ConsultaPreview data={result.data as ConsultaExtraction} />
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

// =================================================================
// Preview components (editables + acción guardar)
// =================================================================

function AgendaPreview({ data }: { data: AgendaExtraction }) {
  const [citas, setCitas] = useState(data.citas);
  const [saved, setSaved] = useState(false);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function updateCita(i: number, field: string, value: string | null) {
    setCitas((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
    );
  }

  function deleteCita(i: number) {
    setCitas((prev) => prev.filter((_, idx) => idx !== i));
  }

  function onGuardar() {
    setError(null);
    startSaving(async () => {
      const r = await guardarAgenda(citas);
      if (r.status === "ok") setSaved(true);
      else setError(r.message);
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-body-sm text-ink-muted">
        {citas.length} {citas.length === 1 ? "cita detectada" : "citas detectadas"}
      </p>
      <div className="space-y-2">
        {citas.map((c, i) => (
          <div
            key={i}
            className="rounded-lg border border-line bg-surface p-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
          >
            <FieldInput
              label="Paciente"
              value={c.paciente_nombre}
              onChange={(v) => updateCita(i, "paciente_nombre", v)}
            />
            <FieldInput
              label="Fecha (YYYY-MM-DD)"
              value={c.fecha ?? ""}
              onChange={(v) => updateCita(i, "fecha", v || null)}
            />
            <FieldInput
              label="Hora (HH:MM)"
              value={c.hora ?? ""}
              onChange={(v) => updateCita(i, "hora", v || null)}
            />
            <FieldInput
              label="Teléfono"
              value={c.telefono ?? ""}
              onChange={(v) => updateCita(i, "telefono", v || null)}
            />
            <FieldInput
              label="Motivo"
              value={c.motivo ?? ""}
              onChange={(v) => updateCita(i, "motivo", v || null)}
              wide
            />
            <button
              type="button"
              onClick={() => deleteCita(i)}
              className="ml-auto text-caption font-semibold text-rose hover:underline"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>
      {error && <p className="text-caption text-rose">{error}</p>}
      <SaveButton onClick={onGuardar} saving={saving} saved={saved} />
    </div>
  );
}

function RecetaPreview({ data }: { data: RecetaExtraction }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <FieldDisplay label="Paciente" value={data.paciente_nombre} />
        <FieldDisplay label="Edad" value={data.paciente_edad?.toString() ?? null} />
        <FieldDisplay label="Fecha" value={data.fecha} />
      </div>
      <FieldDisplay label="Diagnóstico" value={data.diagnostico} />
      <div>
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold mb-2">
          Medicamentos ({data.medicamentos.length})
        </p>
        <ul className="space-y-1.5">
          {data.medicamentos.map((m, i) => (
            <li
              key={i}
              className="rounded border border-line bg-surface-alt/40 p-2 text-body-sm"
            >
              <p className="font-semibold text-ink-strong">
                {m.nombre}
                {m.presentacion && (
                  <span className="font-normal text-ink-muted">
                    {" "}
                    · {m.presentacion}
                  </span>
                )}
              </p>
              <p className="text-caption text-ink-muted">
                {[m.dosis, m.frecuencia, m.duracion, m.via]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <FieldDisplay label="Indicaciones" value={data.indicaciones} />
      <p className="text-caption text-ink-soft pt-2 border-t border-line">
        El guardado de recetas como artefacto se habilita en próxima versión —
        por ahora puedes copiar los datos a tu flujo de recetas existente.
      </p>
    </div>
  );
}

function PacientePreview({ data }: { data: PacienteExtraction }) {
  const [paciente, setPaciente] = useState(data);
  const [saved, setSaved] = useState(false);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onGuardar() {
    setError(null);
    startSaving(async () => {
      const r = await guardarPaciente(paciente);
      if (r.status === "ok") setSaved(true);
      else setError(r.message);
    });
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <FieldInput
          label="Nombre"
          value={paciente.nombre}
          onChange={(v) => setPaciente({ ...paciente, nombre: v })}
        />
        <FieldInput
          label="Apellido paterno"
          value={paciente.apellido_paterno ?? ""}
          onChange={(v) =>
            setPaciente({ ...paciente, apellido_paterno: v || null })
          }
        />
        <FieldInput
          label="Apellido materno"
          value={paciente.apellido_materno ?? ""}
          onChange={(v) =>
            setPaciente({ ...paciente, apellido_materno: v || null })
          }
        />
        <FieldInput
          label="Fecha nacimiento (YYYY-MM-DD)"
          value={paciente.fecha_nacimiento ?? ""}
          onChange={(v) =>
            setPaciente({ ...paciente, fecha_nacimiento: v || null })
          }
        />
        <FieldInput
          label="Teléfono"
          value={paciente.telefono ?? ""}
          onChange={(v) => setPaciente({ ...paciente, telefono: v || null })}
        />
        <FieldInput
          label="Email"
          value={paciente.email ?? ""}
          onChange={(v) => setPaciente({ ...paciente, email: v || null })}
        />
      </div>
      <FieldDisplay label="Alergias" value={paciente.alergias.join(", ") || null} />
      <FieldDisplay
        label="Antecedentes"
        value={paciente.antecedentes.join(", ") || null}
      />
      <FieldDisplay
        label="Medicamentos actuales"
        value={paciente.medicamentos_actuales.join(", ") || null}
      />
      {error && <p className="text-caption text-rose">{error}</p>}
      <SaveButton onClick={onGuardar} saving={saving} saved={saved} />
    </div>
  );
}

function ConsultaPreview({ data }: { data: ConsultaExtraction }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <FieldDisplay
          label="Paciente (iniciales)"
          value={data.paciente_iniciales}
        />
        <FieldDisplay label="Fecha" value={data.fecha} />
      </div>
      <FieldDisplay label="S — Subjetivo" value={data.subjetivo} multiline />
      <FieldDisplay label="O — Objetivo" value={data.objetivo} multiline />
      <FieldDisplay label="A — Análisis" value={data.analisis} multiline />
      <FieldDisplay label="P — Plan" value={data.plan} multiline />
      <p className="text-caption text-ink-soft pt-2 border-t border-line">
        El guardado de notas como artefacto SOAP se habilita en próxima versión —
        por ahora puedes copiar el contenido a una nueva nota desde scribe.
      </p>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : undefined}>
      <label className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-line bg-canvas px-2 py-1.5 text-body-sm text-ink-strong focus:border-validation focus:outline-none"
      />
    </div>
  );
}

function FieldDisplay({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
        {label}
      </p>
      <p
        className={`mt-0.5 text-body-sm text-ink-strong ${multiline ? "whitespace-pre-wrap leading-relaxed" : ""}`}
      >
        {value ?? <span className="text-ink-quiet italic">No detectado</span>}
      </p>
    </div>
  );
}

function SaveButton({
  onClick,
  saving,
  saved,
}: {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving || saved}
      className="lg-cta-primary inline-flex items-center gap-2 disabled:opacity-50"
    >
      {saving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
          Guardando…
        </>
      ) : saved ? (
        <>
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
          Guardado
        </>
      ) : (
        <>Guardar</>
      )}
    </button>
  );
}
