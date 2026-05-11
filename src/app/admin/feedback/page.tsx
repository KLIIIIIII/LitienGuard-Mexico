import { redirect } from "next/navigation";
import {
  Bug,
  HeartHandshake,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { StatusSelect } from "./status-select";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Feedback — Admin",
  robots: { index: false, follow: false },
};

type Row = {
  id: string;
  user_email: string | null;
  tipo: "bug" | "sugerencia" | "elogio" | "pregunta";
  severidad: "baja" | "media" | "alta" | "critica";
  status: "nuevo" | "en_revision" | "resuelto" | "descartado";
  titulo: string | null;
  descripcion: string;
  url: string | null;
  user_agent: string | null;
  created_at: string;
};

type ErrorRow = {
  id: string;
  user_id: string | null;
  message: string;
  stack: string | null;
  url: string | null;
  user_agent: string | null;
  created_at: string;
};

const TIPO_ICON = {
  bug: Bug,
  sugerencia: Lightbulb,
  elogio: HeartHandshake,
  pregunta: HelpCircle,
} as const;

const SEV_CLASS = {
  baja: "bg-surface-alt text-ink-muted",
  media: "bg-warn-soft text-warn",
  alta: "bg-rose-soft text-rose",
  critica: "bg-rose text-surface",
} as const;

const STATUS_CLASS = {
  nuevo: "bg-warn-soft text-warn",
  en_revision: "bg-accent-soft text-accent",
  resuelto: "bg-validation-soft text-validation",
  descartado: "bg-surface-alt text-ink-muted",
} as const;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tipo?: string }>;
}) {
  const params = await searchParams;
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
    .from("feedback")
    .select(
      "id,user_email,tipo,severidad,status,titulo,descripcion,url,user_agent,created_at",
    )
    .order("created_at", { ascending: false });
  if (params.status) query = query.eq("status", params.status);
  if (params.tipo) query = query.eq("tipo", params.tipo);
  const { data: rows } = await query.limit(100);
  const items = (rows as Row[] | null) ?? [];

  const { data: errorRows } = await supa
    .from("client_errors")
    .select("id,user_id,message,stack,url,user_agent,created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  const errors = (errorRows as ErrorRow[] | null) ?? [];

  const stats = {
    nuevos: items.filter((r) => r.status === "nuevo").length,
    enRevision: items.filter((r) => r.status === "en_revision").length,
    resueltos: items.filter((r) => r.status === "resuelto").length,
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-canvas">
      <div className="lg-shell py-10 lg:py-14">
        <Eyebrow tone="accent">Admin · Feedback</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
          Centro de feedback y errores
        </h1>
        <p className="mt-2 max-w-prose text-body text-ink-muted">
          Reportes de médicos y errores JS capturados automáticamente.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="lg-card">
            <p className="text-caption text-ink-muted">Nuevos</p>
            <p className="mt-1 text-h1 font-semibold text-warn">
              {stats.nuevos}
            </p>
          </div>
          <div className="lg-card">
            <p className="text-caption text-ink-muted">En revisión</p>
            <p className="mt-1 text-h1 font-semibold text-accent">
              {stats.enRevision}
            </p>
          </div>
          <div className="lg-card">
            <p className="text-caption text-ink-muted">Resueltos</p>
            <p className="mt-1 text-h1 font-semibold text-validation">
              {stats.resueltos}
            </p>
          </div>
        </section>

        {/* Filters */}
        <form method="get" className="mt-8 flex flex-wrap gap-3">
          <select
            name="tipo"
            defaultValue={params.tipo ?? ""}
            className="lg-input max-w-[200px] appearance-none pr-10"
          >
            <option value="">Todos los tipos</option>
            <option value="bug">Bug</option>
            <option value="sugerencia">Sugerencia</option>
            <option value="elogio">Elogio</option>
            <option value="pregunta">Pregunta</option>
          </select>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="lg-input max-w-[200px] appearance-none pr-10"
          >
            <option value="">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="en_revision">En revisión</option>
            <option value="resuelto">Resuelto</option>
            <option value="descartado">Descartado</option>
          </select>
          <button type="submit" className="lg-cta-ghost">
            Filtrar
          </button>
        </form>

        <section className="mt-6 space-y-3">
          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-line bg-surface px-5 py-8 text-center text-body-sm text-ink-soft">
              Sin reportes con esos filtros.
            </div>
          )}
          {items.map((r) => {
            const Icon = TIPO_ICON[r.tipo];
            return (
              <article
                key={r.id}
                className="rounded-xl border border-line bg-surface px-5 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-ink-muted" />
                      <span className="text-caption uppercase tracking-eyebrow text-ink-soft">
                        {r.tipo}
                      </span>
                      {r.tipo === "bug" && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-caption font-medium ${SEV_CLASS[r.severidad]}`}
                        >
                          {r.severidad}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-caption font-medium ${STATUS_CLASS[r.status]}`}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                    </div>
                    {r.titulo && (
                      <h3 className="mt-1.5 text-body-sm font-semibold text-ink-strong">
                        {r.titulo}
                      </h3>
                    )}
                    <p className="mt-1.5 whitespace-pre-wrap text-body-sm text-ink-strong">
                      {r.descripcion}
                    </p>
                    <p className="mt-2 text-caption text-ink-soft">
                      {r.user_email ?? "anónimo"} · {fmtDate(r.created_at)}
                      {r.url ? ` · ${new URL(r.url).pathname}` : ""}
                    </p>
                  </div>
                  <StatusSelect id={r.id} current={r.status} />
                </div>
              </article>
            );
          })}
        </section>

        {errors.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warn" />
              <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
                Errores JS capturados ({errors.length})
              </h2>
            </div>
            <p className="mt-1 text-caption text-ink-muted">
              Capturados automáticamente desde el navegador del médico.
            </p>
            <div className="mt-4 space-y-2">
              {errors.map((e) => (
                <details
                  key={e.id}
                  className="rounded-lg border border-line bg-surface px-4 py-3 text-body-sm"
                >
                  <summary className="cursor-pointer">
                    <span className="text-ink-strong font-medium">
                      {e.message}
                    </span>
                    <span className="ml-2 text-caption text-ink-soft">
                      {fmtDate(e.created_at)}
                      {e.url ? ` · ${new URL(e.url).pathname}` : ""}
                    </span>
                  </summary>
                  {e.stack && (
                    <pre className="mt-2 max-h-64 overflow-auto rounded bg-surface-alt p-3 text-caption text-ink-muted">
                      {e.stack}
                    </pre>
                  )}
                  {e.user_agent && (
                    <p className="mt-2 text-caption text-ink-soft">
                      {e.user_agent}
                    </p>
                  )}
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
