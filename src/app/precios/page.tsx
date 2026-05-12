import type { Metadata } from "next";
import Link from "next/link";
import { Check, X, Sparkles, AlertCircle } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Eyebrow } from "@/components/eyebrow";
import { isBillingConfigured, PLANS } from "@/lib/stripe";
import { CycleToggle } from "./cycle-toggle";
import { CheckoutButton } from "./checkout-button";

export const metadata: Metadata = {
  title: "Planes y precios — LitienGuard",
  description:
    "Cuatro planes diseñados para distintos perfiles: explorador, médico individual, especialista activo, clínica multi-médico. Cancela cuando quieras.",
};

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

const FEATURES_BY_TIER: Record<
  "free" | "esencial" | "profesional" | "clinica",
  Array<{ label: string; ok: boolean }>
> = {
  free: [
    { label: "5 notas SOAP al mes", ok: true },
    { label: "Cerebro lectura — búsqueda en guías", ok: true },
    { label: "Scribe ambient con transcripción y SOAP automático", ok: false },
    { label: "Diferencial diagnóstico bayesiano", ok: false },
    { label: "Recetas electrónicas NOM-024", ok: false },
    { label: "Agenda de citas", ok: false },
  ],
  esencial: [
    { label: "100 SOAPs al mes (cargados manual)", ok: true },
    { label: "Cerebro lectura — IMSS, CENETEC, KDIGO, ESC, AHA", ok: true },
    { label: "Recetas electrónicas NOM-024", ok: true },
    { label: "Odontograma + export PDF", ok: true },
    { label: "MFA opcional y audit log", ok: true },
    { label: "Diferencial bayesiano", ok: false },
    { label: "Scribe ambient", ok: false },
    { label: "Soporte correo (48 h)", ok: true },
  ],
  profesional: [
    { label: "300 SOAPs al mes con scribe ambient", ok: true },
    { label: "Scribe ambient con procesamiento local de audio", ok: true },
    { label: "Cerebro completo + Q&A con citas verbatim", ok: true },
    { label: "Diferencial bayesiano · 28 enfermedades · 51 findings", ok: true },
    { label: "Auto-extracción de findings desde texto libre", ok: true },
    { label: "Recetas, agenda y reservación pública", ok: true },
    { label: "Mi calidad personal — calibración PPV", ok: true },
    { label: "Soporte correo (24 h)", ok: true },
  ],
  clinica: [
    { label: "Todo lo de Profesional", ok: true },
    { label: "Notas y citas ilimitadas", ok: true },
    { label: "Multi-médico con roles personalizados", ok: true },
    { label: "RCM Copilot (validación pólizas + cobranza · 2027)", ok: true },
    { label: "Integración con sistemas existentes", ok: true },
    { label: "SLA 99.5% y soporte dedicado", ok: true },
    { label: "Onboarding personalizado + capacitación", ok: true },
    { label: "Compatible Reforma LGS 2026 + NOM-024", ok: true },
  ],
};

const FAQ = [
  {
    q: "¿Cómo se factura?",
    a: "Cobramos automáticamente mes a mes (o anualmente con 2 meses de descuento) a la tarjeta que registres en Stripe. Puedes cancelar tu suscripción cuando quieras desde tu panel; el acceso continúa hasta el fin del periodo ya pagado.",
  },
  {
    q: "¿Puedo cambiar de plan después?",
    a: "Sí. Desde tu panel de facturación puedes subir o bajar de tier con prorrateo automático. El cambio surte efecto inmediato.",
  },
  {
    q: "¿Aceptan OXXO o transferencias?",
    a: "Stripe en México acepta tarjetas (crédito y débito nacionales e internacionales) y OXXO Pay. Para SPEI o transferencias directas, contáctanos para planes anuales.",
  },
  {
    q: "¿Emiten factura fiscal?",
    a: "Sí. Una vez completado el pago, escríbenos con tus datos fiscales y emitimos la factura correspondiente. Próximamente quedará automatizado.",
  },
  {
    q: "¿Hay periodo de prueba?",
    a: "El plan Explorador es gratis indefinidamente (con 5 notas SOAP al mes) — úsalo para probar el sistema antes de comprometerte con un plan pagado.",
  },
];

function priceLabel(plan: "esencial" | "profesional", cycle: "mensual" | "anual"): string {
  const cfg = PLANS[plan];
  if (cycle === "anual") {
    const monthly = Math.round(cfg.annualMxn / 12);
    return `$${monthly}`;
  }
  return `$${cfg.monthlyMxn}`;
}

function annualSavings(plan: "esencial" | "profesional"): string {
  const cfg = PLANS[plan];
  const yearAtMonthly = cfg.monthlyMxn * 12;
  const saved = yearAtMonthly - cfg.annualMxn;
  return `Ahorras $${saved} al año`;
}

export default async function PreciosPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params = await searchParams;
  const cycle: "mensual" | "anual" =
    typeof params.cycle === "string" && params.cycle === "anual"
      ? "anual"
      : "mensual";
  const checkoutCancelled = params.checkout === "cancelled";
  const errorParam = typeof params.error === "string" ? params.error : null;
  const billingEnabled = isBillingConfigured();

  return (
    <>
      <PageHero
        eyebrow="Planes y precios"
        title={
          <>
            Elige el plan que{" "}
            <span className="lg-serif-italic text-validation">
              acompañe tu práctica
            </span>
            .
          </>
        }
        description="Cuatro niveles diseñados para distintos perfiles. Empieza gratis, escala cuando lo necesites. Sin contratos largos: cancela cuando quieras."
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-12">
        <div className="lg-shell">
          {/* Notices */}
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
                Estamos en la última fase de configuración de pagos. Mientras
                tanto,{" "}
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

          {/* Cycle toggle */}
          <div className="mb-10 flex justify-center">
            <CycleToggle current={cycle} />
          </div>

          {/* Tier cards */}
          <div className="grid gap-5 lg:grid-cols-4">
            {/* Free */}
            <TierCard
              name="Explorador"
              eyebrow="Empieza gratis"
              price="$0"
              cycle="para siempre"
              description="Conoce el sistema sin pagar. Ideal para evaluar antes de comprometerte."
              features={FEATURES_BY_TIER.free}
              cta={
                <Link
                  href="/contacto#piloto"
                  className="lg-cta-ghost w-full justify-center"
                >
                  Empezar gratis
                </Link>
              }
            />

            {/* Esencial */}
            <TierCard
              name="Esencial"
              eyebrow="Médico individual"
              price={priceLabel("esencial", cycle)}
              cycle={cycle === "anual" ? "MXN / mes · pagado anual" : "MXN / mes"}
              annualNote={cycle === "anual" ? annualSavings("esencial") : null}
              description="Para médico general o dentista con consulta activa que quiere notas + cerebro curado."
              features={FEATURES_BY_TIER.esencial}
              cta={
                <CheckoutButton
                  plan="esencial"
                  cycle={cycle}
                  enabled={billingEnabled}
                  label="Suscribirme"
                />
              }
            />

            {/* Profesional (recomendado) */}
            <TierCard
              name="Profesional"
              eyebrow="Recomendado"
              price={priceLabel("profesional", cycle)}
              cycle={cycle === "anual" ? "MXN / mes · pagado anual" : "MXN / mes"}
              annualNote={cycle === "anual" ? annualSavings("profesional") : null}
              description="Especialista activo que necesita recetas, agenda con reservación pública y portal del paciente."
              features={FEATURES_BY_TIER.profesional}
              highlight
              cta={
                <CheckoutButton
                  plan="profesional"
                  cycle={cycle}
                  enabled={billingEnabled}
                  label="Suscribirme"
                  variant="primary"
                />
              }
            />

            {/* Clínica */}
            <TierCard
              name="Clínica"
              eyebrow="Multi-médico"
              price="A medida"
              cycle="desde $4,999 MXN / mes"
              description="Clínicas y hospitales privados que necesitan multi-usuario, RCM, integraciones y SLA."
              features={FEATURES_BY_TIER.clinica}
              cta={
                <Link
                  href="/contacto?plan=clinica"
                  className="lg-cta-ghost w-full justify-center"
                >
                  Hablar con ventas
                </Link>
              }
            />
          </div>
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
            ¿Tienes una clínica con necesidades específicas? Diseñamos un plan
            a tu medida.
          </p>
          <Link
            href="/contacto?plan=enterprise"
            className="lg-cta-primary mt-5 inline-flex"
          >
            Conversar con el equipo
          </Link>
        </div>
      </section>
    </>
  );
}

function TierCard({
  name,
  eyebrow,
  price,
  cycle,
  annualNote,
  description,
  features,
  cta,
  highlight,
}: {
  name: string;
  eyebrow: string;
  price: string;
  cycle: string;
  annualNote?: string | null;
  description: string;
  features: Array<{ label: string; ok: boolean }>;
  cta: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-xl border bg-surface p-6 shadow-soft ${
        highlight ? "border-validation shadow-deep" : "border-line"
      }`}
    >
      <div className="flex items-center gap-2">
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
          {eyebrow}
        </p>
        {highlight && (
          <span className="inline-flex items-center gap-1 rounded-full bg-validation-soft px-2 py-0.5 text-caption font-semibold text-validation">
            <Sparkles className="h-3 w-3" strokeWidth={2.2} />
            Más elegido
          </span>
        )}
      </div>
      <h3 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
        {name}
      </h3>
      <div className="mt-4">
        <p className="text-display font-bold text-ink-strong leading-none">
          {price}
        </p>
        <p className="mt-1 text-caption text-ink-muted">{cycle}</p>
        {annualNote && (
          <p className="mt-1 text-caption font-semibold text-validation">
            {annualNote}
          </p>
        )}
      </div>
      <p className="mt-4 text-body-sm text-ink-muted leading-relaxed">
        {description}
      </p>

      <ul className="mt-6 flex-1 space-y-2">
        {features.map((f) => (
          <li
            key={f.label}
            className="flex items-start gap-2 text-body-sm"
          >
            {f.ok ? (
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-validation"
                strokeWidth={2.2}
              />
            ) : (
              <X
                className="mt-0.5 h-4 w-4 shrink-0 text-ink-quiet"
                strokeWidth={2.2}
              />
            )}
            <span className={f.ok ? "text-ink-strong" : "text-ink-soft"}>
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6">{cta}</div>
    </div>
  );
}
