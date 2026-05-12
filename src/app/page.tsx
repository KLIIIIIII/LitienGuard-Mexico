import { Hero } from "@/components/hero";
import { StatsBanner } from "@/components/stats-banner";
import { ForWhomGrid } from "@/components/for-whom-grid";
import { HowItWorks } from "@/components/how-it-works";
import { TrustRow } from "@/components/trust-row";
import { ReformBanner } from "@/components/reform-banner";
import { CtaForm } from "@/components/cta-form";
import { ComplianceStrip } from "@/components/compliance-strip";
import { ScribeTimelineDemo } from "@/components/demos/scribe-timeline-demo";
import { CerebroQaDemo } from "@/components/demos/cerebro-qa-demo";
import { DashboardMockup } from "@/components/demos/dashboard-mockup";
import { ImpactTable } from "@/components/demos/impact-table";
import { CaseStudy } from "@/components/demos/case-study";
import { Eyebrow } from "@/components/eyebrow";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ComplianceStrip />
      <StatsBanner />
      <ForWhomGrid />
      <HowItWorks />

      {/* Demos — qué cambia en tu práctica, con números */}
      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <div className="max-w-2xl">
            <Eyebrow tone="validation">Cómo cambia tu práctica</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Tres demos del producto en acción.
            </h2>
            <p className="mt-3 max-w-prose text-body text-ink-muted">
              Datos ilustrativos del piloto. No prometemos números genéricos:
              cada médico construye los suyos conforme acumula consultas en
              el sistema.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <ScribeTimelineDemo />
            <CerebroQaDemo />
            <div className="lg:col-span-2">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Impacto medido */}
      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <div className="max-w-2xl">
            <Eyebrow>Impacto medido</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Seis métricas que cambian de forma medible.
            </h2>
            <p className="mt-3 max-w-prose text-body text-ink-muted">
              La diferencia no se nota solo «en el ambiente del consultorio».
              Se mide en horas recuperadas, tiempo por nota, evidencia citada
              y outcomes que sí registras.
            </p>
          </div>

          <div className="mt-10">
            <ImpactTable />
          </div>
        </div>
      </section>

      {/* Case study */}
      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <div className="max-w-2xl">
            <Eyebrow tone="validation">Cómo lo vive un médico</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Un caso del piloto, con permiso del médico.
            </h2>
          </div>

          <div className="mt-10">
            <CaseStudy />
          </div>
        </div>
      </section>

      <TrustRow />
      <ReformBanner />
      <section
        id="solicita-piloto"
        className="border-t border-line bg-canvas py-24"
      >
        <div className="lg-shell grid gap-12 lg:grid-cols-[1fr_minmax(0,460px)] lg:items-start">
          <div>
            <p className="lg-eyebrow-validation">Acceso piloto</p>
            <h2 className="mt-4 max-w-xl text-h1 font-semibold tracking-tight text-ink">
              Construyamos juntos el sistema operativo clínico de{" "}
              <span className="lg-serif-italic text-validation">
                Latinoamérica
              </span>
              .
            </h2>
            <p className="mt-4 max-w-prose text-body text-ink-muted">
              Estamos abriendo el piloto a médicos, hospitales y aliados que
              quieran moldear el producto con nosotros. Cuéntanos quién eres y
              te contactamos en menos de 48 horas.
            </p>
          </div>
          <CtaForm />
        </div>
      </section>
    </>
  );
}
