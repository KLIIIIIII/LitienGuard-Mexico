"use server";

import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { createSupabaseServer } from "@/lib/supabase-server";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://litien-guard-mexico.vercel.app"
  );
}

/**
 * Genera una sesión del Customer Portal de Stripe y redirige al usuario.
 * Permite cancelar, cambiar de plan, actualizar tarjeta y descargar
 * recibos — todo sin necesidad de UI propia.
 */
export async function openCustomerPortal(): Promise<void> {
  const stripe = getStripe();
  if (!stripe) {
    redirect("/dashboard/billing?error=stripe_unavailable");
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    redirect("/dashboard/billing?error=no_customer");
  }

  // After narrowing, stripe is guaranteed non-null
  const session = await stripe!.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl()}/dashboard/billing`,
  });

  redirect(session.url);
}
