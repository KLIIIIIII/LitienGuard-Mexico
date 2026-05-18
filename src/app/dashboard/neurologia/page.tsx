import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Brain } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseHospitalModules, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import type { EventoModulo } from "@/lib/modulos-eventos";
import { loadBoardData } from "@/lib/encounters/board-data";
import { EncounterBoard } from "@/components/encounters";
import { NeurologiaBoard } from "./neurologia-board";

export const metadata: Metadata = {
  title: "Neurología — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NeurologiaPage() {
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
          Módulo de Neurología — Plan Clínica
        </h1>
        <Link href="/precios" className="lg-cta-primary mt-2 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  const board = await loadBoardData(supa, {
    userId: user.id,
    modulo: ["neurologia", "ambulatorio"],
    historicoLimit: 80,
  });

  const desdeIso = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const { data: eventosRaw } = await supa
    .from("eventos_modulos")
    .select(
      "id, user_id, paciente_id, modulo, tipo, datos, status, metricas, notas, created_at, completed_at",
    )
    .eq("modulo", "neurologia")
    .gte("created_at", desdeIso)
    .order("created_at", { ascending: false })
    .limit(100);
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

      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-accent-soft p-1.5 text-accent">
            <Brain className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <Eyebrow tone="accent">Neurología</Eyebrow>
            <h1 className="mt-1 text-h1 font-semibold tracking-tight text-ink-strong">
              Stroke Unit + Neuro Service Line
            </h1>
            <p className="mt-1 text-caption text-ink-muted">
              Pacientes con EVC agudo en ventana terapéutica · alta reciente
              en seguimiento NIHSS · histórico ambulatorio de consultas
              neurológicas.
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
            <Eyebrow tone="accent">Workflow Neurología · últimos 90 días</Eyebrow>
            <h2 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
              NIHSS + ventana terapéutica
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              Detalle de pacientes evaluados con NIHSS, Glasgow y Mini-Mental
              para estratificación de EVC, trauma craneoencefálico y deterioro
              cognitivo.
            </p>
          </header>
          <NeurologiaBoard eventos={eventos} />
        </section>
      )}
    </div>
  );
}
