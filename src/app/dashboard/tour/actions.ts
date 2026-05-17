"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

type Result = { status: "ok" } | { status: "error"; message: string };

export async function markTourComplete(): Promise<Result> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { error } = await supa
    .from("profiles")
    .update({ welcome_tour_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) {
    return { status: "error", message: "No pudimos guardar tu progreso" };
  }

  void recordAudit({
    userId: user.id,
    action: "tour.completed",
  });

  revalidatePath("/dashboard");
  return { status: "ok" };
}

export async function markTourSkipped(): Promise<Result> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { error } = await supa
    .from("profiles")
    .update({ welcome_tour_skipped_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) {
    return { status: "error", message: "Error" };
  }

  void recordAudit({
    userId: user.id,
    action: "tour.skipped",
  });

  revalidatePath("/dashboard");
  return { status: "ok" };
}

export async function resetTour(): Promise<Result> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { error } = await supa
    .from("profiles")
    .update({ welcome_tour_completed_at: null })
    .eq("id", user.id);
  if (error) {
    return { status: "error", message: "Error" };
  }

  void recordAudit({
    userId: user.id,
    action: "tour.reset_for_replay",
  });

  revalidatePath("/dashboard");
  return { status: "ok" };
}
