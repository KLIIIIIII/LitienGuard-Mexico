"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Loader2,
  Mail,
  Shield,
} from "lucide-react";
import { setRecallReplyToEmail } from "./actions";

export function ReplyToForm({
  emailLogin,
  current,
}: {
  emailLogin: string;
  current: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"default" | "custom">(
    current ? "custom" : "default",
  );
  const [email, setEmail] = useState(current ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    const valor = mode === "default" ? null : email.trim();
    startTransition(async () => {
      const r = await setRecallReplyToEmail(valor);
      if (r.status === "ok") {
        setOk(true);
        router.refresh();
      } else {
        setErr(r.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="lg-card space-y-5">
      <div>
        <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
          Correo de respuesta para pacientes
        </h2>
        <p className="mt-1 text-body-sm text-ink-muted">
          Cuando un paciente responde a tus recordatorios, decides dónde
          llega su respuesta.
        </p>
      </div>

      <div className="space-y-3">
        <RadioCard
          checked={mode === "default"}
          onSelect={() => setMode("default")}
          icon={Shield}
          title="Usar dominio seguro de LitienGuard"
          subtitle="Recomendado · sin configuración"
          desc={`Las respuestas llegan a ${emailLogin} (tu correo de login). Máxima entrega — nuestro dominio está verificado con DKIM y SPF, no caen a spam.`}
        />
        <RadioCard
          checked={mode === "custom"}
          onSelect={() => setMode("custom")}
          icon={Mail}
          title="Usar mi propio correo"
          subtitle="Para recibir las respuestas en otro buzón"
          desc="Útil si te logueas con un correo personal pero quieres que tus pacientes respondan al correo del consultorio (ej: contacto@, recepcion@, citas@)."
        />
      </div>

      {mode === "custom" && (
        <div className="space-y-1.5">
          <label
            htmlFor="reply-to-email"
            className="block text-caption font-medium text-ink-strong"
          >
            Correo para recibir respuestas
          </label>
          <input
            id="reply-to-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contacto@miconsultorio.mx"
            className="lg-input"
            disabled={pending}
            required
            suppressHydrationWarning
          />
          <p className="text-caption text-ink-soft leading-relaxed">
            El paciente verá tu nombre como remitente. Cuando responda al
            correo, su mensaje llegará a esta dirección.
          </p>
        </div>
      )}

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
          <span>Preferencia guardada.</span>
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
          "Guardar preferencia"
        )}
      </button>
    </form>
  );
}

function RadioCard({
  checked,
  onSelect,
  icon: Icon,
  title,
  subtitle,
  desc,
}: {
  checked: boolean;
  onSelect: () => void;
  icon: typeof Shield;
  title: string;
  subtitle: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex w-full items-start gap-3 rounded-xl border-2 bg-surface p-4 text-left transition-colors ${
        checked
          ? "border-validation"
          : "border-line hover:border-line-strong"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          checked
            ? "bg-validation text-canvas"
            : "bg-validation-soft text-validation"
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="text-body-sm font-semibold text-ink-strong">
            {title}
          </p>
          <p className="text-caption text-ink-soft">{subtitle}</p>
        </div>
        <p className="mt-1 text-caption text-ink-muted leading-relaxed">
          {desc}
        </p>
      </div>
      <span
        aria-hidden
        className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          checked
            ? "border-validation bg-validation"
            : "border-line bg-surface"
        }`}
      >
        {checked && (
          <span className="h-1.5 w-1.5 rounded-full bg-canvas" />
        )}
      </span>
    </button>
  );
}
