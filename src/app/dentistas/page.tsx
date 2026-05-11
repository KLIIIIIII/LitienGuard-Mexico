import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { FeatureList } from "@/components/feature-list";
import { TrustRow } from "@/components/trust-row";
import { FinalCta } from "@/components/final-cta";
import { TiltCard } from "@/components/tilt-card";
import { Eyebrow } from "@/components/eyebrow";
import { ComplianceStrip } from "@/components/compliance-strip";
import { DiferenciadorStrip } from "@/components/diferenciador-strip";
import { Printer, ShieldOff, FileText, Layers } from "lucide-react";

export const metadata: Metadata = {
  title: "Para dentistas — LitienGuard",
  description:
    "Notas SOAP odontológicas dictadas, plan de tratamiento listo para firma física, odontograma digital y cero datos fiscales mezclados con el expediente clínico. Diseñado para la realidad mexicana.",
};

const FEATURES = [
  {
    title: "Notas SOAP odontológicas dictadas, no escritas",
    desc: "Escuchamos la consulta y devolvemos una nota estructurada en español: motivo, exploración, diagnóstico, plan de tratamiento. Tú revisas y firmas. Recuperas las 1.5–2 horas que hoy pierdes en notas al final del día.",
  },
  {
    title: "Plan de tratamiento listo para imprimir y firmar",
    desc: "Procedimientos numerados, secuencia recomendada, consentimiento informado base — todo en un PDF que el paciente firma en papel antes de salir del consultorio. Cumple la realidad legal mexicana donde la firma física sigue siendo requerida.",
  },
  {
    title: "Odontograma digital con exportación a PDF",
    desc: "Mapa interactivo de las 32 piezas dentales con estados (sano, caries, restaurado, endodoncia, corona, ausente). Se actualiza durante la consulta y se imprime junto con la historia clínica firmable.",
  },
  {
    title: "Guías clínicas curadas, citadas verbatim",
    desc: "Endodoncia, periodoncia, operatoria, implantes y odontopediatría — basado en evidencia de la ADA, el Colegio Mexicano de Odontología y las normas oficiales (NOM-013-SSA2 y conexas). Cero alucinación.",
  },
  {
    title: "Validación de seguros dentales en segundos",
    desc: "Metlife Dental, AXA Dental, GNP Dental y planes corporativos: sabes qué cubre el paciente antes de empezar el tratamiento. Cero sorpresas al cobrar.",
  },
];

const FISCAL_SEPARATION = [
  {
    icon: ShieldOff,
    title: "Cero datos fiscales en el expediente clínico",
    desc: "Tu nota clínica vive separada de tu facturación. Si el SAT te pide expedientes, lo que ves es solo lo clínico — no hay vínculo automático con cobranza o pagos.",
  },
  {
    icon: Layers,
    title: "Arquitectura por capas",
    desc: "Información clínica · información administrativa · información fiscal son tres capas independientes con accesos separados. Quien revisa una no entra a las otras.",
  },
  {
    icon: FileText,
    title: "Cumplimiento NOM-024 sin riesgo fiscal añadido",
    desc: "Cumplir con el expediente clínico electrónico oficial no significa exponer tu operación a auditorías que no corresponden. Se hace bien o no se hace.",
  },
  {
    icon: Printer,
    title: "Impresión inmediata para firma física",
    desc: "Cuando necesites el papel firmado (consentimiento, alta voluntaria, ARCO), el sistema te lo da listo. Lo demás vive en digital.",
  },
];

const FOR_WHOM = [
  {
    label: "Consultorio individual",
    desc: "Un solo dentista, agenda apretada, quiere recuperar horas de fin de día capturando notas y planes de tratamiento.",
  },
  {
    label: "Clínica de 2–5 dentistas",
    desc: "Equipo pequeño que comparte recepción y necesita estandarizar planes de tratamiento, odontograma y cobranza.",
  },
  {
    label: "Clínicas con seguros activos",
    desc: "Mezcla de pacientes privados y con cobertura. La validación de pólizas en segundos cambia el flujo y elimina disputas al cobrar.",
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
            . Imprime listo para firma. Cumple sin miedo.
          </>
        }
        description="Escribimos la nota odontológica mientras tú haces la consulta. Imprimimos el plan de tratamiento para que el paciente lo firme en papel. Y mantenemos tu información clínica completamente separada de tu información fiscal — porque sabemos que esa es la conversación real del dentista mexicano."
        variant="alt"
      />

      <ComplianceStrip />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <div className="mb-12 max-w-2xl">
            <Eyebrow>Lo que cambia para ti</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Menos tiempo en la computadora. Más tiempo con tus pacientes.
            </h2>
            <p className="mt-4 max-w-prose text-body text-ink-muted">
              El dentista mexicano dedica entre 1.5 y 2 horas al día a notas,
              planes de tratamiento, odontograma y cobranza administrativa. Esas son las horas
              que recuperas.
            </p>
          </div>
          <FeatureList items={FEATURES} />
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <Eyebrow tone="validation">La conversación que nadie está teniendo</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Tu información clínica no es tu información fiscal.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">
            La razón #1 por la que muchos dentistas siguen con papel es el
            miedo: «si tengo todo digital y me lo piden, me chinga Hacienda».
            Real, válido, y resoluble con arquitectura, no con buenas
            intenciones. Así lo hacemos:
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {FISCAL_SEPARATION.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="rounded-xl border border-line bg-surface p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-validation-soft text-validation">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div>
                      <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
                        {s.title}
                      </h3>
                      <p className="mt-1.5 text-body-sm text-ink-muted leading-relaxed">
                        {s.desc}
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
        eyebrow="Por qué LitienGuard y no otro expediente dental"
        title="Cuatro razones que se notan en la primera consulta."
      />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <Eyebrow>¿Es para tu consultorio?</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Si tu operación se ve así, hay caso claro.
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
        description="Estamos abriendo cupos a consultorios dentales mexicanos para validar el flujo completo. Cero costo durante el piloto, prioridad de ajustes a tu propio caso. Si tu reto es Hacienda, NOM-024 o tiempo perdido en notas, llegamos preparados."
      />
    </>
  );
}
