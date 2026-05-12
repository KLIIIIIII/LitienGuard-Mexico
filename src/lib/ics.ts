/**
 * Generador de archivos iCalendar (RFC 5545) para que el paciente agregue
 * la cita a Apple Calendar, Google Calendar, Outlook, etc. directamente
 * desde el correo de recordatorio.
 *
 * La especificación exige:
 *   - CRLF line endings
 *   - Líneas plegadas (folded) a 75 octetos
 *   - Escapes de comas, punto y coma, barras invertidas, saltos de línea
 *   - DTSTART/DTEND en formato UTC (YYYYMMDDTHHMMSSZ) o con TZID
 *
 * Mantenemos el output minimalista pero válido para Apple Mail, Gmail,
 * Outlook y Thunderbird.
 */

export interface IcsEvent {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  organizerName?: string;
  organizerEmail?: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIcsDateUtc(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

/**
 * Escape conforme a RFC 5545 §3.3.11.
 */
function escapeText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Fold a single logical line into 75-octet physical lines per RFC 5545
 * §3.1. Continuation lines must begin with a single space.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let remaining = line;
  out.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    out.push(" " + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  return out.join("\r\n");
}

export function generateIcs(event: IcsEvent): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LitienGuard//Recordatorio//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeText(event.uid)}`,
    `DTSTAMP:${toIcsDateUtc(new Date())}`,
    `DTSTART:${toIcsDateUtc(event.start)}`,
    `DTEND:${toIcsDateUtc(event.end)}`,
    `SUMMARY:${escapeText(event.summary)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }
  if (event.organizerEmail) {
    const cn = event.organizerName ? `CN=${escapeText(event.organizerName)}:` : "";
    lines.push(`ORGANIZER;${cn}mailto:${event.organizerEmail}`);
  }

  // Reminder alarm 60 min before
  lines.push(
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(event.summary)}`,
    "TRIGGER:-PT60M",
    "END:VALARM",
  );

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
