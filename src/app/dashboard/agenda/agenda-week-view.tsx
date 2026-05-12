"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Clock, User } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  agendada: "border-l-validation bg-surface text-ink-strong",
  confirmada: "border-l-accent bg-accent-soft/40 text-ink-strong",
  completada: "border-l-ink-quiet bg-surface-alt text-ink-muted",
  cancelada: "border-l-rose bg-rose-soft/40 text-ink-muted line-through",
  no_asistio: "border-l-warn bg-warn-soft/40 text-ink-muted",
};

const STATUS_LABEL: Record<string, string> = {
  agendada: "Agendada",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
  no_asistio: "No asistió",
};

const DAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

interface CitaLite {
  id: string;
  paciente_nombre: string;
  paciente_apellido_paterno: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_consulta: string | null;
  status: string;
  motivo: string | null;
}

interface AgendaWeekViewProps {
  weekStart: string;
  citas: CitaLite[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function AgendaWeekView({ weekStart, citas }: AgendaWeekViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const start = new Date(weekStart);
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekEnd = new Date(start);
  weekEnd.setDate(weekEnd.getDate() + 6);

  function goToWeek(offset: number) {
    const d = new Date(start);
    d.setDate(d.getDate() + offset * 7);
    const params = new URLSearchParams(searchParams.toString());
    params.set("semana", d.toISOString().slice(0, 10));
    router.push(`/dashboard/agenda?${params.toString()}`);
  }

  function goToToday() {
    router.push("/dashboard/agenda");
  }

  function citasOfDay(day: Date): CitaLite[] {
    return citas.filter((c) => isSameDay(new Date(c.fecha_inicio), day));
  }

  const weekLabel = (() => {
    const startStr = start.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    });
    const endStr = weekEnd.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${startStr} — ${endStr}`;
  })();

  return (
    <div className="space-y-4">
      {/* Week navigator */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToWeek(-1)}
            className="rounded-lg border border-line bg-surface p-1.5 hover:bg-surface-alt"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => goToWeek(1)}
            className="rounded-lg border border-line bg-surface p-1.5 hover:bg-surface-alt"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-caption text-ink-strong hover:bg-surface-alt"
          >
            Hoy
          </button>
        </div>
        <p className="text-body-sm font-semibold text-ink-strong">
          {weekLabel}
        </p>
        <div className="w-[80px]" />
      </div>

      {/* Week grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day, idx) => {
          const dayCitas = citasOfDay(day);
          const isToday = isSameDay(day, today);
          const isWeekend = idx >= 5;
          const dateIso = day.toISOString().slice(0, 10);
          return (
            <div
              key={dateIso}
              className={`rounded-xl border bg-surface p-3 ${
                isToday ? "border-validation shadow-soft" : "border-line"
              } ${isWeekend ? "bg-surface-alt/40" : ""}`}
            >
              <div className="mb-2 flex items-baseline justify-between">
                <div>
                  <p
                    className={`text-caption uppercase tracking-eyebrow ${
                      isToday ? "text-validation" : "text-ink-soft"
                    }`}
                  >
                    {DAY_NAMES[idx]}
                  </p>
                  <p
                    className={`mt-0.5 text-h3 font-semibold tracking-tight ${
                      isToday ? "text-validation" : "text-ink-strong"
                    }`}
                  >
                    {day.getDate()}
                  </p>
                </div>
                <Link
                  href={`/dashboard/agenda/nueva?fecha=${dateIso}`}
                  className="rounded-md border border-line bg-surface p-1 text-ink-muted hover:bg-surface-alt"
                  aria-label="Agendar este día"
                >
                  <Plus className="h-3 w-3" strokeWidth={2.2} />
                </Link>
              </div>

              {dayCitas.length === 0 ? (
                <p className="rounded-md border border-dashed border-line py-3 text-center text-caption text-ink-soft">
                  Sin citas
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {dayCitas.map((c) => {
                    const cls = STATUS_STYLES[c.status] ?? STATUS_STYLES.agendada;
                    const fullName = [c.paciente_nombre, c.paciente_apellido_paterno]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <li key={c.id}>
                        <Link
                          href={`/dashboard/agenda/${c.id}`}
                          className={`block rounded-md border border-line border-l-4 px-2.5 py-1.5 transition-colors hover:bg-surface-alt ${cls}`}
                        >
                          <div className="flex items-center gap-1.5 text-caption font-semibold">
                            <Clock className="h-3 w-3 shrink-0" strokeWidth={2.2} />
                            <span>{formatTime(c.fecha_inicio)}</span>
                            <span className="text-ink-quiet">–</span>
                            <span>{formatTime(c.fecha_fin)}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-caption">
                            <User className="h-3 w-3 shrink-0 text-ink-quiet" strokeWidth={2.2} />
                            <span className="truncate text-ink-strong">
                              {fullName}
                            </span>
                          </div>
                          {c.tipo_consulta && (
                            <p className="mt-0.5 text-[0.65rem] uppercase tracking-eyebrow text-ink-soft">
                              {c.tipo_consulta}
                            </p>
                          )}
                          {c.status !== "agendada" && (
                            <p className="mt-1 text-[0.65rem] text-ink-quiet">
                              {STATUS_LABEL[c.status] ?? c.status}
                            </p>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
