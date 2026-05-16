"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Eyebrow } from "@/components/eyebrow";

const VERBS = [
  {
    n: "01",
    verb: "Consultar",
    desc: "Pregunta clínica con contexto del paciente. Devolvemos fragmentos verbatim con cita, página y fuerza de evidencia.",
  },
  {
    n: "02",
    verb: "Evidenciar",
    desc: "Cada recomendación lleva referencia bibliográfica original. Cero alucinación. Si no hay evidencia, lo decimos.",
  },
  {
    n: "03",
    verb: "Registrar",
    desc: "Documenta tu decisión y el outcome del paciente. Procesamiento privado, sin enviar identidad del paciente a modelos externos.",
  },
  {
    n: "04",
    verb: "Mejorar",
    desc: "Loop de calidad: tus outcomes alimentan tu propia calibración personal. La red colectiva opcional enriquece a todos.",
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const lineProgress = useTransform(scrollYProgress, [0.15, 0.75], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className="relative border-b border-line bg-surface-alt py-24"
    >
      <div className="lg-shell">
        <div className="mb-14 max-w-2xl">
          <Eyebrow>Cómo funciona</Eyebrow>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Cuatro verbos. Sin magia, sin caja negra.
          </h2>
          <p className="mt-4 text-body text-ink-muted">
            Lo que hace el sistema, paso por paso. Trazabilidad total: la fuente
            original siempre está a un click.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Animated horizontal track on lg+ */}
          <div className="absolute left-0 right-0 top-12 hidden h-px bg-line lg:block">
            <motion.div
              style={{ scaleX: lineProgress, transformOrigin: "left" }}
              className="h-full bg-validation"
            />
          </div>

          {VERBS.map((v, i) => (
            <motion.div
              key={v.verb}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              className="relative pt-8"
            >
              <div
                aria-hidden
                className="absolute left-0 top-10 h-2 w-2 rounded-full border border-validation bg-canvas"
              />
              <p className="font-mono text-caption font-semibold tracking-eyebrow text-ink-soft">
                {v.n}
              </p>
              <h3 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
                {v.verb}
              </h3>
              <p className="mt-3 text-body-sm leading-relaxed text-ink-muted">
                {v.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
