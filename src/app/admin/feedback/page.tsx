import { redirect } from "next/navigation";
import {
  Bug,
  HeartHandshake,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  CircleDollarSign,
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
  tipo: "bug" | "sugerencia" | "elogio" | "pregunta" | "precio";
  severidad: "baja" | "media" | "alta" | "critica";
  status: "nuevo" | "en_revision" | "resuelto" | "descartado";
  titulo: string | null;
  descripcion: string;
  url: string | null;
  user_agent: string | null;
  metadata: PrecioMetadata | Record<string, unknown> | null;
  created_at: string;
};

type PrecioMetadata = {
  sentimiento?: "caro" | "justo" | "barato";
  precio_justo_mxn?: number | null;
  comentario?: string | null;
  tier_actual?: string;
  precio_actual_mxn?: number | null;
  dias_desde_signup?: number | null;
  nombre?: string | null;
  especialidad?: string | null;
  hospital?: string | null;
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
  precio: CircleDollarSign,
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
      "id,user_email,tipo,severidad,status,titulo,descripcion,url,user_agent,metadata,created_at",
    )
    .order("created_at", { ascending: false });
  if (params.status) query = query.eq("status", params.status);
  if (params.tipo) query = query.eq("tipo", params.tipo);
  const { data: rows } = await query.limit(100);
  const items = (rows as Row[] | null) ?? [];

  // Separar respuestas de pricing survey (van en su propia sección)
  const allPrecio = items.filter((r) => r.tipo === "precio");
  const noPrecio = items.filter((r) => r.tipo !== "precio");

  const precioStats = {
    total: allPrecio.length,
    caro: allPrecio.filter(
      (r) => (r.metadata as PrecioMetadata | null)?.sentimiento === "caro",
    ).length,
    justo: allPrecio.filter(
      (r) => (r.metadata as PrecioMetadata | null)?.sentimiento === "justo",
    ).length,
    barato: allPrecio.filter(
      (r) =>
        (r.metadata as PrecioMetadata | null)?.sentimiento === "barato",
    ).length,
  };

  // Promedio del precio "justo" sugerido por los que respondieron
  const preciosSugeridos = allPrecio
    .map((r) => (r.metadata as PrecioMetadata | null)?.precio_justo_mxn)
    .filter((p): p is number => typeof p === "number" && p > 0);
  const precioPromedio =
    preciosSugeridos.length > 0
      ? Math.round(
          preciosSugeridos.reduce((a, b) => a + b, 0) /
            preciosSugeridos.length,
        )
      : null;

  const { data: errorRows } = await supa
    .from("client_errors")
    .select("id,user_id,message,stack,url,user_agent,created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  const errors = (errorRows as ErrorRow[] | null) ?? [];

  const stats = {
    nuevos: noPrecio.filter((r) => r.status === "nuevo").length,
    enRevision: noPrecio.filter((r) => r.status === "en_revision").length,
    resueltos: noPrecio.filter((r) => r.status === "resuelto").length,
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

        {/* Pricing survey — sección destacada */}
        {allPrecio.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-2">
              <CircleDollarSign
                className="h-4 w-4 text-validation"
                strokeWidth={2.2}
              />
              <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
                Encuestas de precio
              </h2>
              <span className="rounded-full bg-validation-soft px-2 py-0.5 text-caption font-medium text-validation">
                {allPrecio.length} respuesta
                {allPrecio.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-1 text-caption text-ink-muted">
              Respuestas del pop-up que aparece al 3er día de uso del
              piloto.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <PrecioKpi
                label="Caro"
                value={precioStats.caro}
                total={precioStats.total}
                tone="rose"
              />
              <PrecioKpi
                label="Justo"
                value={precioStats.justo}
                total={precioStats.total}
                tone="accent"
              />
              <PrecioKpi
                label="Barato"
                value={precioStats.barato}
                total={precioStats.total}
                tone="validation"
              />
              <div className="lg-card">
                <p className="text-caption text-ink-muted">
                  Precio sugerido promedio
                </p>
                <p className="mt-1 text-h2 font-semibold text-ink-strong">
                  {precioPromedio !== null ? `MXN ${precioPromedio}` : "—"}
                </p>
                <p className="mt-0.5 text-caption text-ink-soft">
                  {preciosSugeridos.length} con sugerencia
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border border-line bg-surface">
              <table className="w-full min-w-[640px] text-body-sm">
                <thead className="bg-surface-alt text-caption uppercase tracking-eyebrow text-ink-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Médico
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Plan / actual
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Sentimiento
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Pagaría
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Comentario
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Día
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allPrecio.map((r) => {
                    const m = (r.metadata as PrecioMetadata | null) ?? {};
                    return (
                      <tr key={r.id} className="border-t border-line">
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink-strong">
                            {m.nombre ?? r.user_email ?? "—"}
                          </p>
                          {m.especialidad && (
                            <p className="text-caption text-ink-muted">
                              {m.especialidad}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-caption text-ink-muted">
                          <p>{m.tier_actual ?? "—"}</p>
                          {m.precio_actual_mxn && (
                            <p className="font-mono text-ink-soft">
                              MXN {m.precio_actual_mxn}/mes
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <SentimientoBadge
                            sentimiento={m.sentimiento ?? null}
                          />
                        </td>
                        <td className="px-4 py-3 text-body-sm font-mono">
                          {m.precio_justo_mxn != null
                            ? `MXN ${m.precio_justo_mxn}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-caption text-ink-muted">
                          {m.comentario ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-caption text-ink-soft">
                          {fmtDate(r.created_at)}
                          {m.dias_desde_signup != null && (
                            <span className="ml-1 font-mono text-ink-quiet">
                              · d{m.dias_desde_signup}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

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
            <option value="precio">Encuesta de precio</option>
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

        <h2 className="mt-12 text-h2 font-semibold tracking-tight text-ink-strong">
          Reportes y sugerencias
        </h2>

        <section className="mt-4 space-y-3">
          {noPrecio.length === 0 && (
            <div className="rounded-xl border border-dashed border-line bg-surface px-5 py-8 text-center text-body-sm text-ink-soft">
              Sin reportes con esos filtros.
            </div>
          )}
          {noPrecio.map((r) => {
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

function PrecioKpi({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "rose" | "accent" | "validation";
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const valueCls =
    tone === "rose"
      ? "text-rose"
      : tone === "accent"
        ? "text-accent"
        : "text-validation";
  const barCls =
    tone === "rose"
      ? "bg-rose"
      : tone === "accent"
        ? "bg-accent"
        : "bg-validation";
  return (
    <div className="lg-card">
      <p className="text-caption text-ink-muted">{label}</p>
      <p className={`mt-1 text-h2 font-semibold ${valueCls}`}>{value}</p>
      <p className="mt-0.5 text-caption text-ink-soft">{pct}% del total</p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className={`h-full ${barCls} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SentimientoBadge({
  sentimiento,
}: {
  sentimiento: "caro" | "justo" | "barato" | null;
}) {
  if (!sentimiento) {
    return <span className="text-caption text-ink-quiet">—</span>;
  }
  const cls =
    sentimiento === "caro"
      ? "bg-rose-soft text-rose"
      : sentimiento === "barato"
        ? "bg-validation-soft text-validation"
        : "bg-accent-soft text-accent";
  const label =
    sentimiento === "caro"
      ? "Caro"
      : sentimiento === "barato"
        ? "Barato"
        : "Justo";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}
