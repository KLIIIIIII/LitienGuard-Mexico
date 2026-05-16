"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getGroq, GROQ_MODELS, SCRIBE_LIMITS } from "@/lib/groq";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/audit";
import { strictTierCheck } from "@/lib/security";
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
import { encryptField, decryptField } from "@/lib/encryption";

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

  const hdrs = await headers();
  const ip = extractIp(hdrs);
  const rl = await checkRateLimit(ip, "scribe", user.id);
  if (!rl.allowed) {
    return {
      status: "error",
      message:
        "Has alcanzado el límite de generación por hora. Espera unos minutos.",
    };
  }

  // Entitlement check — Scribe is a paid/pilot feature
  // Layer 1: regular client check (subject to RLS)
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
  // Layer 2: redundant service-role check that bypasses RLS to detect
  // tier-spoofing attempts (e.g., a compromised JWT trying to read its
  // own profile after an unauthorized tier downgrade race).
  const reauth = await strictTierCheck(user.id, ["pilot", "pro", "enterprise"]);
  if (!reauth) {
    void recordAudit({
      userId: user.id,
      action: "security.tier_mismatch_detected",
      resource: "scribe.generarNotaScribe",
      metadata: { client_tier: tier },
      ip,
    });
    return {
      status: "error",
      message: "No pudimos validar tu plan. Vuelve a iniciar sesión.",
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
  const consultaIdRaw = formData.get("consulta_id");
  const consultaId =
    typeof consultaIdRaw === "string" && /^[0-9a-f-]{36}$/i.test(consultaIdRaw)
      ? consultaIdRaw
      : null;
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
      // The RAG-injected "evidencia" block only carries academic chunks.
      // Practice-observed chunks are useful for human-facing exploration in
      // /dashboard/cerebro but would risk reinforcing colleagues' errors if
      // we let the model cite them as authority — we deliberately exclude
      // them here.
      if (hit.doc.tipo && hit.doc.tipo !== "evidencia_academica") continue;
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

  // Cifrar contenido clínico antes de persistir (Fase B). Los campos
  // de PII del paciente (iniciales, nombre, etc.) se cifran en Fase F.
  const [
    encTranscripcion,
    encSubjetivo,
    encObjetivo,
    encAnalisis,
    encPlan,
  ] = await Promise.all([
    encryptField(transcripcionText),
    encryptField(soap.subjetivo),
    encryptField(soap.objetivo),
    encryptField(soap.analisis),
    encryptField(soap.plan),
  ]);

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
      transcripcion: encTranscripcion,
      soap_subjetivo: encSubjetivo,
      soap_objetivo: encObjetivo,
      soap_analisis: encAnalisis,
      soap_plan: encPlan,
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
      consulta_id: consultaId,
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

  void recordAudit({
    userId: user.id,
    action: "scribe.note_created",
    resource: nota.id,
    metadata: {
      duracion_audio_bytes: file.size,
      keywords_count: keywords.length,
      evidence_count: evidencia.length,
      memoria_count: memoria.length,
    },
    ip,
    userAgent: hdrs.get("user-agent"),
  });

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
  const SOAP_FIELDS = new Set([
    "soap_subjetivo",
    "soap_objetivo",
    "soap_analisis",
    "soap_plan",
  ]);
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    if (v === undefined) continue;
    // Cifrar campos SOAP antes de persistir (Fase B)
    payload[k] = SOAP_FIELDS.has(k)
      ? await encryptField(v as string)
      : v;
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

  // Si la nota se acaba de firmar, hacer la extracción al cerebro
  // colectivo aquí (en la app, con contenido descifrado). Antes esto
  // lo hacía el trigger SQL sync_nota_to_practica, pero con los campos
  // SOAP cifrados el trigger copiaría texto cifrado. Migración 0031
  // deshabilita ese trigger.
  if (parsed.data.status === "firmada") {
    void extractNotaToCerebro(supa, notaId, user.id);
  }

  revalidatePath(`/dashboard/notas/${notaId}`);
  revalidatePath("/dashboard/notas");
  return { status: "ok" };
}

/**
 * Extracción de una nota firmada al cerebro colectivo. Reemplaza al
 * trigger SQL sync_nota_to_practica — necesario porque los campos
 * soap_* están cifrados y SQL no puede descifrarlos.
 *
 * Solo actúa si el médico tiene share_with_collective = true. El
 * contenido se anonimiza (edad redondeada a década, sin PII).
 * Best-effort: si falla, no rompe la firma de la nota.
 */
async function extractNotaToCerebro(
  supa: SupabaseClient,
  notaId: string,
  medicoId: string,
): Promise<void> {
  try {
    const { data: profile } = await supa
      .from("profiles")
      .select("share_with_collective")
      .eq("id", medicoId)
      .single();
    if (profile?.share_with_collective !== true) return;

    const { data: nota } = await supa
      .from("notas_scribe")
      .select(
        "id, soap_analisis, soap_plan, paciente_edad, paciente_sexo, status",
      )
      .eq("id", notaId)
      .eq("medico_id", medicoId)
      .single();
    if (!nota || nota.status !== "firmada") return;

    const analisis = (await decryptField(nota.soap_analisis)) ?? "";
    const plan = (await decryptField(nota.soap_plan)) ?? "";
    if (analisis.trim() === "" && plan.trim() === "") return;

    const roundedAge =
      nota.paciente_edad != null
        ? Math.floor(nota.paciente_edad / 10) * 10
        : null;

    let combined = analisis;
    if (plan.trim() !== "") {
      combined += `\n\nPlan observado: ${plan}`;
    }
    if (roundedAge != null) {
      combined += `\n\nPaciente: ${roundedAge}s`;
      if (nota.paciente_sexo) combined += ` · ${nota.paciente_sexo}`;
    }

    const chunkId = `practica-${notaId.replace(/-/g, "")}`;
    const shortTitle =
      analisis.length > 0
        ? analisis.slice(0, 80)
        : "Práctica clínica observada";

    // Cifrar content antes de persistir (migración 0033). El BM25
    // loader descifra al indexar; los chunks cifrados no afectan a
    // los queries del médico.
    const encryptedCombined = await encryptField(combined);

    await supa.from("cerebro_chunks").upsert(
      {
        id: chunkId,
        source: "LitienGuard · práctica observada",
        page: null,
        title: shortTitle,
        content: encryptedCombined,
        meta: {},
        tipo: "practica_observada",
        source_nota_id: notaId,
        is_active: true,
        created_by: medicoId,
        updated_by: medicoId,
      },
      { onConflict: "id" },
    );
  } catch (e) {
    console.warn("[scribe] extractNotaToCerebro warn:", e);
  }
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

  const cleanKeywords = keywords
    .map((k) => k.replace(/[%,]/g, " ").trim().toLowerCase())
    .filter((k) => k.length >= 3);
  if (cleanKeywords.length === 0) return [];

  // Los campos soap_* están cifrados (Fase B) — no se puede filtrar con
  // ILIKE en SQL. Traemos las notas firmadas recientes, las desciframos
  // en memoria (AES-GCM local ≈ 1ms c/u) y filtramos en JS. Límite de
  // 60 para acotar el costo de descifrado; a escala grande conviene un
  // índice derivado, pero al volumen de piloto es < 100ms.
  const { data, error } = await supa
    .from("notas_scribe")
    .select(
      "id,paciente_edad,paciente_sexo,soap_analisis,soap_plan,created_at",
    )
    .eq("medico_id", medicoId)
    .eq("status", "firmada")
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    console.warn("[scribe] memory search error:", error.message);
    return [];
  }

  const matches: MemoryChunk[] = [];
  for (const n of data ?? []) {
    if (matches.length >= 3) break;
    const analisis = ((await decryptField(n.soap_analisis)) ?? "").trim();
    const plan = ((await decryptField(n.soap_plan)) ?? "").trim();
    const haystack = `${analisis}\n${plan}`.toLowerCase();
    if (!cleanKeywords.some((k) => haystack.includes(k))) continue;

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
    matches.push({
      fecha: `${fecha}${demog ? ` · ${demog}` : ""}`,
      resumen: [
        analisis && `Análisis: ${analisis.slice(0, 400)}`,
        plan && `Plan: ${plan.slice(0, 400)}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }
  return matches;
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
