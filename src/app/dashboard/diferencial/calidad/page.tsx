import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Target,
  GitFork,
  FileText,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { FINDINGS } from "@/lib/inference/knowledge-base";

export const metadata: Metadata = {
  title: "Mi calidad — Diferencial",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface SesionRow {
  id: string;
  findings_observed: Array<{ finding: string; present: boolean | null }> | null;
  top_diagnoses: Array<{ disease: string; label: string; posterior: number }> | null;
  medico_diagnostico_principal: string | null;
  override_razonamiento: string | null;
  outcome_confirmado: string | null;
}

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export default async function CalidadPage() {
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
  if (!canUseCerebro(tier)) redirect("/dashboard/diferencial");

  const { data: sesiones } = await supa
    .from("diferencial_sessions")
    .select(
      "id, findings_observed, top_diagnoses, medico_diagnostico_principal, override_razonamiento, outcome_confirmado",
    )
    .eq("medico_id", user.id)
    .limit(2000);

  const rows = (sesiones ?? []) as SesionRow[];
  const total = rows.length;

  // -------- Outcome distribution --------
  const outcomeCount = {
    pendiente: 0,
    confirmado: 0,
    parcial: 0,
    refutado: 0,
  };
  for (const r of rows) {
    const o = (r.outcome_confirmado ?? "pendiente") as keyof typeof outcomeCount;
    outcomeCount[o] = (outcomeCount[o] ?? 0) + 1;
  }
  const conOutcome =
    outcomeCount.confirmado + outcomeCount.refutado + outcomeCount.parcial;

  // -------- Override rate --------
  const conOverride = rows.filter(
    (r) => (r.override_razonamiento ?? "").trim().length > 0,
  ).length;

  // -------- Concordancia médico ↔ top-1 motor --------
  function topLabel(r: SesionRow): string | null {
    return r.top_diagnoses?.[0]?.label ?? null;
  }
  const conDx = rows.filter(
    (r) => (r.medico_diagnostico_principal ?? "").trim().length > 0,
  );
  const concordantes = conDx.filter((r) => {
    const tl = topLabel(r);
    const dx = (r.medico_diagnostico_principal ?? "").toLowerCase();
    if (!tl) return false;
    const tlShort = tl.toLowerCase().slice(0, 6);
    return dx.includes(tlShort);
  }).length;

  // -------- PPV por enfermedad (top-1 motor → confirmado real) --------
  const ppvByDisease = new Map<
    string,
    { label: string; total: number; confirmados: number }
  >();
  for (const r of rows) {
    const top = r.top_diagnoses?.[0];
    if (!top) continue;
    const entry = ppvByDisease.get(top.disease) ?? {
      label: top.label,
      total: 0,
      confirmados: 0,
    };
    entry.total += 1;
    if (r.outcome_confirmado === "confirmado") entry.confirmados += 1;
    ppvByDisease.set(top.disease, entry);
  }
  const ppvRanked = Array.from(ppvByDisease.entries())
    .filter(([, v]) => v.total >= 2)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 6);

  // -------- Findings más usados --------
  const findingCount = new Map<string, number>();
  for (const r of rows) {
    const obs = r.findings_observed ?? [];
    for (const o of obs) {
      if (o.present === null) continue;
      findingCount.set(o.finding, (findingCount.get(o.finding) ?? 0) + 1);
    }
  }
  const topFindings = Array.from(findingCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/diferencial"
        className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Volver al diferencial
      </Link>

      <header>
        <Eyebrow tone="validation">Mi calidad</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Calibración personal de tu práctica
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
          Métricas calculadas sobre tus {total} caso{total !== 1 && "s"}{" "}
          guardados. Solo los casos con outcome confirmado/refutado/parcial
          alimentan los cálculos de PPV.
        </p>
      </header>

      {total === 0 ? (
        <div className="lg-card text-center py-12">
          <FileText
            className="mx-auto h-8 w-8 text-ink-quiet mb-3"
            strokeWidth={1.5}
          />
          <p className="text-body-sm font-semibold text-ink-strong mb-1">
            Aún no tienes casos guardados
          </p>
          <p className="text-caption text-ink-muted">
            Guarda al menos 3-5 diferenciales con outcome para empezar a ver
            calibración personal.
          </p>
          <Link
            href="/dashboard/diferencial"
            className="lg-cta-primary mt-5 inline-flex"
          >
            Crear primer caso
          </Link>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              icon={FileText}
              iconClass="text-validation"
              label="Casos totales"
              value={String(total)}
              detail={`${conOutcome} con outcome`}
            />
            <Kpi
              icon={Target}
              iconClass="text-validation"
              label="Concordancia con motor"
              value={`${pct(concordantes, conDx.length)}%`}
              detail={`${concordantes}/${conDx.length} dx coinciden con top-1`}
            />
            <Kpi
              icon={GitFork}
              iconClass="text-warn"
              label="Override rate"
              value={`${pct(conOverride, conDx.length)}%`}
              detail={`${conOverride} casos donde te apartaste`}
            />
            <Kpi
              icon={TrendingUp}
              iconClass="text-validation"
              label="PPV global motor"
              value={`${pct(outcomeCount.confirmado, conOutcome)}%`}
              detail={`top-1 confirmado ${outcomeCount.confirmado}/${conOutcome}`}
            />
          </div>

          {/* Outcome distribution */}
          <section className="lg-card">
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong mb-4">
              Distribución de outcomes
            </h2>
            <div className="space-y-2.5">
              <OutcomeRow
                icon={CheckCircle2}
                iconClass="text-validation"
                label="Confirmado"
                count={outcomeCount.confirmado}
                total={total}
                barClass="bg-validation"
              />
              <OutcomeRow
                icon={AlertTriangle}
                iconClass="text-warn"
                label="Parcial"
                count={outcomeCount.parcial}
                total={total}
                barClass="bg-warn"
              />
              <OutcomeRow
                icon={AlertCircle}
                iconClass="text-rose"
                label="Refutado"
                count={outcomeCount.refutado}
                total={total}
                barClass="bg-rose"
              />
              <OutcomeRow
                icon={Clock}
                iconClass="text-ink-quiet"
                label="Pendiente"
                count={outcomeCount.pendiente}
                total={total}
                barClass="bg-ink-quiet"
              />
            </div>
          </section>

          {/* PPV por enfermedad */}
          {ppvRanked.length > 0 && (
            <section className="lg-card">
              <h2 className="text-h3 font-semibold tracking-tight text-ink-strong mb-1">
                PPV personal por enfermedad
              </h2>
              <p className="mb-4 text-caption text-ink-muted">
                Cuando el motor te puso a esta enfermedad como top-1, ¿qué
                tan seguido se confirmó? Mostramos solo las con ≥2 casos.
              </p>
              <div className="space-y-2">
                {ppvRanked.map(([disease, v]) => {
                  const ppvPct = pct(v.confirmados, v.total);
                  return (
                    <div
                      key={disease}
                      className="rounded-lg border border-line bg-surface px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-body-sm font-medium text-ink-strong flex-1 min-w-0 truncate">
                          {v.label}
                        </p>
                        <span className="text-caption text-ink-soft tabular-nums shrink-0">
                          {v.confirmados}/{v.total}
                        </span>
                        <span className="text-h3 font-bold tabular-nums text-validation min-w-[3rem] text-right">
                          {ppvPct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                        <div
                          className="h-full rounded-full bg-validation transition-all"
                          style={{ width: `${ppvPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Findings más usados */}
          {topFindings.length > 0 && (
            <section className="lg-card">
              <h2 className="text-h3 font-semibold tracking-tight text-ink-strong mb-1">
                Findings que más evalúas
              </h2>
              <p className="mb-4 text-caption text-ink-muted">
                Distribución de los findings que marcas (presente o ausente)
                en tus casos.
              </p>
              <div className="space-y-1.5">
                {topFindings.map(([fid, count]) => {
                  const f = FINDINGS.find((x) => x.id === fid);
                  const label = f?.label ?? fid;
                  const maxCount = topFindings[0]?.[1] ?? 1;
                  const widthPct = Math.round((count / maxCount) * 100);
                  return (
                    <div
                      key={fid}
                      className="flex items-center gap-3 text-body-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-ink-strong truncate">{label}</p>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-alt">
                          <div
                            className="h-full rounded-full bg-validation/70"
                            style={{ width: `${widthPct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-caption text-ink-muted tabular-nums shrink-0 min-w-[2.5rem] text-right">
                        {count}×
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <p className="text-caption text-ink-soft leading-relaxed">
            Cuando alcances 30+ casos con outcome confirmado, estos números
            empezarán a tener significado estadístico real. Mientras tanto,
            úsalos como termómetro cualitativo.
          </p>
        </>
      )}
    </div>
  );
}

function Kpi({
  icon: Icon,
  iconClass,
  label,
  value,
  detail,
}: {
  icon: typeof FileText;
  iconClass: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="lg-card">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconClass}`} strokeWidth={2} />
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
          {label}
        </p>
      </div>
      <p className="mt-2 text-h2 font-bold tabular-nums text-ink-strong">
        {value}
      </p>
      <p className="text-caption text-ink-muted">{detail}</p>
    </div>
  );
}

function OutcomeRow({
  icon: Icon,
  iconClass,
  label,
  count,
  total,
  barClass,
}: {
  icon: typeof CheckCircle2;
  iconClass: string;
  label: string;
  count: number;
  total: number;
  barClass: string;
}) {
  const widthPct = pct(count, total);
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className={`h-3.5 w-3.5 ${iconClass}`} strokeWidth={2.2} />
        <p className="text-body-sm font-medium text-ink-strong flex-1">
          {label}
        </p>
        <span className="text-caption text-ink-muted tabular-nums">
          {count} ({widthPct}%)
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
        <div
          className={`h-full rounded-full ${barClass} transition-all`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}
