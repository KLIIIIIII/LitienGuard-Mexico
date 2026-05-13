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
  ChevronDown,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import {
  procesarCasoCompleto,
  saveDiferencialSession,
  type ProcesarResult,
  type SaveDiferencialInput,
  type DiferencialHibrido,
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

const NIVEL_STYLES: Record<
  "alta" | "media" | "baja",
  { bg: string; text: string; label: string }
> = {
  alta: {
    bg: "bg-validation-soft",
    text: "text-validation",
    label: "Alta sospecha",
  },
  media: { bg: "bg-warn-soft", text: "text-warn", label: "Sospecha media" },
  baja: { bg: "bg-surface-alt", text: "text-ink-muted", label: "Considerar" },
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

  const [iniciales, setIniciales] = useState(initialPatient?.iniciales ?? "");
  const [edad, setEdad] = useState<string>(
    initialPatient?.edad != null ? String(initialPatient.edad) : "",
  );
  const [sexo, setSexo] = useState<"" | "M" | "F" | "O">(
    initialPatient?.sexo ?? "",
  );

  const [dxHipotesis, setDxHipotesis] = useState("");
  const [contextoClinico, setContextoClinico] = useState(
    initialClinicalText ?? "",
  );

  const [result, setResult] = useState<ProcesarResult | null>(null);
  const [findings, setFindings] = useState<Map<string, TriState>>(new Map());
  const [notas, setNotas] = useState("");
  const [override, setOverride] = useState("");
  const [expandedDx, setExpandedDx] = useState<string | null>(null);

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
        const m = new Map<string, TriState>();
        for (const e of r.extractions) {
          if (e.present !== null) m.set(e.finding_id, e.present);
        }
        setFindings(m);
        setExpandedDx(null);
      } else {
        setError(r.message);
      }
    });
  }

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

  const livePosteriorPropuesto = useMemo(() => {
    if (!liveInference || !result || result.status !== "ok") return null;
    if (!result.dxMatch.matchedId) return null;
    const match = liveInference.find(
      (r) => r.disease.id === result.dxMatch.matchedId,
    );
    return match?.posterior ?? null;
  }, [liveInference, result]);

  // Re-overlay bayesian onto LLM-generated differentials when findings change
  const liveDiferenciales: DiferencialHibrido[] = useMemo(() => {
    if (!result || result.status !== "ok") return [];
    return result.diferenciales.map((d) => {
      if (!d.idCatalogo) return d;
      const m = liveInference?.find((r) => r.disease.id === d.idCatalogo);
      return { ...d, posterior: m?.posterior ?? d.posterior };
    });
  }, [result, liveInference]);

  const liveSugeridos = useMemo(() => {
    if (!result || result.status !== "ok" || !result.dxMatch.matchedId)
      return [];
    return suggestFindingsToConfirm(
      result.dxMatch.matchedId,
      liveObservations,
      6,
    );
  }, [result, liveObservations]);

  function setFindingState(id: string, state: TriState) {
    setFindings((prev) => {
      const next = new Map(prev);
      if (state === null) next.delete(id);
      else next.set(id, state);
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
      top_diagnoses: liveDiferenciales.slice(0, 5).map((d) => ({
        disease: d.idCatalogo ?? d.nombre,
        label: d.nombre,
        posterior: d.posterior ?? 0,
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
    setExpandedDx(null);
    setSavedId(null);
    setError(null);
  }

  // ============ Vista inicial ============
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
                Escribe lo que sospechas. El motor analizará el caso
                completo y te dirá si tu hipótesis encaja con los hallazgos,
                qué diferenciales podrías estar pasando por alto, y qué
                estudios faltan confirmar.
              </p>
            </div>
          </div>

          <input
            type="text"
            value={dxHipotesis}
            onChange={(e) => setDxHipotesis(e.target.value)}
            placeholder="Ej. amiloidosis cardiaca, enfermedad de Whipple, lupus seronegativo, linfoma de células T…"
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
                Paso 2 · Pega el contexto clínico completo
              </h2>
              <p className="mt-1 text-caption text-ink-muted">
                Historia, exploración, laboratorios, estudios de imagen,
                biopsia — todo lo que tengas. Cuanto más contexto, mejor el
                razonamiento del motor. Acepta texto libre.
              </p>
            </div>
          </div>

          <textarea
            value={contextoClinico}
            onChange={(e) => setContextoClinico(e.target.value)}
            placeholder={`Ej.\nVarón 47 años, 4 años artralgias migratorias, mala respuesta a AINE/MTX. 9 meses diarrea crónica + esteatorrea + pérdida 14 kg. 3 meses deterioro cognitivo, ataxia. Examen: IMC 18.2, hiperpigmentación, oftalmoplejía. Lab: anemia, albúmina 2.4, PCR/VSG elevadas. TAC: adenopatías mesentéricas, engrosamiento intestino delgado. Biopsia duodenal: macrófagos PAS+. PCR Tropheryma whipplei positiva.`}
            rows={10}
            maxLength={8000}
            disabled={processing}
            className="lg-input font-mono text-body-sm leading-relaxed"
            suppressHydrationWarning
          />
          <div className="flex items-center justify-between text-caption text-ink-soft">
            <span>{contextoClinico.length} / 8000 caracteres</span>
            <span>
              Mínimo 20 ·{" "}
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
              Procesando con LG Motor…
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
            Generando diferenciales · extrayendo hallazgos · calculando
            probabilidades · ~6-12 segundos
          </p>
        )}
      </div>
    );
  }

  // ============ Vista de resultado ============
  const dxMatch = result.dxMatch;
  const dxIsInCatalog =
    dxMatch.matchedId !== null &&
    (dxMatch.confidence === "alta" || dxMatch.confidence === "media");
  const evalHipotesis = result.evaluacionHipotesis;

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

      {/* Evaluación honesta de tu hipótesis (anti-anchoring) */}
      {!evalHipotesis.encajaConContexto && (
        <section className="rounded-xl border-2 border-warn bg-warn-soft/60 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warn text-surface">
              <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
                Tu hipótesis no parece encajar con el contexto
              </h2>
              <p className="mt-1 text-body-sm text-ink-strong leading-relaxed">
                {evalHipotesis.razonamiento}
              </p>
              <p className="mt-2 text-caption text-ink-muted">
                Revisa los diferenciales sugeridos abajo — el motor encontró
                hipótesis con mejor encaje clínico.
              </p>
            </div>
          </div>
        </section>
      )}

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
                  ✓ En catálogo bayesiano: {dxMatch.matchedLabel}
                </p>
              ) : (
                <p className="mt-1 text-caption text-ink-muted">
                  Fuera del catálogo bayesiano de 28 enfermedades — el
                  análisis se hace por razonamiento LLM sobre el contexto.
                </p>
              )}
              {evalHipotesis.encajaConContexto &&
                evalHipotesis.posicionEnRanking !== null && (
                  <p className="mt-1 text-caption text-validation">
                    Posición en ranking del motor: #
                    {evalHipotesis.posicionEnRanking}
                  </p>
                )}
            </div>
          </div>
          {livePosteriorPropuesto !== null && (
            <div className="text-right shrink-0">
              <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                Probabilidad bayesiana
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

      {/* Findings sugeridos para confirmar (del catálogo bayesiano, solo si Dx está en catálogo) */}
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
                Hallazgos del catálogo con mayor poder discriminativo para{" "}
                {dxMatch.matchedLabel}. Click ✓ si está presente, ✗ si está
                ausente, o ? para no marcar.
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {liveSugeridos.slice(0, 5).map((s) => {
              const state = findings.get(s.finding.id) ?? null;
              return (
                <li
                  key={s.finding.id}
                  className="flex items-start gap-3 rounded-lg border border-line bg-surface px-3 py-2.5"
                >
                  <div className="flex shrink-0 gap-1">
                    <TriToggleButton
                      active={state === true}
                      onClick={() =>
                        setFindingState(s.finding.id, state === true ? null : true)
                      }
                      tone="validation"
                      icon={<CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />}
                      title="Presente"
                    />
                    <TriToggleButton
                      active={state === false}
                      onClick={() =>
                        setFindingState(s.finding.id, state === false ? null : false)
                      }
                      tone="rose"
                      icon={<XCircle className="h-3 w-3" strokeWidth={2.5} />}
                      title="Ausente"
                    />
                  </div>
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
              );
            })}
          </ul>
        </section>
      )}

      {/* Diferenciales — generados por LLM con razonamiento explícito */}
      {liveDiferenciales.length > 0 && (
        <section className="lg-card">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <GitFork className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
                Diferenciales del motor
              </h2>
              <p className="mt-1 text-caption text-ink-muted">
                Generados por LG Motor razonando sobre el contexto
                completo. Click en cada uno para ver razonamiento clínico y
                qué estudios faltan confirmar.
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {liveDiferenciales.map((d, idx) => {
              const niv = NIVEL_STYLES[d.nivelSospecha];
              const expanded = expandedDx === `${idx}-${d.nombre}`;
              return (
                <li
                  key={`${idx}-${d.nombre}`}
                  className="rounded-lg border border-line bg-surface overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedDx(expanded ? null : `${idx}-${d.nombre}`)
                    }
                    className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-surface-alt transition-colors"
                  >
                    <span className="text-caption font-bold text-ink-soft tabular-nums w-5">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm font-semibold text-ink-strong">
                        {d.nombre}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.65rem]">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold ${niv.bg} ${niv.text}`}
                        >
                          {niv.label}
                        </span>
                        {d.idCatalogo ? (
                          <span className="text-validation">
                            Catálogo bayesiano ✓
                          </span>
                        ) : (
                          <span className="text-ink-soft">
                            Fuera de catálogo · razonamiento LLM
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {d.posterior !== null && (
                        <span className="tabular-nums text-body-sm font-bold text-accent">
                          {Math.round(d.posterior * 100)}%
                        </span>
                      )}
                      <ChevronDown
                        className={`h-4 w-4 text-ink-quiet transition-transform ${
                          expanded ? "rotate-180" : ""
                        }`}
                        strokeWidth={2}
                      />
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-line bg-surface-alt px-3 py-3 space-y-3">
                      <div>
                        <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft mb-1">
                          Razonamiento clínico
                        </p>
                        <p className="text-body-sm text-ink-strong leading-relaxed">
                          {d.razonamiento}
                        </p>
                      </div>
                      {d.findingsAConfirmar.length > 0 && (
                        <div>
                          <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft mb-1">
                            Para confirmar o descartar
                          </p>
                          <ul className="space-y-1">
                            {d.findingsAConfirmar.map((f, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-caption text-ink-strong"
                              >
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-validation" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Hallazgos detectados — editable */}
      <section className="lg-card">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-ink-strong">
            <Eye className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              Hallazgos extraídos ({findings.size} marcados)
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              LG Motor extrajo estos hallazgos del catálogo. Click para
              cambiar de estado o quitar.
            </p>
          </div>
        </div>

        <FindingsChips findings={findings} onSet={setFindingState} />
      </section>

      {/* Notas */}
      <section className="lg-card">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Notas y razonamiento
        </h2>
        <p className="mt-1 text-caption text-ink-muted">
          Tu conclusión clínica final y razonamiento si te apartas del
          motor.
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
          {!evalHipotesis.encajaConContexto && (
            <textarea
              value={override}
              onChange={(e) => setOverride(e.target.value)}
              placeholder="El motor sugiere que tu hipótesis no encaja. Si la mantienes, justifica clínicamente."
              rows={2}
              maxLength={1000}
              className="lg-input border-warn"
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

function TriToggleButton({
  active,
  onClick,
  tone,
  icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  tone: "validation" | "rose";
  icon: React.ReactNode;
  title: string;
}) {
  const activeBg = tone === "validation" ? "bg-validation" : "bg-rose";
  const activeText = "text-surface";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-colors ${
        active
          ? `${activeBg} ${activeText} border-transparent`
          : "border-line bg-surface-alt text-ink-muted hover:border-line-strong"
      }`}
    >
      {icon}
    </button>
  );
}

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

function FindingsChips({
  findings,
  onSet,
}: {
  findings: Map<string, TriState>;
  onSet: (id: string, state: TriState) => void;
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
              <ChipFinding
                key={f.id}
                label={f.label}
                tone="validation"
                onCycle={() => onSet(f.id, false)}
                onRemove={() => onSet(f.id, null)}
              />
            ))}
          </div>
        </div>
      )}

      {ausentes.length > 0 && (
        <div>
          <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-rose mb-2">
            Ausentes ({ausentes.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {ausentes.map((f) => (
              <ChipFinding
                key={f.id}
                label={f.label}
                tone="rose"
                onCycle={() => onSet(f.id, true)}
                onRemove={() => onSet(f.id, null)}
              />
            ))}
          </div>
        </div>
      )}

      {presentes.length === 0 && ausentes.length === 0 && (
        <p className="rounded-lg border border-dashed border-line bg-surface-alt px-4 py-6 text-center text-caption italic text-ink-quiet">
          El motor no extrajo findings reconocibles del catálogo. Los
          diferenciales arriba se calcularon por razonamiento LLM sobre el
          contexto libre.
        </p>
      )}
    </div>
  );
}

function ChipFinding({
  label,
  tone,
  onCycle,
  onRemove,
}: {
  label: string;
  tone: "validation" | "rose";
  onCycle: () => void;
  onRemove: () => void;
}) {
  const cls =
    tone === "validation"
      ? "bg-validation-soft text-validation"
      : "bg-rose-soft text-rose";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full pl-3 pr-1.5 py-1.5 text-caption font-medium ${cls}`}
    >
      <button
        type="button"
        onClick={onCycle}
        title={tone === "validation" ? "Cambiar a ausente" : "Cambiar a presente"}
        className="hover:opacity-70 transition-opacity"
      >
        {tone === "validation" ? (
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
        ) : (
          <XCircle className="h-3 w-3" strokeWidth={2.5} />
        )}
      </button>
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        title="Quitar"
        className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-surface hover:text-ink-strong transition-colors"
      >
        <HelpCircle className="h-2.5 w-2.5" strokeWidth={2.5} />
      </button>
    </span>
  );
}
