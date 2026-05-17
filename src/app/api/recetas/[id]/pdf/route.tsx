import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseRecetas, type SubscriptionTier } from "@/lib/entitlements";
import { recordAudit } from "@/lib/audit";
import { decryptField } from "@/lib/encryption";
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
      "subscription_tier,nombre,email,cedula_profesional,especialidad,consultorio_nombre,consultorio_direccion,consultorio_telefono,pdf_brand_titulo,pdf_brand_subtitulo",
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

  const { data: itemsRaw } = await supa
    .from("recetas_items")
    .select("*")
    .eq("receta_id", id)
    .order("orden");

  // Descifrar PII + clínicos. AAD = medico_id de la fila (anclaje
  // anti-rebind). decryptField maneja v1/v2 automáticamente.
  const aad = receta.medico_id;
  const [
    pacienteNombre,
    apellidoPaterno,
    apellidoMaterno,
    diagnostico,
    diagnosticoCie10,
    indicacionesGenerales,
    motivoAnulacion,
  ] = await Promise.all([
    decryptField(receta.paciente_nombre, aad),
    decryptField(receta.paciente_apellido_paterno, aad),
    decryptField(receta.paciente_apellido_materno, aad),
    decryptField(receta.diagnostico, aad),
    decryptField(receta.diagnostico_cie10, aad),
    decryptField(receta.indicaciones_generales, aad),
    decryptField(receta.motivo_anulacion, aad),
  ]);

  const items = itemsRaw
    ? await Promise.all(
        itemsRaw.map(async (it) => {
          const [
            medicamento,
            presentacion,
            dosis,
            frecuencia,
            duracion,
            via,
            indicaciones,
          ] = await Promise.all([
            decryptField(it.medicamento, aad),
            decryptField(it.presentacion, aad),
            decryptField(it.dosis, aad),
            decryptField(it.frecuencia, aad),
            decryptField(it.duracion, aad),
            decryptField(it.via_administracion, aad),
            decryptField(it.indicaciones, aad),
          ]);
          return {
            ...it,
            medicamento: medicamento ?? "",
            presentacion,
            dosis,
            frecuencia,
            duracion,
            via_administracion: via,
            indicaciones,
          };
        }),
      )
    : [];

  const buffer = await renderToBuffer(
    <RecetaPdf
      receta={{
        id: receta.id,
        paciente_nombre: pacienteNombre ?? "",
        paciente_apellido_paterno: apellidoPaterno,
        paciente_apellido_materno: apellidoMaterno,
        paciente_edad: receta.paciente_edad,
        paciente_sexo: receta.paciente_sexo,
        diagnostico: diagnostico ?? "",
        diagnostico_cie10: diagnosticoCie10,
        indicaciones_generales: indicacionesGenerales,
        status: receta.status,
        fecha_emision: receta.fecha_emision,
        motivo_anulacion: motivoAnulacion,
      }}
      items={items}
      medico={{
        nombre: profile?.nombre ?? null,
        email: profile?.email ?? null,
        cedula_profesional: profile?.cedula_profesional ?? null,
        especialidad: profile?.especialidad ?? null,
        consultorio_nombre: profile?.consultorio_nombre ?? null,
        consultorio_direccion: profile?.consultorio_direccion ?? null,
        consultorio_telefono: profile?.consultorio_telefono ?? null,
        pdf_brand_titulo: profile?.pdf_brand_titulo ?? null,
        pdf_brand_subtitulo: profile?.pdf_brand_subtitulo ?? null,
      }}
    />,
  );

  void recordAudit({
    userId: user.id,
    action: "receta.pdf_downloaded",
    resource: id,
  });

  const safeName =
    (pacienteNombre ?? "").replace(/[^\w-]/g, "_").slice(0, 40) || "paciente";
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
