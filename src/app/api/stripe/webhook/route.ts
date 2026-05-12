/**
 * Stripe webhook handler.
 *
 * - Verifica la firma del webhook con STRIPE_WEBHOOK_SECRET (defensa
 *   crítica: sin esto, cualquiera puede falsificar eventos de pago)
 * - Idempotencia: cada event_id se inserta en public.stripe_events; si
 *   ya existe, salimos rápido sin reprocesar
 * - Actualiza profiles.subscription_tier según el subscription status
 *
 * Endpoint debe estar registrado en el dashboard de Stripe apuntando a
 * https://litien-guard-mexico.vercel.app/api/stripe/webhook con los
 * eventos: checkout.session.completed, customer.subscription.created,
 * customer.subscription.updated, customer.subscription.deleted,
 * invoice.payment_succeeded, invoice.payment_failed.
 */

import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SubTier = "free" | "pilot" | "pro" | "enterprise";

/**
 * Map a subscription's metadata.plan back to the LitienGuard tier.
 * Falls back to inspecting the price's product if metadata is missing.
 */
function tierFromSubscription(sub: Stripe.Subscription): SubTier | null {
  const meta = sub.metadata?.plan;
  if (meta === "esencial") return "pilot";
  if (meta === "profesional") return "pro";

  // Fallback: try the first item's product metadata
  const item = sub.items.data[0];
  const product = item?.price?.product;
  if (typeof product === "object" && product && "metadata" in product) {
    const planFromProduct = (product as Stripe.Product).metadata?.plan;
    if (planFromProduct === "esencial") return "pilot";
    if (planFromProduct === "profesional") return "pro";
  }
  return null;
}

function cycleFromSubscription(
  sub: Stripe.Subscription,
): "mensual" | "anual" | null {
  const meta = sub.metadata?.cycle;
  if (meta === "mensual" || meta === "anual") return meta;
  const item = sub.items.data[0];
  if (item?.price?.recurring?.interval === "year") return "anual";
  if (item?.price?.recurring?.interval === "month") return "mensual";
  return null;
}

interface SubItemWithPeriod {
  current_period_end?: number;
}

function periodEndIso(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0] as unknown as SubItemWithPeriod | undefined;
  if (item?.current_period_end) {
    return new Date(item.current_period_end * 1000).toISOString();
  }
  return null;
}

async function applySubscription(sub: Stripe.Subscription): Promise<string> {
  const admin = getSupabaseAdmin();
  if (!admin) return "no_admin";

  const userId = sub.metadata?.litienguard_user_id;
  if (!userId) return "missing_user_metadata";

  const tier = tierFromSubscription(sub);
  const cycle = cycleFromSubscription(sub);

  // Active/trialing/past_due → keep paid tier; canceled/unpaid/incomplete → revert to free
  const liveStatuses = new Set([
    "active",
    "trialing",
    "past_due",
  ] as Stripe.Subscription.Status[]);
  const isLive = liveStatuses.has(sub.status);

  const updates: Record<string, unknown> = {
    stripe_subscription_id: sub.id,
    stripe_subscription_status: sub.status,
    stripe_current_period_end: periodEndIso(sub),
    stripe_billing_cycle: cycle,
  };

  if (isLive && tier) {
    updates.subscription_tier = tier;
  } else if (!isLive) {
    updates.subscription_tier = "free";
  }

  if (typeof sub.customer === "string") {
    updates.stripe_customer_id = sub.customer;
  }

  const { error } = await admin
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    console.error("[stripe/webhook] profile update error:", error);
    return `db_error: ${error.message}`;
  }

  return `ok_tier_${updates.subscription_tier ?? "unchanged"}`;
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 503 },
    );
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[stripe/webhook] signature verification failed:", msg);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "no_admin" }, { status: 500 });
  }

  // Idempotency: short-circuit if we already processed this event_id
  const { data: existing } = await admin
    .from("stripe_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, deduped: true });
  }

  let result = "ignored";
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          result = await applySubscription(sub);
          void recordAudit({
            userId: session.metadata?.litienguard_user_id ?? null,
            action: "billing.checkout_completed",
            metadata: {
              session_id: session.id,
              subscription_id: subId,
              tier_result: result,
            },
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        result = await applySubscription(sub);
        void recordAudit({
          userId: sub.metadata?.litienguard_user_id ?? null,
          action: `billing.${event.type}`,
          metadata: {
            subscription_id: sub.id,
            status: sub.status,
            tier_result: result,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        result = "invoice_failed_logged";
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : null;
        if (customerId) {
          const { data: profile } = await admin
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          void recordAudit({
            userId: profile?.id ?? null,
            action: "billing.payment_failed",
            metadata: {
              invoice_id: invoice.id,
              amount_due: invoice.amount_due,
              attempt_count: invoice.attempt_count,
            },
          });
        }
        break;
      }

      default:
        result = "ignored_event_type";
    }
  } catch (e) {
    console.error("[stripe/webhook] handler error:", e);
    result = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Record idempotently
  await admin.from("stripe_events").insert({
    event_id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
    result,
  });

  return NextResponse.json({ received: true, result });
}
