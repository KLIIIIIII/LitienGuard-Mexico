"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

const tipoEnum = z.enum([
  "primera_vez",
  "subsecuente",
  "urgencia",
  "revision",
]);

const createConsultaSchema = z.object({
  paciente_id: z.string().uuid().nullable(),
  paciente_nombre: z.string().min(1).max(120).nullable(),
  paciente_apellido_paterno: z.string().max(80).nullable(),
  paciente_apellido_materno: z.string().max(80).nullable(),
  paciente_iniciales: z.string().max(20).nullable(),
  paciente_edad: z.number().int().min(0).max(130).nullable(),
  paciente_sexo: z.enum(["M", "F", "O"]).nullable(),
  motivo_consulta: z.string().max(2000).nullable(),
  tipo: tipoEnum,
  cita_id: z.string().uuid().nullable(),
});

export type CreateConsultaInput = z.input<typeof createConsultaSchema>;

export async function createConsulta(
  input: CreateConsultaInput,
): Promise<
  { status: "ok"; id: string } | { status: "error"; message: string }
> {
  const parsed = createConsultaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const paciente_id = parsed.data.paciente_id;
  let snapshot = {
    nombre: parsed.data.paciente_nombre,
    apellido_paterno: parsed.data.paciente_apellido_paterno,
    apellido_materno: parsed.data.paciente_apellido_materno,
    iniciales: parsed.data.paciente_iniciales,
    edad: parsed.data.paciente_edad,
    sexo: parsed.data.paciente_sexo,
  };

  if (paciente_id) {
    const { data: pac } = await supa
      .from("pacientes")
      .select(
        "id,nombre,apellido_paterno,apellido_materno,fecha_nacimiento,sexo",
      )
      .eq("id", paciente_id)
      .eq("medico_id", user.id)
      .single();
    if (!pac) {
      return {
        status: "error",
        message: "Paciente no encontrado en tu padrón",
      };
    }
    let edad: number | null = null;
    if (pac.fecha_nacimiento) {
      const fn = new Date(pac.fecha_nacimiento);
      const diffMs = Date.now() - fn.getTime();
      edad = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    }
    const iniciales =
      [pac.nombre, pac.apellido_paterno]
        .filter(Boolean)
        .map((s) => s!.trim().charAt(0).toUpperCase())
        .join("") || null;
    snapshot = {
      nombre: pac.nombre,
      apellido_paterno: pac.apellido_paterno,
      apellido_materno: pac.apellido_materno,
      iniciales,
      edad,
      sexo: (pac.sexo as "M" | "F" | "O" | null) ?? null,
    };
  }

  const { data, error } = await supa
    .from("consultas")
    .insert({
      medico_id: user.id,
      paciente_id,
      cita_id: parsed.data.cita_id,
      paciente_nombre: snapshot.nombre,
      paciente_apellido_paterno: snapshot.apellido_paterno,
      paciente_apellido_materno: snapshot.apellido_materno,
      paciente_iniciales: snapshot.iniciales,
      paciente_edad: snapshot.edad,
      paciente_sexo: snapshot.sexo,
      motivo_consulta: parsed.data.motivo_consulta,
      tipo: parsed.data.tipo,
      status: "abierta",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[consultas] insert error:", error);
    return {
      status: "error",
      message: "No pudimos crear la consulta",
    };
  }

  void recordAudit({
    userId: user.id,
    action: "consulta.created",
    resource: data.id,
    metadata: {
      paciente_id,
      tipo: parsed.data.tipo,
      from_cita: !!parsed.data.cita_id,
    },
  });

  revalidatePath("/dashboard/consultas");
  return { status: "ok", id: data.id };
}

export async function closeConsulta(
  id: string,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { error } = await supa
    .from("consultas")
    .update({ status: "cerrada", cerrada_at: new Date().toISOString() })
    .eq("id", id)
    .eq("medico_id", user.id);

  if (error) {
    console.error("[consultas] close error:", error);
    return { status: "error", message: "No pudimos cerrar la consulta" };
  }

  void recordAudit({
    userId: user.id,
    action: "consulta.closed",
    resource: id,
  });

  revalidatePath("/dashboard/consultas");
  revalidatePath(`/dashboard/consultas/${id}`);
  return { status: "ok" };
}

export async function cancelConsulta(
  id: string,
  motivo: string,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const motivoClean = motivo.trim().slice(0, 500);
  if (!motivoClean) {
    return { status: "error", message: "Indica el motivo de cancelación" };
  }

  const { error } = await supa
    .from("consultas")
    .update({
      status: "cancelada",
      cancelada_at: new Date().toISOString(),
      motivo_cancelacion: motivoClean,
    })
    .eq("id", id)
    .eq("medico_id", user.id);

  if (error) {
    console.error("[consultas] cancel error:", error);
    return {
      status: "error",
      message: "No pudimos cancelar la consulta",
    };
  }

  void recordAudit({
    userId: user.id,
    action: "consulta.cancelled",
    resource: id,
    metadata: { motivo: motivoClean },
  });

  revalidatePath("/dashboard/consultas");
  revalidatePath(`/dashboard/consultas/${id}`);
  return { status: "ok" };
}

export async function reopenConsulta(
  id: string,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { error } = await supa
    .from("consultas")
    .update({
      status: "abierta",
      cerrada_at: null,
      cancelada_at: null,
      motivo_cancelacion: null,
    })
    .eq("id", id)
    .eq("medico_id", user.id);

  if (error) {
    console.error("[consultas] reopen error:", error);
    return { status: "error", message: "No pudimos reabrir" };
  }

  void recordAudit({
    userId: user.id,
    action: "consulta.reopened",
    resource: id,
  });

  revalidatePath("/dashboard/consultas");
  revalidatePath(`/dashboard/consultas/${id}`);
  return { status: "ok" };
}

export async function updateConsultaNotes(
  id: string,
  motivo: string | null,
  notasLibres: string | null,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { error } = await supa
    .from("consultas")
    .update({
      motivo_consulta: motivo?.slice(0, 2000) || null,
      notas_libres: notasLibres?.slice(0, 5000) || null,
    })
    .eq("id", id)
    .eq("medico_id", user.id);

  if (error) {
    return { status: "error", message: "No pudimos guardar" };
  }

  revalidatePath(`/dashboard/consultas/${id}`);
  return { status: "ok" };
}

// =============================================================
// Vincular artefactos huérfanos a una consulta
// =============================================================

export async function attachToConsulta(
  consultaId: string,
  tipo: "nota" | "receta" | "diferencial",
  artefactoId: string,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  // Verificar que la consulta pertenece al médico
  const { data: consulta } = await supa
    .from("consultas")
    .select("id, status")
    .eq("id", consultaId)
    .eq("medico_id", user.id)
    .single();
  if (!consulta) {
    return { status: "error", message: "Consulta no encontrada" };
  }
  if (consulta.status === "cancelada") {
    return {
      status: "error",
      message: "No puedes adjuntar a una consulta cancelada",
    };
  }

  const table =
    tipo === "nota"
      ? "notas_scribe"
      : tipo === "receta"
        ? "recetas"
        : "diferencial_sessions";

  const { error } = await supa
    .from(table)
    .update({ consulta_id: consultaId })
    .eq("id", artefactoId)
    .eq("medico_id", user.id);

  if (error) {
    console.error("[consultas] attach error:", error);
    return { status: "error", message: "No pudimos vincular el artefacto" };
  }

  void recordAudit({
    userId: user.id,
    action: "consulta.artifact_attached",
    resource: consultaId,
    metadata: { tipo, artefacto_id: artefactoId },
  });

  revalidatePath(`/dashboard/consultas/${consultaId}`);
  return { status: "ok" };
}

// =============================================================
// Server action invocada desde el botón "Iniciar consulta" en
// las páginas de paciente o cita. Crea y redirige.
// =============================================================

export async function iniciarConsultaDesdeFormData(formData: FormData) {
  const paciente_id = (formData.get("paciente_id") as string) || null;
  const cita_id = (formData.get("cita_id") as string) || null;
  const tipo = (formData.get("tipo") as string) || "subsecuente";
  const motivo = (formData.get("motivo") as string) || null;

  const result = await createConsulta({
    paciente_id,
    cita_id,
    paciente_nombre: null,
    paciente_apellido_paterno: null,
    paciente_apellido_materno: null,
    paciente_iniciales: null,
    paciente_edad: null,
    paciente_sexo: null,
    motivo_consulta: motivo,
    tipo: tipo as "primera_vez" | "subsecuente" | "urgencia" | "revision",
  });

  if (result.status === "ok") {
    redirect(`/dashboard/consultas/${result.id}`);
  }
}
