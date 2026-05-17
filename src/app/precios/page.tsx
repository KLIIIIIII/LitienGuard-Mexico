import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Eyebrow } from "@/components/eyebrow";
import { isBillingConfigured } from "@/lib/stripe";
import { PricingMatrix } from "./pricing-matrix";

export const metadata: Metadata = {
  title: "Planes y precios — LitienGuard",
  description:
    "Capa de inteligencia clínica con cerebro MX. Pricing por especialidad, tamaño de consultorio y volumen. Desde médico individual hasta hospital enterprise.",
};

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

const FAQ = [
  {
    q: "¿Por qué el cambio de precios?",
    a: "Después de 6 meses de iteración el stack es mucho más profundo: módulos hospitalarios Cerner-style, critical alerting automático, allergy hard-stop, adaptive importer con IA, cumplimiento documentado AMIA + HIMSS + FDA CDS 2026. El médico que paga obtiene 4× más valor del que recibía al inicio. Usuarios actuales mantienen su precio v1 hasta el primer renovación del 2027 (grandfathering).",
  },
  {
    q: "¿Los precios incluyen IVA?",
    a: "Sí. Todos los precios mostrados son precio final con IVA mexicano (16%) ya incluido.",
  },
  {
    q: "¿Cómo elijo entre Médico General / Especialista / Dentista?",
    a: "Médico General: medicina familiar, internista general, urgenciólogo. Especialista: cardiólogo, neurólogo, endocrinólogo, gineco-oncólogo, intensivista, cirujano — cualquier subespecialidad. Dentista: odontología general u especializada. La diferencia de precio refleja qué tanto cerebro especializado + motor de patrones consultas en tu flujo típico.",
  },
  {
    q: "¿Cómo se factura el plan Equipo?",
    a: "Mínimo 2 médicos, máximo 5. Se cobra por médico activo al mes. Si un médico se va, deja de facturarse al siguiente ciclo. Onboarding compartido. Para 6+ médicos en consultorio se recomienda Clínica.",
  },
  {
    q: "¿Qué pasa si exceso los SOAPs incluidos?",
    a: "Cada SOAP adicional se cobra $5 MXN en Esencial, $4 MXN en Profesional, $3 MXN en Clínica. Ilimitado en Hospital Enterprise. Te avisamos cuando llegues al 80% de tu cuota para que decidas si subes de tier.",
  },
  {
    q: "¿Cómo se factura el plan Clínica?",
    a: "Base incluye 6 médicos. Cada médico adicional desde el 7° suma $499 MXN/mes en Estándar o $999 MXN/mes en Pro. Hasta 30 médicos. Para 30+ → Hospital Enterprise.",
  },
  {
    q: "¿Aceptan OXXO o transferencias?",
    a: "Stripe en México acepta tarjetas (crédito y débito) y OXXO Pay. Para SPEI o transferencias directas, contáctanos para planes anuales o Hospital Enterprise.",
  },
  {
    q: "¿Emiten factura fiscal?",
    a: "La emisión automatizada de CFDI 4.0 se habilita al cierre del piloto. Mientras tanto coordinamos manualmente al cierre del plan anual.",
  },
  {
    q: "¿Hay periodo de prueba?",
    a: "El plan Explorador es gratis para siempre (5 SOAPs/mes, cerebro lectura básica). Úsalo para conocer el sistema antes de pagar.",
  },
];

export default async function PreciosPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params = await searchParams;
  const checkoutCancelled = params.checkout === "cancelled";
  const errorParam = typeof params.error === "string" ? params.error : null;
  const billingEnabled = isBillingConfigured();

  return (
    <>
      <PageHero
        eyebrow="Planes y precios v2"
        title={
          <>
            La inteligencia clínica que{" "}
            <span className="lg-serif-italic text-validation">
              complementa
            </span>{" "}
            tu sistema actual.
          </>
        }
        description="Pricing por especialidad, tamaño de consultorio y volumen. Desde médico individual hasta hospital enterprise. Convivimos con tu EHR — no lo reemplazamos."
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-12">
        <div className="lg-shell">
          {checkoutCancelled && (
            <div className="mb-8 max-w-2xl rounded-lg border border-warn-soft bg-warn-soft px-4 py-3 text-body-sm text-ink-strong">
              <p className="font-semibold">Cancelaste el checkout</p>
              <p className="mt-1 text-caption text-ink-muted">
                No se cobró nada. Cuando quieras volver a intentar, elige tu
                plan abajo.
              </p>
            </div>
          )}
          {errorParam && (
            <div className="mb-8 flex max-w-2xl items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft px-4 py-3 text-body-sm text-ink-strong">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose" />
              <p>{decodeURIComponent(errorParam)}</p>
            </div>
          )}
          {!billingEnabled && (
            <div className="mb-8 max-w-2xl rounded-lg border border-accent-soft bg-accent-soft/50 px-4 py-3 text-body-sm text-ink-strong">
              <p className="font-semibold">Suscripciones próximamente</p>
              <p className="mt-1 text-caption text-ink-muted">
                Los planes Pricing v2 están en configuración. Mientras tanto,{" "}
                <Link
                  href="/contacto"
                  className="font-semibold text-accent underline"
                >
                  escríbenos desde el formulario
                </Link>{" "}
                y te activamos el plan manualmente sin costo durante el piloto.
              </p>
            </div>
          )}

          <PricingMatrix billingEnabled={billingEnabled} />
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-line bg-surface-alt py-16">
        <div className="lg-shell max-w-3xl">
          <Eyebrow>Preguntas frecuentes</Eyebrow>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Lo que la mayoría pregunta antes de suscribirse.
          </h2>

          <div className="mt-10 space-y-6">
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="border-b border-line pb-6 last:border-b-0"
              >
                <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
                  {item.q}
                </h3>
                <p className="mt-2 text-body-sm text-ink-muted leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-canvas py-14">
        <div className="lg-shell text-center">
          <p className="text-body-sm text-ink-muted">
            ¿Tu clínica u hospital tiene 30+ médicos? Diseñamos un plan
            Enterprise a tu medida.
          </p>
          <Link
            href="/contacto?plan=enterprise"
            className="lg-cta-primary mt-5 inline-flex"
          >
            Hablar con ventas — Hospital Enterprise
          </Link>
        </div>
      </section>
    </>
  );
}
