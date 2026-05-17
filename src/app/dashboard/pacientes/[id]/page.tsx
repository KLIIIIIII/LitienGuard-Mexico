import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Tag,
  AlertCircle,
  FileText,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { PatientHeader } from "@/components/clinical";
import {
  canUsePacientes,
  type SubscriptionTier,
} from "@/lib/entitlements";
import { RecallTrigger } from "./recall-trigger";
import { AlergiasEditor } from "./alergias-editor";

export const metadata: Metadata = {
  title: "Paciente — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Cita {
  id: string;
  fecha_inicio: string;
  motivo: string | null;
  status: string;
}

function fmt(iso: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...opts,
  });
}

function mesesDesde(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 30));
}

export default async function PacienteDetailPage({
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
  if (!canUsePacientes(tier)) redirect("/dashboard/pacientes");

  const { data: paciente } = await supa
    .from("pacientes")
    .select(
      "id, nombre, apellido_paterno, apellido_materno, email, telefono, fecha_nacimiento, sexo, ultima_consulta_at, recall_enviado_at, notas_internas, etiquetas, alergias, created_at",
    )
    .eq("id", id)
    .eq("medico_id", user.id)
    .single();

  if (!paciente) notFound();

  // Cargar últimas citas vinculadas
  const { data: citas } = await supa
    .from("citas")
    .select("id, fecha_inicio, motivo, status")
    .eq("paciente_id", paciente.id)
    .order("fecha_inicio", { ascending: false })
    .limit(10);

  const meses = mesesDesde(paciente.ultima_consulta_at);
  const inactivo = meses !== null && meses >= 6;
  const sexoLabel =
    paciente.sexo === "F"
      ? "Femenino"
      : paciente.sexo === "M"
        ? "Masculino"
        : paciente.sexo === "O"
          ? "Otro"
          : "—";
  const edad = (() => {
    if (!paciente.fecha_nacimiento) return null;
    const fn = new Date(paciente.fecha_nacimiento);
    const today = new Date();
    let years = today.getFullYear() - fn.getFullYear();
    const m = today.getMonth() - fn.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < fn.getDate())) years--;
    return years;
  })();

  const fullName = [
    paciente.nombre,
    paciente.apellido_paterno,
    paciente.apellido_materno,
  ]
    .filter(Boolean)
    .join(" ");

  const alergiasArr: string[] = Array.isArray(paciente.alergias)
    ? paciente.alergias
    : [];

  return (
    <>
      <PatientHeader
        nombre={fullName}
        edad={edad}
        sexo={
          paciente.sexo === "M"
            ? "M"
            : paciente.sexo === "F"
              ? "F"
              : paciente.sexo === "O"
                ? "X"
                : null
        }
        mrn={`MRN-${paciente.id.slice(0, 6).toUpperCase()}`}
        fechaNacimiento={paciente.fecha_nacimiento}
        alergias={alergiasArr.length > 0 ? alergiasArr : null}
        compact
      />

      <div className="space-y-8 pt-2">
      <div>
        <Link
          href="/dashboard/pacientes"
          className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-ink-strong"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
          Volver al padrón
        </Link>
        <Eyebrow tone="accent" className="mt-3">
          Paciente
        </Eyebrow>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-h1 font-semibold tracking-tight text-ink-strong">
            {fullName}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {inactivo && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1 text-caption font-semibold text-warn">
                <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.2} />
                {meses} meses sin consulta
              </span>
            )}
            <Link
              href={`/dashboard/consultas/nueva?paciente_id=${paciente.id}`}
              className="lg-cta-primary"
            >
              Iniciar consulta
            </Link>
          </div>
        </div>
        {paciente.etiquetas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {paciente.etiquetas.map((t: string) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[0.7rem] font-medium text-accent"
              >
                <Tag className="h-2.5 w-2.5" strokeWidth={2} />
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,360px)]">
        {/* Columna izquierda: datos */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-surface p-6">
            <h2 className="text-h3 font-semibold text-ink-strong">Datos</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                icon={<Mail className="h-3.5 w-3.5" />}
                label="Correo"
                value={paciente.email ?? "—"}
              />
              <Field
                icon={<Phone className="h-3.5 w-3.5" />}
                label="Teléfono"
                value={paciente.telefono ?? "—"}
              />
              <Field
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Fecha de nacimiento"
                value={
                  paciente.fecha_nacimiento
                    ? `${fmt(paciente.fecha_nacimiento)}${edad !== null ? ` · ${edad} años` : ""}`
                    : "—"
                }
              />
              <Field
                icon={<Tag className="h-3.5 w-3.5" />}
                label="Sexo"
                value={sexoLabel}
              />
              <Field
                icon={<Calendar className="h-3.5 w-3.5" />}
                label="Última consulta"
                value={
                  paciente.ultima_consulta_at
                    ? fmt(paciente.ultima_consulta_at)
                    : "Sin registro"
                }
              />
              <Field
                icon={<Mail className="h-3.5 w-3.5" />}
                label="Último recordatorio"
                value={
                  paciente.recall_enviado_at
                    ? fmt(paciente.recall_enviado_at)
                    : "No enviado"
                }
              />
            </dl>
            {paciente.notas_internas && (
              <div className="mt-5 rounded-lg bg-surface-alt p-4">
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                  Notas internas
                </p>
                <p className="mt-2 whitespace-pre-line text-body-sm text-ink-strong leading-relaxed">
                  {paciente.notas_internas}
                </p>
              </div>
            )}

            {/* Alergias — feature de seguridad clínica (AMIA error prevention) */}
            <div className="mt-5">
              <AlergiasEditor
                pacienteId={paciente.id}
                initial={alergiasArr}
              />
            </div>
          </section>

          {/* Citas vinculadas */}
          <section className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-h3 font-semibold text-ink-strong">
                Historial de citas
              </h2>
              <p className="text-caption text-ink-muted">
                {citas?.length ?? 0} vinculadas
              </p>
            </div>
            {!citas || citas.length === 0 ? (
              <p className="mt-4 text-body-sm text-ink-muted">
                Las citas que agendas con este paciente aparecerán aquí
                automáticamente cuando se enlacen al padrón.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {(citas as Cita[]).map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-line bg-surface-alt px-3 py-2 text-body-sm"
                  >
                    <div>
                      <p className="font-medium text-ink-strong">
                        {fmt(c.fecha_inicio, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {c.motivo && (
                        <p className="mt-0.5 text-caption text-ink-muted">
                          {c.motivo}
                        </p>
                      )}
                    </div>
                    <span className="text-caption text-ink-muted capitalize">
                      {c.status.replace("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Columna derecha: recall */}
        <aside className="space-y-4">
          <RecallTrigger
            pacienteId={paciente.id}
            email={paciente.email}
            nombre={fullName}
            mesesSinConsulta={meses}
            recallEnviadoAt={paciente.recall_enviado_at}
          />

          <div className="rounded-2xl border border-line bg-surface-alt p-5">
            <FileText
              className="h-5 w-5 text-ink-muted"
              strokeWidth={2}
            />
            <p className="mt-2 text-caption text-ink-muted leading-relaxed">
              <strong className="text-ink-strong">Tip:</strong> Para que las
              consultas nuevas se vinculen automáticamente al padrón, al
              agendar la cita selecciona este paciente del catálogo.
            </p>
          </div>
        </aside>
      </div>
      </div>
    </>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-caption uppercase tracking-eyebrow text-ink-soft">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-body-sm font-medium text-ink-strong">{value}</dd>
    </div>
  );
}
