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

      {/* Caso 1 — gestión crónica de complejidad conocida (HFrEF) */}
      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <div className="max-w-3xl">
            <Eyebrow tone="validation">
              Caso 1 · gestión de complejidad conocida
            </Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Insuficiencia cardíaca con FEVI reducida.
            </h2>
            <p className="mt-3 max-w-prose text-body text-ink-muted">
              Sra. G.R., 68 años. El médico sabe el diagnóstico — el reto es
              ajustar GDMT a dosis target sin omitir pilares. El cerebro cita
              guías con número de página y hazard ratios; el médico decide,
              firma, y queda registrado el override cuando se aparta.
            </p>
          </div>

          <div className="mt-10 space-y-6">
            <CaseContext />
            <DecisionSupportDemo />
          </div>
        </div>
      </section>

      {/* Caso 2 — detección de enfermedad rara multi-señal (Amiloidosis) */}
      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <div className="max-w-3xl">
            <Eyebrow tone="validation">
              Caso 2 · detección donde otros sistemas no llegan
            </Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Donde el patrón solo aparece al cruzar 6 fuentes.
            </h2>
            <p className="mt-3 max-w-prose text-body text-ink-muted">
              Enfermedades multi-variable como la amiloidosis cardíaca por
              transtiretina tienen 4 años promedio de retraso diagnóstico.
              Ninguna señal individual es específica; la combinación de las 6
              lo es. El cerebro las correlaciona en la primera consulta.
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
