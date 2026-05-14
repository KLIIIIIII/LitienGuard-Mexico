"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AuroraMesh } from "@/components/aurora-mesh";
import { HeroProductVisual } from "@/components/hero-product-visual";

/**
 * Hero — diseño editorial institucional, centrado.
 *
 * Principios:
 *   · Proporción áurea (φ=1.618) en spacing (21 → 34 → 55 → 89 → 144).
 *   · Tipografía dual: sans-bold + serif italic.
 *   · Una declaración monumental centrada.
 *   · Stats editoriales con tipografía monumental + separadores hairline.
 *   · Aurora mesh visible y dinámica (sin pill animado).
 */

const FADE = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};
const EASE = [0.22, 1, 0.36, 1] as const;

const STATS = [
  {
    number: "6.1 años",
    label:
      "Tarda diagnosticarse ATTR-CM hoy. El diferencial bayesiano de LitienGuard la sugiere en la primera consulta.",
    sub: "Mayo Clin Proc 2021",
  },
  {
    number: "49 min/día",
    label:
      "Lo que recuperan médicos usando ambient scribes. Exactamente lo que LitienGuard Scribe te da.",
    sub: "JAMA Network Open 2024",
  },
  {
    number: "17 años",
    label:
      "Tarda la evidencia clínica nueva en llegar al consultorio. El cerebro de LitienGuard cita guías 2024-2025 al momento.",
    sub: "Balas & Boren · IOM",
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-canvas">
      <div className="absolute inset-0">
        <AuroraMesh />
      </div>

      <div className="lg-shell relative pt-[89px] pb-[55px] sm:pt-[120px] lg:pt-[144px] lg:pb-[89px]">
        {/* Editorial column centrada — ancho 1/φ */}
        <div className="mx-auto max-w-[62ch] text-center">
          {/* Eyebrow institucional — texto simple */}
          <motion.p
            {...FADE}
            transition={{ duration: 0.4, ease: EASE }}
            className="text-[0.72rem] uppercase tracking-[0.18em] font-semibold text-ink-muted"
          >
            LitienGuard · Inteligencia clínica y operativa
          </motion.p>

          {/* Headline monumental — sans + serif italic */}
          <motion.h1
            {...FADE}
            transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
            className="mt-[21px] text-ink leading-[1.04] tracking-[-0.02em] font-semibold"
            style={{
              fontSize: "clamp(2.625rem, 6.2vw, 4.5rem)",
            }}
          >
            Somos la inteligencia médica
            <br />
            <span className="lg-serif-italic font-normal text-validation">
              de México.
            </span>
          </motion.h1>

          {/* Subtítulo simple — 1 frase */}
          <motion.p
            {...FADE}
            transition={{ duration: 0.5, ease: EASE, delay: 0.16 }}
            className="mx-auto mt-[34px] max-w-[52ch] text-[1.0625rem] leading-[1.6] text-ink-muted sm:text-[1.3125rem] sm:leading-[1.55]"
          >
            La plataforma de inteligencia para hospitales y laboratorios —
            procesos operativos, fiscales y diagnóstico de alta complejidad.
          </motion.p>
        </div>

        {/* Stats editoriales — fila horizontal con separadores hairline */}
        <motion.div
          {...FADE}
          transition={{ duration: 0.6, ease: EASE, delay: 0.24 }}
          className="mx-auto mt-[55px] max-w-3xl"
        >
          <div className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {STATS.map((s, idx) => (
              <Stat key={idx} {...s} />
            ))}
          </div>
        </motion.div>

        {/* CTAs centrados */}
        <motion.div
          {...FADE}
          transition={{ duration: 0.5, ease: EASE, delay: 0.32 }}
          className="mt-[55px] flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="#solicita-piloto"
            className="group inline-flex items-center gap-2 rounded-full bg-ink-strong px-7 py-3.5 text-[0.95rem] font-semibold text-canvas transition-all hover:bg-ink hover:shadow-soft"
          >
            Solicitar acceso piloto
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.2}
            />
          </Link>
          <Link
            href="/medicos"
            className="inline-flex items-center gap-2 px-3 py-3.5 text-[0.95rem] font-semibold text-ink-strong hover:text-validation transition-colors"
          >
            Ver para médicos
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          </Link>
        </motion.div>

        {/* Producto visual */}
        <motion.div
          {...FADE}
          transition={{ duration: 0.7, ease: EASE, delay: 0.5 }}
          className="mt-[89px] sm:mt-[144px]"
        >
          <HeroProductVisual />
        </motion.div>

        {/* Trust line centrada */}
        <motion.p
          {...FADE}
          transition={{ duration: 0.5, ease: EASE, delay: 0.7 }}
          className="mx-auto mt-[55px] max-w-[62ch] text-center text-[0.78rem] leading-relaxed text-ink-soft"
        >
          Cerebro anclado en guías oficiales —{" "}
          <span className="text-ink-muted font-medium">
            IMSS · CENETEC · KDIGO · ESC · AHA-ACC · Sepsis-3 · Mayo Clinic ·
            Harvard Medical School
          </span>
          . Cada recomendación se entrega con la cita verbatim y el número de
          página del documento fuente.
        </motion.p>
      </div>
    </section>
  );
}

function Stat({
  number,
  label,
  sub,
}: {
  number: string;
  label: string;
  sub: string;
}) {
  return (
    <div className="px-6 py-5 sm:px-8 sm:py-2 text-center">
      <p
        className="font-bold tracking-tight tabular-nums text-ink-strong leading-none"
        style={{
          fontSize: "clamp(1.875rem, 3.4vw, 2.625rem)",
        }}
      >
        {number}
      </p>
      <p className="mt-2 text-[0.875rem] font-medium leading-snug text-ink-strong max-w-[24ch] mx-auto">
        {label}
      </p>
      <p className="mt-1 text-[0.7rem] text-ink-soft tracking-tight italic">
        {sub}
      </p>
    </div>
  );
}
