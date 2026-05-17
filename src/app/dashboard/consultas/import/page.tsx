import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, ClipboardList } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import {
  canUseScribe,
  type SubscriptionTier,
} from "@/lib/entitlements";
import { AdaptiveImporter } from "@/components/adaptive-importer";

export const metadata: Metadata = {
  title: "Importar consultas — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ImportConsultasPage() {
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
    redirect("/dashboard/consultas");
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/consultas"
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Volver a consultas
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-accent-soft p-1.5 text-accent">
            <ClipboardList className="h-5 w-5" strokeWidth={2} />
          </div>
          <Eyebrow tone="accent">Importar consultas</Eyebrow>
        </div>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Histórico de consultas en cualquier formato
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted leading-relaxed">
          Sube tu histórico de consultas pasadas. El asistente IA detecta
          paciente, fecha, motivo, diagnóstico y secciones SOAP en
          cualquier estructura. Útil para migrar desde tu sistema previo o
          desde libreta digital.
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
              Paciente · fecha y hora · tipo (primera_vez / subsecuente /
              urgencia / revisión) · motivo de consulta · diagnóstico
              principal · secciones SOAP (subjetivo / objetivo / análisis /
              plan) · notas libres.
            </p>
          </div>
        </div>
      </div>

      <AdaptiveImporter entity="consultas" />

      <div className="rounded-lg bg-surface-alt/30 p-4">
        <p className="text-caption text-ink-muted leading-relaxed">
          <strong className="text-ink-strong">Importante:</strong> las
          consultas importadas se crean con{" "}
          <code className="font-mono">status: cerrada</code>. Si quieres
          ligar una consulta importada a un paciente del padrón existente,
          puedes hacerlo desde la ficha de la consulta una vez creada.
        </p>
      </div>
    </div>
  );
}
