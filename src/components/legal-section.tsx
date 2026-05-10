import type { ReactNode } from "react";

interface LegalSectionProps {
  number: string;
  title: string;
  children: ReactNode;
}

export function LegalSection({ number, title, children }: LegalSectionProps) {
  return (
    <section className="border-t border-line py-10">
      <div className="grid gap-6 md:grid-cols-[120px_1fr]">
        <p className="text-caption font-mono font-semibold tracking-eyebrow text-ink-soft">
          {number}
        </p>
        <div>
          <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
            {title}
          </h2>
          <div className="prose-legal mt-4 max-w-prose space-y-4 text-body-sm leading-relaxed text-ink-muted">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
