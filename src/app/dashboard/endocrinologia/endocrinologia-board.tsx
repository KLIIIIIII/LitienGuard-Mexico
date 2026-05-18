"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Plus, Droplet, Users, Target, AlertTriangle, X, Loader2, ExternalLink } from "lucide-react";
import {
  ClinicalMetric,
  ClinicalAlert,
  DataTable,
  StatusBadge,
} from "@/components/clinical";
import type { DataTableColumn } from "@/components/clinical";
import { ENDOCRINOLOGIA_TIPOS, type EventoModulo } from "@/lib/modulos-eventos";
import { interpretarHba1c } from "@/lib/scores-especialidades";
import { registrarHba1c } from "./actions";

type A1cRow = {
  id: string;
  pacienteId: string | null;
  iniciales: string;
  edad: number | null;
  fecha: Date;
  hba1c: number;
  glucosaPromedio: number;
  categoria:
    | "no_diabetes"
    | "prediabetes"
    | "diabetes_meta"
    | "control_aceptable"
    | "fuera_meta";
  recomendacion: string;
};

const CATEGORIA_LABEL: Record<A1cRow["categoria"], string> = {
  no_diabetes: "Sin diabetes",
  prediabetes: "Prediabetes",
  diabetes_meta: "DM en meta",
  control_aceptable: "Control aceptable",
  fuera_meta: "Fuera de meta",
};

export function EndocrinologiaBoard({ eventos }: { eventos: EventoModulo[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rows = useMemo<A1cRow[]>(() => {
    return eventos
      .filter((e) => e.tipo === ENDOCRINOLOGIA_TIPOS.hba1c_control)
      .map((e) => {
        const d = e.datos as {
          paciente_iniciales?: string | null;
          paciente_edad?: number | null;
          resultado?: ReturnType<typeof interpretarHba1c>;
        };
        const r = d.resultado;
        return {
          id: e.id,
          pacienteId: e.paciente_id,
          iniciales: d.paciente_iniciales ?? "—",
          edad: d.paciente_edad ?? null,
          fecha: new Date(e.completed_at ?? e.created_at),
          hba1c: r?.hba1c ?? 0,
          glucosaPromedio: r?.glucosaPromedio ?? 0,
          categoria: r?.categoria ?? "no_diabetes",
          recomendacion: r?.recomendacion ?? "—",
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
    const enMeta = activeRows.filter((r) => r.categoria === "diabetes_meta").length;
    const fueraMeta = activeRows.filter((r) => r.categoria === "fuera_meta").length;
    return { pacientes: activeRows.length, enMeta, fueraMeta };
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
            label="En meta"
            value={metricas.enMeta}
            unit={metricas.enMeta === 1 ? "paciente" : "pacientes"}
            icon={Target}
            deltaInterpretation="good"
          />
          <ClinicalMetric
            label="Fuera de meta"
            value={metricas.fueraMeta}
            unit={metricas.fueraMeta === 1 ? "paciente" : "pacientes"}
            icon={AlertTriangle}
            critical={metricas.fueraMeta > 0}
          />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Pacientes evaluados (12 meses)
              </p>
              <p className="text-body-sm text-ink-muted">
                Última HbA1c por paciente
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg-cta-primary inline-flex items-center gap-2 text-caption"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              Nueva HbA1c
            </button>
          </div>

          {activeRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
              <Droplet
                className="mx-auto h-8 w-8 text-ink-quiet mb-2"
                strokeWidth={1.6}
              />
              <p className="text-body-sm text-ink-muted">
                Sin HbA1c registradas en los últimos 12 meses.
              </p>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="lg-cta-primary mt-4 inline-flex items-center gap-2 text-caption"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                Registrar primera
              </button>
            </div>
          ) : (
            <DataTable
              data={activeRows}
              getRowKey={(r) => r.id}
              columns={a1cColumns()}
              rowTone={(r) =>
                r.categoria === "fuera_meta"
                  ? "critical"
                  : r.categoria === "control_aceptable"
                    ? "warning"
                    : null
              }
            />
          )}
        </section>

        <ClinicalAlert
          severity="info"
          title="Roadmap del módulo Endocrinología"
          description="Tiroides (TSH/T4L con interpretación), seguimiento de retinopatía y pie diabético, calculadora de insulina basal/bolo, screening de obesidad y síndrome metabólico."
        />
      </div>

      <AnimatePresence>
        {drawerOpen && <A1cDrawer onClose={() => setDrawerOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function a1cColumns(): DataTableColumn<A1cRow>[] {
  return [
    {
      key: "hba1c",
      label: "HbA1c %",
      numeric: true,
      sortValue: (r) => -r.hba1c,
      render: (r) => (
        <StatusBadge
          tone={
            r.categoria === "fuera_meta"
              ? "critical"
              : r.categoria === "control_aceptable"
                ? "warning"
                : "success"
          }
          size="sm"
        >
          {r.hba1c.toFixed(1)}%
        </StatusBadge>
      ),
    },
    {
      key: "iniciales",
      label: "Paciente",
      render: (r) =>
        r.pacienteId ? (
          <Link
            href={`/dashboard/pacientes/${r.pacienteId}`}
            className="group inline-flex items-center gap-1 font-semibold text-ink-strong hover:text-validation"
          >
            {r.iniciales}
            {r.edad && (
              <span className="font-normal text-ink-muted tabular-nums">
                {r.edad}a
              </span>
            )}
            <ExternalLink
              className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100"
              strokeWidth={2}
            />
          </Link>
        ) : (
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
      key: "categoria",
      label: "Categoría",
      render: (r) => (
        <span
          className={`text-caption font-semibold ${
            r.categoria === "fuera_meta"
              ? "text-rose"
              : r.categoria === "control_aceptable"
                ? "text-warn"
                : "text-validation"
          }`}
        >
          {CATEGORIA_LABEL[r.categoria]}{" "}
          <span className="text-ink-muted font-normal">
            · eAG {r.glucosaPromedio} mg/dL
          </span>
        </span>
      ),
    },
    {
      key: "fecha",
      label: "Fecha",
      sortValue: (r) => -r.fecha.getTime(),
      render: (r) => (
        <span className="tabular-nums text-ink-muted">
          {r.fecha.toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];
}

function A1cDrawer({ onClose }: { onClose: () => void }) {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [hba1c, setHba1c] = useState("7.0");
  const [meta, setMeta] = useState("7.0");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const r = useMemo(
    () => interpretarHba1c(Number(hba1c) || 0, Number(meta) || 7.0),
    [hba1c, meta],
  );

  function submit() {
    setError(null);
    const val = Number(hba1c);
    if (!val || val < 3 || val > 20) {
      setError("HbA1c fuera de rango (3-20%)");
      return;
    }
    startTransition(async () => {
      const res = await registrarHba1c({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        hba1c: val,
        metaIndividualizada: Number(meta) || 7.0,
      });
      if (res.status === "ok") onClose();
      else setError(res.message);
    });
  }

  const tone =
    r.categoria === "fuera_meta"
      ? "text-rose"
      : r.categoria === "control_aceptable"
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
        aria-label="Nueva HbA1c"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-line bg-surface shadow-deep"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
          <div>
            <h3 className="text-h3 font-semibold text-ink-strong">
              HbA1c{" "}
              <span className={`tabular-nums ${tone}`}>
                {r.hba1c.toFixed(1)}%
              </span>
            </h3>
            <p className={`text-caption font-semibold ${tone}`}>
              {CATEGORIA_LABEL[r.categoria]} · eAG {r.glucosaPromedio} mg/dL
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

          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="HbA1c (%)">
              <input
                type="number"
                step="0.1"
                value={hba1c}
                onChange={(e) => setHba1c(e.target.value)}
                min={3}
                max={20}
                className="lg-input"
              />
            </Field>
            <Field label="Meta individualizada (%)">
              <input
                type="number"
                step="0.1"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                min={5.5}
                max={9.5}
                className="lg-input"
              />
            </Field>
          </div>

          <div className="rounded-lg border border-line bg-surface-alt/40 p-3">
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
              Recomendación clínica
            </p>
            <p className="mt-1 text-body-sm text-ink-strong">{r.recomendacion}</p>
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
                <Droplet className="h-3.5 w-3.5" strokeWidth={2.4} />
              )}
              Registrar HbA1c
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
