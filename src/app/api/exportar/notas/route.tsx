import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import {
  analizarNotas,
  type NotaForAnalytics,
} from "@/lib/analytics/notas";
import { ReportePdf } from "@/lib/pdf/reporte-pdf";
import { decryptField } from "@/lib/encryption";

export const dynamic = "force-dynamic";

type NotaFull = NotaForAnalytics & {
  paciente_iniciales: string | null;
  paciente_nombre: string | null;
  paciente_apellido_paterno: string | null;
  paciente_apellido_materno: string | null;
  soap_subjetivo: string | null;
  soap_objetivo: string | null;
  audio_filename: string | null;
  transcripcion: string | null;
  soap_metadata: Record<string, unknown> | null;
  updated_at: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "no auth" }, { status: 401 });
  }

  const { data: profile } = await supa
    .from("profiles")
    .select("nombre, email, hospital, especialidad")
    .eq("id", user.id)
    .single();

  const { data: rows } = await supa
    .from("notas_scribe")
    .select(
      "id,paciente_iniciales,paciente_nombre,paciente_apellido_paterno,paciente_apellido_materno,paciente_edad,paciente_sexo,audio_filename,transcripcion,soap_subjetivo,soap_objetivo,soap_analisis,soap_plan,soap_metadata,status,created_at,updated_at",
    )
    .order("created_at", { ascending: false });

  // Descifrar contenido clínico de cada nota (Fase B) antes de exportar
  const notas = (
    await Promise.all(
      ((rows as NotaFull[] | null) ?? []).map(async (n) => ({
        ...n,
        transcripcion: await decryptField(n.transcripcion),
        soap_subjetivo: await decryptField(n.soap_subjetivo),
        soap_objetivo: await decryptField(n.soap_objetivo),
        soap_analisis: await decryptField(n.soap_analisis),
        soap_plan: await decryptField(n.soap_plan),
      })),
    )
  ) as NotaFull[];

  const analytics = analizarNotas(notas);
  const medico = {
    nombre: profile?.nombre ?? user.email ?? "Médico",
    email: profile?.email ?? user.email ?? "",
    hospital: profile?.hospital ?? null,
    especialidad: profile?.especialidad ?? null,
  };

  if (format === "pdf") {
    const buffer = await renderToBuffer(
      <ReportePdf
        medico={{
          nombre: medico.nombre,
          email: medico.email,
          hospital: medico.hospital,
        }}
        analytics={analytics}
      />,
    );
    const filename = `litienguard-reporte-${new Date().toISOString().slice(0, 10)}.pdf`;
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // JSON dump
  const payload = {
    metadata: {
      exportado_en: new Date().toISOString(),
      medico,
      total_notas: analytics.total,
      firmadas: analytics.firmadas,
      rango: analytics.rango,
    },
    analytics,
    notas: notas.map((n) => ({
      id: n.id,
      created_at: n.created_at,
      updated_at: n.updated_at,
      status: n.status,
      paciente: {
        nombre: n.paciente_nombre,
        apellido_paterno: n.paciente_apellido_paterno,
        apellido_materno: n.paciente_apellido_materno,
        iniciales: n.paciente_iniciales,
        edad: n.paciente_edad,
        sexo: n.paciente_sexo,
      },
      audio_filename: n.audio_filename,
      transcripcion: n.transcripcion,
      soap: {
        subjetivo: n.soap_subjetivo,
        objetivo: n.soap_objetivo,
        analisis: n.soap_analisis,
        plan: n.soap_plan,
      },
      metadata: n.soap_metadata,
    })),
  };

  const filename = `litienguard-notas-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
