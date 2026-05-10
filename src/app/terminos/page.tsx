import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { LegalSection } from "@/components/legal-section";

export const metadata: Metadata = {
  title: "Términos de uso",
  description:
    "Términos y condiciones de uso de LitienGuard. Disclaimer médico y limitaciones.",
};

export default function TerminosPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Términos de uso."
        description="Última actualización: mayo 2026. Al usar este sitio o cualquier producto LitienGuard usted acepta los siguientes términos."
        variant="alt"
      />

      <article className="lg-shell max-w-3xl py-12">
        <section className="rounded-2xl border border-rose-soft bg-rose-soft p-6">
          <p className="lg-eyebrow text-rose">Disclaimer médico</p>
          <p className="mt-3 text-body font-semibold text-ink-strong">
            LitienGuard NO sustituye atención médica profesional, diagnóstico
            ni tratamiento.
          </p>
          <p className="mt-2 text-body-sm leading-relaxed text-ink-strong">
            Si tiene una emergencia médica, llame al 911 inmediatamente.
            Cualquier información proporcionada por este sitio o sus productos
            tiene fines exclusivamente educativos y de orientación. La decisión
            clínica final corresponde a un profesional de la salud autorizado.
          </p>
        </section>

        <LegalSection number="01" title="Aceptación de los términos">
          <p>
            Al acceder a este sitio web o utilizar cualquier producto LitienGuard
            usted acepta estos Términos de Uso. Si no está de acuerdo con alguno
            de ellos, le pedimos no utilizar el servicio.
          </p>
        </LegalSection>

        <LegalSection number="02" title="Naturaleza del servicio">
          <p>
            LitienGuard es una plataforma de inteligencia clínica curada que
            provee información basada en guías de práctica clínica oficiales,
            literatura médica revisada por pares y fuentes regulatorias. La
            información se presenta con cita textual y referencia bibliográfica.
          </p>
          <p>
            Esta información <strong>no constituye consejo médico individual</strong>
            . Cada paciente requiere evaluación profesional personalizada.
          </p>
        </LegalSection>

        <LegalSection number="03" title="Limitación de responsabilidad">
          <p>
            En la medida máxima permitida por la ley aplicable, LitienGuard no
            será responsable por daños directos, indirectos, incidentales,
            especiales o consecuentes derivados del uso o imposibilidad de uso
            del servicio, incluidos sin limitación: errores de diagnóstico,
            decisiones clínicas o resultados adversos en pacientes.
          </p>
          <p>
            <span className="text-ink-soft">
              [verificar con abogado: incluir cláusula específica de exclusión
              conforme legislación mexicana aplicable a software médico SaaS]
            </span>
          </p>
        </LegalSection>

        <LegalSection number="04" title="Propiedad intelectual">
          <p>
            Todo el contenido del sitio (textos, gráficos, logos, código,
            estructura del cerebro curado) es propiedad de LitienGuard o sus
            licenciantes y está protegido por las leyes de propiedad intelectual
            aplicables.
          </p>
          <p>
            Las guías de práctica clínica, normas oficiales mexicanas y demás
            documentos oficiales referenciados son propiedad de sus respectivos
            titulares (IMSS, CENETEC, Secretaría de Salud, organizaciones
            internacionales). LitienGuard cita estos documentos con
            trazabilidad completa al original.
          </p>
        </LegalSection>

        <LegalSection number="05" title="Uso aceptable">
          <p>El usuario se compromete a no:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Utilizar el servicio para suplantar atención médica profesional.
            </li>
            <li>
              Intentar acceder a áreas restringidas, sistemas o datos no
              autorizados.
            </li>
            <li>
              Reproducir, distribuir o crear obras derivadas sin autorización
              expresa.
            </li>
            <li>
              Realizar ingeniería inversa del software o cerebro curado.
            </li>
          </ul>
        </LegalSection>

        <LegalSection number="06" title="Modificaciones">
          <p>
            LitienGuard se reserva el derecho de modificar estos términos en
            cualquier momento. Los cambios serán notificados en este sitio con
            al menos 15 días de anticipación a su entrada en vigor.
          </p>
        </LegalSection>

        <LegalSection number="07" title="Ley aplicable y jurisdicción">
          <p>
            Estos términos se rigen por las leyes de los Estados Unidos
            Mexicanos. Para cualquier controversia, las partes se someten a la
            jurisdicción de los tribunales competentes de la Ciudad de México.
          </p>
        </LegalSection>

        <p className="mt-12 text-caption text-ink-soft">
          [verificar con abogado] Estos términos son una plantilla estructural.
          Antes de su uso público deben ser revisados por un abogado
          especialista en SaaS y software de salud.
        </p>
      </article>
    </>
  );
}
