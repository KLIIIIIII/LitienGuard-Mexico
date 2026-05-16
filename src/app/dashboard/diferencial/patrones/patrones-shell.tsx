"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, GraduationCap } from "lucide-react";
import type { CanonicalPattern } from "@/lib/patterns/canonical-patterns";
import type { PersonalPatterns } from "@/lib/patterns/detect-personal";
import { YourPatterns } from "./your-patterns";
import { PatternsClient } from "./patterns-client";
import { OnboardingModal } from "./onboarding-modal";

type Tab = "tuyos" | "canonicos";

interface Props {
  defaultTab: Tab;
  autoOpenTour: boolean;
  personalPatterns: PersonalPatterns;
  canonicalPatterns: CanonicalPattern[];
  initialCanonicalId: string;
}

const easeOut: number[] = [0.16, 1, 0.3, 1];

export function PatronesShell({
  defaultTab,
  autoOpenTour,
  personalPatterns,
  canonicalPatterns,
  initialCanonicalId,
}: Props) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  // Sync tab a URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url.toString());
  }, [tab]);

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center justify-between gap-3 border-b border-line">
        <div role="tablist" className="flex gap-1">
          <TabButton
            active={tab === "tuyos"}
            onClick={() => setTab("tuyos")}
            icon={Activity}
            label="Tus patrones"
            count={
              personalPatterns.hasEnoughData
                ? personalPatterns.total
                : undefined
            }
          />
          <TabButton
            active={tab === "canonicos"}
            onClick={() => setTab("canonicos")}
            icon={GraduationCap}
            label="Referencia académica"
            count={canonicalPatterns.length}
          />
        </div>
        <OnboardingModal autoOpen={autoOpenTour} />
      </div>

      {/* Tab content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easeOut }}
      >
        {tab === "tuyos" ? (
          <YourPatterns patterns={personalPatterns} />
        ) : (
          <PatternsClient
            patterns={canonicalPatterns}
            initialPatternId={initialCanonicalId}
          />
        )}
      </motion.div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Activity;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`group relative inline-flex items-center gap-2 px-4 py-2.5 text-body-sm font-semibold transition-colors ${
        active
          ? "text-ink-strong"
          : "text-ink-muted hover:text-ink-strong"
      }`}
    >
      <Icon
        className={`h-4 w-4 ${active ? "text-validation" : "text-ink-quiet group-hover:text-ink-muted"}`}
        strokeWidth={2.2}
      />
      {label}
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold tabular-nums ${
            active
              ? "bg-validation-soft text-validation"
              : "bg-surface-alt text-ink-quiet"
          }`}
        >
          {count}
        </span>
      )}
      {active && (
        <motion.span
          layoutId="patrones-tab-underline"
          className="absolute -bottom-px left-2 right-2 h-0.5 bg-validation"
          transition={{ duration: 0.4, ease: easeOut }}
        />
      )}
    </button>
  );
}
