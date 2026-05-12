import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope, ArrowRight } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { PageHero } from "@/components/page-hero";
import { Eyebrow } from "@/components/eyebrow";
import { TiltCard } from "@/components/tilt-card";

export const metadata: Metadata = {
  title: "Agenda tu cita — LitienGuard",
  description:
    "Reserva tu cita médica en línea, sin llamadas, sin esperas. Selecciona el médico, elige el horario disponible y confirma en segundos.",
};

export const dynamic = "force-dynamic";

interface MedicoCard {
  booking_slug: string;
  nombre: string | null;
  especialidad: string | null;
  consultorio_nombre: string | null;
  consultorio_direccion: string | null;
  booking_bio: string | null;
}

export default async function AgendarIndexPage() {
  const supa = await createSupabaseServer();
  const { data: medicos } = await supa
    .from("profiles")
    .select(
      "booking_slug,nombre,especialidad,consultorio_nombre,consultorio_direccion,booking_bio",
    )
    .eq("accepts_public_bookings", true)
    .not("booking_slug", "is", null)
    .order("nombre");

  const list = (medicos as MedicoCard[] | null) ?? [];

  return (
    <>
      <PageHero
        eyebrow="Agenda tu cita"
        title={
          <>
            Reserva tu consulta{" "}
            <span className="lg-serif-italic text-validation">en línea</span>,
            sin esperas.
          </>
        }
        description="Selecciona al profesional que necesitas, elige el horario que te conviene y confirma tu cita en segundos. Sin llamadas. Sin filas."
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-16">
        <div className="lg-shell">
          <Eyebrow>Profesionales disponibles</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            {list.length === 0
              ? "Próximamente"
              : `${list.length} profesional${list.length === 1 ? "" : "es"} con reservación abierta.`}
          </h2>

          {list.length === 0 ? (
            <p className="mt-6 max-w-prose text-body text-ink-muted">
              Estamos abriendo el sistema de reservaciones con profesionales del
              piloto. Pronto verás aquí especialistas con horarios disponibles
              para agendar directamente.
            </p>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((m) => (
                <TiltCard
                  key={m.booking_slug}
                  className="flex flex-col gap-3 p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-validation-soft text-validation">
                      <Stethoscope className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
                        {m.nombre ?? "Profesional"}
                      </h3>
                      {m.especialidad && (
                        <p className="mt-0.5 text-caption text-ink-muted">
                          {m.especialidad}
                        </p>
                      )}
                    </div>
                  </div>

                  {m.booking_bio && (
                    <p className="text-body-sm text-ink-muted leading-relaxed">
                      {m.booking_bio}
                    </p>
                  )}

                  {m.consultorio_nombre && (
                    <p className="text-caption text-ink-soft">
                      {m.consultorio_nombre}
                      {m.consultorio_direccion ? ` · ${m.consultorio_direccion}` : ""}
                    </p>
                  )}

                  <div className="mt-auto pt-3">
                    <Link
                      href={`/agendar/${m.booking_slug}`}
                      className="inline-flex items-center gap-1.5 text-caption font-semibold text-validation"
                    >
                      Reservar cita
                      <ArrowRight className="h-3 w-3" strokeWidth={2.2} />
                    </Link>
                  </div>
                </TiltCard>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-line bg-warn-soft/30 py-10">
        <div className="lg-shell">
          <p className="text-caption text-ink-muted leading-relaxed max-w-prose">
            La reservación de citas en LitienGuard es gratuita para pacientes.
            En caso de emergencia médica, llama al 911 — esta plataforma no
            sustituye atención médica de urgencia.
          </p>
        </div>
      </section>
    </>
  );
}
