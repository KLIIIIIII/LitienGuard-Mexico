"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Stethoscope, Smile, Building2, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

type Solucion = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const SOLUCIONES: Solucion[] = [
  {
    href: "/medicos",
    label: "Médicos",
    description:
      "Scribe ambient, cerebro clínico curado y loop de calidad sobre tus propias consultas.",
    icon: Stethoscope,
  },
  {
    href: "/dentistas",
    label: "Dentistas",
    description:
      "Notas SOAP ambient, planes de tratamiento estructurados y validación de seguros dentales.",
    icon: Smile,
  },
  {
    href: "/hospitales",
    label: "Hospitales",
    description:
      "Validación de pólizas, predicción de denegaciones y EHR ligero compatible con la Reforma 2026.",
    icon: Building2,
  },
  {
    href: "/pacientes",
    label: "Pacientes",
    description:
      "Sabe qué hacer ante un síntoma, qué cubre tu seguro y dónde te conviene atenderte.",
    icon: Heart,
  },
];

export function SolucionesMenu() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearCloseTimer() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function onEnter() {
    clearCloseTimer();
    setOpen(true);
  }

  function onLeave() {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-1 text-body-sm font-medium transition-colors ${
          open ? "text-accent" : "text-ink-muted hover:text-accent"
        }`}
      >
        Soluciones
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2.2}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.18 } }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-[72px] z-40"
          >
            {/* Backdrop to catch hovers leaving the menu */}
            <div
              className="absolute inset-0 -z-10 bg-canvas/0"
              onMouseEnter={onEnter}
            />
            <div className="border-b border-line bg-surface/98 backdrop-blur-sm shadow-deep">
              <div className="lg-shell py-7">
                <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                  Una plataforma · varias audiencias
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {SOLUCIONES.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <motion.div
                        key={s.href}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.06 + i * 0.08,
                          duration: 0.32,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <Link
                          href={s.href}
                          onClick={() => setOpen(false)}
                          className="group flex h-full flex-col gap-2 rounded-xl border border-line bg-surface px-4 py-4 transition-all hover:border-validation hover:bg-validation-soft/40 hover:shadow-lift"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-validation-soft text-validation group-hover:bg-validation group-hover:text-surface">
                              <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                            </span>
                            <span className="text-body-sm font-semibold text-ink-strong">
                              {s.label}
                            </span>
                          </div>
                          <p className="text-caption leading-relaxed text-ink-muted">
                            {s.description}
                          </p>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
