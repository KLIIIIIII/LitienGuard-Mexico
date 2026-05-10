import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { FeatureList } from "@/components/feature-list";
import { TrustRow } from "@/components/trust-row";
import { FinalCta } from "@/components/final-cta";
import { TiltCard } from "@/components/tilt-card";
import { Eyebrow } from "@/components/eyebrow";
import { FloatingMockup } from "@/components/floating-mockup";

export const metadata: Metadata = {
  title: "Para médicos",
  description:
    "Cerebro clínico curado, scribe ambient SOAP y loop de calidad sobre tus decisiones. Evidencia citada verbatim.",
};

const FEATURES = [
  {
    title: "Cerebro clínico curado en español",
    desc: "2,758 chunks indexados desde GPC IMSS, KDIGO, ENSANUT y tesis universitarias elite. BM25 + filtros por sector.",
  },
  {
    title: "AI Scribe ambient self-hosted",
    desc: "Whisper + Llama 3.1 corren en tu equipo. Audio nunca sale del consultorio. Nota SOAP en español MX en 13 segundos.",
  },
  {
    title: "Loop de calidad sobre tus consultas",
    desc: "Registra outcome (siguió / no siguió / modificado). Métricas de tu propia práctica, no benchmarks de Estados Unidos.",
  },
  {
    title: "Cita verbatim, siempre",
    desc: "Cada recomendación lleva GPC, página, fuerza de evidencia y referencia bibliográfica original. Cero alucinación.",
  },
];

export default function MedicosPage() {
  return (
    <>
      <PageHero
        eyebrow="Capa A · Médicos"
        title={
          <>
            Tu segundo cerebro,{" "}
            <span className="lg-serif-italic text-validation">curado</span> en
            español.
          </>
        }
        description="Decisiones clínicas con evidencia citada, scribe ambient que libera 4-6 horas al día y loop de calidad sobre tus propias consultas. Sin enviar PII a un LLM externo."
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell grid gap-12 lg:grid-cols-[1fr_minmax(0,440px)] lg:items-start">
          <div>
            <Eyebrow>Lo que cambia para ti</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Menos clicks. Más consulta.
            </h2>
            <p className="mt-4 max-w-prose text-body text-ink-muted">
              El scribe escucha la consulta, transcribe con Whisper, sintetiza
              SOAP con Llama 3.1 — todo en tu computadora. Tú revisas y firmas.
              El cerebro complementa con evidencia cuando la pides.
            </p>
            <div className="mt-8">
              <FeatureList items={FEATURES} />
            </div>
          </div>
          <div className="relative">
            <FloatingMockup />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <Eyebrow>Cobertura clínica al cierre mayo 2026</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Cuatro sectores activos. Diabetes a profundidad.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { sector: "Diabetes", chunks: "1,016" },
              { sector: "Cardiología", chunks: "318" },
              { sector: "Neurología", chunks: "433" },
              { sector: "Gineco-Oncología", chunks: "317" },
            ].map((s) => (
              <TiltCard key={s.sector} className="p-5">
                <Eyebrow tone="validation">{s.sector}</Eyebrow>
                <p className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
                  {s.chunks}
                </p>
                <p className="mt-1 text-caption text-ink-muted">
                  chunks indexados con cita
                </p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <TrustRow />
      <FinalCta
        title="Súmate al piloto con médicos amigos."
        description="Estamos abriendo a 10 médicos para validar el flujo completo. Cero costo durante el piloto."
      />
    </>
  );
}
