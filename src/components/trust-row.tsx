"use client";

import { motion } from "framer-motion";
import { Eyebrow } from "@/components/eyebrow";

const SOURCES = [
  "IMSS · GPC",
  "CENETEC",
  "ENSANUT",
  "KDIGO 2022",
  "ADA Standards",
  "WHO",
  "IDF Atlas",
  "Harvard DASH",
  "MIT DSpace",
  "Yale ELScholar",
  "UNAM TESIUNAM",
  "Tec de Monterrey",
  "U. Navarra",
  "INSP",
];

export function TrustRow() {
  // duplicate for seamless infinite loop
  const items = [...SOURCES, ...SOURCES];

  return (
    <section className="relative overflow-hidden border-b border-line bg-canvas py-14">
      <div className="lg-shell mb-8">
        <Eyebrow>Fuentes oficiales curadas</Eyebrow>
        <h2 className="mt-3 max-w-2xl text-h2 font-semibold tracking-tight text-ink-strong">
          Cada chunk lleva un linaje verificable hasta el documento original.
        </h2>
      </div>

      <div className="relative">
        {/* fade gradients on edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-canvas to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-canvas to-transparent"
        />

        <motion.div
          className="flex w-max gap-3 hover:[animation-play-state:paused]"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 35,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {items.map((src, i) => (
            <span
              key={`${src}-${i}`}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 text-caption font-medium text-ink-strong"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-validation"
              />
              {src}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
