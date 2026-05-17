"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  HeartPulse,
  Users,
  TrendingUp,
  Activity,
  X,
  Loader2,
} from "lucide-react";
import {
  ClinicalMetric,
  ClinicalAlert,
  DataTable,
  StatusBadge,
  TrendChart,
} from "@/components/clinical";
import type { DataTableColumn } from "@/components/clinical";
import { UCI_TIPOS, type EventoModulo } from "@/lib/modulos-eventos";
import { calcularSofa, interpretarSofa } from "@/lib/scores-uci";
import { registrarSofa } from "./actions";

type SofaRow = {
  id: string;
  iniciales: string;
  edad: number | null;
  fecha: Date;
  sofaTotal: number;
  riesgo: "bajo" | "moderado" | "alto" | "critico";
  mortalidad: string;
  subscores: {
    respiratorio: number;
    coagulacion: number;
    hepatico: number;
    cardiovascular: number;
    neurologico: number;
    renal: number;
  };
};

export function UciBoard({ eventos }: { eventos: EventoModulo[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPatientInitials, setSelectedPatientInitials] = useState<
    string | null
  >(null);

  const rows = useMemo<SofaRow[]>(() => {
    return eventos
      .filter((e) => e.tipo === UCI_TIPOS.sofa)
      .map((e) => {
        const d = e.datos as {
          paciente_iniciales?: string | null;
          paciente_edad?: number | null;
          subscores?: SofaRow["subscores"] & { total: number };
          interpretacion?: { riesgo: SofaRow["riesgo"]; mortalidad: string };
        };
        const sub = d.subscores ?? {
          respiratorio: 0,
          coagulacion: 0,
          hepatico: 0,
          cardiovascular: 0,
          neurologico: 0,
          renal: 0,
          total: 0,
        };
        return {
          id: e.id,
          iniciales: d.paciente_iniciales ?? "—",
          edad: d.paciente_edad ?? null,
          fecha: new Date(e.completed_at ?? e.created_at),
          sofaTotal: sub.total,
          riesgo: d.interpretacion?.riesgo ?? "bajo",
          mortalidad: d.interpretacion?.mortalidad ?? "—",
          subscores: sub,
        };
      });
  }, [eventos]);

  // Group by patient for trends
  const trendByPatient = useMemo(() => {
    const map = new Map<string, number[]>();
    [...rows].reverse().forEach((r) => {
      if (r.iniciales === "—") return;
      const arr = map.get(r.iniciales) ?? [];
      arr.push(r.sofaTotal);
      map.set(r.iniciales, arr);
    });
    return map;
  }, [rows]);

  // Latest SOFA per patient (one row per active patient)
  const activeRows = useMemo<SofaRow[]>(() => {
    const seen = new Set<string>();
    return rows.filter((r) => {
      if (r.iniciales === "—" || seen.has(r.iniciales)) return false;
      seen.add(r.iniciales);
      return true;
    });
  }, [rows]);

  const metricas = useMemo(() => {
    const sofaPromedio =
      activeRows.length > 0
        ? Math.round(
            activeRows.reduce((sum, r) => sum + r.sofaTotal, 0) /
              activeRows.length,
          )
        : 0;
    const altoRiesgo = activeRows.filter(
      (r) => r.riesgo === "alto" || r.riesgo === "critico",
    ).length;
    return {
      pacientes: activeRows.length,
      sofaPromedio,
      altoRiesgo,
    };
  }, [activeRows]);

  const selectedTrend = selectedPatientInitials
    ? trendByPatient.get(selectedPatientInitials) ?? []
    : [];
  const selectedRows = selectedPatientInitials
    ? rows.filter((r) => r.iniciales === selectedPatientInitials)
    : [];

  return (
    <>
      <div className="space-y-5">
        {/* KPIs */}
        <section className="grid gap-3 sm:grid-cols-3">
          <ClinicalMetric
            label="Pacientes UCI"
            value={metricas.pacientes}
            unit={metricas.pacientes === 1 ? "paciente" : "pacientes"}
            icon={Users}
          />
          <ClinicalMetric
            label="SOFA promedio"
            value={metricas.sofaPromedio}
            unit="/ 24"
            icon={Activity}
            deltaInterpretation={metricas.sofaPromedio <= 6 ? "good" : "bad"}
            critical={metricas.sofaPromedio >= 13}
          />
          <ClinicalMetric
            label="Alto riesgo"
            value={metricas.altoRiesgo}
            unit={metricas.altoRiesgo === 1 ? "paciente" : "pacientes"}
            icon={TrendingUp}
            critical={metricas.altoRiesgo > 0}
            caption="SOFA ≥ 10"
          />
        </section>

        {/* Active patients list */}
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Pacientes UCI activos (último SOFA)
              </p>
              <p className="text-body-sm text-ink-muted">
                Click una fila para ver tendencia 30 días
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg-cta-primary inline-flex items-center gap-2 text-caption"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              Nuevo SOFA
            </button>
          </div>

          {activeRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
              <HeartPulse
                className="mx-auto h-8 w-8 text-ink-quiet mb-2"
                strokeWidth={1.6}
              />
              <p className="text-body-sm text-ink-muted">
                Sin SOFAs registrados en los últimos 30 días.
              </p>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="lg-cta-primary mt-4 inline-flex items-center gap-2 text-caption"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                Registrar primer SOFA
              </button>
            </div>
          ) : (
            <DataTable
              data={activeRows}
              getRowKey={(r) => r.id}
              onRowClick={(r) => setSelectedPatientInitials(r.iniciales)}
              columns={sofaColumns(trendByPatient)}
              rowTone={(r) =>
                r.riesgo === "critico" || r.riesgo === "alto"
                  ? "critical"
                  : r.riesgo === "moderado"
                    ? "warning"
                    : null
              }
            />
          )}
        </section>

        {/* Drill-down */}
        {selectedPatientInitials && selectedRows.length > 0 && (
          <section className="rounded-xl border border-line bg-surface p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                  Tendencia SOFA · {selectedRows.length} mediciones
                </p>
                <h3 className="mt-0.5 text-h3 font-semibold text-ink-strong">
                  {selectedPatientInitials}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatientInitials(null)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink-strong"
                aria-label="Cerrar"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
            </div>

            {selectedTrend.length >= 2 && (
              <div className="rounded-lg bg-surface-alt/40 p-3">
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold mb-2">
                  Evolución SOFA total
                </p>
                <TrendChart
                  data={selectedTrend}
                  tone={
                    selectedTrend[selectedTrend.length - 1]! >= 10
                      ? "critical"
                      : selectedTrend[selectedTrend.length - 1]! >= 7
                        ? "bad"
                        : "good"
                  }
                  width={600}
                  height={60}
                  showDots
                />
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-6">
              {(
                [
                  "respiratorio",
                  "coagulacion",
                  "hepatico",
                  "cardiovascular",
                  "neurologico",
                  "renal",
                ] as const
              ).map((sys) => {
                const score = selectedRows[0]?.subscores[sys] ?? 0;
                return (
                  <div
                    key={sys}
                    className={`rounded-lg border p-2 ${
                      score >= 3
                        ? "border-code-red/40 bg-code-red-bg/20"
                        : score >= 2
                          ? "border-code-amber/40 bg-code-amber-bg/20"
                          : "border-line bg-surface"
                    }`}
                  >
                    <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                      {sys.slice(0, 6)}
                    </p>
                    <p className="text-h2 font-bold tabular-nums text-ink-strong">
                      {score}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Future scope */}
        <ClinicalAlert
          severity="info"
          title="Próximas funcionalidades (Track B v2)"
          description="Flowsheet 24h horizontal con vitales del monitor (ECG, pulse-ox, ventilator). APACHE II al ingreso. FAST-HUG bundle daily checks. Vasoactivos dosis por peso. Delirium screening CAM-ICU."
        />
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <SofaDrawer onClose={() => setDrawerOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function sofaColumns(
  trendByPatient: Map<string, number[]>,
): DataTableColumn<SofaRow>[] {
  return [
    {
      key: "sofaTotal",
      label: "SOFA",
      numeric: true,
      sortValue: (r) => -r.sofaTotal,
      render: (r) => (
        <StatusBadge
          tone={
            r.riesgo === "critico" || r.riesgo === "alto"
              ? "critical"
              : r.riesgo === "moderado"
                ? "warning"
                : "success"
          }
          size="sm"
          pulse={r.riesgo === "critico"}
        >
          {r.sofaTotal}/24
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
      key: "riesgo",
      label: "Riesgo",
      render: (r) => (
        <span
          className={`text-caption font-semibold capitalize ${
            r.riesgo === "critico" || r.riesgo === "alto"
              ? "text-code-red"
              : r.riesgo === "moderado"
                ? "text-code-amber"
                : "text-code-green"
          }`}
        >
          {r.riesgo} · {r.mortalidad}
        </span>
      ),
    },
    {
      key: "trend",
      label: "Tendencia 30d",
      render: (r) => {
        const data = trendByPatient.get(r.iniciales) ?? [r.sofaTotal];
        if (data.length < 2)
          return <span className="text-caption text-ink-quiet">—</span>;
        const last = data[data.length - 1]!;
        return (
          <TrendChart
            data={data}
            tone={last >= 10 ? "critical" : last >= 7 ? "bad" : "good"}
            width={80}
            height={24}
          />
        );
      },
    },
    {
      key: "fecha",
      label: "Última medición",
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

function SofaDrawer({ onClose }: { onClose: () => void }) {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [pao2Fio2, setPao2Fio2] = useState("400");
  const [ventMecanica, setVentMecanica] = useState(false);
  const [plaquetasMil, setPlaquetasMil] = useState("200");
  const [bilirrubinaMg, setBilirrubinaMg] = useState("0.8");
  const [map, setMap] = useState("75");
  const [dopaminaMcgKgMin, setDopaminaMcgKgMin] = useState("0");
  const [dobutaminaActiva, setDobutaminaActiva] = useState(false);
  const [norepinefrinaMcgKgMin, setNorepinefrinaMcgKgMin] = useState("0");
  const [adrenalinaMcgKgMin, setAdrenalinaMcgKgMin] = useState("0");
  const [glasgow, setGlasgow] = useState("15");
  const [creatininaMg, setCreatininaMg] = useState("0.9");
  const [gastoUrinarioMlDia, setGastoUrinarioMlDia] = useState("1500");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const input = useMemo(
    () => ({
      pao2Fio2: Number(pao2Fio2) || 0,
      ventMecanica,
      plaquetasMil: Number(plaquetasMil) || 0,
      bilirrubinaMg: Number(bilirrubinaMg) || 0,
      map: Number(map) || 0,
      dopaminaMcgKgMin: Number(dopaminaMcgKgMin) || 0,
      dobutaminaActiva,
      norepinefrinaMcgKgMin: Number(norepinefrinaMcgKgMin) || 0,
      adrenalinaMcgKgMin: Number(adrenalinaMcgKgMin) || 0,
      glasgow: Number(glasgow) || 15,
      creatininaMg: Number(creatininaMg) || 0,
      gastoUrinarioMlDia: Number(gastoUrinarioMlDia) || 0,
    }),
    [
      pao2Fio2,
      ventMecanica,
      plaquetasMil,
      bilirrubinaMg,
      map,
      dopaminaMcgKgMin,
      dobutaminaActiva,
      norepinefrinaMcgKgMin,
      adrenalinaMcgKgMin,
      glasgow,
      creatininaMg,
      gastoUrinarioMlDia,
    ],
  );

  const subscores = useMemo(() => calcularSofa(input), [input]);
  const interp = useMemo(() => interpretarSofa(subscores.total), [subscores.total]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await registrarSofa({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        input,
      });
      if (r.status === "ok") onClose();
      else setError(r.message);
    });
  }

  const riesgoColor =
    interp.riesgo === "bajo"
      ? "text-code-green"
      : interp.riesgo === "moderado"
        ? "text-code-amber"
        : "text-code-red";

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
        aria-label="Nuevo SOFA"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-line bg-surface shadow-deep"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
          <div>
            <h3 className="text-h3 font-semibold text-ink-strong">
              SOFA total{" "}
              <span className={`tabular-nums ${riesgoColor}`}>
                {subscores.total}/24
              </span>
            </h3>
            <p className={`text-caption font-semibold ${riesgoColor}`}>
              {interp.riesgo} · mortalidad {interp.mortalidad}
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

          <Block titulo="Respiratorio" puntos={subscores.respiratorio}>
            <Field label="PaO₂/FiO₂ (mmHg)">
              <input
                type="number"
                value={pao2Fio2}
                onChange={(e) => setPao2Fio2(e.target.value)}
                className="lg-input"
              />
            </Field>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ventMecanica}
                onChange={(e) => setVentMecanica(e.target.checked)}
                className="h-4 w-4 rounded border-line-strong"
              />
              <span className="text-caption text-ink-strong">
                Ventilación mecánica
              </span>
            </label>
          </Block>

          <Block titulo="Coagulación" puntos={subscores.coagulacion}>
            <Field label="Plaquetas (×10³/µL)">
              <input
                type="number"
                value={plaquetasMil}
                onChange={(e) => setPlaquetasMil(e.target.value)}
                className="lg-input"
              />
            </Field>
          </Block>

          <Block titulo="Hepático" puntos={subscores.hepatico}>
            <Field label="Bilirrubina (mg/dL)">
              <input
                type="number"
                step="0.1"
                value={bilirrubinaMg}
                onChange={(e) => setBilirrubinaMg(e.target.value)}
                className="lg-input"
              />
            </Field>
          </Block>

          <Block titulo="Cardiovascular" puntos={subscores.cardiovascular}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="MAP (mmHg)">
                <input
                  type="number"
                  value={map}
                  onChange={(e) => setMap(e.target.value)}
                  className="lg-input"
                />
              </Field>
              <Field label="Dopamina mcg/kg/min">
                <input
                  type="number"
                  step="0.1"
                  value={dopaminaMcgKgMin}
                  onChange={(e) => setDopaminaMcgKgMin(e.target.value)}
                  className="lg-input"
                />
              </Field>
              <Field label="Norepi mcg/kg/min">
                <input
                  type="number"
                  step="0.01"
                  value={norepinefrinaMcgKgMin}
                  onChange={(e) =>
                    setNorepinefrinaMcgKgMin(e.target.value)
                  }
                  className="lg-input"
                />
              </Field>
              <Field label="Adrenalina mcg/kg/min">
                <input
                  type="number"
                  step="0.01"
                  value={adrenalinaMcgKgMin}
                  onChange={(e) => setAdrenalinaMcgKgMin(e.target.value)}
                  className="lg-input"
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dobutaminaActiva}
                onChange={(e) => setDobutaminaActiva(e.target.checked)}
                className="h-4 w-4 rounded border-line-strong"
              />
              <span className="text-caption text-ink-strong">
                Dobutamina activa
              </span>
            </label>
          </Block>

          <Block titulo="Neurológico" puntos={subscores.neurologico}>
            <Field label="Glasgow (3-15)">
              <input
                type="number"
                value={glasgow}
                onChange={(e) => setGlasgow(e.target.value)}
                min={3}
                max={15}
                className="lg-input"
              />
            </Field>
          </Block>

          <Block titulo="Renal" puntos={subscores.renal}>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Creatinina (mg/dL)">
                <input
                  type="number"
                  step="0.1"
                  value={creatininaMg}
                  onChange={(e) => setCreatininaMg(e.target.value)}
                  className="lg-input"
                />
              </Field>
              <Field label="Gasto urinario (mL/día)">
                <input
                  type="number"
                  value={gastoUrinarioMlDia}
                  onChange={(e) => setGastoUrinarioMlDia(e.target.value)}
                  className="lg-input"
                />
              </Field>
            </div>
          </Block>

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
                <HeartPulse className="h-3.5 w-3.5" strokeWidth={2.4} />
              )}
              Registrar SOFA
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function Block({
  titulo,
  puntos,
  children,
}: {
  titulo: string;
  puntos: number;
  children: React.ReactNode;
}) {
  const tone =
    puntos === 0
      ? "border-line bg-surface"
      : puntos <= 1
        ? "border-code-green/30 bg-code-green-bg/20"
        : puntos <= 2
          ? "border-code-amber/30 bg-code-amber-bg/20"
          : "border-code-red/40 bg-code-red-bg/20";
  return (
    <div className={`rounded-lg border ${tone} p-3 space-y-2`}>
      <div className="flex items-baseline justify-between">
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
          {titulo}
        </p>
        <span className="text-h3 font-bold tabular-nums text-ink-strong">
          {puntos}
        </span>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-caption font-medium text-ink-muted mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
