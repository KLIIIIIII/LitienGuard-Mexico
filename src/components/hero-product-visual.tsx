"use client";

import {
  CheckCircle2,
  X,
  Quote,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { AppChrome } from "@/components/demos/app-chrome";

interface Finding {
  label: string;
  present: boolean;
  category: string;
}

const FINDINGS: Finding[] = [
  { label: "Bajo voltaje ECG con LVH eco", present: true, category: "ECG" },
  { label: "Apical sparing strain longitudinal", present: true, category: "Eco" },
  { label: "Engrosamiento ventricular >12 mm", present: true, category: "Eco" },
  { label: "Síndrome del túnel del carpo bilateral", present: true, category: "Historia" },
  { label: "NT-proBNP desproporcionado a NYHA", present: true, category: "Lab" },
  { label: "Cociente FLC κ/λ anormal", present: false, category: "Lab" },
];

const DIFFERENTIAL = [
  {
    label: "ATTR-CM (amiloidosis por transtiretina)",
    pct: 87,
    isLead: true,
  },
  {
    label: "AL amyloid",
    pct: 6,
    isLead: false,
  },
  {
    label: "Cardiopatía hipertensiva con LVH",
    pct: 4,
    isLead: false,
  },
];

export function HeroProductVisual() {
  return (
    <div className="relative">
      {/* Soft halo behind app chrome */}
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-validation-soft via-accent-soft to-transparent opacity-50 blur-3xl"
      />

      <AppChrome
        path="dashboard/diferencial"
        breadcrumb={["Dashboard", "Diferencial diagnóstico", "Caso · G.R."]}
        badge="Razonamiento bayesiano en vivo"
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,1.15fr)]">
          {/* LEFT — clinical findings */}
          <section className="space-y-3">
            <div>
              <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                Paciente
              </p>
              <p className="mt-1 text-body-sm font-semibold text-ink-strong">
                G.R. · 74 años · M
              </p>
              <p className="text-caption text-ink-muted leading-snug">
                HFpEF 3 años · CTS bilateral operado 2017 · disnea progresiva
              </p>
            </div>

            <div>
              <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-ink-soft mb-1.5">
                Findings observados · 6 evaluados
              </p>
              <div className="space-y-1.5">
                {FINDINGS.map((f) => (
                  <FindingRow key={f.label} finding={f} />
                ))}
              </div>
            </div>
          </section>

          {/* RIGHT — bayesian differential + verbatim citation */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles
                  className="h-3.5 w-3.5 text-validation"
                  strokeWidth={2.2}
                />
                <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-validation">
                  Diferencial en vivo
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-validation-soft px-2 py-0.5 text-[0.6rem] font-bold text-validation">
                <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.4} />
                ATTR-CM · 87%
              </span>
            </div>

            {/* Differential bars */}
            <div className="space-y-1.5">
              {DIFFERENTIAL.map((d, idx) => (
                <DxBar key={d.label} dx={d} rank={idx + 1} />
              ))}
            </div>

            {/* Verbatim citation card */}
            <div className="rounded-xl border border-validation-soft bg-validation-soft/40 px-3 py-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  className="h-3 w-3 text-validation shrink-0"
                  strokeWidth={2.4}
                />
                <p className="text-[0.62rem] uppercase tracking-eyebrow font-bold text-validation">
                  Evidencia verbatim · ACC Guidance 2025
                </p>
              </div>
              <div className="flex items-start gap-1.5">
                <Quote
                  className="mt-0.5 h-2.5 w-2.5 shrink-0 text-validation"
                  strokeWidth={2.4}
                />
                <p className="text-caption italic leading-snug text-ink-strong">
                  &quot;CTS bilateral en hombre &gt;65 años con HFpEF e
                  hipertrofia ventricular eleva la probabilidad pre-test de
                  ATTR-CM por encima del 70%. PYP scan grado 2-3 confirma sin
                  necesidad de biopsia.&quot;
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-validation-soft pt-1.5">
                <p className="text-[0.58rem] font-mono text-ink-muted">
                  2025 ACC Concise Clinical Guidance · JACC · Pág. 14
                </p>
                <span className="text-[0.58rem] font-bold text-validation">
                  LR+ 6.0
                </span>
              </div>
            </div>

            {/* Doctor's decision indicator */}
            <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2">
              <div className="h-1.5 w-1.5 rounded-full bg-warn animate-pulse" />
              <p className="text-[0.65rem] text-ink-muted leading-tight">
                <span className="font-semibold text-ink-strong">
                  Decisión del médico:
                </span>{" "}
                solicitar PYP scan + electroforesis + test genético TTR
              </p>
            </div>
          </section>
        </div>
      </AppChrome>
    </div>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  const Icon: LucideIcon = finding.present ? CheckCircle2 : X;
  return (
    <div
      className={`flex items-start gap-2 rounded-md border px-2.5 py-1.5 ${
        finding.present
          ? "border-validation-soft bg-validation-soft/30"
          : "border-rose-soft bg-rose-soft/20"
      }`}
    >
      <Icon
        className={`mt-0.5 h-3 w-3 shrink-0 ${
          finding.present ? "text-validation" : "text-rose"
        }`}
        strokeWidth={2.4}
      />
      <div className="min-w-0 flex-1">
        <p className="text-caption font-medium leading-tight text-ink-strong">
          {finding.label}
        </p>
        <p className="text-[0.6rem] text-ink-soft">{finding.category}</p>
      </div>
    </div>
  );
}

function DxBar({
  dx,
  rank,
}: {
  dx: { label: string; pct: number; isLead: boolean };
  rank: number;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2 ${
        dx.isLead ? "border-validation bg-surface" : "border-line bg-surface/60"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={`font-mono text-[0.62rem] font-bold ${
              dx.isLead ? "text-validation" : "text-ink-quiet"
            }`}
          >
            {rank.toString().padStart(2, "0")}
          </span>
          <p
            className={`truncate text-caption leading-tight ${
              dx.isLead ? "font-semibold text-ink-strong" : "text-ink-muted"
            }`}
          >
            {dx.label}
          </p>
        </div>
        <span
          className={`text-body-sm font-bold tabular-nums shrink-0 ${
            dx.isLead ? "text-validation" : "text-ink-muted"
          }`}
        >
          {dx.pct}%
        </span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className={`h-full rounded-full ${
            dx.isLead ? "bg-validation" : "bg-ink-quiet"
          }`}
          style={{ width: `${dx.pct}%` }}
        />
      </div>
    </div>
  );
}
