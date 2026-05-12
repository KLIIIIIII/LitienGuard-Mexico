import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, User, Download } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { FINDINGS } from "@/lib/inference/knowledge-base";
import { OutcomePanel } from "./outcome-panel";

export const metadata: Metadata = {
  title: "Detalle del caso — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TZ = "America/Mexico_City";

const SEXO_LABEL: Record<string, string> = {
  M: "Masculino",
  F: "Femenino",
  O: "Otro",
};

interface FindingObs {
  finding: string;
  present: boolean | null;
}

interface TopDx {
  disease: string;
  label: string;
  posterior: number;
}

export default async function DiferencialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const { data: session } = await supa
    .from("diferencial_sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (!session) notFound();

  const fecha = new Date(session.created_at);
  const findingsObs = (session.findings_observed ?? []) as FindingObs[];
  const topDxs = (session.top_diagnoses ?? []) as TopDx[];

  // Group findings by category
  const findingsByCategory = new Map<string, FindingObs[]>();
  for (const obs of findingsObs) {
    if (obs.present === null) continue;
    const f = FINDINGS.find((x) => x.id === obs.finding);
    if (!f) continue;
    const cat = f.category;
    const list = findingsByCategory.get(cat) ?? [];
    list.push(obs);
    findingsByCategory.set(cat, list);
  }

  const CAT_LABELS: Record<string, string> = {
    ecg: "ECG",
    echo: "Ecocardiograma",
    lab: "Laboratorios",
    history: "Historia",
    exam: "Examen físico",
    genetic: "Genética",
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/diferencial/historial"
        className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Volver al historial
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow tone="validation">Caso clínico</Eyebrow>
          <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            {session.paciente_iniciales ?? "Paciente"}
            {session.paciente_edad ? ` · ${session.paciente_edad} a` : ""}
            {session.paciente_sexo
              ? ` · ${SEXO_LABEL[session.paciente_sexo] ?? session.paciente_sexo}`
              : ""}
          </h1>
          <p className="mt-1 text-caption text-ink-soft font-mono">
            ID {id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <a
          href={`/api/diferencial/${id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-caption font-semibold text-ink-strong hover:bg-surface-alt transition-colors shrink-0"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
          Exportar PDF
        </a>
      </header>

      <div className="lg-card space-y-2">
        <div className="flex items-center gap-2 text-caption text-ink-muted">
          <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
          {fecha.toLocaleString("es-MX", {
            timeZone: TZ,
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </div>
        {session.contexto_clinico && (
          <p className="text-body-sm text-ink-strong whitespace-pre-wrap leading-relaxed">
            {session.contexto_clinico}
          </p>
        )}
      </div>

      {/* Findings observados */}
      <section className="lg-card space-y-4">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Findings observados
        </h2>
        {findingsByCategory.size === 0 ? (
          <p className="text-caption text-ink-soft">No se marcaron findings.</p>
        ) : (
          <div className="space-y-3">
            {Array.from(findingsByCategory.entries()).map(([cat, list]) => (
              <div key={cat}>
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft mb-1.5">
                  {CAT_LABELS[cat] ?? cat}
                </p>
                <ul className="space-y-1">
                  {list.map((obs) => {
                    const f = FINDINGS.find((x) => x.id === obs.finding);
                    if (!f) return null;
                    return (
                      <li
                        key={obs.finding}
                        className="flex items-center gap-2 text-body-sm"
                      >
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[0.6rem] font-bold ${
                            obs.present
                              ? "bg-validation-soft text-validation"
                              : "bg-rose-soft text-rose"
                          }`}
                        >
                          {obs.present ? "✓ PRES" : "✗ AUS"}
                        </span>
                        <span className="text-ink-strong">{f.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top diagnoses */}
      <section className="lg-card space-y-3">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Diferencial generado
        </h2>
        <div className="space-y-2">
          {topDxs.map((dx, idx) => {
            const pct = Math.round(dx.posterior * 100);
            return (
              <div
                key={dx.disease}
                className={`rounded-lg border px-3 py-2.5 ${
                  idx === 0 ? "border-validation bg-validation-soft/30" : "border-line"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold text-ink-strong">
                      {(idx + 1).toString().padStart(2, "0")} ·{" "}
                      {dx.label}
                    </p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                      <div
                        className={`h-full rounded-full ${
                          idx === 0 ? "bg-validation" : "bg-ink-quiet"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-h3 font-bold tabular-nums ${
                      idx === 0 ? "text-validation" : "text-ink-muted"
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Doctor's decision */}
      {(session.medico_diagnostico_principal ||
        session.medico_notas ||
        session.override_razonamiento) && (
        <section className="lg-card space-y-3">
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            Tu decisión
          </h2>
          {session.medico_diagnostico_principal && (
            <div>
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                Diagnóstico principal
              </p>
              <p className="mt-0.5 text-body-sm font-semibold text-ink-strong">
                {session.medico_diagnostico_principal}
              </p>
            </div>
          )}
          {session.medico_notas && (
            <div>
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                Notas
              </p>
              <p className="mt-0.5 text-body-sm text-ink-strong whitespace-pre-wrap leading-relaxed">
                {session.medico_notas}
              </p>
            </div>
          )}
          {session.override_razonamiento && (
            <div className="rounded-lg border border-rose-soft bg-rose-soft/30 px-3 py-2">
              <p className="text-caption uppercase tracking-eyebrow text-rose font-semibold">
                Override del motor
              </p>
              <p className="mt-0.5 text-body-sm text-ink-strong whitespace-pre-wrap leading-relaxed">
                {session.override_razonamiento}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Outcome tracking */}
      <OutcomePanel
        id={id}
        initialOutcome={session.outcome_confirmado}
        outcomeAt={session.outcome_confirmado_at}
        initialNotes={session.medico_notas ?? ""}
      />

      <p className="text-caption text-ink-soft leading-relaxed max-w-3xl">
        <User className="inline h-3 w-3 mr-1" strokeWidth={2} />
        Cuando confirmas o refutas el outcome, la información alimenta el loop
        de calidad: en el futuro permitirá recalibrar likelihood ratios con
        evidencia de tu práctica acumulada.
      </p>
    </div>
  );
}
