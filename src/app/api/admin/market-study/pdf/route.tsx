import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { recordAudit } from "@/lib/audit";
import { MarketStudyPdf } from "@/lib/pdf/market-study-pdf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "no auth" }, { status: 401 });
  }

  const { data: profile } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const buffer = await renderToBuffer(<MarketStudyPdf />);

  void recordAudit({
    userId: user.id,
    action: "admin.market_study_pdf_exported",
  });

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="LitienGuard_Estudio_Mercado_MX_2026.pdf"',
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
