import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Download, FileText, ExternalLink } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";

export const metadata: Metadata = {
  title: "Documentos para inversores — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function InversoresAdminPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="lg-shell py-12 lg:py-16 space-y-8">
      <header>
        <Eyebrow tone="validation">Investor relations</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Documentos para inversores
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          Material formal para presentación a fondos de venture capital y
          ángeles. Todo el contenido está respaldado por fuentes públicas
          verificables (INEGI, OCDE, ENSANUT, ENIGH, DOF, AMIS, CONDUSEF,
          Crunchbase, PitchBook, reportes públicos).
        </p>
      </header>

      {/* Estudio de mercado */}
      <section className="rounded-2xl border-2 border-validation bg-validation-soft/30 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-validation p-2.5 shrink-0">
            <FileText className="h-6 w-6 text-surface" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-caption uppercase tracking-eyebrow text-validation font-semibold">
              Estudio de mercado · v1.0
            </p>
            <h2 className="mt-1 text-h2 font-semibold tracking-tight text-ink-strong">
              LitienGuard AV — Estudio de mercado México 2026
            </h2>
            <p className="mt-2 text-body-sm text-ink-muted max-w-prose leading-relaxed">
              Análisis formal del mercado de salud digital en México, panorama
              competitivo, mandato regulatorio (Reforma LGS Salud Digital DOF
              2026) y oportunidad direccionable. 12 secciones, ~15 páginas,
              45+ fuentes públicas verificables hipervinculadas.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-caption text-ink-muted">
              <span>· Cobertura: México + LATAM</span>
              <span>· Horizonte: 2026-2031</span>
              <span>· Idioma: Español</span>
              <span>· Formato: A4 PDF</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="/api/admin/market-study/pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="lg-cta-primary"
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </a>
              <a
                href="https://github.com/KLIIIIIII/LitienGuard-Mexico"
                target="_blank"
                rel="noopener noreferrer"
                className="lg-cta-ghost"
              >
                <ExternalLink className="h-4 w-4" />
                Ver código fuente
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Secciones del estudio (vista previa) */}
      <section>
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong mb-4">
          Contenido del estudio
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["01", "Resumen ejecutivo"],
            ["02", "El problema — sistema sobrepasado"],
            ["03", "Mandato regulatorio Reforma LGS 2026"],
            ["04", "Tamaño del mercado direccionable"],
            ["05", "Panorama competitivo"],
            ["06", "Producto — 7 capas, 6 fases"],
            ["07", "Modelo de negocio y unit economics"],
            ["08", "Casos clínicos con ROI"],
            ["09", "Tracción actual mayo 2026"],
            ["10", "Equipo y bottlenecks"],
            ["11", "The ask — pre-seed USD 250-500K"],
            ["12", "Anexo — fuentes verificables"],
          ].map(([n, t]) => (
            <div
              key={n}
              className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5"
            >
              <span className="font-mono text-caption font-bold text-validation min-w-[1.75rem]">
                {n}
              </span>
              <p className="text-body-sm text-ink-strong">{t}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-caption text-ink-soft leading-relaxed">
        El PDF se genera en tiempo real desde el código fuente. Cualquier
        cambio en el contenido se refleja al regenerar. Versión actual:
        v1.0, generada el 12 de mayo de 2026.
      </p>
    </div>
  );
}
