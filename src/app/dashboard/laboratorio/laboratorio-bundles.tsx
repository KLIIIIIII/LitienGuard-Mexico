"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Loader2,
  Plus,
  TrendingUp,
  X,
  Workflow,
} from "lucide-react";
import {
  ClinicalAlert,
  StatusBadge,
} from "@/components/clinical";
import type { EventoModulo } from "@/lib/modulos-eventos";
import {
  interpretarLab,
  detectarReflexTests,
  detectarDeltaCheck,
  getLabLabel,
  getLabUnidad,
  type LabTest,
  type LabInterpretation,
  type ReflexRecommendation,
  type DeltaCheckResult,
} from "@/lib/scores-lab";
import { registrarValorLab } from "./actions";

const EASE = [0.22, 1, 0.36, 1] as const;

const ALL_TESTS: LabTest[] = [
  "glucosa",
  "potasio",
  "sodio",
  "calcio",
  "creatinina",
  "hemoglobina",
  "plaquetas",
  "leucocitos",
  "inr",
  "troponina",
  "lactato",
  "ph_arterial",
  "pco2",
  "po2",
  "tsh",
  "hba1c",
];

export function LaboratorioBundles({ eventos }: { eventos: EventoModulo[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const stats = useMemo(() => {
    const valores = eventos.filter((e) => e.tipo === "valor_lab");

    const criticos = valores.filter((e) => {
      const m = (e.metricas ?? {}) as { es_critico?: boolean };
      return m.es_critico === true;
    }).length;

    const reflexSugeridos = valores.reduce((sum, e) => {
      const m = (e.metricas ?? {}) as { reflex_count?: number };
      return sum + (m.reflex_count ?? 0);
    }, 0);

    const deltaAnormales = valores.filter((e) => {
      const m = (e.metricas ?? {}) as { delta_anormal?: boolean };
      return m.delta_anormal === true;
    }).length;

    return {
      total: valores.length,
      criticos,
      reflexSugeridos,
      deltaAnormales,
    };
  }, [eventos]);

  return (
    <>
      <section>
        <div className="mb-3">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
            Motor LitienGuard · Lab Pathway
          </p>
          <p className="text-body-sm text-ink-muted">
            Detección de valores críticos, reflex testing y delta check
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard
            icon={AlertTriangle}
            tone="rose"
            titulo="Valores críticos"
            valor={stats.criticos}
            unidad={stats.criticos === 1 ? "resultado" : "resultados"}
            critical={stats.criticos > 0}
          />
          <KpiCard
            icon={Workflow}
            tone="warn"
            titulo="Tests reflex sugeridos"
            valor={stats.reflexSugeridos}
            unidad={stats.reflexSugeridos === 1 ? "sugerencia" : "sugerencias"}
          />
          <KpiCard
            icon={TrendingUp}
            tone="validation"
            titulo="Delta check anormales"
            valor={stats.deltaAnormales}
            unidad={stats.deltaAnormales === 1 ? "cambio" : "cambios"}
            caption="vs valor previo"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[0.65rem] text-ink-soft leading-relaxed">
            Registra un valor de laboratorio para activar Motor LitienGuard ·
            Lab Pathway con detección automática de valores fuera de rango
            crítico, sugerencias reflex y comparación delta.
          </p>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="lg-cta-primary inline-flex items-center gap-1 text-caption shrink-0"
          >
            <Plus className="h-3 w-3" strokeWidth={2.4} />
            Nuevo valor
          </button>
        </div>
      </section>

      <AnimatePresence>
        {drawerOpen && (
          <LabPathwayDrawer onClose={() => setDrawerOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function KpiCard({
  icon: Icon,
  tone,
  titulo,
  valor,
  unidad,
  caption,
  critical,
}: {
  icon: typeof AlertTriangle;
  tone: "rose" | "validation" | "warn";
  titulo: string;
  valor: number;
  unidad: string;
  caption?: string;
  critical?: boolean;
}) {
  const toneCls =
    tone === "rose"
      ? "border-rose/30 bg-rose-soft/30 text-rose"
      : tone === "warn"
        ? "border-warn/30 bg-warn-soft/30 text-warn"
        : "border-validation/30 bg-validation-soft/30 text-validation";

  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg border ${toneCls}`}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <p className="mt-3 text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-soft">
        {titulo}
      </p>
      <p
        className={`mt-0.5 text-h2 font-bold tabular-nums ${
          critical ? "text-rose" : "text-ink-strong"
        }`}
      >
        {valor}
      </p>
      <p className="text-caption text-ink-muted">{unidad}</p>
      {caption && <p className="mt-0.5 text-[0.6rem] text-ink-soft">{caption}</p>}
    </article>
  );
}

function LabPathwayDrawer({ onClose }: { onClose: () => void }) {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState<"M" | "F" | "X">("M");
  const [test, setTest] = useState<LabTest>("glucosa");
  const [valor, setValor] = useState("");
  const [valorPrevio, setValorPrevio] = useState("");
  const [diasEntre, setDiasEntre] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const valorNum = Number(valor);
  const valorPrevioNum = valorPrevio ? Number(valorPrevio) : null;
  const diasEntreNum = diasEntre ? Number(diasEntre) : null;

  const interpretation: LabInterpretation | null = useMemo(() => {
    if (!valor || Number.isNaN(valorNum)) return null;
    return interpretarLab({
      test,
      valor: valorNum,
      edad: edad ? Number(edad) : undefined,
      sexo: sexo === "X" ? "O" : sexo,
    });
  }, [test, valorNum, valor, edad, sexo]);

  const reflexRecs: ReflexRecommendation[] = useMemo(() => {
    if (!interpretation) return [];
    return detectarReflexTests(interpretation);
  }, [interpretation]);

  const deltaResult: DeltaCheckResult | null = useMemo(() => {
    if (
      !interpretation ||
      valorPrevioNum === null ||
      diasEntreNum === null ||
      Number.isNaN(valorPrevioNum) ||
      Number.isNaN(diasEntreNum)
    )
      return null;
    return detectarDeltaCheck({
      test,
      valorActual: valorNum,
      valorPrevio: valorPrevioNum,
      diasEntre: diasEntreNum,
    });
  }, [interpretation, test, valorNum, valorPrevioNum, diasEntreNum]);

  function submit() {
    setError(null);
    if (!valor || Number.isNaN(valorNum)) {
      setError("Ingresa el valor numérico");
      return;
    }
    startTransition(async () => {
      const res = await registrarValorLab({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        pacienteSexo: sexo,
        test,
        valor: valorNum,
        valorPrevio: valorPrevioNum ?? undefined,
        diasEntre: diasEntreNum ?? undefined,
      });
      if (res.status === "ok") onClose();
      else setError(res.message);
    });
  }

  const sevTone =
    interpretation?.severidad === "critico_bajo" ||
    interpretation?.severidad === "critico_alto"
      ? "text-rose"
      : interpretation?.severidad === "anormal"
        ? "text-warn"
        : "text-validation";

  return (
    <DrawerShell title="Motor LitienGuard · Lab Pathway" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
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

        <Field label="Test de laboratorio">
          <select
            value={test}
            onChange={(e) => setTest(e.target.value as LabTest)}
            className="lg-input"
          >
            {ALL_TESTS.map((t) => (
              <option key={t} value={t}>
                {getLabLabel(t)} ({getLabUnidad(t)})
              </option>
            ))}
          </select>
        </Field>

        <Field label={`Valor actual (${getLabUnidad(test)})`}>
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="lg-input"
            placeholder={`Rango: ${interpretation?.rango ?? ""}`}
          />
        </Field>

        {interpretation && (
          <div
            className={`rounded-lg border px-3 py-2.5 ${
              interpretation.severidad === "critico_bajo" ||
              interpretation.severidad === "critico_alto"
                ? "border-rose bg-rose-soft/40"
                : interpretation.severidad === "anormal"
                  ? "border-warn bg-warn-soft/40"
                  : "border-validation bg-validation-soft/40"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`text-h3 font-bold tabular-nums ${sevTone}`}>
                  {interpretation.valor} {interpretation.unidad}
                </p>
                <p className={`text-caption font-semibold ${sevTone}`}>
                  {interpretation.severidad.replace("_", " ")}
                </p>
                <p className="text-[0.65rem] text-ink-muted mt-0.5">
                  Rango referencia: {interpretation.rango}
                </p>
              </div>
              {(interpretation.severidad === "critico_bajo" ||
                interpretation.severidad === "critico_alto") && (
                <StatusBadge tone="critical" pulse size="sm">
                  Crítico
                </StatusBadge>
              )}
            </div>
            <p className="mt-2 text-caption text-ink-strong">
              {interpretation.mensaje}
            </p>
            {interpretation.accionSugerida && (
              <div className="mt-2 rounded-md bg-canvas/60 px-2.5 py-1.5">
                <p className="text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-soft">
                  Acción sugerida
                </p>
                <p className="mt-0.5 text-caption text-ink-strong leading-relaxed">
                  {interpretation.accionSugerida}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Delta check section */}
        <div className="rounded-lg border border-line bg-surface-alt/40 px-3 py-2.5">
          <p className="text-caption uppercase tracking-eyebrow font-semibold text-ink-soft mb-2">
            Delta check (opcional)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Field label={`Valor previo (${getLabUnidad(test)})`}>
              <input
                type="number"
                step="0.01"
                value={valorPrevio}
                onChange={(e) => setValorPrevio(e.target.value)}
                className="lg-input"
              />
            </Field>
            <Field label="Días entre mediciones">
              <input
                type="number"
                value={diasEntre}
                onChange={(e) => setDiasEntre(e.target.value)}
                min={0}
                max={365}
                className="lg-input"
              />
            </Field>
          </div>
          {deltaResult && deltaResult.esDeltaAnormal && (
            <div
              className={`mt-2 rounded-md px-2.5 py-1.5 ${
                deltaResult.severidad === "cambio_critico"
                  ? "bg-rose-soft/60"
                  : "bg-warn-soft/60"
              }`}
            >
              <p
                className={`text-caption font-semibold ${
                  deltaResult.severidad === "cambio_critico"
                    ? "text-rose"
                    : "text-warn"
                }`}
              >
                {deltaResult.mensaje}
              </p>
            </div>
          )}
        </div>

        {reflexRecs.length > 0 && (
          <div className="rounded-lg border border-accent/40 bg-accent-soft/30 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-caption uppercase tracking-eyebrow font-semibold text-accent">
              <Workflow className="h-3 w-3" strokeWidth={2.4} />
              Reflex testing sugerido
            </p>
            <ul className="mt-2 space-y-1.5">
              {reflexRecs.map((r, i) => (
                <li key={i} className="text-caption text-ink-strong">
                  <span className="font-semibold">{r.recommendedTest}</span>
                  <span className="text-ink-muted"> — {r.rationale}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <ClinicalAlert severity="critical" title="No se pudo registrar" description={error} />
        )}

        <FooterActions
          onCancel={onClose}
          onSubmit={submit}
          pending={pending}
          icon={FlaskConical}
          label="Registrar valor"
        />
        <p className="text-[0.6rem] text-ink-soft italic">
          Motor LitienGuard · Lab Pathway
        </p>
      </div>
    </DrawerShell>
  );
}

/* ============================================================
   Shared helpers (mismo patrón de los otros bundles)
   ============================================================ */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption font-medium text-ink-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

function FooterActions({
  onCancel,
  onSubmit,
  pending,
  icon: Icon,
  label,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  pending: boolean;
  icon: typeof FlaskConical;
  label: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2 border-t border-line">
      <button type="button" onClick={onCancel} className="lg-cta-ghost text-caption">
        Cancelar
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={pending}
        className="lg-cta-primary inline-flex items-center gap-2 text-caption disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
        ) : (
          <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
        )}
        {label}
      </button>
    </div>
  );
}

function DrawerShell({
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
        transition={{ duration: 0.25, ease: EASE }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-line bg-surface shadow-deep"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3">
          <h3 className="text-h3 font-semibold text-ink-strong">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink-strong"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </motion.aside>
    </>
  );
}

void CheckCircle2;
