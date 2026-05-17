"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Users,
  TrendingUp,
  Clock,
  Filter,
  CheckCircle2,
  Bed,
  Archive,
} from "lucide-react";
import { ClinicalMetric } from "@/components/clinical/clinical-metric";
import { TrendChart } from "@/components/clinical/trend-chart";
import {
  EncounterCardActive,
  EncounterCardDischarged,
  EncounterRowHistorico,
  EmptyStateCard,
} from "./encounter-card";
import { formatLOS } from "@/lib/encounters/status";
import type {
  EncounterRow,
  EncounterSeveridad,
} from "@/lib/encounters/types";

type Tab = "activos" | "alta" | "historico";

type EncounterWithPatient = EncounterRow & {
  paciente?: {
    id: string;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    sexo: "M" | "F" | null;
    fecha_nacimiento: string | null;
  } | null;
};

export interface EncounterBoardProps {
  activos: EncounterWithPatient[];
  altaReciente: EncounterWithPatient[];
  historico: EncounterWithPatient[];
  throughput: Array<{ date: string; admissions: number; discharges: number }>;
  /** Total LOS minutes / total altas — average length of stay */
  avgLOSminutes: number | null;
  /** Admisiones últimas 24h */
  admissions24h: number;
  /** Altas últimas 24h */
  discharges24h: number;
  /** Severidades visibles (todas si no se especifica) */
  severitiesShown?: EncounterSeveridad[];
  /** Si false, oculta el tab "Histórico" entero */
  showHistorical?: boolean;
}

const SEV_FILTER_LABELS: Record<EncounterSeveridad, string> = {
  rojo: "Crítico",
  naranja: "Muy urgente",
  amarillo: "Urgente",
  verde: "Estable",
  azul: "No urgente",
};

export function EncounterBoard({
  activos,
  altaReciente,
  historico,
  throughput,
  avgLOSminutes,
  admissions24h,
  discharges24h,
  severitiesShown,
  showHistorical = true,
}: EncounterBoardProps) {
  const [tab, setTab] = useState<Tab>("activos");
  const [sevFilter, setSevFilter] = useState<EncounterSeveridad | "todos">(
    "todos",
  );

  const activosFiltrados = useMemo(() => {
    if (sevFilter === "todos") return activos;
    return activos.filter((e) => e.severidad === sevFilter);
  }, [activos, sevFilter]);

  // KPIs
  const census = activos.length;
  const admissionTrend = throughput.map((t) => t.admissions);
  const dischargeTrend = throughput.map((t) => t.discharges);

  // Severidad distribution para chips
  const sevCount = useMemo(() => {
    const counts: Record<EncounterSeveridad, number> = {
      rojo: 0,
      naranja: 0,
      amarillo: 0,
      verde: 0,
      azul: 0,
    };
    for (const e of activos) {
      if (e.severidad) counts[e.severidad] += 1;
    }
    return counts;
  }, [activos]);

  return (
    <div className="space-y-5">
      {/* Hero KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ClinicalMetric
          label="Census activo"
          value={census}
          unit={census === 1 ? "paciente" : "pacientes"}
          icon={Users}
          critical={census > 0 && sevCount.rojo > 0}
          caption={sevCount.rojo > 0 ? `${sevCount.rojo} crítico${sevCount.rojo > 1 ? "s" : ""}` : "sin críticos"}
        />
        <ClinicalMetric
          label="Admisiones 24h"
          value={admissions24h}
          icon={TrendingUp}
          trend={admissionTrend}
          caption="últimos 7 días"
        />
        <ClinicalMetric
          label="Altas 24h"
          value={discharges24h}
          icon={CheckCircle2}
          trend={dischargeTrend}
          caption="últimos 7 días"
        />
        <ClinicalMetric
          label="LOS promedio"
          value={formatLOS(avgLOSminutes)}
          icon={Clock}
          caption="altas últimos 15 días"
        />
      </section>

      {/* Tabs */}
      <nav className="flex items-center gap-1 border-b border-line">
        <TabButton
          active={tab === "activos"}
          onClick={() => setTab("activos")}
          label="Activos"
          count={activos.length}
          dot={sevCount.rojo > 0}
        />
        <TabButton
          active={tab === "alta"}
          onClick={() => setTab("alta")}
          label="Alta últimos 15 días"
          count={altaReciente.length}
        />
        {showHistorical && (
          <TabButton
            active={tab === "historico"}
            onClick={() => setTab("historico")}
            label="Histórico"
            count={historico.length}
          />
        )}
      </nav>

      {/* Content por tab */}
      {tab === "activos" && (
        <section className="space-y-3">
          {/* Severity filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-ink-quiet" strokeWidth={2} />
            <SevChip
              active={sevFilter === "todos"}
              onClick={() => setSevFilter("todos")}
              label="Todos"
              count={activos.length}
            />
            {(severitiesShown ?? (["rojo", "naranja", "amarillo", "verde", "azul"] as EncounterSeveridad[])).map(
              (s) =>
                sevCount[s] > 0 && (
                  <SevChip
                    key={s}
                    active={sevFilter === s}
                    onClick={() => setSevFilter(s)}
                    label={SEV_FILTER_LABELS[s]}
                    count={sevCount[s]}
                    tone={s}
                  />
                ),
            )}
          </div>

          {activosFiltrados.length === 0 ? (
            <EmptyStateCard
              icon={Bed}
              title="Sin pacientes activos"
              hint="Cuando admitas un paciente al departamento, aparecerá aquí en tiempo real."
            />
          ) : (
            <div className="grid gap-2.5 lg:grid-cols-2">
              {activosFiltrados.map((e) => (
                <EncounterCardActive key={e.id} e={e} />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "alta" && (
        <section>
          {altaReciente.length === 0 ? (
            <EmptyStateCard
              icon={CheckCircle2}
              title="Sin altas en los últimos 15 días"
              hint="Esta ventana muestra los pacientes egresados recientes para seguimiento outcome inmediato."
            />
          ) : (
            <div className="grid gap-2 lg:grid-cols-2">
              {altaReciente.map((e) => (
                <EncounterCardDischarged key={e.id} e={e} />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "historico" && (
        <section>
          {historico.length === 0 ? (
            <EmptyStateCard
              icon={Archive}
              title="Sin histórico todavía"
              hint="Después de 15 días, los encounters pasan a este tab para auditoría y analytics."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-line bg-surface">
              <table className="min-w-full divide-y divide-line">
                <thead className="bg-surface-alt">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                      Paciente
                    </th>
                    <th className="px-3 py-2.5 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                      Motivo
                    </th>
                    <th className="px-3 py-2.5 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                      Disposición
                    </th>
                    <th className="px-3 py-2.5 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                      LOS
                    </th>
                    <th className="px-3 py-2.5 text-left text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
                      Alta
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {historico.map((e) => (
                    <EncounterRowHistorico key={e.id} e={e} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dot?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative -mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-caption font-semibold transition-colors ${
        active
          ? "border-validation text-ink-strong"
          : "border-transparent text-ink-muted hover:text-ink-strong"
      }`}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-code-red opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-code-red" />
        </span>
      )}
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 font-mono tabular-nums text-[10px] font-bold ${
          active
            ? "bg-validation-soft text-validation"
            : "bg-surface-alt text-ink-quiet"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function SevChip({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  tone?: EncounterSeveridad;
}) {
  const toneCls =
    tone === "rojo"
      ? active
        ? "bg-code-red-bg text-code-red ring-1 ring-code-red/30"
        : "text-code-red hover:bg-code-red-bg/40"
      : tone === "naranja"
        ? active
          ? "bg-code-amber-bg text-code-amber ring-1 ring-code-amber/30"
          : "text-code-amber hover:bg-code-amber-bg/40"
        : tone === "amarillo"
          ? active
            ? "bg-code-amber-bg/60 text-warn ring-1 ring-warn/20"
            : "text-warn hover:bg-code-amber-bg/30"
          : tone === "verde"
            ? active
              ? "bg-code-green-bg text-code-green ring-1 ring-code-green/30"
              : "text-code-green hover:bg-code-green-bg/40"
            : active
              ? "bg-ink-strong text-surface"
              : "bg-surface-alt text-ink-muted hover:bg-surface";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-semibold transition-colors ${toneCls}`}
    >
      {label}
      <span className="font-mono tabular-nums text-[10px] opacity-80">
        {count}
      </span>
    </button>
  );
}
