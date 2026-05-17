import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-alt": "rgb(var(--surface-alt) / <alpha-value>)",
        "surface-deep": "rgb(var(--surface-deep) / <alpha-value>)",
        "surface-elevated": "rgb(var(--surface-elevated) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-strong": "rgb(var(--ink-strong) / <alpha-value>)",
        "ink-muted": "rgb(var(--ink-muted) / <alpha-value>)",
        "ink-soft": "rgb(var(--ink-soft) / <alpha-value>)",
        "ink-quiet": "rgb(var(--ink-quiet) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        "line-soft": "rgb(var(--line-soft) / <alpha-value>)",
        "line-strong": "rgb(var(--line-strong) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-deep": "rgb(var(--accent-deep) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        validation: "rgb(var(--validation) / <alpha-value>)",
        "validation-soft": "rgb(var(--validation-soft) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)",
        "warn-soft": "rgb(var(--warn-soft) / <alpha-value>)",
        rose: "rgb(var(--rose) / <alpha-value>)",
        "rose-soft": "rgb(var(--rose-soft) / <alpha-value>)",
        "code-red": "rgb(var(--code-red) / <alpha-value>)",
        "code-red-bg": "rgb(var(--code-red-bg) / <alpha-value>)",
        "code-amber": "rgb(var(--code-amber) / <alpha-value>)",
        "code-amber-bg": "rgb(var(--code-amber-bg) / <alpha-value>)",
        "code-green": "rgb(var(--code-green) / <alpha-value>)",
        "code-green-bg": "rgb(var(--code-green-bg) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        eyebrow: ["0.72rem", { lineHeight: "1.1" }],
        caption: ["0.78rem", { lineHeight: "1.3" }],
        "body-sm": ["0.86rem", { lineHeight: "1.55" }],
        body: ["0.94rem", { lineHeight: "1.6" }],
        h4: ["0.95rem", { lineHeight: "1.4" }],
        h3: ["1.08rem", { lineHeight: "1.35" }],
        h2: ["1.4rem", { lineHeight: "1.25" }],
        h1: ["2rem", { lineHeight: "1.15" }],
        display: ["2.4rem", { lineHeight: "1.08" }],
      },
      letterSpacing: {
        eyebrow: "0.11em",
        tight: "-0.022em",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        lift: "var(--shadow-lift)",
        deep: "var(--shadow-deep)",
        glass: "var(--shadow-glass)",
      },
      maxWidth: {
        prose: "62ch",
        shell: "1180px",
      },
      transitionTimingFunction: {
        "out-quint": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
