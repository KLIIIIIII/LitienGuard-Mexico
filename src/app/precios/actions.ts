"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  getStripe,
  PLANS,
  priceIdFor,
  type BillingCycle,
  type PaidPlan,
} from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { recordAudit } from "@/lib/audit";

export type CheckoutResult =
  | { status: "ok"; url: string }
  | { status: "error"; message: string }
  | { status: "needs_auth"; loginUrl: string };

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://litien-guard-mexico.vercel.app"
  );
}

export async function startCheckout(
  plan: PaidPlan,
  cycle: BillingCycle,
): Promise<CheckoutResult> {
  const stripe = getStripe();
  if (!stripe) {
    return {
      status: "error",
      message:
        "El checkout aún no está habilitado. Escríbenos a compras@grupoprodi.net para suscribirte mientras se configura.",
    };
  }

  const priceId = priceIdFor(plan, cycle);
  if (!priceId) {
    return {
      status: "error",
      message:
        "Ese plan/ciclo aún no está configurado en Stripe. Inténtalo más tarde o contacta al equipo.",
    };
  }

  // Auth check — must be a logged-in user to attach the subscription
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user) {
    const returnTo = encodeURIComponent(`/precios?intent=${plan}_${cycle}`);
    return {
      status: "needs_auth",
      loginUrl: `/login?next=${returnTo}`,
    };
  }

  // Look up or create the Stripe Customer
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { status: "error", message: "Servicio no disponible." };
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, nombre, email")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email ?? undefined,
      name: profile?.nombre ?? undefined,
      metadata: { litienguard_user_id: user.id },
    });
    customerId = customer.id;
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl()}/dashboard/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/precios?checkout=cancelled`,
    allow_promotion_codes: true,
    locale: "es",
    metadata: {
      litienguard_user_id: user.id,
      plan,
      cycle,
    },
    subscription_data: {
      metadata: {
        litienguard_user_id: user.id,
        plan,
        cycle,
      },
    },
  });

  if (!session.url) {
    return { status: "error", message: "Stripe no devolvió URL de checkout." };
  }

  const hdrs = await headers();
  void recordAudit({
    userId: user.id,
    action: "billing.checkout_started",
    metadata: { plan, cycle, session_id: session.id },
    ip: hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  return { status: "ok", url: session.url };
}

/**
 * Server action invocada desde el formulario del precios — redirige
 * automáticamente al checkout (o al login) en lugar de devolver JSON.
 */
export async function redirectToCheckout(formData: FormData) {
  const plan = String(formData.get("plan")) as PaidPlan;
  const cycle = String(formData.get("cycle")) as BillingCycle;

  if (!(plan in PLANS) || (cycle !== "mensual" && cycle !== "anual")) {
    redirect(`/precios?error=invalid_plan`);
  }

  const r = await startCheckout(plan, cycle);
  if (r.status === "ok") redirect(r.url);
  if (r.status === "needs_auth") redirect(r.loginUrl);
  redirect(`/precios?error=${encodeURIComponent(r.message)}`);
}
