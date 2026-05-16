"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

const outcomeSchema = z.object({
  id: z.string().uuid(),
  outcome: z.enum(["confirmado", "refutado", "parcial", "pendiente"]),
  notas: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type OutcomeResult =
  | { status: "ok" }
  | { status: "error"; message: string };

export async function setOutcome(
  id: string,
  outcome: "confirmado" | "refutado" | "parcial" | "pendiente",
  notas?: string,
): Promise<OutcomeResult> {
  const parsed = outcomeSchema.safeParse({ id, outcome, notas });
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

  const updates: {
    outcome_confirmado: string | null;
    outcome_confirmado_at: string | null;
    outcome_notes?: string | null;
  } = {
    outcome_confirmado: outcome === "pendiente" ? null : outcome,
    outcome_confirmado_at:
      outcome === "pendiente" ? null : new Date().toISOString(),
  };
  // outcome_notes guarda lo que pasó realmente — separado de medico_notas
  // que es del momento de consulta.
  updates.outcome_notes = parsed.data.notas ? parsed.data.notas : null;

  const { error } = await supa
    .from("diferencial_sessions")
    .update(updates)
    .eq("id", id)
    .eq("medico_id", user.id);

  if (error) {
    console.error("[diferencial/outcome] update error:", error);
    return { status: "error", message: error.message };
  }

  void recordAudit({
    userId: user.id,
    action: "diferencial.outcome_set",
    resource: id,
    metadata: { outcome },
  });

  revalidatePath(`/dashboard/diferencial/${id}`);
  revalidatePath("/dashboard/diferencial");
  revalidatePath("/dashboard/diferencial/historial");
  return { status: "ok" };
}

export async function deleteSession(
  id: string,
): Promise<OutcomeResult> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { error } = await supa
    .from("diferencial_sessions")
    .delete()
    .eq("id", id)
    .eq("medico_id", user.id);

  if (error) {
    return { status: "error", message: error.message };
  }

  void recordAudit({
    userId: user.id,
    action: "diferencial.session_deleted",
    resource: id,
  });

  revalidatePath("/dashboard/diferencial");
  revalidatePath("/dashboard/diferencial/historial");
  return { status: "ok" };
}
