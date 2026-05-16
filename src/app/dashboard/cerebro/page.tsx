import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Lock } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import {
  canUseCerebro,
  TIER_LABELS,
  type SubscriptionTier,
} from "@/lib/entitlements";
import { corpusStats } from "@/lib/bm25";
import { CerebroSearch } from "./cerebro-search";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cerebro — Búsqueda con evidencia",
  robots: { index: false, follow: false },
};

export default async function CerebroPage() {
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
        <div className="py-12 lg:py-16">
          <div className="mx-auto max-w-xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warn-soft">
              <Lock className="h-6 w-6 text-warn" />
            </div>
            <Eyebrow tone="accent">Acceso restringido</Eyebrow>
            <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
              El Cerebro está en plan Pro y Enterprise
            </h1>
            <p className="mt-3 max-w-prose text-body text-ink-muted">
              Tu plan actual es <strong>{TIER_LABELS[tier]}</strong>. Para
              consultar el cerebro con citas verbatim a guías clínicas
              oficiales y literatura primaria peer-reviewed, necesitas el plan
              Pro o Enterprise.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/contacto" className="lg-cta-primary">
                Hablemos de upgrade
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

  const stats = await corpusStats();

  return (
    <div>
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Eyebrow tone="accent">Cerebro</Eyebrow>
              <span className="inline-flex items-center gap-1 rounded-full bg-validation-soft px-2 py-0.5 text-caption text-validation">
                <BookOpen className="h-3 w-3" strokeWidth={2.2} />
                Plan {TIER_LABELS[tier]}
              </span>
            </div>
            <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
              Búsqueda con evidencia
            </h1>
            <p className="mt-2 max-w-prose text-body text-ink-muted">
              Consulta el cerebro clínico curado en español. Cada resultado
              incluye cita verbatim, fuente y número de página del documento
              original.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <CerebroSearch />
        </div>
      </div>
    </div>
  );
}
