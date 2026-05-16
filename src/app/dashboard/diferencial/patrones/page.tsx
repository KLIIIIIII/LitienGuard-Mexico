import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { CANONICAL_PATTERNS } from "@/lib/patterns/canonical-patterns";
import { detectPersonalPatterns } from "@/lib/patterns/detect-personal";
import { PatronesShell } from "./patrones-shell";

export const metadata: Metadata = {
  title: "Patrones clínicos — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PatronesPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; tab?: "tuyos" | "canonicos" }>;
}) {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select(
      "subscription_tier, patrones_tutorial_completed_at, patrones_tutorial_skipped_at",
    )
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseCerebro(tier)) redirect("/dashboard/diferencial");

  const params = await searchParams;
  const initialPatternId =
    CANONICAL_PATTERNS.find((p) => p.id === params.p)?.id ??
    CANONICAL_PATTERNS[0]!.id;

  // Detecta patrones personales server-side
  const personalPatterns = await detectPersonalPatterns(supa, user.id);

  // Si nunca lo vió ni skippeó, arrancar tour automáticamente
  const seenTutorial =
    Boolean(profile?.patrones_tutorial_completed_at) ||
    Boolean(profile?.patrones_tutorial_skipped_at);
  const autoOpenTour = !seenTutorial;

  // Si tiene data, default tab = tuyos; si no, canonicos
  const defaultTab =
    params.tab ??
    (personalPatterns.hasEnoughData ? "tuyos" : "canonicos");

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
        <Eyebrow tone="validation">Patrones clínicos</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Lo que el cerebro encuentra en tu práctica
        </h1>
        <p className="mt-2 max-w-3xl text-body-sm text-ink-muted leading-relaxed">
          El cerebro lee tus diagnósticos, recetas y outcomes para identificar
          patrones emergentes — diagnósticos que viajan juntos, dónde diverges
          del motor, qué tan calibrado estás. La referencia clínica viene
          curada con literatura primaria internacional y mexicana.
        </p>
      </header>

      <PatronesShell
        defaultTab={defaultTab}
        autoOpenTour={autoOpenTour}
        personalPatterns={personalPatterns}
        canonicalPatterns={CANONICAL_PATTERNS}
        initialCanonicalId={initialPatternId}
      />
    </div>
  );
}
