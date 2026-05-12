import { Activity, Heart, FlaskConical, Pill } from "lucide-react";

/**
 * Caso clínico de referencia que recorre los tres demos siguientes:
 * Sra. G.R., 68 años, ICC con FEVI reducida, gap terapéutico identificable.
 * Datos anonimizados, plausibles, alineados con guías reales (ESC HF 2021,
 * KDIGO 2024, AHA/ACC/HFSA 2022).
 */

export function CaseContext() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-caption uppercase tracking-eyebrow text-validation">
            Caso clínico ilustrativo
          </p>
          <h3 className="mt-1 text-h2 font-semibold tracking-tight text-ink-strong">
            Sra. G.R. · 68 años · ICC con FEVI reducida
          </h3>
        </div>
        <span className="hidden sm:inline-flex items-center rounded-full bg-warn-soft px-2.5 py-0.5 text-caption font-semibold text-warn">
          NYHA III
        </span>
      </div>

      <p className="mt-3 text-body-sm text-ink-muted leading-relaxed">
        Disnea progresiva 3 semanas, ortopnea de 2 almohadas, edema pretibial
        bilateral. Sin dolor torácico. Adherencia a tratamiento referida como
        completa.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface-alt px-3 py-3">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
              Signos vitales
            </p>
          </div>
          <dl className="mt-2 space-y-0.5 text-caption">
            <div className="flex justify-between">
              <dt className="text-ink-muted">TA</dt>
              <dd className="font-mono font-semibold text-ink-strong">142/86</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">FC</dt>
              <dd className="font-mono font-semibold text-ink-strong">78</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">SpO₂</dt>
              <dd className="font-mono font-semibold text-ink-strong">95%</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-line bg-surface-alt px-3 py-3">
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
              Eco
            </p>
          </div>
          <dl className="mt-2 space-y-0.5 text-caption">
            <div className="flex justify-between">
              <dt className="text-ink-muted">FEVI</dt>
              <dd className="font-mono font-semibold text-rose">35%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">DVI</dt>
              <dd className="font-mono font-semibold text-ink-strong">62 mm</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">IM</dt>
              <dd className="font-mono font-semibold text-ink-strong">Mod.</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-line bg-surface-alt px-3 py-3">
          <div className="flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
              Laboratorios
            </p>
          </div>
          <dl className="mt-2 space-y-0.5 text-caption">
            <div className="flex justify-between">
              <dt className="text-ink-muted">eGFR</dt>
              <dd className="font-mono font-semibold text-warn">42</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">K⁺</dt>
              <dd className="font-mono font-semibold text-ink-strong">4.8</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">NT-proBNP</dt>
              <dd className="font-mono font-semibold text-rose">1240</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-line bg-surface-alt px-3 py-3">
          <div className="flex items-center gap-1.5">
            <Pill className="h-3.5 w-3.5 text-ink-muted" strokeWidth={2} />
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
              Tratamiento actual
            </p>
          </div>
          <ul className="mt-2 space-y-0.5 text-caption text-ink-strong">
            <li>Furosemida 40 mg BID</li>
            <li>Lisinopril 10 mg/día</li>
            <li>Carvedilol 6.25 mg BID</li>
            <li>AAS 81 mg/día</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
