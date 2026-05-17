"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Activity, Users, ShieldCheck, AlertTriangle, X, Loader2 } from "lucide-react";
import {
  ClinicalMetric,
  ClinicalAlert,
  DataTable,
  StatusBadge,
} from "@/components/clinical";
import type { DataTableColumn } from "@/components/clinical";
import { ONCOLOGIA_TIPOS, type EventoModulo } from "@/lib/modulos-eventos";
import { interpretarEcog } from "@/lib/scores-especialidades";
import { registrarEcog } from "./actions";

type EcogRow = {
  id: string;
  iniciales: string;
  edad: number | null;
  fecha: Date;
  ecog: 0 | 1 | 2 | 3 | 4 | 5;
  karnofsky: number;
  descripcion: string;
  apto_quimio: boolean;
};

export function OncologiaBoard({ eventos }: { eventos: EventoModulo[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rows = useMemo<EcogRow[]>(() => {
    return eventos
      .filter((e) => e.tipo === ONCOLOGIA_TIPOS.ecog)
      .map((e) => {
        const d = e.datos as {
          paciente_iniciales?: string | null;
          paciente_edad?: number | null;
          resultado?: ReturnType<typeof interpretarEcog>;
        };
        const r = d.resultado;
        return {
          id: e.id,
          iniciales: d.paciente_iniciales ?? "—",
          edad: d.paciente_edad ?? null,
          fecha: new Date(e.completed_at ?? e.created_at),
          ecog: (r?.ecog ?? 0) as EcogRow["ecog"],
          karnofsky: r?.karnofskyAprox ?? 100,
          descripcion: r?.descripcion ?? "—",
          apto_quimio: r?.apto_quimio ?? false,
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
    const aptos = activeRows.filter((r) => r.apto_quimio).length;
    const declive = activeRows.filter((r) => r.ecog >= 3).length;
    return { pacientes: activeRows.length, aptos, declive };
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
            label="Aptos quimio"
            value={metricas.aptos}
            unit={metricas.aptos === 1 ? "paciente" : "pacientes"}
            icon={ShieldCheck}
            caption="ECOG ≤ 2"
          />
          <ClinicalMetric
            label="Declive funcional"
            value={metricas.declive}
            unit={metricas.declive === 1 ? "paciente" : "pacientes"}
            icon={AlertTriangle}
            critical={metricas.declive > 0}
            caption="ECOG ≥ 3"
          />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Pacientes evaluados (180 días)
              </p>
              <p className="text-body-sm text-ink-muted">
                Último ECOG performance status por paciente
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg-cta-primary inline-flex items-center gap-2 text-caption"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              Nuevo ECOG
            </button>
          </div>

          {activeRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
              <Activity
                className="mx-auto h-8 w-8 text-ink-quiet mb-2"
                strokeWidth={1.6}
              />
              <p className="text-body-sm text-ink-muted">
                Sin ECOG registrados en los últimos 180 días.
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
              columns={ecogColumns()}
              rowTone={(r) =>
                r.ecog >= 4 ? "critical" : r.ecog === 3 ? "warning" : null
              }
            />
          )}
        </section>

        <ClinicalAlert
          severity="info"
          title="Roadmap del módulo Oncología"
          description="Estadificación TNM, plan de quimioterapia con ajuste por superficie corporal, seguimiento de toxicidades CTCAE, registro de respuesta RECIST."
        />
      </div>

      <AnimatePresence>
        {drawerOpen && <EcogDrawer onClose={() => setDrawerOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function ecogColumns(): DataTableColumn<EcogRow>[] {
  return [
    {
      key: "ecog",
      label: "ECOG",
      numeric: true,
      sortValue: (r) => -r.ecog,
      render: (r) => (
        <StatusBadge
          tone={
            r.ecog >= 4 ? "critical" : r.ecog === 3 ? "warning" : "success"
          }
          size="sm"
        >
          {r.ecog}
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
      key: "descripcion",
      label: "Estado funcional",
      render: (r) => (
        <span className="text-caption text-ink-strong">
          {r.descripcion}{" "}
          <span className="text-ink-muted">· Karnofsky ~{r.karnofsky}</span>
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
          })}
        </span>
      ),
    },
  ];
}

function EcogDrawer({ onClose }: { onClose: () => void }) {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [ecog, setEcog] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const r = useMemo(() => interpretarEcog(ecog), [ecog]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await registrarEcog({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        ecog,
      });
      if (res.status === "ok") onClose();
      else setError(res.message);
    });
  }

  const tone =
    r.ecog >= 4 ? "text-rose" : r.ecog === 3 ? "text-warn" : "text-validation";

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
        aria-label="Nuevo ECOG"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-line bg-surface shadow-deep"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
          <div>
            <h3 className="text-h3 font-semibold text-ink-strong">
              ECOG <span className={`tabular-nums ${tone}`}>{r.ecog}</span>
            </h3>
            <p className={`text-caption font-semibold ${tone}`}>
              Karnofsky ~{r.karnofskyAprox} ·{" "}
              {r.apto_quimio ? "Apto quimioterapia" : "No apto quimio agresiva"}
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

          <div>
            <p className="text-caption font-medium text-ink-muted mb-2">
              Performance status (Eastern Cooperative Oncology Group)
            </p>
            <div className="space-y-1.5">
              {([0, 1, 2, 3, 4, 5] as const).map((n) => {
                const i = interpretarEcog(n);
                const selected = ecog === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEcog(n)}
                    className={`block w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? "border-validation bg-validation-soft"
                        : "border-line bg-surface hover:border-line-strong"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full font-bold tabular-nums ${
                          selected
                            ? "bg-validation text-canvas"
                            : "bg-surface-alt text-ink-strong"
                        }`}
                      >
                        {n}
                      </span>
                      <span className="text-body-sm text-ink-strong flex-1">
                        {i.descripcion}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

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
                <Activity className="h-3.5 w-3.5" strokeWidth={2.4} />
              )}
              Registrar ECOG
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
