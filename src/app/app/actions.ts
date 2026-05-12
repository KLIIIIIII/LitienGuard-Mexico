"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";

const PLATAFORMAS = ["iphone", "android", "ambas"] as const;
const ROLES = ["medico", "dentista", "hospital", "paciente", "otro"] as const;

const waitlistSchema = z.object({
  email: z.string().email("Correo inválido"),
  plataforma: z.enum(PLATAFORMAS, { message: "Selecciona una plataforma" }),
  rol: z.enum(ROLES).optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;

export type WaitlistState =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

const PLATAFORMA_LABEL: Record<(typeof PLATAFORMAS)[number], string> = {
  iphone: "iPhone",
  android: "Android",
  ambas: "Ambas",
};

const ROL_LABEL: Record<(typeof ROLES)[number], string> = {
  medico: "Médico",
  dentista: "Dentista",
  hospital: "Hospital o clínica",
  paciente: "Paciente",
  otro: "Otro",
};

export async function submitAppWaitlist(
  input: WaitlistInput,
  turnstileToken?: string | null,
): Promise<WaitlistState> {
  const parsed = waitlistSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Revisa los campos.",
    };
  }
  const data = parsed.data;

  const hdrs = await headers();
  const ip = extractIp(hdrs);
  const ua = hdrs.get("user-agent") ?? null;

  const turnstile = await verifyTurnstile(turnstileToken, ip);
  if (!turnstile.ok) {
    return {
      status: "error",
      message:
        "No pudimos verificar que eres humano. Recarga la página e inténtalo de nuevo.",
    };
  }

  const rl = await checkRateLimit(ip, "preregistro");
  if (!rl.allowed) {
    return {
      status: "error",
      message: "Demasiadas solicitudes. Inténtalo en unos minutos.",
    };
  }

  const supa = getSupabaseAdmin();
  if (!supa) {
    return {
      status: "error",
      message:
        "Servicio temporalmente no configurado. Vuelve a intentarlo en unos minutos.",
    };
  }

  // Reuse the preregistros table — tipo='otro' + structured mensaje keeps
  // the schema flat without introducing a new table for early-stage signal.
  const mensaje = `[App waitlist] Plataforma: ${PLATAFORMA_LABEL[data.plataforma]}${
    data.rol ? ` · Rol: ${ROL_LABEL[data.rol]}` : ""
  }`;

  const { error } = await supa.from("preregistros").insert({
    email: data.email.toLowerCase().trim(),
    tipo: "otro",
    nombre: null,
    mensaje,
    ip,
    user_agent: ua,
  });

  if (error) {
    console.error("[app/waitlist] insert error:", error);
    return {
      status: "error",
      message: "No pudimos guardar tu interés. Inténtalo de nuevo.",
    };
  }

  return {
    status: "ok",
    message:
      "Listo, estás en la lista. Te avisamos cuando la app nativa esté disponible.",
  };
}
