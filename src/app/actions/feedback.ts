"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getResend, RESEND_FROM } from "@/lib/resend-client";
import { checkRateLimit, extractIp } from "@/lib/rate-limit";

const feedbackSchema = z.object({
  tipo: z.enum(["bug", "sugerencia", "elogio", "pregunta"]),
  severidad: z.enum(["baja", "media", "alta", "critica"]),
  titulo: z.string().max(120).optional(),
  descripcion: z.string().min(10).max(2000),
  url: z.string().url().optional(),
  user_agent: z.string().max(500).optional(),
});

export type FeedbackInput = z.input<typeof feedbackSchema>;

export type FeedbackResult =
  | { status: "ok"; id: string }
  | { status: "error"; message: string };

const TIPO_LABEL: Record<FeedbackInput["tipo"], string> = {
  bug: "Bug",
  sugerencia: "Sugerencia",
  elogio: "Elogio",
  pregunta: "Pregunta",
};

export async function enviarFeedback(
  input: FeedbackInput,
): Promise<FeedbackResult> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const hdrs = await headers();
  const ip = extractIp(hdrs);
  const rl = await checkRateLimit(ip, "feedback");
  if (!rl.allowed) {
    return {
      status: "error",
      message: "Demasiados reportes seguidos. Espera unos minutos.",
    };
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      status: "error",
      message: "Servicio no configurado.",
    };
  }

  const { data: row, error } = await admin
    .from("feedback")
    .insert({
      user_id: user?.id ?? null,
      user_email: user?.email ?? null,
      tipo: parsed.data.tipo,
      severidad: parsed.data.severidad,
      titulo: parsed.data.titulo ?? null,
      descripcion: parsed.data.descripcion,
      url: parsed.data.url ?? null,
      user_agent: parsed.data.user_agent ?? null,
      metadata: { ip },
    })
    .select("id")
    .single();

  if (error || !row) {
    console.error("[feedback] insert error:", error);
    return {
      status: "error",
      message: "No pudimos guardar tu reporte.",
    };
  }

  // Best-effort admin notification
  const resend = getResend();
  if (resend) {
    const adminEmail =
      process.env.ADMIN_NOTIFY_EMAIL ?? "contacto@litienguard.mx";
    const esc = (s: string) =>
      s.replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c] as string,
      );
    const sevBadge: Record<FeedbackInput["severidad"], string> = {
      baja: "#8B887F",
      media: "#8B6B3A",
      alta: "#8E4A52",
      critica: "#7a2a30",
    };
    const subj = `[${TIPO_LABEL[parsed.data.tipo]}${
      parsed.data.tipo === "bug" ? ` · ${parsed.data.severidad}` : ""
    }] ${parsed.data.titulo ?? parsed.data.descripcion.slice(0, 60)}`;
    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: [adminEmail],
        replyTo: user?.email ?? undefined,
        subject: subj,
        html: `
          <div style="font-family: system-ui, sans-serif; color: #2C2B27; max-width: 640px;">
            <p style="font-size:.78rem; letter-spacing:.11em; text-transform:uppercase; color:#4A6B5B; margin:0 0 12px 0;">LitienGuard · Feedback</p>
            <h1 style="font-size:1.3rem; font-weight:600; margin:0 0 10px 0;">${esc(parsed.data.titulo ?? "Nuevo reporte")}</h1>
            <p style="font-size:.86rem; color:#57554F; margin:0 0 16px 0;">
              <strong>${TIPO_LABEL[parsed.data.tipo]}</strong>${
                parsed.data.tipo === "bug"
                  ? ` · <span style="color:${sevBadge[parsed.data.severidad]}">${parsed.data.severidad}</span>`
                  : ""
              } · de ${esc(user?.email ?? "anónimo")}
            </p>
            <div style="background:#F4F2EB; border-radius:8px; padding:16px; margin:0 0 16px 0; white-space:pre-wrap; font-size:.92rem; line-height:1.55;">${esc(parsed.data.descripcion)}</div>
            ${parsed.data.url ? `<p style="font-size:.78rem; color:#8B887F;"><strong>URL:</strong> ${esc(parsed.data.url)}</p>` : ""}
            ${parsed.data.user_agent ? `<p style="font-size:.78rem; color:#8B887F;"><strong>UA:</strong> ${esc(parsed.data.user_agent)}</p>` : ""}
            <p style="font-size:.78rem; color:#8B887F;"><strong>IP:</strong> ${esc(ip)}</p>
            <hr style="border:0; height:1px; background:#E5E2DA; margin:20px 0;"/>
            <p style="font-size:.78rem; color:#8B887F;">Revísalo en <a href="https://litien-guard-mexico.vercel.app/admin/feedback" style="color:#2D3E50;">/admin/feedback</a>.</p>
          </div>`,
      });
    } catch (e) {
      console.warn("[feedback] resend admin notify warn:", e);
    }
  }

  return { status: "ok", id: row.id };
}
