import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseScribe, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { ImportarCdaCliente } from "./importar-cda-cliente";

export const metadata: Metadata = {
  title: "Importar CDA — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ImportarCdaPage() {
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
          Importación CDA — Plan Esencial o superior
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          La importación de documentos CDA está incluida en planes Esencial,
          Profesional y Clínica.
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
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-validation" strokeWidth={2} />
          <Eyebrow tone="validation">Importar CDA (Clinical Document Architecture)</Eyebrow>
        </div>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Importa un expediente desde otro sistema
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted leading-relaxed">
          Si tu EHR actual (MediSel u otro que cumpla con HL7 CDA) exporta
          documentos en formato CDA XML, sube el archivo aquí. Extraemos
          datos del paciente y secciones clínicas (diagnósticos, manejo,
          alergias). Tú revisas el preview antes de guardar.
        </p>
      </header>

      <ImportarCdaCliente />

      <p className="text-caption text-ink-soft leading-relaxed max-w-3xl">
        <strong>CDA</strong> (Clinical Document Architecture) es el estándar
        HL7 v3 en formato XML. Lo aceptan MediSel y la mayoría de EHRs
        modernos que cumplen NOM-024-SSA3-2012. El archivo NO se almacena
        en LitienGuard — se procesa en tu sesión y se descarta.
      </p>
    </div>
  );
}
