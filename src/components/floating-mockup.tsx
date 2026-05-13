"use client";

import { motion } from "framer-motion";
import { Eyebrow } from "@/components/eyebrow";

export function FloatingMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full"
    >
      <motion.div
        animate={{
          y: [0, -8, 0],
          rotateY: [0, 1.5, 0],
        }}
        transition={{
          duration: 7,
          ease: "easeInOut",
          repeat: Infinity,
        }}
        style={{ transformStyle: "preserve-3d", transformPerspective: 1400 }}
        className="relative rounded-3xl border border-line bg-surface/90 p-6 shadow-deep backdrop-blur"
      >
        {/* Top header strip */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center">
            <span className="text-caption font-medium text-ink-strong">
              Consulta · DM2
            </span>
          </div>
          <span className="text-caption text-ink-soft">v0.5</span>
        </div>

        {/* Question */}
        <div className="mt-4">
          <Eyebrow tone="validation">Pregunta clínica</Eyebrow>
          <p className="mt-2 text-body-sm font-medium text-ink-strong">
            Paciente DM2 con HbA1c 9.2% y ERC etapa 3a — qué iniciar
          </p>
        </div>

        {/* Citation card */}
        <div className="mt-4 rounded-xl border border-line-soft bg-surface-alt p-4">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-validation text-[10px] font-bold text-canvas">
              ✓
            </span>
            <div>
              <p className="text-caption font-semibold text-ink-strong">
                IMSS-718 · Pág. 24
              </p>
              <p className="mt-1 text-caption leading-snug text-ink-muted">
                Iniciar SGLT2i con beneficio renal (empagliflozina o
                dapagliflozina). Recomendación fuerte (NICE A).
              </p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { k: "Fuerza", v: "A" },
            { k: "Página", v: "24" },
            { k: "Fuente", v: "IMSS" },
          ].map((s) => (
            <div
              key={s.k}
              className="rounded-lg border border-line-soft bg-canvas px-2.5 py-2"
            >
              <p className="text-[10px] uppercase tracking-eyebrow text-ink-soft">
                {s.k}
              </p>
              <p className="mt-0.5 text-body-sm font-semibold text-ink-strong">
                {s.v}
              </p>
            </div>
          ))}
        </div>

        {/* CTA bar */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-accent px-4 py-2.5">
          <span className="text-caption font-medium text-canvas">
            Marcar como recomendación
          </span>
          <span className="text-caption text-canvas/70">⏎</span>
        </div>
      </motion.div>

      {/* Floating accent halo */}
      <div
        aria-hidden
        className="absolute -inset-4 -z-10 rounded-[32px] bg-gradient-to-br from-accent-soft via-validation-soft to-transparent opacity-60 blur-2xl"
      />
    </motion.div>
  );
}
