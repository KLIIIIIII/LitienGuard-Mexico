"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  Brain,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import {
  ClinicalAlert,
  ClinicalMetric,
  StatusBadge,
} from "@/components/clinical";
import {
  UCI_TIPOS,
  type EventoModulo,
} from "@/lib/modulos-eventos";
import {
  calcularApacheII,
  calcularFastHug,
  evaluarCamIcu,
  type ApacheInput,
  type FastHugInput,
  type CamIcuInput,
} from "@/lib/scores-uci-extended";
import {
  registrarApacheII,
  registrarFastHug,
  registrarCamIcu,
} from "./actions";

const EASE = [0.22, 1, 0.36, 1] as const;

type Drawer = "none" | "apache" | "fasthug" | "camicu";

export function UciBundles({ eventos }: { eventos: EventoModulo[] }) {
  const [drawer, setDrawer] = useState<Drawer>("none");

  const stats = useMemo(() => {
    const apaches = eventos.filter((e) => e.tipo === UCI_TIPOS.apache_ii);
    const fastHugs = eventos.filter((e) => e.tipo === UCI_TIPOS.fast_hug);
    const camIcus = eventos.filter((e) => e.tipo === "cam_icu");

    const apacheAvg =
      apaches.length > 0
        ? Math.round(
            apaches.reduce((s, e) => {
              const m = (e.metricas ?? {}) as { apache_total?: number };
              return s + (m.apache_total ?? 0);
            }, 0) / apaches.length,
          )
        : null;

    const fastHugCompliance =
      fastHugs.length > 0
        ? Math.round(
            fastHugs.reduce((s, e) => {
              const m = (e.metricas ?? {}) as { compliance?: number };
              return s + (m.compliance ?? 0);
            }, 0) / fastHugs.length,
          )
        : null;

    const camDeliriumRate =
      camIcus.length > 0
        ? Math.round(
            (camIcus.filter((e) => {
              const m = (e.metricas ?? {}) as { delirium?: boolean };
              return m.delirium === true;
            }).length /
              camIcus.length) *
              100,
          )
        : null;

    return {
      apacheCount: apaches.length,
      apacheAvg,
      fastHugCount: fastHugs.length,
      fastHugCompliance,
      camIcuCount: camIcus.length,
      camDeliriumRate,
    };
  }, [eventos]);

  return (
    <>
      <section>
        <div className="mb-3">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
            Bundles de Critical Care
          </p>
          <p className="text-body-sm text-ink-muted">
            Scores y bundles del SCCM ICU Liberation Bundle (A-F)
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <BundleCard
            icon={Activity}
            tone="rose"
            titulo="APACHE II"
            subtitulo="Severidad al ingreso UCI"
            cita="Knaus · Crit Care Med 1985"
            count={stats.apacheCount}
            countLabel="ingresos evaluados"
            primaryMetric={
              stats.apacheAvg !== null ? `${stats.apacheAvg} pts` : "—"
            }
            primaryMetricLabel="Score promedio"
            onAdd={() => setDrawer("apache")}
          />
          <BundleCard
            icon={ClipboardList}
            tone="validation"
            titulo="FAST-HUG"
            subtitulo="Bundle diario · 7 items"
            cita="Vincent · Crit Care Med 2005"
            count={stats.fastHugCount}
            countLabel="evaluaciones"
            primaryMetric={
              stats.fastHugCompliance !== null
                ? `${stats.fastHugCompliance}%`
                : "—"
            }
            primaryMetricLabel="Compliance promedio"
            onAdd={() => setDrawer("fasthug")}
          />
          <BundleCard
            icon={Brain}
            tone="warn"
            titulo="CAM-ICU"
            subtitulo="Screening delirium"
            cita="Ely · JAMA 2001"
            count={stats.camIcuCount}
            countLabel="screenings"
            primaryMetric={
              stats.camDeliriumRate !== null
                ? `${stats.camDeliriumRate}%`
                : "—"
            }
            primaryMetricLabel="Delirium rate"
            onAdd={() => setDrawer("camicu")}
          />
        </div>

        <p className="mt-3 text-[0.65rem] text-ink-soft leading-relaxed">
          Bundles alineados al SCCM ICU Liberation Bundle (A-F):
          A·Assess pain · B·Both SAT/SBT · C·Choice analgesia/sedation ·
          D·Delirium · E·Early mobility · F·Family.
        </p>
      </section>

      <AnimatePresence>
        {drawer === "apache" && (
          <ApacheDrawer onClose={() => setDrawer("none")} />
        )}
        {drawer === "fasthug" && (
          <FastHugDrawer onClose={() => setDrawer("none")} />
        )}
        {drawer === "camicu" && (
          <CamIcuDrawer onClose={() => setDrawer("none")} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================
   BundleCard — card del header
   ============================================================ */

function BundleCard({
  icon: Icon,
  tone,
  titulo,
  subtitulo,
  cita,
  count,
  countLabel,
  primaryMetric,
  primaryMetricLabel,
  onAdd,
}: {
  icon: typeof Activity;
  tone: "rose" | "validation" | "warn";
  titulo: string;
  subtitulo: string;
  cita: string;
  count: number;
  countLabel: string;
  primaryMetric: string;
  primaryMetricLabel: string;
  onAdd: () => void;
}) {
  const toneCls =
    tone === "rose"
      ? "border-rose/30 bg-rose-soft/30 text-rose"
      : tone === "validation"
        ? "border-validation/30 bg-validation-soft/30 text-validation"
        : "border-warn/30 bg-warn-soft/30 text-warn";

  return (
    <article className="rounded-xl border border-line bg-surface p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg border ${toneCls}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="lg-cta-primary inline-flex items-center gap-1 text-caption"
        >
          <Plus className="h-3 w-3" strokeWidth={2.4} />
          Nuevo
        </button>
      </div>
      <div>
        <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
          {titulo}
        </h3>
        <p className="text-caption text-ink-muted">{subtitulo}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-line pt-2.5">
        <div>
          <p className="text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-soft">
            {primaryMetricLabel}
          </p>
          <p className="mt-0.5 text-h3 font-bold tabular-nums text-ink-strong">
            {primaryMetric}
          </p>
        </div>
        <div>
          <p className="text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-soft">
            Total
          </p>
          <p className="mt-0.5 text-h3 font-bold tabular-nums text-ink-strong">
            {count}
          </p>
          <p className="text-[0.6rem] text-ink-soft">{countLabel}</p>
        </div>
      </div>
      <p className="text-[0.6rem] text-ink-soft italic border-t border-line pt-2">
        {cita}
      </p>
    </article>
  );
}

/* ============================================================
   APACHE II Drawer
   ============================================================ */

function ApacheDrawer({ onClose }: { onClose: () => void }) {
  const [iniciales, setIniciales] = useState("");
  const [input, setInput] = useState<ApacheInput>({
    tempC: 37,
    map: 90,
    fc: 80,
    fr: 18,
    fio2: 0.21,
    pao2: 80,
    aADO2: undefined,
    pHArterial: 7.4,
    naMeqL: 140,
    kMeqL: 4.2,
    creatininaMg: 1,
    aki: false,
    hto: 40,
    leucosMil: 8,
    glasgow: 15,
    edad: 60,
    cronicaSevera: false,
    noElectivo: true,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const r = useMemo(() => calcularApacheII(input), [input]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await registrarApacheII({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: input.edad,
        input,
      });
      if (res.status === "ok") onClose();
      else setError(res.message);
    });
  }

  const tone =
    r.severidad === "muy_alta"
      ? "text-rose"
      : r.severidad === "alta"
        ? "text-rose"
        : r.severidad === "moderada"
          ? "text-warn"
          : "text-validation";

  return (
    <DrawerShell title="APACHE II — Severidad al ingreso UCI" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Iniciales paciente">
          <input
            type="text"
            value={iniciales}
            onChange={(e) => setIniciales(e.target.value.toUpperCase().slice(0, 8))}
            maxLength={8}
            placeholder="J.M."
            className="lg-input"
          />
        </Field>

        <div className="rounded-lg border border-line bg-surface-alt/40 px-3 py-2">
          <p className="text-caption uppercase tracking-eyebrow font-semibold text-ink-soft">
            Resultado
          </p>
          <p className={`mt-1 text-h2 font-bold tabular-nums ${tone}`}>
            {r.total} / 71
          </p>
          <p className={`text-caption font-semibold ${tone}`}>
            Severidad {r.severidad.replace("_", " ")} · mortalidad{" "}
            {r.mortalidadAprox}
          </p>
          <p className="mt-1 text-[0.6rem] text-ink-soft">
            APS {r.aps} + edad {r.edadPts} + crónica {r.cronicaPts}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <NumField label="Temp °C" value={input.tempC} step="0.1" onChange={(v) => setInput({ ...input, tempC: v })} />
          <NumField label="MAP" value={input.map} onChange={(v) => setInput({ ...input, map: v })} />
          <NumField label="FC" value={input.fc} onChange={(v) => setInput({ ...input, fc: v })} />
          <NumField label="FR" value={input.fr} onChange={(v) => setInput({ ...input, fr: v })} />
          <NumField label="FiO₂ (0.21-1.0)" value={input.fio2} step="0.01" onChange={(v) => setInput({ ...input, fio2: v })} />
          {input.fio2 >= 0.5 ? (
            <NumField label="A-aDO₂" value={input.aADO2 ?? 0} onChange={(v) => setInput({ ...input, aADO2: v })} />
          ) : (
            <NumField label="PaO₂" value={input.pao2 ?? 80} onChange={(v) => setInput({ ...input, pao2: v })} />
          )}
          <NumField label="pH" value={input.pHArterial} step="0.01" onChange={(v) => setInput({ ...input, pHArterial: v })} />
          <NumField label="Na" value={input.naMeqL} onChange={(v) => setInput({ ...input, naMeqL: v })} />
          <NumField label="K" value={input.kMeqL} step="0.1" onChange={(v) => setInput({ ...input, kMeqL: v })} />
          <NumField label="Creatinina" value={input.creatininaMg} step="0.1" onChange={(v) => setInput({ ...input, creatininaMg: v })} />
          <NumField label="Hto %" value={input.hto} onChange={(v) => setInput({ ...input, hto: v })} />
          <NumField label="Leucos ×10³" value={input.leucosMil} step="0.1" onChange={(v) => setInput({ ...input, leucosMil: v })} />
          <NumField label="Glasgow" value={input.glasgow} onChange={(v) => setInput({ ...input, glasgow: v })} />
          <NumField label="Edad" value={input.edad} onChange={(v) => setInput({ ...input, edad: v })} />
        </div>

        <div className="space-y-1.5">
          <CheckField
            label="¿AKI? (duplica score creatinina)"
            checked={input.aki}
            onChange={(v) => setInput({ ...input, aki: v })}
          />
          <CheckField
            label="Comorbilidad crónica severa (cirrosis, IC NYHA IV, EPOC severo, ERC en diálisis, inmunodepresión)"
            checked={input.cronicaSevera}
            onChange={(v) => setInput({ ...input, cronicaSevera: v })}
          />
          <CheckField
            label="¿No electivo? (vs postquirúrgico electivo)"
            checked={input.noElectivo}
            onChange={(v) => setInput({ ...input, noElectivo: v })}
          />
        </div>

        {error && (
          <ClinicalAlert severity="critical" title="No se pudo registrar" description={error} />
        )}

        <FooterActions onCancel={onClose} onSubmit={submit} pending={pending} icon={Activity} label="Registrar APACHE II" />
        <p className="text-[0.6rem] text-ink-soft italic">
          Score original: Knaus W.A. et al. APACHE II: a severity of disease
          classification system. Crit Care Med 1985.
        </p>
      </div>
    </DrawerShell>
  );
}

/* ============================================================
   FAST-HUG Drawer
   ============================================================ */

function FastHugDrawer({ onClose }: { onClose: () => void }) {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [input, setInput] = useState<FastHugInput>({
    feeding: false,
    analgesia: false,
    sedation: false,
    thromboprophylaxis: false,
    headOfBed: false,
    ulcerProphylaxis: false,
    glucoseControl: false,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const r = useMemo(() => calcularFastHug(input), [input]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await registrarFastHug({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        input,
      });
      if (res.status === "ok") onClose();
      else setError(res.message);
    });
  }

  const items: Array<[keyof FastHugInput, string]> = [
    ["feeding", "Feeding — nutrición enteral/parenteral iniciada"],
    ["analgesia", "Analgesia — escala dolor evaluada (NRS / BPS)"],
    ["sedation", "Sedation — escala RASS evaluada"],
    ["thromboprophylaxis", "Thromboprophylaxis — HBPM o mecánica"],
    ["headOfBed", "Head of bed ≥ 30°"],
    ["ulcerProphylaxis", "Ulcer prophylaxis — IBP o sucralfato"],
    ["glucoseControl", "Glucose control — target 140-180 mg/dL"],
  ];

  return (
    <DrawerShell title="FAST-HUG — Bundle diario UCI" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Iniciales">
            <input
              type="text"
              value={iniciales}
              onChange={(e) => setIniciales(e.target.value.toUpperCase().slice(0, 8))}
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

        <div className="rounded-lg border border-line bg-surface-alt/40 px-3 py-2 flex items-center justify-between">
          <div>
            <p className="text-caption uppercase tracking-eyebrow font-semibold text-ink-soft">
              Compliance
            </p>
            <p
              className={`text-h2 font-bold tabular-nums ${
                r.bundleCompleto
                  ? "text-validation"
                  : r.compliance >= 70
                    ? "text-warn"
                    : "text-rose"
              }`}
            >
              {r.cumplidos} / 7
            </p>
          </div>
          <StatusBadge
            tone={r.bundleCompleto ? "success" : r.compliance >= 70 ? "warning" : "critical"}
            size="md"
          >
            {r.compliance}%
          </StatusBadge>
        </div>

        <div className="space-y-1.5">
          {items.map(([key, label]) => (
            <CheckField
              key={key}
              label={label}
              checked={input[key]}
              onChange={(v) => setInput({ ...input, [key]: v })}
            />
          ))}
        </div>

        {r.pendientesLista.length > 0 && (
          <ClinicalAlert
            severity="warning"
            title={`${r.pendientes} item${r.pendientes === 1 ? "" : "s"} pendiente${r.pendientes === 1 ? "" : "s"}`}
            description={
              <ul className="space-y-0.5 text-caption">
                {r.pendientesLista.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            }
          />
        )}

        {error && <ClinicalAlert severity="critical" title="No se pudo registrar" description={error} />}

        <FooterActions onCancel={onClose} onSubmit={submit} pending={pending} icon={ClipboardList} label="Registrar FAST-HUG" />
        <p className="text-[0.6rem] text-ink-soft italic">
          Vincent J-L. Give your patient a fast hug (at least) once a day.
          Crit Care Med 2005.
        </p>
      </div>
    </DrawerShell>
  );
}

/* ============================================================
   CAM-ICU Drawer
   ============================================================ */

function CamIcuDrawer({ onClose }: { onClose: () => void }) {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [input, setInput] = useState<CamIcuInput>({
    feature1_inicioAgudoFluctuante: false,
    feature2_inatencion: false,
    feature3_pensamientoDesorganizado: false,
    feature4_concienciaAlterada: false,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const r = useMemo(() => evaluarCamIcu(input), [input]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await registrarCamIcu({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        input,
      });
      if (res.status === "ok") onClose();
      else setError(res.message);
    });
  }

  return (
    <DrawerShell title="CAM-ICU — Screening delirium" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Iniciales">
            <input
              type="text"
              value={iniciales}
              onChange={(e) => setIniciales(e.target.value.toUpperCase().slice(0, 8))}
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

        <div
          className={`rounded-lg border px-3 py-3 ${
            r.delirium
              ? "border-rose/40 bg-rose-soft/40"
              : "border-validation/40 bg-validation-soft/40"
          }`}
        >
          <p className="text-caption uppercase tracking-eyebrow font-semibold text-ink-soft">
            Resultado
          </p>
          <p
            className={`mt-1 text-h2 font-bold ${
              r.delirium ? "text-rose" : "text-validation"
            }`}
          >
            {r.delirium ? "POSITIVO — delirium" : "NEGATIVO"}
          </p>
          <p className="mt-1 text-caption text-ink-strong leading-relaxed">
            {r.interpretacion}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-caption font-medium text-ink-muted">
            Algoritmo CAM-ICU: delirium = (Feature 1 + 2) AND (Feature 3 OR 4)
          </p>

          <FeatureCheck
            number={1}
            title="Inicio agudo o curso fluctuante del estado mental"
            detail="Cambio agudo (en horas/días) o cambios que fluctúan en intensidad durante el día"
            checked={input.feature1_inicioAgudoFluctuante}
            onChange={(v) =>
              setInput({ ...input, feature1_inicioAgudoFluctuante: v })
            }
          />
          <FeatureCheck
            number={2}
            title="Inatención"
            detail="Test ASE (Letras/Imágenes) ≥ 3 errores en 10 estímulos"
            checked={input.feature2_inatencion}
            onChange={(v) => setInput({ ...input, feature2_inatencion: v })}
          />
          <FeatureCheck
            number={3}
            title="Pensamiento desorganizado"
            detail="≥ 2 errores en las 4 preguntas + comando (3 errores totales)"
            checked={input.feature3_pensamientoDesorganizado}
            onChange={(v) =>
              setInput({ ...input, feature3_pensamientoDesorganizado: v })
            }
          />
          <FeatureCheck
            number={4}
            title="Nivel alterado de conciencia"
            detail="RASS ≠ 0 (cualquier valor distinto de alerta y tranquilo)"
            checked={input.feature4_concienciaAlterada}
            onChange={(v) =>
              setInput({ ...input, feature4_concienciaAlterada: v })
            }
          />
        </div>

        {error && (
          <ClinicalAlert severity="critical" title="No se pudo registrar" description={error} />
        )}

        <FooterActions onCancel={onClose} onSubmit={submit} pending={pending} icon={Brain} label="Registrar CAM-ICU" />
        <p className="text-[0.6rem] text-ink-soft italic">
          Ely E.W. et al. Delirium in mechanically ventilated patients:
          validity and reliability of the Confusion Assessment Method for the
          Intensive Care Unit (CAM-ICU). JAMA 2001.
        </p>
      </div>
    </DrawerShell>
  );
}

/* ============================================================
   Shared field helpers
   ============================================================ */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption font-medium text-ink-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

function NumField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step?: string;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="lg-input"
      />
    </Field>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer rounded-lg border border-line bg-surface px-3 py-2 transition-colors hover:bg-surface-alt">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-line-strong"
      />
      <span className="text-caption text-ink-strong leading-snug">{label}</span>
    </label>
  );
}

function FeatureCheck({
  number,
  title,
  detail,
  checked,
  onChange,
}: {
  number: number;
  title: string;
  detail: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
        checked
          ? "border-validation bg-validation-soft/30"
          : "border-line bg-surface hover:border-line-strong"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold tabular-nums ${
          checked ? "bg-validation text-canvas" : "bg-surface-alt text-ink-muted"
        }`}
      >
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-semibold text-ink-strong">{title}</p>
        <p className="mt-0.5 text-caption text-ink-muted leading-snug">{detail}</p>
      </div>
      {checked && (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-validation" strokeWidth={2.4} />
      )}
    </button>
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
  icon: typeof Activity;
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

/* Avoid unused warn for icons exported but not used directly in this file */
void ClinicalMetric;
