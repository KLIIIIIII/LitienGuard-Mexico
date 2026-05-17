"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";
import { canUseScribe, type SubscriptionTier } from "@/lib/entitlements";
import { parseCda, type CdaDocumento } from "@/lib/import-from-cda";

const previewSchema = z.object({
  content: z.string().min(20).max(2_000_000),
});

export type PreviewCdaResult =
  | { status: "ok"; documento: CdaDocumento }
  | { status: "error"; message: string };

export async function previewCda(
  content: string,
): Promise<PreviewCdaResult> {
  const parsed = previewSchema.safeParse({ content });
  if (!parsed.success) {
    return {
      status: "error",
      message: "El archivo debe tener entre 20 y 2,000,000 caracteres.",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const hdrs = await headers();
  const ip = extractIp(hdrs);
  const rl = await checkRateLimit(ip, "import_image", user.id);
  if (!rl.allowed) {
    return {
      status: "error",
      message: "Has alcanzado el límite de importaciones por hora.",
    };
  }

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseScribe(tier)) {
    return {
      status: "error",
      message: "La importación CDA requiere plan Esencial o superior.",
    };
  }

  const documento = parseCda(parsed.data.content);

  void recordAudit({
    userId: user.id,
    action: "import.cda_preview",
    metadata: {
      tiene_paciente: documento.paciente !== null,
      secciones: documento.secciones.length,
      warnings: documento.warnings.length,
    },
  });

  return { status: "ok", documento };
}

export type ImportCdaResult =
  | { status: "ok"; pacienteId: string }
  | { status: "error"; message: string };

export async function importarCda(
  documento: CdaDocumento,
): Promise<ImportCdaResult> {
  if (!documento.paciente) {
    return {
      status: "error",
      message: "El documento CDA no contiene datos del paciente.",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const p = documento.paciente;

  // Dedupe por nombre + fecha de nacimiento si está disponible
  if (p.fecha_nacimiento) {
    const { data: existing } = await supa
      .from("pacientes")
      .select("id")
      .eq("medico_id", user.id)
      .eq("nombre", p.nombre)
      .eq("fecha_nacimiento", p.fecha_nacimiento)
      .limit(1);
    if (existing && existing.length > 0) {
      return {
        status: "error",
        message:
          "Ya existe un paciente con ese nombre y fecha de nacimiento. Edita el existente o ajusta los datos del CDA.",
      };
    }
  }

  // Construir notas_internas con resumen del CDA
  const notasParts: string[] = [];
  if (p.externalId) {
    notasParts.push(`ID externo (CDA): ${p.externalId}`);
  }
  if (documento.fecha) {
    notasParts.push(`Fecha del documento clínico: ${documento.fecha}`);
  }
  for (const sec of documento.secciones) {
    if (!sec.texto) continue;
    const preview = sec.texto.slice(0, 300);
    notasParts.push(`${sec.titulo}: ${preview}${sec.texto.length > 300 ? "…" : ""}`);
  }
  notasParts.push(`Importado desde CDA el ${new Date().toISOString().slice(0, 10)}`);

  const notas_internas = notasParts.join("\n\n");

  const { data, error } = await supa
    .from("pacientes")
    .insert({
      medico_id: user.id,
      nombre: p.nombre,
      apellido_paterno: p.apellido_paterno,
      apellido_materno: p.apellido_materno,
      fecha_nacimiento: p.fecha_nacimiento,
      sexo: p.sexo,
      telefono: p.telefono,
      notas_internas,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      status: "error",
      message: error?.message ?? "Error al guardar paciente.",
    };
  }

  void recordAudit({
    userId: user.id,
    action: "import.cda_imported",
    resource: data.id,
    metadata: { secciones: documento.secciones.length },
  });

  revalidatePath("/dashboard/pacientes");

  return { status: "ok", pacienteId: data.id };
}
