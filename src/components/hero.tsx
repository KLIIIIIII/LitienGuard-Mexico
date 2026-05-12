"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { AuroraMesh } from "@/components/aurora-mesh";
import { HeroProductVisual } from "@/components/hero-product-visual";

const FADE_UP = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};
const EASE = [0.22, 1, 0.36, 1] as const;

const TRUST_SOURCES = [
  "IMSS-CENETEC",
  "KDIGO 2024",
  "ESC 2024",
  "AHA-ACC 2024",
  "Sepsis-3",
  "ICHD-3",
  "Mayo Clin",
  "Harvard Medical",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-canvas">
      <div className="absolute inset-0">
        <AuroraMesh />
      </div>

      <div className="lg-shell relative py-24 lg:py-32">
        {/* Editorial headline column — centered, monumental */}
        <div className="max-w-4xl">
          <motion.div
            {...FADE_UP}
            transition={{ duration: 0.6, ease: EASE, delay: 0.0 }}
            className="inline-flex items-center gap-2 rounded-full border border-validation-soft bg-surface/80 px-3 py-1 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-validation animate-pulse" />
            <p className="text-caption font-semibold tracking-eyebrow uppercase text-validation">
              México · 2026 · Reforma LGS Salud Digital
            </p>
          </motion.div>

          <motion.h1
            {...FADE_UP}
            transition={{ duration: 0.8, ease: EASE, delay: 0.12 }}
            className="mt-8 max-w-[20ch] text-display font-semibold tracking-tight text-ink leading-[1.02] sm:text-[clamp(2.75rem,6vw,4.5rem)]"
          >
            Evidencia que{" "}
            <span className="lg-serif-italic text-validation">se cita</span>.
            Tiempo que{" "}
            <span className="lg-serif-italic text-validation">se recupera</span>.
            Diagnósticos que{" "}
            <span className="lg-serif-italic text-validation">llegan a tiempo</span>.
          </motion.h1>

          <motion.p
            {...FADE_UP}
            transition={{ duration: 0.7, ease: EASE, delay: 0.28 }}
            className="mt-8 max-w-2xl text-[1.05rem] leading-relaxed text-ink-muted sm:text-[1.15rem]"
          >
            El sistema operativo clínico para el médico privado mexicano. Un
            cerebro curado en español, anclado en guías oficiales — IMSS,
            CENETEC, KDIGO, ESC, AHA-ACC, AMA. Cero hallucination: solo
            evidencia citada con número de página.
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...FADE_UP}
            transition={{ duration: 0.7, ease: EASE, delay: 0.42 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Link
              href="#solicita-piloto"
              className="group inline-flex items-center gap-2 rounded-full bg-ink-strong px-6 py-3 text-body-sm font-semibold text-canvas shadow-deep transition-all hover:bg-ink hover:shadow-soft"
            >
              Solicita acceso piloto
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2.2}
              />
            </Link>
            <Link
              href="/medicos"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-6 py-3 text-body-sm font-semibold text-ink-strong backdrop-blur transition-colors hover:bg-surface"
            >
              Ver para médicos
            </Link>
          </motion.div>
        </div>

        {/* Stat row — proof points editorial */}
        <motion.div
          {...FADE_UP}
          transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
          className="mt-16 grid gap-x-10 gap-y-8 sm:grid-cols-3 lg:max-w-4xl"
        >
          <Stat
            number="6.1 años"
            label="Retraso diagnóstico promedio en ATTR-CM"
            sub="hoy en México · Mayo Clin 2021"
          />
          <Stat
            number="4-6 hrs"
            label="Por día que un médico dedica a notas"
            sub="hoy en México · FunSalud 2026"
          />
          <Stat
            number="25.8%"
            label="De diabéticos en control glucémico"
            sub="hoy en México · ENSANUT 2023"
          />
        </motion.div>

        {/* Product visual — large, premium */}
        <motion.div
          {...FADE_UP}
          transition={{ duration: 1.1, ease: EASE, delay: 0.72 }}
          className="mt-20 relative"
        >
          <HeroProductVisual />
        </motion.div>

        {/* Trust strip — fuentes oficiales */}
        <motion.div
          {...FADE_UP}
          transition={{ duration: 0.9, ease: EASE, delay: 0.92 }}
          className="mt-16 border-t border-line pt-8"
        >
          <p className="text-[0.65rem] uppercase tracking-eyebrow font-semibold text-ink-soft text-center">
            Cerebro anclado en guías oficiales — citas verbatim con número de página
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST_SOURCES.map((source, i) => (
              <motion.span
                key={source}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.6,
                  delay: 1.0 + i * 0.05,
                  ease: EASE,
                }}
                className="text-caption font-semibold text-ink-quiet tracking-tight"
              >
                {source}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Subtle hint to keep scrolling */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.4 }}
          className="mt-14 flex items-center justify-center gap-2 text-ink-quiet"
        >
          <Sparkles className="h-3 w-3" strokeWidth={2.2} />
          <span className="text-caption tracking-tight">
            Tres flujos. Un mismo cerebro. Continúa abajo.
          </span>
        </motion.div>
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
    <div className="border-t-2 border-ink-strong pt-4">
      <p className="text-[2.5rem] font-bold tracking-tight tabular-nums text-ink-strong leading-none">
        {number}
      </p>
      <p className="mt-3 text-body-sm font-medium leading-snug text-ink-strong max-w-[28ch]">
        {label}
      </p>
      <p className="mt-1 text-[0.7rem] text-ink-muted tracking-tight">{sub}</p>
    </div>
  );
}
