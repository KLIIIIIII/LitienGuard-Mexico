/**
 * Cálculo de slots disponibles para reservación pública.
 *
 * Las horas configuradas en el perfil del médico (booking_hour_start /
 * booking_hour_end) se interpretan como hora local de Ciudad de México.
 * Los slots devueltos están en formato ISO con offset, listos para enviarse
 * al servidor.
 */

export interface BookingConfig {
  workdays: number[]; // 1=Mon ... 7=Sun (ISO 8601)
  hour_start: number;
  hour_end: number;
  slot_minutes: number;
  advance_days: number;
}

export interface BusyInterval {
  fecha_inicio: string;
  fecha_fin: string;
}

export interface SlotsByDay {
  date: string; // YYYY-MM-DD (Mexico City)
  weekday: number; // 1..7
  slots: string[]; // ISO 8601 with offset
}

const TZ = "America/Mexico_City";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toMxDateParts(d: Date): { y: number; m: number; day: number; weekday: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    day: Number(get("day")),
    weekday: weekdayMap[get("weekday")] ?? 0,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

/**
 * Construye un Date en UTC a partir de fecha local de México y hora local.
 * Usa Intl para descubrir el offset correcto (maneja DST si aplicara,
 * aunque CDMX está en horario fijo desde 2022).
 */
function mxLocalToUtc(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
): Date {
  // Construye un guess UTC con esos números, calcula el offset, ajusta.
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const localFromGuess = toMxDateParts(utcGuess);
  // Diferencia entre lo que queríamos y lo que dio
  const wantedMinutes = hour * 60 + minute;
  const gotMinutes = localFromGuess.hour * 60 + localFromGuess.minute;
  const diff = wantedMinutes - gotMinutes;
  return new Date(utcGuess.getTime() + diff * 60_000);
}

export function isSlotBusy(
  slotStartIso: string,
  slotEndIso: string,
  busy: BusyInterval[],
): boolean {
  const start = new Date(slotStartIso).getTime();
  const end = new Date(slotEndIso).getTime();
  return busy.some((b) => {
    const bs = new Date(b.fecha_inicio).getTime();
    const be = new Date(b.fecha_fin).getTime();
    return bs < end && be > start;
  });
}

export function computeAvailableSlots(
  config: BookingConfig,
  busy: BusyInterval[],
  now: Date = new Date(),
): SlotsByDay[] {
  const result: SlotsByDay[] = [];
  const slotMs = config.slot_minutes * 60_000;
  const slotsPerHour = 60 / config.slot_minutes;

  // For each upcoming day within booking_advance_days window
  for (let offset = 0; offset <= config.advance_days; offset++) {
    // Get the date offset days ahead (in MX time)
    const cursorUtc = new Date(now.getTime() + offset * 24 * 60 * 60_000);
    const cursorMx = toMxDateParts(cursorUtc);

    if (!config.workdays.includes(cursorMx.weekday)) continue;

    const dateKey = `${cursorMx.y}-${pad(cursorMx.m)}-${pad(cursorMx.day)}`;
    const daySlots: string[] = [];

    for (let h = config.hour_start; h < config.hour_end; h++) {
      for (let s = 0; s < slotsPerHour; s++) {
        const m = s * config.slot_minutes;
        const slotStart = mxLocalToUtc(cursorMx.y, cursorMx.m, cursorMx.day, h, m);

        // Skip slots in the past
        if (slotStart.getTime() <= now.getTime()) continue;
        // Also skip slots starting in the next 60 minutes (no last-minute bookings)
        if (slotStart.getTime() <= now.getTime() + 60 * 60_000) continue;

        const slotEnd = new Date(slotStart.getTime() + slotMs);
        const isBusy = isSlotBusy(
          slotStart.toISOString(),
          slotEnd.toISOString(),
          busy,
        );
        if (!isBusy) {
          daySlots.push(slotStart.toISOString());
        }
      }
    }

    if (daySlots.length > 0) {
      result.push({
        date: dateKey,
        weekday: cursorMx.weekday,
        slots: daySlots,
      });
    }
  }

  return result;
}

export function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-MX", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatSlotDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return date.toLocaleDateString("es-MX", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/**
 * Slug generator: producir slug url-friendly a partir de nombre.
 * Solo letras a-z y guiones; máximo 60 chars.
 */
export function makeBookingSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
