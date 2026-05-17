"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Brain, Users, Activity, AlertTriangle, X, Loader2 } from "lucide-react";
import {
  ClinicalMetric,
  ClinicalAlert,
  DataTable,
  StatusBadge,
} from "@/components/clinical";
import type { DataTableColumn } from "@/components/clinical";
import { NEUROLOGIA_TIPOS, type EventoModulo } from "@/lib/modulos-eventos";
import { calcularNihss } from "@/lib/scores-especialidades";
import { registrarNihss } from "./actions";

type NihssRow = {
  id: string;
  iniciales: string;
  edad: number | null;
  fecha: Date;
  total: number;
  severidad: "sin_deficit" | "leve" | "moderado" | "moderado_severo" | "severo";
  tpaCandidato: boolean;
};

export function NeurologiaBoard({ eventos }: { eventos: EventoModulo[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rows = useMemo<NihssRow[]>(() => {
    return eventos
      .filter((e) => e.tipo === NEUROLOGIA_TIPOS.nihss)
      .map((e) => {
        const d = e.datos as {
          paciente_iniciales?: string | null;
          paciente_edad?: number | null;
          resultado?: {
            total: number;
            severidad: NihssRow["severidad"];
            tpaCandidato: boolean;
          };
        };
        return {
          id: e.id,
          iniciales: d.paciente_iniciales ?? "—",
          edad: d.paciente_edad ?? null,
          fecha: new Date(e.completed_at ?? e.created_at),
          total: d.resultado?.total ?? 0,
          severidad: d.resultado?.severidad ?? "sin_deficit",
          tpaCandidato: d.resultado?.tpaCandidato ?? false,
        };
      });
  }, [eventos]);

  const activeRows = useMemo(() => {
    const seen = new Set<string>();
    return rows.filter((r) => {
      if (r.iniciales === "—" || seen.has(r.iniciales)) return false;
      seen.add(r.iniciales);
      return true;
    });
  }, [rows]);

  const metricas = useMemo(() => {
    const promedio =
      activeRows.length > 0
        ? Math.round(
            activeRows.reduce((s, r) => s + r.total, 0) / activeRows.length,
          )
        : 0;
    const severos = activeRows.filter(
      (r) => r.severidad === "severo" || r.severidad === "moderado_severo",
    ).length;
    return { pacientes: activeRows.length, promedio, severos };
  }, [activeRows]);

  return (
    <>
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-3">
          <ClinicalMetric
            label="Pacientes evaluados"
            value={metricas.pacientes}
            unit={metricas.pacientes === 1 ? "paciente" : "pacientes"}
            icon={Users}
          />
          <ClinicalMetric
            label="NIHSS promedio"
            value={metricas.promedio}
            unit="/ 42"
            icon={Activity}
            critical={metricas.promedio >= 16}
          />
          <ClinicalMetric
            label="Severo / mod-severo"
            value={metricas.severos}
            unit={metricas.severos === 1 ? "paciente" : "pacientes"}
            icon={AlertTriangle}
            critical={metricas.severos > 0}
          />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Pacientes evaluados (90 días)
              </p>
              <p className="text-body-sm text-ink-muted">
                Último NIHSS por paciente
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg-cta-primary inline-flex items-center gap-2 text-caption"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              Nuevo NIHSS
            </button>
          </div>

          {activeRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
              <Brain
                className="mx-auto h-8 w-8 text-ink-quiet mb-2"
                strokeWidth={1.6}
              />
              <p className="text-body-sm text-ink-muted">
                Sin NIHSS registrados en los últimos 90 días.
              </p>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="lg-cta-primary mt-4 inline-flex items-center gap-2 text-caption"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                Registrar primero
              </button>
            </div>
          ) : (
            <DataTable
              data={activeRows}
              getRowKey={(r) => r.id}
              columns={nihssColumns()}
              rowTone={(r) =>
                r.severidad === "severo" || r.severidad === "moderado_severo"
                  ? "critical"
                  : r.severidad === "moderado"
                    ? "warning"
                    : null
              }
            />
          )}
        </section>

        <ClinicalAlert
          severity="info"
          title="Roadmap del módulo Neurología"
          description="Glasgow Coma Scale longitudinal, MMSE y MoCA para deterioro cognitivo, escalas de Parkinson, monitor de epilepsia."
        />
      </div>

      <AnimatePresence>
        {drawerOpen && <NihssDrawer onClose={() => setDrawerOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function nihssColumns(): DataTableColumn<NihssRow>[] {
  return [
    {
      key: "total",
      label: "NIHSS",
      numeric: true,
      sortValue: (r) => -r.total,
      render: (r) => (
        <StatusBadge
          tone={
            r.severidad === "severo" || r.severidad === "moderado_severo"
              ? "critical"
              : r.severidad === "moderado"
                ? "warning"
                : "success"
          }
          size="sm"
        >
          {r.total}/42
        </StatusBadge>
      ),
    },
    {
      key: "iniciales",
      label: "Paciente",
      render: (r) => (
        <span className="font-semibold text-ink-strong">
          {r.iniciales}
          {r.edad && (
            <span className="ml-1 font-normal text-ink-muted tabular-nums">
              {r.edad}a
            </span>
          )}
        </span>
      ),
    },
    {
      key: "severidad",
      label: "Severidad",
      render: (r) => (
        <span className="text-caption font-semibold text-ink-strong">
          {r.severidad.replace(/_/g, " ")}
          {r.tpaCandidato && (
            <span className="ml-2 inline-flex items-center rounded-full bg-warn-soft px-1.5 py-0.5 text-[0.6rem] text-warn">
              tPA candidato
            </span>
          )}
        </span>
      ),
    },
    {
      key: "fecha",
      label: "Fecha",
      sortValue: (r) => -r.fecha.getTime(),
      render: (r) => (
        <span className="tabular-nums text-ink-muted">
          {r.fecha.toLocaleString("es-MX", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];
}

interface NihssItem {
  key: keyof Parameters<typeof calcularNihss>[0];
  label: string;
  max: 2 | 3 | 4;
}

const NIHSS_ITEMS: NihssItem[] = [
  { key: "nivelConciencia", label: "1a. Nivel de conciencia", max: 3 },
  { key: "preguntasLoc", label: "1b. Preguntas LOC", max: 2 },
  { key: "ordenesLoc", label: "1c. Órdenes LOC", max: 2 },
  { key: "mirada", label: "2. Mirada conjugada", max: 2 },
  { key: "camposVisuales", label: "3. Campos visuales", max: 3 },
  { key: "paresia_facial", label: "4. Parálisis facial", max: 3 },
  { key: "motorMs", label: "5. Motor MS (peor lado)", max: 4 },
  { key: "motorMi", label: "6. Motor MI (peor lado)", max: 4 },
  { key: "ataxia", label: "7. Ataxia de extremidades", max: 2 },
  { key: "sensibilidad", label: "8. Sensibilidad", max: 2 },
  { key: "lenguaje", label: "9. Lenguaje", max: 3 },
  { key: "disartria", label: "10. Disartria", max: 2 },
  { key: "negligencia", label: "11. Negligencia/inatención", max: 2 },
];

function NihssDrawer({ onClose }: { onClose: () => void }) {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(NIHSS_ITEMS.map((i) => [i.key as string, 0])),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const r = useMemo(
    () => calcularNihss(values as unknown as Parameters<typeof calcularNihss>[0]),
    [values],
  );

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await registrarNihss({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        input: values as unknown as Parameters<typeof calcularNihss>[0],
      });
      if (res.status === "ok") onClose();
      else setError(res.message);
    });
  }

  const tone =
    r.severidad === "severo" || r.severidad === "moderado_severo"
      ? "text-rose"
      : r.severidad === "moderado"
        ? "text-warn"
        : "text-validation";

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
      />
      <motion.aside
        role="dialog"
        aria-label="Nuevo NIHSS"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-line bg-surface shadow-deep"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
          <div>
            <h3 className="text-h3 font-semibold text-ink-strong">
              NIHSS total{" "}
              <span className={`tabular-nums ${tone}`}>{r.total}/42</span>
            </h3>
            <p className={`text-caption font-semibold ${tone}`}>
              {r.severidad.replace(/_/g, " ")}
              {r.tpaCandidato && " · candidato a tPA"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink-strong"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Iniciales">
              <input
                type="text"
                value={iniciales}
                onChange={(e) =>
                  setIniciales(e.target.value.toUpperCase().slice(0, 8))
                }
                maxLength={8}
                className="lg-input"
                placeholder="J.M."
              />
            </Field>
            <Field label="Edad">
              <input
                type="number"
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                min={0}
                max={120}
                className="lg-input"
              />
            </Field>
          </div>

          {NIHSS_ITEMS.map((item) => (
            <Field key={String(item.key)} label={item.label}>
              <select
                value={values[item.key as string]}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    [item.key as string]: Number(e.target.value),
                  }))
                }
                className="lg-input"
              >
                {Array.from({ length: item.max + 1 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </Field>
          ))}

          {error && (
            <ClinicalAlert
              severity="critical"
              title="No se pudo registrar"
              description={error}
            />
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="lg-cta-ghost text-caption"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="lg-cta-primary inline-flex items-center gap-2 text-caption disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
              ) : (
                <Brain className="h-3.5 w-3.5" strokeWidth={2.4} />
              )}
              Registrar NIHSS
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption font-medium text-ink-muted mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
