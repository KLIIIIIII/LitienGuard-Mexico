"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  ClipboardCheck,
  Users,
  Clock,
  ShieldCheck,
  TrendingUp,
  X,
  Loader2,
  Scissors,
} from "lucide-react";
import {
  ClinicalMetric,
  ClinicalAlert,
  DataTable,
  StatusBadge,
} from "@/components/clinical";
import type { DataTableColumn } from "@/components/clinical";
import { QUIROFANO_TIPOS, type EventoModulo } from "@/lib/modulos-eventos";
import { registrarTimeOut } from "./actions";

const WHO_CHECKS = [
  {
    id: "sitio_marcado",
    label: "Sitio quirúrgico marcado y verificado",
    detail: "Marca visible en piel del lado/sitio correcto",
  },
  {
    id: "consentimiento_firmado",
    label: "Consentimiento informado firmado",
    detail: "Firmado por paciente o tutor antes de inducción",
  },
  {
    id: "alergias_verificadas",
    label: "Alergias verificadas",
    detail: "Medicamentos, látex, contrastes radiológicos",
  },
  {
    id: "antibiotico_profilactico",
    label: "Antibiótico profiláctico administrado",
    detail: "60 min antes de incisión",
  },
  {
    id: "conteo_instrumental_inicial",
    label: "Conteo de gasas e instrumental",
    detail: "Registrado por enfermería circulante",
  },
] as const;

const PASOS_EXTENDIDOS = [
  "Identificación verbal del paciente y procedimiento",
  "Pulsioximetría funcionando",
  "Vía aérea y riesgo de aspiración evaluados",
  "Pérdida sanguínea esperada estimada",
  "Imágenes diagnósticas disponibles en quirófano",
  "Equipos quirúrgicos y biomédicos verificados",
  "Profilaxis tromboembolismo evaluada",
];

type TimeOutRow = {
  id: string;
  procedimiento: string;
  iniciales: string;
  edad: number | null;
  fecha: Date;
  checksOk: number;
  checksTotal: number;
  complianceFull: boolean;
};

export function QuirofanoBoard({ eventos }: { eventos: EventoModulo[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rows = useMemo<TimeOutRow[]>(() => {
    return eventos
      .filter((e) => e.tipo === QUIROFANO_TIPOS.time_out)
      .map((e) => {
        const d = e.datos as {
          paciente_iniciales?: string | null;
          paciente_edad?: number | null;
          procedimiento?: string;
        };
        const m = e.metricas as {
          checks_ok?: number;
          checks_total?: number;
          compliance_full?: boolean;
        };
        return {
          id: e.id,
          procedimiento: d.procedimiento ?? "—",
          iniciales: d.paciente_iniciales ?? "—",
          edad: d.paciente_edad ?? null,
          fecha: new Date(e.completed_at ?? e.created_at),
          checksOk: m.checks_ok ?? 0,
          checksTotal: m.checks_total ?? 5,
          complianceFull: m.compliance_full ?? false,
        };
      });
  }, [eventos]);

  const metricas = useMemo(() => {
    const cirugiasHoy = rows.filter((r) => {
      const today = new Date();
      return (
        r.fecha.getDate() === today.getDate() &&
        r.fecha.getMonth() === today.getMonth() &&
        r.fecha.getFullYear() === today.getFullYear()
      );
    }).length;
    const compliancePct =
      rows.length > 0
        ? Math.round((rows.filter((r) => r.complianceFull).length / rows.length) * 100)
        : null;
    return {
      cirugiasHoy,
      total7Dias: rows.length,
      compliancePct,
    };
  }, [rows]);

  return (
    <>
      <div className="space-y-5">
        {/* KPIs */}
        <section className="grid gap-3 sm:grid-cols-3">
          <ClinicalMetric
            label="Cirugías hoy"
            value={metricas.cirugiasHoy}
            unit={metricas.cirugiasHoy === 1 ? "procedimiento" : "procedimientos"}
            icon={Scissors}
          />
          <ClinicalMetric
            label="Time-outs 7 días"
            value={metricas.total7Dias}
            unit={metricas.total7Dias === 1 ? "registro" : "registros"}
            icon={ClipboardCheck}
          />
          <ClinicalMetric
            label="WHO compliance"
            value={metricas.compliancePct ?? "—"}
            unit={metricas.compliancePct != null ? "%" : ""}
            icon={TrendingUp}
            deltaInterpretation={
              metricas.compliancePct != null && metricas.compliancePct >= 90
                ? "good"
                : "bad"
            }
            caption="5/5 checks críticos"
          />
        </section>

        {/* Tracking */}
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Lista quirúrgica
              </p>
              <p className="text-body-sm text-ink-muted">
                Time-outs registrados · evidencia para auditoría de calidad
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg-cta-primary inline-flex items-center gap-2 text-caption"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              Nuevo time-out
            </button>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
              <ClipboardCheck
                className="mx-auto h-8 w-8 text-ink-quiet mb-2"
                strokeWidth={1.6}
              />
              <p className="text-body-sm text-ink-muted">
                Sin time-outs registrados en los últimos 7 días.
              </p>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="lg-cta-primary mt-4 inline-flex items-center gap-2 text-caption"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                Registrar primer time-out
              </button>
            </div>
          ) : (
            <DataTable
              data={rows}
              getRowKey={(r) => r.id}
              columns={timeoutColumns()}
              rowTone={(r) => (r.complianceFull ? "success" : "warning")}
              maxHeight="60vh"
            />
          )}
        </section>

        {/* Honesty about scope */}
        <ClinicalAlert
          severity="info"
          title="Próximas funcionalidades (Track B v2)"
          description="Programación quirúrgica del día con asignación de salas + preference cards por cirujano + documentación intraoperatoria con time-stamps + outcome 30 días (complicaciones, reingresos)."
        />
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <TimeOutDrawer onClose={() => setDrawerOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function timeoutColumns(): DataTableColumn<TimeOutRow>[] {
  return [
    {
      key: "compliance",
      label: "Compliance",
      sortValue: (r) => (r.complianceFull ? 1 : 0),
      render: (r) => (
        <StatusBadge
          tone={r.complianceFull ? "success" : "warning"}
          size="sm"
        >
          {r.checksOk}/{r.checksTotal}
        </StatusBadge>
      ),
    },
    {
      key: "procedimiento",
      label: "Procedimiento",
      width: "w-full",
      render: (r) => (
        <span className="font-semibold text-ink-strong line-clamp-1">
          {r.procedimiento}
        </span>
      ),
    },
    {
      key: "iniciales",
      label: "Paciente",
      render: (r) => (
        <span className="text-ink-strong">
          {r.iniciales}
          {r.edad && (
            <span className="ml-1 text-ink-muted tabular-nums">{r.edad}a</span>
          )}
        </span>
      ),
    },
    {
      key: "fecha",
      label: "Fecha",
      sortValue: (r) => r.fecha.getTime(),
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

function TimeOutDrawer({ onClose }: { onClose: () => void }) {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [procedimiento, setProcedimiento] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [adicionales, setAdicionales] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const checksOk = WHO_CHECKS.filter((c) => checks[c.id]).length;
  const compliance = (checksOk / WHO_CHECKS.length) * 100;

  function submit() {
    setError(null);
    if (procedimiento.trim().length < 2) {
      setError("Indica el procedimiento quirúrgico.");
      return;
    }
    const pasosCompletados = Object.entries(adicionales)
      .filter(([, v]) => v)
      .map(([k]) => k);

    startTransition(async () => {
      const r = await registrarTimeOut({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        procedimiento: procedimiento.trim(),
        sitioMarcado: Boolean(checks.sitio_marcado),
        consentimientoFirmado: Boolean(checks.consentimiento_firmado),
        alergiasVerificadas: Boolean(checks.alergias_verificadas),
        antibioticoProfilactico: Boolean(checks.antibiotico_profilactico),
        conteoInstrumentalInicial: Boolean(checks.conteo_instrumental_inicial),
        pasosCompletados,
      });
      if (r.status === "ok") {
        onClose();
      } else {
        setError(r.message);
      }
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
        aria-label="Nuevo time-out"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-line bg-surface shadow-deep"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
          <h3 className="text-h3 font-semibold text-ink-strong">
            WHO Time-out · {Math.round(compliance)}%
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

          <Field label="Procedimiento">
            <input
              type="text"
              value={procedimiento}
              onChange={(e) => setProcedimiento(e.target.value.slice(0, 200))}
              placeholder="Ej. Colecistectomía laparoscópica"
              className="lg-input"
            />
          </Field>

          <div>
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold mb-2">
              5 verificaciones críticas
            </p>
            <ul className="space-y-2">
              {WHO_CHECKS.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-line bg-surface p-3"
                >
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(checks[c.id])}
                      onChange={() =>
                        setChecks((s) => ({ ...s, [c.id]: !s[c.id] }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-line-strong"
                    />
                    <div className="flex-1">
                      <p
                        className={`text-body-sm font-semibold ${
                          checks[c.id]
                            ? "text-code-green"
                            : "text-ink-strong"
                        }`}
                      >
                        {c.label}
                      </p>
                      <p className="mt-0.5 text-caption text-ink-muted">
                        {c.detail}
                      </p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold mb-2">
              Verificaciones extendidas
            </p>
            <ul className="space-y-1">
              {PASOS_EXTENDIDOS.map((p) => (
                <li key={p}>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(adicionales[p])}
                      onChange={() =>
                        setAdicionales((s) => ({ ...s, [p]: !s[p] }))
                      }
                      className="mt-0.5 h-3.5 w-3.5 rounded border-line-strong"
                    />
                    <span
                      className={`text-caption ${
                        adicionales[p] ? "text-code-green" : "text-ink-muted"
                      }`}
                    >
                      {p}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
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
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} />
              )}
              Registrar time-out
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

void Users;
void Clock;
