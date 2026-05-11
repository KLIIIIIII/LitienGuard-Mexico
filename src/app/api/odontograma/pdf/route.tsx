import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createSupabaseServer } from "@/lib/supabase-server";
import { OdontogramPdf } from "@/lib/pdf/odontogram-pdf";
import type { OdontogramState, ToothState } from "@/components/odontogram";

const VALID_STATES: ToothState[] = [
  "sano",
  "caries",
  "restaurado",
  "endodoncia",
  "corona",
  "implante",
  "ausente",
];

function sanitizeState(raw: unknown): OdontogramState {
  if (!raw || typeof raw !== "object") return {};
  const out: OdontogramState = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = Number(k);
    if (!Number.isFinite(n) || n < 11 || n > 48) continue;
    if (typeof v === "string" && (VALID_STATES as string[]).includes(v)) {
      out[n] = v as ToothState;
    }
  }
  return out;
}

export async function GET(request: NextRequest) {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const paciente = (sp.get("paciente") ?? "").slice(0, 120);
  const fecha = (sp.get("fecha") ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
  const notas = (sp.get("notas") ?? "").slice(0, 2000);
  const medico = (sp.get("medico") ?? user.email ?? "—").slice(0, 120);

  let state: OdontogramState = {};
  try {
    const rawState = sp.get("state");
    if (rawState) state = sanitizeState(JSON.parse(rawState));
  } catch {
    state = {};
  }

  const buffer = await renderToBuffer(
    <OdontogramPdf
      paciente={paciente}
      fecha={fecha}
      medico={medico}
      notas={notas}
      state={state}
    />,
  );

  const safeName = paciente.replace(/[^\w-]/g, "_").slice(0, 40) || "paciente";
  const filename = `odontograma_${safeName}_${fecha}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
