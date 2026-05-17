"use client";

import {
  useEffect,
  useState,
  useTransition,
  useCallback,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Mic,
  LayoutDashboard,
  TrendingUp,
  Siren,
  RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  markTourComplete,
  markTourSkipped,
  resetTour,
} from "@/app/dashboard/tour/actions";

/* ============================================================
   Tour steps definition
   ============================================================ */
type TourStep = {
  selector: string | null;
  icon: LucideIcon;
  title: string;
  body: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
};

const STEPS: TourStep[] = [
  {
    selector: null,
    icon: Sparkles,
    title: "Bienvenido a LitienGuard",
    body: "Te muestro en 90 segundos cómo está organizado todo. Puedes saltarlo cuando quieras y reactivarlo desde el dashboard.",
    placement: "center",
  },
  {
    selector: '[data-tour="header"]',
    icon: LayoutDashboard,
    title: "Tu panel personal",
    body: "Aquí ves tu nombre, plan activo y un acceso rápido al CTA principal. El plan determina qué funciones tienes disponibles.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="cta-primary"]',
    icon: Mic,
    title: "Acción primaria",
    body: "Tu botón más importante: crear una nueva nota. Si tienes Scribe, graba la consulta y obtienes el SOAP estructurado en segundos.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="kpis"]',
    icon: TrendingUp,
    title: "Tus números clave",
    body: "Notas totales, firmadas y consumo del mes. Diseñado para verlo de un vistazo (top row del patrón F).",
    placement: "bottom",
  },
  {
    selector: '[data-tour="quick-actions"]',
    icon: Sparkles,
    title: "Tu día",
    body: "Las 3 acciones más frecuentes: nueva nota, diferencial y consultas. Todo lo demás vive en la barra lateral izquierda.",
    placement: "bottom",
  },
  {
    selector: "[data-tour-sidebar]",
    icon: Siren,
    title: "Workflows hospitalarios",
    body: "Urgencias, Quirófano, UCI, Laboratorio y Radiología — cada uno con su patrón Cerner-style. En desktop están en la barra lateral; en móvil ábrelos desde el menú.",
    placement: "right",
  },
  {
    selector: null,
    icon: Sparkles,
    title: "¡Listo!",
    body: "Ya tienes el mapa mental. Empieza creando tu primera nota o explora los workflows hospitalarios. Si necesitas repetir el tour, hay un botón en el dashboard.",
    placement: "center",
  },
];

const STORAGE_KEY = "lg-tour-dismissed";

export function WelcomeTour({
  autoStart = false,
  tourCompleted = false,
}: {
  autoStart?: boolean;
  tourCompleted?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [localCompleted, setLocalCompleted] = useState(tourCompleted);
  const [, startTransition] = useTransition();

  // Auto-start solo si autoStart=true Y no completado/dismissado en sesión
  useEffect(() => {
    if (!autoStart || tourCompleted) return;
    if (typeof window === "undefined") return;
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [autoStart, tourCompleted]);

  const step = STEPS[stepIdx];

  // Compute target rect — recompute en resize/scroll
  useEffect(() => {
    if (!open || !step) return;
    if (!step.selector) {
      setTargetRect(null);
      return;
    }
    const tryFind = () => {
      // querySelectorAll so we can pick the first VISIBLE match. The same
      // data attribute is used on both the desktop sidebar (display:none
      // on mobile) and the mobile menu button (display:none on desktop).
      const els = document.querySelectorAll(step.selector!);
      let visibleRect: DOMRect | null = null;
      for (const el of Array.from(els)) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          visibleRect = r;
          break;
        }
      }
      setTargetRect(visibleRect);
    };
    tryFind();
    const onResize = () => tryFind();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    // Re-measure after a tick (gives layout time to settle after scroll)
    const t = setTimeout(tryFind, 50);
    const t2 = setTimeout(tryFind, 400);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [open, step, stepIdx]);

  // Scroll target into view smoothly
  useEffect(() => {
    if (!open || !step?.selector) return;
    const el = document.querySelector(step.selector);
    if (el && "scrollIntoView" in el) {
      (el as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [open, step]);

  const next = useCallback(() => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      setOpen(false);
      sessionStorage.setItem(STORAGE_KEY, "1");
      setLocalCompleted(true);
      startTransition(async () => {
        await markTourComplete();
      });
    }
  }, [stepIdx]);

  const prev = useCallback(() => {
    setStepIdx((i) => Math.max(0, i - 1));
  }, []);

  const skip = useCallback(() => {
    setOpen(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
    startTransition(async () => {
      await markTourSkipped();
    });
  }, []);

  const startFresh = useCallback(() => {
    setStepIdx(0);
    sessionStorage.removeItem(STORAGE_KEY);
    setLocalCompleted(false);
    setOpen(true);
    // Si ya estaba completado, reseteamos el flag en BD para que vuelva
    // a contar como nuevo replay.
    if (localCompleted) {
      startTransition(async () => {
        await resetTour();
      });
    }
  }, [localCompleted]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev, skip]);

  if (!open) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-lg bg-validation-soft/40 p-2 text-validation shrink-0">
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-ink-strong">
              {localCompleted
                ? "Repetir el tour guiado"
                : "¿Primera vez?"}
            </p>
            <p className="text-caption text-ink-muted">
              {localCompleted
                ? "Vuelve a recorrer las secciones principales del dashboard."
                : "Tour guiado de 90 segundos por las secciones principales."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={startFresh}
          className="lg-cta-primary inline-flex items-center gap-2 text-caption shrink-0"
        >
          {localCompleted ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.4} />
              Repetir tour
            </>
          ) : (
            <>
              Empezar tour
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.4} />
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <TourOverlay
      step={step!}
      stepIdx={stepIdx}
      totalSteps={STEPS.length}
      targetRect={targetRect}
      onNext={next}
      onPrev={prev}
      onSkip={skip}
    />
  );
}

/* ============================================================
   Overlay con spotlight (SVG mask + Gaussian blur soft edge)
   ============================================================ */
function TourOverlay({
  step,
  stepIdx,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onSkip,
}: {
  step: TourStep;
  stepIdx: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}) {
  const Icon = step.icon;
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === totalSteps - 1;

  const PADDING = 14;
  const RADIUS = 16;
  const spotlight = targetRect
    ? {
        top: Math.max(0, targetRect.top - PADDING),
        left: Math.max(0, targetRect.left - PADDING),
        width: targetRect.width + PADDING * 2,
        height: targetRect.height + PADDING * 2,
      }
    : null;

  // Use center layout when explicitly requested OR when the target wasn't
  // found (e.g. sidebar selector on mobile where the sidebar is hidden).
  const useCenterLayout = step.placement === "center" || !targetRect;
  const tooltipPosition = useCenterLayout
    ? null
    : computeTooltipPosition(targetRect, step.placement);

  const cardContent = (
    <>
      <button
        type="button"
        onClick={onSkip}
        aria-label="Saltar tour"
        className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink-strong"
      >
        <X className="h-4 w-4" strokeWidth={2.2} />
      </button>

      <div className="flex items-center gap-2.5 pr-9">
        <div className="rounded-lg bg-validation-soft/40 p-1.5 text-validation shrink-0">
          <Icon className="h-4 w-4" strokeWidth={2.2} />
        </div>
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
          Paso {stepIdx + 1} de {totalSteps}
        </p>
      </div>

      <h3 className="mt-3 text-h3 font-semibold tracking-tight text-ink-strong">
        {step.title}
      </h3>
      <p className="mt-1.5 text-body-sm text-ink-muted leading-relaxed">
        {step.body}
      </p>

      <div className="mt-4 flex items-center gap-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i === stepIdx
                ? "bg-validation"
                : i < stepIdx
                  ? "bg-validation/40"
                  : "bg-line"
            }`}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="text-caption font-medium text-ink-muted hover:text-ink-strong"
        >
          Saltar tour
        </button>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              type="button"
              onClick={onPrev}
              className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-caption font-semibold text-ink-strong hover:border-line-strong"
            >
              <ChevronLeft className="h-3 w-3" strokeWidth={2.4} />
              Atrás
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="lg-cta-primary inline-flex items-center gap-1 text-caption"
          >
            {isLast ? "Terminar" : "Siguiente"}
            {!isLast && (
              <ChevronRight className="h-3 w-3" strokeWidth={2.4} />
            )}
          </button>
        </div>
      </div>
    </>
  );

  const cardClasses =
    "pointer-events-auto relative w-[min(92vw,22rem)] max-h-[85vh] overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-deep";

  return (
    <AnimatePresence>
      <motion.div
        key="tour-overlay"
        className="fixed inset-0 z-[100]"
        role="dialog"
        aria-modal="true"
        aria-label={`Paso ${stepIdx + 1} de ${totalSteps}: ${step.title}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* SVG dim layer with soft-edge spotlight cutout */}
        {spotlight ? (
          <SoftSpotlight rect={spotlight} radius={RADIUS} />
        ) : (
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" />
        )}

        {/* Soft ring + halo around the target */}
        {spotlight && (
          <>
            <motion.div
              key={`halo-${stepIdx}`}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute pointer-events-none"
              style={{
                top: spotlight.top - 6,
                left: spotlight.left - 6,
                width: spotlight.width + 12,
                height: spotlight.height + 12,
                borderRadius: RADIUS + 6,
                boxShadow:
                  "0 0 0 1px rgba(74, 107, 91, 0.55), 0 0 0 6px rgba(74, 107, 91, 0.18), 0 16px 48px rgba(74, 107, 91, 0.22)",
              }}
            />
            {/* Slow pulse hint to draw the eye */}
            <motion.div
              key={`pulse-${stepIdx}`}
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.08 }}
              transition={{
                duration: 2,
                ease: "easeOut",
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="absolute pointer-events-none ring-1 ring-validation/50"
              style={{
                top: spotlight.top,
                left: spotlight.left,
                width: spotlight.width,
                height: spotlight.height,
                borderRadius: RADIUS,
              }}
            />
          </>
        )}

        {/* Tooltip card — flex-centered when center mode, absolute when anchored */}
        {useCenterLayout ? (
          <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              key={`tooltip-${stepIdx}`}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={cardClasses}
            >
              {cardContent}
            </motion.div>
          </div>
        ) : (
          <motion.div
            key={`tooltip-${stepIdx}`}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={tooltipPosition ?? undefined}
            className={`absolute ${cardClasses}`}
          >
            {cardContent}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ============================================================
   SoftSpotlight — SVG mask con feGaussianBlur para soft edges
   ============================================================ */
function SoftSpotlight({
  rect,
  radius,
}: {
  rect: { top: number; left: number; width: number; height: number };
  radius: number;
}) {
  const maskId = "lg-spot-mask";
  const filterId = "lg-spot-blur";

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter
          id={filterId}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <mask id={maskId}>
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <motion.rect
            initial={false}
            animate={{
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
            }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 32,
              mass: 0.8,
            }}
            rx={radius}
            ry={radius}
            fill="black"
            filter={`url(#${filterId})`}
          />
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="rgba(11, 15, 20, 0.72)"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

/* ============================================================
   Tooltip positioning — centered horizontally on target
   ============================================================ */
function computeTooltipPosition(
  targetRect: DOMRect | null,
  placement?: "top" | "bottom" | "left" | "right" | "center",
): React.CSSProperties {
  // Center mode is handled by flex centering in the caller — this function
  // is only invoked for anchored tooltips with a real target rect.
  if (!targetRect) {
    return {};
  }

  const margin = 16;
  const gap = 18;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const tooltipW = Math.min(352, vw * 0.92);
  const tooltipH = 340;

  // Mobile: side placements never fit — collapse to bottom/top.
  const isMobile = vw < 640;
  let place = placement ?? "bottom";
  if (isMobile && (place === "left" || place === "right")) {
    place = "bottom";
  }

  // Center horizontal on target
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  // Auto-flip placement based on available space
  const spaceBelow = vh - targetRect.bottom;
  const spaceAbove = targetRect.top;
  const spaceRight = vw - targetRect.right;
  const spaceLeft = targetRect.left;

  if (place === "bottom" && spaceBelow < tooltipH + gap && spaceAbove > spaceBelow) {
    place = "top";
  } else if (place === "top" && spaceAbove < tooltipH + gap && spaceBelow > spaceAbove) {
    place = "bottom";
  } else if (place === "right" && spaceRight < tooltipW + gap && spaceLeft > spaceRight) {
    place = "left";
  } else if (place === "left" && spaceLeft < tooltipW + gap && spaceRight > spaceLeft) {
    place = "right";
  }

  let top = 0;
  let left = 0;

  if (place === "bottom" || place === "top") {
    // Horizontal: center on target, clamped to viewport
    left = Math.max(
      margin,
      Math.min(vw - tooltipW - margin, targetCenterX - tooltipW / 2),
    );
    if (place === "bottom") {
      top = Math.min(vh - tooltipH - margin, targetRect.bottom + gap);
    } else {
      top = Math.max(margin, targetRect.top - tooltipH - gap);
    }
  } else {
    // Side placement: center vertically on target
    top = Math.max(
      margin,
      Math.min(vh - tooltipH - margin, targetCenterY - tooltipH / 2),
    );
    if (place === "right") {
      left = Math.min(vw - tooltipW - margin, targetRect.right + gap);
    } else {
      left = Math.max(margin, targetRect.left - tooltipW - gap);
    }
  }

  return { top, left };
}
