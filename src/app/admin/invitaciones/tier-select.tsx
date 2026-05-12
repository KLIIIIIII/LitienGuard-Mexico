"use client";

import { useState, useTransition } from "react";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { updateInvitationTier } from "./actions";
import { TIER_LABELS, type SubscriptionTier } from "@/lib/entitlements";

const TIERS: SubscriptionTier[] = ["free", "pilot", "pro", "enterprise"];

const TIER_BG: Record<SubscriptionTier, string> = {
  free: "bg-warn-soft text-warn border-warn-soft",
  pilot: "bg-accent-soft text-accent border-accent-soft",
  pro: "bg-validation-soft text-validation border-validation-soft",
  enterprise: "bg-validation text-surface border-validation",
};

export function TierSelect({
  inviteId,
  current,
}: {
  inviteId: string;
  current: SubscriptionTier;
}) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<SubscriptionTier>(current);
  const [feedback, setFeedback] = useState<"saved" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function onChange(next: SubscriptionTier) {
    if (next === value || pending) return;
    const previous = value;
    setValue(next);
    setFeedback(null);
    setErrorMsg(null);

    startTransition(async () => {
      const r = await updateInvitationTier(inviteId, next);
      if (r.status === "ok") {
        setFeedback("saved");
        setTimeout(() => setFeedback(null), 2000);
      } else {
        setValue(previous);
        setErrorMsg(r.message);
        setFeedback("error");
        setTimeout(() => setFeedback(null), 4000);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SubscriptionTier)}
          disabled={pending}
          className={`appearance-none rounded-full border px-3 py-0.5 pr-7 text-caption font-medium transition-all cursor-pointer disabled:opacity-60 ${TIER_BG[value]}`}
          aria-label="Cambiar plan"
        >
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {TIER_LABELS[t]}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current">
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.4} />
          ) : (
            <svg
              className="h-3 w-3"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </div>

      {feedback === "saved" && (
        <span
          className="inline-flex items-center gap-1 text-caption text-validation"
          aria-live="polite"
        >
          <Check className="h-3 w-3" strokeWidth={2.4} />
          Guardado
        </span>
      )}
      {feedback === "error" && errorMsg && (
        <span
          className="inline-flex items-center gap-1 text-caption text-rose"
          aria-live="polite"
          title={errorMsg}
        >
          <AlertCircle className="h-3 w-3" strokeWidth={2.4} />
          Error
        </span>
      )}
    </div>
  );
}
