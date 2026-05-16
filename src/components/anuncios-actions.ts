"use server";

import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

const idSchema = z.string().uuid();

export type AnuncioActionResult =
  | { status: "ok" }
  | { status: "error"; message: string };

export async function markAnuncioVisto(
  anuncioId: string,
): Promise<AnuncioActionResult> {
  const parsed = idSchema.safeParse(anuncioId);
  if (!parsed.success) return { status: "error", message: "ID inválido." };

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { error } = await supa.from("anuncios_vistos").upsert(
    {
      user_id: user.id,
      anuncio_id: parsed.data,
    },
    { onConflict: "user_id,anuncio_id" },
  );
  if (error) return { status: "error", message: error.message };

  return { status: "ok" };
}

export async function dismissAnuncio(
  anuncioId: string,
): Promise<AnuncioActionResult> {
  const parsed = idSchema.safeParse(anuncioId);
  if (!parsed.success) return { status: "error", message: "ID inválido." };

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const now = new Date().toISOString();
  const { error } = await supa.from("anuncios_vistos").upsert(
    {
      user_id: user.id,
      anuncio_id: parsed.data,
      visto_at: now,
      descartado_at: now,
    },
    { onConflict: "user_id,anuncio_id" },
  );
  if (error) return { status: "error", message: error.message };

  void recordAudit({
    userId: user.id,
    action: "anuncio.dismissed",
    resource: parsed.data,
  });

  return { status: "ok" };
}
