/**
 * Design tokens — single source of truth for programmatic access.
 *
 * The runtime values live as CSS variables in globals.css (themable).
 * This file exists for: (a) TypeScript autocompletion / type-checking,
 * (b) consumers that need to read the token name (e.g., animation libs,
 * chart libraries that need actual color strings).
 *
 * When you need a color in JSX: prefer Tailwind class (`text-ink-strong`).
 * When you need it in a chart or motion lib: use `getCssVar('--ink-strong')`.
 *
 * Aligned with:
 *   - AMIA 14 usability principles (consistency, visibility, language)
 *   - HIMSS 9 attributes (effective information presentation)
 *   - WCAG 2.2 AA (contrast 4.5:1 minimum on body text)
 */

export const surfaces = [
  "canvas",
  "surface",
  "surface-alt",
  "surface-deep",
  "surface-elevated",
] as const;
export type Surface = (typeof surfaces)[number];

export const inks = [
  "ink",
  "ink-strong",
  "ink-muted",
  "ink-soft",
  "ink-quiet",
] as const;
export type Ink = (typeof inks)[number];

export const lines = ["line", "line-soft", "line-strong"] as const;
export type Line = (typeof lines)[number];

export const semantics = [
  "accent",
  "accent-deep",
  "accent-soft",
  "validation",
  "validation-soft",
  "warn",
  "warn-soft",
  "rose",
  "rose-soft",
] as const;
export type Semantic = (typeof semantics)[number];

export const clinicalCodes = [
  "code-red",
  "code-red-bg",
  "code-amber",
  "code-amber-bg",
  "code-green",
  "code-green-bg",
] as const;
export type ClinicalCode = (typeof clinicalCodes)[number];

export type AnyToken = Surface | Ink | Line | Semantic | ClinicalCode;

/**
 * Read a CSS variable's resolved value at runtime.
 * Returns e.g. "rgb(31 30 27)" — pass to chart libs that need string color.
 */
export function getCssVar(
  name: AnyToken,
  opacity?: number,
): string | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();
  if (!raw) return undefined;
  if (opacity !== undefined && opacity >= 0 && opacity <= 1) {
    return `rgb(${raw} / ${opacity})`;
  }
  return `rgb(${raw})`;
}

/**
 * Spacing scale — used for consistency in clinical components.
 * Map to Tailwind classes via Tailwind's spacing system (already standard).
 */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/**
 * Motion tokens — same easings used by Framer Motion animations.
 */
export const motion = {
  easeOut: [0.16, 1, 0.3, 1] as const,
  easeOutQuint: [0.22, 1, 0.36, 1] as const,
  easeInOut: [0.65, 0, 0.35, 1] as const,
  durations: {
    fast: 0.15,
    base: 0.25,
    slow: 0.4,
    slower: 0.6,
  },
} as const;

/**
 * Severity map for clinical alerts. Use in <ClinicalAlert /> and friends.
 */
export const severity = {
  critical: {
    color: "code-red",
    bg: "code-red-bg",
    label: "Crítico",
  },
  warning: {
    color: "code-amber",
    bg: "code-amber-bg",
    label: "Atención",
  },
  success: {
    color: "code-green",
    bg: "code-green-bg",
    label: "Estable",
  },
  info: {
    color: "accent",
    bg: "accent-soft",
    label: "Información",
  },
} as const;
export type Severity = keyof typeof severity;
