import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseRecetas, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { RecetaForm } from "./receta-form";

export const metadata: Metadata = {
  title: "Nueva receta — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NuevaRecetaPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier,cedula_profesional,especialidad")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseRecetas(tier)) {
    redirect("/dashboard/recetas");
  }

  if (!profile?.cedula_profesional) {
    return (
      <div>
        <Eyebrow tone="warn">Datos faltantes</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Antes de tu primera receta
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          La NOM-024-SSA3 requiere que cada receta médica incluya tu cédula
          profesional, especialidad y datos del consultorio. Regístralos una
          vez en Configuración y luego podrás emitir recetas en segundos.
        </p>
        <Link
          href="/dashboard/configuracion"
          className="lg-cta-primary mt-6 inline-flex"
        >
          Ir a configuración
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow tone="validation">Nueva receta</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Emitir receta electrónica
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
          Captura paciente, diagnóstico y medicamentos. Puedes guardar como
          borrador para revisar después, o firmar y descargar el PDF listo para
          imprimir.
        </p>
      </header>

      <RecetaForm />
    </div>
  );
}
