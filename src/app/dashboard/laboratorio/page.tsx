import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { ESTUDIOS_DIAGNOSTICOS } from "@/lib/inference/estudios-diagnosticos";
import type { EventoModulo } from "@/lib/modulos-eventos";
import { LaboratorioCliente } from "./laboratorio-cliente";

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
      <div>
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Módulo de Laboratorio — Plan Profesional o superior
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          El módulo de laboratorio con peticiones y catálogo está incluido en
          planes Profesional y Clínica.
        </p>
        <Link href="/precios" className="lg-cta-primary mt-6 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  const desde = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data: eventosRaw } = await supa
    .from("eventos_modulos")
    .select(
      "id, user_id, paciente_id, modulo, tipo, datos, status, metricas, notas, created_at, completed_at",
    )
    .eq("modulo", "laboratorio")
    .gte("created_at", desde)
    .order("created_at", { ascending: false })
    .limit(30);
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

      <header>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-validation" strokeWidth={2} />
          <Eyebrow tone="validation">Laboratorio</Eyebrow>
        </div>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Peticiones de laboratorio
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted leading-relaxed">
          Crea peticiones desde un catálogo curado de {estudiosLab.length}{" "}
          estudios de laboratorio MX. Información de disponibilidad IMSS y
          costo orientativo del sector privado.
        </p>
      </header>

      <LaboratorioCliente estudios={estudiosLab} eventos={eventos} />

      <p className="text-caption text-ink-soft leading-relaxed max-w-3xl">
        Próximamente: integración con LIS hospitalario via HL7 v2 ORM/ORU,
        rangos de referencia por edad y sexo, flag automático de valores
        críticos, sugerencia de paneles según sospecha diagnóstica.
      </p>
    </div>
  );
}
