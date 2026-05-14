import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  FileText,
  Pill,
  GitFork,
  CheckCircle2,
  XCircle,
  CircleDot,
  Calendar,
  User,
  ChevronRight,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import {
  canUseScribe,
  canUseRecetas,
  canUseCerebro,
  type SubscriptionTier,
} from "@/lib/entitlements";
import { ConsultaActions } from "./consulta-actions";
import { ConsultaNotesForm } from "./consulta-notes-form";
import { decryptField } from "@/lib/encryption";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Consulta",
  robots: { index: false, follow: false },
};

const TIPO_LABEL: Record<string, string> = {
  primera_vez: "Primera vez",
  subsecuente: "Subsecuente",
  urgencia: "Urgencia",
  revision: "Revisión",
};

export default async function ConsultaDetallePage({
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

  const { data: consulta } = await supa
    .from("consultas")
    .select("*")
    .eq("id", id)
    .eq("medico_id", user.id)
    .single();

  if (!consulta) notFound();

  // Cargar artefactos vinculados
  const [{ data: notasRaw }, { data: recetas }, { data: diferenciales }] =
    await Promise.all([
      supa
        .from("notas_scribe")
        .select(
          "id, paciente_iniciales, status, created_at, soap_subjetivo",
        )
        .eq("consulta_id", id)
        .order("created_at", { ascending: false }),
      supa
        .from("recetas")
        .select("id, diagnostico, status, fecha_emision, created_at")
        .eq("consulta_id", id)
        .order("created_at", { ascending: false }),
      supa
        .from("diferencial_sessions")
        .select(
          "id, paciente_iniciales, medico_diagnostico_principal, outcome_confirmado, created_at",
        )
        .eq("consulta_id", id)
        .order("created_at", { ascending: false }),
    ]);

  // Descifrar el snippet de SOAP de cada nota (Fase B)
  const notas = notasRaw
    ? await Promise.all(
        notasRaw.map(async (n) => ({
          ...n,
          soap_subjetivo: await decryptField(n.soap_subjetivo),
        })),
      )
    : null;

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
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const StatusInfo =
    consulta.status === "abierta"
      ? {
          Icon: CircleDot,
          cls: "text-warn bg-warn-soft border-warn",
          label: "Consulta abierta",
        }
      : consulta.status === "cerrada"
        ? {
            Icon: CheckCircle2,
            cls: "text-validation bg-validation-soft border-validation",
            label: "Consulta cerrada",
          }
        : {
            Icon: XCircle,
            cls: "text-rose bg-rose-soft border-rose",
            label: "Consulta cancelada",
          };

  const isLocked = consulta.status === "cancelada";

  return (
    <div>
      <Link
        href="/dashboard/consultas"
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Volver a consultas
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow tone="validation">
            {TIPO_LABEL[consulta.tipo] ?? "Consulta"}
          </Eyebrow>
          <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
            {fullName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
              {fechaStr}
            </span>
            {consulta.paciente_edad && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" strokeWidth={2} />
                {consulta.paciente_edad} años{" "}
                {consulta.paciente_sexo === "F"
                  ? "· F"
                  : consulta.paciente_sexo === "M"
                    ? "· M"
                    : consulta.paciente_sexo === "O"
                      ? "· O"
                      : ""}
              </span>
            )}
            {consulta.paciente_id && (
              <Link
                href={`/dashboard/pacientes/${consulta.paciente_id}`}
                className="inline-flex items-center gap-1 text-validation hover:underline"
              >
                Ver ficha del paciente
                <ChevronRight className="h-3 w-3" strokeWidth={2} />
              </Link>
            )}
          </div>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-caption font-bold ${StatusInfo.cls}`}
        >
          <StatusInfo.Icon className="h-3 w-3" strokeWidth={2.5} />
          {StatusInfo.label}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Columna principal: artefactos */}
        <div className="space-y-6">
          {/* Motivo + notas libres */}
          <section className="lg-card">
            <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
              Motivo y notas
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              Contexto narrativo de la consulta. El detalle clínico va en la
              nota SOAP.
            </p>
            <ConsultaNotesForm
              id={consulta.id}
              initialMotivo={consulta.motivo_consulta}
              initialNotas={consulta.notas_libres}
              disabled={isLocked}
            />
          </section>

          {/* Nota SOAP */}
          <ArtifactSection
            title="Nota SOAP"
            icon={FileText}
            description="Documento clínico estructurado (Subjetivo · Objetivo · Análisis · Plan)"
            count={notas?.length ?? 0}
            createHref={`/dashboard/scribe?consulta_id=${consulta.id}`}
            createLabel="Generar con Scribe"
            disabled={isLocked || !canUseScribe(tier)}
            disabledReason={
              !canUseScribe(tier)
                ? "Scribe disponible en plan Pro+"
                : isLocked
                  ? "Consulta cancelada"
                  : undefined
            }
          >
            {(notas ?? []).map((n) => (
              <ArtifactRow
                key={n.id}
                href={`/dashboard/notas/${n.id}`}
                title={n.paciente_iniciales || "Nota SOAP"}
                subtitle={
                  n.soap_subjetivo
                    ? n.soap_subjetivo.slice(0, 100) + "…"
                    : "Sin contenido aún"
                }
                statusLabel={n.status}
                statusTone={
                  n.status === "firmada"
                    ? "validation"
                    : n.status === "descartada"
                      ? "rose"
                      : "warn"
                }
              />
            ))}
          </ArtifactSection>

          {/* Recetas */}
          <ArtifactSection
            title="Recetas"
            icon={Pill}
            description="Prescripciones digitales con estructura NOM-024"
            count={recetas?.length ?? 0}
            createHref={`/dashboard/recetas/nueva?consulta_id=${consulta.id}`}
            createLabel="Nueva receta"
            disabled={isLocked || !canUseRecetas(tier)}
            disabledReason={
              !canUseRecetas(tier)
                ? "Recetas disponibles en Esencial+"
                : isLocked
                  ? "Consulta cancelada"
                  : undefined
            }
          >
            {(recetas ?? []).map((r) => (
              <ArtifactRow
                key={r.id}
                href={`/dashboard/recetas/${r.id}`}
                title={r.diagnostico || "Receta"}
                subtitle={
                  r.fecha_emision
                    ? `Emitida ${new Date(r.fecha_emision).toLocaleDateString("es-MX")}`
                    : "Borrador"
                }
                statusLabel={r.status}
                statusTone={
                  r.status === "emitida"
                    ? "validation"
                    : r.status === "anulada"
                      ? "rose"
                      : "warn"
                }
              />
            ))}
          </ArtifactSection>

          {/* Diferencial */}
          <ArtifactSection
            title="Diferencial diagnóstico"
            icon={GitFork}
            description="Análisis bayesiano de hipótesis con evidencia"
            count={diferenciales?.length ?? 0}
            createHref={`/dashboard/diferencial?consulta_id=${consulta.id}`}
            createLabel="Nuevo diferencial"
            disabled={isLocked || !canUseCerebro(tier)}
            disabledReason={
              !canUseCerebro(tier)
                ? "Diferencial disponible en plan Pro+"
                : isLocked
                  ? "Consulta cancelada"
                  : undefined
            }
          >
            {(diferenciales ?? []).map((d) => (
              <ArtifactRow
                key={d.id}
                href={`/dashboard/diferencial/${d.id}`}
                title={
                  d.medico_diagnostico_principal ||
                  d.paciente_iniciales ||
                  "Diferencial"
                }
                subtitle={
                  d.outcome_confirmado
                    ? `Confirmado: ${d.outcome_confirmado}`
                    : "Pendiente confirmación"
                }
                statusLabel={d.outcome_confirmado ? "confirmado" : "abierto"}
                statusTone={d.outcome_confirmado ? "validation" : "warn"}
              />
            ))}
          </ArtifactSection>
        </div>

        {/* Columna lateral: acciones */}
        <aside className="space-y-4">
          <ConsultaActions
            id={consulta.id}
            status={consulta.status}
            motivoCancelacion={consulta.motivo_cancelacion}
          />

          <div className="lg-card">
            <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft">
              Resumen
            </p>
            <dl className="mt-3 space-y-2 text-caption">
              <ResumenLine
                label="Notas SOAP"
                value={notas?.length ?? 0}
              />
              <ResumenLine
                label="Recetas"
                value={recetas?.length ?? 0}
              />
              <ResumenLine
                label="Diferenciales"
                value={diferenciales?.length ?? 0}
              />
            </dl>
          </div>

          {consulta.cita_id && (
            <Link
              href={`/dashboard/agenda/${consulta.cita_id}`}
              className="lg-card flex items-center gap-3 transition-colors hover:bg-surface-alt"
            >
              <Calendar
                className="h-4 w-4 text-validation"
                strokeWidth={2}
              />
              <div className="min-w-0 flex-1">
                <p className="text-caption font-semibold text-ink-strong">
                  Cita vinculada
                </p>
                <p className="text-[0.65rem] text-ink-muted">
                  Ver evento de agenda
                </p>
              </div>
              <ChevronRight
                className="h-3 w-3 text-ink-quiet"
                strokeWidth={2}
              />
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

// =============================================================
// Subcomponentes
// =============================================================

function ArtifactSection({
  title,
  icon: Icon,
  description,
  count,
  createHref,
  createLabel,
  disabled,
  disabledReason,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  description: string;
  count: number;
  createHref: string;
  createLabel: string;
  disabled?: boolean;
  disabledReason?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="lg-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-validation-soft text-validation">
            <Icon className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
              {title}
              {count > 0 && (
                <span className="ml-2 text-caption font-normal text-ink-soft">
                  · {count}
                </span>
              )}
            </h2>
            <p className="mt-0.5 text-caption text-ink-muted">{description}</p>
          </div>
        </div>
        {disabled ? (
          <span
            title={disabledReason}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-alt px-3 py-1.5 text-caption text-ink-soft"
          >
            <Plus className="h-3 w-3" strokeWidth={2} />
            {disabledReason ?? "No disponible"}
          </span>
        ) : (
          <Link
            href={createHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-caption font-medium text-ink-strong transition-colors hover:bg-surface-alt"
          >
            <Plus className="h-3 w-3" strokeWidth={2.2} />
            {createLabel}
          </Link>
        )}
      </div>

      {count > 0 ? (
        <div className="mt-4 space-y-2">{children}</div>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-line bg-surface-alt px-4 py-6 text-center text-caption italic text-ink-quiet">
          Aún no hay {title.toLowerCase()} en esta consulta
        </p>
      )}
    </section>
  );
}

function ArtifactRow({
  href,
  title,
  subtitle,
  statusLabel,
  statusTone,
}: {
  href: string;
  title: string;
  subtitle: string;
  statusLabel: string;
  statusTone: "validation" | "warn" | "rose";
}) {
  const toneCls =
    statusTone === "validation"
      ? "text-validation bg-validation-soft"
      : statusTone === "rose"
        ? "text-rose bg-rose-soft"
        : "text-warn bg-warn-soft";
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 transition-colors hover:border-line-strong hover:bg-surface-alt"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-semibold text-ink-strong">
          {title}
        </p>
        <p className="truncate text-caption text-ink-muted">{subtitle}</p>
      </div>
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${toneCls}`}
      >
        {statusLabel}
      </span>
      <ChevronRight
        className="h-3 w-3 shrink-0 text-ink-quiet transition-transform group-hover:translate-x-0.5"
        strokeWidth={2}
      />
    </Link>
  );
}

function ResumenLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-semibold text-ink-strong">{value}</dd>
    </div>
  );
}
