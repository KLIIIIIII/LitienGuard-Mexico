"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { updateConsultorioData } from "./actions";

interface ConsultorioFormProps {
  initial: {
    nombre: string | null;
    cedula_profesional: string | null;
    especialidad: string | null;
    consultorio_nombre: string | null;
    consultorio_direccion: string | null;
    consultorio_telefono: string | null;
  };
}

export function ConsultorioForm({ initial }: ConsultorioFormProps) {
  const [pending, startTransition] = useTransition();
  const [nombre, setNombre] = useState(initial.nombre ?? "");
  const [cedula, setCedula] = useState(initial.cedula_profesional ?? "");
  const [especialidad, setEspecialidad] = useState(initial.especialidad ?? "");
  const [consNombre, setConsNombre] = useState(initial.consultorio_nombre ?? "");
  const [consDir, setConsDir] = useState(initial.consultorio_direccion ?? "");
  const [consTel, setConsTel] = useState(initial.consultorio_telefono ?? "");
  const [feedback, setFeedback] = useState<
    | { type: "ok"; message: string }
    | { type: "error"; message: string }
    | null
  >(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const r = await updateConsultorioData({
        nombre: nombre.trim() || null,
        cedula_profesional: cedula.trim() || null,
        especialidad: especialidad.trim() || null,
        consultorio_nombre: consNombre.trim() || null,
        consultorio_direccion: consDir.trim() || null,
        consultorio_telefono: consTel.trim() || null,
      });
      if (r.status === "ok") {
        setFeedback({ type: "ok", message: "Datos guardados." });
      } else {
        setFeedback({ type: "error", message: r.message });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="lg-card space-y-4">
      <div>
        <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
          Datos para recetas y expedientes
        </h2>
        <p className="mt-1 text-body-sm text-ink-muted">
          Estos datos aparecen en cada receta electrónica y en los expedientes
          que generes. La NOM-024-SSA3 requiere que la cédula profesional sea
          visible en cualquier receta médica emitida en territorio mexicano.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="nombre" className="block text-caption font-medium text-ink-strong">
            Nombre completo
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Dr. Juan Hernández López"
            maxLength={120}
            disabled={pending}
            className="lg-input"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cedula" className="block text-caption font-medium text-ink-strong">
            Cédula profesional
          </label>
          <input
            id="cedula"
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="1234567"
            maxLength={20}
            disabled={pending}
            className="lg-input"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="especialidad" className="block text-caption font-medium text-ink-strong">
            Especialidad
          </label>
          <input
            id="especialidad"
            type="text"
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            placeholder="Cardiología · Endocrinología · Medicina interna"
            maxLength={120}
            disabled={pending}
            className="lg-input"
          />
        </div>
      </div>

      <div className="mt-2 border-t border-line pt-4">
        <h3 className="text-h3 font-semibold tracking-tight text-ink-strong">
          Consultorio
        </h3>
        <p className="mt-1 text-caption text-ink-muted">
          Aparece como pie de página en cada documento generado.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="cons_nombre" className="block text-caption font-medium text-ink-strong">
            Nombre del consultorio
          </label>
          <input
            id="cons_nombre"
            type="text"
            value={consNombre}
            onChange={(e) => setConsNombre(e.target.value)}
            placeholder="Centro Médico ABC · Consultorio 305"
            maxLength={120}
            disabled={pending}
            className="lg-input"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="cons_dir" className="block text-caption font-medium text-ink-strong">
            Dirección
          </label>
          <input
            id="cons_dir"
            type="text"
            value={consDir}
            onChange={(e) => setConsDir(e.target.value)}
            placeholder="Av. Reforma 123, Col. Centro, CDMX, CP 06000"
            maxLength={200}
            disabled={pending}
            className="lg-input"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="cons_tel" className="block text-caption font-medium text-ink-strong">
            Teléfono
          </label>
          <input
            id="cons_tel"
            type="tel"
            value={consTel}
            onChange={(e) => setConsTel(e.target.value)}
            placeholder="55 1234 5678"
            maxLength={30}
            disabled={pending}
            className="lg-input"
          />
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-caption ${
            feedback.type === "ok"
              ? "border-validation-soft bg-validation-soft text-validation"
              : "border-rose-soft bg-rose-soft text-ink-strong"
          }`}
        >
          {feedback.type === "ok" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {feedback.message}
        </div>
      )}

      <button type="submit" disabled={pending} className="lg-cta-primary disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
