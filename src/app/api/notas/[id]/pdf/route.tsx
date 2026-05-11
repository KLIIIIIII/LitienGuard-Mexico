import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { SoapPdf, type SoapPdfData } from "@/lib/pdf/soap-pdf";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "no auth" }, { status: 401 });
  }

  const { data: nota, error } = await supa
    .from("notas_scribe")
    .select(
      "id,medico_id,paciente_iniciales,paciente_nombre,paciente_apellido_paterno,paciente_apellido_materno,paciente_edad,paciente_sexo,soap_subjetivo,soap_objetivo,soap_analisis,soap_plan,status,created_at,updated_at",
    )
    .eq("id", id)
    .single();
  if (error || !nota) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { data: profile } = await supa
    .from("profiles")
    .select("nombre, email, especialidad, hospital")
    .eq("id", nota.medico_id)
    .single();

  const data: SoapPdfData = {
    id: nota.id,
    paciente_iniciales: nota.paciente_iniciales,
    paciente_nombre: nota.paciente_nombre,
    paciente_apellido_paterno: nota.paciente_apellido_paterno,
    paciente_apellido_materno: nota.paciente_apellido_materno,
    paciente_edad: nota.paciente_edad,
    paciente_sexo: nota.paciente_sexo,
    soap_subjetivo: nota.soap_subjetivo ?? "",
    soap_objetivo: nota.soap_objetivo ?? "",
    soap_analisis: nota.soap_analisis ?? "",
    soap_plan: nota.soap_plan ?? "",
    status: nota.status,
    created_at: nota.created_at,
    updated_at: nota.updated_at,
    medico_nombre: profile?.nombre ?? user.email ?? "Médico",
    medico_email: profile?.email ?? user.email ?? "",
    medico_hospital: profile?.hospital ?? null,
    medico_especialidad: profile?.especialidad ?? null,
  };

  const buffer = await renderToBuffer(<SoapPdf nota={data} />);

  const filename = `nota-${(data.paciente_iniciales ?? "consulta")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")}-${data.id.slice(0, 8)}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
