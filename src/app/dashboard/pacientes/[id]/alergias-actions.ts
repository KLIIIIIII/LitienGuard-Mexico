"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

const schema = z.object({
  pacienteId: z.string().uuid(),
  alergias: z.array(z.string().min(1).max(80)).max(30),
});

export type ActionResult =
  | { status: "ok" }
  | { status: "error"; message: string };

export async function updateAlergias(
  input: z.infer<typeof schema>,
): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
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

  const cleaned = Array.from(
    new Set(parsed.data.alergias.map((a) => a.trim()).filter((a) => a.length > 0)),
  );

  const { error } = await supa
    .from("pacientes")
    .update({ alergias: cleaned })
    .eq("id", parsed.data.pacienteId)
    .eq("medico_id", user.id);

  if (error) {
    return { status: "error", message: "No se pudieron guardar las alergias." };
  }

  void recordAudit({
    userId: user.id,
    action: "paciente.alergias_actualizadas",
    metadata: { paciente_id: parsed.data.pacienteId, n_alergias: cleaned.length },
  });

  revalidatePath(`/dashboard/pacientes/${parsed.data.pacienteId}`);
  return { status: "ok" };
}
