import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { NuevaConsultaForm } from "./nueva-consulta-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Nueva consulta",
  robots: { index: false, follow: false },
};

export default async function NuevaConsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente_id?: string; cita_id?: string }>;
}) {
  const sp = await searchParams;
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: pacientes } = await supa
    .from("pacientes")
    .select(
      "id, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo",
    )
    .eq("medico_id", user.id)
    .eq("activo", true)
    .order("nombre", { ascending: true })
    .limit(500);

  let citaPreset: {
    id: string;
    paciente_id: string | null;
    motivo: string | null;
  } | null = null;

  if (sp.cita_id) {
    const { data } = await supa
      .from("citas")
      .select("id, paciente_id, motivo")
      .eq("id", sp.cita_id)
      .eq("medico_id", user.id)
      .single();
    citaPreset = data ?? null;
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/consultas"
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Volver a consultas
      </Link>

      <div className="mt-4">
        <Eyebrow tone="validation">Nueva consulta</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
          Iniciar consulta
        </h1>
        <p className="mt-2 text-body text-ink-muted">
          Crea el contenedor para esta sesión. Después podrás generar la
          nota SOAP, recetas y diferencial desde la ficha de consulta.
        </p>
      </div>

      <div className="mt-8">
        <NuevaConsultaForm
          pacientes={pacientes ?? []}
          presetPacienteId={citaPreset?.paciente_id ?? sp.paciente_id ?? null}
          presetCitaId={citaPreset?.id ?? null}
          presetMotivo={citaPreset?.motivo ?? null}
        />
      </div>
    </div>
  );
}
