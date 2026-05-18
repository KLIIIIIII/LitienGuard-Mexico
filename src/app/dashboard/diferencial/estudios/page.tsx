import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { ESTUDIOS_DIAGNOSTICOS } from "@/lib/inference/estudios-diagnosticos";
import { PATRONES_MULTI_ESTUDIO } from "@/lib/inference/patrones-multi-estudio";
import { detectStudyCorrelations } from "@/lib/patterns/detect-study-correlations";
import { EstudiosCliente } from "./estudios-cliente";
import { CorrelacionesCohorte } from "./correlaciones-cohorte";

export const metadata: Metadata = {
  title: "Motor de estudios — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EstudiosPage() {
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
  const correlations = canUseCerebro(tier)
    ? await detectStudyCorrelations(supa, user.id)
    : null;

  if (!canUseCerebro(tier)) {
    return (
      <div>
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Motor de estudios — Plan Profesional o superior
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          El motor de patrones multi-estudio está incluido en planes Profesional
          y Clínica.
        </p>
        <Link href="/precios" className="lg-cta-primary mt-6 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/diferencial"
        className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Volver al diferencial
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-validation" strokeWidth={2} />
          <Eyebrow tone="validation">Motor de patrones diagnósticos</Eyebrow>
        </div>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Cruza estudios para encontrar patrones complejos
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted leading-relaxed">
          Marca los estudios que tu paciente tiene + cuáles dieron hallazgo
          positivo. El motor cruza esa combinación con patrones canónicos
          curados de literatura clínica y te sugiere qué cuadro encaja —
          incluyendo los que son difíciles de detectar por el ojo humano sin
          combinar 3-5 estudios.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tip
          eyebrow="60+ estudios catalogados"
          text="Imagenología, laboratorio, endoscopias, fisiológicos y patología — los más usados en práctica clínica mexicana."
        />
        <Tip
          eyebrow="25 patrones canónicos"
          text="Cada patrón combina 3-5 estudios y apunta a un diagnóstico específico con confianza alta cuando coinciden."
        />
        <Tip
          eyebrow="Workflow por patrón"
          text="Cada match incluye los pasos secuenciales sugeridos, alertas críticas y referencia interna a fuente clínica."
        />
      </div>

      {correlations && <CorrelacionesCohorte correlations={correlations} />}

      <EstudiosCliente
        estudios={ESTUDIOS_DIAGNOSTICOS.map((e) => ({
          id: e.id,
          nombre: e.nombre,
          categoria: e.categoria,
          descripcion: e.descripcion,
          disponibilidadIMSS: e.disponibilidadIMSS,
          costoPrivadoMxn: e.costoPrivadoMxn ?? null,
        }))}
        totalPatrones={PATRONES_MULTI_ESTUDIO.length}
      />

      <p className="text-caption text-ink-soft leading-relaxed max-w-3xl">
        El motor NO diagnostica — orienta. Cada patrón viene con su
        razonamiento clínico explícito. Tú cierras el caso con tu juicio
        clínico considerando contexto del paciente.
      </p>
    </div>
  );
}

function Tip({ eyebrow, text }: { eyebrow: string; text: string }) {
  return (
    <div className="lg-card">
      <p className="text-caption uppercase tracking-eyebrow text-validation font-semibold">
        {eyebrow}
      </p>
      <p className="mt-2 text-caption text-ink-muted leading-relaxed">{text}</p>
    </div>
  );
}
