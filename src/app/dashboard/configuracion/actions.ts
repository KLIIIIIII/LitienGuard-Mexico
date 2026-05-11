"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { invalidateCerebroCache } from "@/lib/bm25";

export async function toggleShareWithCollective(
  enabled: boolean,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { error } = await supa
    .from("profiles")
    .update({ share_with_collective: enabled })
    .eq("id", user.id);

  if (error) {
    console.error("[configuracion] toggle error:", error);
    return { status: "error", message: error.message };
  }

  // Cache invalidation: when un-sharing the DB trigger cleans the chunks;
  // when sharing future firmadas notes will produce chunks. Either way, the
  // cerebro index needs to refresh so the change is reflected immediately.
  invalidateCerebroCache();
  revalidatePath("/dashboard/configuracion");
  revalidatePath("/dashboard/cerebro");
  return { status: "ok" };
}
