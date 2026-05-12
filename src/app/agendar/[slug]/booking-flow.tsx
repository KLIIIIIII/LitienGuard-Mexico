"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { CheckCircle2, Calendar, Clock, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { formatSlotDate, formatSlotTime, type SlotsByDay } from "@/lib/booking-slots";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { bookPublicCita, type BookingResult } from "./actions";

interface BookingFlowProps {
  slug: string;
  slotsByDay: SlotsByDay[];
  slotMinutes: number;
}

type Step = "pick-slot" | "patient-info" | "success";

export function BookingFlow({ slug, slotsByDay, slotMinutes }: BookingFlowProps) {
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

  const [step, setStep] = useState<Step>("pick-slot");
  const [pending, startTransition] = useTransition();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    Extract<BookingResult, { status: "ok" }> | null
  >(null);

  const [nombre, setNombre] = useState("");
  const [apellidoP, setApellidoP] = useState("");
  const [apellidoM, setApellidoM] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [motivo, setMotivo] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const onToken = useCallback((t: string | null) => setTurnstileToken(t), []);

  const slotEnd = useMemo(() => {
    if (!selectedSlot) return null;
    const d = new Date(selectedSlot);
    return new Date(d.getTime() + slotMinutes * 60_000).toISOString();
  }, [selectedSlot, slotMinutes]);

  function onSelectSlot(iso: string) {
    setSelectedSlot(iso);
    setStep("patient-info");
    setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedSlot || !slotEnd) {
      setError("Selecciona primero un horario.");
      return;
    }
    startTransition(async () => {
      const r = await bookPublicCita(
        slug,
        {
          paciente_nombre: nombre.trim(),
          paciente_apellido_paterno: apellidoP.trim(),
          paciente_apellido_materno: apellidoM.trim(),
          paciente_email: email.trim(),
          paciente_telefono: telefono.trim(),
          motivo: motivo.trim(),
          slot_inicio: selectedSlot,
          slot_fin: slotEnd,
        },
        turnstileToken,
      );
      if (r.status === "ok") {
        setResult(r);
        setStep("success");
      } else {
        setError(r.message);
      }
    });
  }

  if (step === "success" && result) {
    return (
      <div className="lg-card mt-3">
        <div className="flex flex-col items-center text-center py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-validation-soft">
            <CheckCircle2 className="h-7 w-7 text-validation" strokeWidth={2} />
          </div>
          <h2 className="mt-5 text-h2 font-semibold tracking-tight text-ink-strong">
            Tu cita está confirmada.
          </h2>
          <p className="mt-3 max-w-md text-body text-ink-muted">
            Te enviamos los detalles a <strong>{email}</strong>. Nos vemos el día
            de tu cita.
          </p>
          <div className="mt-5 rounded-xl border border-line bg-surface-alt px-5 py-4 text-body-sm">
            <p className="flex items-center justify-center gap-2 font-semibold text-ink-strong">
              <Calendar className="h-4 w-4 text-validation" strokeWidth={2} />
              {formatSlotDate(result.slot_inicio.slice(0, 10))}
            </p>
            <p className="mt-1 flex items-center justify-center gap-2 text-ink-muted">
              <Clock className="h-4 w-4" strokeWidth={2} />
              {formatSlotTime(result.slot_inicio)} hrs · con {result.medico_nombre}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "patient-info" && selectedSlot) {
    const dateStr = formatSlotDate(selectedSlot.slice(0, 10));
    const timeStr = formatSlotTime(selectedSlot);

    return (
      <form onSubmit={onSubmit} className="mt-3 space-y-5">
        <div className="lg-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                Cita seleccionada
              </p>
              <p className="mt-1 text-body-sm font-semibold text-ink-strong">
                {dateStr}, {timeStr} hrs
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep("pick-slot");
                setSelectedSlot(null);
              }}
              className="inline-flex items-center gap-1 text-caption text-validation hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Cambiar
            </button>
          </div>
        </div>

        <div className="lg-card space-y-4">
          <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
            Tus datos
          </h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="block text-caption font-medium text-ink-strong">
                Nombre(s) <span className="text-rose">*</span>
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={120}
                disabled={pending}
                className="lg-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-caption font-medium text-ink-strong">
                Apellido paterno
              </label>
              <input
                type="text"
                value={apellidoP}
                onChange={(e) => setApellidoP(e.target.value)}
                maxLength={80}
                disabled={pending}
                className="lg-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-caption font-medium text-ink-strong">
                Apellido materno
              </label>
              <input
                type="text"
                value={apellidoM}
                onChange={(e) => setApellidoM(e.target.value)}
                maxLength={80}
                disabled={pending}
                className="lg-input"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-caption font-medium text-ink-strong">
                Correo <span className="text-rose">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={200}
                disabled={pending}
                placeholder="tu.correo@ejemplo.com"
                className="lg-input"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-caption font-medium text-ink-strong">
                Teléfono <span className="text-rose">*</span>
              </label>
              <input
                type="tel"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                maxLength={30}
                disabled={pending}
                placeholder="55 1234 5678"
                className="lg-input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Motivo de la consulta <span className="text-ink-soft">(opcional)</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={pending}
              placeholder="Describe brevemente el motivo de tu consulta..."
              className="lg-input resize-y"
            />
          </div>

          {turnstileSiteKey && (
            <TurnstileWidget siteKey={turnstileSiteKey} onToken={onToken} />
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong">
              <AlertCircle className="h-4 w-4 text-rose" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              pending ||
              !nombre.trim() ||
              !email.trim() ||
              !telefono.trim() ||
              (!!turnstileSiteKey && !turnstileToken)
            }
            className="lg-cta-primary w-full justify-center disabled:opacity-60"
          >
            {pending ? "Confirmando…" : "Confirmar reservación"}
            {!pending && <ArrowRight className="h-4 w-4" strokeWidth={2} />}
          </button>

          <p className="text-caption text-ink-soft leading-relaxed">
            Al confirmar aceptas nuestro{" "}
            <a href="/aviso-privacidad" className="underline">
              aviso de privacidad
            </a>
            . Tus datos clínicos viven en una arquitectura construida
            siguiendo los lineamientos de la LFPDPPP.
          </p>
        </div>
      </form>
    );
  }

  // Step: pick-slot
  if (slotsByDay.length === 0) {
    return (
      <div className="lg-card mt-3 text-center py-10">
        <Calendar
          className="mx-auto h-10 w-10 text-ink-quiet"
          strokeWidth={1.5}
        />
        <h3 className="mt-3 text-h3 font-semibold text-ink-strong">
          Sin horarios disponibles
        </h3>
        <p className="mt-1 text-body-sm text-ink-muted">
          Este profesional no tiene horarios disponibles en las próximas
          semanas. Por favor, intenta más tarde o contacta directamente al
          consultorio.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-4">
      <p className="text-body-sm text-ink-muted">
        Selecciona el día y la hora que te conviene. Cada cita dura {slotMinutes} min.
      </p>

      <div className="space-y-3">
        {slotsByDay.map((day) => (
          <div
            key={day.date}
            className="rounded-xl border border-line bg-surface p-4"
          >
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
              {formatSlotDate(day.date)}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {day.slots.map((iso) => (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onSelectSlot(iso)}
                  className="rounded-lg border border-line bg-surface px-3 py-2 text-body-sm font-medium text-ink-strong transition-colors hover:border-validation hover:bg-validation-soft hover:text-validation"
                >
                  {formatSlotTime(iso)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
