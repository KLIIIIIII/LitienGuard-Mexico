import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import type { EventoModulo } from "@/lib/modulos-eventos";
import { QuirofanoCliente } from "./quirofano-cliente";

export const metadata: Metadata = {
  title: "Quirófano — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function QuirofanoPage() {
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
          Módulo de Quirófano — Plan Profesional o superior
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          El módulo de quirófano con WHO time-out checklist está incluido en
          planes Profesional y Clínica.
        </p>
        <Link href="/precios" className="lg-cta-primary mt-6 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  const desde = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: eventosRaw } = await supa
    .from("eventos_modulos")
    .select(
      "id, user_id, paciente_id, modulo, tipo, datos, status, metricas, notas, created_at, completed_at",
    )
    .eq("modulo", "quirofano")
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
          <ClipboardCheck className="h-5 w-5 text-validation" strokeWidth={2} />
          <Eyebrow tone="validation">Quirófano</Eyebrow>
        </div>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          WHO Time-out + lista quirúrgica
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted leading-relaxed">
          Checklist de pausa quirúrgica de la Organización Mundial de la Salud
          (Surgical Safety Checklist 2009, actualizado 2021). Reduce mortalidad
          quirúrgica ~36% según estudio NEJM Haynes 2009.
        </p>
      </header>

      <QuirofanoCliente eventos={eventos} />

      <p className="text-caption text-ink-soft leading-relaxed max-w-3xl">
        Próximamente: programación quirúrgica con asignación de salas,
        documentación intraoperatoria, post-op + monitoreo a 30 días con
        outcome loop (complicaciones, reingresos, mortalidad).
      </p>
    </div>
  );
}
