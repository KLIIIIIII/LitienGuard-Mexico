"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Siren,
  Users,
  Clock,
  TrendingUp,
  Activity,
  Brain,
  Heart,
  Droplet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  PatientHeader,
  ClinicalMetric,
  ClinicalAlert,
  WorkflowStep,
  DataTable,
  StatusBadge,
  CodeStatus,
} from "@/components/clinical";
import type { DataTableColumn, CodeKind } from "@/components/clinical";
import {
  URGENCIAS_TIPOS,
  TRIAGE_NIVELES,
  DISPOSITION_LABELS,
  type EventoModulo,
  type TriageNivel,
  type DispositionTipo,
} from "@/lib/modulos-eventos";
import {
  iniciarTriage,
  iniciarProtocolo,
  completarProtocolo,
  cancelarProtocolo,
  registrarDisposition,
} from "./actions";
import { LogOut, ArrowRight } from "lucide-react";

/* ============================================================
   Catálogo de protocolos
   ============================================================ */

type ProtocoloTipoEnum = Exclude<
  keyof typeof URGENCIAS_TIPOS,
  "triage" | "disposition"
>;

type ProtocoloDef = {
  tipo: ProtocoloTipoEnum;
  kind: CodeKind;
  titulo: string;
  subtitulo: string;
  tiempoObjetivoMin: number;
  icon: LucideIcon;
  tone: "code-red" | "code-amber" | "accent";
  pasos: Array<{
    id: string;
    titulo: string;
    detalle: string;
    tiempo: string;
    tone?: "default" | "critical" | "warning" | "success";
  }>;
  alertas: string[];
  fuente: string;
};

const PROTOCOLOS: Record<string, ProtocoloDef> = {
  sepsis_bundle: {
    tipo: "sepsis_bundle",
    kind: "sepsis",
    titulo: "Sepsis bundle 1-hora",
    subtitulo: "Surviving Sepsis Campaign 2021",
    tiempoObjetivoMin: 60,
    icon: Activity,
    tone: "code-red",
    pasos: [
      {
        id: "lactato",
        titulo: "Medir lactato sérico",
        detalle: "Si > 2 mmol/L → repetir en 2-4h",
        tiempo: "0-15 min",
      },
      {
        id: "hemocultivos",
        titulo: "Hemocultivos × 2 antes de antibiótico",
        detalle: "No retrasar antibiótico > 45 min",
        tiempo: "0-30 min",
      },
      {
        id: "antibiotico",
        titulo: "Antibiótico amplio espectro IV",
        detalle: "Carbapenem o pip/tazo + cobertura específica",
        tiempo: "≤ 60 min",
        tone: "warning",
      },
      {
        id: "cristaloides",
        titulo: "Cristaloides 30 mL/kg si hipotensión",
        detalle: "Si MAP < 65 o lactato > 4",
        tiempo: "≤ 60 min",
      },
      {
        id: "vasopresores",
        titulo: "Norepinefrina si MAP < 65 post-fluidos",
        detalle: "Iniciar 0.05-0.1 mcg/kg/min",
        tiempo: "Si refractario",
        tone: "critical",
      },
    ],
    alertas: [
      "Lactato > 4 mmol/L = shock séptico",
      "qSOFA ≥ 2 = mortalidad alta",
    ],
    fuente: "SSC International Guidelines 2021",
  },
  codigo_stroke: {
    tipo: "codigo_stroke",
    kind: "stroke",
    titulo: "Código stroke",
    subtitulo: "Ventana terapéutica trombolisis IV",
    tiempoObjetivoMin: 60,
    icon: Brain,
    tone: "code-amber",
    pasos: [
      {
        id: "nihss",
        titulo: "NIHSS al ingreso",
        detalle: "Considera trombolisis si NIHSS ≥ 4",
        tiempo: "0-10 min",
      },
      {
        id: "tc_simple",
        titulo: "TC craneal sin contraste",
        detalle: "Descartar hemorragia · ASPECTS",
        tiempo: "≤ 25 min",
      },
      {
        id: "labs",
        titulo: "Glucosa + INR + TP/TTPa + plaquetas",
        detalle: "INR > 1.7 = contraindicación relativa",
        tiempo: "≤ 30 min",
      },
      {
        id: "ventana",
        titulo: "Confirmar ventana ≤ 4.5h",
        detalle: "Si 4.5-24h → trombectomía si LVO",
        tiempo: "≤ 35 min",
      },
      {
        id: "trombolisis",
        titulo: "Alteplasa 0.9 mg/kg IV si elegible",
        detalle: "10% bolo + 90% en 60 min, máx 90 mg",
        tiempo: "≤ 60 min",
        tone: "critical",
      },
    ],
    alertas: [
      "Hemorragia en TC = contraindicación absoluta",
      "TA > 185/110 controlar antes de trombolisis",
    ],
    fuente: "AHA/ASA Guidelines 2024 + ESO 2023",
  },
  codigo_iam: {
    tipo: "codigo_iam",
    kind: "iam",
    titulo: "Código IAM (STEMI)",
    subtitulo: "Reperfusión coronaria primaria",
    tiempoObjetivoMin: 90,
    icon: Heart,
    tone: "code-red",
    pasos: [
      {
        id: "ekg",
        titulo: "EKG 12 derivaciones",
        detalle: "ST ≥ 1 mm en 2 derivaciones contiguas",
        tiempo: "≤ 10 min",
      },
      {
        id: "troponina",
        titulo: "Troponina alta sensibilidad",
        detalle: "Repetir a 1-3h",
        tiempo: "≤ 30 min",
      },
      {
        id: "antiagregacion",
        titulo: "AAS 300 mg + clopidogrel 600 mg",
        detalle: "Si ICP < 24h: ticagrelor 180 o prasugrel 60",
        tiempo: "≤ 30 min",
      },
      {
        id: "hemodinamia",
        titulo: "Activar hemodinamia → ICP primaria",
        detalle: "Si sin hemodinamia: fibrinolisis < 30 min",
        tiempo: "≤ 90 min",
        tone: "critical",
      },
      {
        id: "anticoagulacion",
        titulo: "Heparina no fraccionada 70-100 U/kg IV",
        detalle: "Bivalirudina si alto riesgo sangrado",
        tiempo: "Durante ICP",
      },
    ],
    alertas: [
      "Cada 30 min de retraso = 1% mortalidad",
      "Killip III-IV → considerar soporte mecánico",
    ],
    fuente: "ESC STEMI Guidelines 2023",
  },
  dka_protocolo: {
    tipo: "dka_protocolo",
    kind: "dka",
    titulo: "DKA",
    subtitulo: "Cetoacidosis diabética · ADA 2024",
    tiempoObjetivoMin: 360,
    icon: Droplet,
    tone: "accent",
    pasos: [
      {
        id: "criterios",
        titulo: "Confirmar criterios DKA",
        detalle: "Glucosa > 250 + pH < 7.3 + HCO3 < 18 + AG > 10",
        tiempo: "0-30 min",
      },
      {
        id: "fluidos",
        titulo: "NaCl 0.9% 15-20 mL/kg/h primera hora",
        detalle: "Después según Na corregido",
        tiempo: "0-60 min",
      },
      {
        id: "insulina",
        titulo: "Insulina 0.1 U/kg bolo + 0.1 U/kg/h",
        detalle: "NO iniciar si K < 3.3 mEq/L",
        tiempo: "≤ 60 min",
        tone: "warning",
      },
      {
        id: "potasio",
        titulo: "Reponer K si < 5.2 mEq/L",
        detalle: "20-30 mEq KCl/L. Pausar insulina si K < 3.3",
        tiempo: "Continuo",
      },
      {
        id: "precipitante",
        titulo: "Buscar precipitante",
        detalle: "Infección · IAM · no adherencia",
        tiempo: "Primeras 2h",
      },
    ],
    alertas: [
      "Bajar glucosa máx 50-75 mg/dL/h (edema cerebral)",
      "Hipoglucemia = #1 mortalidad iatrogénica",
    ],
    fuente: "ADA Standards of Care 2024",
  },
};

/* ============================================================
   Tipos para la tabla
   ============================================================ */

type TriageRow = {
  id: string;
  iniciales: string;
  edad: number | null;
  sexo: "M" | "F" | "X" | null;
  motivo: string;
  nivel: TriageNivel;
  ingreso: Date;
  minutosEnSala: number;
  protocolosActivos: Array<{
    tipo: string;
    eventoId: string;
    startedAt: string;
  }>;
};

/* ============================================================
   Componente principal
   ============================================================ */

export function UrgenciasTracking({ eventos }: { eventos: EventoModulo[] }) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );
  const [drawerMode, setDrawerMode] = useState<
    "none" | "new_triage" | "activate_protocol" | "disposition"
  >("none");
  const [protocolToActivate, setProtocolToActivate] = useState<
    keyof typeof PROTOCOLOS | null
  >(null);

  /* --------- Procesar eventos a filas + protocolos activos --------- */
  const { triageRows, protocolosActivos, criticasRecientes, metricas } =
    useMemo(() => {
    // Solo triages activos en el tracking board (los con disposition ya
    // cerraron como status="completado" — desaparecen automáticamente)
    const triages = eventos.filter(
      (e) => e.tipo === URGENCIAS_TIPOS.triage && e.status === "activo",
    );
    const activos = eventos.filter(
      (e) =>
        e.status === "activo" &&
        e.tipo !== URGENCIAS_TIPOS.triage &&
        e.tipo in PROTOCOLOS,
    );

    // Build triage rows + attach active protocols by iniciales match (within 8h)
    const rows: TriageRow[] = triages.map((t) => {
      const d = t.datos as {
        paciente_iniciales?: string | null;
        paciente_edad?: number | null;
        paciente_sexo?: "M" | "F" | "X" | null;
        motivo?: string;
        nivel?: TriageNivel;
      };
      const ingreso = new Date(t.created_at);
      const minutos = Math.floor((Date.now() - ingreso.getTime()) / 60000);
      const iniciales = d.paciente_iniciales ?? "—";
      const protocolos = activos
        .filter((a) => {
          const ad = a.datos as { paciente_iniciales?: string | null };
          return ad.paciente_iniciales === iniciales && iniciales !== "—";
        })
        .map((a) => ({
          tipo: a.tipo,
          eventoId: a.id,
          startedAt: a.created_at,
        }));
      return {
        id: t.id,
        iniciales,
        edad: d.paciente_edad ?? null,
        sexo: d.paciente_sexo ?? null,
        motivo: d.motivo ?? "",
        nivel: (d.nivel ?? "verde") as TriageNivel,
        ingreso,
        minutosEnSala: minutos,
        protocolosActivos: protocolos,
      };
    });

    // Métricas
    const enTriage = rows.length;
    const conProtocoloActivo = rows.filter(
      (r) => r.protocolosActivos.length > 0,
    ).length;
    const tiempoPromedio =
      rows.length > 0
        ? Math.round(
            rows.reduce((sum, r) => sum + r.minutosEnSala, 0) / rows.length,
          )
        : 0;

    const completadosUltimos = eventos.filter(
      (e) =>
        e.status === "completado" &&
        e.tipo === URGENCIAS_TIPOS.sepsis_bundle &&
        e.metricas &&
        typeof (e.metricas as Record<string, unknown>).minutos_transcurridos ===
          "number",
    );
    const sepsisOnTime = completadosUltimos.filter((e) => {
      const m = e.metricas as { minutos_transcurridos?: number };
      return (m.minutos_transcurridos ?? 999) <= 60;
    }).length;
    const sepsisCompliance =
      completadosUltimos.length > 0
        ? Math.round((sepsisOnTime / completadosUltimos.length) * 100)
        : null;

    // LOS promedio y throughput desde disposition events (AHRQ)
    const dispositions = eventos.filter(
      (e) => e.tipo === URGENCIAS_TIPOS.disposition,
    );
    const losTotales: number[] = [];
    let lwbsCount = 0;
    for (const d of dispositions) {
      const m = (d.metricas ?? {}) as { los_minutos?: number; disposition?: string };
      if (typeof m.los_minutos === "number") losTotales.push(m.los_minutos);
      if (m.disposition === "lwbs") lwbsCount += 1;
    }
    const losPromedio =
      losTotales.length > 0
        ? Math.round(losTotales.reduce((s, n) => s + n, 0) / losTotales.length)
        : null;
    const lwbsRate =
      dispositions.length > 0
        ? Math.round((lwbsCount / dispositions.length) * 100)
        : null;

    // Dispositions críticas en últimas 24h (Joint Commission alerta)
    const ahora24h = Date.now() - 24 * 3600 * 1000;
    const criticasRecientes = dispositions.filter((d) => {
      const m = (d.metricas ?? {}) as { disposition?: string };
      const isCritica = m.disposition === "morgue" || m.disposition === "lwbs";
      if (!isCritica) return false;
      const t = d.completed_at ?? d.created_at;
      return new Date(t).getTime() >= ahora24h;
    });

    return {
      triageRows: rows,
      protocolosActivos: activos,
      dispositions,
      criticasRecientes,
      metricas: {
        enTriage,
        conProtocoloActivo,
        tiempoPromedio,
        sepsisCompliance,
        losPromedio,
        lwbsRate,
        dispositionsCount: dispositions.length,
      },
    };
  }, [eventos]);

  const selectedRow = useMemo(
    () => triageRows.find((r) => r.id === selectedPatientId) ?? null,
    [triageRows, selectedPatientId],
  );

  return (
    <>
      {/* ============ Sticky patient header cuando hay drill-down ============ */}
      {selectedRow && (
        <PatientHeader
          iniciales={selectedRow.iniciales}
          edad={selectedRow.edad}
          sexo={selectedRow.sexo}
          mrn={`URG-${selectedRow.id.slice(0, 6).toUpperCase()}`}
          alertasActivas={selectedRow.protocolosActivos.map((p) => {
            const def = PROTOCOLOS[p.tipo];
            const tipoMap: Record<
              string,
              "sepsis" | "code_stroke" | "code_iam" | "code_red"
            > = {
              sepsis_bundle: "sepsis",
              codigo_stroke: "code_stroke",
              codigo_iam: "code_iam",
              dka_protocolo: "code_red",
            };
            const elapsed = Math.floor(
              (Date.now() - new Date(p.startedAt).getTime()) / 60000,
            );
            return {
              tipo: tipoMap[p.tipo] ?? "warning",
              label: def?.titulo ?? p.tipo,
              transcurridoMin: elapsed,
            };
          })}
        />
      )}

      <div className="space-y-5">
        {/* ============ Alerta dispositions críticas 24h (Joint Commission) ============ */}
        {criticasRecientes.length > 0 && (
          <ClinicalAlert
            severity="critical"
            title={`${criticasRecientes.length} disposición${
              criticasRecientes.length === 1 ? "" : "es"
            } crítica${criticasRecientes.length === 1 ? "" : "s"} en últimas 24h`}
            description={
              <span>
                Defunciones o salidas sin ser visto (LWBS) registradas
                en las últimas 24 horas requieren revisión clínica
                (Joint Commission Sentinel Event Policy + AHRQ Patient
                Safety Network).
              </span>
            }
            cite="The Joint Commission · Sentinel Event Policy 2024"
          />
        )}

        {/* ============ KPIs / métricas ============ */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ClinicalMetric
            label="En triage"
            value={metricas.enTriage}
            unit="pacientes"
            icon={Users}
            size="md"
          />
          <ClinicalMetric
            label="Protocolos activos"
            value={metricas.conProtocoloActivo}
            unit={metricas.conProtocoloActivo === 1 ? "paciente" : "pacientes"}
            icon={Siren}
            critical={metricas.conProtocoloActivo > 0}
            size="md"
          />
          <ClinicalMetric
            label="Tiempo en sala"
            value={metricas.tiempoPromedio}
            unit="min prom"
            icon={Clock}
            size="md"
          />
          <ClinicalMetric
            label="Sepsis compliance"
            value={metricas.sepsisCompliance ?? "—"}
            unit={metricas.sepsisCompliance != null ? "%" : ""}
            icon={TrendingUp}
            deltaInterpretation={
              metricas.sepsisCompliance != null && metricas.sepsisCompliance >= 80
                ? "good"
                : "bad"
            }
            size="md"
            caption="< 60min bundle"
          />
        </section>

        {/* ============ Throughput AHRQ (LOS · dispositions · LWBS) ============ */}
        {metricas.dispositionsCount > 0 && (
          <section className="grid gap-3 sm:grid-cols-3">
            <ClinicalMetric
              label="LOS promedio ED"
              value={metricas.losPromedio ?? "—"}
              unit={metricas.losPromedio != null ? "min" : ""}
              icon={Clock}
              caption="Triage → disposition"
              size="md"
            />
            <ClinicalMetric
              label="Dispositions"
              value={metricas.dispositionsCount}
              unit={metricas.dispositionsCount === 1 ? "paciente" : "pacientes"}
              icon={LogOut}
              caption="Últimas 8h"
              size="md"
            />
            <ClinicalMetric
              label="LWBS rate"
              value={metricas.lwbsRate ?? "—"}
              unit={metricas.lwbsRate != null ? "%" : ""}
              icon={TrendingUp}
              critical={metricas.lwbsRate != null && metricas.lwbsRate > 5}
              deltaInterpretation={
                metricas.lwbsRate != null && metricas.lwbsRate <= 2
                  ? "good"
                  : "bad"
              }
              caption="Salió sin ser visto"
              size="md"
            />
          </section>
        )}

        {/* ============ Code timers row ============ */}
        {protocolosActivos.length > 0 && (
          <section>
            <p className="mb-2 text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
              Códigos activos
            </p>
            <div className="flex flex-wrap gap-2">
              {protocolosActivos.map((p) => {
                const def = PROTOCOLOS[p.tipo];
                if (!def) return null;
                const d = p.datos as { paciente_iniciales?: string | null };
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-line bg-surface p-3 min-w-[260px]"
                  >
                    <p className="text-caption text-ink-soft">
                      {d.paciente_iniciales ?? "Paciente sin identificar"}
                    </p>
                    <CodeStatus
                      kind={def.kind}
                      startedAt={p.created_at}
                      compact
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ============ Tracking board (DataTable) ============ */}
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Tracking board
              </p>
              <p className="text-body-sm text-ink-muted">
                Pacientes en triage · click una fila para activar protocolo
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDrawerMode("new_triage")}
                className="lg-cta-primary inline-flex items-center gap-2 text-caption"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                Nuevo triage
              </button>
            </div>
          </div>

          {triageRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
              <Users
                className="mx-auto h-8 w-8 text-ink-quiet mb-2"
                strokeWidth={1.6}
              />
              <p className="text-body-sm text-ink-muted">
                Sin pacientes en sala en las últimas 8 horas.
              </p>
              <button
                type="button"
                onClick={() => setDrawerMode("new_triage")}
                className="lg-cta-primary mt-4 inline-flex items-center gap-2 text-caption"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                Registrar primer triage
              </button>
            </div>
          ) : (
            <DataTable
              data={triageRows}
              getRowKey={(r) => r.id}
              onRowClick={(r) => setSelectedPatientId(r.id)}
              columns={trackingBoardColumns(setSelectedPatientId)}
              rowTone={(r) =>
                r.nivel === "rojo"
                  ? "critical"
                  : r.nivel === "naranja" || r.nivel === "amarillo"
                    ? "warning"
                    : null
              }
              maxHeight="60vh"
            />
          )}
        </section>

        {/* ============ Paciente seleccionado (drill-down) ============ */}
        {selectedRow && (
          <section className="rounded-xl border border-line bg-surface p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                  Paciente seleccionado
                </p>
                <h3 className="mt-0.5 text-h3 font-semibold text-ink-strong">
                  {selectedRow.iniciales}
                  {selectedRow.edad ? ` · ${selectedRow.edad}a` : ""}
                  {selectedRow.sexo ? ` ${selectedRow.sexo}` : ""}
                </h3>
                <p className="mt-0.5 text-caption text-ink-muted">
                  {selectedRow.motivo}
                </p>
                <p className="mt-1 text-caption text-ink-soft tabular-nums">
                  LOS actual: {selectedRow.minutosEnSala} min
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerMode("disposition")}
                  className="lg-cta-primary inline-flex items-center gap-1.5 text-caption"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Dar disposición
                  <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPatientId(null)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink-strong"
                  aria-label="Cerrar"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* Protocolos activos del paciente */}
            {selectedRow.protocolosActivos.length > 0 && (
              <div className="space-y-2">
                {selectedRow.protocolosActivos.map((p) => {
                  const def = PROTOCOLOS[p.tipo];
                  if (!def) return null;
                  return (
                    <ProtocoloActivoCard
                      key={p.eventoId}
                      eventoId={p.eventoId}
                      protocolo={def}
                      startedAt={p.startedAt}
                    />
                  );
                })}
              </div>
            )}

            {/* Activar nuevo protocolo */}
            <div>
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold mb-2">
                Activar protocolo
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {Object.values(PROTOCOLOS).map((p) => {
                  const yaActivo = selectedRow.protocolosActivos.some(
                    (a) => a.tipo === p.tipo,
                  );
                  return (
                    <button
                      key={p.tipo}
                      type="button"
                      disabled={yaActivo}
                      onClick={() => {
                        setProtocolToActivate(
                          p.tipo as keyof typeof PROTOCOLOS,
                        );
                        setDrawerMode("activate_protocol");
                      }}
                      className={`group rounded-lg border p-3 text-left transition-all ${
                        yaActivo
                          ? "border-line bg-surface-alt opacity-50 cursor-not-allowed"
                          : "border-line bg-surface hover:border-line-strong hover:shadow-soft"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-body-sm font-semibold ${
                            p.tone === "code-red"
                              ? "text-code-red"
                              : p.tone === "code-amber"
                                ? "text-code-amber"
                                : "text-accent"
                          }`}
                        >
                          {p.titulo}
                        </p>
                        {!yaActivo && (
                          <ChevronRight
                            className="h-3.5 w-3.5 text-ink-quiet group-hover:text-ink-strong"
                            strokeWidth={2.2}
                          />
                        )}
                      </div>
                      <p className="mt-0.5 text-caption text-ink-muted">
                        {yaActivo ? "Ya activo" : `Objetivo ${p.tiempoObjetivoMin} min`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* ============ Drawer: nuevo triage ============ */}
      <AnimatePresence>
        {drawerMode === "new_triage" && (
          <NewTriageDrawer onClose={() => setDrawerMode("none")} />
        )}
        {drawerMode === "activate_protocol" && protocolToActivate && (
          <ActivateProtocolDrawer
            protocolo={PROTOCOLOS[protocolToActivate]!}
            pacienteIniciales={selectedRow?.iniciales ?? null}
            pacienteEdad={selectedRow?.edad ?? null}
            onClose={() => {
              setDrawerMode("none");
              setProtocolToActivate(null);
            }}
          />
        )}
        {drawerMode === "disposition" && selectedRow && (
          <DispositionDrawer
            triageId={selectedRow.id}
            iniciales={selectedRow.iniciales}
            losMinutos={selectedRow.minutosEnSala}
            onClose={() => {
              setDrawerMode("none");
              setSelectedPatientId(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================
   Drawer: Disposition (cierre del paciente en ED)
   ============================================================ */
function DispositionDrawer({
  triageId,
  iniciales,
  losMinutos,
  onClose,
}: {
  triageId: string;
  iniciales: string;
  losMinutos: number;
  onClose: () => void;
}) {
  const [tipo, setTipo] = useState<DispositionTipo>("alta");
  const [razon, setRazon] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await registrarDisposition({
        triageEventoId: triageId,
        tipo,
        razon: razon.trim() || undefined,
      });
      if (r.status === "ok") onClose();
      else setError(r.message);
    });
  }

  return (
    <Drawer title="Disposición del paciente" onClose={onClose}>
      <div className="space-y-3">
        <div className="rounded-xl border border-line bg-surface-alt p-3">
          <p className="text-caption text-ink-soft">Paciente</p>
          <p className="mt-0.5 text-body-sm font-semibold text-ink-strong">
            {iniciales}
          </p>
          <p className="mt-1 text-caption text-ink-muted tabular-nums">
            LOS: {losMinutos} min en sala
          </p>
        </div>

        <div>
          <p className="text-caption font-medium text-ink-muted mb-1.5">
            Tipo de disposición
          </p>
          <div className="space-y-1.5">
            {(Object.entries(DISPOSITION_LABELS) as Array<
              [DispositionTipo, (typeof DISPOSITION_LABELS)[DispositionTipo]]
            >).map(([key, meta]) => {
              const selected = tipo === key;
              const toneCls =
                meta.tone === "critical"
                  ? "border-rose"
                  : meta.tone === "warning"
                    ? "border-warn"
                    : meta.tone === "good"
                      ? "border-validation"
                      : "border-line";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTipo(key)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-all ${
                    selected
                      ? `${toneCls} bg-surface ring-2 ring-accent/30`
                      : "border-line bg-surface hover:border-line-strong"
                  }`}
                >
                  <span className="text-body-sm text-ink-strong">
                    {meta.label}
                  </span>
                  {selected && (
                    <CheckCircle2
                      className="h-4 w-4 text-validation"
                      strokeWidth={2.4}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Razón / nota breve (opcional)">
          <textarea
            value={razon}
            onChange={(e) => setRazon(e.target.value.slice(0, 500))}
            placeholder="Ej. Dolor controlado, signos vitales estables, alta con cita en 48h"
            className="lg-input min-h-[72px] resize-y"
          />
        </Field>

        <p className="text-[0.65rem] text-ink-soft leading-relaxed">
          Tipos de disposición según AHRQ Patient Flow Guide for EDs
          + Joint Commission disposition categories. LWBS se reporta a
          la dirección si {">"} 5% (benchmark TJC).
        </p>

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
              <LogOut className="h-3.5 w-3.5" strokeWidth={2.4} />
            )}
            Registrar disposición
          </button>
        </div>
      </div>
    </Drawer>
  );
}

/* ============================================================
   Columnas del tracking board
   ============================================================ */
function trackingBoardColumns(
  onSelect: (id: string) => void,
): DataTableColumn<TriageRow>[] {
  return [
    {
      key: "nivel",
      label: "Triage",
      sortValue: (r) =>
        r.nivel === "rojo"
          ? 1
          : r.nivel === "naranja"
            ? 2
            : r.nivel === "amarillo"
              ? 3
              : r.nivel === "verde"
                ? 4
                : 5,
      render: (r) => {
        const tone =
          r.nivel === "rojo"
            ? "critical"
            : r.nivel === "naranja"
              ? "warning"
              : r.nivel === "amarillo"
                ? "warning"
                : "success";
        return (
          <StatusBadge
            tone={tone}
            pulse={r.nivel === "rojo"}
            size="sm"
          >
            {TRIAGE_NIVELES[r.nivel].label.split(" — ")[0]}
          </StatusBadge>
        );
      },
    },
    {
      key: "iniciales",
      label: "Paciente",
      render: (r) => (
        <span className="font-semibold text-ink-strong">
          {r.iniciales}
          {r.edad && (
            <span className="ml-1 font-normal text-ink-muted tabular-nums">
              {r.edad}{r.sexo ?? ""}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "motivo",
      label: "Motivo",
      width: "w-full",
      render: (r) => (
        <span className="text-ink-muted line-clamp-1">{r.motivo}</span>
      ),
    },
    {
      key: "minutosEnSala",
      label: "Tiempo",
      numeric: true,
      sortValue: (r) => r.minutosEnSala,
      render: (r) => (
        <span className="tabular-nums">{r.minutosEnSala} min</span>
      ),
    },
    {
      key: "protocolo",
      label: "Protocolo",
      sortValue: (r) => r.protocolosActivos.length,
      render: (r) => {
        if (r.protocolosActivos.length === 0)
          return <span className="text-ink-quiet">—</span>;
        const first = r.protocolosActivos[0];
        if (!first) return <span className="text-ink-quiet">—</span>;
        const def = PROTOCOLOS[first.tipo];
        if (!def) return <span className="text-ink-quiet">—</span>;
        return (
          <StatusBadge
            tone="critical"
            pulse
            icon={def.icon}
            size="sm"
          >
            {def.titulo.split(" ")[0]}
            {r.protocolosActivos.length > 1 && ` +${r.protocolosActivos.length - 1}`}
          </StatusBadge>
        );
      },
    },
    {
      key: "actions",
      label: "",
      sortValue: () => 0,
      render: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(r.id);
          }}
          className="inline-flex items-center gap-1 text-caption font-semibold text-accent hover:underline"
        >
          Abrir
          <ChevronRight className="h-3 w-3" strokeWidth={2.4} />
        </button>
      ),
    },
  ];
}

/* ============================================================
   Protocolo activo · checklist con timer
   ============================================================ */
function ProtocoloActivoCard({
  eventoId,
  protocolo,
  startedAt,
}: {
  eventoId: string;
  protocolo: ProtocoloDef;
  startedAt: string;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }

  function completar() {
    const completados = Object.entries(checked)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const elapsed = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 60000,
    );
    startTransition(async () => {
      await completarProtocolo({
        eventoId,
        pasosCompletados: completados,
        metricas: {
          minutos_transcurridos: elapsed,
          pasos_completados: completados.length,
          pasos_totales: protocolo.pasos.length,
        },
      });
    });
  }

  function cancelar() {
    startTransition(async () => {
      await cancelarProtocolo(eventoId);
    });
  }

  return (
    <div className="rounded-xl border-2 border-code-red/40 bg-code-red-bg/30 p-3 space-y-3">
      <CodeStatus kind={protocolo.kind} startedAt={startedAt} />

      <ol className="space-y-1.5">
        {protocolo.pasos.map((p, i) => (
          <WorkflowStep
            key={p.id}
            number={i + 1}
            title={p.titulo}
            detail={p.detalle}
            targetTime={p.tiempo}
            completed={Boolean(checked[p.id])}
            onToggle={() => toggle(p.id)}
            tone={p.tone ?? "default"}
          />
        ))}
      </ol>

      {protocolo.alertas.length > 0 && (
        <ClinicalAlert
          severity="warning"
          title="Alertas críticas"
          description={
            <ul className="space-y-0.5">
              {protocolo.alertas.map((a, i) => (
                <li key={i} className="text-caption">
                  • {a}
                </li>
              ))}
            </ul>
          }
          cite={protocolo.fuente}
        />
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={cancelar}
          disabled={pending}
          className="lg-cta-ghost text-caption"
        >
          Cancelar protocolo
        </button>
        <button
          type="button"
          onClick={completar}
          disabled={pending}
          className="lg-cta-primary inline-flex items-center gap-2 text-caption disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.2} />
          )}
          Completar
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Drawer: nuevo triage
   ============================================================ */
function NewTriageDrawer({ onClose }: { onClose: () => void }) {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState<"M" | "F" | "X">("M");
  const [motivo, setMotivo] = useState("");
  const [nivel, setNivel] = useState<TriageNivel>("amarillo");
  const [tas, setTas] = useState("");
  const [fc, setFc] = useState("");
  const [sato2, setSato2] = useState("");
  const [temp, setTemp] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    if (motivo.trim().length < 2) {
      setError("Captura el motivo de consulta.");
      return;
    }
    const sv: Record<string, number> = {};
    if (tas) sv.tas = Number(tas);
    if (fc) sv.fc = Number(fc);
    if (sato2) sv.sato2 = Number(sato2);
    if (temp) sv.temp = Number(temp);

    startTransition(async () => {
      const r = await iniciarTriage({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        pacienteSexo: sexo,
        motivo: motivo.trim(),
        nivel,
        signosVitales: Object.keys(sv).length > 0 ? sv : undefined,
      });
      if (r.status === "ok") {
        onClose();
      } else {
        setError(r.message);
      }
    });
  }

  return (
    <Drawer title="Nuevo triage" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <Field label="Iniciales">
            <input
              type="text"
              value={iniciales}
              onChange={(e) =>
                setIniciales(e.target.value.toUpperCase().slice(0, 8))
              }
              maxLength={8}
              placeholder="J.M."
              className="lg-input"
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

        <Field label="Motivo">
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value.slice(0, 300))}
            placeholder="Ej. Dolor torácico irradiado a brazo izq, 30 min de evolución"
            className="lg-input min-h-[72px] resize-y"
          />
        </Field>

        <div>
          <p className="text-caption font-medium text-ink-muted mb-1">
            Nivel
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {(Object.keys(TRIAGE_NIVELES) as TriageNivel[]).map((n) => {
              const sel = nivel === n;
              const tone =
                n === "rojo"
                  ? "critical"
                  : n === "naranja" || n === "amarillo"
                    ? "warning"
                    : "success";
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNivel(n)}
                  className={`rounded-lg border p-2 text-left transition-all ${
                    sel
                      ? "border-ink-strong bg-surface ring-2 ring-accent/30"
                      : "border-line bg-surface hover:border-line-strong"
                  }`}
                >
                  <StatusBadge tone={tone} size="sm">
                    {n}
                  </StatusBadge>
                  <p className="mt-1 text-caption text-ink-muted tabular-nums">
                    ≤ {TRIAGE_NIVELES[n].tiempoMax}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-caption font-medium text-ink-muted mb-1">
            Signos vitales (opcional)
          </p>
          <div className="grid grid-cols-4 gap-2">
            <Field label="TAS" small>
              <input
                type="number"
                value={tas}
                onChange={(e) => setTas(e.target.value)}
                className="lg-input"
              />
            </Field>
            <Field label="FC" small>
              <input
                type="number"
                value={fc}
                onChange={(e) => setFc(e.target.value)}
                className="lg-input"
              />
            </Field>
            <Field label="SatO₂" small>
              <input
                type="number"
                value={sato2}
                onChange={(e) => setSato2(e.target.value)}
                className="lg-input"
              />
            </Field>
            <Field label="Temp" small>
              <input
                type="number"
                step="0.1"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="lg-input"
              />
            </Field>
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
            ) : null}
            Registrar triage
          </button>
        </div>
      </div>
    </Drawer>
  );
}

/* ============================================================
   Drawer: activar protocolo
   ============================================================ */
function ActivateProtocolDrawer({
  protocolo,
  pacienteIniciales,
  pacienteEdad,
  onClose,
}: {
  protocolo: ProtocoloDef;
  pacienteIniciales: string | null;
  pacienteEdad: number | null;
  onClose: () => void;
}) {
  const [iniciales, setIniciales] = useState(pacienteIniciales ?? "");
  const [edad, setEdad] = useState(pacienteEdad?.toString() ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await iniciarProtocolo({
        tipo: protocolo.tipo,
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
      });
      if (r.status === "ok") {
        onClose();
      } else {
        setError(r.message);
      }
    });
  }

  const Icon = protocolo.icon;

  return (
    <Drawer title={`Activar ${protocolo.titulo}`} onClose={onClose}>
      <div className="space-y-3">
        <div
          className={`rounded-xl border p-3 ${
            protocolo.tone === "code-red"
              ? "border-code-red/40 bg-code-red-bg/40"
              : protocolo.tone === "code-amber"
                ? "border-code-amber/40 bg-code-amber-bg/40"
                : "border-accent/30 bg-accent-soft/40"
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon
              className={`h-5 w-5 ${
                protocolo.tone === "code-red"
                  ? "text-code-red"
                  : protocolo.tone === "code-amber"
                    ? "text-code-amber"
                    : "text-accent"
              }`}
              strokeWidth={2}
            />
            <p className="text-body-sm font-semibold text-ink-strong">
              {protocolo.subtitulo}
            </p>
          </div>
          <p className="mt-1 text-caption text-ink-muted">
            Objetivo: {protocolo.tiempoObjetivoMin} min · {protocolo.pasos.length} pasos
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Iniciales paciente">
            <input
              type="text"
              value={iniciales}
              onChange={(e) =>
                setIniciales(e.target.value.toUpperCase().slice(0, 8))
              }
              maxLength={8}
              placeholder="J.M."
              className="lg-input"
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
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold mb-1">
            Pasos
          </p>
          <ol className="space-y-1 text-caption text-ink-muted">
            {protocolo.pasos.map((p, i) => (
              <li key={p.id}>
                <span className="font-semibold text-ink-strong">
                  {i + 1}. {p.titulo}
                </span>{" "}
                · <span className="tabular-nums">{p.tiempo}</span>
              </li>
            ))}
          </ol>
        </div>

        {error && (
          <ClinicalAlert
            severity="critical"
            title="No se pudo activar"
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
              <Siren className="h-3.5 w-3.5" strokeWidth={2.4} />
            )}
            Activar protocolo
          </button>
        </div>
      </div>
    </Drawer>
  );
}

/* ============================================================
   Drawer (overlay) común
   ============================================================ */
function Drawer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
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
        aria-label={title}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface shadow-deep"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
          <h3 className="text-h3 font-semibold text-ink-strong">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink-strong"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.aside>
    </>
  );
}

function Field({
  label,
  small,
  children,
}: {
  label: string;
  small?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className={`block ${small ? "text-caption" : "text-caption"} font-medium text-ink-muted mb-1`}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

/* ============================================================
   Suppress unused warn (kept for AlertCircle import — used by callers)
   ============================================================ */
void AlertCircle;
