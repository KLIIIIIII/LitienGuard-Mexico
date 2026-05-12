"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AuroraMesh } from "@/components/aurora-mesh";
import { HeroProductVisual } from "@/components/hero-product-visual";

/**
 * Hero — diseño editorial institucional.
 *
 * Principios aplicados:
 *   · Proporción áurea (φ=1.618) en spacing vertical:
 *     21 → 34 → 55 → 89 → 144 px (escala Fibonacci).
 *   · Tipografía dual: sans-bold para autoridad + serif italic para
 *     gravitas editorial (Harvard / MIT / Stanford / Tec / Hospital Ángeles).
 *   · Una sola declaración monumental, no tricolon.
 *   · Whitespace dominante (1/φ del viewport).
 *   · Eyebrow sin pill, sin dot animado.
 *   · Animaciones cortas (300-500ms), no performativas.
 */

const FADE = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};
const EASE = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-canvas">
      <div className="absolute inset-0">
        <AuroraMesh />
      </div>

      {/* Spacing áureo: 144px top, 89px bottom desktop · escala reducida mobile */}
      <div className="lg-shell relative pt-[89px] pb-[55px] sm:pt-[120px] lg:pt-[144px] lg:pb-[89px]">
        {/* Editorial column — ancho 1/φ ≈ 62% */}
        <div className="max-w-[62ch]">
          {/* Eyebrow institucional — texto simple, sin pill, sin dot */}
          <motion.p
            {...FADE}
            transition={{ duration: 0.4, ease: EASE }}
            className="text-[0.72rem] uppercase tracking-[0.18em] font-semibold text-ink-muted"
          >
            LitienGuard · Para médicos en México
          </motion.p>

          {/* Headline monumental — sans-bold + serif italic en frase clave.
              Escala áurea: 55 → 68 → 89 px (clamp responsive). */}
          <motion.h1
            {...FADE}
            transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
            className="mt-[21px] text-ink leading-[1.04] tracking-[-0.02em] font-semibold"
            style={{
              fontSize: "clamp(2.625rem, 6.2vw, 4.5rem)",
            }}
          >
            La consulta,
            <br />
            <span className="lg-serif-italic font-normal text-validation">
              como debió ser.
            </span>
          </motion.h1>

          {/* Subtítulo — UNA sola frase clara. 21px desktop, leading generoso. */}
          <motion.p
            {...FADE}
            transition={{ duration: 0.5, ease: EASE, delay: 0.16 }}
            className="mt-[34px] max-w-[52ch] text-[1.0625rem] leading-[1.6] text-ink-muted sm:text-[1.3125rem] sm:leading-[1.55]"
          >
            El cerebro clínico curado en español, con cita verbatim a las
            guías oficiales de México y del mundo.
          </motion.p>

          {/* CTAs — escala 55px gap, no agresivos */}
          <motion.div
            {...FADE}
            transition={{ duration: 0.5, ease: EASE, delay: 0.24 }}
            className="mt-[55px] flex flex-wrap items-center gap-3"
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
              <ArrowRight
                className="h-3.5 w-3.5"
                strokeWidth={2.2}
              />
            </Link>
          </motion.div>
        </div>

        {/* Product visual — 144px gap (escala áurea). Anchura 1/φ ≈ 62% al desktop */}
        <motion.div
          {...FADE}
          transition={{ duration: 0.7, ease: EASE, delay: 0.42 }}
          className="mt-[89px] sm:mt-[144px]"
        >
          <HeroProductVisual />
        </motion.div>

        {/* Trust line — UNA sola línea, sin animación performativa,
            estilo "footnote académico" institucional. */}
        <motion.p
          {...FADE}
          transition={{ duration: 0.5, ease: EASE, delay: 0.6 }}
          className="mt-[55px] max-w-[62ch] text-[0.78rem] leading-relaxed text-ink-soft"
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
