"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

const crearSchema = z.object({
  titulo: z.string().trim().min(3).max(120),
  contenido: z.string().trim().min(10).max(2000),
  tipo: z.enum(["feature", "cambio", "alerta", "tip"]),
  audiencia: z.enum(["todos", "esencial", "profesional", "clinica", "admin"]),
  link_url: z.string().url().max(500).optional().or(z.literal("")),
  link_label: z.string().max(50).optional().or(z.literal("")),
  publicar_ya: z.boolean().default(false),
});

export type CrearAnuncioInput = z.input<typeof crearSchema>;
export type CrearResult =
  | { status: "ok"; id: string }
  | { status: "error"; message: string };

export async function crearAnuncio(
  input: CrearAnuncioInput,
): Promise<CrearResult> {
  const parsed = crearSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { data: profile } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return { status: "error", message: "Solo admins." };
  }

  const { data, error } = await supa
    .from("anuncios")
    .insert({
      titulo: parsed.data.titulo,
      contenido: parsed.data.contenido,
      tipo: parsed.data.tipo,
      audiencia: parsed.data.audiencia,
      link_url: parsed.data.link_url || null,
      link_label: parsed.data.link_label || null,
      publicado_at: parsed.data.publicar_ya ? new Date().toISOString() : null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: error?.message ?? "Error al crear." };
  }

  void recordAudit({
    userId: user.id,
    action: "anuncio.created",
    resource: data.id,
    metadata: { tipo: parsed.data.tipo, publicar_ya: parsed.data.publicar_ya },
  });

  revalidatePath("/admin/anuncios");
  revalidatePath("/dashboard");
  return { status: "ok", id: data.id };
}

const togglePubSchema = z.object({
  id: z.string().uuid(),
  publicar: z.boolean(),
});

export async function togglePublicar(
  id: string,
  publicar: boolean,
): Promise<CrearResult> {
  const parsed = togglePubSchema.safeParse({ id, publicar });
  if (!parsed.success)
    return { status: "error", message: "Datos inválidos." };

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { error } = await supa
    .from("anuncios")
    .update({
      publicado_at: parsed.data.publicar ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.id);

  if (error) return { status: "error", message: error.message };

  void recordAudit({
    userId: user.id,
    action: parsed.data.publicar ? "anuncio.published" : "anuncio.unpublished",
    resource: parsed.data.id,
  });

  revalidatePath("/admin/anuncios");
  revalidatePath("/dashboard");
  return { status: "ok", id: parsed.data.id };
}

export async function archivarAnuncio(id: string): Promise<CrearResult> {
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { status: "error", message: "ID inválido." };

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { error } = await supa
    .from("anuncios")
    .update({ archivado_at: new Date().toISOString() })
    .eq("id", parsed.data);

  if (error) return { status: "error", message: error.message };

  void recordAudit({
    userId: user.id,
    action: "anuncio.archived",
    resource: parsed.data,
  });

  revalidatePath("/admin/anuncios");
  revalidatePath("/dashboard");
  return { status: "ok", id: parsed.data };
}
