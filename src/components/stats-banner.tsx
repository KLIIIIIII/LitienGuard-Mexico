"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { formatNumberMX } from "@/lib/utils";
import { Eyebrow } from "@/components/eyebrow";

interface Stat {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

const STATS: Stat[] = [
  {
    value: 32000,
    prefix: "$",
    suffix: " MXN/mes",
    label:
      "Lo que vale el tiempo que un médico privado pierde en documentación. LitienGuard Scribe te lo regresa.",
  },
  {
    value: 90,
    suffix: "%",
    label:
      "Médicos en México sin usar IA clínica. Mercado abierto — no hay que desplazar a nadie.",
  },
  {
    value: 4,
    suffix: " sectores",
    label:
      "Cobertura clínica activa con cita verbatim: cardio, endocrino, neuro, gineco-onco.",
  },
  {
    value: 100,
    suffix: "%",
    label:
      "Recomendaciones con cita verbatim. Cero alucinación — guía, página y referencia bibliográfica original.",
  },
];

function CountUp({ value, suffix = "", prefix = "" }: Stat) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px" });
  /**
   * Inicializamos en `value` (no 0) para que el número correcto se vea
   * SIEMPRE — degradación elegante. Si `useInView` dispara (caso normal
   * en desktop y la mayoría de mobile), corremos animate(0, value) que
   * sobrescribe el state explícitamente desde 0. Si nunca dispara (bug
   * de timing en iOS Safari), el usuario ve el número correcto sin
   * animación — preferible a mostrar "0".
   */
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref}>
      {prefix}
      {formatNumberMX(Math.round(display))}
      {suffix}
    </span>
  );
}

export function StatsBanner() {
  return (
    <section className="border-b border-line bg-surface-alt">
      <div className="lg-shell py-16">
        <div className="mb-10">
          <Eyebrow>Lo que aporta LitienGuard</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Tu EHR guarda notas. Nuestro cerebro te dice qué no se te está pasando.
          </h2>
          <p className="mt-3 max-w-prose text-body text-ink-muted">
            LitienGuard vive encima del expediente que ya usas y agrega la
            capa de razonamiento clínico que ningún EHR mexicano construyó.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="border-l border-line-strong pl-5"
            >
              <p className="text-display font-semibold tracking-tight text-ink-strong">
                <CountUp {...stat} />
              </p>
              <p className="mt-2 text-body-sm leading-snug text-ink-muted">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
