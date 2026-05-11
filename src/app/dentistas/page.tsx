import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { FeatureList } from "@/components/feature-list";
import { TrustRow } from "@/components/trust-row";
import { FinalCta } from "@/components/final-cta";
import { TiltCard } from "@/components/tilt-card";
import { Eyebrow } from "@/components/eyebrow";

export const metadata: Metadata = {
  title: "Para dentistas — LitienGuard",
  description:
    "Scribe ambient para notas SOAP odontológicas, planes de tratamiento estructurados y validación de seguros dentales. Diseñado para consultorio mexicano.",
};

const FEATURES = [
  {
    title: "Notas SOAP odontológicas dictadas, no escritas",
    desc: "Escuchamos la consulta y devolvemos una nota estructurada en español: motivo, exploración, diagnóstico, plan de tratamiento. Tú revisas y firmas. Recuperas tiempo para más pacientes o para tu vida.",
  },
  {
    title: "Plan de tratamiento listo para entregar",
    desc: "Procedimientos numerados, costos estimados, secuencia recomendada y consentimiento informado base. El paciente sale del consultorio con un PDF claro, no con dudas.",
  },
  {
    title: "Guías clínicas curadas, citadas verbatim",
    desc: "Endo, perio, operatoria, implantes y odontopediatría — basado en evidencia de la ADA, el Colegio Mexicano de Odontología y las normas oficiales mexicanas (NOM-013-SSA2 y conexas).",
  },
  {
    title: "Validación de seguros dentales en segundos",
    desc: "Metlife Dental, AXA Dental, GNP Dental y planes corporativos: sabes qué cubre el paciente antes de empezar el tratamiento. Cero sorpresas al cobrar.",
  },
  {
    title: "Privacidad del paciente, sin compromisos",
    desc: "Cumple con la Ley Federal de Protección de Datos (LFPDPPP) y la NOM-024-SSA3. El audio de tus consultas no se reutiliza para entrenar modelos externos.",
  },
];

const FOR_WHOM = [
  {
    label: "Consultorio individual",
    desc: "Un solo dentista, agenda apretada, quiere recuperar horas de fin de día capturando notas.",
  },
  {
    label: "Clínica de 2-5 dentistas",
    desc: "Equipo pequeño que comparte recepción y necesita estandarizar planes de tratamiento y cobranza.",
  },
  {
    label: "Clínicas con seguros activos",
    desc: "Mezcla de pacientes privados y con cobertura. La validación de pólizas en segundos cambia el flujo.",
  },
];

export default function DentistasPage() {
  return (
    <>
      <PageHero
        eyebrow="Para dentistas"
        title={
          <>
            Documenta y planea{" "}
            <span className="lg-serif-italic text-validation">en voz alta</span>.
            Cobra en automático.
          </>
        }
        description="Escribimos la nota odontológica mientras tú haces la consulta. Estructuramos el plan de tratamiento. Validamos el seguro del paciente antes de empezar. Todo en español mexicano y diseñado para el flujo real del consultorio."
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <div className="mb-12 max-w-2xl">
            <Eyebrow>Lo que cambia para ti</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Menos tiempo en la computadora. Más tiempo con tus pacientes.
            </h2>
            <p className="mt-4 max-w-prose text-body text-ink-muted">
              El dentista mexicano dedica entre 1.5 y 2 horas al día a notas,
              planes y cobranza administrativa. Esas son las horas que
              recuperas.
            </p>
          </div>
          <FeatureList items={FEATURES} />
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <Eyebrow>¿Es para ti?</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Si tu consultorio se ve así, hay un caso claro.
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
        title="Súmate al piloto."
        description="Estamos abriendo cupos a clínicas dentales mexicanas para validar el flujo completo. Cero costo durante el piloto, prioridad de ajustes a tu propio caso."
      />
    </>
  );
}
