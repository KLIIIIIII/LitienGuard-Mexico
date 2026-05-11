"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getGroq, GROQ_MODELS, SCRIBE_LIMITS } from "@/lib/groq";
import {
  SOAP_SYSTEM_PROMPT,
  KEYWORDS_SYSTEM_PROMPT,
  buildSoapUserPrompt,
  type EvidenceChunk,
  type MemoryChunk,
} from "@/lib/soap-prompt";
import { type SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";
import { searchCerebro } from "@/lib/bm25";
import {
  canUseScribe,
  scribeMonthlyLimit,
  type SubscriptionTier,
} from "@/lib/entitlements";

const optionalText = (max: number) =>
  z
    .union([z.string().max(max), z.literal(""), z.undefined(), z.null()])
    .transform((v) => {
      if (typeof v !== "string") return null;
      const t = v.trim();
      return t ? t : null;
    });

const contextSchema = z.object({
  paciente_iniciales: z
    .union([z.string().max(8), z.literal(""), z.undefined()])
    .transform((v) =>
      typeof v === "string" && v.trim() ? v.trim().toUpperCase() : null,
    ),
  paciente_nombre: optionalText(80),
  paciente_apellido_paterno: optionalText(80),
  paciente_apellido_materno: optionalText(80),
  paciente_edad: z
    .union([z.coerce.number().int().min(0).max(130), z.literal(""), z.undefined()])
    .transform((v) => (typeof v === "number" ? v : null)),
  paciente_sexo: z
    .union([z.enum(["M", "F", "O"]), z.literal(""), z.undefined()])
    .transform((v) => (typeof v === "string" && v !== "" ? v : null)),
});

export type ScribeResult =
  | { status: "ok"; notaId: string }
  | { status: "error"; message: string };

export async function generarNotaScribe(
  formData: FormData,
): Promise<ScribeResult> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return { status: "error", message: "No autenticado." };
  }

  // Entitlement check — Scribe is a paid/pilot feature
  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = profile?.subscription_tier as SubscriptionTier | undefined;
  if (!canUseScribe(tier)) {
    return {
      status: "error",
      message:
        "Tu plan actual no incluye el Scribe. Solicita acceso al piloto o suscríbete al plan Pro.",
    };
  }

  // Monthly rate limit
  const limit = scribeMonthlyLimit(tier);
  if (Number.isFinite(limit)) {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);
    const { count: usedThisMonth } = await supa
      .from("notas_scribe")
      .select("*", { count: "exact", head: true })
      .eq("medico_id", user.id)
      .gte("created_at", startOfMonth.toISOString());
    if ((usedThisMonth ?? 0) >= limit) {
      return {
        status: "error",
        message: `Llegaste al límite mensual de tu plan (${limit} notas). Habla con admin para subir de plan o espera al inicio del próximo mes.`,
      };
    }
  }

  const file = formData.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return {
      status: "error",
      message: "Adjunta un archivo de audio para transcribir.",
    };
  }
  if (file.size > SCRIBE_LIMITS.maxAudioMb * 1024 * 1024) {
    return {
      status: "error",
      message: `El audio supera el límite de ${SCRIBE_LIMITS.maxAudioMb} MB.`,
    };
  }

  const ctx = contextSchema.safeParse({
    paciente_iniciales: formData.get("paciente_iniciales") ?? undefined,
    paciente_nombre: formData.get("paciente_nombre") ?? undefined,
    paciente_apellido_paterno:
      formData.get("paciente_apellido_paterno") ?? undefined,
    paciente_apellido_materno:
      formData.get("paciente_apellido_materno") ?? undefined,
    paciente_edad: formData.get("paciente_edad") ?? undefined,
    paciente_sexo: formData.get("paciente_sexo") ?? undefined,
  });
  if (!ctx.success) {
    return {
      status: "error",
      message:
        ctx.error.issues[0]?.message ?? "Datos del paciente inválidos.",
    };
  }

  const groq = getGroq();
  if (!groq) {
    return {
      status: "error",
      message: "Servicio de IA no configurado. Avisa al admin.",
    };
  }

  let transcripcionText = "";
  try {
    const tr = await groq.audio.transcriptions.create({
      file,
      model: GROQ_MODELS.whisper,
      response_format: "verbose_json",
      language: "es",
      temperature: 0,
    });
    transcripcionText = (tr as { text?: string }).text ?? "";
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Error desconocido al transcribir";
    console.error("[scribe] whisper error:", e);
    return {
      status: "error",
      message: `No pudimos transcribir el audio (${message}).`,
    };
  }

  if (!transcripcionText.trim()) {
    return {
      status: "error",
      message:
        "La transcripción quedó vacía. ¿El audio tiene voz audible en español?",
    };
  }

  // RAG step 1: extract clinical keywords from transcription
  let keywords: string[] = [];
  try {
    const kwCompletion = await groq.chat.completions.create({
      model: GROQ_MODELS.llama,
      messages: [
        { role: "system", content: KEYWORDS_SYSTEM_PROMPT },
        { role: "user", content: transcripcionText },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 300,
    });
    const kwRaw = kwCompletion.choices[0]?.message?.content ?? "{}";
    const kwParsed = JSON.parse(kwRaw) as { keywords?: unknown };
    if (Array.isArray(kwParsed.keywords)) {
      keywords = kwParsed.keywords
        .filter((k): k is string => typeof k === "string" && k.trim().length > 0)
        .slice(0, 8);
    }
  } catch (e) {
    console.warn("[scribe] keyword extraction failed, proceeding without RAG:", e);
  }

  // RAG step 2: retrieve relevant chunks from the cerebro (parallel)
  const hitsPerKeyword = await Promise.all(
    keywords.map((kw) => searchCerebro(kw, 2)),
  );
  const evidenceMap = new Map<string, EvidenceChunk>();
  for (const hits of hitsPerKeyword) {
    for (const hit of hits) {
      if (!evidenceMap.has(hit.doc.id)) {
        evidenceMap.set(hit.doc.id, {
          source: hit.doc.source,
          page: hit.doc.page,
          title: hit.doc.title,
          content: hit.doc.content,
        });
      }
    }
  }
  const evidencia = Array.from(evidenceMap.values()).slice(0, 6);

  // RAG step 2b: doctor's own memory — top firmadas notes matching keywords
  const memoria = await searchDoctorMemory(supa, user.id, keywords);

  // RAG step 3: generate SOAP grounded in evidence
  let soap = {
    subjetivo: "",
    objetivo: "",
    analisis: "",
    plan: "",
    citas: [] as string[],
  };
  let completionId = "";
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.llama,
      messages: [
        { role: "system", content: SOAP_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildSoapUserPrompt({
            transcripcion: transcripcionText,
            iniciales: ctx.data.paciente_iniciales,
            edad: ctx.data.paciente_edad,
            sexo: ctx.data.paciente_sexo,
            evidencia,
            memoria,
          }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2400,
    });
    completionId = completion.id ?? "";
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    soap = {
      subjetivo: typeof parsed.subjetivo === "string" ? parsed.subjetivo : "",
      objetivo: typeof parsed.objetivo === "string" ? parsed.objetivo : "",
      analisis: typeof parsed.analisis === "string" ? parsed.analisis : "",
      plan: typeof parsed.plan === "string" ? parsed.plan : "",
      citas: Array.isArray(parsed.citas)
        ? parsed.citas.filter((c): c is string => typeof c === "string")
        : [],
    };
  } catch (e: unknown) {
    console.error("[scribe] llama error:", e);
    const message =
      e instanceof Error ? e.message : "Error desconocido al generar SOAP";
    return {
      status: "error",
      message: `No pudimos estructurar la nota (${message}).`,
    };
  }

  const { data: nota, error } = await supa
    .from("notas_scribe")
    .insert({
      medico_id: user.id,
      paciente_iniciales: ctx.data.paciente_iniciales,
      paciente_nombre: ctx.data.paciente_nombre,
      paciente_apellido_paterno: ctx.data.paciente_apellido_paterno,
      paciente_apellido_materno: ctx.data.paciente_apellido_materno,
      paciente_edad: ctx.data.paciente_edad,
      paciente_sexo: ctx.data.paciente_sexo,
      audio_filename: file.name,
      transcripcion: transcripcionText,
      soap_subjetivo: soap.subjetivo,
      soap_objetivo: soap.objetivo,
      soap_analisis: soap.analisis,
      soap_plan: soap.plan,
      soap_metadata: {
        whisper_model: GROQ_MODELS.whisper,
        llama_model: GROQ_MODELS.llama,
        groq_completion_id: completionId,
        audio_size_bytes: file.size,
        rag_keywords: keywords,
        rag_chunks_used: evidencia.map((c) => `${c.source} pág. ${c.page}`),
        rag_citas_modelo: soap.citas,
        rag_memoria_usada: memoria.map((m) => m.fecha),
      },
      status: "borrador",
    })
    .select("id")
    .single();

  if (error || !nota) {
    console.error("[scribe] insert error:", error);
    return {
      status: "error",
      message: "Generamos la nota pero no pudimos guardarla. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/dashboard/notas");
  revalidatePath("/dashboard");
  return { status: "ok", notaId: nota.id };
}

const updateSchema = z.object({
  notaId: z.string().uuid(),
  soap_subjetivo: z.string().optional(),
  soap_objetivo: z.string().optional(),
  soap_analisis: z.string().optional(),
  soap_plan: z.string().optional(),
  status: z.enum(["borrador", "firmada", "descartada"]).optional(),
});

export async function actualizarNota(
  input: z.input<typeof updateSchema>,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Datos inválidos." };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado." };

  const { notaId, ...rest } = parsed.data;
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) payload[k] = v;
  }
  if (Object.keys(payload).length === 0) return { status: "ok" };

  const { error } = await supa
    .from("notas_scribe")
    .update(payload)
    .eq("id", notaId)
    .eq("medico_id", user.id);

  if (error) {
    console.error("[scribe] update error:", error);
    return { status: "error", message: "No pudimos guardar el cambio." };
  }

  revalidatePath(`/dashboard/notas/${notaId}`);
  revalidatePath("/dashboard/notas");
  return { status: "ok" };
}

/**
 * Search the doctor's own previously signed SOAP notes for cases matching
 * the current case's clinical keywords. Returns up to 3 short summaries
 * the model can lean on as a "patrón propio" hint.
 */
async function searchDoctorMemory(
  supa: SupabaseClient,
  medicoId: string,
  keywords: string[],
): Promise<MemoryChunk[]> {
  if (keywords.length === 0) return [];

  const orFilters = keywords
    .map((k) => k.replace(/[%,]/g, " ").trim())
    .filter((k) => k.length >= 3)
    .flatMap((k) => [
      `soap_analisis.ilike.%${k}%`,
      `soap_plan.ilike.%${k}%`,
    ])
    .join(",");

  if (!orFilters) return [];

  const { data, error } = await supa
    .from("notas_scribe")
    .select(
      "id,paciente_edad,paciente_sexo,soap_analisis,soap_plan,created_at",
    )
    .eq("medico_id", medicoId)
    .eq("status", "firmada")
    .or(orFilters)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    console.warn("[scribe] memory search error:", error.message);
    return [];
  }

  return (data ?? []).map((n) => {
    const fecha = new Date(n.created_at).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const demog = [
      n.paciente_edad != null ? `${n.paciente_edad}a` : null,
      n.paciente_sexo,
    ]
      .filter(Boolean)
      .join("/");
    const a = (n.soap_analisis ?? "").trim().slice(0, 400);
    const p = (n.soap_plan ?? "").trim().slice(0, 400);
    return {
      fecha: `${fecha}${demog ? ` · ${demog}` : ""}`,
      resumen: [a && `Análisis: ${a}`, p && `Plan: ${p}`]
        .filter(Boolean)
        .join("\n"),
    };
  });
}

export async function eliminarNota(notaId: string): Promise<void> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return;

  await supa
    .from("notas_scribe")
    .delete()
    .eq("id", notaId)
    .eq("medico_id", user.id);

  revalidatePath("/dashboard/notas");
  redirect("/dashboard/notas");
}
