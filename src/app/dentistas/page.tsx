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
    "Notas SOAP odontológicas dictadas, plan de tratamiento listo para firma física del paciente, odontograma digital y arquitectura de datos clínicos por capas. Diseñado para consultorio mexicano.",
};

const FEATURES = [
  {
    title: "Notas SOAP odontológicas dictadas, no escritas",
    desc: "La consulta se transcribe en tiempo real y se estructura en español: motivo, exploración, diagnóstico y plan de tratamiento. Tú revisas y firmas. Recupera 1.5 a 2 horas al día.",
  },
  {
    title: "Plan de tratamiento listo para imprimir y firmar",
    desc: "Procedimientos numerados, secuencia recomendada y consentimiento informado base, en un PDF listo para que el paciente firme en papel antes de salir del consultorio.",
  },
  {
    title: "Odontograma digital con exportación a PDF",
    desc: "Mapa interactivo de las 32 piezas dentales con estados clínicos completos. Se actualiza durante la consulta y se imprime junto con la historia clínica firmable.",
  },
  {
    title: "Guías clínicas curadas, citadas verbatim",
    desc: "Endodoncia, periodoncia, operatoria, implantes y odontopediatría — con evidencia de la ADA, el Colegio Mexicano de Odontología y normas oficiales mexicanas. Cero alucinación, cita siempre disponible.",
  },
  {
    title: "Validación de seguros dentales en segundos",
    desc: "Cobertura de Metlife Dental, AXA Dental, GNP Dental y planes corporativos identificada antes de iniciar el tratamiento. Cero sorpresas al cobrar.",
  },
];

const ARCHITECTURE = [
  {
    icon: Layers,
    title: "Arquitectura por capas",
    desc: "Información clínica, administrativa y fiscal viven en capas separadas con accesos independientes. Quien revisa una no entra a las otras.",
  },
  {
    icon: ShieldCheck,
    title: "Cumplimiento NOM-024 y LFPDPPP",
    desc: "El expediente clínico electrónico se construye siguiendo los requerimientos técnicos vigentes en México, con resguardo cifrado y trazabilidad de accesos.",
  },
  {
    icon: Printer,
    title: "PDF firmable a un clic",
    desc: "Consentimientos, planes de tratamiento, odontograma y alta voluntaria se imprimen listos para firma física cuando la práctica clínica o el paciente lo requieran.",
  },
  {
    icon: FileText,
    title: "Exportación clínica controlada",
    desc: "Generas el expediente completo de un paciente cuando lo necesitas — para referir a especialista, para entregar al paciente, o para cumplir una solicitud formal.",
  },
];

const FOR_WHOM = [
  {
    label: "Consultorio individual",
    desc: "Un solo profesional, agenda completa, busca recuperar horas que hoy se van en notas y planes de tratamiento al cierre del día.",
  },
  {
    label: "Clínica de 2 a 5 dentistas",
    desc: "Equipo pequeño con recepción compartida que necesita estandarizar planes de tratamiento, odontograma y cobranza entre sillones.",
  },
  {
    label: "Clínicas con mezcla de seguros",
    desc: "Operaciones donde conviven pacientes privados y con cobertura, y donde la validación de pólizas en segundos transforma el flujo de admisión.",
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
        description="LitienGuard escucha la consulta, redacta la nota SOAP odontológica y prepara el plan de tratamiento listo para imprimir y firmar con el paciente. Construido en español mexicano, con guías clínicas citadas y compatible con la realidad legal del consultorio."
        variant="alt"
      />

      <ComplianceStrip />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <div className="mb-12 max-w-2xl">
            <Eyebrow>Lo que cambia en tu consultorio</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Menos tiempo frente a la pantalla. Más tiempo con el paciente.
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
              Odontograma interactivo + plan de tratamiento sugerido.
            </h2>
            <p className="mt-3 max-w-prose text-body text-ink-muted">
              Esta es una captura real del odontograma de LitienGuard tal como
              se ve dentro de la app. Marca cada pieza con su estado clínico,
              genera el plan de tratamiento priorizado y deja la nota firmada
              lista para exportar.
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
              Plan de tratamiento listo para imprimir y firmar.
            </h2>
            <p className="mt-3 max-w-prose text-body text-ink-muted">
              Un solo PDF — datos del paciente, diagnóstico, procedimientos
              numerados con su pieza, consentimiento informado y bloque de
              firmas. Imprime, firma con el paciente y archiva. Mismo
              documento que exporta la app real.
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
            Información clínica, administrativa y fiscal claramente separadas.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">
            El expediente clínico vive en su propia capa, con sus propios
            accesos y su propia trazabilidad. La operación administrativa y la
            facturación son sistemas distintos que se comunican por integración,
            no por mezcla de datos.
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
            Tres perfiles para los que el caso es claro.
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
        description="Estamos abriendo cupos a consultorios dentales mexicanos. Cero costo durante el piloto, ajustes priorizados a tu propio caso, retroalimentación directa con quien construye el producto."
      />
    </>
  );
}
