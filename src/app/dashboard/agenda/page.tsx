import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseAgenda, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { ConsentBanner } from "@/components/consent-banner";
import { AgendaWeekView } from "./agenda-week-view";

export const metadata: Metadata = {
  title: "Agenda — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function parseWeekStart(input: string | undefined): Date {
  if (input) {
    const d = new Date(input);
    if (!Number.isNaN(d.getTime())) return weekStartFor(d);
  }
  return weekStartFor(new Date());
}

function weekStartFor(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diffToMonday);
  return copy;
}

export default async function AgendaPage({
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
    .select("subscription_tier, consentimiento_pacientes_at")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const consentimientoOk = !!profile?.consentimiento_pacientes_at;

  if (!canUseAgenda(tier)) {
    return (
      <div>
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Agenda de citas — Plan Profesional
        </h1>
        <p className="mt-3 max-w-prose text-body text-ink-muted">
          La gestión de citas con recordatorios y vista semanal está incluida
          en los planes Profesional y Clínica. Actualiza tu plan para habilitar
          la agenda.
        </p>
        <Link href="/contacto" className="lg-cta-primary mt-6 inline-flex">
          Actualizar plan
        </Link>
      </div>
    );
  }

  const params = await searchParams;
  const semanaParam = typeof params.semana === "string" ? params.semana : undefined;
  const weekStart = parseWeekStart(semanaParam);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data: citas } = await supa
    .from("citas")
    .select(
      "id,paciente_nombre,paciente_apellido_paterno,fecha_inicio,fecha_fin,tipo_consulta,status,motivo",
    )
    .gte("fecha_inicio", weekStart.toISOString())
    .lt("fecha_inicio", weekEnd.toISOString())
    .order("fecha_inicio");

  return (
    <div className="space-y-6">
      {!consentimientoOk && <ConsentBanner />}
      <header className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow tone="validation">Agenda</Eyebrow>
          <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Citas
          </h1>
          <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
            Vista semanal de tus citas. Click en una para ver el detalle o
            modificar; click en un día para agendar una nueva.
          </p>
        </div>
        <Link href="/dashboard/agenda/nueva" className="lg-cta-primary shrink-0">
          Nueva cita
        </Link>
      </header>

      <AgendaWeekView weekStart={weekStart.toISOString()} citas={citas ?? []} />
    </div>
  );
}
