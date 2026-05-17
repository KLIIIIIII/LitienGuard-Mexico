/**
 * Monitoreo de descifrado en lote — detecta posible exfiltración por
 * una cuenta comprometida. Cada read surface que descifra varios items
 * a la vez debe llamar a recordBulkDecryption(userId, surface, count).
 *
 * Diseño portable:
 *   - Tabla decrypt_counters en Postgres (Supabase).
 *   - Si se migra a Redis o otra BD, solo este archivo cambia; los
 *     callers no se enteran.
 *   - El umbral está parametrizado por env vars (DECRYPT_THRESHOLD_*),
 *     calibrable en producción sin tocar código.
 *
 * Best-effort: nunca lanza error al caller. Si la tabla no existe o
 * Supabase está caído, se traga el error silenciosamente para no
 * romper la UX del médico legítimo.
 */

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { recordAudit } from "@/lib/audit";

// Umbrales por minuto. Sobrescribibles vía env para calibración.
const WARNING_THRESHOLD = Number(
  process.env.DECRYPT_THRESHOLD_WARNING ?? "50",
);
const CRITICAL_THRESHOLD = Number(
  process.env.DECRYPT_THRESHOLD_CRITICAL ?? "200",
);

function minuteBucket(d: Date = new Date()): string {
  // Truncar al minuto en UTC. ISO sin segundos/ms.
  const utc = new Date(
    Date.UTC(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      d.getUTCHours(),
      d.getUTCMinutes(),
    ),
  );
  return utc.toISOString();
}

/**
 * Registra que `userId` descifró `count` items en `surface` (ej.
 * "recetas.list", "paciente.expediente"). Si la suma del último
 * minuto supera el umbral de warning o critical, dispara entrada
 * en audit_log para que el admin pueda investigar.
 *
 * Llamar después del descifrado, no antes (no queremos contar
 * intentos fallidos como exfiltración).
 */
export async function recordBulkDecryption(
  userId: string | null | undefined,
  surface: string,
  count: number,
): Promise<void> {
  if (!userId || count <= 0) return;
  try {
    const supa = getSupabaseAdmin();
    if (!supa) return;

    const bucket = minuteBucket();

    // Upsert: si ya hay fila para este bucket+surface, incrementa.
    // Si no, crea con count inicial.
    const { data: existing } = await supa
      .from("decrypt_counters")
      .select("count")
      .eq("user_id", userId)
      .eq("minute_bucket", bucket)
      .eq("surface", surface)
      .maybeSingle();

    const newCount = (existing?.count ?? 0) + count;

    await supa.from("decrypt_counters").upsert(
      {
        user_id: userId,
        minute_bucket: bucket,
        surface,
        count: newCount,
      },
      { onConflict: "user_id,minute_bucket,surface" },
    );

    // Alerta si pasa umbral en este surface
    if (newCount >= CRITICAL_THRESHOLD) {
      void recordAudit({
        userId,
        action: "decrypt.high_volume_critical",
        resource: surface,
        metadata: {
          count_in_window: newCount,
          threshold: CRITICAL_THRESHOLD,
          window: "1min",
        },
      });
    } else if (newCount >= WARNING_THRESHOLD) {
      void recordAudit({
        userId,
        action: "decrypt.high_volume_warning",
        resource: surface,
        metadata: {
          count_in_window: newCount,
          threshold: WARNING_THRESHOLD,
          window: "1min",
        },
      });
    }
  } catch (e) {
    console.error("[decrypt-monitor] failed:", e);
  }
}
