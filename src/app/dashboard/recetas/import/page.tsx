import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Pill } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import {
  canUseRecetas,
  type SubscriptionTier,
} from "@/lib/entitlements";
import { AdaptiveImporter } from "@/components/adaptive-importer";

export const metadata: Metadata = {
  title: "Importar recetas — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ImportRecetasPage() {
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
  if (!canUseRecetas(tier)) {
    redirect("/dashboard/recetas");
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/recetas"
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Volver a recetas
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-accent-soft p-1.5 text-accent">
            <Pill className="h-5 w-5" strokeWidth={2} />
          </div>
          <Eyebrow tone="accent">Importar recetas</Eyebrow>
        </div>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Histórico de recetas en cualquier formato
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted leading-relaxed">
          Sube tu histórico de prescripciones. El asistente IA detecta
          paciente, diagnóstico, medicamento, dosis, frecuencia y duración
          en cualquier estructura. Las recetas se importan como borradores
          — tú decides cuáles firmar después.
        </p>
      </header>

      <div className="rounded-xl border border-validation/40 bg-validation-soft/30 p-4">
        <div className="flex items-start gap-2">
          <Sparkles
            className="mt-0.5 h-4 w-4 shrink-0 text-validation"
            strokeWidth={2.2}
          />
          <div>
            <p className="text-caption uppercase tracking-eyebrow text-validation font-semibold">
              Qué reconocemos automáticamente
            </p>
            <p className="mt-1 text-caption text-ink-muted leading-relaxed">
              Paciente (nombre/edad/sexo) · diagnóstico libre o CIE-10 ·
              medicamento (genérico o comercial) · presentación · dosis ·
              frecuencia (c/8h, BID, etc.) · duración · vía de
              administración (VO/IM/IV) · indicaciones específicas e
              indicaciones generales · fecha de emisión.
            </p>
          </div>
        </div>
      </div>

      <AdaptiveImporter entity="recetas" />

      <div className="rounded-lg bg-surface-alt/30 p-4">
        <p className="text-caption text-ink-muted leading-relaxed">
          <strong className="text-ink-strong">Nota clínica:</strong> las
          recetas importadas entran como{" "}
          <code className="font-mono">status: borrador</code>. NO sustituyen
          una receta original firmada con cédula profesional. Sirven como
          registro histórico — revisa cada una antes de re-emitir.
        </p>
      </div>
    </div>
  );
}
