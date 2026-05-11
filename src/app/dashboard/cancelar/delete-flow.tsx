"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Trash2, Check } from "lucide-react";
import { eliminarMisDatos } from "./actions";

export function DeleteFlow({
  notasCount,
  practiceCount,
}: {
  notasCount: number;
  practiceCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<"init" | "confirm" | "done">("init");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ notas: number } | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await eliminarMisDatos(confirmText);
      if (r.status === "ok") {
        setStep("done");
        setResult(r.deleted);
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 4000);
      } else {
        setError(r.message);
      }
    });
  }

  if (step === "done") {
    return (
      <div className="lg-card text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-validation-soft">
          <Check className="h-6 w-6 text-validation" />
        </div>
        <h2 className="mt-4 text-h2 font-semibold tracking-tight text-ink-strong">
          Tus datos fueron eliminados
        </h2>
        <p className="mt-2 text-body-sm text-ink-muted">
          {result?.notas ?? 0} nota
          {(result?.notas ?? 0) === 1 ? "" : "s"} eliminada
          {(result?.notas ?? 0) === 1 ? "" : "s"}. Tu sesión se cerrará y serás
          redirigido al inicio.
        </p>
      </div>
    );
  }

  if (step === "init") {
    return (
      <div className="lg-card space-y-5">
        <div>
          <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
            Eliminar mi cuenta y todos mis datos
          </h2>
          <p className="mt-2 text-body-sm text-ink-muted">
            Conforme al derecho de Cancelación de la LFPDPPP, puedes solicitar
            que eliminemos toda tu información de LitienGuard. Esta acción es{" "}
            <strong>irreversible</strong>.
          </p>
        </div>
        <ul className="space-y-2 rounded-lg border border-line bg-surface-alt px-4 py-3 text-body-sm text-ink-strong">
          <li>
            • <strong>{notasCount}</strong> nota{notasCount === 1 ? "" : "s"}{" "}
            SOAP (incluye transcripciones, datos de paciente, metadatos)
          </li>
          <li>
            • <strong>{practiceCount}</strong> fragmento
            {practiceCount === 1 ? "" : "s"} anonimizado
            {practiceCount === 1 ? "" : "s"} en el cerebro colectivo
          </li>
          <li>• Tu perfil, rol e historial de sesiones</li>
          <li>• Tu cuenta de autenticación</li>
        </ul>
        <p className="text-caption text-ink-soft">
          Lo que NO eliminamos: registros de auditoría (con tu ID
          desvinculado) por obligación de trazabilidad regulatoria mínima de
          NOM-024 y compromisos contractuales del piloto.
        </p>
        <button
          type="button"
          onClick={() => setStep("confirm")}
          className="inline-flex items-center gap-2 rounded-lg border border-rose bg-surface px-4 py-2 text-body-sm font-semibold text-rose hover:bg-rose-soft"
        >
          <Trash2 className="h-4 w-4" />
          Continuar con la eliminación
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="lg-card space-y-4">
      <div>
        <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
          Confirmación final
        </h2>
        <p className="mt-2 text-body-sm text-ink-muted">
          Para confirmar la eliminación, escribe la palabra{" "}
          <code className="rounded bg-surface-alt px-1.5 py-0.5">
            ELIMINAR
          </code>{" "}
          en mayúsculas.
        </p>
      </div>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="ELIMINAR"
        className="lg-input"
        autoComplete="off"
        disabled={pending}
        suppressHydrationWarning
      />
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-soft bg-rose-soft px-3 py-2 text-caption text-ink-strong"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 text-rose" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending || confirmText.trim().toUpperCase() !== "ELIMINAR"}
          className="inline-flex items-center gap-2 rounded-lg bg-rose px-4 py-2 text-body-sm font-semibold text-surface hover:bg-rose/90 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          {pending ? "Eliminando…" : "Eliminar todo permanentemente"}
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("init");
            setConfirmText("");
            setError(null);
          }}
          disabled={pending}
          className="lg-cta-ghost"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
