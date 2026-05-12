import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseRecetas, type SubscriptionTier } from "@/lib/entitlements";
import { recordAudit } from "@/lib/audit";
import { RecetaPdf } from "@/lib/pdf/receta-pdf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const { data: profile } = await supa
    .from("profiles")
    .select(
      "subscription_tier,nombre,email,cedula_profesional,especialidad,consultorio_nombre,consultorio_direccion,consultorio_telefono",
    )
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseRecetas(tier)) {
    return NextResponse.json({ error: "tier_locked" }, { status: 403 });
  }

  const { data: receta } = await supa
    .from("recetas")
    .select("*")
    .eq("id", id)
    .single();

  if (!receta) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: items } = await supa
    .from("recetas_items")
    .select("*")
    .eq("receta_id", id)
    .order("orden");

  const buffer = await renderToBuffer(
    <RecetaPdf
      receta={{
        id: receta.id,
        paciente_nombre: receta.paciente_nombre,
        paciente_apellido_paterno: receta.paciente_apellido_paterno,
        paciente_apellido_materno: receta.paciente_apellido_materno,
        paciente_edad: receta.paciente_edad,
        paciente_sexo: receta.paciente_sexo,
        diagnostico: receta.diagnostico,
        diagnostico_cie10: receta.diagnostico_cie10,
        indicaciones_generales: receta.indicaciones_generales,
        status: receta.status,
        fecha_emision: receta.fecha_emision,
        motivo_anulacion: receta.motivo_anulacion,
      }}
      items={items ?? []}
      medico={{
        nombre: profile?.nombre ?? null,
        email: profile?.email ?? null,
        cedula_profesional: profile?.cedula_profesional ?? null,
        especialidad: profile?.especialidad ?? null,
        consultorio_nombre: profile?.consultorio_nombre ?? null,
        consultorio_direccion: profile?.consultorio_direccion ?? null,
        consultorio_telefono: profile?.consultorio_telefono ?? null,
      }}
    />,
  );

  void recordAudit({
    userId: user.id,
    action: "receta.pdf_downloaded",
    resource: id,
  });

  const safeName =
    receta.paciente_nombre.replace(/[^\w-]/g, "_").slice(0, 40) || "paciente";
  const dateStr = (receta.fecha_emision ?? "").slice(0, 10);
  const filename = `receta_${safeName}_${dateStr}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
