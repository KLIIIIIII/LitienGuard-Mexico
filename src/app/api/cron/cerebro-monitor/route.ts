/**
 * Vercel Cron — monitoreo mensual de nueva evidencia clínica.
 *
 * Pollea PubMed E-utilities API con queries de seguimiento por sector
 * (cardiología HFrEF/ATTR-CM por ahora; extensible a otros). Compara
 * resultados con la última ejecución registrada en stripe_events (sí,
 * reutilizamos esa tabla como ledger de eventos de sistema, pero con
 * event_type prefijado "cerebro_monitor."). Cuando hay nuevos PubMed
 * IDs no vistos antes, manda email al admin con el resumen y link a
 * /admin/cerebro para revisión manual.
 *
 * NO ingesta automáticamente — la calidad clínica requiere review humano.
 * Este endpoint solo descubre y notifica.
 *
 * Configurado en vercel.json para correr el día 1 de cada mes a las
 * 8:00 AM CDMX (14:00 UTC).
 */

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getResend, RESEND_FROM } from "@/lib/resend-client";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const QUERIES: Array<{ tag: string; query: string; label: string }> = [
  {
    tag: "attr-cm",
    label: "Amiloidosis cardíaca por transtiretina (ATTR-CM)",
    query:
      '("transthyretin amyloid cardiomyopathy"[Title/Abstract] OR "ATTR-CM"[Title/Abstract]) AND ("2025"[PDat]:"3000"[PDat])',
  },
  {
    tag: "hfref-gdmt",
    label: "HFrEF guideline-directed medical therapy",
    query:
      '("heart failure"[Title/Abstract] AND "reduced ejection fraction"[Title/Abstract] AND ("GDMT"[Title/Abstract] OR "guideline-directed"[Title/Abstract])) AND ("2025"[PDat]:"3000"[PDat])',
  },
  {
    tag: "cardiac-ai-screening",
    label: "AI clinical decision support cardiology",
    query:
      '("artificial intelligence"[Title/Abstract] AND ("cardiac amyloidosis"[Title/Abstract] OR "heart failure"[Title/Abstract])) AND ("2025"[PDat]:"3000"[PDat])',
  },
  {
    tag: "sglt2-hf",
    label: "SGLT2 inhibitors in heart failure",
    query:
      '("SGLT2 inhibitor"[Title/Abstract] AND "heart failure"[Title/Abstract]) AND ("2025"[PDat]:"3000"[PDat])',
  },
];

interface PubMedSearchResult {
  esearchresult?: {
    idlist?: string[];
    count?: string;
  };
}

interface PubMedSummary {
  result?: Record<
    string,
    {
      uid?: string;
      title?: string;
      authors?: Array<{ name: string }>;
      pubdate?: string;
      source?: string;
    }
  >;
}

async function fetchPubMedIds(query: string): Promise<string[]> {
  const url = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("term", query);
  url.searchParams.set("retmax", "20");
  url.searchParams.set("sort", "pub+date");
  url.searchParams.set("retmode", "json");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "LitienGuard/1.0 (cerebro-monitor)" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as PubMedSearchResult;
  return data.esearchresult?.idlist ?? [];
}

async function fetchPubMedSummaries(
  ids: string[],
): Promise<Array<{ id: string; title: string; source: string; date: string }>> {
  if (ids.length === 0) return [];
  const url = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
  url.searchParams.set("db", "pubmed");
  url.searchParams.set("id", ids.join(","));
  url.searchParams.set("retmode", "json");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "LitienGuard/1.0 (cerebro-monitor)" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as PubMedSummary;

  const out: Array<{ id: string; title: string; source: string; date: string }> = [];
  for (const id of ids) {
    const r = data.result?.[id];
    if (!r) continue;
    out.push({
      id,
      title: r.title ?? "(sin título)",
      source: r.source ?? "(sin journal)",
      date: r.pubdate ?? "(sin fecha)",
    });
  }
  return out;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "cron_secret_not_configured" },
      { status: 500 },
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "no_admin" }, { status: 500 });
  }

  const allFindings: Array<{
    tag: string;
    label: string;
    newIds: Array<{ id: string; title: string; source: string; date: string }>;
    totalFound: number;
  }> = [];

  for (const q of QUERIES) {
    try {
      const ids = await fetchPubMedIds(q.query);

      // Get the set of IDs we've already seen for this tag
      const { data: seenRows } = await admin
        .from("stripe_events")
        .select("event_id")
        .eq("event_type", `cerebro_monitor.${q.tag}`)
        .limit(500);
      const seen = new Set(
        (seenRows ?? []).map((r) => r.event_id.replace(/^pmid:/, "")),
      );

      const newIds = ids.filter((id) => !seen.has(id));
      const summaries = await fetchPubMedSummaries(newIds);

      allFindings.push({
        tag: q.tag,
        label: q.label,
        newIds: summaries,
        totalFound: ids.length,
      });

      // Mark these as seen so next month doesn't re-report them
      for (const id of newIds) {
        try {
          await admin.from("stripe_events").insert({
            event_id: `pmid:${id}`,
            event_type: `cerebro_monitor.${q.tag}`,
            payload: { tag: q.tag, query: q.query, id },
            result: "discovered",
          });
        } catch {
          // ignore — likely duplicate from another race
        }
      }
    } catch (e) {
      console.error(`[cerebro-monitor] query ${q.tag} failed:`, e);
    }
  }

  const totalNew = allFindings.reduce((s, f) => s + f.newIds.length, 0);

  // Email admin if there are new findings
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? "compras@grupoprodi.net";
  const resend = getResend();
  if (resend && totalNew > 0) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      "https://litien-guard-mexico.vercel.app";

    void resend.emails
      .send({
        from: RESEND_FROM,
        to: [adminEmail],
        subject: `Cerebro · ${totalNew} publicaciones nuevas detectadas en PubMed este mes`,
        html: `
          <div style="font-family: system-ui, sans-serif; color: #1F1E1B; max-width: 600px;">
            <p style="font-size: .78rem; letter-spacing: .11em; text-transform: uppercase; color: #4A6B5B; margin: 0 0 12px 0;">LitienGuard · Cerebro monitor</p>
            <h1 style="font-size: 1.4rem; font-weight: 600; margin: 0 0 14px 0;">${totalNew} publicaciones nuevas por revisar</h1>
            <p style="font-size: .94rem; line-height: 1.6; color: #57554F;">El cron mensual detectó nueva evidencia en PubMed que aún no está en el cerebro. Revisa cada una y decide si vale ingestarla.</p>

            ${allFindings
              .filter((f) => f.newIds.length > 0)
              .map(
                (f) => `
              <div style="margin: 20px 0; padding: 14px; background: #F4F2EB; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #2C2B27;">${f.label} (${f.newIds.length} nueva${f.newIds.length === 1 ? "" : "s"})</p>
                <ul style="margin: 0; padding-left: 18px; font-size: .88rem; line-height: 1.5; color: #57554F;">
                  ${f.newIds
                    .map(
                      (paper) => `
                    <li style="margin-bottom: 6px;">
                      <strong style="color: #2C2B27;">${paper.title}</strong><br>
                      <span style="font-size: .8rem; color: #8B887F;">${paper.source} · ${paper.date} · PMID ${paper.id}</span><br>
                      <a href="https://pubmed.ncbi.nlm.nih.gov/${paper.id}/" style="font-size: .8rem; color: #4A6B5B;">Ver en PubMed</a>
                    </li>
                  `,
                    )
                    .join("")}
                </ul>
              </div>
            `,
              )
              .join("")}

            <p style="font-size: .88rem; line-height: 1.6; color: #57554F; margin-top: 20px;">
              Cuando termines la revisión, ingesta los papers seleccionados desde <a href="${siteUrl}/admin/cerebro/importar" style="color: #4A6B5B;">/admin/cerebro/importar</a>.
            </p>
          </div>
        `,
      })
      .catch((e) => console.error("[cerebro-monitor] email error:", e));
  }

  void recordAudit({
    action: "cron.cerebro_monitor",
    metadata: {
      totalNew,
      queriesRun: QUERIES.length,
      findings: allFindings.map((f) => ({
        tag: f.tag,
        newCount: f.newIds.length,
      })),
    },
  });

  return NextResponse.json({
    ok: true,
    totalNew,
    findings: allFindings,
  });
}
