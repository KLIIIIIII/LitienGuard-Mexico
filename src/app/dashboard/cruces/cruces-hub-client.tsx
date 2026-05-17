"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Info,
  Network,
  PillBottle,
  User,
} from "lucide-react";

type Severidad = "critica" | "importante" | "informativa";

interface CrucePayload {
  id: string;
  nombre: string;
  descripcion: string;
  severidad: Severidad;
  recomendacion: string;
  source: string;
  farmacos: {
    obligatorios?: string[];
    contraindicados?: string[];
  } | null;
  motivos: string[];
}

interface PacientePayload {
  key: string;
  iniciales: string;
  edad: number | null;
  sexo: string | null;
  diseaseIds: string[];
  ultimaFechaIso: string;
  cruces: CrucePayload[];
}

interface Props {
  pacientes: PacientePayload[];
}

const SEVERIDAD_META: Record<
  Severidad,
  {
    label: string;
    cls: string;
    badgeCls: string;
    icon: typeof AlertTriangle;
  }
> = {
  critica: {
    label: "Crítica",
    cls: "border-rose/40 bg-rose-soft/30",
    badgeCls: "bg-rose-soft text-rose",
    icon: AlertTriangle,
  },
  importante: {
    label: "Importante",
    cls: "border-warn/40 bg-warn-soft/30",
    badgeCls: "bg-warn-soft text-warn",
    icon: Network,
  },
  informativa: {
    label: "Informativa",
    cls: "border-line bg-surface",
    badgeCls: "bg-surface-alt text-ink-muted",
    icon: Info,
  },
};

export function CrucesHubClient({ pacientes }: Props) {
  const [filtro, setFiltro] = useState<Severidad | "todos">("todos");
  const [expandido, setExpandido] = useState<string | null>(null);

  const pacientesFiltrados = useMemo(() => {
    if (filtro === "todos") return pacientes;
    return pacientes
      .map((p) => ({
        ...p,
        cruces: p.cruces.filter((c) => c.severidad === filtro),
      }))
      .filter((p) => p.cruces.length > 0);
  }, [pacientes, filtro]);

  return (
    <>
      {/* Filtros */}
      <section className="flex flex-wrap items-center gap-2">
        <span className="text-caption uppercase tracking-eyebrow font-semibold text-ink-soft">
          Filtrar
        </span>
        {(["todos", "critica", "importante", "informativa"] as const).map((f) => {
          const active = filtro === f;
          const label =
            f === "todos" ? "Todos" : SEVERIDAD_META[f].label;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`rounded-full border px-3 py-1 text-caption font-medium transition-colors ${
                active
                  ? "border-validation bg-validation-soft text-validation"
                  : "border-line bg-surface text-ink-muted hover:border-line-strong"
              }`}
            >
              {label}
            </button>
          );
        })}
      </section>

      {/* Lista de pacientes con cruces */}
      <section className="space-y-3">
        {pacientesFiltrados.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface p-8 text-center">
            <p className="text-body-sm text-ink-muted">
              Sin cruces de esta severidad.
            </p>
          </div>
        ) : (
          pacientesFiltrados.map((p) => {
            const isExpanded = expandido === p.key;
            const fecha = new Date(p.ultimaFechaIso);
            const criticos = p.cruces.filter((c) => c.severidad === "critica").length;

            return (
              <article
                key={p.key}
                className="rounded-xl border border-line bg-surface overflow-hidden"
              >
                {/* Header */}
                <button
                  type="button"
                  onClick={() => setExpandido(isExpanded ? null : p.key)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-alt"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-alt text-ink-strong">
                      <User className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm font-semibold text-ink-strong">
                        {p.iniciales}
                        {p.edad !== null && (
                          <span className="ml-1.5 font-normal text-ink-muted tabular-nums">
                            {p.edad}a
                          </span>
                        )}
                        {p.sexo && (
                          <span className="ml-1 text-ink-muted">
                            {p.sexo}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-caption text-ink-soft">
                        {p.diseaseIds.length} dx confirmado
                        {p.diseaseIds.length === 1 ? "" : "s"} ·{" "}
                        {p.cruces.length} cruce
                        {p.cruces.length === 1 ? "" : "s"} detectado
                        {p.cruces.length === 1 ? "" : "s"} · última actividad{" "}
                        {fecha.toLocaleDateString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {criticos > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-soft px-2 py-0.5 text-caption font-semibold text-rose">
                        <AlertTriangle
                          className="h-3 w-3"
                          strokeWidth={2.4}
                        />
                        {criticos} crítico{criticos === 1 ? "" : "s"}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronDown
                        className="h-4 w-4 text-ink-muted"
                        strokeWidth={2}
                      />
                    ) : (
                      <ChevronRight
                        className="h-4 w-4 text-ink-muted"
                        strokeWidth={2}
                      />
                    )}
                  </div>
                </button>

                {/* Cruces expandidos */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        duration: 0.22,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-line bg-surface-alt/30 px-4 py-3 space-y-3">
                        {p.cruces.map((c) => (
                          <CruceCard key={c.id} cruce={c} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </article>
            );
          })
        )}
      </section>
    </>
  );
}

function CruceCard({ cruce }: { cruce: CrucePayload }) {
  const meta = SEVERIDAD_META[cruce.severidad];
  const Icon = meta.icon;
  return (
    <div className={`rounded-lg border ${meta.cls} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <Icon
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              cruce.severidad === "critica"
                ? "text-rose"
                : cruce.severidad === "importante"
                  ? "text-warn"
                  : "text-ink-muted"
            }`}
            strokeWidth={2.2}
          />
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-ink-strong leading-snug">
              {cruce.nombre}
            </p>
            <p className="mt-0.5 text-caption text-ink-muted leading-relaxed">
              {cruce.descripcion}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-eyebrow font-bold ${meta.badgeCls}`}
        >
          {meta.label}
        </span>
      </div>

      {/* Recomendación */}
      <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
        <p className="text-caption uppercase tracking-eyebrow font-semibold text-ink-soft">
          Recomendación
        </p>
        <p className="mt-1 text-body-sm text-ink-strong leading-relaxed">
          {cruce.recomendacion}
        </p>
      </div>

      {/* Fármacos */}
      {cruce.farmacos &&
        (cruce.farmacos.obligatorios?.length ||
          cruce.farmacos.contraindicados?.length) && (
          <div className="grid gap-2 sm:grid-cols-2">
            {cruce.farmacos.obligatorios &&
              cruce.farmacos.obligatorios.length > 0 && (
                <div className="rounded-lg border border-validation/30 bg-validation-soft/40 px-3 py-2">
                  <p className="flex items-center gap-1.5 text-caption uppercase tracking-eyebrow font-semibold text-validation">
                    <PillBottle className="h-3 w-3" strokeWidth={2.2} />
                    Fármacos recomendados
                  </p>
                  <p className="mt-1 text-caption text-ink-strong">
                    {cruce.farmacos.obligatorios.join(" · ")}
                  </p>
                </div>
              )}
            {cruce.farmacos.contraindicados &&
              cruce.farmacos.contraindicados.length > 0 && (
                <div className="rounded-lg border border-rose/30 bg-rose-soft/40 px-3 py-2">
                  <p className="flex items-center gap-1.5 text-caption uppercase tracking-eyebrow font-semibold text-rose">
                    <PillBottle className="h-3 w-3" strokeWidth={2.2} />
                    Contraindicados
                  </p>
                  <p className="mt-1 text-caption text-ink-strong">
                    {cruce.farmacos.contraindicados.join(" · ")}
                  </p>
                </div>
              )}
          </div>
        )}

      {/* Motivos del match */}
      {cruce.motivos.length > 0 && (
        <details className="text-caption">
          <summary className="cursor-pointer text-ink-muted hover:text-ink-strong">
            ¿Por qué se detectó?
          </summary>
          <ul className="mt-1.5 ml-4 space-y-0.5 text-ink-muted">
            {cruce.motivos.map((m, i) => (
              <li key={i} className="list-disc">
                {m}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Fuente */}
      <div className="border-t border-line pt-2.5">
        <p className="flex items-start gap-1.5 text-[0.65rem] text-ink-soft leading-relaxed">
          <FlaskConical className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
          <span>
            <span className="font-semibold text-ink-muted">Fuente:</span>{" "}
            {cruce.source}
          </span>
        </p>
      </div>
    </div>
  );
}
