import { HeroEnterprise } from "@/components/hero-enterprise";
import { AuthorityBar } from "@/components/authority-bar";
import { AudienceBand } from "@/components/audience-band";
import { CapabilitiesGrid } from "@/components/capabilities-grid";
import { SecurityBlock } from "@/components/security-block";
import { ImpactTable } from "@/components/demos/impact-table";
import { Eyebrow } from "@/components/eyebrow";
import { LiveAppDemos } from "@/components/demos/live-app-demos";
import { ReformBanner } from "@/components/reform-banner";
import { CtaForm } from "@/components/cta-form";

export default function HomePage() {
  return (
    <>
      <HeroEnterprise />

      <AuthorityBar />

      <AudienceBand />

      <CapabilitiesGrid />

      {/* Live demos compactos */}
      <LiveAppDemos />

      {/* Impacto clínico medible */}
      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <div className="max-w-3xl">
            <Eyebrow>Impacto clínico medible</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Seis métricas con baseline publicado.
            </h2>
            <p className="mt-4 max-w-prose text-body text-ink-muted leading-relaxed">
              No hablamos de &ldquo;más eficiencia&rdquo;. Hablamos de adherencia a
              GDMT, outcomes correlacionados con plan, override registrado
              para el loop de calidad y eventos adversos prevenibles.
              Comparado contra baselines mexicanos publicados.
            </p>
          </div>

          <div className="mt-10">
            <ImpactTable />
          </div>
        </div>
      </section>

      <SecurityBlock />

      <ReformBanner />

      {/* CTA final */}
      <section
        id="solicita-piloto"
        className="border-t border-line bg-canvas py-24"
      >
        <div className="lg-shell grid gap-12 lg:grid-cols-[1fr_minmax(0,460px)] lg:items-start">
          <div>
            <p className="text-caption uppercase tracking-eyebrow font-semibold text-validation">
              Hablar con ventas
            </p>
            <h2 className="mt-4 max-w-xl text-h1 font-semibold tracking-tight text-ink-strong">
              Implementación enterprise en{" "}
              <span className="text-validation">4–6 semanas.</span>
            </h2>
            <p className="mt-4 max-w-prose text-body text-ink-muted leading-relaxed">
              Programa una llamada con nuestro equipo de ventas
              hospitalarias. Entendemos tu operación clínica actual,
              identificamos los workflows con más impacto y diseñamos un
              plan de implementación con migración desde tu EHR existente.
            </p>
            <ul className="mt-6 space-y-2 text-body-sm text-ink-strong">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 inline-flex h-1 w-1 shrink-0 rounded-full bg-validation" />
                Migración HL7v2 / CDA XML / FHIR R4 desde tu EHR actual
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 inline-flex h-1 w-1 shrink-0 rounded-full bg-validation" />
                Onboarding clínico con tu equipo, no por correo
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 inline-flex h-1 w-1 shrink-0 rounded-full bg-validation" />
                Compliance Reforma LGS 2026 desde día uno
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 inline-flex h-1 w-1 shrink-0 rounded-full bg-validation" />
                Respuesta en menos de 48 horas
              </li>
            </ul>
          </div>
          <CtaForm />
        </div>
      </section>
    </>
  );
}
