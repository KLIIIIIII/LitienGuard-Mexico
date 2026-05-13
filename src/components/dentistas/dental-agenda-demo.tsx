import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Plus,
  Globe,
  ChevronRight,
} from "lucide-react";
import { AppChrome } from "@/components/demos/app-chrome";

/**
 * Demo dual de la agenda dental:
 *   1. Vista del dentista: semana laboral con citas marcadas
 *   2. Vista del paciente: portal público de reservación tipo Calendly
 *
 * Ambas son réplicas fieles de lo que existe en la app real
 * (/dashboard/agenda y /agendar/[slug]). Envueltas en AppChrome
 * para que se lea como screenshot real, no como mockup genérico.
 */

interface Cita {
  hora: string;
  paciente: string;
  motivo: string;
  duracion: number; // minutos
  status: "confirmada" | "agendada";
}

interface DiaSemana {
  dia: string;
  fecha: string;
  citas: number;
  today?: boolean;
}

const SEMANA: DiaSemana[] = [
  { dia: "Lun", fecha: "12", citas: 4 },
  { dia: "Mar", fecha: "13", citas: 6, today: true },
  { dia: "Mié", fecha: "14", citas: 3 },
  { dia: "Jue", fecha: "15", citas: 5 },
  { dia: "Vie", fecha: "16", citas: 4 },
];

const CITAS_HOY: Cita[] = [
  {
    hora: "09:00",
    paciente: "María García L.",
    motivo: "Control ortodoncia",
    duracion: 30,
    status: "confirmada",
  },
  {
    hora: "10:00",
    paciente: "Juan Hernández M.",
    motivo: "Higiene + revisión",
    duracion: 45,
    status: "confirmada",
  },
  {
    hora: "11:30",
    paciente: "Ana Ramírez T.",
    motivo: "Resina 16 + 26",
    duracion: 60,
    status: "agendada",
  },
  {
    hora: "13:00",
    paciente: "Luis Sánchez G.",
    motivo: "Revisión prótesis",
    duracion: 30,
    status: "confirmada",
  },
  {
    hora: "16:00",
    paciente: "Carmen Rodríguez",
    motivo: "Blanqueamiento sesión 2",
    duracion: 60,
    status: "confirmada",
  },
];

interface Slot {
  hora: string;
  label: string;
  highlight?: boolean;
}

const SLOTS_DISPONIBLES: Slot[] = [
  { hora: "08:00", label: "8:00 am" },
  { hora: "11:00", label: "11:00 am" },
  { hora: "12:30", label: "12:30 pm" },
  { hora: "14:30", label: "2:30 pm", highlight: true },
  { hora: "15:30", label: "3:30 pm" },
  { hora: "17:30", label: "5:30 pm" },
];

export function DentalAgendaDemo() {
  return (
    <div className="space-y-6">
      {/* PRIMERA VISTA — agenda del dentista */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-validation-soft via-accent-soft to-transparent opacity-50 blur-3xl"
        />

        <AppChrome
          path="dashboard/agenda"
          breadcrumb={["Dashboard", "Agenda", "Semana del 12 may"]}
          badge="Vista semanal"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            {/* LEFT — Semana compacta */}
            <section className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                    Semana 19 · Mayo
                  </p>
                  <p className="mt-1 text-body-sm font-semibold text-ink-strong">
                    Dra. Pamela Sandoval
                  </p>
                  <p className="text-caption text-ink-muted leading-snug">
                    22 citas confirmadas · 4 slots libres
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-validation-soft px-2 py-0.5 text-[0.6rem] font-bold text-validation">
                  <Calendar className="h-2.5 w-2.5" strokeWidth={2.4} />
                  Lun–Vie
                </span>
              </div>

              {/* Días de la semana con conteo */}
              <div className="grid grid-cols-5 gap-2">
                {SEMANA.map((d) => (
                  <div
                    key={d.dia}
                    className={`rounded-lg border px-2 py-3 text-center transition-colors ${
                      d.today
                        ? "border-validation bg-validation-soft"
                        : "border-line bg-surface"
                    }`}
                  >
                    <p
                      className={`text-[0.6rem] uppercase tracking-eyebrow font-bold ${
                        d.today ? "text-validation" : "text-ink-soft"
                      }`}
                    >
                      {d.dia}
                    </p>
                    <p
                      className={`mt-1 font-mono text-body-sm font-bold ${
                        d.today ? "text-validation" : "text-ink-strong"
                      }`}
                    >
                      {d.fecha}
                    </p>
                    <p className="mt-1 text-[0.6rem] text-ink-muted">
                      {d.citas} citas
                    </p>
                  </div>
                ))}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-surface-alt px-3 py-2.5">
                <Stat label="Hoy" value="6" />
                <Stat label="Semana" value="22" />
                <Stat label="No-shows" value="0" tone="validation" />
              </div>
            </section>

            {/* RIGHT — Citas del día */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calendar
                    className="h-3.5 w-3.5 text-validation"
                    strokeWidth={2.2}
                  />
                  <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-validation">
                    Martes 13 de mayo
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full bg-validation-soft px-2 py-0.5 text-[0.6rem] font-bold text-validation"
                  disabled
                >
                  <Plus className="h-2.5 w-2.5" strokeWidth={2.4} />
                  Nueva cita
                </button>
              </div>

              <div className="space-y-1.5">
                {CITAS_HOY.map((c, i) => (
                  <CitaRow key={i} cita={c} />
                ))}
              </div>
            </section>
          </div>
        </AppChrome>
      </div>

      {/* SEGUNDA VISTA — portal público de reservación */}
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-accent-soft via-warn-soft to-transparent opacity-40 blur-3xl"
        />

        <AppChrome
          path="agendar/dra-sandoval"
          breadcrumb={["litienguard.mx", "agendar", "Dra. Sandoval"]}
          badge="Lo que ven tus pacientes"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            {/* LEFT — Perfil público del dentista */}
            <section className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Globe
                  className="h-3.5 w-3.5 text-accent"
                  strokeWidth={2.2}
                />
                <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-accent">
                  Reservación pública · sin login
                </p>
              </div>

              <div className="rounded-xl border border-line bg-surface px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-body-sm font-bold text-accent">
                    PS
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-bold text-ink-strong">
                      Dra. Pamela Sandoval
                    </p>
                    <p className="text-caption text-ink-muted">
                      Odontología general · Cédula 7842316
                    </p>
                    <p className="mt-1.5 text-caption text-ink-muted leading-snug">
                      Consulta privada en Polanco, CDMX. 12+ años de
                      experiencia, atención personalizada en español.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
                <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                  Datos del paciente
                </p>
                <div className="mt-2 space-y-1.5">
                  <div className="h-6 rounded border border-line bg-surface-alt px-2 text-[0.65rem] flex items-center text-ink-quiet">
                    Nombre completo
                  </div>
                  <div className="h-6 rounded border border-line bg-surface-alt px-2 text-[0.65rem] flex items-center text-ink-quiet">
                    Correo electrónico
                  </div>
                  <div className="h-6 rounded border border-line bg-surface-alt px-2 text-[0.65rem] flex items-center text-ink-quiet">
                    Teléfono · WhatsApp
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT — Slots disponibles */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock
                    className="h-3.5 w-3.5 text-validation"
                    strokeWidth={2.2}
                  />
                  <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-validation">
                    Horarios disponibles · Jue 15 may
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {SLOTS_DISPONIBLES.map((s) => (
                  <button
                    key={s.hora}
                    type="button"
                    disabled
                    className={`rounded-lg border px-2 py-2.5 text-caption font-semibold transition-colors ${
                      s.highlight
                        ? "border-validation bg-validation text-canvas"
                        : "border-line bg-surface text-ink-strong hover:border-validation-soft"
                    }`}
                  >
                    {s.label}
                    {s.highlight && (
                      <span className="ml-1">
                        <CheckCircle2
                          className="inline h-3 w-3"
                          strokeWidth={2.4}
                        />
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Confirmación destacada */}
              <div className="rounded-xl border border-validation bg-validation-soft/40 px-3 py-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-validation"
                    strokeWidth={2.4}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-caption font-bold text-ink-strong">
                      Jueves 15 de mayo · 2:30 PM
                    </p>
                    <p className="mt-0.5 text-[0.65rem] text-ink-muted leading-snug">
                      Recibirás confirmación por correo + recordatorio 24h
                      antes. Cancela hasta 4 horas antes sin costo.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-validation py-2 text-caption font-bold text-canvas"
                >
                  Confirmar reservación
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
              </div>
            </section>
          </div>
        </AppChrome>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "validation";
}) {
  return (
    <div className="text-center">
      <p
        className={`text-h3 font-bold tabular-nums leading-none ${
          tone === "validation" ? "text-validation" : "text-ink-strong"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[0.58rem] uppercase tracking-eyebrow text-ink-soft">
        {label}
      </p>
    </div>
  );
}

function CitaRow({ cita }: { cita: Cita }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2">
      <div className="shrink-0 text-right">
        <p className="font-mono text-[0.65rem] font-bold text-ink-strong leading-none">
          {cita.hora}
        </p>
        <p className="mt-0.5 text-[0.55rem] text-ink-soft">{cita.duracion}m</p>
      </div>
      <div className="h-8 w-px bg-line" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 shrink-0 text-ink-muted" strokeWidth={2} />
          <p className="truncate text-caption font-semibold text-ink-strong">
            {cita.paciente}
          </p>
        </div>
        <p className="mt-0.5 truncate text-[0.65rem] text-ink-muted">
          {cita.motivo}
        </p>
      </div>
      <span
        className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[0.58rem] font-bold ${
          cita.status === "confirmada"
            ? "bg-validation-soft text-validation"
            : "bg-warn-soft text-warn"
        }`}
      >
        {cita.status === "confirmada" ? "✓" : "•"}
      </span>
    </div>
  );
}
