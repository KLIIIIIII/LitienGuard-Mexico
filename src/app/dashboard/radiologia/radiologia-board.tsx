"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  ScanLine,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  X,
  Loader2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  ClinicalMetric,
  ClinicalAlert,
  DataTable,
  StatusBadge,
} from "@/components/clinical";
import type { DataTableColumn } from "@/components/clinical";
import { RADIOLOGIA_TIPOS, type EventoModulo } from "@/lib/modulos-eventos";
import { crearPeticionImagen, adjuntarReporte } from "./actions";

type EstudioCatalogo = {
  id: string;
  nombre: string;
  descripcion: string;
  disponibilidadIMSS: "rutina" | "limitada" | "tercer-nivel" | "privado-solo";
  costoPrivadoMxn: { min: number; max: number } | null;
  tiempoResultado: string;
};

type PeticionRow = {
  id: string;
  iniciales: string;
  edad: number | null;
  estudios: string;
  nEstudios: number;
  urgencia: "rutina" | "urgente" | "stat";
  indicacion: string;
  fecha: Date;
  status: "activo" | "completado" | "cancelado";
  tiempoEspera: number;
  tieneHallazgos: boolean;
  reporte: string | null;
};

export function RadiologiaBoard({
  estudios,
  eventos,
}: {
  estudios: EstudioCatalogo[];
  eventos: EventoModulo[];
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<PeticionRow | null>(null);
  const [reportDraft, setReportDraft] = useState("");
  const [savingReport, startSavingReport] = useTransition();

  const rows = useMemo<PeticionRow[]>(() => {
    return eventos
      .filter((e) => e.tipo === RADIOLOGIA_TIPOS.peticion)
      .map((e) => {
        const d = e.datos as {
          paciente_iniciales?: string | null;
          paciente_edad?: number | null;
          estudios?: Array<{ nombre: string }>;
          urgencia?: "rutina" | "urgente" | "stat";
          indicacion_clinica?: string;
          reporte?: string | null;
        };
        const tiempoEspera = Math.floor(
          (Date.now() - new Date(e.created_at).getTime()) / 60000,
        );
        const text = d.reporte ?? "";
        const tieneHallazgos = text.length > 0 &&
          /hallazgo|imagen|lesi[óo]n|nodulo|n[óo]dulo|fractura|colapso|infiltrad|masa|tumor|metast/i.test(
            text,
          );
        return {
          id: e.id,
          iniciales: d.paciente_iniciales ?? "—",
          edad: d.paciente_edad ?? null,
          estudios: (d.estudios ?? []).map((s) => s.nombre).join(" · "),
          nEstudios: d.estudios?.length ?? 0,
          urgencia: d.urgencia ?? "rutina",
          indicacion: d.indicacion_clinica ?? "",
          fecha: new Date(e.created_at),
          status: e.status as PeticionRow["status"],
          tiempoEspera,
          tieneHallazgos,
          reporte: d.reporte ?? null,
        };
      });
  }, [eventos]);

  const pendientes = rows.filter((r) => r.status === "activo");
  const completadas = rows.filter((r) => r.status === "completado");
  const conHallazgos = completadas.filter((r) => r.tieneHallazgos).length;

  const metricas = useMemo(() => {
    const tiempoPromedio =
      completadas.length > 0
        ? Math.round(
            completadas.reduce((sum, r) => sum + r.tiempoEspera, 0) /
              completadas.length,
          )
        : 0;
    const stats = pendientes.filter((r) => r.urgencia === "stat").length;
    return {
      pendientes: pendientes.length,
      stats,
      tiempoPromedio,
      conHallazgos,
    };
  }, [pendientes, completadas, conHallazgos]);

  function onReportSave() {
    if (!selectedRow || reportDraft.trim().length < 10) return;
    startSavingReport(async () => {
      const r = await adjuntarReporte({
        eventoId: selectedRow.id,
        reporte: reportDraft.trim(),
      });
      if (r.status === "ok") {
        setSelectedRow(null);
        setReportDraft("");
      }
    });
  }

  return (
    <>
      <div className="space-y-5">
        {/* KPIs */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ClinicalMetric
            label="Peticiones pendientes"
            value={metricas.pendientes}
            unit={metricas.pendientes === 1 ? "petición" : "peticiones"}
            icon={Clock}
            critical={metricas.stats > 0}
          />
          <ClinicalMetric
            label="STAT pendientes"
            value={metricas.stats}
            unit={metricas.stats === 1 ? "urgente" : "urgentes"}
            icon={AlertTriangle}
            critical={metricas.stats > 0}
            caption="< 1h objetivo"
          />
          <ClinicalMetric
            label="Tiempo prom. reporte"
            value={metricas.tiempoPromedio}
            unit="min"
            icon={Clock}
            deltaInterpretation={metricas.tiempoPromedio <= 240 ? "good" : "bad"}
          />
          <ClinicalMetric
            label="Con hallazgos"
            value={metricas.conHallazgos}
            unit={metricas.conHallazgos === 1 ? "estudio" : "estudios"}
            icon={Sparkles}
            caption="últimos 30 días"
          />
        </section>

        {/* Pendientes */}
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Worklist pendiente
              </p>
              <p className="text-body-sm text-ink-muted">
                Priorizada por urgencia · click para adjuntar reporte
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg-cta-primary inline-flex items-center gap-2 text-caption"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              Nueva petición
            </button>
          </div>

          {pendientes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
              <ScanLine
                className="mx-auto h-8 w-8 text-ink-quiet mb-2"
                strokeWidth={1.6}
              />
              <p className="text-body-sm text-ink-muted">
                Sin peticiones pendientes.
              </p>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="lg-cta-primary mt-4 inline-flex items-center gap-2 text-caption"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                Crear primera petición
              </button>
            </div>
          ) : (
            <DataTable
              data={pendientes}
              getRowKey={(r) => r.id}
              onRowClick={(r) => {
                setSelectedRow(r);
                setReportDraft("");
              }}
              columns={pendientesColumns()}
              rowTone={(r) =>
                r.urgencia === "stat"
                  ? "critical"
                  : r.urgencia === "urgente"
                    ? "warning"
                    : null
              }
              maxHeight="50vh"
            />
          )}
        </section>

        {/* Reportadas con hallazgos */}
        {completadas.length > 0 && (
          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <div>
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                  Reportes recientes
                </p>
                <p className="text-body-sm text-ink-muted">
                  Últimos 30 días · {conHallazgos} con hallazgos positivos
                </p>
              </div>
              <Link
                href="/dashboard/diferencial/estudios"
                className="text-caption font-semibold text-validation hover:underline"
              >
                Enviar al motor multi-estudio →
              </Link>
            </div>
            <DataTable
              data={completadas.slice(0, 12)}
              getRowKey={(r) => r.id}
              columns={completadasColumns()}
              rowTone={(r) => (r.tieneHallazgos ? "warning" : null)}
            />
          </section>
        )}

        {/* Drill-down: adjuntar reporte */}
        <AnimatePresence>
          {selectedRow && selectedRow.status === "activo" && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-line bg-surface p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                    Petición seleccionada
                  </p>
                  <h3 className="mt-0.5 text-h3 font-semibold text-ink-strong">
                    {selectedRow.iniciales}
                    {selectedRow.edad ? ` · ${selectedRow.edad}a` : ""} ·{" "}
                    {selectedRow.nEstudios} estudios
                  </h3>
                  <p className="mt-0.5 text-caption text-ink-muted line-clamp-2">
                    {selectedRow.estudios}
                  </p>
                  {selectedRow.indicacion && (
                    <p className="mt-1 text-caption text-ink-muted italic">
                      “{selectedRow.indicacion}”
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRow(null)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink-strong"
                  aria-label="Cerrar"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              </div>

              <textarea
                value={reportDraft}
                onChange={(e) => setReportDraft(e.target.value.slice(0, 3000))}
                placeholder="Reporte estructurado&#10;&#10;TÉCNICA: ...&#10;HALLAZGOS: ...&#10;IMPRESIÓN DIAGNÓSTICA: ..."
                className="lg-input min-h-[180px] resize-y w-full font-mono text-body-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRow(null)}
                  className="lg-cta-ghost text-caption"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onReportSave}
                  disabled={savingReport || reportDraft.trim().length < 10}
                  className="lg-cta-primary inline-flex items-center gap-2 text-caption disabled:opacity-50"
                >
                  {savingReport ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.4} />
                  )}
                  Guardar reporte
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Future scope */}
        <ClinicalAlert
          severity="info"
          title="Próximas funcionalidades (Track B v2)"
          description="DICOM Q/R + visor de imagen integrado. Templates de reporte por estudio (TAC craneal, eco, RM). Comparación con prior. AI-assisted reading (nodule, fracture, stroke). Critical finding notification automatic. RadLex structured terminology."
        />
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <NewPeticionDrawer
            estudios={estudios}
            onClose={() => setDrawerOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function pendientesColumns(): DataTableColumn<PeticionRow>[] {
  return [
    {
      key: "urgencia",
      label: "Urg",
      sortValue: (r) =>
        r.urgencia === "stat" ? 1 : r.urgencia === "urgente" ? 2 : 3,
      render: (r) => (
        <StatusBadge
          tone={
            r.urgencia === "stat"
              ? "critical"
              : r.urgencia === "urgente"
                ? "warning"
                : "success"
          }
          pulse={r.urgencia === "stat"}
          size="sm"
        >
          {r.urgencia === "stat" ? "STAT" : r.urgencia}
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
      key: "estudios",
      label: "Estudios",
      width: "w-full",
      render: (r) => (
        <span className="text-ink-muted line-clamp-1">
          <span className="font-semibold text-ink-strong">{r.nEstudios}×</span>{" "}
          {r.estudios}
        </span>
      ),
    },
    {
      key: "tiempoEspera",
      label: "Espera",
      numeric: true,
      sortValue: (r) => r.tiempoEspera,
      render: (r) => (
        <span className="tabular-nums">{r.tiempoEspera} min</span>
      ),
    },
    {
      key: "action",
      label: "",
      sortValue: () => 0,
      render: () => (
        <ChevronRight
          className="h-3.5 w-3.5 text-ink-quiet"
          strokeWidth={2.4}
        />
      ),
    },
  ];
}

function completadasColumns(): DataTableColumn<PeticionRow>[] {
  return [
    {
      key: "flag",
      label: "",
      sortValue: (r) => (r.tieneHallazgos ? 1 : 0),
      render: (r) =>
        r.tieneHallazgos ? (
          <StatusBadge tone="warning" size="sm" icon={Sparkles}>
            +
          </StatusBadge>
        ) : (
          <CheckCircle2
            className="h-3.5 w-3.5 text-code-green"
            strokeWidth={2.4}
          />
        ),
    },
    {
      key: "iniciales",
      label: "Paciente",
      render: (r) => (
        <span className="font-semibold text-ink-strong">{r.iniciales}</span>
      ),
    },
    {
      key: "estudios",
      label: "Estudios",
      width: "w-full",
      render: (r) => (
        <span className="text-ink-muted line-clamp-1">{r.estudios}</span>
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

function NewPeticionDrawer({
  estudios,
  onClose,
}: {
  estudios: EstudioCatalogo[];
  onClose: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState<"M" | "F" | "X">("M");
  const [indicacion, setIndicacion] = useState("");
  const [urgencia, setUrgencia] = useState<"rutina" | "urgente" | "stat">("rutina");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return estudios.slice(0, 12);
    return estudios.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.descripcion.toLowerCase().includes(q),
    );
  }, [estudios, busqueda]);

  function toggle(id: string) {
    setSeleccionados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function submit() {
    setError(null);
    if (seleccionados.size === 0) {
      setError("Selecciona al menos un estudio.");
      return;
    }
    if (indicacion.trim().length < 2) {
      setError("Captura la indicación clínica.");
      return;
    }
    startTransition(async () => {
      const r = await crearPeticionImagen({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        pacienteSexo: sexo,
        estudiosIds: Array.from(seleccionados),
        indicacionClinica: indicacion.trim(),
        urgencia,
      });
      if (r.status === "ok") onClose();
      else setError(r.message);
    });
  }

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
        aria-label="Nueva petición imagen"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface shadow-deep"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
          <h3 className="text-h3 font-semibold text-ink-strong">
            Nueva petición · {seleccionados.size}
          </h3>
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
          <div className="grid gap-2 sm:grid-cols-3">
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
            <Field label="Sexo">
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value as "M" | "F" | "X")}
                className="lg-input"
              >
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="X">X</option>
              </select>
            </Field>
          </div>

          <Field label="Indicación clínica">
            <textarea
              value={indicacion}
              onChange={(e) => setIndicacion(e.target.value.slice(0, 500))}
              placeholder="Ej. Cefalea súbita máxima intensidad, sospecha HSA"
              className="lg-input min-h-[60px] resize-y"
            />
          </Field>

          <div>
            <p className="text-caption font-medium text-ink-muted mb-1">
              Urgencia
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {(["rutina", "urgente", "stat"] as const).map((u) => {
                const sel = urgencia === u;
                const tone =
                  u === "stat"
                    ? "critical"
                    : u === "urgente"
                      ? "warning"
                      : "success";
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUrgencia(u)}
                    className={`rounded-lg border p-2 text-center transition-all ${
                      sel
                        ? "border-ink-strong bg-surface ring-2 ring-accent/30"
                        : "border-line bg-surface hover:border-line-strong"
                    }`}
                  >
                    <StatusBadge tone={tone} size="sm">
                      {u === "stat" ? "STAT" : u}
                    </StatusBadge>
                    <p className="mt-1 text-caption text-ink-muted tabular-nums">
                      {u === "stat" ? "< 1h" : u === "urgente" ? "< 4h" : "24-72h"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-caption font-medium text-ink-muted">
                Estudios ({seleccionados.size})
              </p>
              <div className="relative w-44">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-quiet" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar"
                  className="lg-input pl-7 text-caption w-full"
                />
              </div>
            </div>
            <ul className="space-y-1.5 max-h-64 overflow-y-auto">
              {filtrados.map((e) => {
                const sel = seleccionados.has(e.id);
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => toggle(e.id)}
                      className={`w-full text-left rounded-lg border p-2 transition-all ${
                        sel
                          ? "border-code-green/40 bg-code-green-bg/30"
                          : "border-line bg-surface hover:border-line-strong"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-caption font-semibold ${
                            sel ? "text-code-green" : "text-ink-strong"
                          }`}
                        >
                          {e.nombre}
                        </p>
                        {sel && (
                          <CheckCircle2
                            className="h-3 w-3 shrink-0 text-code-green"
                            strokeWidth={2.4}
                          />
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {error && (
            <ClinicalAlert
              severity="critical"
              title="No se pudo crear"
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
              disabled={pending || seleccionados.size === 0}
              className="lg-cta-primary inline-flex items-center gap-2 text-caption disabled:opacity-50"
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
              ) : null}
              Crear petición
            </button>
          </div>
        </div>
      </motion.aside>
    </>
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
