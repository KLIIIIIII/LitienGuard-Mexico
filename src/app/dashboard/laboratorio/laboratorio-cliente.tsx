"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Clock,
  FlaskConical,
  ChevronRight,
} from "lucide-react";
import type { EventoModulo } from "@/lib/modulos-eventos";
import { crearPeticionLab, marcarRecibido } from "./actions";

type EstudioCatalogo = {
  id: string;
  nombre: string;
  descripcion: string;
  disponibilidadIMSS: "rutina" | "limitada" | "tercer-nivel" | "privado-solo";
  costoPrivadoMxn: { min: number; max: number } | null;
  tiempoResultado: string;
};

const DISPONIBILIDAD_LABEL: Record<
  EstudioCatalogo["disponibilidadIMSS"],
  { label: string; tone: string }
> = {
  rutina: { label: "IMSS rutina", tone: "text-validation" },
  limitada: { label: "IMSS limitada", tone: "text-warn" },
  "tercer-nivel": { label: "3er nivel", tone: "text-accent" },
  "privado-solo": { label: "Solo privado", tone: "text-ink-muted" },
};

export function LaboratorioCliente({
  estudios,
  eventos,
}: {
  estudios: EstudioCatalogo[];
  eventos: EventoModulo[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [iniciales, setIniciales] = useState("");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState<"M" | "F" | "X">("M");
  const [indicacion, setIndicacion] = useState("");
  const [urgencia, setUrgencia] = useState<"rutina" | "urgente" | "stat">(
    "rutina",
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return estudios.slice(0, 16);
    return estudios.filter(
      (e) =>
        e.nombre.toLowerCase().includes(q) ||
        e.descripcion.toLowerCase().includes(q),
    );
  }, [estudios, busqueda]);

  function toggle(id: string) {
    setSeleccionados((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null);
    setOk(false);
    if (seleccionados.size === 0) {
      setError("Selecciona al menos un estudio.");
      return;
    }
    if (indicacion.trim().length < 2) {
      setError("Captura la indicación clínica.");
      return;
    }

    startTransition(async () => {
      const r = await crearPeticionLab({
        pacienteIniciales: iniciales || undefined,
        pacienteEdad: edad ? Number(edad) : undefined,
        pacienteSexo: sexo,
        estudiosIds: Array.from(seleccionados),
        indicacionClinica: indicacion.trim(),
        urgencia,
      });
      if (r.status === "ok") {
        setOk(true);
        setSeleccionados(new Set());
        setIndicacion("");
        setTimeout(() => setOk(false), 3000);
      } else {
        setError(r.message);
      }
    });
  }

  const pendientes = eventos.filter((e) => e.status === "activo");
  const completadas = eventos.filter((e) => e.status === "completado");

  return (
    <div className="space-y-6">
      <section className="lg-card space-y-4">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Nueva petición
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">
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
            placeholder="Ej. Sospecha sepsis abdominal, foco a precisar"
            className="lg-input min-h-[72px] resize-y"
          />
        </Field>

        <Field label="Urgencia">
          <div className="grid grid-cols-3 gap-2">
            {(["rutina", "urgente", "stat"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUrgencia(u)}
                className={`rounded-lg border px-3 py-2 text-center transition-all ${
                  urgencia === u
                    ? "border-ink-strong bg-surface ring-2 ring-ink-strong/10"
                    : "border-line bg-surface hover:border-line-strong"
                }`}
              >
                <p
                  className={`text-caption font-semibold ${
                    u === "stat"
                      ? "text-rose"
                      : u === "urgente"
                        ? "text-warn"
                        : "text-validation"
                  }`}
                >
                  {u === "stat"
                    ? "STAT"
                    : u === "urgente"
                      ? "Urgente"
                      : "Rutina"}
                </p>
                <p className="text-caption text-ink-muted">
                  {u === "stat"
                    ? "< 1h"
                    : u === "urgente"
                      ? "< 4h"
                      : "24-48h"}
                </p>
              </button>
            ))}
          </div>
        </Field>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
              Estudios ({seleccionados.size} seleccionados)
            </p>
            <div className="relative w-60">
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
          <div className="mt-2 grid gap-2 sm:grid-cols-2 max-h-80 overflow-y-auto">
            {filtrados.map((e) => {
              const sel = seleccionados.has(e.id);
              const disp = DISPONIBILIDAD_LABEL[e.disponibilidadIMSS];
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => toggle(e.id)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    sel
                      ? "border-validation bg-validation-soft/30"
                      : "border-line bg-surface hover:border-line-strong"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-caption font-semibold ${
                        sel ? "text-validation" : "text-ink-strong"
                      }`}
                    >
                      {e.nombre}
                    </p>
                    {sel && (
                      <CheckCircle2
                        className="h-3.5 w-3.5 shrink-0 text-validation"
                        strokeWidth={2.4}
                      />
                    )}
                  </div>
                  <p className="mt-0.5 text-caption text-ink-muted line-clamp-2">
                    {e.descripcion}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-caption">
                    <span className={`${disp.tone} font-semibold`}>
                      {disp.label}
                    </span>
                    {e.costoPrivadoMxn && (
                      <span className="text-ink-quiet">
                        · ${e.costoPrivadoMxn.min.toLocaleString("es-MX")}–$
                        {e.costoPrivadoMxn.max.toLocaleString("es-MX")}
                      </span>
                    )}
                    <span className="text-ink-quiet">
                      · {e.tiempoResultado}
                    </span>
                  </div>
                </button>
              );
            })}
            {filtrados.length === 0 && (
              <p className="col-span-full text-center text-caption text-ink-muted py-6">
                Sin resultados.
              </p>
            )}
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
              <p className="text-caption text-ink-strong">Petición creada.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={submit}
            disabled={pending || seleccionados.size === 0}
            className="lg-cta-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />
            ) : (
              <Send className="h-4 w-4" strokeWidth={2.2} />
            )}
            Crear petición ({seleccionados.size})
          </button>
        </div>
      </section>

      {pendientes.length > 0 && (
        <section>
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            Pendientes ({pendientes.length})
          </h2>
          <div className="mt-3 space-y-2">
            {pendientes.map((e) => (
              <PeticionRow key={e.id} evento={e} activa />
            ))}
          </div>
        </section>
      )}

      {completadas.length > 0 && (
        <section>
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            Recientes
          </h2>
          <div className="mt-3 space-y-2">
            {completadas.slice(0, 8).map((e) => (
              <PeticionRow key={e.id} evento={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PeticionRow({
  evento,
  activa,
}: {
  evento: EventoModulo;
  activa?: boolean;
}) {
  const [showResult, setShowResult] = useState(false);
  const [resultText, setResultText] = useState("");
  const [pending, startTransition] = useTransition();
  const datos = evento.datos as {
    paciente_iniciales?: string | null;
    paciente_edad?: number | null;
    estudios?: Array<{ nombre: string }>;
    urgencia?: string;
    indicacion_clinica?: string;
    resultados_texto?: string;
  };
  const fecha = new Date(evento.created_at);
  const nEstudios = datos.estudios?.length ?? 0;
  const urgencia = datos.urgencia;

  function guardar() {
    if (resultText.trim().length < 2) return;
    startTransition(async () => {
      await marcarRecibido(evento.id, resultText.trim());
      setShowResult(false);
    });
  }

  return (
    <div
      className={`rounded-lg border ${activa ? "border-warn-soft bg-warn-soft/20" : "border-line bg-surface"} p-3 space-y-2`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          {activa ? (
            <Clock
              className="mt-0.5 h-4 w-4 shrink-0 text-warn"
              strokeWidth={2.2}
            />
          ) : (
            <FlaskConical
              className="mt-0.5 h-4 w-4 shrink-0 text-validation"
              strokeWidth={2}
            />
          )}
          <div className="min-w-0">
            <p className="text-caption font-semibold text-ink-strong">
              {nEstudios}{" "}
              {nEstudios === 1 ? "estudio" : "estudios"}
              {datos.paciente_iniciales && ` · ${datos.paciente_iniciales}`}
              {urgencia &&
                ` · ${urgencia === "stat" ? "STAT" : urgencia === "urgente" ? "Urgente" : "Rutina"}`}
            </p>
            {datos.indicacion_clinica && (
              <p className="mt-0.5 text-caption text-ink-muted line-clamp-1">
                {datos.indicacion_clinica}
              </p>
            )}
            <p className="mt-0.5 text-caption text-ink-quiet">
              {fecha.toLocaleString("es-MX", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        {activa && (
          <button
            type="button"
            onClick={() => setShowResult((v) => !v)}
            className="text-caption font-semibold text-validation hover:underline shrink-0"
          >
            Marcar recibido <ChevronRight className="inline h-3 w-3" />
          </button>
        )}
      </div>
      {datos.estudios && datos.estudios.length > 0 && (
        <p className="text-caption text-ink-muted line-clamp-2">
          {datos.estudios.map((e) => e.nombre).join(" · ")}
        </p>
      )}
      {datos.resultados_texto && (
        <div className="rounded border border-line bg-canvas p-2">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
            Resultados
          </p>
          <p className="mt-0.5 text-caption text-ink-strong whitespace-pre-wrap">
            {datos.resultados_texto}
          </p>
        </div>
      )}
      {activa && showResult && (
        <div className="space-y-2">
          <textarea
            value={resultText}
            onChange={(e) => setResultText(e.target.value.slice(0, 2000))}
            placeholder="Pega los resultados aquí…"
            className="lg-input min-h-[80px] resize-y w-full"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowResult(false)}
              className="lg-cta-ghost text-caption"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={pending}
              className="lg-cta-primary inline-flex items-center gap-2 text-caption disabled:opacity-50"
            >
              {pending && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
              )}
              Guardar
            </button>
          </div>
        </div>
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
