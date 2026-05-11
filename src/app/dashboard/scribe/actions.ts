"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getGroq, GROQ_MODELS, SCRIBE_LIMITS } from "@/lib/groq";
import { SOAP_SYSTEM_PROMPT, buildSoapUserPrompt } from "@/lib/soap-prompt";
import { createSupabaseServer } from "@/lib/supabase-server";

const contextSchema = z.object({
  paciente_iniciales: z
    .string()
    .max(8, "Iniciales muy largas")
    .optional()
    .transform((v) => (v?.trim() ? v.trim().toUpperCase() : null)),
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

  let soap = { subjetivo: "", objetivo: "", analisis: "", plan: "" };
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
          }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2000,
    });
    completionId = completion.id ?? "";
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    soap = {
      subjetivo: typeof parsed.subjetivo === "string" ? parsed.subjetivo : "",
      objetivo: typeof parsed.objetivo === "string" ? parsed.objetivo : "",
      analisis: typeof parsed.analisis === "string" ? parsed.analisis : "",
      plan: typeof parsed.plan === "string" ? parsed.plan : "",
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
