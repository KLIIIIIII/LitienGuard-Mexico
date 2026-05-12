import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { FeatureList } from "@/components/feature-list";
import { FinalCta } from "@/components/final-cta";
import { TiltCard } from "@/components/tilt-card";
import { Eyebrow } from "@/components/eyebrow";

export const metadata: Metadata = {
  title: "Para pacientes — LitienGuard Asistencia",
  description:
    "Sabe qué hacer cuando tienes un síntoma, qué cubre tu seguro y dónde te conviene atenderte. Funciona con IMSS, ISSSTE, IMSS-Bienestar, Pemex, SEDENA, SEMAR, privado o sin seguro.",
};

const FEATURES = [
  {
    title: "Sabes qué hacer hoy mismo",
    desc: "Seis preguntas y te decimos si conviene urgencias hoy, una cita con tu médico esta semana, o esperar y observar — basado en el método Manchester y la NOM-027.",
  },
  {
    title: "Compara qué te cubre cada esquema",
    desc: "Para tu padecimiento específico: qué cubre IMSS, IMSS-Bienestar, INSABI o el seguro privado, cuánto pagarías de tu bolsillo, cuánto tarda cada uno.",
  },
  {
    title: "Encuentra dónde atenderte cerca",
    desc: "Hospitales, clínicas y centros de salud filtrados por tu estado, tu esquema y la especialidad que necesitas. Con dirección, teléfono y cómo llegar.",
  },
  {
    title: "Llévate un plan en PDF a tu cita",
    desc: "Urgencia, cobertura, comparativa y los siguientes pasos numerados — listo para mostrarle al médico o al personal administrativo.",
  },
  {
    title: "Conoce tus derechos como paciente",
    desc: "Atención oportuna, segunda opinión, acceso a tu expediente, queja sin represalias. Doce derechos explicados en lenguaje claro.",
  },
];

const STEPS = [
  {
    label: "Cuéntanos qué te pasa",
    desc: "Describe el síntoma en tus palabras. Sin tecnicismos.",
  },
  {
    label: "Te orientamos sobre la urgencia",
    desc: "Sabrás si esperar, llamar al médico o ir a urgencias.",
  },
  {
    label: "Te mostramos qué cubre tu seguro",
    desc: "Cobertura real para tu caso, no para casos generales.",
  },
  {
    label: "Comparas opciones de atención",
    desc: "Tiempo, costo y conveniencia para tu padecimiento.",
  },
  {
    label: "Encuentras dónde ir",
    desc: "Unidades médicas reales, con cómo llegar y cómo agendar.",
  },
  {
    label: "Conoces tus derechos",
    desc: "Lo que la ley te garantiza al recibir atención.",
  },
  {
    label: "Aprendes a hacer trámites",
    desc: "Reembolsos, traslados, expedientes — paso a paso.",
  },
];

export default function PacientesPage() {
  return (
    <>
      <PageHero
        eyebrow="LitienGuard Asistencia"
        title={
          <>
            Sabe qué hacer{" "}
            <span className="lg-serif-italic text-validation">antes</span> de
            ir al médico.
          </>
        }
        description="Cuando aparece un síntoma, no necesitas a Google. Necesitas saber qué tan urgente es, qué te cubre tu seguro y dónde te conviene atenderte. Funciona con IMSS, ISSSTE, IMSS-Bienestar, Pemex, SEDENA, SEMAR, seguro privado o sin seguro."
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <div className="mb-12 max-w-2xl">
            <Eyebrow>Lo que te ayudamos a resolver</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Cinco cosas concretas, en lenguaje claro.
            </h2>
          </div>
          <FeatureList items={FEATURES} />
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <Eyebrow>Cómo funciona</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            De duda a decisión, sin perderte en el camino.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <TiltCard key={s.label} className="p-5">
                <p className="font-mono text-caption font-semibold text-ink-soft">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
                  {s.label}
                </h3>
                <p className="mt-1 text-body-sm text-ink-muted">{s.desc}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-canvas py-14">
        <div className="lg-shell">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Eyebrow>¿Ya tienes cita pendiente?</Eyebrow>
              <p className="mt-2 max-w-2xl text-body text-ink-strong">
                Si tu médico usa LitienGuard, puedes reservar tu cita
                directamente en línea.
              </p>
            </div>
            <Link href="/agendar" className="lg-cta-ghost shrink-0">
              Agendar cita
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-warn-soft py-14">
        <div className="lg-shell">
          <Eyebrow tone="warn">Importante</Eyebrow>
          <p className="mt-3 max-w-3xl text-body text-ink-strong">
            LitienGuard Asistencia te orienta para navegar el sistema de salud,
            no sustituye la atención médica profesional. Si crees que estás
            ante una emergencia, llama al 911 inmediatamente.
          </p>
        </div>
      </section>

      <FinalCta
        title="Tu salud merece decisiones informadas."
        description="Pre-regístrate y te avisamos cuando Asistencia esté disponible. Cuando lo lances, querrás tenerlo desde el primer día."
      />
    </>
  );
}
