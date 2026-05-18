"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Heart, Users, Activity, AlertTriangle, X, Loader2, ExternalLink } from "lucide-react";
import {
  ClinicalMetric,
  ClinicalAlert,
  DataTable,
  StatusBadge,
} from "@/components/clinical";
import type { DataTableColumn } from "@/components/clinical";
import { CARDIOLOGIA_TIPOS, type EventoModulo } from "@/lib/modulos-eventos";
import { calcularHeart, type HeartInput } from "@/lib/scores-especialidades";
import { registrarHeart } from "./actions";

type HeartRow = {
  id: string;
  pacienteId: string | null;
  iniciales: string;
  edad: number | null;
  fecha: Date;
  total: number;
  riesgo: "bajo" | "moderado" | "alto";
  mortalidad: string;
};

export function CardiologiaBoard({ eventos }: { eventos: EventoModulo[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rows = useMemo<HeartRow[]>(() => {
    return eventos
      .filter((e) => e.tipo === CARDIOLOGIA_TIPOS.heart_score)
      .map((e) => {
        const d = e.datos as {
          paciente_iniciales?: string | null;
          paciente_edad?: number | null;
          resultado?: { total: number; riesgo: HeartRow["riesgo"]; mortalidad6sem: string };
        };
        return {
          id: e.id,
          pacienteId: e.paciente_id,
          iniciales: d.paciente_iniciales ?? "—",
          edad: d.paciente_edad ?? null,
          fecha: new Date(e.completed_at ?? e.created_at),
          total: d.resultado?.total ?? 0,
          riesgo: d.resultado?.riesgo ?? "bajo",
          mortalidad: d.resultado?.mortalidad6sem ?? "—",
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
    const altoRiesgo = activeRows.filter(
      (r) => r.riesgo === "alto" || r.riesgo === "moderado",
    ).length;
    return { pacientes: activeRows.length, promedio, altoRiesgo };
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
            label="HEART promedio"
            value={metricas.promedio}
            unit="/ 10"
            icon={Activity}
            deltaInterpretation={metricas.promedio <= 3 ? "good" : "bad"}
            critical={metricas.promedio >= 7}
          />
          <ClinicalMetric
            label="Riesgo mod/alto"
            value={metricas.altoRiesgo}
            unit={metricas.altoRiesgo === 1 ? "paciente" : "pacientes"}
            icon={AlertTriangle}
            critical={metricas.altoRiesgo > 0}
          />
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Pacientes evaluados (90 días)
              </p>
              <p className="text-body-sm text-ink-muted">
                Último HEART score registrado por paciente
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg-cta-primary inline-flex items-center gap-2 text-caption"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              Nuevo HEART
            </button>
          </div>

          {activeRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
              <Heart
                className="mx-auto h-8 w-8 text-ink-quiet mb-2"
                strokeWidth={1.6}
              />
              <p className="text-body-sm text-ink-muted">
                Sin HEART scores registrados en los últimos 90 días.
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
              columns={heartColumns()}
              rowTone={(r) =>
                r.riesgo === "alto"
                  ? "critical"
                  : r.riesgo === "moderado"
                    ? "warning"
                    : null
              }
            />
          )}
        </section>

        <ClinicalAlert
          severity="info"
          title="Roadmap del módulo Cardiología"
          description="GRACE risk score, CHA₂DS₂-VASc para FA, TIMI risk para SCA, monitor ECG continuo, integración con eco transtorácico."
        />
      </div>

      <AnimatePresence>
        {drawerOpen && <HeartDrawer onClose={() => setDrawerOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

function heartColumns(): DataTableColumn<HeartRow>[] {
  return [
    {
      key: "total",
      label: "HEART",
      numeric: true,
      sortValue: (r) => -r.total,
      render: (r) => (
        <StatusBadge
          tone={
            r.riesgo === "alto"
              ? "critical"
              : r.riesgo === "moderado"
                ? "warning"
                : "success"
          }
          size="sm"
        >
          {r.total}/10
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
      key: "riesgo",
      label: "Riesgo SCA 6 sem",
      render: (r) => (
        <span
          className={`text-caption font-semibold capitalize ${
            r.riesgo === "alto"
              ? "text-rose"
              : r.riesgo === "moderado"
                ? "text-warn"
                : "text-validation"
          }`}
        >
          {r.riesgo} · {r.mortalidad}
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

function HeartDrawer({ onClose }: { onClose: () => void }) {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [historia, setHistoria] = useState<0 | 1 | 2>(0);
  const [ecg, setEcg] = useState<0 | 1 | 2>(0);
  const [edadScore, setEdadScore] = useState<0 | 1 | 2>(0);
  const [factores, setFactores] = useState<0 | 1 | 2>(0);
  const [trop, setTrop] = useState<0 | 1 | 2>(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const input: HeartInput = {
    historia,
    ecg,
    edad: edadScore,
    factoresRiesgo: factores,
    troponina: trop,
  };
  const r = useMemo(() => calcularHeart(input), [
    historia,
    ecg,
    edadScore,
    factores,
    trop,
  ]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await registrarHeart({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        input,
      });
      if (res.status === "ok") onClose();
      else setError(res.message);
    });
  }

  const tone =
    r.riesgo === "alto"
      ? "text-rose"
      : r.riesgo === "moderado"
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
        aria-label="Nuevo HEART score"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-line bg-surface shadow-deep"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
          <div>
            <h3 className="text-h3 font-semibold text-ink-strong">
              HEART total{" "}
              <span className={`tabular-nums ${tone}`}>{r.total}/10</span>
            </h3>
            <p className={`text-caption font-semibold ${tone}`}>
              {r.riesgo} · mortalidad {r.mortalidad6sem}
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

          <Choice
            label="Historia"
            value={historia}
            onChange={(v) => setHistoria(v as 0 | 1 | 2)}
            options={[
              [0, "Ligeramente sospechosa"],
              [1, "Moderadamente sospechosa"],
              [2, "Altamente sospechosa"],
            ]}
          />
          <Choice
            label="ECG"
            value={ecg}
            onChange={(v) => setEcg(v as 0 | 1 | 2)}
            options={[
              [0, "Normal"],
              [1, "Alteraciones inespecíficas"],
              [2, "Desnivel ST significativo"],
            ]}
          />
          <Choice
            label="Edad"
            value={edadScore}
            onChange={(v) => setEdadScore(v as 0 | 1 | 2)}
            options={[
              [0, "< 45 años"],
              [1, "45-64 años"],
              [2, "≥ 65 años"],
            ]}
          />
          <Choice
            label="Factores de riesgo"
            value={factores}
            onChange={(v) => setFactores(v as 0 | 1 | 2)}
            options={[
              [0, "Ninguno"],
              [1, "1-2 FRCV"],
              [2, "≥3 FRCV o ECV conocida"],
            ]}
          />
          <Choice
            label="Troponina"
            value={trop}
            onChange={(v) => setTrop(v as 0 | 1 | 2)}
            options={[
              [0, "Normal"],
              [1, "1-3× límite superior"],
              [2, "> 3× límite superior"],
            ]}
          />

          <div className="rounded-lg border border-line bg-surface-alt/40 p-3">
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
              Conducta sugerida
            </p>
            <p className="mt-1 text-body-sm text-ink-strong">{r.conducta}</p>
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
                <Heart className="h-3.5 w-3.5" strokeWidth={2.4} />
              )}
              Registrar HEART
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

function Choice({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: Array<[number, string]>;
}) {
  return (
    <div>
      <p className="text-caption font-medium text-ink-muted mb-1.5">{label}</p>
      <div className="grid gap-1.5 sm:grid-cols-3">
        {options.map(([v, lbl]) => {
          const selected = value === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`rounded-lg border px-3 py-2 text-caption transition-colors ${
                selected
                  ? "border-validation bg-validation-soft text-validation font-semibold"
                  : "border-line bg-surface text-ink-strong hover:border-line-strong"
              }`}
            >
              <span className="block font-semibold tabular-nums">{v}</span>
              <span className="block text-[0.65rem] leading-tight mt-0.5">
                {lbl}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
