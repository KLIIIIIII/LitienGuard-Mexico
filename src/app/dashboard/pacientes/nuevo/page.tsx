import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import {
  canUsePacientes,
  type SubscriptionTier,
} from "@/lib/entitlements";
import { NuevoPacienteForm } from "./nuevo-paciente-form";

export const metadata: Metadata = {
  title: "Nuevo paciente — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NuevoPacientePage() {
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
  if (!canUsePacientes(tier)) redirect("/dashboard/pacientes");

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard/pacientes"
          className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-ink-strong"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
          Volver al padrón
        </Link>
        <Eyebrow tone="accent" className="mt-3">
          Nuevo paciente
        </Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Agrega un paciente al padrón
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
          Solo el nombre es obligatorio. El resto lo puedes completar
          después.
        </p>
      </div>

      <NuevoPacienteForm />
    </div>
  );
}
