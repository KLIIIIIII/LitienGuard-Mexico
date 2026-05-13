"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

type Result = { status: "ok" } | { status: "error"; message: string };

export async function markTutorialComplete(): Promise<Result> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { error } = await supa
    .from("profiles")
    .update({ welcome_tutorial_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) {
    console.error("[tutorial] mark complete err:", error);
    return { status: "error", message: "No pudimos guardar tu progreso" };
  }

  void recordAudit({
    userId: user.id,
    action: "tutorial.completed",
  });

  revalidatePath("/dashboard", "layout");
  return { status: "ok" };
}

export async function markTutorialSkipped(): Promise<Result> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { error } = await supa
    .from("profiles")
    .update({ welcome_tutorial_skipped_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) {
    console.error("[tutorial] mark skipped err:", error);
    return { status: "error", message: "Error" };
  }

  void recordAudit({
    userId: user.id,
    action: "tutorial.skipped",
  });

  revalidatePath("/dashboard", "layout");
  return { status: "ok" };
}

export async function resetTutorial(): Promise<Result> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  // Reset solo el completed flag — skipped queda como histórico
  const { error } = await supa
    .from("profiles")
    .update({ welcome_tutorial_completed_at: null })
    .eq("id", user.id);
  if (error) {
    console.error("[tutorial] reset err:", error);
    return { status: "error", message: "Error" };
  }

  void recordAudit({
    userId: user.id,
    action: "tutorial.reset_for_replay",
  });

  revalidatePath("/dashboard", "layout");
  return { status: "ok" };
}
