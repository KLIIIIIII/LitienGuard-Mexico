"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertCircle, Copy, ExternalLink } from "lucide-react";
import { updateBookingConfig } from "./actions";

const WORKDAYS = [
  { id: 1, label: "Lun" },
  { id: 2, label: "Mar" },
  { id: 3, label: "Mié" },
  { id: 4, label: "Jue" },
  { id: 5, label: "Vie" },
  { id: 6, label: "Sáb" },
  { id: 7, label: "Dom" },
];

const SLOT_OPTIONS = [
  { v: 15, label: "15 min" },
  { v: 20, label: "20 min" },
  { v: 30, label: "30 min" },
  { v: 45, label: "45 min" },
  { v: 60, label: "1 hora" },
];

interface BookingFormProps {
  initial: {
    accepts_public_bookings: boolean;
    booking_slug: string | null;
    booking_workdays: number[];
    booking_hour_start: number;
    booking_hour_end: number;
    booking_slot_minutes: number;
    booking_advance_days: number;
    booking_bio: string | null;
  };
  siteUrl: string;
}

export function BookingForm({ initial, siteUrl }: BookingFormProps) {
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(initial.accepts_public_bookings);
  const [slug, setSlug] = useState(initial.booking_slug ?? "");
  const [workdays, setWorkdays] = useState<number[]>(
    initial.booking_workdays?.length ? initial.booking_workdays : [1, 2, 3, 4, 5],
  );
  const [hourStart, setHourStart] = useState(initial.booking_hour_start ?? 9);
  const [hourEnd, setHourEnd] = useState(initial.booking_hour_end ?? 18);
  const [slotMin, setSlotMin] = useState(initial.booking_slot_minutes ?? 30);
  const [advanceDays, setAdvanceDays] = useState(initial.booking_advance_days ?? 14);
  const [bio, setBio] = useState(initial.booking_bio ?? "");
  const [feedback, setFeedback] = useState<
    | { type: "ok"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);
  const [copied, setCopied] = useState(false);

  const bookingUrl = slug ? `${siteUrl}/agendar/${slug}` : null;

  function toggleWorkday(id: number) {
    setWorkdays((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id].sort(),
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (hourEnd <= hourStart) {
      setFeedback({ type: "error", message: "La hora de fin debe ser mayor que la de inicio." });
      return;
    }
    if (workdays.length === 0 && enabled) {
      setFeedback({ type: "error", message: "Selecciona al menos un día de la semana." });
      return;
    }

    startTransition(async () => {
      const r = await updateBookingConfig({
        accepts_public_bookings: enabled,
        booking_slug: slug.trim() || null,
        booking_workdays: workdays,
        booking_hour_start: hourStart,
        booking_hour_end: hourEnd,
        booking_slot_minutes: slotMin,
        booking_advance_days: advanceDays,
        booking_bio: bio.trim() || null,
      });
      if (r.status === "ok") {
        setFeedback({ type: "ok", message: "Configuración guardada." });
      } else {
        setFeedback({ type: "error", message: r.message });
      }
    });
  }

  function copyLink() {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <form onSubmit={onSubmit} className="lg-card space-y-5">
      <div>
        <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
          Reservación pública de citas
        </h2>
        <p className="mt-1 text-body-sm text-ink-muted">
          Comparte un link público para que tus pacientes agenden su cita
          directamente, sin tener que escribirte. Las citas reservadas aparecen
          en tu agenda automáticamente.
        </p>
      </div>

      {/* Toggle */}
      <label className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface-alt px-4 py-3 cursor-pointer">
        <div>
          <p className="text-body-sm font-semibold text-ink-strong">
            Aceptar reservaciones públicas
          </p>
          <p className="text-caption text-ink-muted">
            Cuando está activo, tus pacientes pueden agendar desde el link
            público sin crear cuenta.
          </p>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          disabled={pending}
          className="h-5 w-5 accent-validation"
        />
      </label>

      {/* Slug */}
      <div className="space-y-1.5">
        <label className="block text-caption font-medium text-ink-strong">
          Identificador en URL (slug)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-caption text-ink-soft">
            litien-guard-mexico.vercel.app/agendar/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            placeholder="dr-juan-hernandez"
            maxLength={60}
            disabled={pending}
            className="lg-input max-w-[260px]"
          />
        </div>
        <p className="text-caption text-ink-soft">
          Solo letras minúsculas, números y guiones. Debe ser único.
        </p>
      </div>

      {/* Bio */}
      <div className="space-y-1.5">
        <label className="block text-caption font-medium text-ink-strong">
          Descripción (opcional)
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={pending}
          placeholder="Cardiólogo intervencionista con 15 años de experiencia. Atiendo principalmente cardiopatía isquémica, hipertensión y rehabilitación post-IAM."
          className="lg-input resize-y"
        />
        <p className="text-caption text-ink-soft">
          Aparece en tu página pública de reservación. Una o dos líneas
          ayudan al paciente a saber si eres el indicado.
        </p>
      </div>

      {/* Workdays */}
      <div className="space-y-2">
        <label className="block text-caption font-medium text-ink-strong">
          Días que atiendes
        </label>
        <div className="flex flex-wrap gap-2">
          {WORKDAYS.map((d) => {
            const isOn = workdays.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleWorkday(d.id)}
                disabled={pending}
                className={`rounded-lg border px-3 py-1.5 text-caption font-medium transition-all ${
                  isOn
                    ? "border-validation bg-validation-soft text-validation"
                    : "border-line bg-surface text-ink-muted hover:border-line-strong"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hours + slot */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="block text-caption font-medium text-ink-strong">
            Hora de inicio
          </label>
          <select
            value={hourStart}
            onChange={(e) => setHourStart(Number(e.target.value))}
            disabled={pending}
            className="lg-input"
          >
            {Array.from({ length: 23 }, (_, i) => i).map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-caption font-medium text-ink-strong">
            Hora de fin
          </label>
          <select
            value={hourEnd}
            onChange={(e) => setHourEnd(Number(e.target.value))}
            disabled={pending}
            className="lg-input"
          >
            {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-caption font-medium text-ink-strong">
            Duración de cita
          </label>
          <select
            value={slotMin}
            onChange={(e) => setSlotMin(Number(e.target.value))}
            disabled={pending}
            className="lg-input"
          >
            {SLOT_OPTIONS.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advance days */}
      <div className="space-y-1.5">
        <label className="block text-caption font-medium text-ink-strong">
          ¿Con cuántos días de anticipación puede agendar el paciente?
        </label>
        <select
          value={advanceDays}
          onChange={(e) => setAdvanceDays(Number(e.target.value))}
          disabled={pending}
          className="lg-input max-w-[200px]"
        >
          {[7, 14, 21, 30, 45, 60].map((d) => (
            <option key={d} value={d}>
              {d} días
            </option>
          ))}
        </select>
      </div>

      {/* Booking link display */}
      {bookingUrl && enabled && (
        <div className="rounded-lg border border-validation-soft bg-validation-soft/50 px-4 py-3">
          <p className="text-caption font-semibold text-validation">
            Tu link público
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded bg-surface px-2 py-1 font-mono text-caption text-ink-strong break-all">
              {bookingUrl}
            </code>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-caption text-ink-strong hover:bg-surface-alt"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-validation" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </button>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-caption text-ink-strong hover:bg-surface-alt"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir
            </a>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-caption ${
            feedback.type === "ok"
              ? "border-validation-soft bg-validation-soft text-validation"
              : "border-rose-soft bg-rose-soft text-ink-strong"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {feedback.message}
        </div>
      )}

      <button type="submit" disabled={pending} className="lg-cta-primary disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar configuración"}
      </button>
    </form>
  );
}
