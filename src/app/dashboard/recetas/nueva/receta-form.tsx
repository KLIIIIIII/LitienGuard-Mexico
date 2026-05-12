"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { createReceta, type RecetaInput } from "../actions";

interface ItemState {
  medicamento: string;
  presentacion: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  via_administracion: string;
  indicaciones: string;
}

function emptyItem(): ItemState {
  return {
    medicamento: "",
    presentacion: "",
    dosis: "",
    frecuencia: "",
    duracion: "",
    via_administracion: "",
    indicaciones: "",
  };
}

export function RecetaForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [paciente_nombre, setPacienteNombre] = useState("");
  const [paciente_apellido_paterno, setApPaterno] = useState("");
  const [paciente_apellido_materno, setApMaterno] = useState("");
  const [paciente_edad, setEdad] = useState<string>("");
  const [paciente_sexo, setSexo] = useState<"M" | "F" | "O" | "">("");
  const [diagnostico, setDiagnostico] = useState("");
  const [diagnostico_cie10, setCie10] = useState("");
  const [indicaciones_generales, setIndGenerales] = useState("");
  const [items, setItems] = useState<ItemState[]>([emptyItem()]);

  function updateItem(idx: number, field: keyof ItemState, value: string) {
    setItems((curr) =>
      curr.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    );
  }

  function addItem() {
    if (items.length >= 20) return;
    setItems((curr) => [...curr, emptyItem()]);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems((curr) => curr.filter((_, i) => i !== idx));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanItems = items
      .map((it) => ({
        ...it,
        medicamento: it.medicamento.trim(),
        presentacion: it.presentacion.trim(),
        dosis: it.dosis.trim(),
        frecuencia: it.frecuencia.trim(),
        duracion: it.duracion.trim(),
        via_administracion: it.via_administracion.trim(),
        indicaciones: it.indicaciones.trim(),
      }))
      .filter((it) => it.medicamento.length > 0);

    if (cleanItems.length === 0) {
      setError("Agrega al menos un medicamento.");
      return;
    }

    const edadNum = paciente_edad.trim() ? Number(paciente_edad) : null;
    const payload: RecetaInput = {
      paciente_nombre: paciente_nombre.trim(),
      paciente_apellido_paterno: paciente_apellido_paterno.trim(),
      paciente_apellido_materno: paciente_apellido_materno.trim(),
      paciente_edad: edadNum,
      paciente_sexo: paciente_sexo === "" ? null : paciente_sexo,
      diagnostico: diagnostico.trim(),
      diagnostico_cie10: diagnostico_cie10.trim(),
      indicaciones_generales: indicaciones_generales.trim(),
      observaciones: "",
      items: cleanItems,
    };

    startTransition(async () => {
      const r = await createReceta(payload);
      if (r.status === "ok") {
        router.push(`/dashboard/recetas/${r.recetaId}`);
      } else {
        setError(r.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="lg-card space-y-4">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Paciente
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="block text-caption font-medium text-ink-strong">
              Nombre(s) <span className="text-rose">*</span>
            </label>
            <input
              type="text"
              required
              value={paciente_nombre}
              onChange={(e) => setPacienteNombre(e.target.value)}
              placeholder="Ej. Juan Carlos"
              maxLength={120}
              disabled={pending}
              className="lg-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Apellido paterno
            </label>
            <input
              type="text"
              value={paciente_apellido_paterno}
              onChange={(e) => setApPaterno(e.target.value)}
              placeholder="Hernández"
              maxLength={80}
              disabled={pending}
              className="lg-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Apellido materno
            </label>
            <input
              type="text"
              value={paciente_apellido_materno}
              onChange={(e) => setApMaterno(e.target.value)}
              placeholder="López"
              maxLength={80}
              disabled={pending}
              className="lg-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Edad
            </label>
            <input
              type="number"
              min={0}
              max={130}
              value={paciente_edad}
              onChange={(e) => setEdad(e.target.value)}
              placeholder="45"
              disabled={pending}
              className="lg-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Sexo
            </label>
            <select
              value={paciente_sexo}
              onChange={(e) =>
                setSexo(e.target.value as "M" | "F" | "O" | "")
              }
              disabled={pending}
              className="lg-input"
            >
              <option value="">—</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro / Prefiere no decir</option>
            </select>
          </div>
        </div>
      </section>

      <section className="lg-card space-y-4">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Diagnóstico
        </h2>

        <div className="space-y-1.5">
          <label className="block text-caption font-medium text-ink-strong">
            Diagnóstico clínico <span className="text-rose">*</span>
          </label>
          <textarea
            required
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            placeholder="Ej. Diabetes mellitus tipo 2 mal controlada con hiperglucemia en ayuno > 180 mg/dL"
            rows={2}
            maxLength={500}
            disabled={pending}
            className="lg-input resize-y"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-caption font-medium text-ink-strong">
            Código CIE-10 (opcional)
          </label>
          <input
            type="text"
            value={diagnostico_cie10}
            onChange={(e) => setCie10(e.target.value.toUpperCase())}
            placeholder="E11.9"
            maxLength={20}
            disabled={pending}
            className="lg-input max-w-[140px] font-mono"
          />
        </div>
      </section>

      <section className="lg-card space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              Medicamentos
            </h2>
            <p className="mt-1 text-caption text-ink-muted">
              Al menos uno requerido. Máximo 20.
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={pending || items.length >= 20}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-caption font-semibold text-ink-strong hover:bg-surface-alt disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
            Agregar
          </button>
        </div>

        <div className="space-y-4">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-line bg-surface-alt p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-caption font-semibold text-ink-strong">
                  Medicamento #{idx + 1}
                </p>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={pending}
                    className="text-rose hover:bg-rose-soft rounded p-1"
                    aria-label="Eliminar medicamento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-caption font-medium text-ink-strong">
                    Medicamento <span className="text-rose">*</span>
                  </label>
                  <input
                    type="text"
                    value={it.medicamento}
                    onChange={(e) =>
                      updateItem(idx, "medicamento", e.target.value)
                    }
                    placeholder="Metformina"
                    maxLength={200}
                    disabled={pending}
                    className="lg-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-caption font-medium text-ink-strong">
                    Presentación
                  </label>
                  <input
                    type="text"
                    value={it.presentacion}
                    onChange={(e) =>
                      updateItem(idx, "presentacion", e.target.value)
                    }
                    placeholder="Tabletas 850 mg"
                    maxLength={200}
                    disabled={pending}
                    className="lg-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-caption font-medium text-ink-strong">
                    Dosis
                  </label>
                  <input
                    type="text"
                    value={it.dosis}
                    onChange={(e) =>
                      updateItem(idx, "dosis", e.target.value)
                    }
                    placeholder="1 tableta"
                    maxLength={200}
                    disabled={pending}
                    className="lg-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-caption font-medium text-ink-strong">
                    Frecuencia
                  </label>
                  <input
                    type="text"
                    value={it.frecuencia}
                    onChange={(e) =>
                      updateItem(idx, "frecuencia", e.target.value)
                    }
                    placeholder="Cada 12 horas"
                    maxLength={200}
                    disabled={pending}
                    className="lg-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-caption font-medium text-ink-strong">
                    Duración
                  </label>
                  <input
                    type="text"
                    value={it.duracion}
                    onChange={(e) =>
                      updateItem(idx, "duracion", e.target.value)
                    }
                    placeholder="30 días"
                    maxLength={200}
                    disabled={pending}
                    className="lg-input"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-caption font-medium text-ink-strong">
                    Vía
                  </label>
                  <input
                    type="text"
                    value={it.via_administracion}
                    onChange={(e) =>
                      updateItem(idx, "via_administracion", e.target.value)
                    }
                    placeholder="Oral"
                    maxLength={80}
                    disabled={pending}
                    className="lg-input"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-caption font-medium text-ink-strong">
                    Indicaciones específicas
                  </label>
                  <input
                    type="text"
                    value={it.indicaciones}
                    onChange={(e) =>
                      updateItem(idx, "indicaciones", e.target.value)
                    }
                    placeholder="Tomar con alimentos"
                    maxLength={500}
                    disabled={pending}
                    className="lg-input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="lg-card space-y-4">
        <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Indicaciones generales (opcional)
        </h2>
        <textarea
          value={indicaciones_generales}
          onChange={(e) => setIndGenerales(e.target.value)}
          placeholder="Dieta hipocalórica. Caminar 30 min al día. Control glucémico en 4 semanas."
          rows={3}
          maxLength={1000}
          disabled={pending}
          className="lg-input resize-y"
        />
      </section>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong">
          <AlertCircle className="h-4 w-4 text-rose" />
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="lg-cta-primary disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar borrador"}
        </button>
      </div>
    </form>
  );
}
