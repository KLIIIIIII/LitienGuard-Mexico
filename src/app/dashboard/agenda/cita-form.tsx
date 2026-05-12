"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { createCita, updateCita, type CitaInput } from "./actions";

const TIPOS = [
  "Primera vez",
  "Seguimiento",
  "Urgencia",
  "Procedimiento",
  "Telemedicina",
];

const DURACIONES = [
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1 h 30 min" },
  { value: 120, label: "2 horas" },
];

interface InitialCita {
  id: string;
  paciente_nombre: string;
  paciente_apellido_paterno: string | null;
  paciente_apellido_materno: string | null;
  paciente_email: string | null;
  paciente_telefono: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_consulta: string | null;
  motivo: string | null;
  notas_internas: string | null;
}

interface CitaFormProps {
  mode: "create" | "edit";
  defaultDate?: string;
  initial?: InitialCita;
}

function toLocalDatetimeInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // datetime-local expects YYYY-MM-DDTHH:mm in local time
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalDatetimeInputToIso(local: string): string {
  if (!local) return "";
  // The local datetime input has no timezone; new Date(local) interprets it as local.
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function minutesBetween(a: string, b: string): number {
  if (!a || !b) return 30;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(15, Math.round(ms / 60000));
}

function defaultStartFor(date?: string): string {
  const base = date ? new Date(date) : new Date();
  // Default to 9:00 AM on the given date (or today)
  base.setHours(9, 0, 0, 0);
  return toLocalDatetimeInput(base.toISOString());
}

function addMinutes(localIso: string, minutes: number): string {
  const d = new Date(localIso);
  d.setMinutes(d.getMinutes() + minutes);
  return toLocalDatetimeInput(d.toISOString());
}

export function CitaForm({ mode, defaultDate, initial }: CitaFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [paciente_nombre, setNombre] = useState(initial?.paciente_nombre ?? "");
  const [paciente_apellido_paterno, setApPaterno] = useState(
    initial?.paciente_apellido_paterno ?? "",
  );
  const [paciente_apellido_materno, setApMaterno] = useState(
    initial?.paciente_apellido_materno ?? "",
  );
  const [paciente_email, setEmail] = useState(initial?.paciente_email ?? "");
  const [paciente_telefono, setTelefono] = useState(
    initial?.paciente_telefono ?? "",
  );
  const [fechaInicioLocal, setFechaInicio] = useState(
    initial ? toLocalDatetimeInput(initial.fecha_inicio) : defaultStartFor(defaultDate),
  );
  const [duracion, setDuracion] = useState<number>(
    initial
      ? minutesBetween(initial.fecha_inicio, initial.fecha_fin)
      : 30,
  );
  const [tipo_consulta, setTipo] = useState(initial?.tipo_consulta ?? TIPOS[0]);
  const [motivo, setMotivo] = useState(initial?.motivo ?? "");
  const [notas_internas, setNotas] = useState(initial?.notas_internas ?? "");

  const fechaFinLocal = fechaInicioLocal
    ? addMinutes(fechaInicioLocal, duracion)
    : "";

  // Keep duración options reasonable based on input changes
  useEffect(() => {
    if (!DURACIONES.find((d) => d.value === duracion)) {
      setDuracion(30);
    }
  }, [duracion]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fechaInicioIso = fromLocalDatetimeInputToIso(fechaInicioLocal);
    const fechaFinIso = fromLocalDatetimeInputToIso(fechaFinLocal);
    if (!fechaInicioIso || !fechaFinIso) {
      setError("Captura una fecha y hora válidas.");
      return;
    }

    const payload: CitaInput = {
      paciente_nombre: paciente_nombre.trim(),
      paciente_apellido_paterno: paciente_apellido_paterno.trim(),
      paciente_apellido_materno: paciente_apellido_materno.trim(),
      paciente_email: paciente_email.trim(),
      paciente_telefono: paciente_telefono.trim(),
      fecha_inicio: fechaInicioIso,
      fecha_fin: fechaFinIso,
      tipo_consulta: tipo_consulta.trim(),
      motivo: motivo.trim(),
      notas_internas: notas_internas.trim(),
    };

    startTransition(async () => {
      const r =
        mode === "create"
          ? await createCita(payload)
          : await updateCita(initial!.id, payload);
      if (r.status === "ok") {
        router.push(`/dashboard/agenda/${r.citaId}`);
      } else {
        setError(r.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="lg-card space-y-4">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Paciente
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Nombre(s) <span className="text-rose">*</span>
            </label>
            <input
              type="text"
              required
              value={paciente_nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={120}
              disabled={pending}
              className="lg-input"
              placeholder="Juan Carlos"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Apellido paterno
            </label>
            <input
              type="text"
              value={paciente_apellido_paterno}
              onChange={(e) => setApPaterno(e.target.value)}
              maxLength={80}
              disabled={pending}
              className="lg-input"
              placeholder="Hernández"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Apellido materno
            </label>
            <input
              type="text"
              value={paciente_apellido_materno}
              onChange={(e) => setApMaterno(e.target.value)}
              maxLength={80}
              disabled={pending}
              className="lg-input"
              placeholder="López"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Correo (para recordatorios)
            </label>
            <input
              type="email"
              value={paciente_email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
              disabled={pending}
              className="lg-input"
              placeholder="paciente@ejemplo.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Teléfono
            </label>
            <input
              type="tel"
              value={paciente_telefono}
              onChange={(e) => setTelefono(e.target.value)}
              maxLength={30}
              disabled={pending}
              className="lg-input"
              placeholder="55 1234 5678"
            />
          </div>
        </div>
      </section>

      <section className="lg-card space-y-4">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Horario
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Fecha y hora de inicio <span className="text-rose">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={fechaInicioLocal}
              onChange={(e) => setFechaInicio(e.target.value)}
              disabled={pending}
              className="lg-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Duración
            </label>
            <select
              value={duracion}
              onChange={(e) => setDuracion(Number(e.target.value))}
              disabled={pending}
              className="lg-input"
            >
              {DURACIONES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Tipo de consulta
            </label>
            <select
              value={tipo_consulta}
              onChange={(e) => setTipo(e.target.value)}
              disabled={pending}
              className="lg-input"
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-caption text-ink-soft">
          Termina:{" "}
          {fechaFinLocal
            ? new Date(fechaFinLocal).toLocaleString("es-MX", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })
            : "—"}
        </p>
      </section>

      <section className="lg-card space-y-4">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Motivo y notas
        </h2>
        <div className="space-y-1.5">
          <label className="block text-caption font-medium text-ink-strong">
            Motivo de consulta (visible para el paciente)
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            maxLength={500}
            disabled={pending}
            className="lg-input resize-y"
            placeholder="Control glucémico trimestral con resultados de laboratorio recientes"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-caption font-medium text-ink-strong">
            Notas internas (privadas, solo tú las ves)
          </label>
          <textarea
            value={notas_internas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
            maxLength={1000}
            disabled={pending}
            className="lg-input resize-y"
            placeholder="Paciente prefiere agendar antes del mediodía. Revisar plan farmacológico."
          />
        </div>
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong">
          <AlertCircle className="h-4 w-4 text-rose" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="lg-cta-primary disabled:opacity-60"
        >
          {pending
            ? "Guardando…"
            : mode === "create"
              ? "Agendar cita"
              : "Guardar cambios"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={pending}
          className="lg-cta-ghost"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
