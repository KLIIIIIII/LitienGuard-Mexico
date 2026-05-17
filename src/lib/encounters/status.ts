import type { EncounterPhase, EncounterRow } from "./types";

export const RECENT_DISCHARGE_WINDOW_DAYS = 15;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getEncounterPhase(
  e: Pick<EncounterRow, "status" | "discharged_at">,
  now: Date = new Date(),
): EncounterPhase {
  if (e.status === "activo" || e.discharged_at === null) return "activo";
  const discharged = new Date(e.discharged_at);
  const ageDays = (now.getTime() - discharged.getTime()) / MS_PER_DAY;
  if (ageDays <= RECENT_DISCHARGE_WINDOW_DAYS) return "alta_reciente";
  return "historico";
}

export function isActive(e: Pick<EncounterRow, "status" | "discharged_at">): boolean {
  return getEncounterPhase(e) === "activo";
}

export function isRecentDischarge(
  e: Pick<EncounterRow, "status" | "discharged_at">,
  now: Date = new Date(),
): boolean {
  return getEncounterPhase(e, now) === "alta_reciente";
}

export function formatLOS(losMinutes: number | null | undefined): string {
  if (losMinutes === null || losMinutes === undefined) return "—";
  if (losMinutes < 60) return `${losMinutes} min`;
  const hours = losMinutes / 60;
  if (hours < 24) return `${hours.toFixed(1)} h`;
  const days = hours / 24;
  return `${days.toFixed(1)} d`;
}

export function formatAdmittedAgo(admittedAt: string, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(admittedAt).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = minutes / 60;
  if (hours < 24) return `hace ${hours.toFixed(0)} h`;
  const days = hours / 24;
  return `hace ${days.toFixed(0)} d`;
}
