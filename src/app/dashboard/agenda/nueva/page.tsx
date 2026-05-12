import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseAgenda, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { CitaForm } from "../cita-form";

export const metadata: Metadata = {
  title: "Nueva cita — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function NuevaCitaPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
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
  if (!canUseAgenda(tier)) redirect("/dashboard/agenda");

  const params = await searchParams;
  const fecha = typeof params.fecha === "string" ? params.fecha : undefined;

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow tone="validation">Nueva cita</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Agendar consulta
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
          Captura los datos del paciente y selecciona horario. El sistema
          valida automáticamente que no haya conflicto con otras citas.
        </p>
      </header>

      <CitaForm mode="create" defaultDate={fecha} />
    </div>
  );
}
