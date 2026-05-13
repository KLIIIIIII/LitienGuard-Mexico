import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User, Mail, Phone } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseAgenda, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { CitaActions } from "./cita-actions";

export const metadata: Metadata = {
  title: "Cita — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  agendada: { label: "Agendada", cls: "bg-validation-soft text-validation" },
  confirmada: { label: "Confirmada", cls: "bg-accent-soft text-accent" },
  completada: { label: "Completada", cls: "bg-surface-alt text-ink-muted" },
  cancelada: { label: "Cancelada", cls: "bg-rose-soft text-rose" },
  no_asistio: { label: "No asistió", cls: "bg-warn-soft text-warn" },
};

export default async function CitaDetailPage({
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
  if (!canUseAgenda(tier)) redirect("/dashboard/agenda");

  const { data: cita } = await supa
    .from("citas")
    .select("*")
    .eq("id", id)
    .single();
  if (!cita) notFound();

  const inicio = new Date(cita.fecha_inicio);
  const fin = new Date(cita.fecha_fin);
  const status = STATUS_META[cita.status] ?? STATUS_META.agendada;
  const fullName = [
    cita.paciente_nombre,
    cita.paciente_apellido_paterno,
    cita.paciente_apellido_materno,
  ]
    .filter(Boolean)
    .join(" ");
  const fechaStr = inicio.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const horaInicio = inicio.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const horaFin = fin.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/agenda"
        className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Volver a la agenda
      </Link>

      <header className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow tone="validation">Cita</Eyebrow>
          <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            {fullName}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold ${status.cls}`}
          >
            {status.label}
          </span>
          {(cita.status === "confirmada" || cita.status === "agendada") && (
            <Link
              href={`/dashboard/consultas/nueva?cita_id=${id}`}
              className="lg-cta-primary"
            >
              Iniciar consulta
            </Link>
          )}
        </div>
      </header>

      <div className="lg-card space-y-3">
        <div className="flex items-start gap-3">
          <Calendar className="mt-0.5 h-4 w-4 text-ink-muted" strokeWidth={2} />
          <div>
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
              Fecha
            </p>
            <p className="text-body-sm font-medium text-ink-strong capitalize">
              {fechaStr}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-4 w-4 text-ink-muted" strokeWidth={2} />
          <div>
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
              Horario
            </p>
            <p className="text-body-sm font-medium text-ink-strong">
              {horaInicio} — {horaFin}
            </p>
          </div>
        </div>
        {cita.tipo_consulta && (
          <div className="flex items-start gap-3">
            <User className="mt-0.5 h-4 w-4 text-ink-muted" strokeWidth={2} />
            <div>
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                Tipo
              </p>
              <p className="text-body-sm font-medium text-ink-strong">
                {cita.tipo_consulta}
              </p>
            </div>
          </div>
        )}
        {cita.paciente_email && (
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-ink-muted" strokeWidth={2} />
            <p className="text-body-sm text-ink-strong">{cita.paciente_email}</p>
          </div>
        )}
        {cita.paciente_telefono && (
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 text-ink-muted" strokeWidth={2} />
            <p className="text-body-sm text-ink-strong">{cita.paciente_telefono}</p>
          </div>
        )}
      </div>

      {cita.motivo && (
        <div className="lg-card space-y-2">
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            Motivo de la consulta
          </h2>
          <p className="text-body-sm text-ink-strong whitespace-pre-wrap">
            {cita.motivo}
          </p>
        </div>
      )}

      {cita.notas_internas && (
        <div className="lg-card space-y-2 border-warn-soft">
          <div className="flex items-center gap-2">
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              Notas internas
            </h2>
            <span className="rounded-full bg-warn-soft px-2 py-0.5 text-caption text-warn">
              Privadas
            </span>
          </div>
          <p className="text-body-sm text-ink-strong whitespace-pre-wrap">
            {cita.notas_internas}
          </p>
        </div>
      )}

      {cita.status === "cancelada" && cita.motivo_cancelacion && (
        <div className="lg-card border-rose-soft">
          <h2 className="text-h3 font-semibold tracking-tight text-rose">
            Cita cancelada
          </h2>
          <p className="mt-2 text-body-sm text-ink-strong">
            <span className="text-ink-muted">Motivo:</span>{" "}
            {cita.motivo_cancelacion}
          </p>
        </div>
      )}

      <CitaActions citaId={id} status={cita.status} />
    </div>
  );
}
