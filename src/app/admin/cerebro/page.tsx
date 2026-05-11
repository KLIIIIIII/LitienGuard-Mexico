import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Upload, BookOpen } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cerebro — Admin",
  robots: { index: false, follow: false },
};

type Row = {
  id: string;
  source: string;
  page: string;
  title: string;
  content: string;
  meta: Record<string, string> | null;
  is_active: boolean;
  updated_at: string;
};

function snippet(t: string, n = 110): string {
  const c = t.replace(/\s+/g, " ").trim();
  return c.length > n ? c.slice(0, n) + "…" : c;
}

export default async function CerebroAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const sourceFilter = (params.source ?? "").trim();

  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/dashboard");

  let query = supa
    .from("cerebro_chunks")
    .select("id,source,page,title,content,meta,is_active,updated_at")
    .order("updated_at", { ascending: false });

  if (sourceFilter) query = query.ilike("source", `%${sourceFilter}%`);

  const { data: rows } = await query;
  const all = (rows as Row[] | null) ?? [];

  // Client-side filter for free-text (search title or content)
  const filtered = q
    ? all.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q),
      )
    : all;

  const sources = Array.from(new Set(all.map((r) => r.source))).sort();
  const total = all.length;
  const activos = all.filter((r) => r.is_active).length;

  return (
    <main className="min-h-[calc(100vh-72px)] bg-canvas">
      <div className="lg-shell py-10 lg:py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow tone="accent">Admin · Cerebro</Eyebrow>
            <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
              Curación del corpus
            </h1>
            <p className="mt-2 max-w-prose text-body text-ink-muted">
              {total} chunks en total · {activos} activos. Edita, agrega o
              importa fragmentos de guías. Los cambios se reflejan en búsquedas
              y RAG en menos de 1 minuto.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/cerebro/importar" className="lg-cta-ghost">
              <Upload className="h-4 w-4" />
              Importar JSON
            </Link>
            <Link href="/admin/cerebro/nuevo" className="lg-cta-primary">
              <Plus className="h-4 w-4" />
              Nuevo chunk
            </Link>
          </div>
        </div>

        {/* Filters */}
        <form
          method="get"
          className="mt-10 grid gap-3 sm:grid-cols-[1fr_240px_auto]"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-quiet" />
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Buscar por título, contenido o ID…"
              className="lg-input pl-9"
              suppressHydrationWarning
            />
          </div>
          <select
            name="source"
            defaultValue={sourceFilter}
            className="lg-input appearance-none pr-10"
          >
            <option value="">Todas las fuentes</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" className="lg-cta-ghost">
            Filtrar
          </button>
        </form>

        {/* Results */}
        <div className="mt-8">
          <p className="text-caption text-ink-muted">
            Mostrando {filtered.length} de {total}
          </p>

          <div className="mt-3 space-y-2">
            {filtered.map((r) => (
              <Link
                key={r.id}
                href={`/admin/cerebro/${r.id}`}
                className={`block rounded-xl border bg-surface px-5 py-4 transition-all hover:border-line-strong hover:shadow-soft ${
                  r.is_active ? "border-line" : "border-line-soft opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-validation" />
                      <span className="text-body-sm font-semibold text-ink-strong">
                        {r.title}
                      </span>
                      {!r.is_active && (
                        <span className="rounded-full bg-rose-soft px-2 py-0.5 text-caption text-rose">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-caption text-ink-muted">
                      {r.source} · pág. {r.page} · ID <code>{r.id}</code>
                    </p>
                    <p className="mt-2 text-body-sm text-ink-muted">
                      {snippet(r.content)}
                    </p>
                  </div>
                  <span className="shrink-0 text-caption text-ink-soft">
                    {new Date(r.updated_at).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="rounded-xl border border-dashed border-line bg-surface px-5 py-12 text-center text-body-sm text-ink-soft">
                Sin resultados con esos filtros.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
