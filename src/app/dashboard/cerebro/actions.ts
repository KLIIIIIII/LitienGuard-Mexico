"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { searchCerebro } from "@/lib/bm25";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { strictTierCheck } from "@/lib/security";
import { recordAudit } from "@/lib/audit";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";
import {
  generateResponseWatermark,
  recordQueryAudit,
} from "@/lib/inference/query-audit";

const querySchema = z.object({
  q: z.string().min(2, "Consulta muy corta").max(500),
});

export type CerebroSearchResult =
  | {
      status: "ok";
      hits: Array<{
        id: string;
        source: string;
        page: string;
        title: string;
        snippet: string;
        score: number;
        meta?: Record<string, string>;
        tipo: "evidencia_academica" | "practica_observada";
      }>;
      tookMs: number;
      /** Watermark forense — registrado en query_audit. */
      _wm: string;
    }
  | { status: "error"; message: string };

export async function buscarCerebro(input: {
  q: string;
}): Promise<CerebroSearchResult> {
  const parsed = querySchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Consulta inválida",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const hdrs = await headers();
  const ip = extractIp(hdrs);
  const userAgent = hdrs.get("user-agent");

  // Rate-limit anti-scraping del cerebro.
  const rl = await checkRateLimit(ip, "cerebro_search", user.id);
  if (!rl.allowed) {
    void recordAudit({
      userId: user.id,
      action: "cerebro.rate_limited",
      metadata: { ip, ua: userAgent },
      ip,
    });
    return {
      status: "error",
      message:
        "Has alcanzado el límite de búsquedas por hora. Espera unos minutos.",
    };
  }

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = profile?.subscription_tier as SubscriptionTier | undefined;
  if (!canUseCerebro(tier)) {
    return {
      status: "error",
      message:
        "El Cerebro está disponible en plan Pro o Enterprise. Solicita acceso.",
    };
  }
  const reauth = await strictTierCheck(user.id, ["pro", "enterprise"]);
  if (!reauth) {
    void recordAudit({
      userId: user.id,
      action: "security.tier_mismatch_detected",
      resource: "cerebro.buscarCerebro",
      metadata: { client_tier: tier },
    });
    return {
      status: "error",
      message: "No pudimos validar tu plan. Vuelve a iniciar sesión.",
    };
  }

  const t0 = performance.now();
  const responseWatermark = generateResponseWatermark();
  const hits = (await searchCerebro(parsed.data.q, 8)).map((h) => ({
    id: h.doc.id,
    source: h.doc.source,
    page: h.doc.page,
    title: h.doc.title,
    snippet: h.snippet,
    score: Number(h.score.toFixed(3)),
    meta: h.doc.meta,
    tipo: (h.doc.tipo ?? "evidencia_academica") as
      | "evidencia_academica"
      | "practica_observada",
  }));
  const tookMs = Math.round(performance.now() - t0);

  // Audit forense — best-effort.
  void recordQueryAudit({
    userId: user.id,
    action: "cerebro.buscar",
    query: parsed.data.q,
    responseCount: hits.length,
    responseWatermark,
    ip,
    userAgent,
    tier: tier ?? null,
    latencyMs: tookMs,
  });

  return { status: "ok", hits, tookMs, _wm: responseWatermark };
}
