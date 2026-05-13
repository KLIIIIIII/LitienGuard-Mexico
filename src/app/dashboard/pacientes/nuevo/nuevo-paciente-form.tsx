"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { crearPaciente } from "../actions";

export function NuevoPacienteForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const r = await crearPaciente(fd);
      if (r.status === "ok") {
        router.push("/dashboard/pacientes");
      } else {
        setErr(r.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="lg-card space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="nombre" label="Nombre" required />
        <Field name="apellido_paterno" label="Apellido paterno" />
        <Field name="apellido_materno" label="Apellido materno" />
        <Field
          name="email"
          label="Correo"
          type="email"
          placeholder="paciente@ejemplo.com"
        />
        <Field
          name="telefono"
          label="Teléfono"
          placeholder="55 1234 5678"
        />
        <Field
          name="fecha_nacimiento"
          label="Fecha de nacimiento"
          type="date"
        />
        <div className="space-y-1.5">
          <label
            htmlFor="sexo"
            className="block text-caption font-medium text-ink-strong"
          >
            Sexo
          </label>
          <select
            id="sexo"
            name="sexo"
            defaultValue=""
            className="lg-input appearance-none pr-10"
          >
            <option value="">— seleccionar —</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="O">Otro</option>
          </select>
        </div>
        <Field
          name="ultima_consulta_at"
          label="Última consulta"
          type="date"
        />
      </div>

      <Field
        name="etiquetas"
        label="Etiquetas"
        placeholder="diabetes, mensual, prioritario"
        hint="Separadas por comas. Te ayudan a filtrar el padrón."
      />

      <div className="space-y-1.5">
        <label
          htmlFor="notas_internas"
          className="block text-caption font-medium text-ink-strong"
        >
          Notas internas
        </label>
        <textarea
          id="notas_internas"
          name="notas_internas"
          rows={4}
          maxLength={2000}
          className="lg-input resize-y"
          placeholder="Antecedentes, alergias, observaciones para tu propio uso."
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

      <button
        type="submit"
        disabled={pending}
        className="lg-cta-primary disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Guardando…
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Agregar paciente
          </>
        )}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  type?: "text" | "email" | "date";
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-caption font-medium text-ink-strong"
      >
        {label}
        {required && <span className="ml-1 text-rose">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="lg-input"
        suppressHydrationWarning
      />
      {hint && <p className="text-caption text-ink-soft">{hint}</p>}
    </div>
  );
}
