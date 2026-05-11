"use server";

import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { searchCerebro } from "@/lib/bm25";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";

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
      }>;
      tookMs: number;
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

  const t0 = performance.now();
  const hits = searchCerebro(parsed.data.q, 6).map((h) => ({
    id: h.doc.id,
    source: h.doc.source,
    page: h.doc.page,
    title: h.doc.title,
    snippet: h.snippet,
    score: Number(h.score.toFixed(3)),
    meta: h.doc.meta,
  }));
  const tookMs = Math.round(performance.now() - t0);

  return { status: "ok", hits, tookMs };
}
