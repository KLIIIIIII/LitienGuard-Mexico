import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, FileCode } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseScribe, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { ImportarHl7Cliente } from "./importar-hl7-cliente";

export const metadata: Metadata = {
  title: "Importar HL7 v2 — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ImportarHl7Page() {
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
          Importación HL7 — Plan Esencial o superior
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          La importación bulk desde archivos HL7 v2 está incluida en planes
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
        <div className="flex items-center gap-2">
          <FileCode className="h-5 w-5 text-validation" strokeWidth={2} />
          <Eyebrow tone="validation">Importar HL7 v2</Eyebrow>
        </div>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Migra tu padrón completo desde otro EHR
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted leading-relaxed">
          Si tu EHR actual (SaludTotal, sistemas hospitalarios legacy) puede
          exportar a formato HL7 v2, sube el archivo aquí. Parseamos
          pacientes, diagnósticos, medicamentos y observaciones. Tú revisas
          el preview antes de guardar.
        </p>
      </header>

      <ImportarHl7Cliente />

      <p className="text-caption text-ink-soft leading-relaxed max-w-3xl">
        <strong>HL7 v2</strong> es un estándar internacional de intercambio
        de datos clínicos. Lo aceptan sistemas como SaludTotal, MediSel,
        Cerner, Epic y la mayoría de EHRs hospitalarios. El archivo es texto
        plano con segmentos separados por línea (MSH, PID, PV1, OBX, RXE,
        etc.). LitienGuard procesa el archivo en tu sesión y descarta el
        original — solo el JSON estructurado que tú confirmes se guarda.
      </p>
    </div>
  );
}
