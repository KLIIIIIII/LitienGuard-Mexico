import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Plus,
  Upload,
  Search,
  AlertCircle,
  Mail,
  Phone,
  Lock,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import {
  canUsePacientes,
  TIER_LABELS,
  type SubscriptionTier,
} from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "Pacientes — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

type Paciente = {
  id: string;
  nombre: string;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  email: string | null;
  telefono: string | null;
  ultima_consulta_at: string | null;
  recall_enviado_at: string | null;
  etiquetas: string[];
  activo: boolean;
};

type FilterKey = "todos" | "3m" | "6m" | "12m" | "nunca";

const FILTER_LABELS: Record<FilterKey, string> = {
  todos: "Todos",
  "3m": "+3 meses sin consulta",
  "6m": "+6 meses sin consulta",
  "12m": "+1 año sin consulta",
  nunca: "Sin consulta registrada",
};

function fullName(p: Paciente): string {
  return [p.nombre, p.apellido_paterno, p.apellido_materno]
    .filter(Boolean)
    .join(" ");
}

function mesesDesde(iso: string | null): number | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
}

function relativoLabel(iso: string | null): string {
  const meses = mesesDesde(iso);
  if (meses === null) return "Nunca";
  if (meses < 1) return "Este mes";
  if (meses === 1) return "Hace 1 mes";
  if (meses < 12) return `Hace ${meses} meses`;
  const a = Math.floor(meses / 12);
  return a === 1 ? "Hace 1 año" : `Hace ${a} años`;
}

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const unlocked = canUsePacientes(tier);

  const sp = await searchParams;
  const filter: FilterKey = (
    ["todos", "3m", "6m", "12m", "nunca"] as FilterKey[]
  ).includes((sp.filter ?? "todos") as FilterKey)
    ? ((sp.filter ?? "todos") as FilterKey)
    : "todos";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  let pacientes: Paciente[] = [];
  let totalActivos = 0;
  let totalInactivos6m = 0;

  if (unlocked) {
    // Cargar pacientes con filtro
    let query = supa
      .from("pacientes")
      .select(
        "id, nombre, apellido_paterno, apellido_materno, email, telefono, ultima_consulta_at, recall_enviado_at, etiquetas, activo",
      )
      .eq("medico_id", user.id)
      .eq("activo", true)
      .order("apellido_paterno", { ascending: true, nullsFirst: false })
      .order("nombre", { ascending: true });

    if (filter === "nunca") {
      query = query.is("ultima_consulta_at", null);
    } else if (filter !== "todos") {
      const meses = filter === "3m" ? 3 : filter === "6m" ? 6 : 12;
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - meses);
      query = query.lt("ultima_consulta_at", cutoff.toISOString());
    }
    if (q) {
      query = query.or(
        `nombre.ilike.%${q}%,apellido_paterno.ilike.%${q}%,apellido_materno.ilike.%${q}%,email.ilike.%${q}%`,
      );
    }
    const { data } = await query.limit(200);
    pacientes = (data as Paciente[] | null) ?? [];

    // KPIs
    const [{ count: tA }, { count: t6 }] = await Promise.all([
      supa
        .from("pacientes")
        .select("*", { count: "exact", head: true })
        .eq("medico_id", user.id)
        .eq("activo", true),
      (() => {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - 6);
        return supa
          .from("pacientes")
          .select("*", { count: "exact", head: true })
          .eq("medico_id", user.id)
          .eq("activo", true)
          .lt("ultima_consulta_at", cutoff.toISOString());
      })(),
    ]);
    totalActivos = tA ?? 0;
    totalInactivos6m = t6 ?? 0;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow tone="accent">Padrón de pacientes</Eyebrow>
          <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Tus pacientes
          </h1>
          <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
            Padrón propio sincronizado con tus citas. Identifica quiénes
            llevan tiempo sin verte y mándales un recordatorio de cita de
            mantenimiento.
          </p>
        </div>
        {unlocked && (
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/pacientes/import" className="lg-cta-ghost">
              <Upload className="h-4 w-4" />
              Importar CSV
            </Link>
            <Link href="/dashboard/pacientes/nuevo" className="lg-cta-primary">
              <Plus className="h-4 w-4" />
              Nuevo paciente
            </Link>
          </div>
        )}
      </header>

      {!unlocked && (
        <div className="rounded-2xl border border-warn-soft bg-warn-soft/40 p-6">
          <div className="flex items-start gap-3">
            <Lock className="mt-1 h-5 w-5 text-warn" strokeWidth={2} />
            <div>
              <h2 className="text-h3 font-semibold text-ink-strong">
                Tu plan actual ({TIER_LABELS[tier]}) no incluye el módulo de
                pacientes
              </h2>
              <p className="mt-2 text-body-sm text-ink-muted">
                Importa tu agenda completa de pacientes, identifica quiénes
                llevan más de 6 meses sin venir y mándales un recordatorio
                personalizado. Disponible desde el plan Esencial.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/precios" className="lg-cta-primary">
                  Ver planes
                </Link>
                <Link href="/contacto" className="lg-cta-ghost">
                  Hablar con ventas
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {unlocked && (
        <>
          {/* KPIs */}
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard
              label="Activos en padrón"
              value={totalActivos.toString()}
              tone="default"
            />
            <KpiCard
              label="Sin consulta hace +6 meses"
              value={totalInactivos6m.toString()}
              tone={totalInactivos6m > 0 ? "warn" : "default"}
            />
            <KpiCard
              label="Tu plan"
              value={TIER_LABELS[tier]}
              tone="accent"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            {(["todos", "3m", "6m", "12m", "nunca"] as FilterKey[]).map(
              (key) => {
                const active = filter === key;
                const hrefParams = new URLSearchParams();
                if (key !== "todos") hrefParams.set("filter", key);
                if (q) hrefParams.set("q", q);
                const href = hrefParams.toString()
                  ? `/dashboard/pacientes?${hrefParams.toString()}`
                  : "/dashboard/pacientes";
                return (
                  <Link
                    key={key}
                    href={href}
                    className={`rounded-full px-3 py-1 text-caption font-medium transition-colors ${
                      active
                        ? "bg-validation text-canvas"
                        : "border border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink-strong"
                    }`}
                  >
                    {FILTER_LABELS[key]}
                  </Link>
                );
              },
            )}
          </div>

          {/* Búsqueda */}
          <form
            method="get"
            action="/dashboard/pacientes"
            className="flex items-center gap-2"
          >
            <input type="hidden" name="filter" value={filter} />
            <div className="relative flex-1 max-w-md">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-quiet"
                strokeWidth={2}
              />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Buscar por nombre o correo…"
                className="lg-input pl-10"
                suppressHydrationWarning
              />
            </div>
            <button type="submit" className="lg-cta-ghost">
              Buscar
            </button>
          </form>

          {/* Lista de pacientes — cards en mobile, tabla en md+ */}
          {pacientes.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface p-10 text-center">
              <AlertCircle
                className="mx-auto h-8 w-8 text-ink-quiet"
                strokeWidth={1.5}
              />
              <p className="mt-3 text-body-sm text-ink-muted">
                {filter === "todos" && !q
                  ? "Aún no tienes pacientes en el padrón. Crea uno manual o importa tu agenda en CSV."
                  : "Ningún paciente coincide con los filtros actuales."}
              </p>
              {filter === "todos" && !q && (
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/dashboard/pacientes/import"
                    className="lg-cta-primary"
                  >
                    <Upload className="h-4 w-4" />
                    Importar CSV
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: cards apiladas */}
              <div className="space-y-2.5 md:hidden">
                {pacientes.map((p) => {
                  const meses = mesesDesde(p.ultima_consulta_at);
                  const inactivo = meses !== null && meses >= 6;
                  return (
                    <Link
                      key={p.id}
                      href={`/dashboard/pacientes/${p.id}`}
                      className="block rounded-xl border border-line bg-surface px-4 py-3.5 transition-colors hover:border-line-strong"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-ink-strong">
                            {fullName(p)}
                          </p>
                          <p
                            className={`mt-0.5 text-caption ${
                              inactivo
                                ? "font-semibold text-warn"
                                : meses === null
                                  ? "text-ink-quiet"
                                  : "text-ink-muted"
                            }`}
                          >
                            {relativoLabel(p.ultima_consulta_at)}
                          </p>
                        </div>
                        {inactivo && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-[0.65rem] font-semibold text-warn">
                            <AlertCircle
                              className="h-2.5 w-2.5"
                              strokeWidth={2.4}
                            />
                            +6m
                          </span>
                        )}
                      </div>

                      {(p.email || p.telefono) && (
                        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-caption text-ink-muted">
                          {p.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" strokeWidth={2} />
                              <span className="truncate">{p.email}</span>
                            </span>
                          )}
                          {p.telefono && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" strokeWidth={2} />
                              {p.telefono}
                            </span>
                          )}
                        </div>
                      )}

                      {p.etiquetas.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.etiquetas.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.65rem] text-accent"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {p.recall_enviado_at && (
                        <p className="mt-2 border-t border-line pt-2 text-[0.65rem] text-ink-soft">
                          Recordatorio enviado{" "}
                          {relativoLabel(p.recall_enviado_at).toLowerCase()}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Desktop: tabla clásica */}
              <div className="hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
                <table className="w-full text-body-sm">
                  <thead className="bg-surface-alt text-caption uppercase tracking-eyebrow text-ink-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        Paciente
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Contacto
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Última consulta
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Recordatorio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pacientes.map((p) => {
                      const meses = mesesDesde(p.ultima_consulta_at);
                      const inactivo = meses !== null && meses >= 6;
                      return (
                        <tr
                          key={p.id}
                          className="border-t border-line hover:bg-surface-alt/40"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/dashboard/pacientes/${p.id}`}
                              className="font-medium text-ink-strong hover:text-validation"
                            >
                              {fullName(p)}
                            </Link>
                            {p.etiquetas.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {p.etiquetas.slice(0, 3).map((t) => (
                                  <span
                                    key={t}
                                    className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.65rem] text-accent"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-caption text-ink-muted">
                            {p.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3 w-3" strokeWidth={2} />
                                {p.email}
                              </div>
                            )}
                            {p.telefono && (
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <Phone className="h-3 w-3" strokeWidth={2} />
                                {p.telefono}
                              </div>
                            )}
                            {!p.email && !p.telefono && (
                              <span className="text-ink-quiet">
                                Sin contacto
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-caption ${
                                inactivo
                                  ? "font-semibold text-warn"
                                  : meses === null
                                    ? "text-ink-quiet"
                                    : "text-ink-muted"
                              }`}
                            >
                              {relativoLabel(p.ultima_consulta_at)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-caption text-ink-muted">
                            {p.recall_enviado_at
                              ? `Enviado ${relativoLabel(p.recall_enviado_at).toLowerCase()}`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "warn" | "accent";
}) {
  const valueCls =
    tone === "warn"
      ? "text-warn"
      : tone === "accent"
        ? "text-accent"
        : "text-ink-strong";
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
        {label}
      </p>
      <p className={`mt-1 text-h2 font-semibold ${valueCls}`}>{value}</p>
    </div>
  );
}
