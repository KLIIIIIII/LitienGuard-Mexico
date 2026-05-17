"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

type Result = { status: "ok" } | { status: "error"; message: string };

export async function acknowledgeAlert(alertId: string): Promise<Result> {
  if (!/^[0-9a-f-]{36}$/i.test(alertId)) {
    return { status: "error", message: "ID inválido." };
  }
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { error } = await supa
    .from("eventos_modulos")
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id,
      status: "completado",
    })
    .eq("id", alertId)
    .eq("user_id", user.id)
    .eq("tipo", "critical_alert");

  if (error) {
    return { status: "error", message: "No se pudo confirmar la alerta." };
  }

  void recordAudit({
    userId: user.id,
    action: "critical_alert.acknowledged",
    metadata: { alert_id: alertId },
  });

  revalidatePath("/dashboard");
  return { status: "ok" };
}

export async function acknowledgeAllAlerts(): Promise<Result> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { error } = await supa
    .from("eventos_modulos")
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id,
      status: "completado",
    })
    .eq("user_id", user.id)
    .eq("tipo", "critical_alert")
    .is("acknowledged_at", null);

  if (error) {
    return { status: "error", message: "No se pudo confirmar las alertas." };
  }

  void recordAudit({
    userId: user.id,
    action: "critical_alert.acknowledged_all",
  });

  revalidatePath("/dashboard");
  return { status: "ok" };
}
