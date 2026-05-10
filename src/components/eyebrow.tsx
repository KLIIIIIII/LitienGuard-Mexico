import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

const eyebrowVariants = cva(
  "text-eyebrow font-semibold uppercase tracking-eyebrow",
  {
    variants: {
      tone: {
        muted: "text-ink-soft",
        validation: "text-validation",
        accent: "text-accent",
        warn: "text-warn",
        rose: "text-rose",
      },
    },
    defaultVariants: {
      tone: "muted",
    },
  },
);

export interface EyebrowProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof eyebrowVariants> {}

export function Eyebrow({ className, tone, children, ...rest }: EyebrowProps) {
  return (
    <span className={cn(eyebrowVariants({ tone }), className)} {...rest}>
      {children}
    </span>
  );
}
