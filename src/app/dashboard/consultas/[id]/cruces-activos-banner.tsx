"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Info,
  Network,
  PillBottle,
} from "lucide-react";

type Severidad = "critica" | "importante" | "informativa";

interface CruceItem {
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

interface Props {
  cruces: CruceItem[];
}

const SEVERIDAD_META: Record<
  Severidad,
  { label: string; tone: string; iconColor: string }
> = {
  critica: {
    label: "Crítica",
    tone: "border-rose/40 bg-rose-soft/30",
    iconColor: "text-rose",
  },
  importante: {
    label: "Importante",
    tone: "border-warn/40 bg-warn-soft/30",
    iconColor: "text-warn",
  },
  informativa: {
    label: "Informativa",
    tone: "border-line bg-surface-alt",
    iconColor: "text-ink-muted",
  },
};

export function CrucesActivosBanner({ cruces }: Props) {
  const criticos = cruces.filter((c) => c.severidad === "critica").length;
  const importantes = cruces.filter((c) => c.severidad === "importante").length;
  const informativos = cruces.filter(
    (c) => c.severidad === "informativa",
  ).length;

  // Expandido por default si hay críticos
  const [expanded, setExpanded] = useState(criticos > 0);

  if (cruces.length === 0) return null;

  const headerTone =
    criticos > 0
      ? "border-rose/40 bg-rose-soft/20"
      : importantes > 0
        ? "border-warn/40 bg-warn-soft/20"
        : "border-line bg-surface-alt";

  return (
    <section
      className={`rounded-xl border-2 ${headerTone} overflow-hidden`}
      aria-labelledby="cruces-banner-title"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-canvas/40"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              criticos > 0
                ? "bg-rose text-canvas"
                : importantes > 0
                  ? "bg-warn text-canvas"
                  : "bg-surface text-ink-strong"
            }`}
          >
            {criticos > 0 ? (
              <AlertTriangle className="h-4 w-4" strokeWidth={2.2} />
            ) : importantes > 0 ? (
              <Network className="h-4 w-4" strokeWidth={2.2} />
            ) : (
              <Info className="h-4 w-4" strokeWidth={2.2} />
            )}
          </div>
          <div className="min-w-0">
            <p
              id="cruces-banner-title"
              className="text-body-sm font-semibold text-ink-strong"
            >
              {cruces.length} cruce
              {cruces.length === 1 ? "" : "s"} clínico
              {cruces.length === 1 ? "" : "s"} detectado
              {cruces.length === 1 ? "" : "s"} en este paciente
            </p>
            <p className="mt-0.5 text-caption text-ink-muted">
              {criticos > 0 && (
                <span className="font-semibold text-rose">
                  {criticos} crítico{criticos === 1 ? "" : "s"}
                </span>
              )}
              {criticos > 0 && (importantes > 0 || informativos > 0) && " · "}
              {importantes > 0 && (
                <span className="font-semibold text-warn">
                  {importantes} importante{importantes === 1 ? "" : "s"}
                </span>
              )}
              {importantes > 0 && informativos > 0 && " · "}
              {informativos > 0 && (
                <span>
                  {informativos} informativo{informativos === 1 ? "" : "s"}
                </span>
              )}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronDown
            className="h-4 w-4 shrink-0 text-ink-muted"
            strokeWidth={2}
          />
        ) : (
          <ChevronRight
            className="h-4 w-4 shrink-0 text-ink-muted"
            strokeWidth={2}
          />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-line bg-canvas px-4 py-3 space-y-2.5">
              {cruces.map((c) => (
                <CruceMini key={c.id} cruce={c} />
              ))}
              <div className="border-t border-line pt-2.5">
                <Link
                  href="/dashboard/cruces"
                  className="inline-flex items-center gap-1 text-caption font-semibold text-validation hover:underline"
                >
                  Ver todos los cruces de mis pacientes
                  <ChevronRight className="h-3 w-3" strokeWidth={2.4} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function CruceMini({ cruce }: { cruce: CruceItem }) {
  const meta = SEVERIDAD_META[cruce.severidad];
  return (
    <div className={`rounded-lg border ${meta.tone} px-3 py-2.5`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-body-sm font-semibold text-ink-strong leading-snug">
            {cruce.nombre}
          </p>
          <p className="mt-0.5 text-caption text-ink-muted leading-relaxed">
            {cruce.descripcion}
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[0.55rem] uppercase tracking-eyebrow font-bold ${
            cruce.severidad === "critica"
              ? "bg-rose-soft text-rose"
              : cruce.severidad === "importante"
                ? "bg-warn-soft text-warn"
                : "bg-surface text-ink-muted"
          }`}
        >
          {meta.label}
        </span>
      </div>

      <div className="mt-2 rounded-md bg-surface px-2.5 py-1.5">
        <p className="text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-soft">
          Recomendación
        </p>
        <p className="mt-0.5 text-caption text-ink-strong leading-relaxed">
          {cruce.recomendacion}
        </p>
      </div>

      {cruce.farmacos &&
        (cruce.farmacos.obligatorios?.length ||
          cruce.farmacos.contraindicados?.length) && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {cruce.farmacos.obligatorios?.map((f) => (
              <span
                key={`o-${f}`}
                className="inline-flex items-center gap-1 rounded-full bg-validation-soft px-2 py-0.5 text-[0.6rem] font-semibold text-validation"
              >
                <PillBottle className="h-2.5 w-2.5" strokeWidth={2.4} />
                {f}
              </span>
            ))}
            {cruce.farmacos.contraindicados?.map((f) => (
              <span
                key={`c-${f}`}
                className="inline-flex items-center gap-1 rounded-full bg-rose-soft px-2 py-0.5 text-[0.6rem] font-semibold text-rose"
              >
                <PillBottle className="h-2.5 w-2.5" strokeWidth={2.4} />✕ {f}
              </span>
            ))}
          </div>
        )}

      <p className="mt-1.5 flex items-start gap-1 text-[0.6rem] text-ink-soft leading-snug">
        <FlaskConical
          className="mt-0.5 h-2.5 w-2.5 shrink-0"
          strokeWidth={2}
        />
        <span>{cruce.source}</span>
      </p>
    </div>
  );
}
