"use client";

import { useEffect, useState } from "react";
import { Quote, BookOpen } from "lucide-react";
import type { CanonicalPattern } from "@/lib/patterns/canonical-patterns";
import { PatternHeatmap } from "./pattern-heatmap";

interface Props {
  patterns: CanonicalPattern[];
  initialPatternId: string;
}

const CATEGORY_LABEL: Record<CanonicalPattern["category"], string> = {
  cardio: "Cardio",
  endocrino: "Endocrino",
  neuro: "Neuro",
  infecto: "Infecto",
  onco: "Onco",
  psiq: "Psiq",
};

const CATEGORY_COLOR: Record<CanonicalPattern["category"], string> = {
  cardio: "text-rose border-rose-soft bg-rose-soft/40",
  endocrino: "text-warn border-warn-soft bg-warn-soft/40",
  neuro: "text-validation border-validation-soft bg-validation-soft/40",
  infecto: "text-ink-strong border-line bg-surface-alt",
  onco: "text-rose border-rose-soft bg-rose-soft/40",
  psiq: "text-validation border-validation-soft bg-validation-soft/40",
};

export function PatternsClient({ patterns, initialPatternId }: Props) {
  const [activeId, setActiveId] = useState(initialPatternId);

  // Persist en URL para compartir y deep-link
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("p", activeId);
    window.history.replaceState(null, "", url.toString());
  }, [activeId]);

  const active = patterns.find((p) => p.id === activeId) ?? patterns[0]!;

  return (
    <div className="space-y-5">
      {/* Selector horizontal */}
      <div className="overflow-x-auto -mx-2 px-2 pb-1">
        <div className="flex gap-2 min-w-max">
          {patterns.map((p) => {
            const isActive = p.id === activeId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActiveId(p.id)}
                className={`group rounded-lg border px-3 py-2 text-left transition-all ${
                  isActive
                    ? "border-validation bg-validation-soft/40 shadow-sm"
                    : "border-line bg-surface hover:border-ink-quiet hover:bg-surface-alt"
                }`}
              >
                <div
                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-[0.58rem] uppercase tracking-eyebrow font-semibold border ${CATEGORY_COLOR[p.category]}`}
                >
                  {CATEGORY_LABEL[p.category]}
                </div>
                <p
                  className={`mt-1.5 text-caption font-semibold leading-tight ${
                    isActive ? "text-ink-strong" : "text-ink-muted group-hover:text-ink-strong"
                  }`}
                >
                  {p.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active pattern */}
      <article className="space-y-5">
        <header className="space-y-3 rounded-xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div
              className={`shrink-0 inline-flex items-center rounded px-2 py-0.5 text-caption uppercase tracking-eyebrow font-semibold border ${CATEGORY_COLOR[active.category]}`}
            >
              {CATEGORY_LABEL[active.category]}
            </div>
            <h2 className="text-h2 font-semibold tracking-tight text-ink-strong leading-tight">
              {active.name}
            </h2>
          </div>
          <p className="text-body-sm text-ink-strong leading-relaxed max-w-3xl">
            {active.summary}
          </p>
        </header>

        <PatternHeatmap pattern={active} />

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface-alt/40 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Quote className="h-3.5 w-3.5 text-ink-soft" strokeWidth={2} />
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Razonamiento clínico
              </p>
            </div>
            <p className="text-caption text-ink-strong leading-relaxed">
              {active.rationale}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-surface-alt/40 p-5">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-3.5 w-3.5 text-ink-soft" strokeWidth={2} />
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Fuente primaria
              </p>
            </div>
            <p className="text-caption text-ink-strong leading-relaxed font-mono">
              {active.primarySource}
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}
