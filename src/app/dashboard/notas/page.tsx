import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { NoteStatusBadge } from "@/components/note-status-badge";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mis notas",
  robots: { index: false, follow: false },
};

type NotaRow = {
  id: string;
  paciente_iniciales: string | null;
  paciente_edad: number | null;
  paciente_sexo: string | null;
  status: "borrador" | "firmada" | "descartada";
  soap_subjetivo: string | null;
  soap_analisis: string | null;
  created_at: string;
};

function snippet(text: string | null, max = 140): string {
  if (!text) return "—";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function NotasPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: notas } = await supa
    .from("notas_scribe")
    .select(
      "id,paciente_iniciales,paciente_edad,paciente_sexo,status,soap_subjetivo,soap_analisis,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (notas as NotaRow[] | null) ?? [];

  return (
    <div>
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow tone="validation">Notas</Eyebrow>
            <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
              Mis notas SOAP
            </h1>
            <p className="mt-2 max-w-prose text-body text-ink-muted">
              {rows.length === 0
                ? "Aún no tienes notas. Crea la primera."
                : `${rows.length} ${rows.length === 1 ? "nota" : "notas"} en total.`}
            </p>
          </div>
          <Link href="/dashboard/scribe" className="lg-cta-primary">
            <Plus className="h-4 w-4" />
            Nueva nota
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="mt-12 rounded-xl border border-line bg-surface px-6 py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-ink-quiet" />
            <h2 className="mt-4 text-h2 font-semibold tracking-tight text-ink-strong">
              Crea tu primera nota
            </h2>
            <p className="mt-2 text-body-sm text-ink-muted">
              Sube o graba el audio de una consulta y obtén una nota SOAP
              estructurada en segundos.
            </p>
            <Link href="/dashboard/scribe" className="lg-cta-primary mt-5">
              Empezar
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {rows.map((n) => {
              const ctx = [
                n.paciente_iniciales,
                n.paciente_edad != null ? `${n.paciente_edad}a` : null,
                n.paciente_sexo,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Link
                  key={n.id}
                  href={`/dashboard/notas/${n.id}`}
                  className="block rounded-xl border border-line bg-surface px-5 py-4 transition-all hover:border-line-strong hover:shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-body-sm font-semibold text-ink-strong">
                          {ctx || "Sin contexto"}
                        </span>
                        <NoteStatusBadge status={n.status} />
                      </div>
                      <p className="mt-1.5 text-body-sm text-ink-muted">
                        {snippet(n.soap_analisis || n.soap_subjetivo)}
                      </p>
                    </div>
                    <span className="shrink-0 text-caption text-ink-soft">
                      {formatDate(n.created_at)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
