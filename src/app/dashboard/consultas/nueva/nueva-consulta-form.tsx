"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Loader2,
  UserCheck,
  UserPlus,
  Search,
} from "lucide-react";
import { createConsulta } from "../actions";

interface PacienteOption {
  id: string;
  nombre: string | null;
  apellido_paterno: string | null;
  apellido_materno: string | null;
  fecha_nacimiento: string | null;
  sexo: string | null;
}

const TIPOS = [
  {
    value: "primera_vez",
    label: "Primera vez",
    hint: "Nunca había atendido a este paciente",
  },
  {
    value: "subsecuente",
    label: "Subsecuente",
    hint: "Seguimiento de un problema ya conocido",
  },
  {
    value: "urgencia",
    label: "Urgencia",
    hint: "Atención inmediata, no agendada",
  },
  {
    value: "revision",
    label: "Revisión",
    hint: "Control preventivo o check-up",
  },
] as const;

export function NuevaConsultaForm({
  pacientes,
  presetPacienteId,
  presetCitaId,
  presetMotivo,
}: {
  pacientes: PacienteOption[];
  presetPacienteId: string | null;
  presetCitaId: string | null;
  presetMotivo: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [mode, setMode] = useState<"padron" | "snapshot">(
    presetPacienteId ? "padron" : pacientes.length > 0 ? "padron" : "snapshot",
  );
  const [pacienteId, setPacienteId] = useState<string | null>(
    presetPacienteId,
  );
  const [search, setSearch] = useState("");

  // Snapshot fields
  const [nombre, setNombre] = useState("");
  const [apPat, setApPat] = useState("");
  const [apMat, setApMat] = useState("");
  const [edad, setEdad] = useState<string>("");
  const [sexo, setSexo] = useState<"M" | "F" | "O" | "">("");

  const [tipo, setTipo] = useState<
    "primera_vez" | "subsecuente" | "urgencia" | "revision"
  >(presetCitaId ? "primera_vez" : "subsecuente");
  const [motivo, setMotivo] = useState(presetMotivo ?? "");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pacientes.slice(0, 20);
    return pacientes
      .filter((p) => {
        const full = [p.nombre, p.apellido_paterno, p.apellido_materno]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return full.includes(q);
      })
      .slice(0, 20);
  }, [pacientes, search]);

  function fullName(p: PacienteOption): string {
    return [p.nombre, p.apellido_paterno, p.apellido_materno]
      .filter(Boolean)
      .join(" ");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (mode === "padron" && !pacienteId) {
      setErr("Selecciona un paciente del padrón o cambia a registro manual");
      return;
    }
    if (mode === "snapshot" && !nombre.trim()) {
      setErr("Ingresa al menos el nombre del paciente");
      return;
    }

    const edadNum = edad.trim() ? parseInt(edad, 10) : null;
    if (edadNum !== null && (isNaN(edadNum) || edadNum < 0 || edadNum > 130)) {
      setErr("Edad inválida");
      return;
    }

    startTransition(async () => {
      const result = await createConsulta({
        paciente_id: mode === "padron" ? pacienteId : null,
        paciente_nombre: mode === "snapshot" ? nombre.trim() : null,
        paciente_apellido_paterno:
          mode === "snapshot" ? apPat.trim() || null : null,
        paciente_apellido_materno:
          mode === "snapshot" ? apMat.trim() || null : null,
        paciente_iniciales: null,
        paciente_edad: mode === "snapshot" ? edadNum : null,
        paciente_sexo: mode === "snapshot" ? (sexo || null) : null,
        motivo_consulta: motivo.trim() || null,
        tipo,
        cita_id: presetCitaId,
      });

      if (result.status === "ok") {
        router.push(`/dashboard/consultas/${result.id}`);
      } else {
        setErr(result.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Mode toggle */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("padron")}
          className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
            mode === "padron"
              ? "border-ink bg-surface"
              : "border-line bg-surface-alt hover:border-line-strong"
          }`}
        >
          <UserCheck
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              mode === "padron" ? "text-validation" : "text-ink-quiet"
            }`}
            strokeWidth={2.2}
          />
          <div>
            <p className="text-body-sm font-semibold text-ink-strong">
              Paciente del padrón
            </p>
            <p className="mt-0.5 text-caption text-ink-muted">
              {pacientes.length} {pacientes.length === 1 ? "paciente" : "pacientes"} disponibles
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMode("snapshot")}
          className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
            mode === "snapshot"
              ? "border-ink bg-surface"
              : "border-line bg-surface-alt hover:border-line-strong"
          }`}
        >
          <UserPlus
            className={`mt-0.5 h-4 w-4 shrink-0 ${
              mode === "snapshot" ? "text-validation" : "text-ink-quiet"
            }`}
            strokeWidth={2.2}
          />
          <div>
            <p className="text-body-sm font-semibold text-ink-strong">
              Registro manual
            </p>
            <p className="mt-0.5 text-caption text-ink-muted">
              Sólo para esta consulta — sin agregar al padrón
            </p>
          </div>
        </button>
      </div>

      {/* Padron picker */}
      {mode === "padron" && (
        <div className="space-y-2">
          <label className="text-caption font-medium text-ink-strong">
            Selecciona paciente
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-quiet"
              strokeWidth={2}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              className="lg-input pl-9"
              suppressHydrationWarning
            />
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-line">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-caption text-ink-muted">
                {search ? "Sin resultados" : "Tu padrón está vacío"}
              </p>
            ) : (
              filtered.map((p) => (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-3 border-b border-line px-3 py-2.5 transition-colors last:border-b-0 ${
                    pacienteId === p.id
                      ? "bg-validation-soft"
                      : "hover:bg-surface-alt"
                  }`}
                >
                  <input
                    type="radio"
                    name="paciente_id"
                    value={p.id}
                    checked={pacienteId === p.id}
                    onChange={() => setPacienteId(p.id)}
                    className="h-3.5 w-3.5 accent-validation"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-sm font-semibold text-ink-strong">
                      {fullName(p) || "—"}
                    </p>
                    {p.fecha_nacimiento && (
                      <p className="text-caption text-ink-muted">
                        Nac. {p.fecha_nacimiento}
                      </p>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {/* Snapshot fields */}
      {mode === "snapshot" && (
        <div className="space-y-3">
          <div>
            <label className="block text-caption font-medium text-ink-strong">
              Nombre(s)
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="lg-input mt-1"
              maxLength={120}
              suppressHydrationWarning
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-caption font-medium text-ink-strong">
                Apellido paterno
              </label>
              <input
                type="text"
                value={apPat}
                onChange={(e) => setApPat(e.target.value)}
                className="lg-input mt-1"
                maxLength={80}
                suppressHydrationWarning
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-ink-strong">
                Apellido materno
              </label>
              <input
                type="text"
                value={apMat}
                onChange={(e) => setApMat(e.target.value)}
                className="lg-input mt-1"
                maxLength={80}
                suppressHydrationWarning
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-caption font-medium text-ink-strong">
                Edad
              </label>
              <input
                type="number"
                min={0}
                max={130}
                value={edad}
                onChange={(e) => setEdad(e.target.value)}
                className="lg-input mt-1"
                suppressHydrationWarning
              />
            </div>
            <div>
              <label className="block text-caption font-medium text-ink-strong">
                Sexo
              </label>
              <select
                value={sexo}
                onChange={(e) =>
                  setSexo(e.target.value as "M" | "F" | "O" | "")
                }
                className="lg-input mt-1"
              >
                <option value="">—</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
                <option value="O">Otro</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tipo */}
      <div className="space-y-2">
        <label className="text-caption font-medium text-ink-strong">
          Tipo de consulta
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {TIPOS.map((t) => (
            <label
              key={t.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 px-3 py-2.5 transition-colors ${
                tipo === t.value
                  ? "border-ink bg-surface"
                  : "border-line bg-surface-alt hover:border-line-strong"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={t.value}
                checked={tipo === t.value}
                onChange={() => setTipo(t.value)}
                className="mt-0.5 h-3.5 w-3.5 accent-validation"
              />
              <div className="min-w-0">
                <p className="text-body-sm font-semibold text-ink-strong">
                  {t.label}
                </p>
                <p className="mt-0.5 text-caption text-ink-muted">{t.hint}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Motivo */}
      <div>
        <label
          htmlFor="motivo"
          className="block text-caption font-medium text-ink-strong"
        >
          Motivo de consulta{" "}
          <span className="text-ink-soft font-normal">(opcional)</span>
        </label>
        <textarea
          id="motivo"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          maxLength={2000}
          className="lg-input mt-1"
          placeholder="Ej. dolor torácico de 3 días, evaluación preoperatoria, control DM2…"
          suppressHydrationWarning
        />
      </div>

      {err && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-rose" />
          <span>{err}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={pending}
          className="text-caption text-ink-muted hover:text-ink-strong disabled:opacity-60"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="lg-cta-primary disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Iniciando…
            </>
          ) : (
            "Iniciar consulta"
          )}
        </button>
      </div>
    </form>
  );
}
