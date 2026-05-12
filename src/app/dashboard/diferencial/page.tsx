import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { DiferencialEngine } from "./diferencial-engine";
import { HistorialList } from "./historial-list";

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

  const { data: recentSessions, count: totalCount } = await supa
    .from("diferencial_sessions")
    .select(
      "id, paciente_iniciales, paciente_edad, contexto_clinico, top_diagnoses, medico_diagnostico_principal, outcome_confirmado, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(5);

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

      {recentSessions && recentSessions.length > 0 && (
        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              Casos guardados recientes
            </h2>
            {(totalCount ?? 0) > 5 && (
              <Link
                href="/dashboard/diferencial/historial"
                className="text-caption font-semibold text-validation hover:underline"
              >
                Ver los {totalCount} casos →
              </Link>
            )}
          </div>
          <HistorialList sessions={recentSessions} compact />
        </section>
      )}

      <section>
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong mb-4">
          Nuevo caso
        </h2>
        <DiferencialEngine />
      </section>

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
