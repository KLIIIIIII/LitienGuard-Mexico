import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { DiferencialEngine } from "./diferencial-engine";

export const metadata: Metadata = {
  title: "Diferencial diagnóstico — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DiferencialPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;

  if (!canUseCerebro(tier)) {
    return (
      <div>
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Diferencial diagnóstico — Plan Profesional o superior
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          El motor de inferencia bayesiana multi-señal con cerebro clínico
          curado está incluido en planes Profesional y Clínica.
        </p>
        <Link href="/precios" className="lg-cta-primary mt-6 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow tone="validation">Diferencial diagnóstico</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Razonamiento bayesiano multi-señal
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
          Marca los findings clínicos que observas en el paciente. El motor
          actualiza el diferencial en tiempo real combinando likelihood
          ratios publicados con la prevalencia poblacional. Cada
          recomendación viene con la cita verbatim de la fuente.
        </p>
      </header>

      <DiferencialEngine />

      <p className="text-caption text-ink-soft leading-relaxed max-w-3xl">
        El motor no diagnostica — orienta y documenta tu razonamiento. Cuando
        te apartes de la sugerencia del top-1, captura el motivo. Esa
        información alimenta el loop de calidad de tu propia práctica y
        eventualmente mejora la calibración de los likelihood ratios para
        casos similares.
      </p>
    </div>
  );
}
