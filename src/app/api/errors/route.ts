import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServer } from "@/lib/supabase-server";
import { extractIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const errorSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).optional(),
  url: z.string().url().optional(),
  user_agent: z.string().max(500).optional(),
  session_id: z.string().max(120).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = errorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    // Silently accept so the client doesn't retry storm us
    return NextResponse.json({ ok: true });
  }

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  const ip = extractIp(req.headers);

  await admin.from("client_errors").insert({
    user_id: user?.id ?? null,
    message: parsed.data.message,
    stack: parsed.data.stack ?? null,
    url: parsed.data.url ?? null,
    user_agent: parsed.data.user_agent ?? null,
    session_id: parsed.data.session_id ?? null,
    metadata: { ...(parsed.data.metadata ?? {}), ip },
  });

  return NextResponse.json({ ok: true });
}
