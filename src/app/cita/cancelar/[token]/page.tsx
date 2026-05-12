import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { PageHero } from "@/components/page-hero";
import { Eyebrow } from "@/components/eyebrow";
import { CancelCitaForm } from "./cancel-form";

export const metadata: Metadata = {
  title: "Cancelar cita — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TZ = "America/Mexico_City";

export default async function CancelarCitaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Validate token format defensively (32 hex chars from gen_random_bytes(16))
  if (!/^[a-f0-9]{32}$/i.test(token)) {
    notFound();
  }

  const admin = getSupabaseAdmin();
  if (!admin) notFound();

  const { data: cita } = await admin
    .from("citas")
    .select(
      `id, paciente_nombre, paciente_apellido_paterno, fecha_inicio, fecha_fin, status, motivo, motivo_cancelacion,
       profiles!citas_medico_id_fkey ( nombre, especialidad, consultorio_nombre, consultorio_direccion, consultorio_telefono )`,
    )
    .eq("patient_token", token)
    .maybeSingle();

  if (!cita) {
    return (
      <>
        <PageHero
          eyebrow="Cancelar cita"
          title="No encontramos esta cita."
          description="El link puede haber expirado o estar mal escrito. Si recibiste el correo recientemente, intenta abrirlo de nuevo o llama al consultorio."
          variant="alt"
        />
      </>
    );
  }

  const start = new Date(cita.fecha_inicio);
  const fechaLarga = start.toLocaleDateString("es-MX", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const horaStr = start.toLocaleTimeString("es-MX", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const medicoArr = (cita.profiles ?? []) as unknown as Array<{
    nombre: string | null;
    especialidad: string | null;
    consultorio_nombre: string | null;
    consultorio_direccion: string | null;
    consultorio_telefono: string | null;
  }>;
  const medico =
    Array.isArray(medicoArr)
      ? (medicoArr[0] ?? {
          nombre: null,
          especialidad: null,
          consultorio_nombre: null,
          consultorio_direccion: null,
          consultorio_telefono: null,
        })
      : medicoArr;

  // Already cancelled — show informational state
  if (cita.status === "cancelada") {
    return (
      <>
        <PageHero
          eyebrow="Cancelación"
          title={
            <>
              Esta cita ya fue{" "}
              <span className="lg-serif-italic text-rose">cancelada</span>.
            </>
          }
          description="No hay nada más que confirmar — la cita ya no aparece en el calendario del consultorio."
          variant="alt"
        />
        <section className="border-b border-line bg-canvas py-12">
          <div className="lg-shell max-w-2xl">
            <div className="lg-card flex items-start gap-3">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-validation"
                strokeWidth={2}
              />
              <div>
                <p className="text-body-sm font-semibold text-ink-strong">
                  Cita cancelada
                </p>
                <p className="mt-1 text-caption text-ink-muted">
                  {fechaLarga} · {horaStr} hrs · con{" "}
                  {medico.nombre ?? "tu médico"}
                </p>
                {cita.motivo_cancelacion && (
                  <p className="mt-2 text-caption text-ink-muted">
                    Motivo registrado: «{cita.motivo_cancelacion}»
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  // Cita completed or no_asistio — also already terminal
  if (cita.status === "completada" || cita.status === "no_asistio") {
    return (
      <>
        <PageHero
          eyebrow="Cancelación"
          title="Esta cita ya terminó."
          description="No se puede cancelar una cita que ya ocurrió o quedó cerrada."
          variant="alt"
        />
      </>
    );
  }

  const fullName = [cita.paciente_nombre, cita.paciente_apellido_paterno]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <PageHero
        eyebrow="Cancelar cita"
        title={
          <>
            ¿Cancelar tu cita con{" "}
            <span className="lg-serif-italic text-validation">
              {medico.nombre ?? "tu médico"}
            </span>
            ?
          </>
        }
        description="Si necesitas reagendar, también puedes contactar al consultorio directamente. La cancelación queda registrada inmediatamente."
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-12">
        <div className="lg-shell max-w-2xl space-y-6">
          <div className="lg-card space-y-3">
            <Eyebrow>Detalle de tu cita</Eyebrow>
            <div className="space-y-1.5">
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                Paciente
              </p>
              <p className="text-body font-semibold text-ink-strong">
                {fullName}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                Cuándo
              </p>
              <p className="text-body font-semibold text-ink-strong capitalize">
                {fechaLarga}
              </p>
              <p className="text-body-sm text-ink-muted">{horaStr} hrs</p>
            </div>
            {medico.consultorio_nombre && (
              <div className="space-y-1.5">
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                  Dónde
                </p>
                <p className="text-body-sm font-medium text-ink-strong">
                  {medico.consultorio_nombre}
                </p>
                {medico.consultorio_direccion && (
                  <p className="text-caption text-ink-muted">
                    {medico.consultorio_direccion}
                  </p>
                )}
              </div>
            )}
            {cita.motivo && (
              <div className="space-y-1.5">
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                  Motivo
                </p>
                <p className="text-body-sm text-ink-muted">{cita.motivo}</p>
              </div>
            )}
          </div>

          <div className="lg-card border-warn-soft">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-warn"
                strokeWidth={2}
              />
              <div className="text-body-sm text-ink-strong">
                <p className="font-semibold">Antes de confirmar</p>
                <p className="mt-1 text-ink-muted leading-relaxed">
                  Si crees que aún puedes asistir, considera llamar al
                  consultorio
                  {medico.consultorio_telefono
                    ? ` al ${medico.consultorio_telefono}`
                    : ""}
                  {" "}para reagendar en lugar de cancelar. Una cancelación
                  libera el horario para otro paciente.
                </p>
              </div>
            </div>
          </div>

          <CancelCitaForm token={token} />

          <p className="text-caption text-ink-soft leading-relaxed">
            <CalendarOff
              className="inline h-3.5 w-3.5 mr-1 text-ink-quiet"
              strokeWidth={2}
            />
            La cancelación queda registrada conforme a la NOM-024-SSA3 y se
            audita en el sistema del consultorio.
          </p>
        </div>
      </section>
    </>
  );
}
