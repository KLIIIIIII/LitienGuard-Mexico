"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toggleConsentRwd } from "./actions";

interface Props {
  initialActive: boolean;
  initialConsentAt: string | null;
}

export function ConsentToggle({ initialActive, initialConsentAt }: Props) {
  const [active, setActive] = useState(initialActive);
  const [consentAt, setConsentAt] = useState(initialConsentAt);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onToggle() {
    setError(null);
    const newState = !active;
    startTransition(async () => {
      const r = await toggleConsentRwd(newState);
      if (r.status === "ok") {
        setActive(newState);
        setConsentAt(newState ? new Date().toISOString() : null);
      } else {
        setError(r.message);
      }
    });
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border-2 p-4 sm:flex-row sm:items-center sm:justify-between ${
        active ? "border-validation bg-validation-soft/30" : "border-line bg-surface"
      }`}
    >
      <div className="flex items-start gap-3">
        <motion.div
          animate={{
            scale: active ? 1 : 0.85,
            opacity: active ? 1 : 0.5,
          }}
          transition={{ duration: 0.3 }}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            active ? "bg-validation text-canvas" : "bg-surface-alt text-ink-quiet"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
        </motion.div>
        <div>
          <p className="text-body-sm font-semibold text-ink-strong">
            {active ? "Consentimiento activo" : "Consentimiento desactivado"}
          </p>
          {active && consentAt && (
            <p className="text-caption text-ink-muted">
              Activado el{" "}
              {new Date(consentAt).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-body-sm font-semibold transition-colors disabled:opacity-50 shrink-0 ${
          active
            ? "border border-line bg-surface text-ink-strong hover:bg-surface-alt"
            : "bg-validation text-canvas hover:bg-validation/90"
        }`}
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} />}
        {active ? "Revocar consentimiento" : "Activar consentimiento"}
      </button>
      {error && (
        <p className="text-caption text-rose">{error}</p>
      )}
    </div>
  );
}
