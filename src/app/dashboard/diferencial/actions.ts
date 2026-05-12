"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

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
