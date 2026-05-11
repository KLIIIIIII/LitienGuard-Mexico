"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { inviteUser, type InviteState } from "./actions";

export function InviteForm() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<InviteState>({ status: "idle" });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setState({ status: "idle" });
    startTransition(async () => {
      const result = await inviteUser(formData);
      setState(result);
      if (result.status === "ok") (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <form onSubmit={onSubmit} className="lg-card space-y-5">
      <div>
        <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
          Nueva invitación
        </h2>
        <p className="mt-1 text-body-sm text-ink-muted">
          El correo invitado podrá entrar con magic link. Expira en 60 días.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-caption font-medium text-ink-strong"
          >
            Correo
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="medico@hospital.mx"
            className="lg-input"
            disabled={pending}
            suppressHydrationWarning
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="role"
            className="block text-caption font-medium text-ink-strong"
          >
            Rol
          </label>
          <select
            id="role"
            name="role"
            defaultValue="medico"
            className="lg-input appearance-none pr-10"
            disabled={pending}
          >
            <option value="medico">Médico</option>
            <option value="admin">Admin</option>
          </select>
          <p className="text-caption text-ink-soft">
            Admin = puede gestionar invitaciones y ver todas las notas.
          </p>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label
            htmlFor="subscription_tier"
            className="block text-caption font-medium text-ink-strong"
          >
            Plan / suscripción
          </label>
          <select
            id="subscription_tier"
            name="subscription_tier"
            defaultValue="pilot"
            className="lg-input appearance-none pr-10"
            disabled={pending}
          >
            <option value="free">Gratis — sin Scribe</option>
            <option value="pilot">Piloto — Scribe gratis durante piloto</option>
            <option value="pro">Pro — Scribe + Cerebro (comercial)</option>
            <option value="enterprise">
              Enterprise — todo + RCM (hospitales)
            </option>
          </select>
          <p className="text-caption text-ink-soft">
            Define qué funciones puede usar el invitado.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="nombre"
            className="block text-caption font-medium text-ink-strong"
          >
            Nombre <span className="text-ink-soft">(opcional)</span>
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            className="lg-input"
            disabled={pending}
            suppressHydrationWarning
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="hospital"
            className="block text-caption font-medium text-ink-strong"
          >
            Hospital <span className="text-ink-soft">(opcional)</span>
          </label>
          <input
            id="hospital"
            name="hospital"
            type="text"
            className="lg-input"
            disabled={pending}
            suppressHydrationWarning
          />
        </div>
      </div>

      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong"
        >
          {state.message}
        </p>
      )}
      {state.status === "ok" && (
        <p
          role="status"
          className="rounded-lg border border-validation-soft bg-validation-soft px-3 py-2 text-caption text-ink-strong"
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="lg-cta-primary disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Crear invitación"}
        {!pending && <Check className="h-4 w-4" strokeWidth={2} />}
      </button>
    </form>
  );
}
