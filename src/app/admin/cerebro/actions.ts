"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { encryptField } from "@/lib/encryption";
import { invalidateCerebroCache } from "@/lib/bm25";

const idSchema = z
  .string()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones");

const chunkSchema = z.object({
  id: idSchema,
  source: z.string().min(2).max(200),
  page: z.string().min(1).max(40),
  title: z.string().min(3).max(200),
  content: z.string().min(20).max(4000),
  meta_json: z.string().optional().default("{}"),
  is_active: z.boolean().default(true),
});

export type ChunkActionResult =
  | { status: "ok"; id: string }
  | { status: "error"; message: string };

async function requireAdmin() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { error: "No autenticado.", supa: null, user: null };

  const { data: profile } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin")
    return { error: "Solo admins.", supa: null, user: null };

  return { error: null, supa, user };
}

export async function crearChunk(
  formData: FormData,
): Promise<ChunkActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supa || !auth.user)
    return { status: "error", message: auth.error ?? "Sin permiso" };

  const raw = {
    id: String(formData.get("id") ?? "").trim().toLowerCase(),
    source: String(formData.get("source") ?? "").trim(),
    page: String(formData.get("page") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    meta_json: String(formData.get("meta_json") ?? "{}"),
    is_active: formData.get("is_active") === "on",
  };

  const parsed = chunkSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(parsed.data.meta_json);
    if (typeof meta !== "object" || Array.isArray(meta) || meta === null) {
      throw new Error("meta debe ser objeto JSON");
    }
  } catch (e) {
    return {
      status: "error",
      message: `Meta JSON inválido: ${e instanceof Error ? e.message : "parse error"}`,
    };
  }

  // Cifrar content antes de persistir (migración 0033).
  const encryptedContent = await encryptField(parsed.data.content);

  const { error } = await auth.supa.from("cerebro_chunks").insert({
    id: parsed.data.id,
    source: parsed.data.source,
    page: parsed.data.page,
    title: parsed.data.title,
    content: encryptedContent,
    meta,
    is_active: parsed.data.is_active,
    created_by: auth.user.id,
    updated_by: auth.user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { status: "error", message: "Ese ID ya existe." };
    }
    console.error("[admin/cerebro] crear error:", error);
    return { status: "error", message: error.message };
  }

  invalidateCerebroCache();
  revalidatePath("/admin/cerebro");
  return { status: "ok", id: parsed.data.id };
}

export async function actualizarChunk(
  formData: FormData,
): Promise<ChunkActionResult> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supa || !auth.user)
    return { status: "error", message: auth.error ?? "Sin permiso" };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { status: "error", message: "ID requerido" };

  const raw = {
    id,
    source: String(formData.get("source") ?? "").trim(),
    page: String(formData.get("page") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    content: String(formData.get("content") ?? "").trim(),
    meta_json: String(formData.get("meta_json") ?? "{}"),
    is_active: formData.get("is_active") === "on",
  };

  const parsed = chunkSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(parsed.data.meta_json);
  } catch (e) {
    return {
      status: "error",
      message: `Meta JSON inválido: ${e instanceof Error ? e.message : "parse"}`,
    };
  }

  // Cifrar content antes de persistir (migración 0033).
  const encryptedContent = await encryptField(parsed.data.content);

  const { error } = await auth.supa
    .from("cerebro_chunks")
    .update({
      source: parsed.data.source,
      page: parsed.data.page,
      title: parsed.data.title,
      content: encryptedContent,
      meta,
      is_active: parsed.data.is_active,
      updated_by: auth.user.id,
    })
    .eq("id", id);

  if (error) {
    console.error("[admin/cerebro] actualizar error:", error);
    return { status: "error", message: error.message };
  }

  invalidateCerebroCache();
  revalidatePath("/admin/cerebro");
  revalidatePath(`/admin/cerebro/${id}`);
  return { status: "ok", id };
}

export async function toggleActivoChunk(id: string): Promise<void> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supa) return;

  const { data: row } = await auth.supa
    .from("cerebro_chunks")
    .select("is_active")
    .eq("id", id)
    .single();
  if (!row) return;

  await auth.supa
    .from("cerebro_chunks")
    .update({ is_active: !row.is_active })
    .eq("id", id);

  invalidateCerebroCache();
  revalidatePath("/admin/cerebro");
}

export async function eliminarChunk(id: string): Promise<void> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supa) return;

  await auth.supa.from("cerebro_chunks").delete().eq("id", id);
  invalidateCerebroCache();
  revalidatePath("/admin/cerebro");
  redirect("/admin/cerebro");
}

const importSchema = z.object({
  chunks: z
    .array(
      z.object({
        id: idSchema,
        source: z.string().min(2).max(200),
        page: z.string().min(1).max(40),
        title: z.string().min(3).max(200),
        content: z.string().min(20).max(4000),
        meta: z.record(z.unknown()).optional(),
      }),
    )
    .min(1)
    .max(500),
});

export async function importarChunks(
  jsonText: string,
): Promise<
  | { status: "ok"; inserted: number; updated: number }
  | { status: "error"; message: string }
> {
  const auth = await requireAdmin();
  if (auth.error || !auth.supa || !auth.user)
    return { status: "error", message: auth.error ?? "Sin permiso" };

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch (e) {
    return {
      status: "error",
      message: `JSON inválido: ${e instanceof Error ? e.message : "parse"}`,
    };
  }

  const wrapped = Array.isArray(parsedJson)
    ? { chunks: parsedJson }
    : parsedJson;
  const parsed = importSchema.safeParse(wrapped);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Estructura inválida",
    };
  }

  // Cifrar content de cada chunk antes de persistir (migración 0033).
  const rows = await Promise.all(
    parsed.data.chunks.map(async (c) => ({
      id: c.id,
      source: c.source,
      page: c.page,
      title: c.title,
      content: await encryptField(c.content),
      meta: c.meta ?? {},
      is_active: true,
      created_by: auth.user!.id,
      updated_by: auth.user!.id,
    })),
  );

  const { error, count } = await auth.supa
    .from("cerebro_chunks")
    .upsert(rows, { onConflict: "id", count: "exact" });

  if (error) {
    console.error("[admin/cerebro] importar error:", error);
    return { status: "error", message: error.message };
  }

  invalidateCerebroCache();
  revalidatePath("/admin/cerebro");
  return {
    status: "ok",
    inserted: count ?? rows.length,
    updated: 0,
  };
}
