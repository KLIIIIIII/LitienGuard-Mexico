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
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { decryptField } from "@/lib/encryption";
import { Eyebrow } from "@/components/eyebrow";
import { NoteStatusBadge } from "@/components/note-status-badge";
import {
  canUseScribe,
  canUseCerebro,
  scribeMonthlyLimit,
  TIER_LABELS,
  TIER_DESCRIPTIONS,
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
    .select("nombre, role, hospital, especialidad, subscription_tier")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const scribeUnlocked = canUseScribe(tier);
  const cerebroUnlocked = canUseCerebro(tier);

  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const [
    { data: recent },
    { count: totalNotas },
    { count: firmadas },
    { count: notasMes },
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
  ]);

  // Descifrar el snippet de SOAP de las notas recientes (Fase B)
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
  const usagePct = Number.isFinite(limit) && limit > 0
    ? Math.min(100, Math.round((usedThisMonth / limit) * 100))
    : 0;

  return (
    <div>
      <div>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <Eyebrow tone="validation">
              {profile?.role === "admin" ? "Panel admin" : "Panel del médico"}
            </Eyebrow>
            <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
              Hola
              {profile?.nombre ? `, ${profile.nombre.split(" ")[0]}` : ""}.
            </h1>
            <p className="mt-2 max-w-prose text-body text-ink-muted">
              {user.email}
              {profile?.hospital ? ` · ${profile.hospital}` : ""}
            </p>
          </div>
          {scribeUnlocked ? (
            <Link href="/dashboard/scribe" className="lg-cta-primary">
              <Plus className="h-4 w-4" />
              Nueva nota
            </Link>
          ) : tier === "free" ? (
            <Link href="/precios" className="lg-cta-ghost">
              <Lock className="h-4 w-4" />
              Subir de plan
            </Link>
          ) : (
            <Link href="/dashboard/notas" className="lg-cta-primary">
              <Plus className="h-4 w-4" />
              Nueva nota
            </Link>
          )}
        </div>

        {/* First-time push — solo si el médico nunca ha hecho una nota y
            tiene scribe desbloqueado. Lo lleva al "wow" en 30 segundos. */}
        {total === 0 && scribeUnlocked && (
          <section className="mt-10 overflow-hidden rounded-2xl border border-validation bg-gradient-to-br from-validation-soft via-surface to-canvas">
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
                  obtén la nota SOAP estructurada con cita verbatim. El cerebro
                  y el diferencial se desbloquean cuando ya entendiste el flujo.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    href="/dashboard/scribe"
                    className="lg-cta-primary group"
                  >
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

        {/* Stats */}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="lg-card">
            <p className="text-caption text-ink-muted">Notas en total</p>
            <p className="mt-1 text-h1 font-semibold text-ink-strong">{total}</p>
          </div>
          <div className="lg-card">
            <p className="text-caption text-ink-muted">Firmadas</p>
            <p className="mt-1 text-h1 font-semibold text-validation">
              {signed}
            </p>
          </div>
          <div className="lg-card">
            <div className="flex items-baseline justify-between">
              <p className="text-caption text-ink-muted">Uso este mes</p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium ${tierBadgeClass(
                  tier,
                )}`}
              >
                {TIER_LABELS[tier]}
              </span>
            </div>
            <p className="mt-1 text-h1 font-semibold text-ink-strong">
              {usedThisMonth}
              <span className="ml-1 text-body-sm font-normal text-ink-muted">
                / {Number.isFinite(limit) ? limit : "∞"}
              </span>
            </p>
            {Number.isFinite(limit) && limit > 0 && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
                <div
                  className="h-full rounded-full bg-validation transition-all"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
            )}
            <p className="mt-2 text-caption text-ink-soft">
              {TIER_DESCRIPTIONS[tier]}
            </p>
          </div>
        </section>

        {/* Tools */}
        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          {scribeUnlocked ? (
            <Link
              href="/dashboard/scribe"
              className="lg-card group transition-all hover:border-validation hover:shadow-lift"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-validation-soft p-2 text-validation">
                  <Mic className="h-5 w-5" />
                </div>
                <div>
                  <Eyebrow tone="validation">Scribe</Eyebrow>
                  <h2 className="mt-1 text-h2 font-semibold tracking-tight text-ink-strong">
                    Notas SOAP automáticas
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-body-sm text-ink-muted">
                Graba o sube el audio de la consulta. Se transcribe en español
                y se estructura automáticamente en formato SOAP. Tú firmas la
                versión final.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-validation-soft px-3 py-1 text-caption text-validation">
                Disponible · Plan {TIER_LABELS[tier]}
              </span>
            </Link>
          ) : (
            <div className="lg-card opacity-80">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-surface-alt p-2 text-ink-quiet">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <Eyebrow tone="validation">Scribe</Eyebrow>
                  <h2 className="mt-1 text-h2 font-semibold tracking-tight text-ink-strong">
                    Notas SOAP automáticas
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-body-sm text-ink-muted">
                {tier === "free"
                  ? "Función de suscripción. Solicita acceso al piloto o suscríbete al plan Pro para grabar consultas y obtener notas SOAP estructuradas en segundos."
                  : "Tu plan Esencial incluye notas manuales. Para grabar la consulta y obtener SOAP automático en 13 segundos, sube a plan Profesional."}
              </p>
              <Link
                href={tier === "free" ? "/contacto" : "/precios"}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1 text-caption text-warn hover:bg-warn-soft/80"
              >
                {tier === "free" ? "Solicitar acceso" : "Ver plan Profesional"} →
              </Link>
            </div>
          )}

          <Link
            href="/dashboard/notas"
            className="lg-card group transition-all hover:border-accent hover:shadow-lift"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-accent-soft p-2 text-accent">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <Eyebrow tone="accent">Mis notas</Eyebrow>
                <h2 className="mt-1 text-h2 font-semibold tracking-tight text-ink-strong">
                  Historial y borradores
                </h2>
              </div>
            </div>
            <p className="mt-3 text-body-sm text-ink-muted">
              Revisa, edita y firma tus notas. Cada nota guarda transcripción y
              versión SOAP para que puedas auditar el trabajo de la IA.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-caption text-accent">
              {total} {total === 1 ? "nota" : "notas"}
            </span>
          </Link>

          {cerebroUnlocked ? (
            <Link
              href="/dashboard/cerebro"
              className="lg-card group transition-all hover:border-accent hover:shadow-lift"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-accent-soft p-2 text-accent">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <Eyebrow tone="accent">Cerebro</Eyebrow>
                  <h2 className="mt-1 text-h2 font-semibold tracking-tight text-ink-strong">
                    Búsqueda con evidencia
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-body-sm text-ink-muted">
                Consulta el cerebro curado en español con citas verbatim de
                guías oficiales (IMSS, NOM-004, NICE, GINA, Surviving Sepsis).
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-caption text-accent">
                Disponible · Plan {TIER_LABELS[tier]}
              </span>
            </Link>
          ) : (
            <div className="lg-card opacity-80">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-surface-alt p-2 text-ink-quiet">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <Eyebrow tone="accent">Cerebro</Eyebrow>
                  <h2 className="mt-1 text-h2 font-semibold tracking-tight text-ink-strong">
                    Búsqueda con evidencia
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-body-sm text-ink-muted">
                Consulta el cerebro curado en español con citas verbatim de
                guías oficiales (IMSS, NOM-004, NICE, GINA, Surviving Sepsis).
              </p>
              <Link
                href="/contacto"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1 text-caption text-warn hover:bg-warn-soft/80"
              >
                Plan Pro o superior →
              </Link>
            </div>
          )}

          {profile?.role === "admin" && (
            <Link
              href="/admin/invitaciones"
              className="lg-card group transition-all hover:border-line-strong hover:shadow-lift"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-warn-soft p-2 text-warn">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <Eyebrow tone="accent">Admin</Eyebrow>
                  <h2 className="mt-1 text-h2 font-semibold tracking-tight text-ink-strong">
                    Invitaciones al piloto
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-body-sm text-ink-muted">
                Agrega los correos de los médicos que pueden entrar al piloto y
                revoca acceso cuando lo necesites.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1 text-caption text-warn">
                Acceso administrativo
              </span>
            </Link>
          )}
        </section>

        {recentRows.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
                Últimas notas
              </h2>
              <Link
                href="/dashboard/notas"
                className="text-caption font-medium text-ink-muted hover:text-ink-strong"
              >
                Ver todas →
              </Link>
            </div>
            <div className="mt-5 space-y-3">
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
      </div>
    </div>
  );
}
