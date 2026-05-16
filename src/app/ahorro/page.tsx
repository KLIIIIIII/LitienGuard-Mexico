import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { Eyebrow } from "@/components/eyebrow";
import { Calculadora } from "./calculadora";

export const metadata: Metadata = {
  title: "Calculadora de ahorro · LitienGuard",
  description:
    "Cuánto vale el tiempo que pierdes documentando consultas. Calcula tu ahorro mensual y anual con LitienGuard Scribe.",
  openGraph: {
    title: "Calculadora de ahorro — LitienGuard",
    description:
      "El médico mexicano dedica 4-6 horas/día a documentar. Calcula cuánto te regresa LitienGuard Scribe.",
  },
};

export default function AhorroPage() {
  return (
    <>
      <PageHero
        eyebrow="ROI · Calculadora"
        title={
          <>
            Cuánto vale tu tiempo en{" "}
            <span className="lg-serif-italic text-validation">
              documentación
            </span>
            .
          </>
        }
        description="El médico mexicano dedica 4-6 horas al día a estructurar SOAP, recetas y notas en el expediente (Ross · FunSalud 2026). Ese tiempo tiene un costo de oportunidad. Calcula el tuyo."
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-16">
        <div className="lg-shell">
          <Calculadora />
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt py-16">
        <div className="lg-shell max-w-3xl">
          <Eyebrow>De dónde sale el cálculo</Eyebrow>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Conservador, no de marketing.
          </h2>
          <div className="mt-6 space-y-4 text-body text-ink-muted">
            <p>
              <strong className="text-ink-strong">Tiempo en documentación:</strong>{" "}
              Gustavo Ross (FunSalud · UP · Observatorio IA Salud MX) reporta 4-6
              horas/día en consulta privada. Usamos el rango bajo (4 hrs) como
              default.
            </p>
            <p>
              <strong className="text-ink-strong">Tarifa por hora:</strong> la
              calculadora multiplica tu tarifa por consulta por consultas/hora.
              Si tu tarifa es por consulta y das 3 consultas/hora a $800 c/u, tu
              tarifa por hora es $2,400. Ajusta a tu realidad.
            </p>
            <p>
              <strong className="text-ink-strong">Factor de ahorro 85%:</strong>{" "}
              LitienGuard Scribe estructura el SOAP en ~13 segundos por consulta
              (vs 5-15 min escribiendo a mano). En la práctica, recuperas ~85%
              del tiempo de documentación. Asumimos 48 semanas trabajadas/año
              (4 semanas off).
            </p>
            <p>
              <strong className="text-ink-strong">No incluido:</strong> tiempo
              ahorrado en consultas siguientes por tener el expediente al día,
              menos errores por documentación tardía, menor riesgo
              medicolegal por nota completa.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-canvas py-16">
        <div className="lg-shell">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow tone="validation">Siguiente paso</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              ¿El número te parece interesante?
            </h2>
            <p className="mt-4 text-body text-ink-muted">
              Estamos abriendo piloto a médicos privados. Cero costo durante el
              piloto. Si quieres validar el flujo con tus consultas, escríbenos.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/contacto" className="lg-cta-primary">
                Solicitar acceso piloto
              </Link>
              <Link href="/medicos" className="lg-cta-ghost">
                Ver el producto para médicos
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
