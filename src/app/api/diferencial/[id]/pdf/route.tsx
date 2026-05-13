import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { recordAudit } from "@/lib/audit";
import {
  DiferencialPdf,
  type DiferencialPdfData,
} from "@/lib/pdf/diferencial-pdf";

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

  const { data: profile } = await supa
    .from("profiles")
    .select(
      "nombre, email, especialidad, hospital, cedula, subscription_tier, pdf_brand_titulo, pdf_brand_subtitulo, consultorio_nombre",
    )
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseCerebro(tier)) {
    return NextResponse.json({ error: "tier" }, { status: 403 });
  }

  const { data: sesion, error } = await supa
    .from("diferencial_sessions")
    .select(
      "id,medico_id,paciente_iniciales,paciente_edad,paciente_sexo,contexto_clinico,findings_observed,top_diagnoses,medico_diagnostico_principal,medico_notas,override_razonamiento,outcome_confirmado,outcome_confirmado_at,created_at",
    )
    .eq("id", id)
    .eq("medico_id", user.id)
    .single();
  if (error || !sesion) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const data: DiferencialPdfData = {
    id: sesion.id,
    paciente_iniciales: sesion.paciente_iniciales,
    paciente_edad: sesion.paciente_edad,
    paciente_sexo: sesion.paciente_sexo as "M" | "F" | "O" | null,
    contexto_clinico: sesion.contexto_clinico,
    findings_observed: sesion.findings_observed ?? [],
    top_diagnoses: sesion.top_diagnoses ?? [],
    medico_diagnostico_principal: sesion.medico_diagnostico_principal,
    medico_notas: sesion.medico_notas,
    override_razonamiento: sesion.override_razonamiento,
    outcome_confirmado: sesion.outcome_confirmado,
    outcome_confirmado_at: sesion.outcome_confirmado_at,
    created_at: sesion.created_at,
    medico_nombre: profile?.nombre ?? user.email ?? "Médico",
    medico_especialidad: profile?.especialidad ?? null,
    medico_hospital: profile?.hospital ?? null,
    medico_cedula: profile?.cedula ?? null,
    pdf_brand_titulo: profile?.pdf_brand_titulo ?? null,
    pdf_brand_subtitulo: profile?.pdf_brand_subtitulo ?? null,
    consultorio_nombre: profile?.consultorio_nombre ?? null,
  };

  const buffer = await renderToBuffer(<DiferencialPdf caso={data} />);

  const filename = `diferencial-${(data.paciente_iniciales ?? "caso")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")}-${data.id.slice(0, 8)}.pdf`;

  void recordAudit({
    userId: user.id,
    action: "diferencial.pdf_exported",
    resource: data.id,
  });

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
