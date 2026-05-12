import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, Mic } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import {
  canUseScribe,
  TIER_LABELS,
  type SubscriptionTier,
} from "@/lib/entitlements";
import { ScribeForm } from "./scribe-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scribe — Nueva nota",
  robots: { index: false, follow: false },
};

export default async function ScribePage() {
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
  const tier = profile?.subscription_tier as SubscriptionTier | undefined;

  if (!canUseScribe(tier)) {
    return (
      <div>
        <div className="py-12 lg:py-16">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warn-soft">
              <Lock className="h-6 w-6 text-warn" />
            </div>
            <Eyebrow tone="accent">Acceso restringido</Eyebrow>
            <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
              El Scribe es una función de suscripción
            </h1>
            <p className="mt-3 max-w-prose text-body text-ink-muted">
              Tu plan actual es <strong>{TIER_LABELS[tier ?? "free"]}</strong>.
              Para usar el Scribe necesitas plan Piloto, Pro o Enterprise.
              Escríbenos para solicitar acceso al piloto cerrado.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/contacto" className="lg-cta-primary">
                Solicitar acceso al piloto
              </Link>
              <Link href="/dashboard" className="lg-cta-ghost">
                Volver al panel
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Eyebrow tone="accent">Scribe</Eyebrow>
              <span className="inline-flex items-center gap-1 rounded-full bg-validation-soft px-2 py-0.5 text-caption text-validation">
                <Mic className="h-3 w-3" strokeWidth={2.2} />
                Plan {TIER_LABELS[tier ?? "free"]}
              </span>
            </div>
            <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
              Nueva nota SOAP
            </h1>
            <p className="mt-2 max-w-prose text-body text-ink-muted">
              Graba la consulta o sube el audio. Lo transcribimos en español y
              lo estructuramos automáticamente en formato SOAP. Tú firmas la
              versión final.
            </p>
          </div>
          <Link href="/dashboard/notas" className="lg-cta-ghost">
            Ver mis notas
          </Link>
        </div>

        <div className="mt-10 max-w-3xl">
          <ScribeForm />
        </div>
      </div>
    </div>
  );
}
