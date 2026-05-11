import { getSupabaseAdmin } from "@/lib/supabase-admin";

export interface AuditEvent {
  userId?: string | null;
  action: string;
  resource?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Best-effort audit logger — never throws into the caller. Use for
 * high-signal events (login, sign, opt-in changes, role changes,
 * deletions, exports). Resist the urge to log everything — noise dilutes
 * forensic value.
 */
export async function recordAudit(event: AuditEvent): Promise<void> {
  try {
    const supa = getSupabaseAdmin();
    if (!supa) return;
    await supa.from("audit_log").insert({
      user_id: event.userId ?? null,
      action: event.action,
      resource: event.resource ?? null,
      metadata: event.metadata ?? {},
      ip: event.ip ?? null,
      user_agent: event.userAgent ?? null,
    });
  } catch (e) {
    console.error("[audit] failed:", e);
  }
}
