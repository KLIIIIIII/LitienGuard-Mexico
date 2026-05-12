"use client";

import { useState } from "react";
import {
  Activity,
  HeartPulse,
  Target,
  CheckCircle2,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { Eyebrow } from "@/components/eyebrow";

type SectionId = "rcm" | "ehr" | "fit";

interface SectionContent {
  id: SectionId;
  number: string;
  short: string;
  icon: LucideIcon;
  eyebrow: string;
  title: React.ReactNode;
  intro: string;
  body: React.ReactNode;
}

const SECTIONS: SectionContent[] = [
  {
    id: "rcm",
    number: "01",
    short: "Ciclo de ingresos",
    icon: Activity,
    eyebrow: "Recuperación de ingresos",
    title: (
      <>
        Donde más duele,{" "}
        <span className="lg-serif-italic text-validation">
          donde más rápido se ve el ROI.
        </span>
      </>
    ),
    intro:
      "La industria pierde entre 5% y 15% de ingresos cobrables en fugas administrativas: pólizas mal validadas, denegaciones evitables, cuentas que envejecen, errores de codificación. Empezamos por ahí — sin reemplazar tu HIS, sin proyectos de migración de un año.",
    body: (
      <div className="space-y-3">
        {[
          {
            t: "Validación de póliza antes de admitir",
            d: "Sabe en segundos qué cubre la aseguradora y qué no. Cero sorpresas al alta.",
            metric: "<3 seg",
            metricLabel: "Por consulta",
          },
          {
            t: "Predicción de denegaciones",
            d: "Modelo entrenado con patrones reales de aseguradoras MX. Te avisa antes de enviar.",
            metric: "-40%",
            metricLabel: "Re-trabajo facturación",
          },
          {
            t: "Codificación CIE-10 automática",
            d: "De nota clínica a claim correcto. Menos backlog, menos errores humanos.",
            metric: "-60%",
            metricLabel: "Errores codificación",
          },
          {
            t: "Cobranza priorizada por probabilidad",
            d: "Dashboard con priorización por antigüedad y riesgo. Tu equipo cobra primero lo que sí cobrará.",
            metric: "20-30%",
            metricLabel: "Reducción DSO",
          },
          {
            t: "Detección de fraude y patrones anómalos",
            d: "Alertas cuando facturación o codificación se desvía de tu propia línea base.",
            metric: "24/7",
            metricLabel: "Monitoreo activo",
          },
        ].map((item, i) => (
          <RowItem key={i} {...item} />
        ))}
      </div>
    ),
  },
  {
    id: "ehr",
    number: "02",
    short: "EHR ligero",
    icon: HeartPulse,
    eyebrow: "Expediente clínico electrónico",
    title: (
      <>
        EHR construido{" "}
        <span className="lg-serif-italic text-validation">
          encima del flujo ya instalado.
        </span>
      </>
    ),
    intro:
      "Una vez que tu ciclo de ingresos está bajo control, el siguiente paso natural es que los médicos documenten una sola vez y todo el hospital se beneficie. Cumplimiento regulatorio incluido.",
    body: (
      <div className="space-y-3">
        {[
          {
            t: "Documentación única, propagación múltiple",
            d: "La nota clínica alimenta calidad, facturación y reporteo en un solo flujo. Sin captura doble.",
            metric: "1 vez",
            metricLabel: "Captura",
          },
          {
            t: "Reporteo SINBA/SINAIS automatizado",
            d: "Cumple con la Reforma LGS 2026 sin trabajo manual mensual. Lo que tardaba días se entrega solo.",
            metric: "Auto",
            metricLabel: "Sin captura manual",
          },
          {
            t: "Compatible con Credencial Paciente 2026",
            d: "Identidad clínica unificada lista para la credencial federal. Sin migraciones forzadas.",
            metric: "Día 1",
            metricLabel: "Compatible",
          },
          {
            t: "Convive con tus sistemas actuales",
            d: "Puentes con SAP, sistemas internos y legacy. No te obligamos a tirar lo que invertiste.",
            metric: "API",
            metricLabel: "Integración bidireccional",
          },
        ].map((item, i) => (
          <RowItem key={i} {...item} />
        ))}
      </div>
    ),
  },
  {
    id: "fit",
    number: "03",
    short: "¿Es para tu hospital?",
    icon: Target,
    eyebrow: "Perfil de cliente ideal",
    title: (
      <>
        Si tu operación tiene este perfil,{" "}
        <span className="lg-serif-italic text-validation">
          hay un caso de ROI claro.
        </span>
      </>
    ),
    intro:
      "Trabajamos con grupos hospitalarios privados premium en México. Si tu hospital no encaja exactamente con estos criterios pero quieres explorar, escríbenos — tomamos la conversación caso por caso.",
    body: (
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            t: "100+ camas",
            d: "Volumen suficiente para que el RCM mueva la aguja de tu EBITDA en un trimestre.",
          },
          {
            t: "5,000+ pacientes/mes",
            d: "Claims suficientes para que la predicción de denegaciones se vuelva tu segunda nómina.",
          },
          {
            t: "3+ aseguradoras activas",
            d: "Si tu mezcla de pagadores es compleja, la validación de pólizas paga el sistema en un mes.",
          },
          {
            t: "Múltiples ubicaciones",
            d: "Reportes consolidados, reglas por unidad, conciliación centralizada — sin equipo paralelo por sucursal.",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-line bg-surface px-4 py-3.5 hover:border-validation-soft hover:bg-validation-soft/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="h-3.5 w-3.5 text-validation shrink-0"
                strokeWidth={2.2}
              />
              <p className="text-body-sm font-semibold tracking-tight text-ink-strong">
                {s.t}
              </p>
            </div>
            <p className="mt-2 text-caption text-ink-muted leading-relaxed">
              {s.d}
            </p>
          </div>
        ))}
      </div>
    ),
  },
];

export function OperationsTabs() {
  const [active, setActive] = useState<SectionId>("rcm");
  const section = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  return (
    <section className="border-b border-line bg-surface-alt py-20">
      <div className="lg-shell">
        <div className="max-w-3xl">
          <Eyebrow>Cómo opera contigo</Eyebrow>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            De ciclo de ingresos a expediente clínico — un solo sistema.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">
            Empezamos por donde más rápido se ve el ROI y crecemos contigo a
            medida que el flujo se asienta. Sin migraciones forzadas, sin
            proyectos de 12 meses.
          </p>
        </div>

        {/*
         * Mobile: tabs horizontales scrolleables (los botones grandes
         * apilados verticalmente forzaban demasiado scroll antes de ver
         * el contenido). Desktop: sidebar vertical clásico.
         */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
          <nav
            aria-label="Secciones operativas"
            className="-mx-6 overflow-x-auto px-6 lg:mx-0 lg:overflow-visible lg:px-0 lg:space-y-1.5"
          >
            <div className="flex w-max gap-2 lg:flex-col lg:w-auto lg:gap-1.5">
              {SECTIONS.map((s) => {
                const isActive = s.id === active;
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActive(s.id)}
                    aria-pressed={isActive}
                    className={`group relative shrink-0 rounded-xl border px-4 py-3 text-left transition-all lg:w-full lg:py-3.5 ${
                      isActive
                        ? "border-validation bg-surface shadow-soft"
                        : "border-line bg-surface/60 hover:bg-surface hover:border-validation-soft"
                    }`}
                  >
                    {isActive && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-3 bottom-3 hidden w-[3px] rounded-r-full bg-validation lg:block"
                      />
                    )}
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isActive
                            ? "bg-validation text-surface"
                            : "bg-surface-alt text-ink-muted group-hover:bg-validation-soft group-hover:text-validation"
                        }`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-mono text-[0.62rem] font-bold tracking-wider uppercase ${
                            isActive ? "text-validation" : "text-ink-quiet"
                          }`}
                        >
                          Módulo {s.number}
                        </p>
                        <p className="mt-0.5 text-body-sm font-semibold leading-tight text-ink-strong">
                          {s.short}
                        </p>
                      </div>
                      <ArrowUpRight
                        className={`h-3.5 w-3.5 shrink-0 transition-all ${
                          isActive
                            ? "text-validation opacity-100"
                            : "text-ink-quiet opacity-0 group-hover:opacity-100"
                        }`}
                        strokeWidth={2.2}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Progress indicator — oculto en mobile (ya hay tabs horizontales) */}
            <div className="mt-6 hidden rounded-xl border border-line bg-surface px-4 py-3 lg:block">
              <p className="text-[0.62rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                Orden de implementación
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                {SECTIONS.map((s, i) => {
                  const isActive = s.id === active;
                  const isPast =
                    SECTIONS.findIndex((x) => x.id === active) > i;
                  return (
                    <div key={s.id} className="flex-1 flex items-center">
                      <div
                        className={`h-1 flex-1 rounded-full ${
                          isActive || isPast
                            ? "bg-validation"
                            : "bg-line"
                        }`}
                      />
                      {i < SECTIONS.length - 1 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-line mx-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[0.65rem] text-ink-muted leading-relaxed">
                Implementación secuencial. El ciclo de ingresos asienta primero
                el ROI; el EHR llega cuando el flujo ya está estable.
              </p>
            </div>
          </nav>

          {/* Active content panel */}
          <article
            key={section.id}
            className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-soft"
          >
            <div className="flex items-center gap-2 mb-3">
              <section.icon
                className="h-4 w-4 text-validation"
                strokeWidth={2.2}
              />
              <p className="text-caption uppercase tracking-eyebrow font-semibold text-validation">
                {section.eyebrow}
              </p>
            </div>
            <h3 className="text-h2 font-semibold tracking-tight text-ink-strong leading-tight">
              {section.title}
            </h3>
            <p className="mt-4 max-w-prose text-body-sm text-ink-muted leading-relaxed">
              {section.intro}
            </p>
            <div className="mt-7">{section.body}</div>
          </article>
        </div>
      </div>
    </section>
  );
}

function RowItem({
  t,
  d,
  metric,
  metricLabel,
}: {
  t: string;
  d: string;
  metric: string;
  metricLabel: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_120px] sm:items-start rounded-xl border border-line bg-canvas px-4 py-3.5 hover:border-validation-soft transition-colors">
      <div>
        <p className="text-body-sm font-semibold tracking-tight text-ink-strong">
          {t}
        </p>
        <p className="mt-1 text-caption text-ink-muted leading-relaxed">{d}</p>
      </div>
      <div className="sm:text-right sm:border-l sm:border-line sm:pl-4">
        <p className="text-h3 font-bold tabular-nums text-validation leading-none">
          {metric}
        </p>
        <p className="mt-1 text-[0.62rem] uppercase tracking-eyebrow text-ink-soft">
          {metricLabel}
        </p>
      </div>
    </div>
  );
}
