import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Eyebrow } from "@/components/eyebrow";

interface FinalCtaProps {
  eyebrow?: string;
  title: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function FinalCta({
  eyebrow = "Listo para conocer LitienGuard",
  title,
  description,
  primaryHref = "/contacto#piloto",
  primaryLabel = "Solicitar acceso piloto",
  secondaryHref = "/",
  secondaryLabel = "Volver al inicio",
}: FinalCtaProps) {
  return (
    <section className="bg-accent py-20 text-canvas">
      <div className="lg-shell text-center">
        <span className="text-eyebrow font-semibold uppercase tracking-eyebrow text-canvas/70">
          {eyebrow}
        </span>
        <h2 className="mx-auto mt-4 max-w-3xl text-h1 font-semibold tracking-tight md:text-display">
          {title}
        </h2>
        {description && (
          <p className="mx-auto mt-5 max-w-2xl text-body text-canvas/80">
            {description}
          </p>
        )}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={primaryHref}
            className="inline-flex items-center gap-2 rounded-full bg-canvas px-5 py-2.5 text-body-sm font-medium text-accent transition-all hover:bg-surface"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </Link>
          <Link
            href={secondaryHref}
            className="inline-flex items-center gap-2 rounded-full border border-canvas/30 px-5 py-2.5 text-body-sm font-medium text-canvas transition-all hover:bg-canvas/10"
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

export { Eyebrow };
