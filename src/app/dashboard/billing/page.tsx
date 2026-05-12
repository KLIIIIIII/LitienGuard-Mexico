import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard, CheckCircle2, AlertCircle, ExternalLink, Calendar } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import {
  TIER_LABELS,
  type SubscriptionTier,
} from "@/lib/entitlements";
import { isBillingConfigured } from "@/lib/stripe";
import { OpenPortalButton } from "./open-portal-button";

export const metadata: Metadata = {
  title: "Facturación — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  active: { label: "Activa", cls: "bg-validation-soft text-validation" },
  trialing: { label: "En prueba", cls: "bg-accent-soft text-accent" },
  past_due: { label: "Pago pendiente", cls: "bg-warn-soft text-warn" },
  canceled: { label: "Cancelada", cls: "bg-rose-soft text-rose" },
  unpaid: { label: "Impaga", cls: "bg-rose-soft text-rose" },
  incomplete: { label: "Incompleta", cls: "bg-warn-soft text-warn" },
  incomplete_expired: {
    label: "Expirada",
    cls: "bg-rose-soft text-rose",
  },
  paused: { label: "Pausada", cls: "bg-warn-soft text-warn" },
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select(
      "subscription_tier, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, stripe_current_period_end, stripe_billing_cycle",
    )
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const hasStripe = !!profile?.stripe_customer_id;
  const billingEnabled = isBillingConfigured();

  const params = await searchParams;
  const successFlag = params.checkout === "success";
  const errorParam = typeof params.error === "string" ? params.error : null;
  const statusMeta =
    STATUS_LABEL[profile?.stripe_subscription_status ?? ""] ??
    STATUS_LABEL.active;

  const periodEnd = profile?.stripe_current_period_end
    ? new Date(profile.stripe_current_period_end)
    : null;

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow tone="validation">Facturación</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Tu plan y facturación
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
          Consulta tu plan activo, gestiona tu método de pago, descarga
          recibos o cambia de plan en cualquier momento.
        </p>
      </header>

      {successFlag && (
        <div className="flex items-center gap-2 rounded-lg border border-validation-soft bg-validation-soft px-4 py-3 text-body-sm text-validation">
          <CheckCircle2 className="h-4 w-4" />
          <span>
            Pago confirmado. Tu plan {TIER_LABELS[tier]} ya está activo.
          </span>
        </div>
      )}
      {errorParam && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft px-4 py-3 text-body-sm text-ink-strong">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose" />
          <span>{errorParam === "stripe_unavailable" ? "El sistema de pagos aún no está disponible. Inténtalo más tarde." : errorParam === "no_customer" ? "No tienes un perfil de Stripe creado todavía. Suscríbete a un plan primero." : decodeURIComponent(errorParam)}</span>
        </div>
      )}

      <div className="lg-card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
              Plan actual
            </p>
            <p className="mt-1 text-h2 font-semibold tracking-tight text-ink-strong">
              {TIER_LABELS[tier]}
            </p>
            {profile?.stripe_billing_cycle && (
              <p className="mt-1 text-caption text-ink-muted">
                Cobro {profile.stripe_billing_cycle}
              </p>
            )}
          </div>
          {profile?.stripe_subscription_status && (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold ${statusMeta.cls}`}
            >
              {statusMeta.label}
            </span>
          )}
        </div>

        {periodEnd && (
          <div className="flex items-center gap-2 border-t border-line pt-3 text-caption text-ink-muted">
            <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
            <span>
              {profile?.stripe_subscription_status === "canceled"
                ? "Acceso hasta"
                : "Próxima renovación"}
              :{" "}
              <strong className="text-ink-strong">
                {periodEnd.toLocaleDateString("es-MX", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {hasStripe && billingEnabled ? (
          <OpenPortalButton />
        ) : (
          <Link href="/precios" className="lg-cta-primary">
            <CreditCard className="h-4 w-4" />
            Ver planes disponibles
          </Link>
        )}
        <Link href="/precios" className="lg-cta-ghost">
          Cambiar de plan
        </Link>
      </div>

      <div className="lg-card border-warn-soft">
        <p className="text-caption font-semibold uppercase tracking-eyebrow text-warn">
          Facturas fiscales
        </p>
        <p className="mt-2 text-body-sm text-ink-muted leading-relaxed">
          ¿Necesitas factura con tus datos fiscales? Escríbenos a{" "}
          <a
            href="mailto:compras@grupoprodi.net?subject=Factura%20LitienGuard"
            className="font-semibold text-warn underline"
          >
            compras@grupoprodi.net
          </a>{" "}
          con tu RFC y razón social. La emitimos el mismo día hábil.
        </p>
      </div>

      <div className="lg-card">
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
          Necesitas algo más
        </p>
        <p className="mt-2 text-body-sm text-ink-muted leading-relaxed">
          ¿Quieres cancelar y eliminar tus datos? Usa el flujo de{" "}
          <Link href="/dashboard/cancelar" className="text-rose underline">
            cancelación de cuenta
          </Link>
          . Esto elimina tu información clínica conforme al derecho de
          Cancelación de la LFPDPPP, no solo tu suscripción.
          <br />
          Para hablar con el equipo, escríbenos a{" "}
          <a
            href="mailto:compras@grupoprodi.net"
            className="text-validation underline"
          >
            compras@grupoprodi.net
          </a>
          {" "}o agenda una llamada desde{" "}
          <Link href="/contacto" className="text-validation underline">
            /contacto
          </Link>
          .
        </p>
      </div>

      <p className="text-caption text-ink-soft leading-relaxed">
        Procesamos pagos a través de Stripe. Tu tarjeta nunca toca nuestros
        servidores: Stripe es PCI-DSS Level 1, el nivel más alto de
        cumplimiento de la industria.{" "}
        <a
          href="https://stripe.com/legal/safe-harbor"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-accent underline"
        >
          Más sobre la seguridad de Stripe
          <ExternalLink className="h-3 w-3" strokeWidth={2.2} />
        </a>
      </p>
    </div>
  );
}
