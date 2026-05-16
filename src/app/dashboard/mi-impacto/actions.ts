"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

export type ConsentResult = { status: "ok" } | { status: "error"; message: string };

export async function toggleConsentRwd(activar: boolean): Promise<ConsentResult> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const updates = {
    consent_rwd_aggregated_at: activar ? new Date().toISOString() : null,
  };

  const { error } = await supa
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return { status: "error", message: error.message };
  }

  void recordAudit({
    userId: user.id,
    action: activar ? "rwd.consent_granted" : "rwd.consent_revoked",
  });

  revalidatePath("/dashboard/mi-impacto");
  return { status: "ok" };
}
