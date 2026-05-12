import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { CtaForm } from "@/components/cta-form";
import { Eyebrow } from "@/components/eyebrow";

export const metadata: Metadata = {
  title: "Contacto y acceso piloto",
  description:
    "Solicita acceso al piloto de LitienGuard. Te contactamos en menos de 48 horas.",
};

export default function ContactoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title={
          <>
            Hablemos de cómo{" "}
            <span className="lg-serif-italic text-validation">LitienGuard</span>{" "}
            te ayuda.
          </>
        }
        description="Médicos, hospitales, aliados o curiosos — escríbenos y te respondemos en menos de 48 horas."
        variant="alt"
      />

      <section id="piloto" className="border-b border-line bg-canvas py-20">
        <div className="lg-shell grid gap-12 lg:grid-cols-[1fr_minmax(0,460px)] lg:items-start">
          <div>
            <Eyebrow tone="validation">Acceso piloto</Eyebrow>
            <h2 className="mt-3 max-w-xl text-h1 font-semibold tracking-tight text-ink-strong">
              Envíanos tu solicitud.
            </h2>
            <p className="mt-4 max-w-prose text-body text-ink-muted">
              Cuéntanos quién eres, en qué estado de la república operas y qué
              te interesa de LitienGuard. Te contactamos en menos de 48 horas.
            </p>

            <dl className="mt-10 space-y-6">
              <div>
                <dt className="lg-eyebrow">Respuesta</dt>
                <dd className="mt-1.5 text-body-sm text-ink-strong">
                  Menos de 48 horas hábiles
                </dd>
              </div>
              <div>
                <dt className="lg-eyebrow">Sede</dt>
                <dd className="mt-1.5 text-body-sm text-ink-strong">
                  Ciudad de México, México
                </dd>
              </div>
            </dl>
          </div>

          <CtaForm />
        </div>
      </section>
    </>
  );
}
