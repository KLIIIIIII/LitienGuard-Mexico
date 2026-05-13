import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { FeatureList } from "@/components/feature-list";
import { TrustRow } from "@/components/trust-row";
import { FinalCta } from "@/components/final-cta";
import { TiltCard } from "@/components/tilt-card";
import { Eyebrow } from "@/components/eyebrow";
import { ComplianceStrip } from "@/components/compliance-strip";
import { DiferenciadorStrip } from "@/components/diferenciador-strip";
import { DentalOdontogramDemo } from "@/components/dentistas/dental-odontogram-demo";
import { DentalPdfPreview } from "@/components/dentistas/dental-pdf-preview";
import { Printer, ShieldCheck, FileText, Layers } from "lucide-react";

export const metadata: Metadata = {
  title: "Para dentistas — LitienGuard",
  description:
    "Graba tu consulta y obtén SOAP estructurado en 13 segundos. Odontograma digital, plan de tratamiento listo para firma del paciente, recetas con estructura NOM-024. Para consultorios dentales en México.",
};

const FEATURES = [
  {
    title: "Notas SOAP por voz",
    desc: "Habla normal durante la consulta. En 13 segundos tienes el SOAP estructurado: motivo, exploración, diagnóstico y plan. Tú revisas y firmas. Recuperas 1.5 a 2 horas al día que hoy se van en redactar al cierre.",
  },
  {
    title: "Plan de tratamiento que el paciente firma antes de salir",
    desc: "El PDF queda con los procedimientos numerados, la secuencia sugerida por prioridad y el consentimiento informado base. El paciente firma en papel antes de salir del consultorio. Sin Word, sin formato suelto.",
  },
  {
    title: "Odontograma digital con 7 estados clínicos",
    desc: "Mapa interactivo de las 32 piezas con 7 estados: sano, caries, restaurado, endodoncia, corona, implante, ausente. Se actualiza durante la consulta y exporta a PDF junto con la historia clínica.",
  },
  {
    title: "Guías clínicas con cita verbatim",
    desc: "Endodoncia, periodoncia, operatoria, implantes, odontopediatría. Cada recomendación cita ADA, Colegio Mexicano de Odontología o la NOM correspondiente con el número de página del documento fuente. Nunca inventa.",
  },
  {
    title: "Validación de seguros dentales en segundos",
    desc: "Verifica cobertura Metlife Dental, AXA Dental, GNP Dental y planes corporativos antes de iniciar el tratamiento. El paciente ve en pantalla qué cubre y qué no. Cero llamadas a la aseguradora, cero sorpresas al cobrar.",
  },
];

const ARCHITECTURE = [
  {
    icon: Layers,
    title: "Tres capas independientes",
    desc: "El expediente clínico vive aparte del módulo administrativo y del fiscal. Tu contador entra a los CFDIs sin ver una sola consulta. Tu recepcionista agenda sin abrir notas clínicas.",
  },
  {
    icon: ShieldCheck,
    title: "Estructura conforme NOM-024-SSA3 y LFPDPPP",
    desc: "Expediente electrónico estructurado siguiendo NOM-024-SSA3-2012. TLS 1.3 en tránsito + cifrado en reposo (Supabase). Cada lectura y escritura queda registrada en el audit log con usuario, fecha y dispositivo.",
  },
  {
    icon: Printer,
    title: "PDF firmable en un click",
    desc: "Consentimientos, plan de tratamiento, odontograma y alta voluntaria salen como PDF listo para imprimir. Sin formatos a mano, sin Word, sin copy-paste de plantillas viejas.",
  },
  {
    icon: FileText,
    title: "Exportación completa del expediente",
    desc: "Cuando refieres al paciente con un especialista, generas el expediente entero en un PDF. Mismo PDF si el paciente lo solicita ejerciendo derecho de acceso bajo la LFPDPPP.",
  },
];

const FOR_WHOM = [
  {
    label: "Consultorio individual",
    desc: "Tú solo, agenda llena. Cierras consulta a las 8pm y luego pasas 2 horas redactando notas en Word. Esas 2 horas desaparecen el primer día.",
  },
  {
    label: "Clínica de 2 a 5 dentistas",
    desc: "2 a 5 sillones con una sola recepción. Cada sillón usa el mismo formato de plan, el mismo odontograma, la misma cobranza. Adiós a los Excels paralelos.",
  },
  {
    label: "Mezcla de privados y aseguradoras",
    desc: "Pacientes privados conviven con pacientes Metlife Dental o AXA. La validación de póliza en segundos elimina la llamada de \"déjame checar tu cobertura\" en admisión.",
  },
];

export default function DentistasPage() {
  return (
    <>
      <PageHero
        eyebrow="Para dentistas"
        title={
          <>
            Documenta{" "}
            <span className="lg-serif-italic text-validation">
              en voz alta
            </span>
            . Imprime listo para firma.
          </>
        }
        description="Graba la consulta. En 13 segundos tienes el SOAP estructurado y el plan de tratamiento listo para imprimir. El paciente firma en papel antes de salir. Recetas con estructura NOM-024 incluidas."
        variant="alt"
      />

      <ComplianceStrip />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <div className="mb-12 max-w-2xl">
            <Eyebrow>Lo que cambia en tu consultorio</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Menos pantalla, más paciente.
            </h2>
          </div>
          <FeatureList items={FEATURES} />
        </div>
      </section>

      {/* Demo 1 — Odontograma interactivo */}
      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <div className="mb-10 max-w-3xl">
            <Eyebrow tone="validation">Cómo se ve en la app</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Odontograma + plan de tratamiento priorizado.
            </h2>
            <p className="mt-3 max-w-prose text-body text-ink-muted">
              Captura real de la app. Click en cada pieza para marcar su
              estado, genera el plan de tratamiento priorizado y firma la
              nota clínica. El PDF firmable sale en menos de un minuto.
            </p>
          </div>
          <DentalOdontogramDemo />
        </div>
      </section>

      {/* Demo 2 — PDF firmable */}
      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <div className="mb-10 max-w-3xl">
            <Eyebrow tone="accent">Lo que el paciente firma</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Plan de tratamiento listo para imprimir.
            </h2>
            <p className="mt-3 max-w-prose text-body text-ink-muted">
              Datos del paciente, diagnóstico, procedimientos numerados con
              su pieza correspondiente, consentimiento informado y dos
              bloques de firma (paciente y profesional). Imprime, firma,
              archiva. Mismo PDF que sale de la app real.
            </p>
          </div>
          <div className="mx-auto max-w-3xl">
            <DentalPdfPreview />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <Eyebrow tone="validation">Arquitectura de datos clínicos</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Clínico, administrativo y fiscal viven aparte.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">
            El expediente clínico tiene sus propios permisos y su propio
            audit log. Tu contador y tu recepcionista nunca abren una nota.
            Cuando un especialista pide referencia, exportas solo la capa
            clínica. La operación fiscal vive en otra base y se comunica
            por integración, no por mezcla.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {ARCHITECTURE.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.title}
                  className="rounded-xl border border-line bg-surface p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-validation-soft text-validation">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div>
                      <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
                        {a.title}
                      </h3>
                      <p className="mt-1.5 text-body-sm text-ink-muted leading-relaxed">
                        {a.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <DiferenciadorStrip
        eyebrow="Por qué LitienGuard"
        title="Diferencias que se notan desde la primera consulta."
      />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <Eyebrow>¿Es para tu consultorio?</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Tres perfiles donde el caso es claro.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {FOR_WHOM.map((s) => (
              <TiltCard key={s.label} className="p-5">
                <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
                  {s.label}
                </h3>
                <p className="mt-2 text-body-sm text-ink-muted">{s.desc}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <TrustRow />

      <FinalCta
        title="Súmate al piloto dental."
        description="Estamos abriendo 10 cupos a consultorios dentales en México. Sin costo durante el piloto. Tu feedback va directo al producto. WhatsApp con quien lo construye, no con un soporte tercerizado."
      />
    </>
  );
}
