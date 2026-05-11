"use server";

import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const emailSchema = z.string().email("Correo inválido");

export type LoginState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

export async function requestMagicLink(email: string): Promise<LoginState> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }
  const normalized = parsed.data.toLowerCase().trim();

  const supaAdmin = getSupabaseAdmin();
  if (!supaAdmin) {
    return {
      status: "error",
      message:
        "Servicio temporalmente no configurado. Inténtalo en unos minutos.",
    };
  }

  // Whitelist check: invitación pendiente o profile existente
  const [{ data: invite }, { data: profile }] = await Promise.all([
    supaAdmin
      .from("invitaciones")
      .select("email,usada,expires_at")
      .ilike("email", normalized)
      .maybeSingle(),
    supaAdmin
      .from("profiles")
      .select("email")
      .ilike("email", normalized)
      .maybeSingle(),
  ]);

  const inviteValid =
    invite &&
    !invite.usada &&
    (!invite.expires_at || new Date(invite.expires_at) > new Date());

  if (!profile && !inviteValid) {
    return {
      status: "error",
      message:
        "Tu correo no está en la lista de acceso al piloto. Solicítalo desde el formulario público.",
    };
  }

  const supa = await createSupabaseServer();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://litienguard-mexico.vercel.app";

  const { error } = await supa.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("[login] signInWithOtp error:", error);
    return {
      status: "error",
      message: "No pudimos enviar el correo. Inténtalo de nuevo.",
    };
  }

  return {
    status: "ok",
    message:
      "Revisa tu correo. Te enviamos un link de un solo clic para entrar.",
  };
}

export async function signOut(): Promise<void> {
  const supa = await createSupabaseServer();
  await supa.auth.signOut();
}
