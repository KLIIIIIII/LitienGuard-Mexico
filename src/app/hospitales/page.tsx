import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { FeatureList } from "@/components/feature-list";
import { FinalCta } from "@/components/final-cta";
import { TiltCard } from "@/components/tilt-card";
import { Eyebrow } from "@/components/eyebrow";

export const metadata: Metadata = {
  title: "Para hospitales — RCM Copilot + EHR ligero",
  description:
    "Validación de pólizas, predicción de denegaciones, cobranza limpia, EHR compatible con SINBA y Credencial Paciente 2026.",
};

const RCM_FEATURES = [
  {
    title: "G.1 · Validación de pólizas en segundos",
    desc: "Antes de admitir al paciente, sabes qué cubre y qué no. Cero sorpresas a la hora del alta.",
  },
  {
    title: "G.2 · Predicción de denegaciones",
    desc: "Modelo entrenado en patrones reales de aseguradoras y TPAs MX. Alerta antes de facturar.",
  },
  {
    title: "G.3 · Automatización de facturación",
    desc: "Conversión automática de notas clínicas a códigos CIE-10 y procedimientos. Reduces backlog.",
  },
  {
    title: "G.4 · Seguimiento de cobranza",
    desc: "Dashboard de cuentas por cobrar con priorización por riesgo y antigüedad. -20-30% DSO.",
  },
  {
    title: "G.5 · Detección de fraude",
    desc: "Patrones anómalos de facturación, codificación y referenciación.",
  },
];

const EHR_FEATURES = [
  {
    title: "Captura única, sin doble registro",
    desc: "El médico documenta una vez. Calidad, RCM y reporteo SINBA se nutren del mismo flujo.",
  },
  {
    title: "Reporteo SINBA/SINAIS automatizado",
    desc: "Cumplimiento Reforma LGS 2026 sin trabajo manual. Caballo de Troya regulatorio.",
  },
  {
    title: "Credencial Paciente 2026 nativa",
    desc: "Identidad clínica unificada compatible con la nueva credencial federal.",
  },
  {
    title: "Interop mediadora",
    desc: "Bridges con sistemas legacy (SAP, Epic-lite, in-house). No te obligamos a migrar todo de golpe.",
  },
];

const TARGETS = [
  "Christus Muguerza",
  "TecSalud",
  "Hospitales MAC",
  "Grupo Ángeles",
  "Médica Sur",
];

export default function HospitalesPage() {
  return (
    <>
      <PageHero
        eyebrow="Capa B + G · Hospitales"
        title={
          <>
            Recupera{" "}
            <span className="lg-serif-italic text-validation">5–15%</span> de
            ingresos. Reduce DSO 20-30%.
          </>
        }
        description="RCM Copilot + EHR ligero, ambos compatibles con la Reforma LGS Salud Digital 2026. Empezamos por revenue cycle, escalamos a EHR completo."
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <Eyebrow>Capa G · Revenue Cycle Management</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Tu palanca de ROI rápido — antes del EHR completo.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">
            Empezamos por donde duele: pólizas validadas, denegaciones
            predichas, cobranza limpia. Sin migración masiva, sin reemplazo de
            sistemas existentes.
          </p>
          <div className="mt-10">
            <FeatureList items={RCM_FEATURES} />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <Eyebrow>Capa B · EHR ligero</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            EHR construido sobre el RCM ya instalado.
          </h2>
          <div className="mt-10">
            <FeatureList items={EHR_FEATURES} />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <Eyebrow>Targets de Fase 2A · Hospitales privados premium</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Construimos para los grupos que mueven el sector privado mexicano.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {TARGETS.map((t) => (
              <TiltCard key={t} className="px-4 py-5 text-center">
                <p className="text-body-sm font-semibold text-ink-strong">
                  {t}
                </p>
              </TiltCard>
            ))}
          </div>
          <p className="mt-6 max-w-prose text-caption text-ink-soft">
            [verificar copy] Targets nombrados en estrategia interna · sin
            relación comercial confirmada al cierre de mayo 2026.
          </p>
        </div>
      </section>

      <FinalCta
        title="Demo guiada — 30 minutos."
        description="Si tu hospital procesa más de 5,000 pacientes/mes, tienes un caso de ROI claro en RCM. Vamos a verlo juntos."
      />
    </>
  );
}
