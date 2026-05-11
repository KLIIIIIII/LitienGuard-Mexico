"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function actualizarFeedback(
  id: string,
  patch: {
    status?: "nuevo" | "en_revision" | "resuelto" | "descartado";
    admin_notes?: string;
  },
): Promise<void> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return;

  const { data: me } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return;

  const payload: Record<string, unknown> = {};
  if (patch.status) {
    payload.status = patch.status;
    if (patch.status === "resuelto" || patch.status === "descartado") {
      payload.resolved_at = new Date().toISOString();
    }
  }
  if (patch.admin_notes !== undefined) payload.admin_notes = patch.admin_notes;

  await supa.from("feedback").update(payload).eq("id", id);
  revalidatePath("/admin/feedback");
}
