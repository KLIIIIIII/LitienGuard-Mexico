"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";

export type ChallengeResult =
  | { status: "ok" }
  | { status: "error"; message: string };

export async function submitMfaChallenge(
  factorId: string,
  code: string,
  nextPath: string,
): Promise<ChallengeResult> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "Sesión no encontrada." };

  const trimmed = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(trimmed)) {
    return { status: "error", message: "El código debe tener 6 dígitos." };
  }

  const { error } = await supa.auth.mfa.challengeAndVerify({
    factorId,
    code: trimmed,
  });

  if (error) {
    void recordAudit({
      userId: user.id,
      action: "auth.mfa_challenge_failed",
      metadata: { factor_id: factorId, error: error.message },
    });
    return {
      status: "error",
      message: "Código incorrecto. Vuelve a intentarlo.",
    };
  }

  void recordAudit({
    userId: user.id,
    action: "auth.mfa_challenge_passed",
    metadata: { factor_id: factorId },
  });

  revalidatePath("/", "layout");
  redirect(nextPath || "/dashboard");
}
