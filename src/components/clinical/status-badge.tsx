import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type StatusTone =
  | "critical"
  | "warning"
  | "success"
  | "info"
  | "neutral";

const TONE_CLASSES: Record<
  StatusTone,
  { bg: string; text: string; ring: string }
> = {
  critical: {
    bg: "bg-code-red-bg",
    text: "text-code-red",
    ring: "ring-code-red/30",
  },
  warning: {
    bg: "bg-code-amber-bg",
    text: "text-code-amber",
    ring: "ring-code-amber/30",
  },
  success: {
    bg: "bg-code-green-bg",
    text: "text-code-green",
    ring: "ring-code-green/30",
  },
  info: {
    bg: "bg-accent-soft",
    text: "text-accent",
    ring: "ring-accent/20",
  },
  neutral: {
    bg: "bg-surface-alt",
    text: "text-ink-muted",
    ring: "ring-line",
  },
};

const SIZE_CLASSES = {
  sm: "px-1.5 py-0.5 text-[0.65rem]",
  md: "px-2 py-0.5 text-caption",
  lg: "px-2.5 py-1 text-body-sm",
} as const;

/**
 * StatusBadge — pill semántico para estados clínicos.
 *
 * Cumple AMIA: visibility (estado siempre visible), match (color
 * universal: rojo=crítico, ámbar=atención, verde=ok).
 */
export function StatusBadge({
  tone = "neutral",
  size = "md",
  icon: Icon,
  pulse,
  children,
  className,
}: {
  tone?: StatusTone;
  size?: keyof typeof SIZE_CLASSES;
  icon?: LucideIcon;
  /** Pulsing dot for critical/active states */
  pulse?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const t = TONE_CLASSES[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-eyebrow ring-1 ring-inset ${t.bg} ${t.text} ${t.ring} ${SIZE_CLASSES[size]} ${className ?? ""}`}
    >
      {pulse && (
        <span
          aria-hidden="true"
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${t.text} bg-current`}
        >
          <span className="absolute inset-0 -m-0.5 rounded-full bg-current opacity-50 animate-ping" />
        </span>
      )}
      {Icon && <Icon className="h-3 w-3" strokeWidth={2.4} />}
      {children}
    </span>
  );
}
