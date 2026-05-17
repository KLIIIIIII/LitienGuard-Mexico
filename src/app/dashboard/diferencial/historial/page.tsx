import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { decryptField } from "@/lib/encryption";
import { recordBulkDecryption } from "@/lib/decrypt-monitor";
import { HistorialList } from "../historial-list";

export const metadata: Metadata = {
  title: "Historial de diferenciales — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DiferencialHistorialPage() {
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
  if (!canUseCerebro(tier)) redirect("/dashboard/diferencial");

  const { data: sessionsRaw } = await supa
    .from("diferencial_sessions")
    .select(
      "id, medico_id, paciente_iniciales, paciente_edad, contexto_clinico, top_diagnoses, medico_diagnostico_principal, outcome_confirmado, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  // Fase D — descifrar contexto_clinico y medico_diagnostico_principal.
  // AAD = medico_id de la fila (anclaje anti-rebind).
  const sessions = sessionsRaw
    ? await Promise.all(
        sessionsRaw.map(async (s) => {
          const aad = s.medico_id;
          const [ctx, dx] = await Promise.all([
            decryptField(s.contexto_clinico, aad),
            decryptField(s.medico_diagnostico_principal, aad),
          ]);
          return {
            ...s,
            contexto_clinico: ctx,
            medico_diagnostico_principal: dx,
          };
        }),
      )
    : [];

  if (sessions.length > 0) {
    void recordBulkDecryption(user.id, "diferencial.historial", sessions.length);
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
        <Eyebrow tone="validation">Historial</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Todos tus diferenciales
        </h1>
        <p className="mt-2 text-body-sm text-ink-muted">
          {sessions?.length ?? 0} casos guardados. Click en cualquiera para
          ver detalle y marcar el outcome.
        </p>
      </header>

      <HistorialList sessions={sessions ?? []} />
    </div>
  );
}
