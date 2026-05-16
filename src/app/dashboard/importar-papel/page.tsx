import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseScribe, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { ImportarCliente } from "./importar-cliente";

export const metadata: Metadata = {
  title: "Importar desde papel — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ImportarPapelPage() {
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
  if (!canUseScribe(tier)) {
    return (
      <div>
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Importar desde fotos — Plan Esencial o superior
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          La extracción inteligente desde imágenes está incluida en planes
          Esencial, Profesional y Clínica.
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
          <Eyebrow tone="validation">Migración papel → digital</Eyebrow>
          <span className="inline-flex items-center gap-1 rounded-full border border-validation-soft bg-validation-soft px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-eyebrow text-validation">
            <Sparkles className="h-2.5 w-2.5" strokeWidth={2.4} />
            Nuevo
          </span>
        </div>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Foto a tu papel. Tu consultorio se digitaliza solo.
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted leading-relaxed">
          ¿Tienes una agenda en libreta, recetas en talonario o fichas de
          paciente en papel? Sube la foto y el cerebro extrae la información
          estructurada en segundos. Tú revisas el preview, ajustas lo que
          haga falta y guardas. Sin teclear caso por caso.
        </p>
      </header>

      <ImportarCliente />

      <p className="text-caption text-ink-soft leading-relaxed max-w-3xl">
        <strong>Privacidad:</strong> las imágenes que subes se procesan en
        memoria y se descartan inmediatamente — no se almacenan en
        LitienGuard ni se usan para entrenar modelos de terceros. Solo el
        JSON estructurado que tú confirmes se guarda en tu cuenta.
      </p>
    </div>
  );
}
