"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardCheck,
  Heart,
  CheckCircle2,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import {
  ClinicalAlert,
  StatusBadge,
} from "@/components/clinical";
import type { EventoModulo } from "@/lib/modulos-eventos";
import {
  evaluarWhoChecklist,
  calcularRcri,
  type WhoSignInInput,
  type WhoTimeOutInput,
  type WhoSignOutInput,
  type RcriInput,
} from "@/lib/scores-quirofano";
import { registrarWhoChecklist, registrarRcri } from "./actions";

const EASE = [0.22, 1, 0.36, 1] as const;

type Drawer = "none" | "who" | "rcri";

export function QuirofanoBundles({ eventos }: { eventos: EventoModulo[] }) {
  const [drawer, setDrawer] = useState<Drawer>("none");

  const stats = useMemo(() => {
    const whos = eventos.filter((e) => e.tipo === "who_checklist");
    const rcris = eventos.filter((e) => e.tipo === "rcri");

    const whoCompliance =
      whos.length > 0
        ? Math.round(
            whos.reduce((s, e) => {
              const m = (e.metricas ?? {}) as { who_compliance?: number };
              return s + (m.who_compliance ?? 0);
            }, 0) / whos.length,
          )
        : null;

    const rcriHigh = rcris.filter((e) => {
      const m = (e.metricas ?? {}) as { rcri_total?: number };
      return (m.rcri_total ?? 0) >= 2;
    }).length;

    return {
      whoCount: whos.length,
      whoCompliance,
      rcriCount: rcris.length,
      rcriHigh,
    };
  }, [eventos]);

  return (
    <>
      <section>
        <div className="mb-3">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
            Seguridad quirúrgica
          </p>
          <p className="text-body-sm text-ink-muted">
            Checklists y scores perioperatorios
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <BundleCard
            icon={ClipboardCheck}
            tone="validation"
            titulo="WHO Surgical Safety Checklist"
            subtitulo="3 pausas: Sign-In · Time-Out · Sign-Out"
            cita="Motor LitienGuard · Surgical Safety Suite"
            count={stats.whoCount}
            countLabel="cirugías"
            primaryMetric={
              stats.whoCompliance !== null ? `${stats.whoCompliance}%` : "—"
            }
            primaryMetricLabel="Compliance promedio"
            onAdd={() => setDrawer("who")}
          />
          <BundleCard
            icon={Heart}
            tone="rose"
            titulo="RCRI"
            subtitulo="Riesgo CV cirugía no cardíaca"
            cita="Motor LitienGuard · Perioperative Risk"
            count={stats.rcriCount}
            countLabel="evaluaciones"
            primaryMetric={
              stats.rcriCount > 0 ? `${stats.rcriHigh} alto` : "—"
            }
            primaryMetricLabel="Riesgo intermedio/alto (≥2 pts)"
            onAdd={() => setDrawer("rcri")}
          />
        </div>

        <p className="mt-3 text-[0.65rem] text-ink-soft leading-relaxed">
          Motor LitienGuard · Surgical Safety Suite — checklists y
          scoring perioperatorio validados en estudios multicéntricos
          internacionales (reducción mortalidad y complicaciones reportada).
        </p>
      </section>

      <AnimatePresence>
        {drawer === "who" && <WhoChecklistDrawer onClose={() => setDrawer("none")} />}
        {drawer === "rcri" && <RcriDrawer onClose={() => setDrawer("none")} />}
      </AnimatePresence>
    </>
  );
}

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
  icon: typeof ClipboardCheck;
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
   WHO Checklist Drawer — 3 pausas
   ============================================================ */

function WhoChecklistDrawer({ onClose }: { onClose: () => void }) {
  const [pacienteIniciales, setPacienteIniciales] = useState("");
  const [procedimiento, setProcedimiento] = useState("");
  const [section, setSection] = useState<"in" | "out" | "fin">("in");

  const [signIn, setSignIn] = useState<WhoSignInInput>({
    identificacionConfirmada: false,
    sitioMarcado: false,
    consentimientoFirmado: false,
    verificacionAnestesia: false,
    pulsioximetro: false,
    alergiasEvaluadas: false,
    viaAereaEvaluada: false,
    riesgoSangradoEvaluado: false,
  });
  const [timeOut, setTimeOut] = useState<WhoTimeOutInput>({
    presentacionEquipo: false,
    confirmacionTresVias: false,
    eventosCirujanoAnticipados: false,
    preocupacionesAnestesia: false,
    enfermeriaConfirmoEsterilidad: false,
    profilaxisAntibiotica: false,
    imagenologiaDisponible: false,
  });
  const [signOut, setSignOut] = useState<WhoSignOutInput>({
    procedimientoRegistrado: false,
    conteoCorrecto: false,
    etiquetadoMuestras: false,
    problemasEquipo: false,
    comunicacionPostop: false,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const resultado = useMemo(
    () => evaluarWhoChecklist(signIn, timeOut, signOut),
    [signIn, timeOut, signOut],
  );

  function submit() {
    setError(null);
    if (procedimiento.trim().length < 2) {
      setError("Captura el procedimiento.");
      return;
    }
    startTransition(async () => {
      const res = await registrarWhoChecklist({
        pacienteIniciales: pacienteIniciales || undefined,
        procedimiento: procedimiento.trim(),
        signIn,
        timeOut,
        signOut,
      });
      if (res.status === "ok") onClose();
      else setError(res.message);
    });
  }

  return (
    <DrawerShell title="WHO Surgical Safety Checklist" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Paciente">
            <input
              type="text"
              value={pacienteIniciales}
              onChange={(e) => setPacienteIniciales(e.target.value.toUpperCase().slice(0, 8))}
              maxLength={8}
              placeholder="J.M."
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

        <div className="rounded-lg border border-line bg-surface-alt/40 px-3 py-2 flex items-center justify-between">
          <div>
            <p className="text-caption uppercase tracking-eyebrow font-semibold text-ink-soft">
              Compliance global
            </p>
            <p
              className={`text-h2 font-bold tabular-nums ${
                resultado.bundleCompleto
                  ? "text-validation"
                  : resultado.compliance >= 80
                    ? "text-warn"
                    : "text-rose"
              }`}
            >
              {resultado.totalCompletados} / {resultado.totalPosible}
            </p>
          </div>
          <StatusBadge
            tone={
              resultado.bundleCompleto
                ? "success"
                : resultado.compliance >= 80
                  ? "warning"
                  : "critical"
            }
            size="md"
          >
            {resultado.compliance}%
          </StatusBadge>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line">
          <TabButton active={section === "in"} onClick={() => setSection("in")}>
            1. Sign-In
            <span className="ml-1.5 text-[0.65rem] text-ink-muted">
              ({Object.values(signIn).filter(Boolean).length}/8)
            </span>
          </TabButton>
          <TabButton active={section === "out"} onClick={() => setSection("out")}>
            2. Time-Out
            <span className="ml-1.5 text-[0.65rem] text-ink-muted">
              ({Object.values(timeOut).filter(Boolean).length}/7)
            </span>
          </TabButton>
          <TabButton active={section === "fin"} onClick={() => setSection("fin")}>
            3. Sign-Out
            <span className="ml-1.5 text-[0.65rem] text-ink-muted">
              ({Object.values(signOut).filter(Boolean).length}/5)
            </span>
          </TabButton>
        </div>

        {/* Sign-In */}
        {section === "in" && (
          <div className="space-y-1.5">
            <p className="text-caption text-ink-muted italic mb-1">
              Antes de la inducción anestésica
            </p>
            {(Object.entries({
              identificacionConfirmada: "Identificación paciente confirmada (≥2 identificadores)",
              sitioMarcado: "Sitio quirúrgico marcado (o N/A)",
              consentimientoFirmado: "Consentimiento informado firmado",
              verificacionAnestesia: "Verificación máquina anestesia + medicamentos",
              pulsioximetro: "Pulsioxímetro colocado y funcional",
              alergiasEvaluadas: "Alergias conocidas evaluadas",
              viaAereaEvaluada: "Riesgo vía aérea difícil / aspiración evaluado",
              riesgoSangradoEvaluado: "Riesgo sangrado evaluado, accesos adecuados",
            }) as Array<[keyof WhoSignInInput, string]>).map(([key, label]) => (
              <CheckField
                key={key}
                label={label}
                checked={signIn[key]}
                onChange={(v) => setSignIn({ ...signIn, [key]: v })}
              />
            ))}
          </div>
        )}

        {/* Time-Out */}
        {section === "out" && (
          <div className="space-y-1.5">
            <p className="text-caption text-ink-muted italic mb-1">
              Antes de la incisión
            </p>
            {(Object.entries({
              presentacionEquipo: "Equipo se presentó por nombre y rol",
              confirmacionTresVias: "Confirmación 3 vías paciente / sitio / procedimiento",
              eventosCirujanoAnticipados: "Cirujano anticipó eventos críticos (pasos, duración, sangrado)",
              preocupacionesAnestesia: "Anestesia revisó preocupaciones específicas",
              enfermeriaConfirmoEsterilidad: "Enfermería confirmó esterilidad indicadores + equipo",
              profilaxisAntibiotica: "Profilaxis antibiótica administrada ≤ 60 min (o N/A)",
              imagenologiaDisponible: "Imagenología esencial mostrada (o N/A)",
            }) as Array<[keyof WhoTimeOutInput, string]>).map(([key, label]) => (
              <CheckField
                key={key}
                label={label}
                checked={timeOut[key]}
                onChange={(v) => setTimeOut({ ...timeOut, [key]: v })}
              />
            ))}
          </div>
        )}

        {/* Sign-Out */}
        {section === "fin" && (
          <div className="space-y-1.5">
            <p className="text-caption text-ink-muted italic mb-1">
              Antes de salir del quirófano
            </p>
            {(Object.entries({
              procedimientoRegistrado: "Nombre del procedimiento registrado",
              conteoCorrecto: "Conteo gasas / instrumentos / agujas correcto (o N/A)",
              etiquetadoMuestras: "Etiquetado de muestras correcto",
              problemasEquipo: "Problemas con equipo identificados y reportados",
              comunicacionPostop: "Manejo postoperatorio comunicado al equipo recuperación",
            }) as Array<[keyof WhoSignOutInput, string]>).map(([key, label]) => (
              <CheckField
                key={key}
                label={label}
                checked={signOut[key]}
                onChange={(v) => setSignOut({ ...signOut, [key]: v })}
              />
            ))}
          </div>
        )}

        {error && (
          <ClinicalAlert severity="critical" title="No se pudo registrar" description={error} />
        )}

        <FooterActions
          onCancel={onClose}
          onSubmit={submit}
          pending={pending}
          icon={ClipboardCheck}
          label="Registrar WHO Checklist"
        />
        <p className="text-[0.6rem] text-ink-soft italic">
          Motor LitienGuard · Surgical Safety Suite
        </p>
      </div>
    </DrawerShell>
  );
}

/* ============================================================
   RCRI Drawer
   ============================================================ */

function RcriDrawer({ onClose }: { onClose: () => void }) {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [input, setInput] = useState<RcriInput>({
    cirugiaAltoRiesgo: false,
    cardiopatiaIsquemica: false,
    insuficienciaCardiaca: false,
    evcTia: false,
    diabetesInsulina: false,
    creatininaAlta: false,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const r = useMemo(() => calcularRcri(input), [input]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await registrarRcri({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        input,
      });
      if (res.status === "ok") onClose();
      else setError(res.message);
    });
  }

  const tone =
    r.clase === "IV"
      ? "text-rose"
      : r.clase === "III"
        ? "text-rose"
        : r.clase === "II"
          ? "text-warn"
          : "text-validation";

  return (
    <DrawerShell title="RCRI — Revised Cardiac Risk Index" onClose={onClose}>
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

        <div className="rounded-lg border border-line bg-surface-alt/40 px-3 py-2">
          <p className="text-caption uppercase tracking-eyebrow font-semibold text-ink-soft">
            Resultado RCRI
          </p>
          <p className={`mt-1 text-h2 font-bold tabular-nums ${tone}`}>
            {r.total} pts · Clase {r.clase}
          </p>
          <p className={`text-caption font-semibold ${tone}`}>
            Riesgo evento mayor: {r.riesgoEventoMayor}
          </p>
          <p className="mt-1 text-caption text-ink-strong leading-relaxed">
            {r.recomendacion}
          </p>
        </div>

        <div className="space-y-1.5">
          <CheckField
            label="Cirugía de alto riesgo (intraperitoneal, intratorácica, vascular suprainguinal)"
            checked={input.cirugiaAltoRiesgo}
            onChange={(v) => setInput({ ...input, cirugiaAltoRiesgo: v })}
          />
          <CheckField
            label="Cardiopatía isquémica conocida"
            checked={input.cardiopatiaIsquemica}
            onChange={(v) => setInput({ ...input, cardiopatiaIsquemica: v })}
          />
          <CheckField
            label="Insuficiencia cardíaca congestiva"
            checked={input.insuficienciaCardiaca}
            onChange={(v) => setInput({ ...input, insuficienciaCardiaca: v })}
          />
          <CheckField
            label="Enfermedad cerebrovascular (EVC o TIA)"
            checked={input.evcTia}
            onChange={(v) => setInput({ ...input, evcTia: v })}
          />
          <CheckField
            label="Diabetes con tratamiento insulínico"
            checked={input.diabetesInsulina}
            onChange={(v) => setInput({ ...input, diabetesInsulina: v })}
          />
          <CheckField
            label="Creatinina sérica preoperatoria > 2.0 mg/dL"
            checked={input.creatininaAlta}
            onChange={(v) => setInput({ ...input, creatininaAlta: v })}
          />
        </div>

        {error && (
          <ClinicalAlert severity="critical" title="No se pudo registrar" description={error} />
        )}

        <FooterActions
          onCancel={onClose}
          onSubmit={submit}
          pending={pending}
          icon={Heart}
          label="Registrar RCRI"
        />
        <p className="text-[0.6rem] text-ink-soft italic">
          Motor LitienGuard · Perioperative Risk
        </p>
      </div>
    </DrawerShell>
  );
}

/* ============================================================
   Shared helpers
   ============================================================ */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-caption font-medium text-ink-muted mb-1">{label}</span>
      {children}
    </label>
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
      {checked && (
        <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-validation" strokeWidth={2.4} />
      )}
    </label>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 -mb-px border-b-2 text-caption font-semibold transition-colors ${
        active
          ? "border-accent text-accent"
          : "border-transparent text-ink-muted hover:text-ink-strong"
      }`}
    >
      {children}
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
  icon: typeof ClipboardCheck;
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
