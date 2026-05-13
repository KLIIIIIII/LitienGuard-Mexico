"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseRecetas, type SubscriptionTier } from "@/lib/entitlements";
import { recordAudit } from "@/lib/audit";

const itemSchema = z.object({
  medicamento: z.string().trim().min(1, "Medicamento requerido").max(200),
  presentacion: z.string().trim().max(200).optional().or(z.literal("")),
  dosis: z.string().trim().max(200).optional().or(z.literal("")),
  frecuencia: z.string().trim().max(200).optional().or(z.literal("")),
  duracion: z.string().trim().max(200).optional().or(z.literal("")),
  via_administracion: z.string().trim().max(80).optional().or(z.literal("")),
  indicaciones: z.string().trim().max(500).optional().or(z.literal("")),
});

const recetaSchema = z.object({
  paciente_nombre: z.string().trim().min(1, "Nombre del paciente requerido").max(120),
  paciente_apellido_paterno: z.string().trim().max(80).optional().or(z.literal("")),
  paciente_apellido_materno: z.string().trim().max(80).optional().or(z.literal("")),
  paciente_edad: z.number().int().min(0).max(130).optional().nullable(),
  paciente_sexo: z.enum(["M", "F", "O"]).optional().nullable(),
  diagnostico: z.string().trim().min(1, "Diagnóstico requerido").max(500),
  diagnostico_cie10: z.string().trim().max(20).optional().or(z.literal("")),
  indicaciones_generales: z.string().trim().max(1000).optional().or(z.literal("")),
  observaciones: z.string().trim().max(1000).optional().or(z.literal("")),
  items: z.array(itemSchema).min(1, "Agrega al menos un medicamento").max(20),
  consulta_id: z.string().uuid().nullable().optional(),
});

export type RecetaInput = z.infer<typeof recetaSchema>;

export type ActionResult =
  | { status: "ok"; recetaId: string }
  | { status: "error"; message: string };

async function getTierAndUser(): Promise<
  | { ok: true; userId: string; tier: SubscriptionTier; nombre: string | null }
  | { ok: false; error: string }
> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier,nombre,cedula_profesional")
    .eq("id", user.id)
    .single();

  if (!profile) return { ok: false, error: "Perfil no encontrado." };

  const tier = (profile.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseRecetas(tier)) {
    return { ok: false, error: "Tu plan no incluye recetas electrónicas. Actualiza a Profesional." };
  }
  if (!profile.cedula_profesional) {
    return {
      ok: false,
      error:
        "Para emitir recetas necesitas registrar tu cédula profesional en Configuración → Datos para recetas.",
    };
  }
  return { ok: true, userId: user.id, tier, nombre: profile.nombre };
}

export async function createReceta(input: RecetaInput): Promise<ActionResult> {
  const auth = await getTierAndUser();
  if (!auth.ok) return { status: "error", message: auth.error };

  const parsed = recetaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const data = parsed.data;

  const supa = await createSupabaseServer();

  const { data: receta, error: insertError } = await supa
    .from("recetas")
    .insert({
      medico_id: auth.userId,
      paciente_nombre: data.paciente_nombre,
      paciente_apellido_paterno: data.paciente_apellido_paterno || null,
      paciente_apellido_materno: data.paciente_apellido_materno || null,
      paciente_edad: data.paciente_edad ?? null,
      paciente_sexo: data.paciente_sexo ?? null,
      diagnostico: data.diagnostico,
      diagnostico_cie10: data.diagnostico_cie10 || null,
      indicaciones_generales: data.indicaciones_generales || null,
      observaciones: data.observaciones || null,
      status: "borrador",
      consulta_id: data.consulta_id ?? null,
    })
    .select("id")
    .single();

  if (insertError || !receta) {
    console.error("[recetas] insert error:", insertError);
    return { status: "error", message: "No pudimos crear la receta." };
  }

  const itemsToInsert = data.items.map((it, idx) => ({
    receta_id: receta.id,
    orden: idx + 1,
    medicamento: it.medicamento,
    presentacion: it.presentacion || null,
    dosis: it.dosis || null,
    frecuencia: it.frecuencia || null,
    duracion: it.duracion || null,
    via_administracion: it.via_administracion || null,
    indicaciones: it.indicaciones || null,
  }));

  const { error: itemsError } = await supa
    .from("recetas_items")
    .insert(itemsToInsert);

  if (itemsError) {
    console.error("[recetas] items insert error:", itemsError);
    // Rollback the parent row
    await supa.from("recetas").delete().eq("id", receta.id);
    return { status: "error", message: "No pudimos guardar los medicamentos." };
  }

  void recordAudit({
    userId: auth.userId,
    action: "receta.created",
    resource: receta.id,
    metadata: { paciente: data.paciente_nombre, items_count: data.items.length },
  });

  revalidatePath("/dashboard/recetas");
  return { status: "ok", recetaId: receta.id };
}

export async function firmarReceta(recetaId: string): Promise<ActionResult> {
  const auth = await getTierAndUser();
  if (!auth.ok) return { status: "error", message: auth.error };

  const supa = await createSupabaseServer();

  // Verify it's a draft owned by this user
  const { data: existing } = await supa
    .from("recetas")
    .select("id,status,medico_id")
    .eq("id", recetaId)
    .single();

  if (!existing || existing.medico_id !== auth.userId) {
    return { status: "error", message: "Receta no encontrada." };
  }
  if (existing.status !== "borrador") {
    return {
      status: "error",
      message: `No se puede firmar una receta en estado ${existing.status}.`,
    };
  }

  const { error } = await supa
    .from("recetas")
    .update({ status: "firmada", fecha_emision: new Date().toISOString() })
    .eq("id", recetaId);

  if (error) {
    console.error("[recetas] sign error:", error);
    return { status: "error", message: error.message };
  }

  void recordAudit({
    userId: auth.userId,
    action: "receta.signed",
    resource: recetaId,
  });

  revalidatePath("/dashboard/recetas");
  revalidatePath(`/dashboard/recetas/${recetaId}`);
  return { status: "ok", recetaId };
}

export async function anularReceta(
  recetaId: string,
  motivo: string,
): Promise<ActionResult> {
  const auth = await getTierAndUser();
  if (!auth.ok) return { status: "error", message: auth.error };

  const motivoTrim = motivo.trim();
  if (motivoTrim.length < 5) {
    return { status: "error", message: "El motivo debe tener al menos 5 caracteres." };
  }

  const supa = await createSupabaseServer();

  const { data: existing } = await supa
    .from("recetas")
    .select("id,status,medico_id")
    .eq("id", recetaId)
    .single();

  if (!existing || existing.medico_id !== auth.userId) {
    return { status: "error", message: "Receta no encontrada." };
  }
  if (existing.status === "anulada") {
    return { status: "error", message: "La receta ya está anulada." };
  }

  const { error } = await supa
    .from("recetas")
    .update({ status: "anulada", motivo_anulacion: motivoTrim })
    .eq("id", recetaId);

  if (error) {
    console.error("[recetas] anular error:", error);
    return { status: "error", message: error.message };
  }

  void recordAudit({
    userId: auth.userId,
    action: "receta.anulada",
    resource: recetaId,
    metadata: { motivo: motivoTrim },
  });

  revalidatePath("/dashboard/recetas");
  revalidatePath(`/dashboard/recetas/${recetaId}`);
  return { status: "ok", recetaId };
}
