"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, Loader2 } from "lucide-react";
import { resetTutorial } from "@/app/dashboard/tutorial/actions";

export function ReplayTutorialButton({
  variant = "card",
}: {
  variant?: "card" | "inline";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onReplay() {
    startTransition(async () => {
      const r = await resetTutorial();
      if (r.status === "ok") {
        // El gate server-side detectará el flag null y mostrará el modal
        router.refresh();
        // Pequeño delay para que el revalidate llegue antes del scroll
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
      }
    });
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onReplay}
        disabled={pending}
        className="inline-flex items-center gap-1.5 text-caption font-medium text-validation hover:underline disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <PlayCircle className="h-3.5 w-3.5" strokeWidth={2} />
        )}
        Repetir tour de bienvenida
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onReplay}
      disabled={pending}
      className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-line-strong hover:bg-surface-alt disabled:opacity-60"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-validation-soft text-validation">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <PlayCircle className="h-4 w-4" strokeWidth={2} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-semibold text-ink-strong">
          Ver tour de bienvenida
        </p>
        <p className="truncate text-caption text-ink-muted">
          Recorre las funciones principales en 60 segundos
        </p>
      </div>
    </button>
  );
}
