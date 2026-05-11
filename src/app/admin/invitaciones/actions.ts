"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";

const inviteSchema = z.object({
  email: z.string().email("Correo inválido"),
  role: z.enum(["medico", "admin"]),
  subscription_tier: z.enum(["free", "pilot", "pro", "enterprise"]),
  nombre: z.string().max(120).optional(),
  hospital: z.string().max(120).optional(),
});

export type InviteState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

export async function inviteUser(formData: FormData): Promise<InviteState> {
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    subscription_tier: formData.get("subscription_tier") ?? "pilot",
    nombre: formData.get("nombre") || undefined,
    hospital: formData.get("hospital") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { status: "error", message: "No autenticado" };

  const { data: me } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") {
    return { status: "error", message: "Solo admins pueden invitar" };
  }

  const { error } = await supa.from("invitaciones").upsert(
    {
      email: parsed.data.email.toLowerCase().trim(),
      role: parsed.data.role,
      subscription_tier: parsed.data.subscription_tier,
      nombre: parsed.data.nombre ?? null,
      hospital: parsed.data.hospital ?? null,
      invitada_por: user.id,
      usada: false,
      expires_at: new Date(
        Date.now() + 60 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    { onConflict: "email" },
  );

  if (error) {
    console.error("[admin/invitaciones] upsert error:", error);
    return { status: "error", message: "No pudimos guardar la invitación" };
  }

  revalidatePath("/admin/invitaciones");
  return {
    status: "ok",
    message: `Invitación lista para ${parsed.data.email}. Ya puede pedir su magic link.`,
  };
}

export async function revokeInvite(id: string): Promise<void> {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return;

  const { data: me } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return;

  await supa.from("invitaciones").delete().eq("id", id);
  revalidatePath("/admin/invitaciones");
}
