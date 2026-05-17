"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity,
  Brain,
  Heart,
  Droplet,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  TRIAGE_NIVELES,
  URGENCIAS_TIPOS,
  type EventoModulo,
  type TriageNivel,
} from "@/lib/modulos-eventos";
import {
  iniciarTriage,
  iniciarProtocolo,
  completarProtocolo,
  cancelarProtocolo,
} from "./actions";

const easeOut: number[] = [0.16, 1, 0.3, 1];

type ProtocoloDef = {
  tipo: string;
  titulo: string;
  subtitulo: string;
  tiempoObjetivo: string;
  icon: LucideIcon;
  tone: "rose" | "warn" | "validation" | "accent";
  pasos: Array<{
    id: string;
    titulo: string;
    detalle: string;
    tiempo?: string;
  }>;
  alertas: string[];
  fuente: string;
};

const PROTOCOLOS: ProtocoloDef[] = [
  {
    tipo: URGENCIAS_TIPOS.sepsis_bundle,
    titulo: "Sepsis bundle 1-hora",
    subtitulo: "Surviving Sepsis Campaign 2021",
    tiempoObjetivo: "60 min desde sospecha",
    icon: Activity,
    tone: "rose",
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
        detalle: "No retrasar antibiótico > 45 min para obtenerlos",
        tiempo: "0-30 min",
      },
      {
        id: "antibiotico",
        titulo: "Antibiótico amplio espectro IV",
        detalle: "Carbapenem o piperacilina/tazobactam + cobertura específica",
        tiempo: "≤ 60 min",
      },
      {
        id: "cristaloides",
        titulo: "Cristaloides 30 mL/kg en 3h si hipotensión/lactato > 4",
        detalle: "Suero fisiológico o Ringer lactato",
        tiempo: "≤ 60 min",
      },
      {
        id: "vasopresores",
        titulo: "Norepinefrina si MAP < 65 post-cristaloides",
        detalle: "Iniciar 0.05-0.1 mcg/kg/min, titular hasta MAP ≥ 65",
        tiempo: "Si refractario",
      },
    ],
    alertas: [
      "Lactato > 4 mmol/L = shock séptico",
      "qSOFA ≥ 2 puntos = mortalidad alta (TA sist < 100, FR ≥ 22, alteración mental)",
      "Considerar SOFA score para criterios completos sepsis 3.0",
    ],
    fuente: "SSC International Guidelines 2021",
  },
  {
    tipo: URGENCIAS_TIPOS.codigo_stroke,
    titulo: "Código stroke",
    subtitulo: "Ventana terapéutica trombolisis IV",
    tiempoObjetivo: "60 min puerta-aguja",
    icon: Brain,
    tone: "warn",
    pasos: [
      {
        id: "nihss",
        titulo: "NIHSS al ingreso",
        detalle: "Escala 0-42. Considera trombolisis si NIHSS ≥ 4 y déficit incapacitante",
        tiempo: "0-10 min",
      },
      {
        id: "tc_simple",
        titulo: "TC craneal sin contraste",
        detalle: "Descartar hemorragia. ASPECTS si isquémico de circulación anterior",
        tiempo: "≤ 25 min",
      },
      {
        id: "labs",
        titulo: "Glucosa capilar + INR + TP/TTPa + plaquetas",
        detalle: "INR > 1.7 o TTPa > 1.5× = contraindicación relativa",
        tiempo: "≤ 30 min",
      },
      {
        id: "ventana",
        titulo: "Confirmar ventana ≤ 4.5h desde último visto bien",
        detalle: "Si ventana 4.5-24h → considerar trombectomía mecánica si LVO",
        tiempo: "≤ 35 min",
      },
      {
        id: "trombolisis",
        titulo: "Alteplasa 0.9 mg/kg IV si elegible",
        detalle: "10% bolo, 90% en 60 min. Máximo 90 mg",
        tiempo: "≤ 60 min",
      },
    ],
    alertas: [
      "Hemorragia en TC = contraindicación absoluta",
      "TA > 185/110 debe controlarse antes de trombolisis (labetalol IV)",
      "Si LVO en circulación anterior + déficit grave → trombectomía mecánica hasta 24h",
    ],
    fuente: "AHA/ASA Guidelines 2024 + ESO 2023",
  },
  {
    tipo: URGENCIAS_TIPOS.codigo_iam,
    titulo: "Código IAM (STEMI)",
    subtitulo: "Reperfusión coronaria primaria",
    tiempoObjetivo: "90 min puerta-balón",
    icon: Heart,
    tone: "rose",
    pasos: [
      {
        id: "ekg",
        titulo: "EKG 12 derivaciones",
        detalle: "ST ≥ 1 mm en 2 derivaciones contiguas (≥ 2 mm en V2-V3 en hombres)",
        tiempo: "≤ 10 min",
      },
      {
        id: "troponina",
        titulo: "Troponina alta sensibilidad",
        detalle: "Repetir a 1-3h. Curva confirma daño miocárdico",
        tiempo: "≤ 30 min",
      },
      {
        id: "antiagregacion",
        titulo: "AAS 300 mg masticada + clopidogrel 600 mg",
        detalle: "Si ICP en < 24h: considerar ticagrelor 180 mg o prasugrel 60 mg",
        tiempo: "≤ 30 min",
      },
      {
        id: "hemodinamia",
        titulo: "Activar hemodinamia → ICP primaria",
        detalle: "Si centro sin hemodinamia: fibrinolisis IV en < 30 min de llegada",
        tiempo: "≤ 90 min puerta-balón",
      },
      {
        id: "anticoagulacion",
        titulo: "Heparina no fraccionada 70-100 U/kg IV",
        detalle: "Bivalirudina opcional en pacientes con alto riesgo de sangrado",
        tiempo: "Durante ICP",
      },
    ],
    alertas: [
      "Tiempo es músculo: cada 30 min de retraso = 1% mortalidad",
      "Si fibrinolisis: rescate ICP si no hay resolución ST ≥ 50% en 60-90 min",
      "Killip III-IV → mortalidad > 30%, considerar soporte mecánico",
    ],
    fuente: "ESC STEMI Guidelines 2023",
  },
  {
    tipo: URGENCIAS_TIPOS.dka_protocolo,
    titulo: "DKA (cetoacidosis diabética)",
    subtitulo: "Protocolo ADA + manejo crítico",
    tiempoObjetivo: "Resolución 12-24h",
    icon: Droplet,
    tone: "accent",
    pasos: [
      {
        id: "criterios",
        titulo: "Confirmar criterios DKA",
        detalle: "Glucosa > 250 + cetonas + pH < 7.3 + HCO3 < 18 + anion gap > 10",
        tiempo: "0-30 min",
      },
      {
        id: "fluidos",
        titulo: "Fluidos: NaCl 0.9% 15-20 mL/kg/h primera hora",
        detalle: "Después según Na corregido. Cambiar a NaCl 0.45% si Na alto",
        tiempo: "0-60 min",
      },
      {
        id: "insulina",
        titulo: "Insulina regular 0.1 U/kg bolo + 0.1 U/kg/h infusión",
        detalle: "NO iniciar insulina hasta K ≥ 3.3 mEq/L",
        tiempo: "≤ 60 min",
      },
      {
        id: "potasio",
        titulo: "Reponer K si < 5.2 mEq/L",
        detalle: "20-30 mEq KCl/L de fluido. Pausar insulina si K < 3.3",
        tiempo: "Continuo",
      },
      {
        id: "bicarbonato",
        titulo: "Bicarbonato sólo si pH < 6.9",
        detalle: "100 mEq en 400 mL agua + 20 mEq KCl en 2h",
        tiempo: "Si severo",
      },
      {
        id: "precipitante",
        titulo: "Buscar precipitante",
        detalle: "Infección (RX tórax, EGO, hemocultivos), IAM (EKG, troponina), no adherencia",
        tiempo: "Primeras 2h",
      },
    ],
    alertas: [
      "Edema cerebral: bajar glucosa máx 50-75 mg/dL/h. Cambiar a D5/D10 cuando glucosa ≤ 200",
      "Hipoglucemia: la causa #1 de mortalidad iatrogénica en DKA",
      "Considerar HHS si glucosa > 600 y osmolaridad > 320 — manejo más conservador con fluidos",
    ],
    fuente: "ADA Standards of Care 2024",
  },
];

const TONE_CLASSES: Record<
  "rose" | "warn" | "validation" | "accent",
  { text: string; bg: string; border: string; ring: string }
> = {
  rose: {
    text: "text-rose",
    bg: "bg-rose-soft/40",
    border: "border-rose-soft",
    ring: "ring-rose/20",
  },
  warn: {
    text: "text-warn",
    bg: "bg-warn-soft/40",
    border: "border-warn-soft",
    ring: "ring-warn/20",
  },
  validation: {
    text: "text-validation",
    bg: "bg-validation-soft/40",
    border: "border-validation-soft",
    ring: "ring-validation/20",
  },
  accent: {
    text: "text-accent",
    bg: "bg-accent-soft/40",
    border: "border-accent-soft",
    ring: "ring-accent/20",
  },
};

export function UrgenciasCliente({ eventos }: { eventos: EventoModulo[] }) {
  const eventosActivos = eventos.filter((e) => e.status === "activo");
  const eventosCompletados = eventos.filter((e) => e.status === "completado");

  return (
    <div className="space-y-8">
      <TriageSection />

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              Protocolos críticos
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              Activa el protocolo. Los pasos quedan registrados con timestamp.
            </p>
          </div>
          {eventosActivos.length > 0 && (
            <span className="rounded-full bg-rose-soft px-3 py-1 text-caption font-semibold text-rose">
              {eventosActivos.length}{" "}
              {eventosActivos.length === 1 ? "activo" : "activos"}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {PROTOCOLOS.map((p) => (
            <ProtocoloCard
              key={p.tipo}
              protocolo={p}
              activos={eventosActivos.filter((e) => e.tipo === p.tipo)}
            />
          ))}
        </div>
      </section>

      {eventosCompletados.length > 0 && (
        <section>
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            Últimas 24 horas
          </h2>
          <div className="mt-3 space-y-2">
            {eventosCompletados.slice(0, 8).map((e) => (
              <EventoCompletadoRow key={e.id} evento={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TriageSection() {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState<"M" | "F" | "X">("M");
  const [motivo, setMotivo] = useState("");
  const [nivel, setNivel] = useState<TriageNivel>("amarillo");
  const [tas, setTas] = useState("");
  const [tad, setTad] = useState("");
  const [fc, setFc] = useState("");
  const [fr, setFr] = useState("");
  const [sato2, setSato2] = useState("");
  const [temp, setTemp] = useState("");
  const [glasgow, setGlasgow] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function reset() {
    setIniciales("");
    setEdad("");
    setSexo("M");
    setMotivo("");
    setNivel("amarillo");
    setTas("");
    setTad("");
    setFc("");
    setFr("");
    setSato2("");
    setTemp("");
    setGlasgow("");
  }

  function onSubmit() {
    setError(null);
    setOk(false);
    if (motivo.trim().length < 2) {
      setError("Captura el motivo de consulta.");
      return;
    }
    const sv: Record<string, number> = {};
    if (tas) sv.tas = Number(tas);
    if (tad) sv.tad = Number(tad);
    if (fc) sv.fc = Number(fc);
    if (fr) sv.fr = Number(fr);
    if (sato2) sv.sato2 = Number(sato2);
    if (temp) sv.temp = Number(temp);
    if (glasgow) sv.glasgow = Number(glasgow);

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
        setOk(true);
        reset();
        setTimeout(() => setOk(false), 3000);
      } else {
        setError(r.message);
      }
    });
  }

  return (
    <section className="lg-card space-y-4">
      <div>
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Triage Manchester
        </h2>
        <p className="mt-1 text-caption text-ink-muted">
          Asignación de prioridad &lt; 5 min. Los signos vitales son opcionales
          pero recomendados.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Iniciales (opcional)">
          <input
            type="text"
            value={iniciales}
            onChange={(e) => setIniciales(e.target.value.toUpperCase().slice(0, 8))}
            placeholder="J.M."
            className="lg-input"
            maxLength={8}
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

      <Field label="Motivo de consulta">
        <input
          type="text"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value.slice(0, 300))}
          placeholder="Ej. Dolor torácico irradiado a brazo izquierdo, 30 min de evolución"
          className="lg-input"
        />
      </Field>

      <div>
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
          Signos vitales (opcional)
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
          <NumInput label="TAS" value={tas} onChange={setTas} suffix="mmHg" />
          <NumInput label="TAD" value={tad} onChange={setTad} suffix="mmHg" />
          <NumInput label="FC" value={fc} onChange={setFc} suffix="lpm" />
          <NumInput label="FR" value={fr} onChange={setFr} suffix="rpm" />
          <NumInput label="SatO₂" value={sato2} onChange={setSato2} suffix="%" />
          <NumInput
            label="Temp"
            value={temp}
            onChange={setTemp}
            suffix="°C"
            step="0.1"
          />
          <NumInput label="Glasgow" value={glasgow} onChange={setGlasgow} />
        </div>
      </div>

      <div>
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
          Nivel de prioridad
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-5">
          {(Object.keys(TRIAGE_NIVELES) as TriageNivel[]).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNivel(n)}
              className={`rounded-lg border px-3 py-2 text-left transition-all ${
                nivel === n
                  ? "border-ink-strong bg-surface ring-2 ring-ink-strong/10"
                  : "border-line bg-surface hover:border-line-strong"
              }`}
            >
              <p className={`text-caption font-semibold ${TRIAGE_NIVELES[n].color}`}>
                {TRIAGE_NIVELES[n].label.split(" — ")[0]}
              </p>
              <p className="text-caption text-ink-muted">
                ≤ {TRIAGE_NIVELES[n].tiempoMax}
              </p>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft/40 p-3"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose" strokeWidth={2} />
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
            <p className="text-caption text-ink-strong">Triage registrado.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending}
          className="lg-cta-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
              Registrando…
            </>
          ) : (
            <>Registrar triage</>
          )}
        </button>
      </div>
    </section>
  );
}

function ProtocoloCard({
  protocolo,
  activos,
}: {
  protocolo: ProtocoloDef;
  activos: EventoModulo[];
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = protocolo.icon;
  const tone = TONE_CLASSES[protocolo.tone];
  const enCurso = activos.length;

  return (
    <div
      className={`rounded-xl border ${tone.border} bg-surface overflow-hidden`}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 hover:bg-surface-alt/40 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`rounded-lg ${tone.bg} p-2 ${tone.text}`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className={`text-body-sm font-semibold ${tone.text}`}>
              {protocolo.titulo}
            </p>
            <p className="text-caption text-ink-muted">
              {protocolo.subtitulo} · {protocolo.tiempoObjetivo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {enCurso > 0 && (
            <span className="rounded-full bg-rose px-2 py-0.5 text-caption font-bold text-canvas">
              {enCurso}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-ink-muted" strokeWidth={2.2} />
          ) : (
            <ChevronDown className="h-4 w-4 text-ink-muted" strokeWidth={2.2} />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-5 py-4 space-y-4">
              <ProtocoloPasos protocolo={protocolo} />
              {activos.length > 0 && (
                <ActivosLista protocolo={protocolo} activos={activos} />
              )}
              <ProtocoloIniciar protocolo={protocolo} />
              <div className="rounded-lg bg-surface-alt/40 p-3 space-y-2">
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                  Alertas críticas
                </p>
                <ul className="space-y-1">
                  {protocolo.alertas.map((a, i) => (
                    <li
                      key={i}
                      className="text-caption text-ink-muted leading-relaxed"
                    >
                      • {a}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-caption text-ink-soft">
                Fuente: {protocolo.fuente}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProtocoloPasos({ protocolo }: { protocolo: ProtocoloDef }) {
  return (
    <div>
      <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
        Pasos secuenciales
      </p>
      <ol className="mt-2 space-y-2">
        {protocolo.pasos.map((p, i) => (
          <li
            key={p.id}
            className="flex gap-3 rounded-lg border border-line bg-surface p-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-alt text-caption font-bold text-ink-muted">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="text-body-sm font-semibold text-ink-strong">
                  {p.titulo}
                </p>
                {p.tiempo && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2 py-0.5 text-caption text-ink-muted">
                    <Clock className="h-3 w-3" strokeWidth={2.2} />
                    {p.tiempo}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-caption text-ink-muted leading-relaxed">
                {p.detalle}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ActivosLista({
  protocolo,
  activos,
}: {
  protocolo: ProtocoloDef;
  activos: EventoModulo[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-caption uppercase tracking-eyebrow text-rose font-semibold">
        Activos ahora
      </p>
      {activos.map((e) => (
        <ActivoRow key={e.id} evento={e} protocolo={protocolo} />
      ))}
    </div>
  );
}

function ActivoRow({
  evento,
  protocolo,
}: {
  evento: EventoModulo;
  protocolo: ProtocoloDef;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const datos = evento.datos as {
    paciente_iniciales?: string | null;
    paciente_edad?: number | null;
  };
  const iniciado = new Date(evento.created_at);
  const transcurrido = Math.round((Date.now() - iniciado.getTime()) / 60000);

  function toggle(id: string) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }

  function completar() {
    const pasosCompletados = Object.entries(checked)
      .filter(([, v]) => v)
      .map(([k]) => k);
    startTransition(async () => {
      await completarProtocolo({
        eventoId: evento.id,
        pasosCompletados,
        metricas: {
          minutos_transcurridos: transcurrido,
          pasos_completados: pasosCompletados.length,
          pasos_totales: protocolo.pasos.length,
        },
      });
    });
  }

  function cancelar() {
    startTransition(async () => {
      await cancelarProtocolo(evento.id);
    });
  }

  return (
    <div className="rounded-lg border-2 border-rose bg-canvas p-3 space-y-3">
      <div className="flex items-center justify-between gap-2 text-caption">
        <span className="font-semibold text-ink-strong">
          {datos.paciente_iniciales ?? "Paciente"}
          {datos.paciente_edad ? `, ${datos.paciente_edad}a` : ""}
        </span>
        <span className="text-ink-muted">
          Iniciado hace {transcurrido} min
        </span>
      </div>
      <ul className="space-y-1">
        {protocolo.pasos.map((p) => (
          <li key={p.id}>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(checked[p.id])}
                onChange={() => toggle(p.id)}
                className="mt-0.5 h-4 w-4 rounded border-line-strong"
              />
              <span
                className={`text-caption ${
                  checked[p.id]
                    ? "line-through text-ink-quiet"
                    : "text-ink-strong"
                }`}
              >
                {p.titulo}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={cancelar}
          disabled={pending}
          className="lg-cta-ghost text-caption"
        >
          Cancelar
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

function ProtocoloIniciar({ protocolo }: { protocolo: ProtocoloDef }) {
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onActivar() {
    setError(null);
    startTransition(async () => {
      const r = await iniciarProtocolo({
        tipo: protocolo.tipo as
          | "sepsis_bundle"
          | "codigo_stroke"
          | "codigo_iam"
          | "dka_protocolo"
          | "triage",
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
      });
      if (r.status === "ok") {
        setIniciales("");
        setEdad("");
      } else {
        setError(r.message);
      }
    });
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-line p-3 space-y-2">
      <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
        Activar protocolo para nuevo paciente
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Iniciales" small>
          <input
            type="text"
            value={iniciales}
            onChange={(e) => setIniciales(e.target.value.toUpperCase().slice(0, 8))}
            placeholder="J.M."
            className="lg-input text-caption"
            maxLength={8}
          />
        </Field>
        <Field label="Edad" small>
          <input
            type="number"
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            min={0}
            max={120}
            className="lg-input text-caption w-20"
          />
        </Field>
        <button
          type="button"
          onClick={onActivar}
          disabled={pending}
          className="lg-cta-primary inline-flex items-center gap-2 text-caption disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
          ) : null}
          Activar
        </button>
      </div>
      {error && <p className="text-caption text-rose">{error}</p>}
    </div>
  );
}

function EventoCompletadoRow({ evento }: { evento: EventoModulo }) {
  const tipoLabel = labelDeTipo(evento.tipo);
  const datos = evento.datos as {
    paciente_iniciales?: string | null;
    paciente_edad?: number | null;
    nivel?: TriageNivel;
  };
  const metricas = evento.metricas as { minutos_transcurridos?: number };
  const fecha = new Date(evento.completed_at ?? evento.created_at);
  const isCancelado = evento.status === "cancelado";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border ${isCancelado ? "border-line bg-surface-alt/40" : "border-line bg-surface"} px-4 py-2.5`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {isCancelado ? (
          <AlertCircle
            className="h-4 w-4 shrink-0 text-ink-quiet"
            strokeWidth={2}
          />
        ) : (
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-validation"
            strokeWidth={2.2}
          />
        )}
        <div className="min-w-0">
          <p className="text-caption font-semibold text-ink-strong">
            {tipoLabel}
            {datos.nivel && ` — ${datos.nivel}`}
            {datos.paciente_iniciales && ` · ${datos.paciente_iniciales}`}
          </p>
          <p className="text-caption text-ink-muted">
            {fecha.toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {metricas.minutos_transcurridos != null &&
              ` · ${metricas.minutos_transcurridos} min`}
          </p>
        </div>
      </div>
    </div>
  );
}

function labelDeTipo(tipo: string): string {
  switch (tipo) {
    case URGENCIAS_TIPOS.triage:
      return "Triage";
    case URGENCIAS_TIPOS.sepsis_bundle:
      return "Sepsis bundle";
    case URGENCIAS_TIPOS.codigo_stroke:
      return "Código stroke";
    case URGENCIAS_TIPOS.codigo_iam:
      return "Código IAM";
    case URGENCIAS_TIPOS.dka_protocolo:
      return "DKA";
    default:
      return tipo;
  }
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

function NumInput({
  label,
  value,
  onChange,
  suffix,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="block text-caption font-medium text-ink-muted mb-1">
        {label}
      </span>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          step={step}
          className="lg-input pr-8 w-full"
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-caption text-ink-quiet">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}
