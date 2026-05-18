"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, ChevronRight } from "lucide-react";

/**
 * Hero estilo Oracle Health / Enterprise B2B SaaS:
 *   · Background sólido institucional + grid sutil
 *   · Headline directo, autoridad, sin metáforas
 *   · 2 CTAs claras: primary (contact sales) + secondary (ver demo)
 *   · Trust strip arriba con badge de compliance
 *   · KPI strip abajo con números grandes
 */
export function HeroEnterprise() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-canvas">
      {/* Grid pattern sutil */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--ink)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--ink)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow oval superior */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[1200px] rounded-full opacity-[0.12] blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, rgb(var(--validation)) 0%, transparent 60%)",
        }}
      />

      <div className="lg-shell relative pt-[88px] pb-[64px] sm:pt-[112px] lg:pt-[140px] lg:pb-[96px]">
        {/* Trust badge — compliance prominente */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center"
        >
          <Link
            href="/seguridad"
            className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[0.72rem] font-medium text-ink-muted shadow-soft hover:border-validation/40"
          >
            <ShieldCheck
              className="h-3.5 w-3.5 text-validation"
              strokeWidth={2.2}
            />
            <span>
              NOM-024 SSA3 · HIPAA-aligned · Cifrado AES-256-GCM con KMS
            </span>
            <ChevronRight
              className="h-3 w-3 opacity-60 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.2}
            />
          </Link>
        </motion.div>

        {/* Headline */}
        <div className="mx-auto mt-[34px] max-w-[58ch] text-center">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-ink-strong leading-[1.04] tracking-[-0.022em] font-semibold"
            style={{ fontSize: "clamp(2.5rem, 5.6vw, 4.25rem)" }}
          >
            El sistema operativo clínico
            <br />
            <span className="text-validation">de Latinoamérica</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mx-auto mt-[28px] max-w-[54ch] text-[1.0625rem] leading-[1.6] text-ink-muted sm:text-[1.1875rem]"
          >
            LitienGuard provee infraestructura clínica enterprise para
            hospitales, clínicas y médicos especialistas. Cerebro de
            evidencia, workflows operacionales, gestión de camas y RCM —
            todo en una sola plataforma compatible con la Reforma LGS 2026.
          </motion.p>
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-[44px] flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="#solicita-piloto"
            className="group inline-flex items-center gap-2 rounded-md bg-ink-strong px-6 py-3.5 text-[0.95rem] font-semibold text-canvas transition-all hover:bg-ink hover:shadow-lift"
          >
            Hablar con ventas
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.2}
            />
          </Link>
          <Link
            href="/medicos"
            className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-6 py-3.5 text-[0.95rem] font-semibold text-ink-strong transition-all hover:border-validation/40 hover:shadow-soft"
          >
            Ver demo del producto
          </Link>
        </motion.div>

        {/* KPI strip — proof points numéricos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-[80px] grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4"
        >
          <KpiCell
            number="51"
            unit="diagnósticos"
            label="cubiertos por el motor bayesiano con LRs derivados de literatura primaria"
          />
          <KpiCell
            number="124"
            unit="patrones"
            label="multi-estudio curados de guías AHA · ESC · ADA · KDIGO · NCCN"
          />
          <KpiCell
            number="20"
            unit="cruces clínicos"
            label="multivariables con detección automática de comorbilidades"
          />
          <KpiCell
            number="10"
            unit="departamentos"
            label="hospitalarios incluidos: Urgencias, UCI, Quirófano, Lab, Radio + 4 esp."
          />
        </motion.div>

        {/* Trust line — autoridad institucional */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mx-auto mt-[44px] max-w-[68ch] text-center text-[0.78rem] leading-relaxed text-ink-soft"
        >
          Diseñado siguiendo los frameworks de operación clínica de
          instituciones de referencia mundial. Cada recomendación se
          entrega con cita verbatim a la guía clínica fuente.
        </motion.p>
      </div>
    </section>
  );
}

function KpiCell({
  number,
  unit,
  label,
}: {
  number: string;
  unit: string;
  label: string;
}) {
  return (
    <div className="bg-surface px-5 py-6 sm:px-7 sm:py-8">
      <p
        className="font-bold tracking-tight tabular-nums text-ink-strong leading-none"
        style={{ fontSize: "clamp(2.25rem, 3.6vw, 3rem)" }}
      >
        {number}
      </p>
      <p className="mt-2 text-caption font-semibold uppercase tracking-eyebrow text-validation">
        {unit}
      </p>
      <p className="mt-2 text-caption text-ink-muted leading-relaxed">
        {label}
      </p>
    </div>
  );
}
