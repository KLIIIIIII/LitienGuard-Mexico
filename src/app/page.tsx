import { Hero } from "@/components/hero";
import { StatsBanner } from "@/components/stats-banner";
import { ForWhomGrid } from "@/components/for-whom-grid";
import { HowItWorks } from "@/components/how-it-works";
import { TrustRow } from "@/components/trust-row";
import { ReformBanner } from "@/components/reform-banner";
import { CtaForm } from "@/components/cta-form";
import { ComplianceStrip } from "@/components/compliance-strip";
import { CaseContext } from "@/components/demos/case-context";
import { DecisionSupportDemo } from "@/components/demos/decision-support-demo";
import { AmyloidDetectionDemo } from "@/components/demos/amyloid-detection-demo";
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

      {/* Soporte a la decisión con cita verbatim (HFrEF) */}
      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <div className="max-w-3xl">
            <Eyebrow tone="validation">
              Optimización terapéutica guiada
            </Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Cita verbatim, hazard ratios, override registrado.
            </h2>
            <p className="mt-3 max-w-prose text-body text-ink-muted">
              El cerebro no prescribe — propone, con texto literal de KDIGO,
              ESC y AHA con número de página. El médico decide y firma; si
              se aparta, su razonamiento queda en el expediente para el
              loop de calidad.
            </p>
          </div>

          <div className="mt-10 space-y-6">
            <CaseContext />
            <DecisionSupportDemo />
          </div>
        </div>
      </section>

      {/* Detección multi-señal de enfermedad compleja (ATTR-CM) */}
      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <div className="max-w-3xl">
            <Eyebrow tone="validation">
              Convergencia diagnóstica multi-señal
            </Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Donde una sola señal nunca alcanza, las seis sí.
            </h2>
            <p className="mt-3 max-w-prose text-body text-ink-muted">
              Enfermedades como la amiloidosis cardíaca por transtiretina
              tienen 4 años promedio de retraso diagnóstico. Mira cómo la
              probabilidad cambia en tiempo real conforme el cerebro
              incorpora cada señal.
            </p>
          </div>

          <div className="mt-10">
            <AmyloidDetectionDemo />
          </div>
        </div>
      </section>

      {/* Impacto clínico medible */}
      <section className="border-b border-line bg-canvas py-20">
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

      {/* Case study */}
      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <div className="max-w-2xl">
            <Eyebrow tone="validation">Cómo lo vive un cardiólogo</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Semana 9 del piloto, su cohorte propia.
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
