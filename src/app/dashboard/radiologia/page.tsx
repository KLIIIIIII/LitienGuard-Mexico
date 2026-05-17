import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ScanLine } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { ESTUDIOS_DIAGNOSTICOS } from "@/lib/inference/estudios-diagnosticos";
import type { EventoModulo } from "@/lib/modulos-eventos";
import { RadiologiaCliente } from "./radiologia-cliente";

export const metadata: Metadata = {
  title: "Radiología — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RadiologiaPage() {
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
          Módulo de Radiología — Plan Profesional o superior
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          El módulo de radiología con peticiones y reportes estructurados
          está incluido en planes Profesional y Clínica.
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
    .eq("modulo", "radiologia")
    .gte("created_at", desde)
    .order("created_at", { ascending: false })
    .limit(30);
  const eventos = (eventosRaw ?? []) as EventoModulo[];

  const estudiosImg = ESTUDIOS_DIAGNOSTICOS.filter(
    (e) => e.categoria === "imagenologia",
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
          <ScanLine className="h-5 w-5 text-accent" strokeWidth={2} />
          <Eyebrow tone="validation">Radiología</Eyebrow>
        </div>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Peticiones de imagen + reportes
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted leading-relaxed">
          Catálogo de {estudiosImg.length} estudios de imagen — TAC, RM,
          ultrasonido, gammagrafía, mamografía, angiografía. Adjunta el
          reporte cuando esté listo para integrarlo al motor de patrones
          multi-estudio.
        </p>
      </header>

      <RadiologiaCliente estudios={estudiosImg} eventos={eventos} />

      <p className="text-caption text-ink-soft leading-relaxed max-w-3xl">
        Próximamente: templates estructurados por estudio (TAC craneal,
        ecocardiograma, eco abdomen), integración con PACS via DICOM Q/R,
        vinculación automática al motor de patrones multi-estudio cuando se
        marcan hallazgos positivos.
      </p>
    </div>
  );
}
