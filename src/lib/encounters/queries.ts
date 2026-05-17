import type { SupabaseClient } from "@supabase/supabase-js";
import { RECENT_DISCHARGE_WINDOW_DAYS } from "./status";
import type {
  EncounterCensus,
  EncounterModulo,
  EncounterRow,
} from "./types";

type AnySupabase = SupabaseClient;

interface EncounterWithPatient extends EncounterRow {
  paciente?: {
    id: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    sexo: "M" | "F" | null;
    fecha_nacimiento: string | null;
  } | null;
}

const SELECT_WITH_PATIENT =
  "*, paciente:pacientes!encounters_paciente_id_fkey(id, nombre, apellido_paterno, apellido_materno, sexo, fecha_nacimiento)";

export async function getActiveEncounters(
  supa: AnySupabase,
  opts: { userId: string; modulo?: EncounterModulo | EncounterModulo[] },
): Promise<EncounterWithPatient[]> {
  let q = supa
    .from("encounters")
    .select(SELECT_WITH_PATIENT)
    .eq("user_id", opts.userId)
    .eq("status", "activo")
    .order("admitted_at", { ascending: false });

  if (opts.modulo) {
    if (Array.isArray(opts.modulo)) q = q.in("modulo", opts.modulo);
    else q = q.eq("modulo", opts.modulo);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as EncounterWithPatient[];
}

export async function getRecentDischarges(
  supa: AnySupabase,
  opts: {
    userId: string;
    modulo?: EncounterModulo | EncounterModulo[];
    windowDays?: number;
    limit?: number;
  },
): Promise<EncounterWithPatient[]> {
  const windowDays = opts.windowDays ?? RECENT_DISCHARGE_WINDOW_DAYS;
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  let q = supa
    .from("encounters")
    .select(SELECT_WITH_PATIENT)
    .eq("user_id", opts.userId)
    .neq("status", "activo")
    .gte("discharged_at", since)
    .order("discharged_at", { ascending: false })
    .limit(opts.limit ?? 100);

  if (opts.modulo) {
    if (Array.isArray(opts.modulo)) q = q.in("modulo", opts.modulo);
    else q = q.eq("modulo", opts.modulo);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as EncounterWithPatient[];
}

export async function getHistoricalEncounters(
  supa: AnySupabase,
  opts: {
    userId: string;
    modulo?: EncounterModulo | EncounterModulo[];
    limit?: number;
    offset?: number;
  },
): Promise<EncounterWithPatient[]> {
  const cutoff = new Date(
    Date.now() - RECENT_DISCHARGE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  let q = supa
    .from("encounters")
    .select(SELECT_WITH_PATIENT)
    .eq("user_id", opts.userId)
    .neq("status", "activo")
    .lt("discharged_at", cutoff)
    .order("discharged_at", { ascending: false })
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1);

  if (opts.modulo) {
    if (Array.isArray(opts.modulo)) q = q.in("modulo", opts.modulo);
    else q = q.eq("modulo", opts.modulo);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as EncounterWithPatient[];
}

export async function getEncounterCensus(
  supa: AnySupabase,
  opts: { userId: string },
): Promise<EncounterCensus> {
  const sinceRecent = new Date(
    Date.now() - RECENT_DISCHARGE_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supa
    .from("encounters")
    .select("modulo, status, discharged_at")
    .eq("user_id", opts.userId);

  if (error) throw error;

  const census: EncounterCensus = {
    activos: 0,
    altaReciente: 0,
    historico: 0,
    porModulo: {},
  };

  for (const r of (data ?? []) as Pick<
    EncounterRow,
    "modulo" | "status" | "discharged_at"
  >[]) {
    const bucket =
      r.status === "activo" || !r.discharged_at
        ? "activo"
        : r.discharged_at >= sinceRecent
          ? "alta_reciente"
          : "historico";

    if (bucket === "activo") census.activos += 1;
    else if (bucket === "alta_reciente") census.altaReciente += 1;
    else census.historico += 1;

    if (bucket !== "historico") {
      const m = r.modulo;
      const entry = census.porModulo[m] ?? { activos: 0, altaReciente: 0 };
      if (bucket === "activo") entry.activos += 1;
      else entry.altaReciente += 1;
      census.porModulo[m] = entry;
    }
  }

  return census;
}

export interface EncounterDailyThroughput {
  date: string;
  admissions: number;
  discharges: number;
}

export async function getDailyThroughput(
  supa: AnySupabase,
  opts: { userId: string; modulo?: EncounterModulo; days?: number },
): Promise<EncounterDailyThroughput[]> {
  const days = opts.days ?? 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let admQuery = supa
    .from("encounters")
    .select("admitted_at")
    .eq("user_id", opts.userId)
    .gte("admitted_at", since);
  let disQuery = supa
    .from("encounters")
    .select("discharged_at")
    .eq("user_id", opts.userId)
    .gte("discharged_at", since)
    .not("discharged_at", "is", null);

  if (opts.modulo) {
    admQuery = admQuery.eq("modulo", opts.modulo);
    disQuery = disQuery.eq("modulo", opts.modulo);
  }

  const [admRes, disRes] = await Promise.all([admQuery, disQuery]);
  if (admRes.error) throw admRes.error;
  if (disRes.error) throw disRes.error;

  const byDay = new Map<string, EncounterDailyThroughput>();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const k = d.toISOString().slice(0, 10);
    byDay.set(k, { date: k, admissions: 0, discharges: 0 });
  }

  for (const r of (admRes.data ?? []) as { admitted_at: string }[]) {
    const k = r.admitted_at.slice(0, 10);
    const entry = byDay.get(k);
    if (entry) entry.admissions += 1;
  }
  for (const r of (disRes.data ?? []) as { discharged_at: string }[]) {
    const k = r.discharged_at.slice(0, 10);
    const entry = byDay.get(k);
    if (entry) entry.discharges += 1;
  }

  return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
}
