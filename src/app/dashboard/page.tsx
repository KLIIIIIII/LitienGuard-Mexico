import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Mic,
  BookOpen,
  ShieldCheck,
  Plus,
  Lock,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { NoteStatusBadge } from "@/components/note-status-badge";
import {
  canUseScribe,
  canUseCerebro,
  TIER_LABELS,
  TIER_DESCRIPTIONS,
  tierBadgeClass,
  type SubscriptionTier,
} from "@/lib/entitlements";

export const dynamic = "force-dynamic";

type RecentNota = {
  id: string;
  paciente_iniciales: string | null;
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

  const [{ data: recent }, { count: totalNotas }, { count: firmadas }] =
    await Promise.all([
      supa
        .from("notas_scribe")
        .select(
          "id,paciente_iniciales,paciente_edad,status,soap_analisis,soap_subjetivo,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(5),
      supa.from("notas_scribe").select("*", { count: "exact", head: true }),
      supa
        .from("notas_scribe")
        .select("*", { count: "exact", head: true })
        .eq("status", "firmada"),
    ]);

  const recentRows = (recent as RecentNota[] | null) ?? [];
  const total = totalNotas ?? 0;
  const signed = firmadas ?? 0;

  return (
    <main className="min-h-[calc(100vh-72px)] bg-canvas">
      <div className="lg-shell py-12 lg:py-16">
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
          ) : (
            <Link href="/contacto" className="lg-cta-ghost">
              <Lock className="h-4 w-4" />
              Solicitar acceso piloto
            </Link>
          )}
        </div>

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
            <p className="text-caption text-ink-muted">Plan actual</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-body-sm font-semibold ${tierBadgeClass(
                  tier,
                )}`}
              >
                {TIER_LABELS[tier]}
              </span>
            </div>
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
                Graba o sube el audio de la consulta. Whisper transcribe en
                español, Llama 3.3 70B estructura en formato SOAP. Tú firmas la
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
                Función de suscripción. Solicita acceso al piloto cerrado o al
                plan Pro para grabar consultas y obtener notas SOAP
                estructuradas en segundos.
              </p>
              <Link
                href="/contacto"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1 text-caption text-warn hover:bg-warn-soft/80"
              >
                Solicitar acceso →
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

          <div className="lg-card opacity-70">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-surface-alt p-2 text-ink-quiet">
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
              Consulta el cerebro curado en español con citas verbatim de guías
              oficiales (IMSS, NOM-004, NICE, GINA, ADA).
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1 text-caption text-ink-muted">
              {cerebroUnlocked
                ? "Próximamente · Hito 3.3"
                : "Plan Pro o superior"}
            </span>
          </div>

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

        {/* Recent notes */}
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
                const ctx = [
                  n.paciente_iniciales,
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
    </main>
  );
}
