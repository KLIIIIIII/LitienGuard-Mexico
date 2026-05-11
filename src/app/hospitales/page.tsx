import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { FeatureList } from "@/components/feature-list";
import { FinalCta } from "@/components/final-cta";
import { TiltCard } from "@/components/tilt-card";
import { Eyebrow } from "@/components/eyebrow";
import { ComplianceStrip } from "@/components/compliance-strip";

export const metadata: Metadata = {
  title: "Para hospitales — Recupera ingresos y reduce DSO",
  description:
    "Validación de pólizas en segundos, predicción de denegaciones, automatización de facturación y EHR ligero compatible con la Reforma de Salud Digital 2026.",
};

const RCM_FEATURES = [
  {
    title: "Valida la póliza antes de admitir al paciente",
    desc: "Sabe en segundos qué cubre la aseguradora y qué no. Cero sorpresas a la hora del alta, cero reclamaciones tardías de pacientes.",
  },
  {
    title: "Predice denegaciones antes de facturar",
    desc: "Modelo entrenado con patrones reales de aseguradoras y administradoras mexicanas. Te avisa cuándo un claim probablemente será rechazado, antes de enviarlo.",
  },
  {
    title: "Convierte notas clínicas en facturación correcta",
    desc: "Codificación CIE-10 y procedimientos automática a partir de tus notas. Menos backlog en facturación, menos errores humanos.",
  },
  {
    title: "Cobra más rápido y con menos esfuerzo",
    desc: "Dashboard de cuentas por cobrar con priorización por antigüedad y riesgo de impago. Reducción típica de DSO entre 20% y 30%.",
  },
  {
    title: "Detecta fraude y patrones anómalos",
    desc: "Alertas cuando las cifras de facturación, codificación o referenciación se desvían de tu propia línea base.",
  },
];

const EHR_FEATURES = [
  {
    title: "Tus médicos documentan una sola vez",
    desc: "La nota clínica alimenta calidad, facturación y reporteo en un solo flujo. Sin duplicar captura, sin sistemas paralelos.",
  },
  {
    title: "Reporteo SINBA/SINAIS automatizado",
    desc: "Cumple con la Reforma General de Salud Digital 2026 sin trabajo manual mensual. Lo que antes consumía días, ahora se entrega solo.",
  },
  {
    title: "Compatible con la Credencial Paciente 2026",
    desc: "Identidad clínica unificada lista para la nueva credencial federal. Sin migraciones forzadas ni proyectos de TI a 12 meses.",
  },
  {
    title: "Convive con tus sistemas actuales",
    desc: "Puentes con SAP, sistemas internos y plataformas legacy. No te obligamos a tirar lo que ya invertiste — se integra encima.",
  },
];

const SEGMENTS = [
  {
    title: "100+ camas",
    desc: "Volumen suficiente para que el RCM mueva la aguja de tu EBITDA en un trimestre.",
  },
  {
    title: "5,000+ pacientes/mes",
    desc: "Suficientes claims para que la predicción de denegaciones se vuelva tu segunda nómina.",
  },
  {
    title: "3+ aseguradoras activas",
    desc: "Si tu mezcla de pagadores es compleja, la validación de pólizas paga el sistema en un mes.",
  },
  {
    title: "Múltiples ubicaciones",
    desc: "Reportes consolidados, reglas por unidad, conciliación centralizada — sin un equipo administrativo paralelo por sucursal.",
  },
];

export default function HospitalesPage() {
  return (
    <>
      <PageHero
        eyebrow="Hospitales privados"
        title={
          <>
            Recupera{" "}
            <span className="lg-serif-italic text-validation">5–15%</span> de
            ingresos. Cobra 20–30% más rápido.
          </>
        }
        description="Validación de pólizas, predicción de denegaciones, automatización de facturación y un EHR ligero que cumple con la Reforma de Salud Digital 2026. Empezamos por el ciclo de ingresos donde la inversión se paga sola, y crecemos contigo a EHR completo cuando ya hay resultados visibles."
        variant="alt"
      />

      <ComplianceStrip />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <Eyebrow>Ciclo de ingresos hospitalarios</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Donde más duele, donde más rápido se ve el ROI.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">
            La industria pierde entre 5% y 15% de ingresos cobrables en fugas
            administrativas: pólizas mal validadas, denegaciones evitables,
            cuentas que envejecen, errores de codificación. Empezamos por ahí
            — sin reemplazar tu HIS, sin proyectos de migración de un año.
          </p>
          <div className="mt-10">
            <FeatureList items={RCM_FEATURES} />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <Eyebrow>Expediente clínico electrónico</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            EHR construido encima del flujo ya instalado.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">
            Una vez que tu ciclo de ingresos está bajo control, el siguiente
            paso natural es que los médicos documenten una sola vez y todo el
            hospital se beneficie. Cumplimiento regulatorio incluido.
          </p>
          <div className="mt-10">
            <FeatureList items={EHR_FEATURES} />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <Eyebrow>¿Es para tu hospital?</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Si tu operación tiene este perfil, hay un caso de ROI claro.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {SEGMENTS.map((s) => (
              <TiltCard key={s.title} className="p-5">
                <p className="text-h3 font-semibold tracking-tight text-ink-strong">
                  {s.title}
                </p>
                <p className="mt-2 text-body-sm text-ink-muted">{s.desc}</p>
              </TiltCard>
            ))}
          </div>
          <p className="mt-6 max-w-prose text-caption text-ink-soft">
            Trabajamos con grupos hospitalarios privados premium en México.
            Si tu hospital no encaja exactamente con estos criterios pero
            quieres explorar, escríbenos: tomamos la conversación caso por caso.
          </p>
        </div>
      </section>

      <FinalCta
        title="Demo guiada — 30 minutos, con tus números."
        description="Te mostramos exactamente cuánto podrías recuperar en tu operación. Sin compromiso, sin demos genéricas — usamos un pedazo de tu data real para cuantificar el caso."
      />
    </>
  );
}
