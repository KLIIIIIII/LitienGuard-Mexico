"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme-provider";

const OPTIONS: Array<{
  value: Theme;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export function ThemeToggle({
  variant = "segmented",
}: {
  variant?: "segmented" | "icon";
}) {
  const { theme, resolved, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="h-8 w-24 rounded-full bg-surface-alt"
        aria-hidden="true"
      />
    );
  }

  if (variant === "icon") {
    const Icon = resolved === "dark" ? Sun : Moon;
    const next: Theme = resolved === "dark" ? "light" : "dark";
    return (
      <button
        type="button"
        onClick={() => setTheme(next)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink-muted transition-colors hover:border-line-strong hover:text-ink-strong"
        aria-label={`Cambiar a tema ${next === "dark" ? "oscuro" : "claro"}`}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema visual"
      className="inline-flex h-8 items-center gap-0.5 rounded-full border border-line bg-surface p-0.5"
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(opt.value)}
            title={opt.label}
            className={`inline-flex h-7 items-center justify-center rounded-full px-2 transition-colors ${
              isActive
                ? "bg-surface-alt text-ink-strong"
                : "text-ink-soft hover:text-ink-strong"
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
            <span className="sr-only">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
