import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Activity } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseEspecialidadModulo, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import type { EventoModulo } from "@/lib/modulos-eventos";
import { loadBoardData } from "@/lib/encounters/board-data";
import { EncounterBoard } from "@/components/encounters";
import { OncologiaBoard } from "./oncologia-board";

export const metadata: Metadata = {
  title: "Oncología — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OncologiaPage() {
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
      targetModulo: "oncologia",
    })
  ) {
    return (
      <div className="space-y-3">
        <Eyebrow tone="warn">Módulo no disponible en tu plan</Eyebrow>
        <h1 className="text-h1 font-semibold tracking-tight text-ink-strong">
          Oncología
        </h1>
        <p className="max-w-prose text-body text-ink-muted">
          Profesional incluye el módulo de tu especialidad. Para usar
          Oncología, configura tu especialidad como Oncología en tu perfil,
          o sube a Clínica para acceso a todos los departamentos.
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
    modulo: ["oncologia", "ambulatorio"],
    historicoLimit: 80,
  });

  const desdeIso = new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString();
  const { data: eventosRaw } = await supa
    .from("eventos_modulos")
    .select(
      "id, user_id, paciente_id, modulo, tipo, datos, status, metricas, notas, created_at, completed_at",
    )
    .eq("modulo", "oncologia")
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
          <div className="rounded-lg bg-warn-soft p-1.5 text-warn">
            <Activity className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <Eyebrow tone="warn">Oncología</Eyebrow>
            <h1 className="mt-1 text-h1 font-semibold tracking-tight text-ink-strong">
              Cancer Center · ECOG + ciclos QT
            </h1>
            <p className="mt-1 text-caption text-ink-muted">
              Pacientes en ciclo activo o admisión por toxicidad · alta
              reciente en seguimiento ECOG · histórico de consultas
              oncológicas y tumor board.
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
            <Eyebrow tone="accent">Workflow Oncología · últimos 180 días</Eyebrow>
            <h2 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
              ECOG performance + aptitud a terapia
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              Detalle de evaluaciones de performance (ECOG, Karnofsky) y
              estratificación de aptitud a quimioterapia, radioterapia o
              cuidados paliativos.
            </p>
          </header>
          <OncologiaBoard eventos={eventos} />
        </section>
      )}
    </div>
  );
}
