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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  markTourComplete,
  markTourSkipped,
} from "@/app/dashboard/tour/actions";

/* ============================================================
   Tour steps definition
   Cada step apunta a un selector CSS — el spotlight aparece sobre
   el elemento. Diseñado siguiendo lineamientos de Whatfix / AbleTo:
   - Skippable desde primer click
   - Cada step ≤ 80 palabras
   - Steps secuenciales tipo journey, no random
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
    body: "Te muestro en 90 segundos cómo está organizado todo. Puedes saltarlo cuando quieras y reactivarlo desde Configuración.",
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
    selector: '[data-tour-sidebar]',
    icon: Siren,
    title: "Barra lateral · Workflows",
    body: "Aquí están los módulos hospitalarios: Urgencias, Quirófano, UCI, Laboratorio, Radiología. Cada uno con su patrón Cerner-style.",
    placement: "right",
  },
  {
    selector: null,
    icon: Sparkles,
    title: "¡Listo!",
    body: "Ya tienes el mapa mental. Empieza creando tu primera nota o explora los workflows hospitalarios. Si necesitas repetir el tour, ve a Configuración.",
    placement: "center",
  },
];

const STORAGE_KEY = "lg-tour-dismissed";

export function WelcomeTour({
  autoStart = false,
}: {
  autoStart?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [, startTransition] = useTransition();

  // Auto-start si el flag lo pide y nunca lo dismissó
  useEffect(() => {
    if (!autoStart) return;
    if (typeof window === "undefined") return;
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed) return;
    // Small delay so the page renders first
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [autoStart]);

  const step = STEPS[stepIdx];

  // Compute target rect for spotlight
  useEffect(() => {
    if (!open || !step) return;
    if (!step.selector) {
      setTargetRect(null);
      return;
    }
    const tryFind = () => {
      const el = document.querySelector(step.selector!);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };
    tryFind();
    // Re-compute on resize / scroll
    const onResize = () => tryFind();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, step]);

  // Scroll the target into view smoothly
  useEffect(() => {
    if (!open || !step?.selector) return;
    const el = document.querySelector(step.selector);
    if (el && "scrollIntoView" in el) {
      (el as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [open, step]);

  const next = useCallback(() => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx((i) => i + 1);
    } else {
      // Last step → complete
      setOpen(false);
      sessionStorage.setItem(STORAGE_KEY, "1");
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

  // CTA card when NOT open — invitation to start the tour
  if (!open) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-validation-soft/40 p-2 text-validation">
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-body-sm font-semibold text-ink-strong">
              ¿Primera vez?
            </p>
            <p className="text-caption text-ink-muted">
              Tour guiado de 90 segundos por las secciones principales.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setStepIdx(0);
            setOpen(true);
          }}
          className="lg-cta-primary inline-flex items-center gap-2 text-caption"
        >
          Empezar tour
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.4} />
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
   Overlay con spotlight + tooltip
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

  const padding = 8;
  const spotlightRect = targetRect
    ? {
        top: Math.max(0, targetRect.top - padding),
        left: Math.max(0, targetRect.left - padding),
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
      }
    : null;

  // Position the tooltip near the target
  const tooltipPosition = computeTooltipPosition(targetRect, step.placement);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100]"
        role="dialog"
        aria-modal="true"
        aria-label={`Paso ${stepIdx + 1} de ${totalSteps}: ${step.title}`}
      >
        {/* Backdrop with spotlight cutout */}
        {spotlightRect ? (
          <>
            {/* 4 dim rectangles around the spotlight */}
            <DimRect
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: spotlightRect.top,
              }}
            />
            <DimRect
              style={{
                top: spotlightRect.top + spotlightRect.height,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <DimRect
              style={{
                top: spotlightRect.top,
                left: 0,
                width: spotlightRect.left,
                height: spotlightRect.height,
              }}
            />
            <DimRect
              style={{
                top: spotlightRect.top,
                left: spotlightRect.left + spotlightRect.width,
                right: 0,
                height: spotlightRect.height,
              }}
            />
            {/* Spotlight ring */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute pointer-events-none rounded-xl ring-2 ring-validation"
              style={{
                top: spotlightRect.top,
                left: spotlightRect.left,
                width: spotlightRect.width,
                height: spotlightRect.height,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
              }}
            />
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
          />
        )}

        {/* Tooltip card */}
        <motion.div
          key={stepIdx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={tooltipPosition}
          className="absolute max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-deep"
        >
          <button
            type="button"
            onClick={onSkip}
            aria-label="Saltar tour"
            className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-alt hover:text-ink-strong"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-validation-soft/40 p-1.5 text-validation">
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

          {/* Step indicators */}
          <div className="mt-4 flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i === stepIdx
                    ? "bg-validation"
                    : i < stepIdx
                      ? "bg-validation/40"
                      : "bg-line"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-4 flex items-center justify-between gap-2">
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function DimRect({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="absolute bg-ink/50 backdrop-blur-sm pointer-events-auto"
      style={style}
    />
  );
}

function computeTooltipPosition(
  targetRect: DOMRect | null,
  placement?: "top" | "bottom" | "left" | "right" | "center",
): React.CSSProperties {
  if (!targetRect || placement === "center") {
    return {
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  }

  const margin = 16;
  const tooltipW = 384; // max-w-sm
  const tooltipH = 240; // approx
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  let top: number | undefined;
  let left: number | undefined;
  let right: number | undefined;
  let bottom: number | undefined;

  // Default: try below the target
  const place = placement ?? "bottom";

  if (place === "bottom") {
    top = Math.min(
      vh - tooltipH - margin,
      targetRect.bottom + margin,
    );
    left = Math.min(
      vw - tooltipW - margin,
      Math.max(margin, targetRect.left),
    );
  } else if (place === "top") {
    top = Math.max(margin, targetRect.top - tooltipH - margin);
    left = Math.min(
      vw - tooltipW - margin,
      Math.max(margin, targetRect.left),
    );
  } else if (place === "right") {
    top = Math.min(
      vh - tooltipH - margin,
      Math.max(margin, targetRect.top),
    );
    left = Math.min(
      vw - tooltipW - margin,
      targetRect.right + margin,
    );
  } else if (place === "left") {
    top = Math.min(
      vh - tooltipH - margin,
      Math.max(margin, targetRect.top),
    );
    right = vw - targetRect.left + margin;
  }

  const style: React.CSSProperties = {};
  if (top !== undefined) style.top = top;
  if (left !== undefined) style.left = left;
  if (right !== undefined) style.right = right;
  if (bottom !== undefined) style.bottom = bottom;
  return style;
}
