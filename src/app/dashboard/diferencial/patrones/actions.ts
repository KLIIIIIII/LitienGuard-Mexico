"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

const tutorialSchema = z.object({
  action: z.enum(["completed", "skipped"]),
});

export type TutorialResult =
  | { status: "ok" }
  | { status: "error"; message: string };

export async function markPatronesTutorial(
  action: "completed" | "skipped",
): Promise<TutorialResult> {
  const parsed = tutorialSchema.safeParse({ action });
  if (!parsed.success) {
    return { status: "error", message: "Acción inválida." };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const now = new Date().toISOString();
  const updates =
    action === "completed"
      ? { patrones_tutorial_completed_at: now }
      : { patrones_tutorial_skipped_at: now };

  const { error } = await supa
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    console.error("[patrones/tutorial] update error:", error);
    return { status: "error", message: error.message };
  }

  void recordAudit({
    userId: user.id,
    action: `patrones.tutorial_${action}`,
  });

  revalidatePath("/dashboard/diferencial/patrones");
  return { status: "ok" };
}
