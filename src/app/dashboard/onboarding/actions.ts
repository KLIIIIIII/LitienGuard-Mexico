"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

const profileTypeSchema = z.object({
  profile_type: z.enum(["medico_general", "dentista", "hospital"]),
});

export type OnboardingResult =
  | { status: "ok" }
  | { status: "error"; message: string };

export async function setProfileType(
  profileType: "medico_general" | "dentista" | "hospital",
): Promise<OnboardingResult> {
  const parsed = profileTypeSchema.safeParse({ profile_type: profileType });
  if (!parsed.success) {
    return { status: "error", message: "Tipo de perfil inválido" };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { error } = await supa
    .from("profiles")
    .update({ profile_type: parsed.data.profile_type })
    .eq("id", user.id);

  if (error) {
    console.error("[onboarding] set profile_type err:", error);
    return { status: "error", message: "No pudimos guardar tu selección" };
  }

  void recordAudit({
    userId: user.id,
    action: "profile.type_set",
    metadata: { profile_type: parsed.data.profile_type },
  });

  revalidatePath("/dashboard", "layout");
  return { status: "ok" };
}
