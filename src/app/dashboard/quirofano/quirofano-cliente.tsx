"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ClipboardCheck,
  ShieldCheck,
} from "lucide-react";
import type { EventoModulo } from "@/lib/modulos-eventos";
import { registrarTimeOut } from "./actions";

const CHECKS = [
  {
    id: "sitio_marcado",
    label: "Sitio quirúrgico marcado y verificado",
    detalle: "Marca visible en piel del lado/sitio correcto",
  },
  {
    id: "consentimiento_firmado",
    label: "Consentimiento informado firmado",
    detalle: "Firmado por paciente o tutor antes de inducción",
  },
  {
    id: "alergias_verificadas",
    label: "Alergias verificadas con paciente o expediente",
    detalle: "Medicamentos, látex, contrastes radiológicos",
  },
  {
    id: "antibiotico_profilactico",
    label: "Antibiótico profiláctico administrado",
    detalle: "60 min antes de incisión (120 min para vancomicina/fluoroquinolonas)",
  },
  {
    id: "conteo_instrumental_inicial",
    label: "Conteo de gasas e instrumental inicial",
    detalle: "Registrado por enfermería circulante",
  },
] as const;

const PASOS_ADICIONALES = [
  "Identificación verbal del paciente y procedimiento por equipo",
  "Pulsioximetría funcionando",
  "Vía aérea y riesgo de aspiración evaluados",
  "Pérdida sanguínea esperada estimada (transfusión disponible si > 500 mL)",
  "Imágenes diagnósticas pertinentes disponibles en quirófano",
  "Equipos quirúrgicos y biomédicos verificados",
  "Profilaxis de tromboembolismo evaluada",
];

export function QuirofanoCliente({ eventos }: { eventos: EventoModulo[] }) {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [procedimiento, setProcedimiento] = useState("");
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [adicionales, setAdicionales] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function reset() {
    setIniciales("");
    setEdad("");
    setProcedimiento("");
    setChecks({});
    setAdicionales({});
  }

  function submit() {
    setError(null);
    setOk(false);
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
        setOk(true);
        reset();
        setTimeout(() => setOk(false), 3000);
      } else {
        setError(r.message);
      }
    });
  }

  const checksOk = CHECKS.filter((c) => checks[c.id]).length;
  const compliance = (checksOk / CHECKS.length) * 100;

  return (
    <div className="space-y-6">
      <section className="lg-card space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              WHO Surgical Safety Checklist
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              5 verificaciones críticas antes de incisión + opcionales
              extendidas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-surface-alt px-3 py-1.5">
              <span className="text-caption text-ink-muted">Compliance</span>{" "}
              <span
                className={`text-caption font-bold ${
                  compliance === 100
                    ? "text-validation"
                    : compliance >= 60
                      ? "text-warn"
                      : "text-rose"
                }`}
              >
                {Math.round(compliance)}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Iniciales (opcional)">
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
          <Field label="Procedimiento">
            <input
              type="text"
              value={procedimiento}
              onChange={(e) => setProcedimiento(e.target.value.slice(0, 200))}
              placeholder="Ej. Colecistectomía laparoscópica"
              className="lg-input"
            />
          </Field>
        </div>

        <div>
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
            5 verificaciones críticas
          </p>
          <ul className="mt-2 space-y-2">
            {CHECKS.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-line bg-surface p-3"
              >
                <label className="flex items-start gap-3 cursor-pointer">
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
                        checks[c.id] ? "text-validation" : "text-ink-strong"
                      }`}
                    >
                      {c.label}
                    </p>
                    <p className="mt-0.5 text-caption text-ink-muted">
                      {c.detalle}
                    </p>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
            Verificaciones extendidas (opcionales)
          </p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {PASOS_ADICIONALES.map((p) => (
              <li key={p}>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(adicionales[p])}
                    onChange={() =>
                      setAdicionales((s) => ({ ...s, [p]: !s[p] }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-line-strong"
                  />
                  <span
                    className={`text-caption ${
                      adicionales[p] ? "text-validation" : "text-ink-muted"
                    }`}
                  >
                    {p}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft/40 p-3"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-rose"
                strokeWidth={2}
              />
              <p className="text-caption text-ink-strong">{error}</p>
            </motion.div>
          )}
          {ok && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 rounded-lg border border-validation bg-validation-soft/40 p-3"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-validation"
                strokeWidth={2.2}
              />
              <p className="text-caption text-ink-strong">
                Time-out registrado correctamente.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="lg-cta-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
                Registrando…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
                Registrar time-out
              </>
            )}
          </button>
        </div>
      </section>

      {eventos.length > 0 && (
        <section>
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            Time-outs últimos 7 días
          </h2>
          <p className="mt-1 text-caption text-ink-muted">
            {eventos.length}{" "}
            {eventos.length === 1 ? "registro" : "registros"}.
          </p>
          <div className="mt-3 space-y-2">
            {eventos.slice(0, 10).map((e) => {
              const datos = e.datos as {
                paciente_iniciales?: string | null;
                procedimiento?: string;
              };
              const metricas = e.metricas as {
                checks_ok?: number;
                checks_total?: number;
                compliance_full?: boolean;
              };
              const fecha = new Date(e.completed_at ?? e.created_at);
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ClipboardCheck
                      className={`h-4 w-4 shrink-0 ${metricas.compliance_full ? "text-validation" : "text-warn"}`}
                      strokeWidth={2}
                    />
                    <div className="min-w-0">
                      <p className="text-caption font-semibold text-ink-strong truncate">
                        {datos.procedimiento ?? "Procedimiento"}
                        {datos.paciente_iniciales &&
                          ` · ${datos.paciente_iniciales}`}
                      </p>
                      <p className="text-caption text-ink-muted">
                        {fecha.toLocaleString("es-MX", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {metricas.checks_ok ?? 0}/{metricas.checks_total ?? 5}{" "}
                        checks
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
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
