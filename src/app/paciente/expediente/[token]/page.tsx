import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  Stethoscope,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  UserX,
  Pill,
  ShieldCheck,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { recordAudit } from "@/lib/audit";
import { PageHero } from "@/components/page-hero";
import { Eyebrow } from "@/components/eyebrow";
import { consumeTokenIfPending } from "../../actions";

export const metadata: Metadata = {
  title: "Mi expediente — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const TZ = "America/Mexico_City";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  agendada: { label: "Agendada", cls: "bg-validation-soft text-validation" },
  confirmada: { label: "Confirmada", cls: "bg-accent-soft text-accent" },
  completada: { label: "Completada", cls: "bg-surface-alt text-ink-muted" },
  cancelada: { label: "Cancelada", cls: "bg-rose-soft text-rose" },
  no_asistio: { label: "No asistió", cls: "bg-warn-soft text-warn" },
};

function expiredOrInvalidView() {
  return (
    <>
      <PageHero
        eyebrow="Expediente"
        title="Este enlace ya no es válido."
        description="El enlace pudo haber expirado, ya fue usado, o no corresponde a un acceso vigente. Solicita uno nuevo desde el portal."
        variant="alt"
      />
      <section className="border-b border-line bg-canvas py-12">
        <div className="lg-shell max-w-xl">
          <Link href="/paciente" className="lg-cta-primary">
            Solicitar acceso nuevo
          </Link>
        </div>
      </section>
    </>
  );
}

export default async function ExpedientePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/i.test(token)) notFound();

  const admin = getSupabaseAdmin();
  if (!admin) notFound();

  // Look up the token
  const { data: tokenRow } = await admin
    .from("paciente_magic_tokens")
    .select("email,expires_at,used_at,created_at")
    .eq("token", token)
    .maybeSingle();

  if (!tokenRow) {
    return expiredOrInvalidView();
  }

  const now = Date.now();
  const expired = new Date(tokenRow.expires_at).getTime() < now;
  if (expired) {
    return expiredOrInvalidView();
  }

  // Mark first-use timestamp (without revoking access — we allow re-visits
  // within the 24h window for the same person on the same device)
  await consumeTokenIfPending(token);

  const email = tokenRow.email.toLowerCase();

  // Audit every view
  void recordAudit({
    action: "paciente.expediente_viewed",
    resource: token.slice(0, 12),
    metadata: { email },
  });

  // Fetch citas + recetas with practitioner join
  const [{ data: citasRaw }, { data: recetasRaw }] = await Promise.all([
    admin
      .from("citas")
      .select(
        `id, patient_token, paciente_nombre, paciente_apellido_paterno,
         fecha_inicio, fecha_fin, tipo_consulta, motivo, status,
         motivo_cancelacion,
         profiles!citas_medico_id_fkey ( nombre, especialidad,
           consultorio_nombre, consultorio_direccion, consultorio_telefono )`,
      )
      .ilike("paciente_email", email)
      .order("fecha_inicio", { ascending: false })
      .limit(50),
    admin
      .from("recetas")
      .select(
        `id, paciente_nombre, paciente_apellido_paterno, diagnostico,
         fecha_emision, status,
         profiles!recetas_medico_id_fkey ( nombre, especialidad )`,
      )
      .ilike("paciente_email", email)
      .eq("status", "firmada")
      .order("fecha_emision", { ascending: false })
      .limit(50),
  ]);

  type MedicoSlim = {
    nombre: string | null;
    especialidad: string | null;
    consultorio_nombre?: string | null;
    consultorio_direccion?: string | null;
    consultorio_telefono?: string | null;
  };
  const pickMedico = (p: unknown): MedicoSlim => {
    if (!p) return { nombre: null, especialidad: null };
    if (Array.isArray(p)) return (p[0] ?? { nombre: null, especialidad: null }) as MedicoSlim;
    return p as MedicoSlim;
  };

  const citas = citasRaw ?? [];
  const recetas = recetasRaw ?? [];

  const now2 = new Date();
  const citasProximas = citas
    .filter(
      (c) =>
        new Date(c.fecha_inicio) >= now2 &&
        (c.status === "agendada" || c.status === "confirmada"),
    )
    .sort(
      (a, b) =>
        new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime(),
    );
  const citasPasadas = citas
    .filter(
      (c) =>
        new Date(c.fecha_inicio) < now2 ||
        c.status === "completada" ||
        c.status === "cancelada" ||
        c.status === "no_asistio",
    )
    .sort(
      (a, b) =>
        new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime(),
    );

  // Best-known name for greeting
  const greetingName =
    citas[0]?.paciente_nombre ?? recetas[0]?.paciente_nombre ?? "Hola";

  return (
    <>
      <PageHero
        eyebrow="Tu expediente"
        title={
          <>
            Hola,{" "}
            <span className="lg-serif-italic text-validation">
              {greetingName}
            </span>
          </>
        }
        description={`Aquí ves toda la información clínica asociada a ${email}. Acceso registrado conforme al artículo 22 LFPDPPP.`}
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-10">
        <div className="lg-shell space-y-10">
          {/* Próximas citas */}
          <div>
            <Eyebrow tone="validation">Próximas citas</Eyebrow>
            <h2 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
              {citasProximas.length === 0
                ? "No tienes citas próximas"
                : `${citasProximas.length} cita${citasProximas.length === 1 ? "" : "s"} programada${citasProximas.length === 1 ? "" : "s"}`}
            </h2>

            {citasProximas.length > 0 && (
              <div className="mt-6 space-y-3">
                {citasProximas.map((c) => {
                  const start = new Date(c.fecha_inicio);
                  const fechaStr = start.toLocaleDateString("es-MX", {
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
                  const med = pickMedico(c.profiles);
                  const stat = STATUS_META[c.status] ?? STATUS_META.agendada;
                  return (
                    <div key={c.id} className="lg-card space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-h3 font-semibold tracking-tight text-ink-strong capitalize">
                            {fechaStr}
                          </p>
                          <p className="flex items-center gap-1.5 text-body-sm text-ink-muted">
                            <Clock className="h-3.5 w-3.5" strokeWidth={2.2} />
                            {horaStr} hrs
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold ${stat.cls}`}
                        >
                          {stat.label}
                        </span>
                      </div>

                      <div className="space-y-2 border-t border-line pt-3 text-body-sm">
                        <div className="flex items-center gap-2 text-ink-strong">
                          <Stethoscope
                            className="h-3.5 w-3.5 text-ink-muted"
                            strokeWidth={2}
                          />
                          <span className="font-medium">
                            {med.nombre ?? "Tu médico"}
                          </span>
                          {med.especialidad && (
                            <span className="text-caption text-ink-muted">
                              · {med.especialidad}
                            </span>
                          )}
                        </div>
                        {med.consultorio_nombre && (
                          <p className="text-caption text-ink-muted">
                            {med.consultorio_nombre}
                          </p>
                        )}
                        {med.consultorio_direccion && (
                          <p className="flex items-start gap-2 text-caption text-ink-muted">
                            <MapPin
                              className="mt-0.5 h-3 w-3 shrink-0"
                              strokeWidth={2}
                            />
                            <span>{med.consultorio_direccion}</span>
                          </p>
                        )}
                        {med.consultorio_telefono && (
                          <p className="flex items-center gap-2 text-caption text-ink-muted">
                            <Phone className="h-3 w-3" strokeWidth={2} />
                            <a
                              href={`tel:${med.consultorio_telefono.replace(/\s+/g, "")}`}
                              className="text-ink-strong hover:underline"
                            >
                              {med.consultorio_telefono}
                            </a>
                          </p>
                        )}
                        {c.motivo && (
                          <p className="text-caption italic text-ink-muted">
                            «{c.motivo}»
                          </p>
                        )}
                      </div>

                      {c.patient_token && (
                        <div className="border-t border-line pt-3">
                          <Link
                            href={`/cita/cancelar/${c.patient_token}`}
                            className="inline-flex items-center gap-1.5 text-caption font-semibold text-rose hover:underline"
                          >
                            <XCircle className="h-3.5 w-3.5" strokeWidth={2.2} />
                            Cancelar esta cita
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recetas firmadas */}
          {recetas.length > 0 && (
            <div>
              <Eyebrow tone="validation">Recetas firmadas</Eyebrow>
              <h2 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
                {recetas.length} receta{recetas.length === 1 ? "" : "s"} en tu expediente
              </h2>

              <div className="mt-6 space-y-3">
                {recetas.map((r) => {
                  const fecha = new Date(r.fecha_emision);
                  const med = pickMedico(r.profiles);
                  return (
                    <div key={r.id} className="lg-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Pill
                              className="h-3.5 w-3.5 text-validation"
                              strokeWidth={2.2}
                            />
                            <p className="text-body-sm font-semibold text-ink-strong">
                              {r.diagnostico.length > 80
                                ? `${r.diagnostico.slice(0, 80)}…`
                                : r.diagnostico}
                            </p>
                          </div>
                          <p className="mt-1 text-caption text-ink-muted">
                            {fecha.toLocaleDateString("es-MX", {
                              timeZone: TZ,
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}{" "}
                            · {med.nombre ?? "Tu médico"}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-validation-soft px-2 py-0.5 text-caption text-validation">
                          <CheckCircle2 className="mr-1 h-3 w-3" strokeWidth={2.2} />
                          Firmada
                        </span>
                      </div>
                      <p className="mt-3 text-caption text-ink-soft">
                        Para descargar el PDF de esta receta, solicítaselo
                        directamente a tu médico.
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Historial pasado */}
          {citasPasadas.length > 0 && (
            <div>
              <Eyebrow>Historial</Eyebrow>
              <h2 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
                {citasPasadas.length} cita{citasPasadas.length === 1 ? "" : "s"} anterior{citasPasadas.length === 1 ? "" : "es"}
              </h2>

              <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
                <table className="min-w-full divide-y divide-line">
                  <thead className="bg-surface-alt">
                    <tr>
                      <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                        Médico
                      </th>
                      <th className="px-4 py-3 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {citasPasadas.map((c) => {
                      const med = pickMedico(c.profiles);
                      const stat = STATUS_META[c.status] ?? STATUS_META.completada;
                      return (
                        <tr key={c.id}>
                          <td className="px-4 py-3 text-body-sm text-ink-strong">
                            {new Date(c.fecha_inicio).toLocaleDateString(
                              "es-MX",
                              {
                                timeZone: TZ,
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="px-4 py-3 text-body-sm text-ink-muted">
                            {med.nombre ?? "—"}
                            {med.especialidad ? ` · ${med.especialidad}` : ""}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-caption font-medium ${stat.cls}`}
                            >
                              {stat.label === "No asistió" && (
                                <UserX
                                  className="mr-1 h-3 w-3"
                                  strokeWidth={2.2}
                                />
                              )}
                              {stat.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {citas.length === 0 && recetas.length === 0 && (
            <div className="lg-card text-center">
              <Calendar
                className="mx-auto h-10 w-10 text-ink-quiet"
                strokeWidth={1.5}
              />
              <p className="mt-3 text-body-sm text-ink-muted">
                No encontramos información clínica asociada a {email}.
              </p>
            </div>
          )}

          {/* ARCO */}
          <div className="lg-card border-warn-soft">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-warn"
                strokeWidth={2}
              />
              <div className="space-y-2">
                <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
                  Tus derechos ARCO
                </h3>
                <p className="text-body-sm text-ink-muted leading-relaxed">
                  Tienes derecho a <strong>Acceder</strong> a tu información (lo
                  estás haciendo ahora), <strong>Rectificar</strong> datos
                  incorrectos, <strong>Cancelar</strong> el tratamiento de tus
                  datos u <strong>Oponerte</strong> a usos específicos.
                </p>
                <p className="text-caption text-ink-muted">
                  Para ejercer Rectificación, Cancelación u Oposición, envía un
                  correo a{" "}
                  <a
                    href="mailto:compras@grupoprodi.net?subject=Solicitud%20ARCO%20%C2%B7%20LitienGuard"
                    className="font-semibold text-accent underline"
                  >
                    compras@grupoprodi.net
                  </a>{" "}
                  con tu nombre completo, descripción clara del derecho que
                  deseas ejercer y los datos involucrados. Responderemos en
                  máximo 20 días hábiles conforme al artículo 32 LFPDPPP.
                </p>
              </div>
            </div>
          </div>

          <p className="text-caption text-ink-soft leading-relaxed">
            Esta sesión expira el{" "}
            <strong>
              {new Date(tokenRow.expires_at).toLocaleString("es-MX", {
                timeZone: TZ,
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </strong>
            . Puedes volver a solicitar acceso desde{" "}
            <Link href="/paciente" className="text-accent underline">
              /paciente
            </Link>{" "}
            cuando quieras.
          </p>
        </div>
      </section>
    </>
  );
}
