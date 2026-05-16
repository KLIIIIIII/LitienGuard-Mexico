import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { FeatureList } from "@/components/feature-list";
import { TrustRow } from "@/components/trust-row";
import { FinalCta } from "@/components/final-cta";
import { TiltCard } from "@/components/tilt-card";
import { Eyebrow } from "@/components/eyebrow";
import { FloatingMockup } from "@/components/floating-mockup";
import { ComplianceStrip } from "@/components/compliance-strip";
import { DiferenciadorStrip } from "@/components/diferenciador-strip";

export const metadata: Metadata = {
  title: "Para médicos",
  description:
    "Capa de inteligencia clínica encima del EHR que ya usas. Diferencial diagnóstico, red flags y loop de calidad personal — con cita verbatim a guía mexicana.",
};

const FEATURES = [
  {
    title: "Convive con tu sistema actual",
    desc: "No necesitas migrar de Nimbo, SaludTotal o el EHR que ya uses. LitienGuard vive encima — pegas tu nota SOAP y el cerebro responde con diferencial, red flags y referencias.",
  },
  {
    title: "Diferencial diagnóstico con cita verbatim",
    desc: "Motor que confronta tu hipótesis y te muestra qué otras enfermedades podrían explicar lo mismo. Cada sugerencia con guía oficial, página y referencia bibliográfica.",
  },
  {
    title: "Red flags por síntoma",
    desc: "Mientras documentas, el sistema escanea por banderas rojas conocidas (cefalea trueno, sangrado postmenopáusico, SCAD en mujer joven) y te las muestra al margen.",
  },
  {
    title: "Loop de calidad personal",
    desc: "Outcomes, PPV personal por enfermedad y patrones detectados desde TU práctica. Tu calibración real, no benchmarks importados de Estados Unidos.",
  },
];

export default function MedicosPage() {
  return (
    <>
      <PageHero
        eyebrow="Para médicos"
        title={
          <>
            La capa de{" "}
            <span className="lg-serif-italic text-validation">
              inteligencia clínica
            </span>{" "}
            encima del expediente que ya usas.
          </>
        }
        description="LitienGuard no reemplaza tu EHR — lo complementa. Diferencial diagnóstico, red flags por síntoma y loop de calidad personal sobre tus consultas. Con cita verbatim a guía mexicana y sin enviar PII a un LLM externo."
        variant="alt"
      />

      <ComplianceStrip />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell grid gap-12 lg:grid-cols-[1fr_minmax(0,440px)] lg:items-start">
          <div>
            <Eyebrow>Lo que cambia para ti</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Menos clicks. Más consulta.
            </h2>
            <p className="mt-4 max-w-prose text-body text-ink-muted">
              El scribe escucha la consulta, la transcribe en español y la
              estructura en formato SOAP firmable — todo procesado localmente
              en tu equipo. Tú revisas y firmas. El cerebro complementa con
              evidencia cuando la pides.
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
          <Eyebrow>Cobertura clínica activa</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Cuatro sectores activos. Diabetes a profundidad.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { sector: "Diabetes", note: "Profundidad alta" },
              { sector: "Cardiología", note: "Cobertura activa" },
              { sector: "Neurología", note: "Cobertura activa" },
              { sector: "Gineco-Oncología", note: "Cobertura activa" },
            ].map((s) => (
              <TiltCard key={s.sector} className="p-5">
                <Eyebrow tone="validation">{s.sector}</Eyebrow>
                <p className="mt-3 text-h3 font-semibold tracking-tight text-ink-strong">
                  {s.note}
                </p>
                <p className="mt-1 text-caption text-ink-muted">
                  con cita verbatim
                </p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <DiferenciadorStrip />

      <TrustRow />
      <FinalCta
        title="Súmate al piloto con médicos amigos."
        description="Estamos abriendo a 10 médicos para validar el flujo completo. Cero costo durante el piloto."
      />
    </>
  );
}
