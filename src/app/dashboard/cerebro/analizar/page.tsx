import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { AnalizarForm } from "./analizar-form";

export const metadata: Metadata = {
  title: "Analizar nota de otro EHR — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AnalizarPage() {
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
          Análisis con cerebro — Plan Profesional o superior
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          El motor de inferencia y la extracción automática de findings están
          incluidos en planes Profesional y Clínica.
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
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Volver al dashboard
      </Link>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow tone="validation">Capa de inteligencia</Eyebrow>
          <span className="inline-flex items-center gap-1 rounded-full border border-validation-soft bg-validation-soft px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-eyebrow text-validation">
            <Sparkles className="h-2.5 w-2.5" strokeWidth={2.4} />
            Calibrado MX
          </span>
        </div>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Pega tu nota SOAP. El cerebro te dice qué no ves.
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted leading-relaxed">
          ¿Trabajas en Nimbo, SaludTotal, MediSel o cualquier expediente
          electrónico? Pega aquí tu nota completa y obtén en segundos: findings
          extraídos automáticamente, los 5 diferenciales bayesianos más
          probables calibrados a México, y las banderas rojas que vale la pena
          revisar antes de cerrar el caso.
        </p>
      </header>

      <AnalizarForm />

      <p className="text-caption text-ink-soft leading-relaxed max-w-3xl">
        El cerebro NO diagnostica — orienta. Cada sugerencia viene con su cita
        verbatim a la guía clínica fuente. Tú cierras el caso con tu juicio
        clínico. Nada de lo que pegues sale de la infraestructura de
        LitienGuard ni entrena modelos de terceros.
      </p>
    </div>
  );
}
