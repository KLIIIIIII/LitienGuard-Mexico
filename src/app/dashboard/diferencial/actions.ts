"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import {
  extractFindings,
  type ExtractedFinding,
} from "@/lib/inference/extract-findings";
import { matchDxToCatalog, type DxMatch } from "@/lib/inference/match-dx";
import {
  inferDifferential,
  suggestFindingsToConfirm,
  type SuggestedFinding,
} from "@/lib/inference/bayesian";
import { DISEASES, LIKELIHOOD_RATIOS } from "@/lib/inference/knowledge-base";
import type { InferenceResult } from "@/lib/inference/types";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";

const saveSchema = z.object({
  paciente_iniciales: z.string().trim().max(10).optional().or(z.literal("")),
  paciente_edad: z.number().int().min(0).max(130).optional().nullable(),
  paciente_sexo: z.enum(["M", "F", "O"]).optional().nullable(),
  contexto_clinico: z.string().trim().max(2000).optional().or(z.literal("")),
  findings_observed: z.array(
    z.object({
      finding: z.string(),
      present: z.union([z.boolean(), z.null()]),
    }),
  ),
  top_diagnoses: z.array(
    z.object({
      disease: z.string(),
      label: z.string(),
      posterior: z.number(),
    }),
  ),
  medico_diagnostico_principal: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal("")),
  medico_notas: z.string().trim().max(2000).optional().or(z.literal("")),
  override_razonamiento: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal("")),
  consulta_id: z.string().uuid().nullable().optional(),
});

export type SaveDiferencialInput = z.infer<typeof saveSchema>;

export type SaveResult =
  | { status: "ok"; id: string }
  | { status: "error"; message: string };

export async function saveDiferencialSession(
  input: SaveDiferencialInput,
): Promise<SaveResult> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const d = parsed.data;

  const { data, error } = await supa
    .from("diferencial_sessions")
    .insert({
      medico_id: user.id,
      paciente_iniciales: d.paciente_iniciales || null,
      paciente_edad: d.paciente_edad ?? null,
      paciente_sexo: d.paciente_sexo ?? null,
      contexto_clinico: d.contexto_clinico || null,
      findings_observed: d.findings_observed,
      top_diagnoses: d.top_diagnoses,
      medico_diagnostico_principal: d.medico_diagnostico_principal || null,
      medico_notas: d.medico_notas || null,
      override_razonamiento: d.override_razonamiento || null,
      consulta_id: d.consulta_id ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[diferencial] insert error:", error);
    return { status: "error", message: "No pudimos guardar la sesión." };
  }

  void recordAudit({
    userId: user.id,
    action: "diferencial.session_saved",
    resource: data.id,
    metadata: {
      n_findings: d.findings_observed.length,
      top_diagnosis: d.top_diagnoses[0]?.label,
    },
  });

  revalidatePath("/dashboard/diferencial");
  return { status: "ok", id: data.id };
}

const extractSchema = z.object({
  text: z.string().trim().min(20).max(8000),
});

export type ExtractResult =
  | {
      status: "ok";
      extractions: ExtractedFinding[];
      latencyMs: number;
      modelUsed: string;
    }
  | { status: "error"; message: string };

export async function extractFindingsFromText(
  text: string,
): Promise<ExtractResult> {
  const parsed = extractSchema.safeParse({ text });
  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ??
        "El texto debe tener entre 20 y 8000 caracteres.",
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
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseCerebro(tier)) {
    return {
      status: "error",
      message: "La extracción automática requiere plan Profesional o superior.",
    };
  }

  try {
    const result = await extractFindings(parsed.data.text);

    const presentCount = result.extractions.filter(
      (e) => e.present === true,
    ).length;
    const absentCount = result.extractions.filter(
      (e) => e.present === false,
    ).length;

    void recordAudit({
      userId: user.id,
      action: "diferencial.findings_extracted",
      metadata: {
        text_length: parsed.data.text.length,
        present: presentCount,
        absent: absentCount,
        latency_ms: result.latencyMs,
        model: result.modelUsed,
        tokens_in: result.tokensInput,
        tokens_out: result.tokensOutput,
      },
    });

    return {
      status: "ok",
      extractions: result.extractions,
      latencyMs: result.latencyMs,
      modelUsed: result.modelUsed,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido.";
    console.error("[diferencial] extract error:", message);

    if (/API key|gateway|unauthorized|401|403/i.test(message)) {
      return {
        status: "error",
        message:
          "Servicio de extracción no configurado. Configura AI_GATEWAY_API_KEY en Vercel.",
      };
    }
    if (/rate|limit|429/i.test(message)) {
      return {
        status: "error",
        message: "Demasiadas solicitudes en este momento. Intenta en 1 minuto.",
      };
    }
    return {
      status: "error",
      message: "No pudimos procesar el texto. Marca los findings manualmente.",
    };
  }
}

// =============================================================
// procesarCasoCompleto — flujo invertido v2
//
// Recibe el Dx hipotético del médico + contexto clínico. Devuelve:
// 1. Match del Dx propuesto al catálogo (si existe)
// 2. Findings extraídos del contexto vía LLM
// 3. Probabilidad bayesiana del Dx del médico
// 4. Top-5 diferenciales alternativos que también explican los findings
// 5. Findings con mayor poder discriminativo que faltan confirmar
//
// Una sola llamada al server hace todo — paraleliza extracción + match.
// =============================================================

const procesarSchema = z.object({
  dxHipotesis: z.string().trim().min(2).max(300),
  contextoClinico: z.string().trim().min(20).max(8000),
});

export type ProcesarResult =
  | {
      status: "ok";
      dxMatch: DxMatch;
      extractions: ExtractedFinding[];
      /** Posterior del Dx del médico (null si no matchea el catálogo) */
      posteriorPropuesto: number | null;
      /** Top-5 diferenciales alternativos ordenados por posterior desc */
      alternativas: Array<{
        diseaseId: string;
        diseaseLabel: string;
        posterior: number;
      }>;
      /** Findings sugeridos para confirmar/descartar el Dx propuesto */
      findingsSugeridos: SuggestedFinding[];
      latencyMs: number;
    }
  | { status: "error"; message: string };

export async function procesarCasoCompleto(input: {
  dxHipotesis: string;
  contextoClinico: string;
}): Promise<ProcesarResult> {
  const parsed = procesarSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ??
        "Hipótesis (2-300 chars) y contexto (20-8000 chars) requeridos.",
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
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  if (!canUseCerebro(tier)) {
    return {
      status: "error",
      message: "El diferencial requiere plan Profesional o superior.",
    };
  }

  const t0 = Date.now();

  try {
    // Paralelizar: extracción de findings + match del Dx
    const [extractResult, dxMatch] = await Promise.all([
      extractFindings(parsed.data.contextoClinico),
      matchDxToCatalog(parsed.data.dxHipotesis),
    ]);

    const observations = extractResult.extractions.map((e) => ({
      finding: e.finding_id,
      present: e.present,
    }));

    // Inferencia bayesiana sobre todas las enfermedades
    const inferenceResults = inferDifferential(
      observations,
      DISEASES,
      LIKELIHOOD_RATIOS,
    );

    // Posterior del Dx propuesto (si está en el catálogo con confianza decente)
    let posteriorPropuesto: number | null = null;
    if (
      dxMatch.matchedId &&
      (dxMatch.confidence === "alta" || dxMatch.confidence === "media")
    ) {
      const match = inferenceResults.find(
        (r: InferenceResult) => r.disease.id === dxMatch.matchedId,
      );
      posteriorPropuesto = match?.posterior ?? null;
    }

    // Top-5 alternativas (excluyendo el Dx del médico si está)
    const alternativas = inferenceResults
      .filter((r: InferenceResult) =>
        dxMatch.matchedId ? r.disease.id !== dxMatch.matchedId : true,
      )
      .slice(0, 5)
      .map((r: InferenceResult) => ({
        diseaseId: r.disease.id,
        diseaseLabel: r.disease.label,
        posterior: r.posterior,
      }));

    // Findings sugeridos para confirmar el Dx propuesto
    const findingsSugeridos = dxMatch.matchedId
      ? suggestFindingsToConfirm(dxMatch.matchedId, observations, 8)
      : [];

    void recordAudit({
      userId: user.id,
      action: "diferencial.case_processed",
      metadata: {
        dx_hipotesis: parsed.data.dxHipotesis.slice(0, 100),
        dx_matched: dxMatch.matchedId,
        dx_confidence: dxMatch.confidence,
        n_findings_present: observations.filter((o) => o.present === true)
          .length,
        n_alternativas: alternativas.length,
        n_sugeridos: findingsSugeridos.length,
        posterior_propuesto: posteriorPropuesto,
      },
    });

    return {
      status: "ok",
      dxMatch,
      extractions: extractResult.extractions,
      posteriorPropuesto,
      alternativas,
      findingsSugeridos,
      latencyMs: Date.now() - t0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido.";
    console.error("[diferencial v2] procesar error:", message);

    if (/API key|gateway|unauthorized|401|403/i.test(message)) {
      return {
        status: "error",
        message:
          "Servicio de IA no configurado correctamente. Avisa al admin.",
      };
    }
    if (/rate|limit|429/i.test(message)) {
      return {
        status: "error",
        message: "Demasiadas solicitudes. Intenta en 1 minuto.",
      };
    }
    if (/credit|customer/i.test(message)) {
      return {
        status: "error",
        message:
          "El servicio de IA requiere crédito disponible. Avisa al admin.",
      };
    }
    return {
      status: "error",
      message: "No pudimos procesar el caso. Intenta de nuevo.",
    };
  }
}
