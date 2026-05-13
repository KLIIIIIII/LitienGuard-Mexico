"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Sparkles,
  GitFork,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Save,
  RotateCcw,
  TrendingUp,
  Eye,
  Plus,
} from "lucide-react";
import {
  procesarCasoCompleto,
  saveDiferencialSession,
  type ProcesarResult,
  type SaveDiferencialInput,
} from "./actions";
import {
  inferDifferential,
  suggestFindingsToConfirm,
} from "@/lib/inference/bayesian";
import {
  DISEASES,
  FINDINGS,
  LIKELIHOOD_RATIOS,
  findFinding,
} from "@/lib/inference/knowledge-base";
import type { FindingObservation } from "@/lib/inference/types";

type TriState = true | false | null;

interface PatientHint {
  iniciales: string | null;
  edad: number | null;
  sexo: "M" | "F" | "O" | null;
}

const CAT_LABELS: Record<string, string> = {
  ecg: "ECG",
  echo: "Eco",
  lab: "Lab",
  history: "Historia",
  exam: "Examen",
  genetic: "Genética",
};

export function DiferencialEngine({
  initialClinicalText,
  initialPatient,
  consultaId,
}: {
  initialClinicalText?: string;
  initialPatient?: PatientHint;
  consultaId?: string | null;
} = {}) {
  const router = useRouter();

  // Patient context
  const [iniciales, setIniciales] = useState(initialPatient?.iniciales ?? "");
  const [edad, setEdad] = useState<string>(
    initialPatient?.edad != null ? String(initialPatient.edad) : "",
  );
  const [sexo, setSexo] = useState<"" | "M" | "F" | "O">(
    initialPatient?.sexo ?? "",
  );

  // Inputs
  const [dxHipotesis, setDxHipotesis] = useState("");
  const [contextoClinico, setContextoClinico] = useState(
    initialClinicalText ?? "",
  );

  // Result state
  const [result, setResult] = useState<ProcesarResult | null>(null);
  const [findings, setFindings] = useState<Map<string, TriState>>(new Map());

  // Notas del médico
  const [notas, setNotas] = useState("");
  const [override, setOverride] = useState("");

  const [processing, startProcessing] = useTransition();
  const [saving, startSaving] = useTransition();
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onProcesar() {
    if (!dxHipotesis.trim() || dxHipotesis.trim().length < 2) {
      setError("Escribe tu hipótesis diagnóstica");
      return;
    }
    if (contextoClinico.trim().length < 20) {
      setError("El contexto clínico debe tener al menos 20 caracteres");
      return;
    }
    setError(null);
    setSavedId(null);

    startProcessing(async () => {
      const r = await procesarCasoCompleto({
        dxHipotesis: dxHipotesis.trim(),
        contextoClinico: contextoClinico.trim(),
      });
      if (r.status === "ok") {
        setResult(r);
        // Inicializar findings desde lo extraído
        const m = new Map<string, TriState>();
        for (const e of r.extractions) {
          if (e.present !== null) m.set(e.finding_id, e.present);
        }
        setFindings(m);
      } else {
        setError(r.message);
      }
    });
  }

  // Recálculo en vivo cuando el médico edita findings manualmente
  const liveObservations: FindingObservation[] = useMemo(
    () =>
      FINDINGS.map((f) => ({
        finding: f.id,
        present: findings.get(f.id) ?? null,
      })),
    [findings],
  );

  const liveInference = useMemo(() => {
    if (!result || result.status !== "ok") return null;
    return inferDifferential(liveObservations, DISEASES, LIKELIHOOD_RATIOS);
  }, [result, liveObservations]);

  const liveSugeridos = useMemo(() => {
    if (!result || result.status !== "ok" || !result.dxMatch.matchedId)
      return [];
    return suggestFindingsToConfirm(
      result.dxMatch.matchedId,
      liveObservations,
      8,
    );
  }, [result, liveObservations]);

  const livePosteriorPropuesto = useMemo(() => {
    if (!liveInference || !result || result.status !== "ok") return null;
    if (!result.dxMatch.matchedId) return null;
    const match = liveInference.find(
      (r) => r.disease.id === result.dxMatch.matchedId,
    );
    return match?.posterior ?? null;
  }, [liveInference, result]);

  const liveAlternativas = useMemo(() => {
    if (!liveInference || !result || result.status !== "ok") return [];
    return liveInference
      .filter((r) =>
        result.dxMatch.matchedId
          ? r.disease.id !== result.dxMatch.matchedId
          : true,
      )
      .slice(0, 5);
  }, [liveInference, result]);

  function toggleFinding(id: string) {
    setFindings((prev) => {
      const next = new Map(prev);
      const cur = next.get(id) ?? null;
      const newVal: TriState =
        cur === null ? true : cur === true ? false : null;
      if (newVal === null) next.delete(id);
      else next.set(id, newVal);
      return next;
    });
    setSavedId(null);
  }

  function onSave() {
    if (!result || result.status !== "ok") return;
    setError(null);

    const payload: SaveDiferencialInput = {
      paciente_iniciales: iniciales.trim(),
      paciente_edad: edad.trim() ? Number(edad) : null,
      paciente_sexo: sexo === "" ? null : sexo,
      contexto_clinico: contextoClinico.trim(),
      findings_observed: Array.from(findings.entries()).map(
        ([finding, present]) => ({ finding, present: present ?? null }),
      ),
      top_diagnoses: (liveInference ?? [])
        .slice(0, 5)
        .map((r) => ({
          disease: r.disease.id,
          label: r.disease.label,
          posterior: r.posterior,
        })),
      medico_diagnostico_principal: dxHipotesis.trim(),
      medico_notas: notas.trim(),
      override_razonamiento: override.trim(),
      consulta_id: consultaId ?? null,
    };

    startSaving(async () => {
      const r = await saveDiferencialSession(payload);
      if (r.status === "ok") {
        setSavedId(r.id);
        if (consultaId) {
          router.push(`/dashboard/consultas/${consultaId}`);
        } else {
          router.refresh();
        }
      } else {
        setError(r.message);
      }
    });
  }

  function onReset() {
    if (
      !confirm("¿Empezar un caso nuevo? Perderás todo lo capturado en éste.")
    )
      return;
    setDxHipotesis("");
    setContextoClinico("");
    setResult(null);
    setFindings(new Map());
    setNotas("");
    setOverride("");
    setSavedId(null);
    setError(null);
  }

  // Vista inicial — captura del caso
  if (!result || result.status !== "ok") {
    return (
      <div className="space-y-6">
        <PatientStrip
          iniciales={iniciales}
          setIniciales={setIniciales}
          edad={edad}
          setEdad={setEdad}
          sexo={sexo}
          setSexo={setSexo}
        />

        <div className="lg-card space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-validation-soft text-validation">
              <Stethoscope className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
                Paso 1 · ¿Cuál es tu hipótesis diagnóstica?
              </h2>
              <p className="mt-1 text-caption text-ink-muted">
                Lo que sospechas que tiene el paciente. El motor calculará
                la probabilidad de tu hipótesis con los hallazgos del caso y
                te mostrará diferenciales alternativos por si vale la pena
                considerar.
              </p>
            </div>
          </div>

          <input
            type="text"
            value={dxHipotesis}
            onChange={(e) => setDxHipotesis(e.target.value)}
            placeholder="Ej. amiloidosis cardiaca por transtiretina"
            maxLength={300}
            disabled={processing}
            className="lg-input text-body"
            suppressHydrationWarning
          />
        </div>

        <div className="lg-card space-y-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Sparkles className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
                Paso 2 · Pega el contexto clínico
              </h2>
              <p className="mt-1 text-caption text-ink-muted">
                Pega la historia clínica, transcripción de la consulta, o
                escribe libremente. El motor extraerá los findings con
                Claude Sonnet 4.6 y los marcará automáticamente.
              </p>
            </div>
          </div>

          <textarea
            value={contextoClinico}
            onChange={(e) => setContextoClinico(e.target.value)}
            placeholder="Ej. Hombre 72 años, disnea progresiva 8 meses, ortopnea NYHA III. ECG: voltajes bajos en periféricas, eje superior. Eco: HVI concéntrica septum 17mm, FE preservada 58%, strain longitudinal con apical sparing pattern. Lab: NT-proBNP 4200 pg/mL, troponina T 28 ng/L. Antecedente: STC bilateral hace 4 años…"
            rows={10}
            maxLength={8000}
            disabled={processing}
            className="lg-input font-mono text-body-sm leading-relaxed"
            suppressHydrationWarning
          />
          <div className="flex items-center justify-between text-caption text-ink-soft">
            <span>{contextoClinico.length} / 8000 caracteres</span>
            <span>
              Mínimo 20 caracteres ·{" "}
              {contextoClinico.trim().length >= 20 ? "✓" : "faltan"}
            </span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose bg-rose-soft px-4 py-3 text-body-sm text-ink-strong"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 text-rose" />
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onProcesar}
          disabled={
            processing ||
            !dxHipotesis.trim() ||
            contextoClinico.trim().length < 20
          }
          className="w-full lg-cta-primary justify-center text-body disabled:opacity-60"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando con Claude Sonnet 4.6…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" strokeWidth={2.2} />
              Procesar caso
            </>
          )}
        </button>

        {processing && (
          <p className="text-center text-caption text-ink-soft">
            Extrayendo hallazgos y calculando probabilidades · ~3-8 segundos
          </p>
        )}
      </div>
    );
  }

  // Vista de resultado
  const dxMatch = result.dxMatch;
  const dxIsInCatalog =
    dxMatch.matchedId !== null &&
    (dxMatch.confidence === "alta" || dxMatch.confidence === "media");

  return (
    <div className="space-y-6">
      <PatientStrip
        iniciales={iniciales}
        setIniciales={setIniciales}
        edad={edad}
        setEdad={setEdad}
        sexo={sexo}
        setSexo={setSexo}
      />

      {/* Tu hipótesis */}
      <section className="lg-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-validation-soft text-validation">
              <Stethoscope className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                Tu hipótesis
              </p>
              <h2 className="mt-0.5 text-h3 font-semibold tracking-tight text-ink-strong">
                {dxHipotesis}
              </h2>
              {dxIsInCatalog ? (
                <p className="mt-1 text-caption text-validation">
                  ✓ Mapeado a: {dxMatch.matchedLabel}{" "}
                  <span className="text-ink-soft">
                    · confianza {dxMatch.confidence}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-caption text-warn">
                  ⚠ No está en el catálogo del motor (28 enfermedades). El
                  registro se guarda igual pero sin probabilidad bayesiana
                  para tu hipótesis. {dxMatch.reasoning}
                </p>
              )}
            </div>
          </div>
          {livePosteriorPropuesto !== null && (
            <div className="text-right shrink-0">
              <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                Probabilidad
              </p>
              <p className="text-h2 font-bold text-validation">
                {Math.round(livePosteriorPropuesto * 100)}%
              </p>
            </div>
          )}
        </div>

        {livePosteriorPropuesto !== null && (
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-validation transition-all"
              style={{
                width: `${Math.max(2, livePosteriorPropuesto * 100)}%`,
              }}
            />
          </div>
        )}
      </section>

      {/* Findings sugeridos para confirmar */}
      {liveSugeridos.length > 0 && (
        <section className="lg-card">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warn-soft text-warn">
              <TrendingUp className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
                Para confirmar o descartar tu hipótesis
              </h2>
              <p className="mt-1 text-caption text-ink-muted">
                Hallazgos con mayor poder discriminativo para {dxMatch.matchedLabel}{" "}
                que aún no marcaste. Si los confirmas, la probabilidad sube;
                si los descartas, baja.
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {liveSugeridos.slice(0, 5).map((s) => (
              <li
                key={s.finding.id}
                className="flex items-start gap-3 rounded-lg border border-line bg-surface px-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => toggleFinding(s.finding.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-surface-alt transition-colors hover:border-line-strong"
                  title="Marcar como presente"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-semibold text-ink-strong">
                    {s.finding.label}
                  </p>
                  {s.finding.detail && (
                    <p className="mt-0.5 text-caption text-ink-muted">
                      {s.finding.detail}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.65rem] text-ink-soft">
                    <span>
                      LR+ <strong>{s.lrPlus.toFixed(1)}</strong>
                    </span>
                    <span>
                      LR− <strong>{s.lrMinus.toFixed(2)}</strong>
                    </span>
                    <span className="capitalize">
                      {CAT_LABELS[s.finding.category]}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Diferenciales alternativos */}
      {liveAlternativas.length > 0 && (
        <section className="lg-card">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <GitFork className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
                Diferenciales alternativos
              </h2>
              <p className="mt-1 text-caption text-ink-muted">
                Otras enfermedades que también explican los hallazgos del
                caso. Considera si alguna merece evaluación antes de cerrar
                tu hipótesis (anti-anchoring).
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {liveAlternativas.map((alt, idx) => (
              <li
                key={alt.disease.id}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5"
              >
                <span className="text-caption font-bold text-ink-soft tabular-nums w-5">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-semibold text-ink-strong">
                    {alt.disease.label}
                  </p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${Math.max(2, alt.posterior * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 tabular-nums text-body-sm font-bold text-accent">
                  {Math.round(alt.posterior * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Findings extraídos — editable */}
      <section className="lg-card">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-ink-strong">
            <Eye className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              Hallazgos detectados ({findings.size} marcados)
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              Sonnet 4.6 extrajo estos hallazgos del texto. Edítalos si hay
              error — el motor recalcula en vivo.
            </p>
          </div>
        </div>

        <FindingsList findings={findings} onToggle={toggleFinding} />
      </section>

      {/* Notas del médico */}
      <section className="lg-card">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Notas y razonamiento
        </h2>
        <p className="mt-1 text-caption text-ink-muted">
          Captura tu razonamiento clínico final, especialmente si te
          apartas del top-1 del motor (anti-anchoring trabaja en ambos
          sentidos).
        </p>
        <div className="mt-3 space-y-3">
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas clínicas, plan, próximos pasos…"
            rows={3}
            maxLength={2000}
            className="lg-input"
            suppressHydrationWarning
          />
          {liveAlternativas[0] &&
            livePosteriorPropuesto !== null &&
            liveAlternativas[0].posterior > livePosteriorPropuesto && (
              <textarea
                value={override}
                onChange={(e) => setOverride(e.target.value)}
                placeholder={`Tu hipótesis tiene menor probabilidad que ${liveAlternativas[0].disease.label}. ¿Qué te hace mantenerla?`}
                rows={2}
                maxLength={1000}
                className="lg-input border-warn-soft"
                suppressHydrationWarning
              />
            )}
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose bg-rose-soft px-4 py-3 text-body-sm text-ink-strong"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 text-rose" />
          {error}
        </div>
      )}
      {savedId && (
        <div className="flex items-start gap-2 rounded-lg border border-validation bg-validation-soft px-4 py-3 text-body-sm text-ink-strong">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-validation" />
          Caso guardado. Lo encontrarás en el historial.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          disabled={saving}
          className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong disabled:opacity-60"
        >
          <RotateCcw className="h-3 w-3" strokeWidth={2} />
          Empezar otro caso
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="lg-cta-primary disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" strokeWidth={2.2} />
          )}
          Guardar caso
        </button>
      </div>
    </div>
  );
}

// =============================================================
// Subcomponents
// =============================================================

function PatientStrip({
  iniciales,
  setIniciales,
  edad,
  setEdad,
  sexo,
  setSexo,
}: {
  iniciales: string;
  setIniciales: (v: string) => void;
  edad: string;
  setEdad: (v: string) => void;
  sexo: "" | "M" | "F" | "O";
  setSexo: (v: "" | "M" | "F" | "O") => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-alt px-4 py-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px]">
        <div>
          <label className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-ink-soft">
            Iniciales
          </label>
          <input
            type="text"
            value={iniciales}
            onChange={(e) => setIniciales(e.target.value.toUpperCase())}
            placeholder="J.P.G"
            maxLength={10}
            className="lg-input mt-1"
            suppressHydrationWarning
          />
        </div>
        <div>
          <label className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-ink-soft">
            Edad
          </label>
          <input
            type="number"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            min={0}
            max={130}
            className="lg-input mt-1"
            suppressHydrationWarning
          />
        </div>
        <div>
          <label className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-ink-soft">
            Sexo
          </label>
          <select
            value={sexo}
            onChange={(e) => setSexo(e.target.value as "" | "M" | "F" | "O")}
            className="lg-input mt-1"
          >
            <option value="">—</option>
            <option value="F">F</option>
            <option value="M">M</option>
            <option value="O">O</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function FindingsList({
  findings,
  onToggle,
}: {
  findings: Map<string, TriState>;
  onToggle: (id: string) => void;
}) {
  const presentes = Array.from(findings.entries())
    .filter(([, v]) => v === true)
    .map(([id]) => findFinding(id))
    .filter((f): f is NonNullable<typeof f> => f !== undefined);
  const ausentes = Array.from(findings.entries())
    .filter(([, v]) => v === false)
    .map(([id]) => findFinding(id))
    .filter((f): f is NonNullable<typeof f> => f !== undefined);

  return (
    <div className="mt-4 space-y-4">
      {presentes.length > 0 && (
        <div>
          <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-validation mb-2">
            Presentes ({presentes.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {presentes.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onToggle(f.id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-validation-soft px-3 py-1.5 text-caption font-medium text-validation hover:bg-validation hover:text-surface transition-colors"
                title="Click para cambiar"
              >
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {ausentes.length > 0 && (
        <div>
          <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-rose mb-2">
            Ausentes / Descartados ({ausentes.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {ausentes.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onToggle(f.id)}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-soft px-3 py-1.5 text-caption font-medium text-rose hover:bg-rose hover:text-surface transition-colors"
                title="Click para cambiar"
              >
                <XCircle className="h-3 w-3" strokeWidth={2.5} />
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {presentes.length === 0 && ausentes.length === 0 && (
        <p className="rounded-lg border border-dashed border-line bg-surface-alt px-4 py-6 text-center text-caption italic text-ink-quiet">
          El motor no extrajo findings reconocibles del texto. Si esperabas
          encontrar algo específico, marca manualmente desde el catálogo
          completo (próximamente).
        </p>
      )}
    </div>
  );
}
