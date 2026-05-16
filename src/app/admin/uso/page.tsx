import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  Users,
  Sparkles,
  Brain,
  TrendingUp,
  Clock,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { Eyebrow } from "@/components/eyebrow";

export const metadata: Metadata = {
  title: "Uso de la plataforma — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TZ = "America/Mexico_City";

interface AuditRow {
  action: string;
  user_id: string | null;
  created_at: string;
}

interface QueryAuditRow {
  user_id: string;
  action: string;
  latency_ms: number | null;
  created_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  subscription_tier: string | null;
}

export default async function UsoPage() {
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

  const admin = getSupabaseAdmin();
  if (!admin) {
    return (
      <div className="lg-card">
        <p className="text-body-sm text-rose">
          Supabase admin client no disponible. Verifica SUPABASE_SERVICE_ROLE_KEY.
        </p>
      </div>
    );
  }

  const now = Date.now();
  const since7d = new Date(now - 7 * 24 * 3600 * 1000).toISOString();
  const since30d = new Date(now - 30 * 24 * 3600 * 1000).toISOString();

  const [
    { data: audit7d },
    { data: audit30d },
    { data: queryAudit7d },
    { data: profilesList },
    { count: totalProfiles },
    { count: totalDiferencialSessions },
    { count: totalNotasScribe },
    { count: totalPacientes },
    { count: feedbackCount },
  ] = await Promise.all([
    admin
      .from("audit_log")
      .select("action, user_id, created_at")
      .gte("created_at", since7d)
      .limit(5000),
    admin
      .from("audit_log")
      .select("action, user_id, created_at")
      .gte("created_at", since30d)
      .limit(20000),
    admin
      .from("query_audit")
      .select("user_id, action, latency_ms, created_at")
      .gte("created_at", since7d)
      .limit(5000),
    admin
      .from("profiles")
      .select("id, full_name, email, subscription_tier")
      .limit(500),
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("diferencial_sessions")
      .select("*", { count: "exact", head: true }),
    admin.from("notas_scribe").select("*", { count: "exact", head: true }),
    admin.from("pacientes").select("*", { count: "exact", head: true }),
    admin.from("feedback").select("*", { count: "exact", head: true }),
  ]);

  const audits7d = (audit7d ?? []) as AuditRow[];
  const audits30d = (audit30d ?? []) as AuditRow[];
  const queries7d = (queryAudit7d ?? []) as QueryAuditRow[];
  const profilesMap = new Map<string, ProfileRow>(
    ((profilesList ?? []) as ProfileRow[]).map((p) => [p.id, p]),
  );

  // Active users
  const activos7d = new Set(audits7d.map((a) => a.user_id).filter(Boolean))
    .size;
  const activos30d = new Set(audits30d.map((a) => a.user_id).filter(Boolean))
    .size;

  // Top actions
  const actionCounts = new Map<string, number>();
  for (const a of audits7d) {
    actionCounts.set(a.action, (actionCounts.get(a.action) ?? 0) + 1);
  }
  const topActions = Array.from(actionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  // Top users
  const userCounts = new Map<string, number>();
  for (const a of audits7d) {
    if (!a.user_id) continue;
    userCounts.set(a.user_id, (userCounts.get(a.user_id) ?? 0) + 1);
  }
  const topUsers = Array.from(userCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Cerebro/diferencial latencies
  const latenciasDiferencial = queries7d
    .filter((q) => q.action === "diferencial.procesar" && q.latency_ms)
    .map((q) => q.latency_ms as number);
  const latenciasCerebro = queries7d
    .filter(
      (q) =>
        (q.action === "cerebro.buscar" ||
          q.action === "cerebro.analizar_nota") &&
        q.latency_ms,
    )
    .map((q) => q.latency_ms as number);

  function avg(arr: number[]): number {
    if (arr.length === 0) return 0;
    return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Volver al dashboard
      </Link>

      <header>
        <Eyebrow tone="validation">Admin · Uso de la plataforma</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Qué están haciendo los doctores activos
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
          Métricas reales desde audit_log, query_audit y conteos en
          producción. Datos cargados al instante — refresca para actualizar.
        </p>
      </header>

      {/* KPIs principales */}
      <section>
        <Eyebrow>Volumen total en plataforma</Eyebrow>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Kpi
            icon={Users}
            label="Doctores registrados"
            value={totalProfiles ?? 0}
            detail={`${activos7d} activos últimos 7d`}
          />
          <Kpi
            icon={Brain}
            label="Casos diferencial"
            value={totalDiferencialSessions ?? 0}
            detail="Total acumulado"
          />
          <Kpi
            icon={Sparkles}
            label="Notas scribe"
            value={totalNotasScribe ?? 0}
            detail="Total acumulado"
          />
          <Kpi
            icon={Activity}
            label="Pacientes"
            value={totalPacientes ?? 0}
            detail="En padrón"
          />
          <Kpi
            icon={TrendingUp}
            label="Feedback enviado"
            value={feedbackCount ?? 0}
            detail="Bugs / sugerencias"
          />
        </div>
      </section>

      {/* Actividad reciente */}
      <section>
        <Eyebrow>Actividad — últimos 7 días</Eyebrow>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            icon={Users}
            label="Activos 7d"
            value={activos7d}
            detail="Doctores únicos con acción"
          />
          <Kpi
            icon={Users}
            label="Activos 30d"
            value={activos30d}
            detail="Doctores únicos con acción"
          />
          <Kpi
            icon={Clock}
            label="Latencia diferencial"
            value={avg(latenciasDiferencial)}
            detail={`ms promedio · n=${latenciasDiferencial.length}`}
          />
          <Kpi
            icon={Clock}
            label="Latencia cerebro"
            value={avg(latenciasCerebro)}
            detail={`ms promedio · n=${latenciasCerebro.length}`}
          />
        </div>
      </section>

      {/* Top actions */}
      <section className="lg-card">
        <header className="mb-4">
          <Eyebrow>Top features usadas — últimos 7 días</Eyebrow>
          <h2 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
            Acciones más registradas
          </h2>
        </header>
        {topActions.length === 0 ? (
          <p className="text-body-sm text-ink-muted">Sin actividad reciente.</p>
        ) : (
          <ul className="space-y-2">
            {topActions.map(([action, count]) => {
              const max = topActions[0]?.[1] ?? 1;
              const widthPct = Math.round((count / max) * 100);
              return (
                <li key={action}>
                  <div className="flex items-baseline justify-between gap-3 text-body-sm">
                    <span className="font-mono text-caption text-ink-strong truncate flex-1 min-w-0">
                      {action}
                    </span>
                    <span className="text-caption text-ink-muted tabular-nums shrink-0">
                      {count}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                    <div
                      className="h-full rounded-full bg-validation"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Top doctores */}
      <section className="lg-card">
        <header className="mb-4">
          <Eyebrow>Doctores más activos — últimos 7 días</Eyebrow>
          <h2 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
            Ranking por número de acciones
          </h2>
        </header>
        {topUsers.length === 0 ? (
          <p className="text-body-sm text-ink-muted">
            Sin doctores activos en últimos 7 días.
          </p>
        ) : (
          <ul className="space-y-2">
            {topUsers.map(([userId, count], idx) => {
              const profile = profilesMap.get(userId);
              const max = topUsers[0]?.[1] ?? 1;
              const widthPct = Math.round((count / max) * 100);
              return (
                <li
                  key={userId}
                  className="rounded-lg border border-line bg-surface px-3 py-2"
                >
                  <div className="flex items-baseline justify-between gap-3 text-body-sm">
                    <span className="font-semibold text-ink-strong truncate flex-1 min-w-0">
                      <span className="text-ink-quiet tabular-nums mr-1.5">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      {profile?.full_name ?? profile?.email ?? userId.slice(0, 8)}
                      {profile?.subscription_tier && (
                        <span className="ml-2 text-caption font-normal text-ink-muted">
                          · {profile.subscription_tier}
                        </span>
                      )}
                    </span>
                    <span className="text-caption text-ink-muted tabular-nums shrink-0">
                      {count} acciones
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                    <div
                      className="h-full rounded-full bg-validation"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-caption text-ink-soft">
        Cifras a partir de audit_log (eventos discretos) y query_audit (uso
        del motor de IA). Generadas{" "}
        {new Date().toLocaleString("es-MX", {
          timeZone: TZ,
          dateStyle: "medium",
          timeStyle: "short",
        })}
        .
      </p>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="lg-card">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-validation" strokeWidth={2} />
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
          {label}
        </p>
      </div>
      <p className="mt-2 text-h2 font-bold tabular-nums text-ink-strong">
        {value.toLocaleString("es-MX")}
      </p>
      <p className="text-caption text-ink-muted">{detail}</p>
    </div>
  );
}
