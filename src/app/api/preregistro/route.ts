import { NextResponse, type NextRequest } from "next/server";
import { preregistroSchema } from "@/lib/preregistro";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getResend, RESEND_FROM } from "@/lib/resend-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = preregistroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation error",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const ua = req.headers.get("user-agent") ?? null;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Service not configured. Missing Supabase environment variables.",
      },
      { status: 503 },
    );
  }

  const { error } = await supabase.from("preregistros").insert({
    email: data.email.toLowerCase().trim(),
    tipo: data.tipo,
    nombre: data.nombre || null,
    mensaje: data.mensaje || null,
    utm_source: data.utm_source || null,
    utm_medium: data.utm_medium || null,
    utm_campaign: data.utm_campaign || null,
    ip,
    user_agent: ua,
  });

  if (error) {
    console.error("[api/preregistro] insert error:", error);
    return NextResponse.json(
      { ok: false, error: "Database error" },
      { status: 500 },
    );
  }

  // Best-effort email
  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: RESEND_FROM,
        to: [data.email],
        subject: "Recibimos tu solicitud — LitienGuard",
        text: `Hola,\n\nGracias por interesarte en LitienGuard. Te contactamos en menos de 48 horas.\n\n— LitienGuard`,
      });
    } catch (e) {
      console.error("[api/preregistro] resend error:", e);
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
