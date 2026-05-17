import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getActiveEncounters,
  getRecentDischarges,
  getHistoricalEncounters,
  getDailyThroughput,
} from "./queries";
import type { EncounterModulo } from "./types";

type AnySupabase = SupabaseClient<any, any, any>;

export interface BoardData {
  activos: Awaited<ReturnType<typeof getActiveEncounters>>;
  altaReciente: Awaited<ReturnType<typeof getRecentDischarges>>;
  historico: Awaited<ReturnType<typeof getHistoricalEncounters>>;
  throughput: Awaited<ReturnType<typeof getDailyThroughput>>;
  avgLOSminutes: number | null;
  admissions24h: number;
  discharges24h: number;
}

/**
 * Carga todos los datos necesarios para alimentar <EncounterBoard /> de
 * un módulo o lista de módulos. Calcula KPIs derivados en el server
 * para evitar serializar 500 filas si no son necesarias.
 */
export async function loadBoardData(
  supa: AnySupabase,
  opts: {
    userId: string;
    modulo: EncounterModulo | EncounterModulo[];
    historicoLimit?: number;
    throughputDays?: number;
  },
): Promise<BoardData> {
  const moduloArr = Array.isArray(opts.modulo) ? opts.modulo : [opts.modulo];
  // Para getDailyThroughput el helper actual solo acepta un modulo —
  // si pasan varios, agregamos manualmente sumando.
  const throughputPromise: Promise<BoardData["throughput"]> =
    moduloArr.length === 1
      ? getDailyThroughput(supa, {
          userId: opts.userId,
          modulo: moduloArr[0],
          days: opts.throughputDays ?? 7,
        })
      : Promise.all(
          moduloArr.map((m) =>
            getDailyThroughput(supa, {
              userId: opts.userId,
              modulo: m,
              days: opts.throughputDays ?? 7,
            }),
          ),
        ).then((rows) => {
          const merged = new Map<string, { date: string; admissions: number; discharges: number }>();
          for (const series of rows) {
            for (const r of series) {
              const e = merged.get(r.date) ?? {
                date: r.date,
                admissions: 0,
                discharges: 0,
              };
              e.admissions += r.admissions;
              e.discharges += r.discharges;
              merged.set(r.date, e);
            }
          }
          return Array.from(merged.values()).sort((a, b) =>
            a.date.localeCompare(b.date),
          );
        });

  const [activos, altaReciente, historico, throughput] = await Promise.all([
    getActiveEncounters(supa, { userId: opts.userId, modulo: opts.modulo }),
    getRecentDischarges(supa, {
      userId: opts.userId,
      modulo: opts.modulo,
      limit: 80,
    }),
    getHistoricalEncounters(supa, {
      userId: opts.userId,
      modulo: opts.modulo,
      limit: opts.historicoLimit ?? 80,
    }),
    throughputPromise,
  ]);

  // KPIs derivados
  const losValues = altaReciente
    .map((e) => e.los_minutes)
    .filter((v): v is number => v !== null && v !== undefined && v > 0);
  const avgLOSminutes =
    losValues.length > 0
      ? Math.round(losValues.reduce((s, v) => s + v, 0) / losValues.length)
      : null;

  const last24h = throughput.slice(-1)[0];
  const admissions24h = last24h?.admissions ?? 0;
  const discharges24h = last24h?.discharges ?? 0;

  return {
    activos,
    altaReciente,
    historico,
    throughput,
    avgLOSminutes,
    admissions24h,
    discharges24h,
  };
}
