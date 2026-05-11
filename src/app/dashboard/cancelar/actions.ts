"use server";

import { headers } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { recordAudit } from "@/lib/audit";
import { extractIp } from "@/lib/rate-limit";
import { invalidateCerebroCache } from "@/lib/bm25";

/**
 * Right to cancellation (LFPDPPP · ARCO). Wipes ALL data the user owns:
 *  - notas_scribe (and via FK cascade their practica_observada cerebro chunks)
 *  - invitaciones marked usada attributable to them (kept for record)
 *  - profiles row (cascade also drops auth.users)
 * The audit trail is preserved with user_id nulled by the FK ON DELETE SET NULL.
 */
export async function eliminarMisDatos(
  confirmacion: string,
): Promise<
  | { status: "ok"; deleted: { notas: number } }
  | { status: "error"; message: string }
> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return { status: "error", message: "No autenticado." };
  }

  if (confirmacion.trim().toUpperCase() !== "ELIMINAR") {
    return {
      status: "error",
      message: 'Escribe "ELIMINAR" exactamente para confirmar la cancelación.',
    };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      status: "error",
      message: "Servicio no configurado. Inténtalo más tarde.",
    };
  }

  const hdrs = await headers();
  const ip = extractIp(hdrs);

  // Count notas first (for audit + response)
  const { count: notasCount } = await admin
    .from("notas_scribe")
    .select("*", { count: "exact", head: true })
    .eq("medico_id", user.id);

  void recordAudit({
    userId: user.id,
    action: "datos.cancellation_requested",
    metadata: { notas_a_eliminar: notasCount ?? 0 },
    ip,
    userAgent: hdrs.get("user-agent"),
  });

  // Delete in this order: notas (also cleans practica chunks via FK),
  // profile (cascade auth user), invitations remain marked usada.
  const { error: notasErr } = await admin
    .from("notas_scribe")
    .delete()
    .eq("medico_id", user.id);
  if (notasErr) {
    console.error("[cancelar] notas delete error:", notasErr);
    return {
      status: "error",
      message: "No pudimos completar la eliminación. Contacta soporte.",
    };
  }

  // Profile delete will cascade to auth.users via FK
  const { error: profileErr } = await admin
    .from("profiles")
    .delete()
    .eq("id", user.id);
  if (profileErr) {
    console.error("[cancelar] profile delete error:", profileErr);
    return {
      status: "error",
      message: "Eliminamos tus notas pero el perfil no. Contacta soporte.",
    };
  }

  // Best-effort auth user deletion (in case the FK cascade is loose)
  try {
    await admin.auth.admin.deleteUser(user.id);
  } catch (e) {
    console.warn("[cancelar] auth.deleteUser warn:", e);
  }

  invalidateCerebroCache();

  void recordAudit({
    userId: null, // user no longer exists
    action: "datos.cancellation_completed",
    metadata: { ex_user_id: user.id, notas_eliminadas: notasCount ?? 0 },
    ip,
    userAgent: hdrs.get("user-agent"),
  });

  return { status: "ok", deleted: { notas: notasCount ?? 0 } };
}
