"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bed,
  Users,
  CircleCheck,
  Sparkles,
  Wrench,
  Filter,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { ClinicalMetric } from "@/components/clinical/clinical-metric";

type CamaStatus =
  | "libre"
  | "ocupada"
  | "limpieza"
  | "mantenimiento"
  | "fuera_servicio";

interface CamaRow {
  id: string;
  label: string;
  modulo: string;
  ala: string | null;
  piso: number | null;
  tipo: string;
  status: CamaStatus;
  encounter_id: string | null;
  encounter?: {
    id: string;
    paciente_id: string | null;
    severidad: string | null;
    motivo_admision: string | null;
    admitted_at: string;
    paciente: {
      nombre: string;
      apellido_paterno: string;
      sexo: "M" | "F" | null;
      fecha_nacimiento: string | null;
    } | null;
  } | null;
}

const MODULO_LABEL: Record<string, string> = {
  urgencias: "Urgencias",
  uci: "UCI",
  quirofano: "Quirófano",
  hospitalizacion: "Hospitalización",
  cardiologia: "Cardiología",
  neurologia: "Neurología",
  oncologia: "Oncología",
  endocrinologia: "Endocrinología",
  pediatria: "Pediatría",
  maternidad: "Maternidad",
};

const MODULE_ORDER = [
  "urgencias",
  "uci",
  "quirofano",
  "hospitalizacion",
  "cardiologia",
  "neurologia",
  "oncologia",
  "endocrinologia",
  "pediatria",
  "maternidad",
];

const STATUS_STYLE: Record<CamaStatus, { bg: string; text: string; border: string; label: string }> = {
  libre: {
    bg: "bg-validation-soft/40",
    text: "text-validation",
    border: "border-validation/30",
    label: "Libre",
  },
  ocupada: {
    bg: "bg-code-amber-bg/40",
    text: "text-code-amber",
    border: "border-code-amber/30",
    label: "Ocupada",
  },
  limpieza: {
    bg: "bg-accent-soft/40",
    text: "text-accent",
    border: "border-accent/30",
    label: "Limpieza",
  },
  mantenimiento: {
    bg: "bg-warn-soft/40",
    text: "text-warn",
    border: "border-warn/30",
    label: "Mantenimiento",
  },
  fuera_servicio: {
    bg: "bg-surface-alt",
    text: "text-ink-muted",
    border: "border-line",
    label: "Fuera de servicio",
  },
};

const SEV_DOT: Record<string, string> = {
  rojo: "bg-code-red",
  naranja: "bg-code-amber",
  amarillo: "bg-warn",
  verde: "bg-validation",
  azul: "bg-ink-quiet",
};

function calcAge(fechaNac: string | null): number | null {
  if (!fechaNac) return null;
  return Math.floor(
    (Date.now() - new Date(fechaNac).getTime()) / (365.25 * 24 * 3600 * 1000),
  );
}

export function BedManagementBoard({ camas }: { camas: CamaRow[] }) {
  const [moduloFilter, setModuloFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<CamaStatus | "todos">("todos");

  // KPIs globales
  const total = camas.length;
  const ocupadas = camas.filter((c) => c.status === "ocupada").length;
  const libres = camas.filter((c) => c.status === "libre").length;
  const noDisponibles = camas.filter(
    (c) => c.status === "limpieza" || c.status === "mantenimiento" || c.status === "fuera_servicio",
  ).length;
  const ocupacionPct = total > 0 ? Math.round((ocupadas / total) * 100) : 0;

  // Agrupar por módulo
  const porModulo = useMemo(() => {
    const map = new Map<string, CamaRow[]>();
    for (const c of camas) {
      if (!map.has(c.modulo)) map.set(c.modulo, []);
      map.get(c.modulo)!.push(c);
    }
    return MODULE_ORDER.filter((m) => map.has(m)).map((m) => ({
      modulo: m,
      camas: map.get(m) ?? [],
    }));
  }, [camas]);

  // KPI por módulo
  const moduloStats = useMemo(() => {
    return porModulo.map(({ modulo, camas: cs }) => {
      const ocup = cs.filter((c) => c.status === "ocupada").length;
      const lib = cs.filter((c) => c.status === "libre").length;
      const pct = cs.length > 0 ? Math.round((ocup / cs.length) * 100) : 0;
      return { modulo, total: cs.length, ocup, lib, pct };
    });
  }, [porModulo]);

  // Camas filtradas según filtros activos
  const camasMostradas = useMemo(() => {
    return porModulo
      .filter((p) => moduloFilter === "todos" || p.modulo === moduloFilter)
      .map((p) => ({
        ...p,
        camas: p.camas.filter(
          (c) => statusFilter === "todos" || c.status === statusFilter,
        ),
      }))
      .filter((p) => p.camas.length > 0);
  }, [porModulo, moduloFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Hero KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ClinicalMetric
          label="Ocupación global"
          value={`${ocupacionPct}%`}
          icon={Users}
          critical={ocupacionPct >= 90}
          caption={`${ocupadas} de ${total} camas`}
        />
        <ClinicalMetric
          label="Camas libres"
          value={libres}
          unit="disponibles"
          icon={CircleCheck}
        />
        <ClinicalMetric
          label="Limpieza / mantenimiento"
          value={noDisponibles}
          icon={Sparkles}
          caption="temporalmente fuera"
        />
        <ClinicalMetric
          label="Críticos en cama"
          value={
            camas.filter(
              (c) =>
                c.status === "ocupada" &&
                (c.encounter?.severidad === "rojo" ||
                  c.encounter?.severidad === "naranja"),
            ).length
          }
          unit="pacientes"
          icon={AlertTriangle}
          critical={
            camas.filter(
              (c) =>
                c.status === "ocupada" && c.encounter?.severidad === "rojo",
            ).length > 0
          }
        />
      </section>

      {/* Resumen por área */}
      <section className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {moduloStats.map((s) => (
          <button
            key={s.modulo}
            type="button"
            onClick={() =>
              setModuloFilter(moduloFilter === s.modulo ? "todos" : s.modulo)
            }
            className={`rounded-lg border px-3 py-2 text-left transition-all ${
              moduloFilter === s.modulo
                ? "border-validation bg-validation-soft/40"
                : "border-line bg-surface hover:border-validation/40"
            }`}
          >
            <p className="text-caption font-semibold text-ink-strong">
              {MODULO_LABEL[s.modulo] ?? s.modulo}
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={`font-mono text-body-sm font-bold tabular-nums ${
                  s.pct >= 90
                    ? "text-code-red"
                    : s.pct >= 75
                      ? "text-code-amber"
                      : "text-ink-strong"
                }`}
              >
                {s.pct}%
              </span>
              <span className="text-caption text-ink-muted tabular-nums">
                {s.ocup}/{s.total}
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-alt">
              <div
                className={`h-full ${
                  s.pct >= 90
                    ? "bg-code-red"
                    : s.pct >= 75
                      ? "bg-code-amber"
                      : "bg-validation"
                }`}
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </button>
        ))}
      </section>

      {/* Filtros */}
      <section className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-ink-quiet" strokeWidth={2} />
        <StatusChip
          active={statusFilter === "todos"}
          onClick={() => setStatusFilter("todos")}
          label="Todos"
          count={camas.length}
        />
        {(["libre", "ocupada", "limpieza", "mantenimiento"] as CamaStatus[]).map(
          (s) => {
            const c = camas.filter((x) => x.status === s).length;
            if (c === 0) return null;
            return (
              <StatusChip
                key={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter(s)}
                label={STATUS_STYLE[s].label}
                count={c}
                status={s}
              />
            );
          },
        )}
        {moduloFilter !== "todos" && (
          <button
            type="button"
            onClick={() => setModuloFilter("todos")}
            className="ml-2 text-caption text-ink-muted hover:text-ink-strong underline"
          >
            ← todos los módulos
          </button>
        )}
      </section>

      {/* Bed grid por área */}
      <div className="space-y-5">
        {camasMostradas.map(({ modulo, camas: cs }) => (
          <section key={modulo}>
            <h2 className="mb-2 text-caption font-semibold uppercase tracking-eyebrow text-ink-soft">
              {MODULO_LABEL[modulo] ?? modulo} ·{" "}
              <span className="font-mono tabular-nums text-ink-strong">
                {cs.length}
              </span>
            </h2>
            <div className="grid gap-1.5 grid-cols-[repeat(auto-fill,minmax(96px,1fr))]">
              {cs.map((c) => (
                <BedCard key={c.id} cama={c} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function BedCard({ cama }: { cama: CamaRow }) {
  const style = STATUS_STYLE[cama.status];
  const enc = cama.encounter;
  const isOccupied = cama.status === "ocupada" && enc;
  const sevDot = enc?.severidad ? SEV_DOT[enc.severidad] : null;

  const inner = (
    <div
      className={`group relative flex h-20 flex-col items-stretch justify-between rounded-lg border ${style.border} ${style.bg} px-2 py-1.5 transition-all ${
        isOccupied ? "hover:shadow-lift hover:border-validation/40" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`font-mono text-[11px] font-bold tabular-nums ${style.text}`}>
          {cama.label}
        </span>
        {sevDot && (
          <span className={`h-1.5 w-1.5 rounded-full ${sevDot}`} />
        )}
      </div>
      {isOccupied && enc.paciente ? (
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold text-ink-strong">
            {enc.paciente.nombre} {enc.paciente.apellido_paterno}
          </p>
          <p className="text-[10px] text-ink-muted">
            {calcAge(enc.paciente.fecha_nacimiento)}a · {enc.paciente.sexo ?? ""}
          </p>
        </div>
      ) : (
        <p className={`text-[10px] ${style.text}`}>{style.label}</p>
      )}
      {isOccupied && enc.paciente_id && (
        <ExternalLink
          className="absolute right-1 bottom-1 h-2.5 w-2.5 text-ink-quiet opacity-0 transition-opacity group-hover:opacity-100"
          strokeWidth={2}
        />
      )}
    </div>
  );

  if (isOccupied && enc.paciente_id) {
    return (
      <Link
        href={`/dashboard/pacientes/${enc.paciente_id}`}
        title={enc.motivo_admision ?? undefined}
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function StatusChip({
  active,
  onClick,
  label,
  count,
  status,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  status?: CamaStatus;
}) {
  const style = status ? STATUS_STYLE[status] : null;
  const cls = active
    ? style
      ? `${style.bg} ${style.text} ring-1 ${style.border}`
      : "bg-ink-strong text-surface"
    : style
      ? `${style.text} hover:bg-surface-alt`
      : "text-ink-muted hover:bg-surface-alt";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-semibold transition-colors ${cls}`}
    >
      {label}
      <span className="font-mono tabular-nums text-[10px] opacity-80">
        {count}
      </span>
    </button>
  );
}
