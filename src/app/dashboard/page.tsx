import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Mic,
  Plus,
  Lock,
  Sparkles,
  FileText,
  ArrowRight,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { decryptField } from "@/lib/encryption";
import { Eyebrow } from "@/components/eyebrow";
import { AnunciosBanner, type AnuncioItem } from "@/components/anuncios-banner";
import { WelcomeTour } from "@/components/welcome-tour";
import { ClinicalMetric } from "@/components/clinical";
import {
  canUseScribe,
  canUseCerebro,
  scribeMonthlyLimit,
  TIER_LABELS,
  tierBadgeClass,
  type SubscriptionTier,
} from "@/lib/entitlements";

export const dynamic = "force-dynamic";

type RecentNota = {
  id: string;
  paciente_iniciales: string | null;
  paciente_nombre: string | null;
  paciente_apellido_paterno: string | null;
  paciente_edad: number | null;
  status: "borrador" | "firmada" | "descartada";
  soap_analisis: string | null;
  soap_subjetivo: string | null;
  created_at: string;
};

function snippet(text: string | null, max = 70): string {
  if (!text) return "—";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max) + "…" : clean;
}

export default async function DashboardPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("nombre, role, hospital, subscription_tier, welcome_tour_completed_at")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const scribeUnlocked = canUseScribe(tier);
  const cerebroUnlocked = canUseCerebro(tier);
  const isAdmin = profile?.role === "admin";
  const tourCompleted = Boolean(profile?.welcome_tour_completed_at);

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [
    { data: recent },
    { count: totalNotas },
    { count: firmadas },
    { count: notasMes },
    { data: anunciosRaw },
    { data: anunciosVistosRaw },
  ] = await Promise.all([
    supa
      .from("notas_scribe")
      .select(
        "id,paciente_iniciales,paciente_nombre,paciente_apellido_paterno,paciente_edad,status,soap_analisis,soap_subjetivo,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(6),
    supa.from("notas_scribe").select("*", { count: "exact", head: true }),
    supa
      .from("notas_scribe")
      .select("*", { count: "exact", head: true })
      .eq("status", "firmada"),
    supa
      .from("notas_scribe")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
    supa
      .from("anuncios")
      .select(
        "id, titulo, contenido, tipo, audiencia, link_url, link_label, publicado_at",
      )
      .order("publicado_at", { ascending: false })
      .limit(10),
    supa
      .from("anuncios_vistos")
      .select("anuncio_id, descartado_at")
      .eq("user_id", user.id),
  ]);

  const dismissedIds = new Set(
    (anunciosVistosRaw ?? [])
      .filter((v) => v.descartado_at !== null)
      .map((v) => v.anuncio_id as string),
  );
  const anuncios: AnuncioItem[] = ((anunciosRaw ?? []) as Array<
    AnuncioItem & { audiencia: string }
  >)
    .filter((a) => !dismissedIds.has(a.id))
    .filter((a) => {
      if (a.audiencia === "todos") return true;
      if (a.audiencia === "admin") return isAdmin;
      return a.audiencia === tier;
    })
    .slice(0, 3);

  const recentRows = (
    await Promise.all(
      ((recent as RecentNota[] | null) ?? []).map(async (n) => ({
        ...n,
        soap_analisis: await decryptField(n.soap_analisis),
        soap_subjetivo: await decryptField(n.soap_subjetivo),
      })),
    )
  ) as RecentNota[];
  const total = totalNotas ?? 0;
  const signed = firmadas ?? 0;
  const usedThisMonth = notasMes ?? 0;
  const limit = scribeMonthlyLimit(tier);
  const limitLabel = Number.isFinite(limit)
    ? `${usedThisMonth} / ${limit}`
    : `${usedThisMonth}`;

  const primaryCta = scribeUnlocked
    ? { href: "/dashboard/scribe", label: "Nueva nota", icon: Plus }
    : tier === "free"
      ? { href: "/precios", label: "Subir de plan", icon: Lock }
      : { href: "/dashboard/notas", label: "Nueva nota", icon: Plus };

  return (
    <div className="space-y-6">
      {anuncios.length > 0 && <AnunciosBanner anuncios={anuncios} />}

      {/* ============================================================
          Header — nombre + meta + CTA primaria
      ============================================================ */}
      <header
        data-tour="header"
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div className="min-w-0">
          <Eyebrow tone="validation">
            {isAdmin ? "Panel admin" : "Panel del médico"}
          </Eyebrow>
          <h1 className="mt-2 text-h1 font-semibold tracking-tight text-ink-strong">
            Hola{profile?.nombre ? `, ${profile.nombre.split(" ")[0]}` : ""}.
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-ink-muted">
            <span>{user.email}</span>
            {profile?.hospital && (
              <>
                <span className="text-ink-quiet">·</span>
                <span>{profile.hospital}</span>
              </>
            )}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium ${tierBadgeClass(tier)}`}
            >
              {TIER_LABELS[tier]}
            </span>
          </div>
        </div>
        <Link
          href={primaryCta.href}
          data-tour="cta-primary"
          className="lg-cta-primary shrink-0"
        >
          <primaryCta.icon className="h-4 w-4" />
          {primaryCta.label}
        </Link>
      </header>

      {/* ============================================================
          Primer empuje cuando aún no hay notas
      ============================================================ */}
      {total === 0 && scribeUnlocked && (
        <section className="overflow-hidden rounded-2xl border border-validation bg-gradient-to-br from-validation-soft/40 via-surface to-canvas">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-validation-soft px-3 py-1 text-caption text-validation">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
                Tu primer SOAP en 30 segundos
              </div>
              <h2 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
                Empieza por la nota.
              </h2>
              <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
                Graba 30 segundos de una consulta — real o de práctica — y
                obtén la nota SOAP estructurada con cita verbatim.
              </p>
              <Link
                href="/dashboard/scribe"
                className="lg-cta-primary mt-4 inline-flex items-center gap-2 group"
              >
                <Mic className="h-4 w-4" strokeWidth={2.2} />
                Grabar mi primera consulta
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2.2}
                />
              </Link>
            </div>
            <div className="hidden lg:block">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-validation text-canvas shadow-lift">
                <Mic className="h-8 w-8" strokeWidth={2} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          KPI row — F-pattern top row (NN/g)
      ============================================================ */}
      <section data-tour="kpis" className="grid gap-3 sm:grid-cols-3">
        <ClinicalMetric
          label="Notas totales"
          value={total.toLocaleString("es-MX")}
          icon={FileText}
        />
        <ClinicalMetric
          label="Firmadas"
          value={signed.toLocaleString("es-MX")}
          deltaInterpretation="good"
          caption={`${total > 0 ? Math.round((signed / total) * 100) : 0}% del total`}
        />
        <ClinicalMetric
          label="Este mes"
          value={limitLabel}
          caption={Number.isFinite(limit) ? `límite ${limit}` : "ilimitado"}
        />
      </section>

      {/* ============================================================
          Tu día — 3 quick actions (no más)
      ============================================================ */}
      <section data-tour="quick-actions">
        <Eyebrow>Tu día</Eyebrow>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <QuickAction
            icon={Mic}
            title="Nueva nota"
            description="Graba consulta · SOAP en segundos"
            href={scribeUnlocked ? "/dashboard/scribe" : "/dashboard/notas"}
            locked={!scribeUnlocked}
            primary
          />
          <QuickAction
            icon={Sparkles}
            title="Diferencial diagnóstico"
            description="Confronta tu hipótesis con el motor"
            href="/dashboard/diferencial"
            locked={!cerebroUnlocked}
          />
          <QuickAction
            icon={FileText}
            title="Mis consultas"
            description={`${total} ${total === 1 ? "nota" : "notas"}`}
            href="/dashboard/consultas"
          />
        </div>
      </section>

      {/* ============================================================
          Actividad reciente — tabla densa (F-pattern bottom row)
      ============================================================ */}
      {recentRows.length > 0 && (
        <section data-tour="recent">
          <div className="flex items-baseline justify-between">
            <Eyebrow>Actividad reciente</Eyebrow>
            <Link
              href="/dashboard/consultas"
              className="text-caption font-medium text-ink-muted hover:text-ink-strong"
            >
              Ver todas →
            </Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
            <table className="w-full text-body-sm">
              <thead className="bg-surface-alt">
                <tr>
                  <Th>Paciente</Th>
                  <Th>Status</Th>
                  <Th className="w-full">Resumen</Th>
                  <Th className="text-right">Fecha</Th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((n) => {
                  const fullName = [
                    n.paciente_nombre,
                    n.paciente_apellido_paterno,
                  ]
                    .filter((v): v is string => Boolean(v && v.trim()))
                    .join(" ");
                  const identifier =
                    fullName || n.paciente_iniciales || "Sin nombre";
                  const ctx = [
                    identifier,
                    n.paciente_edad != null ? `${n.paciente_edad}a` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <tr
                      key={n.id}
                      className="border-t border-line-soft hover:bg-surface-alt/40"
                    >
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/dashboard/notas/${n.id}`}
                          className="font-semibold text-ink-strong hover:underline"
                        >
                          {ctx || "Sin contexto"}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill status={n.status} />
                      </td>
                      <td className="px-3 py-2.5 text-ink-muted">
                        {snippet(n.soap_analisis || n.soap_subjetivo)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-caption tabular-nums text-ink-soft">
                        {new Date(n.created_at).toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ============================================================
          Tour interactivo opcional
      ============================================================ */}
      {!tourCompleted && total > 0 && (
        <WelcomeTour autoStart={false} />
      )}
      {/* Auto-start tour solo si nunca lo completó Y aún no tiene notas: la
          mejor primera experiencia incluye walkthrough antes de empezar. */}
      {!tourCompleted && total === 0 && (
        <WelcomeTour autoStart={true} />
      )}
    </div>
  );
}

/* ============================================================
   Subcomponents
   ============================================================ */

function QuickAction({
  icon: Icon,
  title,
  description,
  href,
  primary,
  locked,
}: {
  icon: typeof Mic;
  title: string;
  description: string;
  href: string;
  primary?: boolean;
  locked?: boolean;
}) {
  if (locked) {
    return (
      <div className="lg-card opacity-60">
        <div className="flex items-center gap-2 text-ink-quiet">
          <Lock className="h-4 w-4" strokeWidth={2} />
          <p className="text-body-sm font-semibold">{title}</p>
        </div>
        <p className="mt-1 text-caption text-ink-muted leading-snug">
          {description}
        </p>
        <Link
          href="/precios"
          className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-warn hover:underline"
        >
          Plan requerido →
        </Link>
      </div>
    );
  }
  const classes = primary
    ? "lg-card border-validation/60 bg-validation-soft/20 hover:border-validation hover:shadow-lift transition-all"
    : "lg-card hover:border-line-strong hover:shadow-soft transition-all";
  return (
    <Link href={href} className={classes}>
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${primary ? "text-validation" : "text-ink-strong"}`}
          strokeWidth={2.2}
        />
        <p
          className={`text-body-sm font-semibold ${primary ? "text-validation" : "text-ink-strong"}`}
        >
          {title}
        </p>
      </div>
      <p className="mt-1 text-caption text-ink-muted leading-snug">
        {description}
      </p>
    </Link>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-2 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-soft ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function StatusPill({ status }: { status: RecentNota["status"] }) {
  const map = {
    firmada: { label: "Firmada", classes: "bg-code-green-bg text-code-green" },
    borrador: { label: "Borrador", classes: "bg-warn-soft text-warn" },
    descartada: {
      label: "Descartada",
      classes: "bg-surface-alt text-ink-quiet",
    },
  } as const;
  const def = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-semibold ${def.classes}`}
    >
      {def.label}
    </span>
  );
}
