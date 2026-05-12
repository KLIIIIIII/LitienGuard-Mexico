"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function CycleToggle({ current }: { current: "mensual" | "anual" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setCycle(next: "mensual" | "anual") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "mensual") params.delete("cycle");
    else params.set("cycle", "anual");
    router.replace(`/precios?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1">
      <button
        type="button"
        onClick={() => setCycle("mensual")}
        className={`rounded-full px-4 py-1.5 text-caption font-medium transition-all ${
          current === "mensual"
            ? "bg-validation text-surface"
            : "text-ink-muted hover:text-ink-strong"
        }`}
      >
        Mensual
      </button>
      <button
        type="button"
        onClick={() => setCycle("anual")}
        className={`rounded-full px-4 py-1.5 text-caption font-medium transition-all ${
          current === "anual"
            ? "bg-validation text-surface"
            : "text-ink-muted hover:text-ink-strong"
        }`}
      >
        Anual
        <span className="ml-1.5 rounded-full bg-validation-soft px-1.5 py-0.5 text-[0.65rem] font-semibold text-validation">
          −16%
        </span>
      </button>
    </div>
  );
}
