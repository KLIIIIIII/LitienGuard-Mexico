import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ClipboardList,
  Plus,
  FileText,
  Pill,
  GitFork,
  CircleDot,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Mis consultas",
  robots: { index: false, follow: false },
};

interface SearchParams {
  status?: string;
  paciente?: string;
}

type ConsultaRow = {
  id: string;
  fecha: string;
  status: "abierta" | "cerrada" | "cancelada";
  tipo: string;
  motivo_consulta: string | null;
  paciente_nombre: string | null;
  paciente_apellido_paterno: string | null;
  paciente_apellido_materno: string | null;
  paciente_iniciales: string | null;
  paciente_id: string | null;
  cita_id: string | null;
};

export default async function ConsultasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  let query = supa
    .from("consultas")
    .select(
      "id, fecha, status, tipo, motivo_consulta, paciente_nombre, paciente_apellido_paterno, paciente_apellido_materno, paciente_iniciales, paciente_id, cita_id",
    )
    .eq("medico_id", user.id)
    .order("fecha", { ascending: false })
    .limit(100);

  if (sp.status && ["abierta", "cerrada", "cancelada"].includes(sp.status)) {
    query = query.eq("status", sp.status);
  }
  if (sp.paciente) {
    query = query.ilike("paciente_nombre", `%${sp.paciente}%`);
  }

  const { data: consultas } = await query;
  const lista = (consultas ?? []) as ConsultaRow[];

  // Counts por status (sin filtros) para los chips
  const { data: countAll } = await supa
    .from("consultas")
    .select("status", { count: "exact", head: false })
    .eq("medico_id", user.id);

  const counts = {
    total: countAll?.length ?? 0,
    abierta: countAll?.filter((c) => c.status === "abierta").length ?? 0,
    cerrada: countAll?.filter((c) => c.status === "cerrada").length ?? 0,
    cancelada: countAll?.filter((c) => c.status === "cancelada").length ?? 0,
  };

  // Para cada consulta, contar artefactos vinculados (en una sola pasada)
  const consultaIds = lista.map((c) => c.id);
  let artifactCounts: Record<
    string,
    { notas: number; recetas: number; diferenciales: number }
  > = {};

  if (consultaIds.length > 0) {
    const [{ data: notas }, { data: recetas }, { data: difs }] =
      await Promise.all([
        supa
          .from("notas_scribe")
          .select("consulta_id")
          .in("consulta_id", consultaIds),
        supa
          .from("recetas")
          .select("consulta_id")
          .in("consulta_id", consultaIds),
        supa
          .from("diferencial_sessions")
          .select("consulta_id")
          .in("consulta_id", consultaIds),
      ]);

    artifactCounts = consultaIds.reduce(
      (acc, id) => {
        acc[id] = {
          notas: notas?.filter((n) => n.consulta_id === id).length ?? 0,
          recetas: recetas?.filter((r) => r.consulta_id === id).length ?? 0,
          diferenciales:
            difs?.filter((d) => d.consulta_id === id).length ?? 0,
        };
        return acc;
      },
      {} as typeof artifactCounts,
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow tone="validation">Consultas</Eyebrow>
          <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
            Mis consultas
          </h1>
          <p className="mt-2 max-w-prose text-body text-ink-muted">
            Cada encuentro clínico con un paciente. Una consulta agrupa la
            nota SOAP, recetas y diferencial generados en esa sesión.
          </p>
        </div>
        <Link href="/dashboard/consultas/nueva" className="lg-cta-primary">
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          Nueva consulta
        </Link>
      </div>

      {/* Filtros por status */}
      <div className="mt-8 flex flex-wrap gap-2">
        <FilterChip
          href="/dashboard/consultas"
          active={!sp.status}
          label="Todas"
          count={counts.total}
        />
        <FilterChip
          href="/dashboard/consultas?status=abierta"
          active={sp.status === "abierta"}
          label="Abiertas"
          count={counts.abierta}
          tone="warn"
        />
        <FilterChip
          href="/dashboard/consultas?status=cerrada"
          active={sp.status === "cerrada"}
          label="Cerradas"
          count={counts.cerrada}
          tone="validation"
        />
        <FilterChip
          href="/dashboard/consultas?status=cancelada"
          active={sp.status === "cancelada"}
          label="Canceladas"
          count={counts.cancelada}
          tone="rose"
        />
      </div>

      <div className="mt-6 space-y-2">
        {lista.length === 0 ? (
          <EmptyState filtered={!!sp.status || !!sp.paciente} />
        ) : (
          lista.map((c) => (
            <ConsultaCard
              key={c.id}
              consulta={c}
              counts={
                artifactCounts[c.id] ?? {
                  notas: 0,
                  recetas: 0,
                  diferenciales: 0,
                }
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
  count,
  tone,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  tone?: "warn" | "validation" | "rose";
}) {
  const activeCls = active
    ? "border-ink bg-ink text-surface"
    : "border-line bg-surface text-ink-muted hover:bg-surface-alt";
  const dotCls = !active
    ? tone === "warn"
      ? "text-warn"
      : tone === "validation"
        ? "text-validation"
        : tone === "rose"
          ? "text-rose"
          : "text-ink-quiet"
    : "text-current";
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-caption font-medium transition-colors ${activeCls}`}
    >
      {tone && <CircleDot className={`h-3 w-3 ${dotCls}`} strokeWidth={2.2} />}
      {label}
      <span className="text-[0.65rem] opacity-70">{count}</span>
    </Link>
  );
}

function ConsultaCard({
  consulta,
  counts,
}: {
  consulta: ConsultaRow;
  counts: { notas: number; recetas: number; diferenciales: number };
}) {
  const fullName =
    [
      consulta.paciente_nombre,
      consulta.paciente_apellido_paterno,
      consulta.paciente_apellido_materno,
    ]
      .filter(Boolean)
      .join(" ") ||
    consulta.paciente_iniciales ||
    "Paciente sin nombre";

  const fechaStr = new Date(consulta.fecha).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const StatusBadge =
    consulta.status === "abierta"
      ? { Icon: CircleDot, cls: "text-warn bg-warn-soft", label: "Abierta" }
      : consulta.status === "cerrada"
        ? {
            Icon: CheckCircle2,
            cls: "text-validation bg-validation-soft",
            label: "Cerrada",
          }
        : {
            Icon: XCircle,
            cls: "text-rose bg-rose-soft",
            label: "Cancelada",
          };

  return (
    <Link
      href={`/dashboard/consultas/${consulta.id}`}
      className="group flex items-start gap-4 rounded-xl border border-line bg-surface px-4 py-4 transition-colors hover:border-line-strong hover:bg-surface-alt"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-validation-soft text-validation">
        <ClipboardList className="h-4 w-4" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="truncate text-body font-semibold text-ink-strong">
            {fullName}
          </h3>
          <span className="text-caption text-ink-soft">{fechaStr}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${StatusBadge.cls}`}
          >
            <StatusBadge.Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
            {StatusBadge.label}
          </span>
        </div>
        {consulta.motivo_consulta && (
          <p className="mt-1 line-clamp-1 text-caption text-ink-muted">
            {consulta.motivo_consulta}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.7rem] text-ink-soft">
          {counts.notas > 0 && (
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3 w-3" strokeWidth={2} />
              {counts.notas} {counts.notas === 1 ? "nota" : "notas"}
            </span>
          )}
          {counts.recetas > 0 && (
            <span className="inline-flex items-center gap-1">
              <Pill className="h-3 w-3" strokeWidth={2} />
              {counts.recetas}{" "}
              {counts.recetas === 1 ? "receta" : "recetas"}
            </span>
          )}
          {counts.diferenciales > 0 && (
            <span className="inline-flex items-center gap-1">
              <GitFork className="h-3 w-3" strokeWidth={2} />
              {counts.diferenciales}{" "}
              {counts.diferenciales === 1 ? "diferencial" : "diferenciales"}
            </span>
          )}
          {counts.notas + counts.recetas + counts.diferenciales === 0 && (
            <span className="italic text-ink-quiet">Sin artefactos aún</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface-alt px-6 py-12 text-center">
      <ClipboardList
        className="mx-auto h-8 w-8 text-ink-quiet"
        strokeWidth={1.6}
      />
      <h3 className="mt-3 text-body font-semibold text-ink-strong">
        {filtered ? "Sin resultados" : "Aún no tienes consultas"}
      </h3>
      <p className="mt-1 text-caption text-ink-muted">
        {filtered
          ? "Ajusta los filtros o crea una nueva consulta."
          : "Cuando inicies una consulta, aparecerá aquí. También puedes hacerlo desde un paciente del padrón o una cita confirmada."}
      </p>
      <Link
        href="/dashboard/consultas/nueva"
        className="lg-cta-primary mt-4 inline-flex"
      >
        <Plus className="h-4 w-4" strokeWidth={2.2} />
        Iniciar consulta
      </Link>
    </div>
  );
}
