"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Smile,
  Building2,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { setProfileType } from "@/app/dashboard/onboarding/actions";
import type { ProfileType } from "@/lib/entitlements";

type SelectableType = "medico_general" | "dentista" | "hospital";

const OPTIONS: Array<{
  value: SelectableType;
  icon: typeof Stethoscope;
  label: string;
  hint: string;
}> = [
  {
    value: "medico_general",
    icon: Stethoscope,
    label: "Medicina general / especialidad",
    hint: "Internista, cardiólogo, pediatra, etc.",
  },
  {
    value: "dentista",
    icon: Smile,
    label: "Odontología",
    hint: "Odontograma, planes dentales",
  },
  {
    value: "hospital",
    icon: Building2,
    label: "Hospital / multi-médico",
    hint: "Director médico, administración",
  },
];

export function ProfileTypeForm({ current }: { current: ProfileType }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<SelectableType | null>(
    current !== "sin_definir" ? (current as SelectableType) : null,
  );
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function onSave() {
    if (!selected || pending) return;
    setErr(null);
    setOk(false);
    startTransition(async () => {
      const r = await setProfileType(selected);
      if (r.status === "ok") {
        setOk(true);
        // Refrescar para que el sidebar se actualice
        setTimeout(() => router.refresh(), 500);
      } else {
        setErr(r.message);
      }
    });
  }

  const isDirty =
    selected !== null &&
    (current === "sin_definir" ||
      selected !== (current as SelectableType));

  return (
    <div className="lg-card space-y-4">
      <div>
        <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
          Tipo de práctica
        </h2>
        <p className="mt-1 text-body-sm text-ink-muted">
          Define qué módulos aparecen en tu panel. Cambia cuando quieras.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              disabled={pending}
              className={`relative flex flex-col items-start gap-2 rounded-lg border bg-surface p-3.5 text-left transition-all ${
                active
                  ? "border-validation ring-1 ring-validation"
                  : "border-line hover:border-line-strong"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md ${
                  active
                    ? "bg-validation text-canvas"
                    : "bg-validation-soft text-validation"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-body-sm font-semibold text-ink-strong">
                  {opt.label}
                </p>
                <p className="mt-0.5 text-caption text-ink-muted">
                  {opt.hint}
                </p>
              </div>
              {active && (
                <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-validation text-canvas">
                  <Check className="h-3 w-3" strokeWidth={2.4} />
                </span>
              )}
            </button>
          );
        })}
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
      {ok && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-validation bg-validation-soft px-3 py-2 text-caption text-ink-strong"
        >
          <Check className="h-3.5 w-3.5 text-validation" />
          <span>
            Perfil actualizado. Tu sidebar se acaba de reconfigurar.
          </span>
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={onSave}
          disabled={!isDirty || pending}
          className="lg-cta-primary disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando…
            </>
          ) : (
            "Guardar perfil"
          )}
        </button>
      </div>
    </div>
  );
}
