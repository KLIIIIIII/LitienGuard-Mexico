import { Hero } from "@/components/hero";
import { BrainArchitecture } from "@/components/brain-architecture";
import { ForWhomGrid } from "@/components/for-whom-grid";
import { HowItWorks } from "@/components/how-it-works";
import { TrustRow } from "@/components/trust-row";
import { ReformBanner } from "@/components/reform-banner";
import { CtaForm } from "@/components/cta-form";
import { ComplianceStrip } from "@/components/compliance-strip";
import { LiveAppDemos } from "@/components/demos/live-app-demos";
import { ImpactTable } from "@/components/demos/impact-table";
import { Eyebrow } from "@/components/eyebrow";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ComplianceStrip />
      <BrainArchitecture />
      <ForWhomGrid />
      <HowItWorks />

      {/* Live demos en tabs — los 3 flujos del producto en uso */}
      <LiveAppDemos />

      {/* Impacto clínico medible */}
      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <div className="max-w-2xl">
            <Eyebrow>Impacto clínico medible</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Seis métricas con baseline publicado.
            </h2>
            <p className="mt-3 max-w-prose text-body text-ink-muted">
              No hablamos de «más eficiencia». Hablamos de adherencia a GDMT,
              outcomes correlacionados con plan, override registrado para el
              loop de calidad, y eventos adversos prevenibles. Comparado
              contra baselines mexicanos publicados.
            </p>
          </div>

          <div className="mt-10">
            <ImpactTable />
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
              quieran moldear el producto con nosotros. Cuéntanos quién eres
              y te contactamos en menos de 48 horas.
            </p>
          </div>
          <CtaForm />
        </div>
      </section>
    </>
  );
}
