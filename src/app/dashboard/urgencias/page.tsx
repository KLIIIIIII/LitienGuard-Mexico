import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Siren } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import type { EventoModulo } from "@/lib/modulos-eventos";
import { UrgenciasCliente } from "./urgencias-cliente";

export const metadata: Metadata = {
  title: "Urgencias — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function UrgenciasPage() {
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
          Módulo de Urgencias — Plan Profesional o superior
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          El módulo de urgencias con triage Manchester y protocolos críticos
          (sepsis bundle, código stroke, código IAM, DKA) está incluido en
          planes Profesional y Clínica.
        </p>
        <Link href="/precios" className="lg-cta-primary mt-6 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: eventosRaw } = await supa
    .from("eventos_modulos")
    .select(
      "id, user_id, paciente_id, modulo, tipo, datos, status, metricas, notas, created_at, completed_at",
    )
    .eq("modulo", "urgencias")
    .gte("created_at", desde)
    .order("created_at", { ascending: false })
    .limit(20);
  const eventos = (eventosRaw ?? []) as EventoModulo[];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Volver al dashboard
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <Siren className="h-5 w-5 text-rose" strokeWidth={2} />
          <Eyebrow tone="warn">Urgencias</Eyebrow>
        </div>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Triage rápido + protocolos críticos
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted leading-relaxed">
          Triage Manchester en menos de 5 minutos. Protocolos sepsis bundle
          1-hora, código stroke, código IAM y DKA pre-cargados con literatura
          clínica curada. Las activaciones quedan registradas para audit y
          métricas de calidad.
        </p>
      </header>

      <UrgenciasCliente eventos={eventos} />

      <p className="text-caption text-ink-soft leading-relaxed max-w-3xl">
        Los protocolos NO sustituyen el juicio clínico. Cada paso debe
        adaptarse al contexto del paciente. La activación rápida del bundle
        sepsis &lt; 1 h y la trombolisis &lt; 60 min puerta-aguja en stroke
        son las dos métricas con mayor impacto en mortalidad — el módulo
        las registra automáticamente.
      </p>
    </div>
  );
}
