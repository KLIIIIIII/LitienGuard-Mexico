import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { ESTUDIOS_DIAGNOSTICOS } from "@/lib/inference/estudios-diagnosticos";
import type { EventoModulo } from "@/lib/modulos-eventos";
import { LaboratorioBoard } from "./laboratorio-board";

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
    <div className="space-y-5">
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
            <h1 className="mt-1 text-h2 font-semibold tracking-tight text-ink-strong">
              Worklist · {estudiosLab.length} estudios catalogados
            </h1>
          </div>
        </div>
        <p className="text-caption text-ink-soft">
          Patrón Cerner PathNet · Yale + Michigan Pathology Informatics
        </p>
      </header>

      <LaboratorioBoard estudios={estudiosLab} eventos={eventos} />
    </div>
  );
}
