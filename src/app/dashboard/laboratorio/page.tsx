import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { ESTUDIOS_DIAGNOSTICOS } from "@/lib/inference/estudios-diagnosticos";
import type { EventoModulo } from "@/lib/modulos-eventos";
import { loadBoardData } from "@/lib/encounters/board-data";
import { EncounterBoard } from "@/components/encounters";
import { LaboratorioBoard } from "./laboratorio-board";
import { LaboratorioBundles } from "./laboratorio-bundles";

export const metadata: Metadata = {
  title: "Laboratorio — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LaboratorioPage() {
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
      <div className="space-y-3">
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="text-h1 font-semibold tracking-tight text-ink-strong">
          Módulo de Laboratorio — Plan Profesional o superior
        </h1>
        <Link href="/precios" className="lg-cta-primary mt-2 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  const board = await loadBoardData(supa, {
    userId: user.id,
    modulo: "laboratorio",
    historicoLimit: 80,
  });

  const desdeIso = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data: eventosRaw } = await supa
    .from("eventos_modulos")
    .select(
      "id, user_id, paciente_id, modulo, tipo, datos, status, metricas, notas, created_at, completed_at",
    )
    .eq("modulo", "laboratorio")
    .gte("created_at", desdeIso)
    .order("created_at", { ascending: false })
    .limit(80);
  const eventos = (eventosRaw ?? []) as EventoModulo[];

  const estudiosLab = ESTUDIOS_DIAGNOSTICOS.filter(
    (e) => e.categoria === "laboratorio",
  ).map((e) => ({
    id: e.id,
    nombre: e.nombre,
    descripcion: e.descripcion,
    disponibilidadIMSS: e.disponibilidadIMSS,
    costoPrivadoMxn: e.costoPrivadoMxn ?? null,
    tiempoResultado: e.tiempoResultado,
  }));

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
          <div className="rounded-lg bg-validation-soft p-1.5 text-validation">
            <FlaskConical className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <Eyebrow tone="validation">Laboratorio</Eyebrow>
            <h1 className="mt-1 text-h1 font-semibold tracking-tight text-ink-strong">
              Critical Values Worklist
            </h1>
            <p className="mt-1 text-caption text-ink-muted">
              Pacientes con resultados críticos pendientes de notificación ·
              reflex testing activo · delta check 15 días · {estudiosLab.length}{" "}
              estudios en catálogo.
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
            <Eyebrow tone="accent">Workflow Laboratorio · últimos 30 días</Eyebrow>
            <h2 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
              Lab Pathway · valores críticos + reflex + delta
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              Resultados procesados con interpretación clínica automática,
              reflex testing sugerido y delta check contra estudios previos
              del mismo paciente.
            </p>
          </header>
          <LaboratorioBoard estudios={estudiosLab} eventos={eventos} />
          <LaboratorioBundles eventos={eventos} />
        </section>
      )}
    </div>
  );
}
