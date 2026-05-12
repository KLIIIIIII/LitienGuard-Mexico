"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Heart,
  FlaskConical,
  Dna,
  Users,
  Stethoscope,
  Brain,
  CheckCircle2,
  X,
  Minus,
  Save,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Quote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  DISEASES,
  FINDINGS,
  LIKELIHOOD_RATIOS,
} from "@/lib/inference/knowledge-base";
import type {
  FindingCategory,
  FindingObservation,
  InferenceResult,
} from "@/lib/inference/types";
import { inferDifferential } from "@/lib/inference/bayesian";
import {
  saveDiferencialSession,
  type SaveDiferencialInput,
} from "./actions";
import { ExtractPanel } from "./extract-panel";

const CATEGORY_META: Record<
  FindingCategory,
  { label: string; icon: LucideIcon; color: string }
> = {
  ecg: { label: "ECG", icon: Activity, color: "text-rose" },
  echo: { label: "Ecocardiograma", icon: Heart, color: "text-validation" },
  lab: { label: "Laboratorios", icon: FlaskConical, color: "text-accent" },
  history: { label: "Historia", icon: Users, color: "text-warn" },
  exam: { label: "Examen físico", icon: Stethoscope, color: "text-ink-strong" },
  genetic: { label: "Genética", icon: Dna, color: "text-accent" },
};

type TriState = boolean | null;

export function DiferencialEngine({
  initialClinicalText,
  initialPatient,
}: {
  initialClinicalText?: string;
  initialPatient?: {
    iniciales: string | null;
    edad: number | null;
    sexo: "M" | "F" | "O" | null;
  };
} = {}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedId, setSavedId] = useState<string | null>(null);

  // Patient context — pre-fill from note if provided
  const [iniciales, setIniciales] = useState(initialPatient?.iniciales ?? "");
  const [edad, setEdad] = useState<string>(
    initialPatient?.edad != null ? String(initialPatient.edad) : "",
  );
  const [sexo, setSexo] = useState<"" | "M" | "F" | "O">(
    initialPatient?.sexo ?? "",
  );
  const [contexto, setContexto] = useState("");

  // Findings state — Map<findingId, TriState>
  const [findings, setFindings] = useState<Map<string, TriState>>(new Map());

  // Doctor's decision
  const [dxPrincipal, setDxPrincipal] = useState("");
  const [notas, setNotas] = useState("");
  const [override, setOverride] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Compute differential live as findings change
  const observations: FindingObservation[] = useMemo(() => {
    return FINDINGS.map((f) => ({
      finding: f.id,
      present: findings.get(f.id) ?? null,
    }));
  }, [findings]);

  const inference = useMemo(
    () => inferDifferential(observations, DISEASES, LIKELIHOOD_RATIOS),
    [observations],
  );

  const top5 = useMemo(() => inference.slice(0, 5), [inference]);
  const nMarked = useMemo(
    () =>
      Array.from(findings.values()).filter((v) => v !== null && v !== undefined)
        .length,
    [findings],
  );

  function cycle(findingId: string) {
    setFindings((prev) => {
      const next = new Map(prev);
      const current = next.get(findingId) ?? null;
      // tristate cycle: null → true → false → null
      const nextValue =
        current === null ? true : current === true ? false : null;
      if (nextValue === null) next.delete(findingId);
      else next.set(findingId, nextValue);
      return next;
    });
    setSavedId(null);
  }

  function onSave() {
    const payload: SaveDiferencialInput = {
      paciente_iniciales: iniciales.trim(),
      paciente_edad: edad.trim() ? Number(edad) : null,
      paciente_sexo: sexo === "" ? null : sexo,
      contexto_clinico: contexto.trim(),
      findings_observed: Array.from(findings.entries()).map(([finding, present]) => ({
        finding,
        present: present ?? null,
      })),
      top_diagnoses: top5.map((r) => ({
        disease: r.disease.id,
        label: r.disease.label,
        posterior: r.posterior,
      })),
      medico_diagnostico_principal: dxPrincipal.trim(),
      medico_notas: notas.trim(),
      override_razonamiento: override.trim(),
    };

    startTransition(async () => {
      const r = await saveDiferencialSession(payload);
      if (r.status === "ok") {
        setSavedId(r.id);
        router.refresh();
      }
    });
  }

  function reset() {
    if (!confirm("¿Reiniciar el diferencial? Perderás los findings marcados.")) return;
    setFindings(new Map());
    setSavedId(null);
    setDxPrincipal("");
    setNotas("");
    setOverride("");
    setExpanded(null);
  }

  function onExtractApply(extracted: Map<string, boolean | null>) {
    setFindings(extracted);
    setSavedId(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* ============================================================ */}
      {/* LEFT — Patient + Findings input                                 */}
      {/* ============================================================ */}
      <div className="space-y-5">
        {/* Patient context */}
        <section className="lg-card space-y-3">
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            Paciente
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="block text-caption font-medium text-ink-strong">
                Iniciales
              </label>
              <input
                type="text"
                value={iniciales}
                onChange={(e) => setIniciales(e.target.value)}
                maxLength={10}
                placeholder="G.R."
                disabled={pending}
                className="lg-input"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-caption font-medium text-ink-strong">
                Edad
              </label>
              <input
                type="number"
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                min={0}
                max={130}
                placeholder="71"
                disabled={pending}
                className="lg-input"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-caption font-medium text-ink-strong">
                Sexo
              </label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value as typeof sexo)}
                disabled={pending}
                className="lg-input"
              >
                <option value="">—</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-caption font-medium text-ink-strong">
              Contexto clínico
            </label>
            <textarea
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder="HFpEF diagnóstico 3 años · CTS bilateral 2017 · disnea progresiva"
              disabled={pending}
              className="lg-input resize-y"
            />
          </div>
        </section>

        {/* Auto-extraction panel */}
        <ExtractPanel
          onApply={onExtractApply}
          hasExistingFindings={nMarked > 0}
          initialText={initialClinicalText}
          autoOpen={Boolean(initialClinicalText)}
        />

        {/* Findings checklist */}
        <section className="lg-card">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <div>
              <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
                Findings clínicos
              </h2>
              <p className="mt-0.5 text-caption text-ink-muted">
                Click para alternar: <strong>presente</strong> →{" "}
                <strong>ausente</strong> → no evaluado
              </p>
            </div>
            <p className="text-caption text-ink-soft tabular-nums">
              {nMarked}/{FINDINGS.length} evaluados
            </p>
          </div>

          <div className="space-y-4">
            {(Object.keys(CATEGORY_META) as FindingCategory[]).map((cat) => {
              const findingsInCat = FINDINGS.filter((f) => f.category === cat);
              if (findingsInCat.length === 0) return null;
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              return (
                <div key={cat}>
                  <div className="mb-2 flex items-center gap-2">
                    <Icon
                      className={`h-3.5 w-3.5 ${meta.color}`}
                      strokeWidth={2.2}
                    />
                    <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                      {meta.label}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {findingsInCat.map((f) => {
                      const state = findings.get(f.id) ?? null;
                      return (
                        <FindingButton
                          key={f.id}
                          label={f.label}
                          detail={f.detail}
                          state={state}
                          onClick={() => cycle(f.id)}
                          disabled={pending}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ============================================================ */}
      {/* RIGHT — Live differential                                       */}
      {/* ============================================================ */}
      <div className="space-y-5">
        <section
          className={`lg-card ${
            nMarked >= 2
              ? ""
              : "lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-validation" strokeWidth={2} />
              <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
                Diferencial en vivo
              </h2>
            </div>
            {nMarked === 0 ? (
              <span className="text-caption text-ink-soft">
                Inicia marcando findings
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-validation-soft px-2 py-0.5 text-caption font-semibold text-validation">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
                {top5[0]?.disease.label.split(" ")[0]} ·{" "}
                {Math.round(top5[0]?.posterior * 100)}%
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {top5.map((r, idx) => (
              <DifferentialRow
                key={r.disease.id}
                result={r}
                rank={idx}
                expanded={expanded === r.disease.id}
                onToggle={() =>
                  setExpanded(expanded === r.disease.id ? null : r.disease.id)
                }
              />
            ))}
          </div>

          {nMarked === 0 && (
            <p className="mt-4 rounded-lg border border-dashed border-line bg-surface-alt/60 px-4 py-3 text-caption text-ink-muted leading-relaxed">
              Marca findings en el panel izquierdo. La probabilidad de cada
              diagnóstico se actualiza en tiempo real conforme el motor
              incorpora cada hallazgo a su razonamiento bayesiano.
            </p>
          )}
        </section>

        {/* Doctor's decision panel */}
        {nMarked >= 2 && (
          <section className="lg-card space-y-3">
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              Tu decisión
            </h2>
            <p className="text-caption text-ink-muted">
              Si te apartas del top-1 del motor, captura tu razonamiento. Se
              guarda en el expediente y alimenta el loop de calidad.
            </p>

            <div className="space-y-1">
              <label className="block text-caption font-medium text-ink-strong">
                Diagnóstico principal
              </label>
              <input
                type="text"
                value={dxPrincipal}
                onChange={(e) => setDxPrincipal(e.target.value)}
                placeholder="ATTR-CM (probable), pendiente PYP scan"
                maxLength={120}
                disabled={pending}
                className="lg-input"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-caption font-medium text-ink-strong">
                Notas y siguientes pasos
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                maxLength={2000}
                placeholder="Solicitar PYP scan. Electroforesis de proteínas + FLC. Test genético TTR."
                disabled={pending}
                className="lg-input resize-y"
              />
            </div>

            {dxPrincipal &&
              top5[0] &&
              !dxPrincipal.toLowerCase().includes(top5[0].disease.label.toLowerCase().slice(0, 6)) && (
                <div className="space-y-1 rounded-lg border border-rose-soft bg-rose-soft/40 px-3 py-2">
                  <label className="block text-caption font-semibold text-rose">
                    Override del motor — explica el razonamiento
                  </label>
                  <textarea
                    value={override}
                    onChange={(e) => setOverride(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder="Decido X aunque el motor sugiere Y porque..."
                    disabled={pending}
                    className="lg-input resize-y"
                  />
                </div>
              )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSave}
                disabled={pending}
                className="lg-cta-primary disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {pending ? "Guardando…" : "Guardar caso"}
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={pending}
                className="lg-cta-ghost"
              >
                Reiniciar
              </button>
            </div>

            {savedId && (
              <div className="flex items-center gap-2 rounded-lg border border-validation-soft bg-validation-soft px-3 py-2 text-caption text-validation">
                <CheckCircle2 className="h-4 w-4" />
                Caso guardado. ID {savedId.slice(0, 8).toUpperCase()}.
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function FindingButton({
  label,
  detail,
  state,
  onClick,
  disabled,
}: {
  label: string;
  detail?: string;
  state: TriState;
  onClick: () => void;
  disabled: boolean;
}) {
  const stateConfig =
    state === true
      ? {
          border: "border-validation",
          bg: "bg-validation-soft",
          icon: CheckCircle2,
          iconColor: "text-validation",
          tag: "PRESENTE",
          tagBg: "bg-validation text-surface",
        }
      : state === false
        ? {
            border: "border-rose-soft",
            bg: "bg-rose-soft/40",
            icon: X,
            iconColor: "text-rose",
            tag: "AUSENTE",
            tagBg: "bg-rose text-surface",
          }
        : {
            border: "border-line",
            bg: "bg-surface",
            icon: Minus,
            iconColor: "text-ink-quiet",
            tag: "—",
            tagBg: "bg-surface-alt text-ink-muted",
          };
  const Icon = stateConfig.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-lg border px-3 py-2 transition-all hover:shadow-soft disabled:opacity-50 ${stateConfig.border} ${stateConfig.bg}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium text-ink-strong">{label}</p>
          {detail && (
            <p className="mt-0.5 text-caption text-ink-muted leading-snug">
              {detail}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.62rem] font-semibold tracking-wide ${stateConfig.tagBg}`}
          >
            {stateConfig.tag}
          </span>
          <Icon className={`h-4 w-4 ${stateConfig.iconColor}`} strokeWidth={2.2} />
        </div>
      </div>
    </button>
  );
}

function DifferentialRow({
  result,
  rank,
  expanded,
  onToggle,
}: {
  result: InferenceResult;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const pct = Math.round(result.posterior * 100);
  const isLeader = rank === 0;

  return (
    <div className={`rounded-lg border ${isLeader ? "border-validation" : "border-line"} bg-surface overflow-hidden`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-3.5 py-2.5 text-left hover:bg-surface-alt/40 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-caption font-bold ${
                  isLeader ? "text-validation" : "text-ink-muted"
                }`}
              >
                {(rank + 1).toString().padStart(2, "0")}
              </span>
              <p
                className={`text-body-sm font-semibold leading-tight ${
                  isLeader ? "text-ink-strong" : "text-ink-strong"
                }`}
              >
                {result.disease.label}
              </p>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-alt"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isLeader ? "bg-validation" : "bg-ink-quiet"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-h3 font-bold tabular-nums ${
                isLeader ? "text-validation" : "text-ink-muted"
              }`}
            >
              {pct}%
            </span>
            <ChevronDown
              className={`h-4 w-4 text-ink-quiet transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
              strokeWidth={2.2}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-line bg-surface-alt/40 px-3.5 py-3 space-y-2">
          {result.evidence.length === 0 ? (
            <p className="text-caption italic text-ink-muted">
              Sin evidencia diferencial relevante para esta enfermedad con los
              findings marcados.
            </p>
          ) : (
            result.evidence.slice(0, 6).map((e) => (
              <div
                key={`${e.finding.id}-${e.present}`}
                className="rounded-md border border-line bg-surface p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-caption font-semibold text-ink-strong leading-tight">
                      {e.finding.label}
                    </p>
                    <p className="mt-0.5 text-[0.65rem] text-ink-muted">
                      {e.present ? "✓ presente" : "✗ ausente"} · contribución
                      logLR {e.logLRcontribution.toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[0.6rem] font-mono font-semibold ${
                      e.logLRcontribution > 0
                        ? "bg-validation-soft text-validation"
                        : "bg-rose-soft text-rose"
                    }`}
                  >
                    {e.logLRcontribution > 0 ? "+" : ""}
                    {e.logLRcontribution.toFixed(2)}
                  </span>
                </div>
                <div className="mt-2 flex items-start gap-1.5 border-t border-line-soft pt-2">
                  <Quote
                    className="mt-0.5 h-3 w-3 shrink-0 text-ink-quiet"
                    strokeWidth={2.2}
                  />
                  <p className="text-[0.65rem] italic text-ink-muted leading-snug">
                    {e.source}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Re-exports used elsewhere
export { Brain, AlertCircle };
