import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseAgenda, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { CitaForm } from "../../cita-form";

export const metadata: Metadata = {
  title: "Editar cita — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditarCitaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: cita } = await supa
    .from("citas")
    .select("*")
    .eq("id", id)
    .single();
  if (!cita) notFound();

  return (
    <div className="space-y-6">
      <header>
        <Eyebrow tone="validation">Editar</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Editar cita
        </h1>
      </header>

      <CitaForm
        mode="edit"
        initial={{
          id: cita.id,
          paciente_nombre: cita.paciente_nombre,
          paciente_apellido_paterno: cita.paciente_apellido_paterno,
          paciente_apellido_materno: cita.paciente_apellido_materno,
          paciente_email: cita.paciente_email,
          paciente_telefono: cita.paciente_telefono,
          fecha_inicio: cita.fecha_inicio,
          fecha_fin: cita.fecha_fin,
          tipo_consulta: cita.tipo_consulta,
          motivo: cita.motivo,
          notas_internas: cita.notas_internas,
        }}
      />
    </div>
  );
}
