import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { FeatureList } from "@/components/feature-list";
import { FinalCta } from "@/components/final-cta";
import { TiltCard } from "@/components/tilt-card";
import { Eyebrow } from "@/components/eyebrow";

export const metadata: Metadata = {
  title: "Para pacientes — LitienGuard Asistencia",
  description:
    "Triaje, comparador de cobertura, recursos cercanos y plan integrado en PDF. Funciona con IMSS, ISSSTE, IMSS-Bienestar, Pemex, SEDENA, SEMAR, privado y sin seguro.",
};

const FEATURES = [
  {
    title: "Triaje rápido — Manchester + NOM-027",
    desc: "Seis preguntas. Te decimos si vas a urgencias hoy, agendas con tu médico esta semana, o esperas y observas.",
  },
  {
    title: "Comparador clínico — IMSS, privado, INSABI",
    desc: "Para tu padecimiento exacto: qué cubre cada esquema, cuánto pagas de tu bolsillo, cuánto tarda y dónde te conviene.",
  },
  {
    title: "Recursos cercanos en tiempo real",
    desc: "Unidades médicas filtradas por estado, esquema y especialidad. Dirección, teléfono y cómo llegar.",
  },
  {
    title: "Plan integrado en PDF",
    desc: "Llevalo a tu cita. Incluye urgencia, cobertura, comparativa, top 5 unidades y pasos numerados.",
  },
  {
    title: "Mis derechos, en simple",
    desc: "12 derechos clave del paciente. Atención oportuna, segunda opinión, expediente, queja sin represalias.",
  },
];

const SUB_TABS = [
  { n: "01", label: "¿Qué hago ahora?", desc: "Wizard guiado paso a paso." },
  { n: "02", label: "Triaje rápido", desc: "Manchester + NOM-027." },
  { n: "03", label: "¿Qué cubre mi seguro?", desc: "Coverage finder por esquema." },
  { n: "04", label: "Comparador clínico", desc: "Qué te conviene por padecimiento." },
  { n: "05", label: "Recursos cercanos", desc: "Unidades médicas con cita." },
  { n: "06", label: "Mis derechos", desc: "12 derechos clave del paciente." },
  { n: "07", label: "Trámites", desc: "9 guías paso a paso." },
];

export default function PacientesPage() {
  return (
    <>
      <PageHero
        eyebrow="Capa C · LitienGuard Asistencia"
        title={
          <>
            Tu navegador del{" "}
            <span className="lg-serif-italic text-validation">sistema</span> de
            salud mexicano.
          </>
        }
        description="Diseñado para todos los esquemas: IMSS, ISSSTE, IMSS-Bienestar, Pemex, SEDENA, SEMAR, privado o sin seguro. Lenguaje simple, sin jerga médica."
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <div className="mb-12 max-w-2xl">
            <Eyebrow>Lo que resuelve</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Cuando tienes un síntoma, no necesitas Google. Necesitas saber
              qué hacer.
            </h2>
          </div>
          <FeatureList items={FEATURES} />
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <Eyebrow>Siete sub-tabs en orden de flujo natural</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            De síntoma a trámite, sin perderte.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SUB_TABS.map((t) => (
              <TiltCard key={t.n} className="p-5">
                <p className="text-caption font-mono font-semibold text-ink-soft">
                  {t.n}
                </p>
                <h3 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
                  {t.label}
                </h3>
                <p className="mt-1 text-body-sm text-ink-muted">{t.desc}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-warn-soft py-14">
        <div className="lg-shell">
          <Eyebrow tone="warn">Disclaimer importante</Eyebrow>
          <p className="mt-3 max-w-3xl text-body text-ink-strong">
            LitienGuard Asistencia te ayuda a navegar el sistema de salud, no
            sustituye atención médica profesional. Si tienes una emergencia,
            llama al 911 inmediatamente.
          </p>
        </div>
      </section>

      <FinalCta
        title="¿Listo para tomar control de tu salud?"
        description="Pre-regístrate y te avisamos cuando Asistencia esté abierto al público."
      />
    </>
  );
}
