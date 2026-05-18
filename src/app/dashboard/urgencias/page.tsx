import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Siren } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseHospitalModules, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import type { EventoModulo } from "@/lib/modulos-eventos";
import { loadBoardData } from "@/lib/encounters/board-data";
import { EncounterBoard } from "@/components/encounters";
import { UrgenciasTracking } from "./urgencias-tracking";

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

  if (!canUseHospitalModules(tier)) {
    return (
      <div className="space-y-3">
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="text-h1 font-semibold tracking-tight text-ink-strong">
          Módulo de Urgencias — Plan Clínica
        </h1>
        <p className="max-w-prose text-body text-ink-muted">
          Triage Manchester y protocolos críticos (sepsis bundle, código
          stroke, código IAM, DKA). Incluido en planes Profesional y Clínica.
        </p>
        <Link href="/precios" className="lg-cta-primary mt-2 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  const board = await loadBoardData(supa, {
    userId: user.id,
    modulo: "urgencias",
    historicoLimit: 80,
  });

  const desdeIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: eventosRaw } = await supa
    .from("eventos_modulos")
    .select(
      "id, user_id, paciente_id, modulo, tipo, datos, status, metricas, notas, created_at, completed_at",
    )
    .eq("modulo", "urgencias")
    .gte("created_at", desdeIso)
    .order("created_at", { ascending: false })
    .limit(80);
  const eventos = (eventosRaw ?? []) as EventoModulo[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
          Volver al dashboard
        </Link>
      </div>

      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-code-red-bg/60 p-1.5 text-code-red">
            <Siren className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <Eyebrow tone="warn">Urgencias</Eyebrow>
            <h1 className="mt-1 text-h1 font-semibold tracking-tight text-ink-strong">
              Patient Tracking Board
            </h1>
            <p className="mt-1 text-caption text-ink-muted">
              Census actual del departamento · admisiones y altas de las
              últimas 24 horas · pacientes en seguimiento outcome 15 días.
            </p>
          </div>
        </div>
      </header>

      <EncounterBoard
        activos={board.activos}
        altaReciente={board.altaReciente}
        historico={board.historico}
        throughput={board.throughput}
        avgLOSminutes={board.avgLOSminutes}
        admissions24h={board.admissions24h}
        discharges24h={board.discharges24h}
      />

      {eventos.length > 0 && (
        <section className="space-y-3">
          <header>
            <Eyebrow tone="accent">Workflow Urgencias · últimas 24h</Eyebrow>
            <h2 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
              Triages activos y protocolos abiertos
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              Lista detallada de triages, dispositions, sepsis bundle, código
              stroke, código IAM y DKA en ejecución o cerrados en las últimas
              24 horas. Para auditoría operacional.
            </p>
          </header>
          <UrgenciasTracking eventos={eventos} />
        </section>
      )}
    </div>
  );
}
