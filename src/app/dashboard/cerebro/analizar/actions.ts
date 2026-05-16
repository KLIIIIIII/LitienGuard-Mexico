"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";
import {
  extractFindings,
  type ExtractedFinding,
} from "@/lib/inference/extract-findings";
import { inferDifferential } from "@/lib/inference/bayesian";
import { DISEASES, LIKELIHOOD_RATIOS, findFinding } from "@/lib/inference/knowledge-base";
import { MX_NATIONAL_PRIORS } from "@/lib/inference/priors-mx";
import {
  detectRedFlagsInText,
  summarizeRedFlags,
  type SymptomRedFlags,
} from "@/lib/inference/red-flags";
import {
  findSimilarCases,
  type SimilarCase,
} from "@/lib/patient-memory";
import {
  generateResponseWatermark,
  recordQueryAudit,
} from "@/lib/inference/query-audit";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";

const schema = z.object({
  contextoClinico: z.string().trim().min(40).max(8000),
});

interface DxTop {
  id: string;
  label: string;
  posterior: number;
}

export type AnalizarNotaResult =
  | {
      status: "ok";
      extractions: ExtractedFinding[];
      topDx: DxTop[];
      redFlags: SymptomRedFlags[];
      redFlagsSummary: { now: number; soon: number; monitor: number };
      similarCases: SimilarCase[];
      latencyMs: number;
      _wm: string;
    }
  | { status: "error"; message: string };

/**
 * Pipeline simple para médicos que vienen de OTRO EHR — pegan su nota
 * SOAP completa y reciben:
 *   1. Findings extraídos (LLM cerebro)
 *   2. Top 5 diferenciales bayesianos calibrados a MX
 *   3. Red flags detectados por síntoma
 *
 * NO genera diferenciales con LLM generativo (cuesta más, latencia mayor).
 * Para el flujo completo (hipótesis del médico + razonamiento generativo)
 * existe procesarCasoCompleto en /dashboard/diferencial/actions.
 */
export async function analizarNotaSoap(
  contextoClinico: string,
): Promise<AnalizarNotaResult> {
  const parsed = schema.safeParse({ contextoClinico });
  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ??
        "La nota debe tener entre 40 y 8000 caracteres.",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const hdrs = await headers();
  const ip = extractIp(hdrs);
  const ua = hdrs.get("user-agent");

  const rl = await checkRateLimit(ip, "diferencial", user.id);
  if (!rl.allowed) {
    return {
      status: "error",
      message:
        "Has alcanzado el límite de análisis por hora. Intenta en unos minutos.",
    };
  }

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseCerebro(tier)) {
    return {
      status: "error",
      message:
        "El análisis con cerebro requiere plan Profesional o superior.",
    };
  }

  const t0 = Date.now();
  const wm = generateResponseWatermark();

  try {
    const extractResult = await extractFindings(parsed.data.contextoClinico);

    const observations = extractResult.extractions.map((e) => ({
      finding: e.finding_id,
      present: e.present,
    }));

    const inferenceResults = inferDifferential(
      observations,
      DISEASES,
      LIKELIHOOD_RATIOS,
      { priorsOverride: MX_NATIONAL_PRIORS },
    );

    const topDx: DxTop[] = inferenceResults.slice(0, 5).map((r) => ({
      id: r.disease.id,
      label: r.disease.label,
      posterior: r.posterior,
    }));

    const redFlags = detectRedFlagsInText(parsed.data.contextoClinico);
    const redFlagsSummary = summarizeRedFlags(redFlags);

    // D3 — patient memory: buscar casos parecidos en la práctica del médico
    const similarCases = await findSimilarCases(
      user.id,
      parsed.data.contextoClinico,
      { limit: 4 },
    );

    const latencyMs = Date.now() - t0;

    void recordAudit({
      userId: user.id,
      action: "cerebro.analizar_nota_soap",
      metadata: {
        text_length: parsed.data.contextoClinico.length,
        n_findings: extractResult.extractions.length,
        top_dx: topDx[0]?.id,
        n_red_flags: redFlags.length,
        latency_ms: latencyMs,
      },
    });

    void recordQueryAudit({
      userId: user.id,
      action: "cerebro.analizar_nota",
      query: parsed.data.contextoClinico,
      responseCount: topDx.length + redFlags.length,
      responseWatermark: wm,
      ip,
      userAgent: ua,
      tier,
      latencyMs,
    });

    // Filtrar findings que estén en catálogo (defensivo)
    const validExtractions = extractResult.extractions.filter(
      (e) => findFinding(e.finding_id) !== undefined,
    );

    return {
      status: "ok",
      extractions: validExtractions,
      topDx,
      redFlags,
      redFlagsSummary,
      similarCases,
      latencyMs,
      _wm: wm,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido.";
    console.error("[analizar-nota] error:", message);
    if (/API key|gateway|unauthorized|401|403/i.test(message)) {
      return {
        status: "error",
        message: "Servicio de extracción no configurado.",
      };
    }
    return {
      status: "error",
      message: "No pudimos analizar la nota. Intenta de nuevo.",
    };
  }
}
