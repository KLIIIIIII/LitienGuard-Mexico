import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Mic,
  BookOpen,
  ShieldCheck,
  Plus,
  Lock,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Brain,
  Upload,
  Network,
  Settings,
  CreditCard,
  Users,
  BarChart3,
  MessageCircle,
  Megaphone,
  FlaskConical,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { decryptField } from "@/lib/encryption";
import { Eyebrow } from "@/components/eyebrow";
import { NoteStatusBadge } from "@/components/note-status-badge";
import { AnunciosBanner, type AnuncioItem } from "@/components/anuncios-banner";
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

function snippet(text: string | null, max = 80): string {
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
    .select("nombre, role, hospital, subscription_tier")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const scribeUnlocked = canUseScribe(tier);
  const cerebroUnlocked = canUseCerebro(tier);
  const isAdmin = profile?.role === "admin";

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
      .limit(5),
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
  const usagePct =
    Number.isFinite(limit) && limit > 0
      ? Math.min(100, Math.round((usedThisMonth / limit) * 100))
      : 0;

  // CTA primario depende del tier y estado del usuario
  const primaryCta = scribeUnlocked
    ? { href: "/dashboard/scribe", label: "Nueva nota", icon: Plus }
    : tier === "free"
      ? { href: "/precios", label: "Subir de plan", icon: Lock }
      : { href: "/dashboard/notas", label: "Nueva nota", icon: Plus };

  return (
    <div className="space-y-8">
      {anuncios.length > 0 && <AnunciosBanner anuncios={anuncios} />}

      {/* ============================================================
          Header
      ============================================================ */}
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <Eyebrow tone="validation">
            {isAdmin ? "Panel admin" : "Panel del médico"}
          </Eyebrow>
          <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Hola{profile?.nombre ? `, ${profile.nombre.split(" ")[0]}` : ""}.
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-body-sm text-ink-muted">
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
        <Link href={primaryCta.href} className="lg-cta-primary shrink-0">
          <primaryCta.icon className="h-4 w-4" />
          {primaryCta.label}
        </Link>
      </header>

      {/* ============================================================
          First-time push — solo si nunca ha hecho nota y tiene scribe
      ============================================================ */}
      {total === 0 && scribeUnlocked && (
        <section className="overflow-hidden rounded-2xl border border-validation bg-gradient-to-br from-validation-soft via-surface to-canvas">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-validation-soft px-3 py-1 text-caption text-validation">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
                Tu primer SOAP en 30 segundos
              </div>
              <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
                Empieza por la nota.
              </h2>
              <p className="mt-3 max-w-prose text-body text-ink-muted">
                Graba 30 segundos de una consulta — real o de práctica — y
                obtén la nota SOAP estructurada con cita verbatim. El resto
                del cerebro se desbloquea cuando ya entendiste el flujo.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link href="/dashboard/scribe" className="lg-cta-primary group">
                  <Mic className="h-4 w-4" strokeWidth={2.2} />
                  Grabar mi primera consulta
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    strokeWidth={2.2}
                  />
                </Link>
                <span className="inline-flex items-center gap-1.5 text-caption text-ink-soft">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Transcribe + estructura en ~13 segundos
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-validation text-canvas shadow-lift">
                <Mic className="h-10 w-10" strokeWidth={2} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          Stats compactos — barra horizontal con dividers
      ============================================================ */}
      <section className="grid grid-cols-3 divide-x divide-line rounded-xl border border-line bg-surface">
        <StatInline label="Notas totales" value={total.toLocaleString("es-MX")} />
        <StatInline
          label="Firmadas"
          value={signed.toLocaleString("es-MX")}
          tone="validation"
        />
        <StatInline
          label="Este mes"
          value={
            Number.isFinite(limit)
              ? `${usedThisMonth} / ${limit}`
              : `${usedThisMonth}`
          }
          progressPct={Number.isFinite(limit) && limit > 0 ? usagePct : null}
        />
      </section>

      {/* ============================================================
          SECCIÓN 1 — Tu día (quick actions)
      ============================================================ */}
      <section>
        <Eyebrow>Tu día</Eyebrow>
        <h2 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
          ¿Qué necesitas ahora?
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            icon={Mic}
            title="Nueva nota"
            description="Graba consulta · SOAP en segundos"
            href={scribeUnlocked ? "/dashboard/scribe" : "/dashboard/notas"}
            primary={scribeUnlocked}
            locked={!scribeUnlocked}
          />
          <QuickAction
            icon={Sparkles}
            title="Pegar nota clínica"
            description="Analiza una nota de otro sistema"
            href="/dashboard/cerebro/analizar"
            locked={!cerebroUnlocked}
          />
          <QuickAction
            icon={Brain}
            title="Diferencial diagnóstico"
            description="Confronta tu hipótesis con el motor"
            href="/dashboard/diferencial"
            locked={!cerebroUnlocked}
          />
          <QuickAction
            icon={FileText}
            title="Mis notas"
            description={`${total} ${total === 1 ? "nota" : "notas"} · historial completo`}
            href="/dashboard/notas"
          />
        </div>
      </section>

      {/* ============================================================
          SECCIÓN 2 — Últimas notas (subió de posición)
      ============================================================ */}
      {recentRows.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <Eyebrow>Actividad reciente</Eyebrow>
            <Link
              href="/dashboard/notas"
              className="text-caption font-medium text-ink-muted hover:text-ink-strong"
            >
              Ver todas →
            </Link>
          </div>
          <h2 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
            Últimas notas
          </h2>
          <div className="mt-4 space-y-2">
            {recentRows.map((n) => {
              const fullName = [n.paciente_nombre, n.paciente_apellido_paterno]
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
                      {new Date(n.created_at).toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================
          SECCIÓN 3 — Herramientas del cerebro
      ============================================================ */}
      <section>
        <Eyebrow tone="validation">Cerebro clínico</Eyebrow>
        <h2 className="mt-2 text-h3 font-semibold tracking-tight text-ink-strong">
          Lo que el cerebro puede hacer
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ToolCard
            icon={BookOpen}
            title="Buscar en guías"
            description="Consulta el cerebro clínico curado con cita verbatim a la fuente original."
            href="/dashboard/cerebro"
            locked={!cerebroUnlocked}
          />
          <ToolCard
            icon={Network}
            title="Patrones clínicos"
            description="Patrones detectados desde tu propia práctica y referencia académica curada."
            href="/dashboard/diferencial/patrones"
            locked={!cerebroUnlocked}
          />
          <ToolCard
            icon={FlaskConical}
            title="Motor de estudios"
            description="Cruza estudios diagnósticos (imagen, lab, endoscopia, EKG, biopsia) y detecta patrones complejos multi-variables."
            href="/dashboard/diferencial/estudios"
            locked={!cerebroUnlocked}
            badge="Nuevo"
          />
          <ToolCard
            icon={Upload}
            title="Importar desde papel u otro EHR"
            description="Fotos, archivos HL7 v2 o CDA XML. El cerebro extrae estructura clínica."
            href="/dashboard/importar-papel"
            locked={!scribeUnlocked}
            badge="Nuevo"
          />
          <ToolCard
            icon={TrendingUp}
            title="Mi calidad"
            description="PPV personal, override patterns y calibración de tu práctica."
            href="/dashboard/diferencial/calidad"
            locked={!cerebroUnlocked}
          />
        </div>
      </section>

      {/* ============================================================
          SECCIÓN 4 — Avanzado / cuenta
      ============================================================ */}
      <section>
        <Eyebrow>Cuenta y opciones</Eyebrow>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <CompactCard
            icon={TrendingUp}
            title="Mi impacto"
            description="Tu contribución al cerebro colectivo"
            href="/dashboard/mi-impacto"
          />
          <CompactCard
            icon={Settings}
            title="Configuración"
            description="Perfil, consultorio y preferencias"
            href="/dashboard/configuracion"
          />
          <CompactCard
            icon={CreditCard}
            title="Mi plan"
            description={`${TIER_LABELS[tier]} · cambiar suscripción`}
            href="/dashboard/mi-plan"
          />
        </div>
      </section>

      {/* ============================================================
          SECCIÓN 5 — Admin (solo admin)
      ============================================================ */}
      {isAdmin && (
        <section>
          <Eyebrow tone="warn">Administración</Eyebrow>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CompactCard
              icon={Users}
              title="Invitaciones"
              description="Pilote control"
              href="/admin/invitaciones"
            />
            <CompactCard
              icon={BarChart3}
              title="Uso plataforma"
              description="Métricas de doctores activos"
              href="/admin/uso"
            />
            <CompactCard
              icon={MessageCircle}
              title="Feedback"
              description="Bugs y sugerencias"
              href="/admin/feedback"
            />
            <CompactCard
              icon={Megaphone}
              title="Anuncios"
              description="Comunicar novedades"
              href="/admin/anuncios"
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CompactCard
              icon={ShieldCheck}
              title="Validación cerebro"
              description="Benchmarks técnicos"
              href="/admin/validacion"
            />
            <CompactCard
              icon={BookOpen}
              title="Curar cerebro"
              description="Editar fragmentos curados"
              href="/admin/cerebro"
            />
          </div>
        </section>
      )}
    </div>
  );
}

// =====================================================================
// Subcomponents
// =====================================================================

function StatInline({
  label,
  value,
  tone,
  progressPct,
}: {
  label: string;
  value: string;
  tone?: "validation";
  progressPct?: number | null;
}) {
  const valueClass =
    tone === "validation" ? "text-validation" : "text-ink-strong";
  return (
    <div className="px-4 py-3 sm:px-5 sm:py-4">
      <p className="text-caption text-ink-muted">{label}</p>
      <p className={`mt-1 text-h2 font-semibold tabular-nums ${valueClass}`}>
        {value}
      </p>
      {progressPct !== null && progressPct !== undefined && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-alt">
          <div
            className="h-full rounded-full bg-validation transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  href,
  primary,
  locked,
}: {
  icon: LucideIcon;
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
    ? "lg-card border-validation bg-validation-soft/30 hover:border-validation hover:shadow-lift transition-all"
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

function ToolCard({
  icon: Icon,
  title,
  description,
  href,
  locked,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  locked?: boolean;
  badge?: string;
}) {
  if (locked) {
    return (
      <div className="lg-card opacity-70">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-surface-alt p-2 text-ink-quiet">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
              {title}
            </h3>
            <p className="mt-1 text-body-sm text-ink-muted leading-relaxed">
              {description}
            </p>
            <Link
              href="/precios"
              className="mt-3 inline-flex items-center gap-1 text-caption font-semibold text-warn hover:underline"
            >
              Plan requerido →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="lg-card group transition-all hover:border-validation hover:shadow-lift"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-validation-soft p-2 text-validation">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
              {title}
            </h3>
            {badge && (
              <span className="inline-flex items-center rounded-full bg-validation-soft px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-eyebrow text-validation">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-body-sm text-ink-muted leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

function CompactCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong hover:bg-surface-alt"
    >
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-ink-quiet group-hover:text-ink-strong"
        strokeWidth={2}
      />
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-semibold text-ink-strong">{title}</p>
        <p className="text-caption text-ink-muted truncate">{description}</p>
      </div>
    </Link>
  );
}
