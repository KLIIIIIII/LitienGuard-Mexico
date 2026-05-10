import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FBFAF6",
        surface: "#FFFFFF",
        "surface-alt": "#F4F2EB",
        "surface-deep": "#ECE9DF",
        ink: "#1F1E1B",
        "ink-strong": "#2C2B27",
        "ink-muted": "#57554F",
        "ink-soft": "#8B887F",
        "ink-quiet": "#B5B2A8",
        line: "#E5E2DA",
        "line-soft": "#EFECE3",
        "line-strong": "#C9C4B8",
        accent: "#2D3E50",
        "accent-deep": "#1F2D3D",
        "accent-soft": "#E8ECF0",
        validation: "#4A6B5B",
        "validation-soft": "#E5EDE8",
        warn: "#8B6B3A",
        "warn-soft": "#F0E9DC",
        rose: "#8E4A52",
        "rose-soft": "#F0E1E2",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
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
        soft: "0 1px 2px rgba(31, 30, 27, 0.04), 0 4px 14px rgba(31, 30, 27, 0.04)",
        lift: "0 6px 24px rgba(31, 30, 27, 0.08), 0 2px 6px rgba(31, 30, 27, 0.04)",
        deep: "0 18px 48px rgba(31, 30, 27, 0.12), 0 4px 12px rgba(31, 30, 27, 0.06)",
        glass:
          "0 12px 36px rgba(31, 30, 27, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
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
