import type { ReactNode } from "react";
import { Eyebrow } from "@/components/eyebrow";

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
  variant?: "canvas" | "alt" | "soft";
}

const VARIANTS = {
  canvas: "bg-canvas",
  alt: "bg-surface-alt",
  soft: "bg-validation-soft",
} as const;

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  variant = "canvas",
}: PageHeroProps) {
  return (
    <section
      className={`border-b border-line ${VARIANTS[variant]} py-20 md:py-24`}
    >
      <div className="lg-shell">
        <Eyebrow tone="validation">{eyebrow}</Eyebrow>
        <h1 className="mt-4 max-w-3xl text-h1 font-semibold tracking-tight text-ink-strong md:text-display">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-body text-ink-muted md:text-[1.02rem]">
            {description}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
