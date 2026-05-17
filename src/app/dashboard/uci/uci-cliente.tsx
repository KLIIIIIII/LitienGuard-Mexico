"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, HeartPulse } from "lucide-react";
import type { EventoModulo } from "@/lib/modulos-eventos";
import { calcularSofa, interpretarSofa } from "@/lib/scores-uci";
import { registrarSofa } from "./actions";

const SISTEMAS = [
  { key: "respiratorio", label: "Respiratorio (PaO₂/FiO₂)" },
  { key: "coagulacion", label: "Coagulación (plaquetas)" },
  { key: "hepatico", label: "Hepático (bilirrubina)" },
  { key: "cardiovascular", label: "Cardiovascular (MAP/vasoactivos)" },
  { key: "neurologico", label: "Neurológico (Glasgow)" },
  { key: "renal", label: "Renal (creatinina/gasto urinario)" },
] as const;

export function UciCliente({ eventos }: { eventos: EventoModulo[] }) {
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
  const [ok, setOk] = useState(false);

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
  const interpretacion = useMemo(
    () => interpretarSofa(subscores.total),
    [subscores.total],
  );

  function submit() {
    setError(null);
    setOk(false);
    startTransition(async () => {
      const r = await registrarSofa({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        input,
      });
      if (r.status === "ok") {
        setOk(true);
        setTimeout(() => setOk(false), 3000);
      } else {
        setError(r.message);
      }
    });
  }

  const riesgoColor =
    interpretacion.riesgo === "bajo"
      ? "text-validation"
      : interpretacion.riesgo === "moderado"
        ? "text-warn"
        : "text-rose";

  return (
    <div className="space-y-6">
      <section className="lg-card space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              Calculadora SOFA
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              Captura parámetros del paciente. Los subscores se calculan en
              vivo.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-surface-alt px-4 py-2.5">
              <p className="text-caption text-ink-muted">SOFA total</p>
              <p className={`text-h2 font-bold tabular-nums ${riesgoColor}`}>
                {subscores.total}
              </p>
            </div>
            <div className="rounded-lg bg-surface-alt px-4 py-2.5">
              <p className="text-caption text-ink-muted">Riesgo</p>
              <p className={`text-body-sm font-semibold ${riesgoColor}`}>
                {interpretacion.riesgo.charAt(0).toUpperCase() +
                  interpretacion.riesgo.slice(1)}
              </p>
              <p className="text-caption text-ink-muted">
                Mortalidad {interpretacion.mortalidad}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Block titulo="Respiratorio" puntos={subscores.respiratorio}>
            <Field label="PaO₂ / FiO₂ (mmHg)">
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
              <Field label="Dopamina (mcg/kg/min)">
                <input
                  type="number"
                  step="0.1"
                  value={dopaminaMcgKgMin}
                  onChange={(e) => setDopaminaMcgKgMin(e.target.value)}
                  className="lg-input"
                />
              </Field>
              <Field label="Norepi (mcg/kg/min)">
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
              <Field label="Adrenalina (mcg/kg/min)">
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
        </div>

        <div className="rounded-lg bg-surface-alt/40 p-3">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
            Interpretación
          </p>
          <p className={`mt-1 text-body-sm font-semibold ${riesgoColor}`}>
            SOFA {subscores.total} · Mortalidad estimada {interpretacion.mortalidad}
          </p>
          <p className="mt-1 text-caption text-ink-muted">
            {interpretacion.mensaje}
          </p>
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
              <p className="text-caption text-ink-strong">SOFA registrado.</p>
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
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
            ) : (
              <HeartPulse className="h-4 w-4" strokeWidth={2.2} />
            )}
            Registrar SOFA
          </button>
        </div>
      </section>

      {eventos.length > 0 && (
        <section>
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            SOFAs registrados (30 días)
          </h2>
          <div className="mt-3 space-y-2">
            {eventos.slice(0, 10).map((e) => {
              const datos = e.datos as {
                paciente_iniciales?: string | null;
                paciente_edad?: number | null;
                subscores?: { total: number };
              };
              const metricas = e.metricas as {
                sofa_total?: number;
                riesgo?: string;
              };
              const fecha = new Date(e.completed_at ?? e.created_at);
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <HeartPulse
                      className="h-4 w-4 shrink-0 text-rose"
                      strokeWidth={2}
                    />
                    <div className="min-w-0">
                      <p className="text-caption font-semibold text-ink-strong">
                        SOFA {metricas.sofa_total ?? datos.subscores?.total} ·
                        riesgo {metricas.riesgo ?? "—"}
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
        ? "border-validation-soft bg-validation-soft/20"
        : puntos <= 2
          ? "border-warn-soft bg-warn-soft/20"
          : "border-rose-soft bg-rose-soft/20";
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
