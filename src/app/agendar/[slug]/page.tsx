import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Stethoscope, MapPin, Phone } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { computeAvailableSlots, type BusyInterval } from "@/lib/booking-slots";
import { PageHero } from "@/components/page-hero";
import { Eyebrow } from "@/components/eyebrow";
import { BookingFlow } from "./booking-flow";

export const metadata: Metadata = {
  title: "Agendar cita — LitienGuard",
};

export const dynamic = "force-dynamic";
export const revalidate = 60; // refresh slots every minute

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = getSupabaseAdmin();
  if (!admin) notFound();

  const { data: medico } = await admin
    .from("profiles")
    .select(
      "id,nombre,especialidad,consultorio_nombre,consultorio_direccion,consultorio_telefono,booking_bio,booking_workdays,booking_hour_start,booking_hour_end,booking_slot_minutes,booking_advance_days,accepts_public_bookings",
    )
    .eq("booking_slug", slug)
    .single();

  if (!medico || !medico.accepts_public_bookings) {
    notFound();
  }

  // Fetch busy intervals within the booking window
  const advanceDays = medico.booking_advance_days ?? 14;
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + advanceDays + 1);

  const { data: busyRows } = await admin
    .from("citas")
    .select("fecha_inicio,fecha_fin")
    .eq("medico_id", medico.id)
    .in("status", ["agendada", "confirmada"])
    .lt("fecha_inicio", windowEnd.toISOString());

  const busy: BusyInterval[] = (busyRows ?? []).map((b) => ({
    fecha_inicio: b.fecha_inicio,
    fecha_fin: b.fecha_fin,
  }));

  const slotsByDay = computeAvailableSlots(
    {
      workdays: medico.booking_workdays ?? [1, 2, 3, 4, 5],
      hour_start: medico.booking_hour_start ?? 9,
      hour_end: medico.booking_hour_end ?? 18,
      slot_minutes: medico.booking_slot_minutes ?? 30,
      advance_days: advanceDays,
    },
    busy,
  );

  return (
    <>
      <PageHero
        eyebrow="Reservar cita"
        title={
          <>
            Con{" "}
            <span className="lg-serif-italic text-validation">
              {medico.nombre ?? "Profesional"}
            </span>
          </>
        }
        description={medico.especialidad ?? "Selecciona el horario que te conviene y confirma tu cita."}
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-12">
        <div className="lg-shell grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          {/* Sidebar with practitioner info */}
          <aside className="lg-card sticky top-[88px] space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-validation-soft text-validation">
                <Stethoscope className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                  Profesional
                </p>
                <p className="mt-0.5 text-body-sm font-semibold text-ink-strong">
                  {medico.nombre ?? "—"}
                </p>
                {medico.especialidad && (
                  <p className="text-caption text-ink-muted">
                    {medico.especialidad}
                  </p>
                )}
              </div>
            </div>

            {medico.booking_bio && (
              <p className="text-body-sm text-ink-muted leading-relaxed">
                {medico.booking_bio}
              </p>
            )}

            <div className="space-y-2 border-t border-line pt-4">
              {medico.consultorio_nombre && (
                <p className="text-body-sm font-medium text-ink-strong">
                  {medico.consultorio_nombre}
                </p>
              )}
              {medico.consultorio_direccion && (
                <div className="flex items-start gap-2 text-caption text-ink-muted">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span>{medico.consultorio_direccion}</span>
                </div>
              )}
              {medico.consultorio_telefono && (
                <div className="flex items-center gap-2 text-caption text-ink-muted">
                  <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                  <span>{medico.consultorio_telefono}</span>
                </div>
              )}
            </div>
          </aside>

          {/* Booking flow */}
          <div>
            <Eyebrow tone="validation">Horarios disponibles</Eyebrow>
            <BookingFlow
              slug={slug}
              slotsByDay={slotsByDay}
              slotMinutes={medico.booking_slot_minutes ?? 30}
            />
          </div>
        </div>
      </section>
    </>
  );
}
