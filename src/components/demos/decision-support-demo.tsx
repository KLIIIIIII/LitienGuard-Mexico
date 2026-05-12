import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Sparkles,
  ExternalLink,
} from "lucide-react";

/**
 * Panel de soporte a la decisión que el cerebro arma al detectar
 * gaps terapéuticos en el caso de referencia.
 *
 * Todas las citas, hazard ratios y NNT son verbatim de las guías
 * citadas. Si alguna se actualiza, esta tarjeta debe revisarse.
 */
export function DecisionSupportDemo() {
  return (
    <div className="rounded-2xl border border-line bg-surface shadow-soft overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-surface-alt px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-validation" strokeWidth={2} />
          <p className="text-caption font-semibold uppercase tracking-eyebrow text-validation">
            Análisis · Guideline gap identificado
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-validation-soft px-2 py-0.5 text-caption font-semibold text-validation">
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
          Confianza alta
        </span>
      </div>

      <div className="p-5 space-y-5">
        <div className="rounded-lg border border-warn-soft bg-warn-soft/40 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-warn"
              strokeWidth={2}
            />
            <div>
              <p className="text-body-sm font-semibold text-ink-strong">
                La paciente no está en GDMT óptima para HFrEF
              </p>
              <p className="mt-0.5 text-caption text-ink-muted leading-relaxed">
                De los 4 pilares de tratamiento dirigido por guías para
                ICC-FEVIr, solo 2 están iniciados (IECA + BB). Faltan SGLT2i
                y ARNi. Carvedilol a dosis sub-óptima.
              </p>
            </div>
          </div>
        </div>

        {/* Recomendación 1 — SGLT2i */}
        <Recommendation
          rank="01"
          urgency="Class I · LOE A"
          title="Iniciar dapagliflozina 10 mg/día"
          mechanism="Natriuresis, atenuación RAAS y cambio en sustrato energético cardíaco — beneficio CV independiente de glucemia."
          evidence="«Recommend SGLT2 inhibitor in patients with HFrEF and CKD eGFR ≥20 mL/min/1.73 m², independent of glycemic control.»"
          source="AHA/ACC/HFSA 2022 HF Guideline · Class I LOE A · Heidenreich et al · JAHA 2022 · DAPA-HF (NEJM 2019) + EMPEROR-Reduced (NEJM 2020)"
          stats={[
            { label: "HR mortalidad CV / HF", value: "0.74" },
            { label: "DAPA-HF, 18 m", value: "—" },
            { label: "NNT 21", value: "—" },
          ]}
          contraindications={[
            "DM tipo 1 (riesgo CAD)",
            "Antecedente de CAD recurrente",
            "eGFR <20 mL/min/1.73 m²",
          ]}
        />

        {/* Recomendación 2 — ARNi */}
        <Recommendation
          rank="02"
          urgency="Class I · LOE B-R"
          title="Switch lisinopril → sacubitril/valsartán 49/51 mg BID"
          mechanism="Inhibición de neprilisina aumenta péptidos natriuréticos (BNP) y reduce remodelado. Bloqueo RAS preservado por valsartán."
          evidence="«En pacientes con HFrEF crónica sintomática (NYHA II-III), reemplazar IECA por sacubitril/valsartán para reducir morbimortalidad.»"
          source="ESC HF 2023 Focused Update · Class I · McDonagh et al · Eur Heart J 2023 · PARADIGM-HF (NEJM 2014, McMurray)"
          stats={[
            { label: "HR mortalidad CV / HF", value: "0.80" },
            { label: "PARADIGM-HF, 27 m", value: "—" },
            { label: "NNT 21", value: "—" },
          ]}
          contraindications={[
            "Hx angioedema con IECA",
            "TFG <30 (precaución)",
            "Embarazo",
            "Wash-out 36h post-IECA",
          ]}
        />

        {/* Recomendación 3 — Titulación */}
        <Recommendation
          rank="03"
          urgency="Class I · LOE A"
          title="Titular carvedilol a 25 mg BID en 4 semanas"
          mechanism="Beneficio mortalidad es dosis-dependiente. Dosis actual (6.25 BID) es 25% del target."
          evidence="«Beta-blockers should be uptitrated to maximum tolerated dose at intervals of ≥2 weeks.»"
          source="AHA/ACC/HFSA 2022 HF Guideline · Class I LOE A · Heidenreich et al · JAHA 2022 · COPERNICUS (NEJM 2001, Packer)"
          stats={[
            { label: "HR mortalidad", value: "0.65" },
            { label: "COPERNICUS, target", value: "—" },
            { label: "NNT 1 a", value: "14" },
          ]}
          contraindications={[
            "Bradicardia sintomática <50 lpm",
            "Bloqueo AV ≥2°",
            "Hipotensión sintomática <90/60",
          ]}
        />

        {/* Decisión del médico */}
        <div className="rounded-lg border border-rose-soft bg-rose-soft/40 px-4 py-3">
          <div className="flex items-start gap-2">
            <FileWarning
              className="mt-0.5 h-4 w-4 shrink-0 text-rose"
              strokeWidth={2}
            />
            <div className="flex-1">
              <p className="text-caption font-semibold uppercase tracking-eyebrow text-rose">
                Override del médico · queda registrado
              </p>
              <p className="mt-1 text-body-sm text-ink-strong">
                «Inicio dapagliflozina hoy. <strong>Pospongo ARNi 2 semanas</strong>{" "}
                para evaluar K trayectoria con SGLT2i; si K se mantiene &lt;5.0,
                hago switch en próxima cita. Subo carvedilol a 12.5 BID hoy.»
              </p>
              <p className="mt-1 text-caption text-ink-muted italic">
                Dr. M.A. · cardiología
              </p>
            </div>
          </div>
        </div>

        <p className="text-caption text-ink-soft leading-relaxed border-t border-line pt-3">
          El cerebro no prescribe — propone con evidencia citada. La decisión
          final es del médico, y el override queda en el expediente para
          auditoría y para el loop de calidad. Si pasados 3 meses el outcome
          es desfavorable, el sistema lo correlaciona con la decisión tomada.
        </p>

        <a
          href="/medicos"
          className="inline-flex items-center gap-1.5 text-caption font-semibold text-validation hover:underline"
        >
          Ver más sobre cómo opera el cerebro clínico
          <ExternalLink className="h-3 w-3" strokeWidth={2.2} />
        </a>
      </div>
    </div>
  );
}

function Recommendation({
  rank,
  urgency,
  title,
  mechanism,
  evidence,
  source,
  stats,
  contraindications,
}: {
  rank: string;
  urgency: string;
  title: string;
  mechanism: string;
  evidence: string;
  source: string;
  stats: Array<{ label: string; value: string }>;
  contraindications: string[];
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-caption font-bold text-validation">
          {rank}
        </span>
        <div className="flex-1">
          <p className="inline-flex items-center rounded-full bg-validation-soft px-2 py-0.5 text-caption font-semibold text-validation">
            {urgency}
          </p>
          <h4 className="mt-1.5 text-body-sm font-bold text-ink-strong leading-snug">
            {title}
          </h4>
        </div>
      </div>

      <div className="mt-3 space-y-2.5 pl-7">
        <div>
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft mb-1">
            Mecanismo
          </p>
          <p className="text-caption text-ink-muted leading-relaxed">
            {mechanism}
          </p>
        </div>

        <div>
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft mb-1">
            Evidencia · verbatim
          </p>
          <blockquote className="border-l-2 border-validation pl-3 text-caption italic text-ink-strong leading-relaxed">
            {evidence}
          </blockquote>
          <p className="mt-1 text-[0.65rem] text-ink-soft">{source}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded border border-line bg-surface-alt px-2 py-1.5"
            >
              <p className="text-[0.6rem] uppercase tracking-eyebrow text-ink-soft leading-tight">
                {s.label}
              </p>
              <p className="mt-0.5 font-mono text-caption font-bold text-ink-strong">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <details className="text-caption">
          <summary className="cursor-pointer text-ink-muted hover:text-ink-strong">
            Contraindicaciones y cautelas ({contraindications.length})
          </summary>
          <ul className="mt-1.5 space-y-0.5 pl-4 list-disc text-ink-muted">
            {contraindications.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </details>
      </div>
    </div>
  );
}
