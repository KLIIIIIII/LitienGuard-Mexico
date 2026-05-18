import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseEspecialidadModulo, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import type { EventoModulo } from "@/lib/modulos-eventos";
import { loadBoardData } from "@/lib/encounters/board-data";
import { EncounterBoard } from "@/components/encounters";
import { CardiologiaBoard } from "./cardiologia-board";

export const metadata: Metadata = {
  title: "Cardiología — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CardiologiaPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier, especialidad")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;

  if (
    !canUseEspecialidadModulo({
      tier,
      profileEspecialidad: profile?.especialidad,
      targetModulo: "cardiologia",
    })
  ) {
    return (
      <div className="space-y-3">
        <Eyebrow tone="warn">Módulo no disponible en tu plan</Eyebrow>
        <h1 className="text-h1 font-semibold tracking-tight text-ink-strong">
          Cardiología
        </h1>
        <p className="max-w-prose text-body text-ink-muted">
          Profesional incluye el módulo de tu especialidad. Para usar
          Cardiología, configura tu especialidad como Cardiología en tu
          perfil, o sube a Clínica para acceso a todos los departamentos.
        </p>
        <div className="flex gap-2">
          <Link href="/dashboard/configuracion" className="lg-cta-primary">
            Configurar especialidad
          </Link>
          <Link href="/precios" className="lg-cta-secondary">
            Ver planes
          </Link>
        </div>
      </div>
    );
  }

  const board = await loadBoardData(supa, {
    userId: user.id,
    modulo: ["cardiologia", "ambulatorio"],
    historicoLimit: 80,
  });

  const desdeIso = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const { data: eventosRaw } = await supa
    .from("eventos_modulos")
    .select(
      "id, user_id, paciente_id, modulo, tipo, datos, status, metricas, notas, created_at, completed_at",
    )
    .eq("modulo", "cardiologia")
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
          <div className="rounded-lg bg-rose-soft p-1.5 text-rose">
            <Heart className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <Eyebrow tone="rose">Cardiología</Eyebrow>
            <h1 className="mt-1 text-h1 font-semibold tracking-tight text-ink-strong">
              Service Line Cardiology
            </h1>
            <p className="mt-1 text-caption text-ink-muted">
              Pacientes hospitalizados con descompensación cardíaca · alta
              reciente en seguimiento outcome 30 días · histórico ambulatorio
              de consultas y HEART scores.
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
            <Eyebrow tone="accent">Workflow Cardiología · últimos 90 días</Eyebrow>
            <h2 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
              HEART score + estratificación de riesgo
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              Detalle de pacientes evaluados con HEART score, GRACE y
              CHA₂DS₂-VASc para decisión de manejo de dolor torácico,
              SCA y anticoagulación.
            </p>
          </header>
          <CardiologiaBoard eventos={eventos} />
        </section>
      )}
    </div>
  );
}
