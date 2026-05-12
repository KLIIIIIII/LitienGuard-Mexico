"use client";

import { useState } from "react";
import {
  Stethoscope,
  Sparkles,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { Eyebrow } from "@/components/eyebrow";
import { AppChrome } from "./app-chrome";
import { CaseContext } from "./case-context";
import { DecisionSupportDemo } from "./decision-support-demo";
import { AmyloidDetectionDemo } from "./amyloid-detection-demo";
import { CaseStudy } from "./case-study";

type TabId = "decision" | "deteccion" | "cohorte";

interface TabSpec {
  id: TabId;
  label: string;
  short: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  chrome: {
    path: string;
    breadcrumb: string[];
    badge: string;
  };
}

const TABS: TabSpec[] = [
  {
    id: "decision",
    label: "Soporte a la decisión",
    short: "HFrEF · GDMT",
    icon: Stethoscope,
    eyebrow: "Optimización terapéutica guiada",
    title: "Cita verbatim, hazard ratios, override registrado.",
    description:
      "El cerebro no prescribe — propone, con texto literal de KDIGO, ESC y AHA con número de página. El médico decide y firma; si se aparta, su razonamiento queda en el expediente para el loop de calidad.",
    chrome: {
      path: "dashboard/cerebro/caso/68",
      breadcrumb: ["Dashboard", "Cerebro", "Caso · G.R."],
      badge: "Cardiología",
    },
  },
  {
    id: "deteccion",
    label: "Detección multi-señal",
    short: "ATTR-CM",
    icon: Sparkles,
    eyebrow: "Convergencia diagnóstica multi-señal",
    title: "Donde una sola señal nunca alcanza, las seis sí.",
    description:
      "Enfermedades como la amiloidosis cardíaca por transtiretina tienen 4 años promedio de retraso diagnóstico. Mira cómo la probabilidad cambia en tiempo real conforme el cerebro incorpora cada señal.",
    chrome: {
      path: "dashboard/diferencial",
      breadcrumb: ["Dashboard", "Diferencial diagnóstico"],
      badge: "Razonamiento bayesiano",
    },
  },
  {
    id: "cohorte",
    label: "Tu cohorte propia",
    short: "Semana 9",
    icon: LineChart,
    eyebrow: "Cómo lo vive un cardiólogo",
    title: "Semana 9 del piloto, su cohorte propia.",
    description:
      "Cada caso queda en el historial del médico con outcome trackeado. A las semanas, sus propios datos le devuelven calibración personal: cuándo acierta, cuándo se aparta, qué patrones aparecen.",
    chrome: {
      path: "dashboard/calidad",
      breadcrumb: ["Dashboard", "Mi calidad"],
      badge: "Loop de calidad",
    },
  },
];

export function LiveAppDemos() {
  const [active, setActive] = useState<TabId>("decision");
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <section className="border-b border-line bg-canvas py-20">
      <div className="lg-shell">
        {/* Section heading */}
        <div className="max-w-3xl">
          <Eyebrow tone="validation">Cómo se ve en la app</Eyebrow>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Tres flujos reales del producto en uso.
          </h2>
          <p className="mt-3 max-w-prose text-body text-ink-muted">
            Estas son pantallas de LitienGuard tal como las verá un médico en
            su sesión. Cambia entre flujos para ver soporte a la decisión,
            detección multi-señal y el dashboard de calidad personal.
          </p>
        </div>

        {/*
         * Tab nav — en mobile scroll horizontal (los 3 botones no caben
         * en 375px ni siquiera apilados sin verse mal). En sm+ flex-wrap
         * normal.
         */}
        <div className="mt-8 -mx-6 overflow-x-auto px-6 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = t.id === active;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(t.id)}
                  aria-pressed={isActive}
                  className={`group inline-flex shrink-0 items-center gap-2.5 rounded-lg border px-4 py-2.5 text-left transition-all ${
                    isActive
                      ? "border-validation bg-validation text-surface shadow-soft"
                      : "border-line bg-surface text-ink-strong hover:border-validation-soft hover:bg-validation-soft/30"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-surface" : "text-validation"
                    }`}
                    strokeWidth={2}
                  />
                  <div className="leading-tight">
                    <p
                      className={`text-body-sm font-semibold ${
                        isActive ? "text-surface" : "text-ink-strong"
                      }`}
                    >
                      {t.label}
                    </p>
                    <p
                      className={`text-[0.7rem] ${
                        isActive ? "text-surface/80" : "text-ink-muted"
                      }`}
                    >
                      {t.short}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active tab description */}
        <div className="mt-8 max-w-3xl">
          <Eyebrow tone="validation">{tab.eyebrow}</Eyebrow>
          <h3 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
            {tab.title}
          </h3>
          <p className="mt-3 max-w-prose text-body-sm text-ink-muted">
            {tab.description}
          </p>
        </div>

        {/* Active demo wrapped in app chrome */}
        <div className="mt-8">
          <AppChrome
            path={tab.chrome.path}
            breadcrumb={tab.chrome.breadcrumb}
            badge={tab.chrome.badge}
          >
            {active === "decision" && (
              <div className="space-y-6">
                <CaseContext />
                <DecisionSupportDemo />
              </div>
            )}
            {active === "deteccion" && <AmyloidDetectionDemo />}
            {active === "cohorte" && <CaseStudy />}
          </AppChrome>
        </div>

        <p className="mt-6 text-caption text-ink-soft text-center">
          Caso ilustrativo con datos anonimizados. La app real respeta
          LFPDPPP, NOM-024 y la Reforma LGS Salud Digital 2026.
        </p>
      </div>
    </section>
  );
}
