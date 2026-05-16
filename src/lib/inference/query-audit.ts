/**
 * Audit forense de queries al diferencial y al cerebro.
 *
 * Cada respuesta autenticada lleva un watermark único (`_wm`) que se
 * inyecta en el JSON serializado y se registra en `query_audit`. Si el
 * watermark aparece en un dump externo, mapea directo al user_id y
 * timestamp del request.
 *
 * El hash de la query es SHA-256 truncado — no guardamos el contenido
 * (PHI / datos clínicos), solo la huella para detectar repeticiones.
 *
 * Best-effort: si el insert falla, NO bloqueamos la respuesta al usuario.
 * Loggeamos el error a la consola para investigación.
 */

import { createHash, randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type AuditAction =
  | "diferencial.procesar"
  | "cerebro.buscar"
  | "cerebro.analizar_nota";

export interface AuditQueryArgs {
  userId: string;
  action: AuditAction;
  query: string;
  responseCount: number;
  responseWatermark: string;
  ip?: string | null;
  userAgent?: string | null;
  tier?: string | null;
  latencyMs?: number;
}

/**
 * Genera un watermark de 12 caracteres alphanum url-safe.
 * Colisión ~1 en 5 trillones; uniqueness ad-hoc suficiente para forense.
 */
export function generateResponseWatermark(): string {
  return randomBytes(9)
    .toString("base64")
    .replace(/\+/g, "A")
    .replace(/\//g, "B")
    .replace(/=/g, "");
}

function hashQuery(q: string): string {
  return createHash("sha256")
    .update(q.trim().toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

/**
 * Registra el query en `query_audit`. Best-effort — nunca lanza.
 * Usa el cliente admin (service_role) porque la tabla tiene RLS que
 * solo permite SELECT a admins; los INSERT deben venir del server.
 */
export async function recordQueryAudit(args: AuditQueryArgs): Promise<void> {
  try {
    const supa = getSupabaseAdmin();
    if (!supa) return;
    await supa.from("query_audit").insert({
      user_id: args.userId,
      action: args.action,
      query_hash: hashQuery(args.query),
      query_length: args.query.length,
      response_count: args.responseCount,
      response_watermark: args.responseWatermark,
      ip: args.ip ?? null,
      user_agent: args.userAgent ?? null,
      tier: args.tier ?? null,
      latency_ms: args.latencyMs ?? null,
    });
  } catch (e) {
    console.warn("[query-audit] insert failed:", e);
  }
}
