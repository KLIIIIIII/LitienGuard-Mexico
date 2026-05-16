"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShieldCheck,
  FileCheck,
  Lock,
  Sparkles,
  KeyRound,
  Server,
  ChevronDown,
} from "lucide-react";

const ITEMS = [
  {
    icon: FileCheck,
    label: "NOM-024-SSA3",
    detail: "Expediente clínico electrónico",
  },
  {
    icon: Lock,
    label: "LFPDPPP",
    detail: "Protección de datos personales",
  },
  {
    icon: ShieldCheck,
    label: "Reforma Salud Digital 2026",
    detail: "SINBA + Credencial Paciente",
  },
  {
    icon: Sparkles,
    label: "Filosofía COFEPRIS",
    detail: "Requerimientos sanitarios",
  },
];

// Medidas de seguridad concretas — todas vigentes hoy. El copy
// describe lo que SÍ existe, sin prometer de más.
const SEGURIDAD = [
  {
    icon: KeyRound,
    label: "Cifrado AES-256 nivel bancario",
    detail: "Doble capa sobre el contenido clínico",
  },
  {
    icon: Server,
    label: "Infraestructura cloud enterprise",
    detail: "Centros de datos certificados internacionales",
  },
  {
    icon: ShieldCheck,
    label: "Aislamiento por médico + auditoría",
    detail: "Cada acceso queda registrado",
  },
];

/**
 * Compliance trust strip — appears below the hero on landing pages.
 *
 * Colapsado por defecto: un escudo elegante con toggle. En móvil sobre
 * todo, mostrar todo el bloque regulatorio de golpe se sentía abrumador;
 * ahora el médico decide cuándo abrirlo. Wording deliberadamente cauto
 * ("construido siguiendo…") porque la certificación formal es un hito
 * pendiente, no una afirmación actual.
 */
export function ComplianceStrip() {
  const [open, setOpen] = useState(false);

  return (
    <section className="border-b border-line bg-surface-alt">
      <div className="lg-shell py-6">
        {/* Escudo — trigger del toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="group flex w-full items-center gap-4 rounded-2xl border-2 border-validation/30 bg-gradient-to-br from-validation-soft/60 via-surface to-surface p-4 text-left transition-colors hover:border-validation/50 sm:p-5"
        >
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-validation text-surface shadow-soft">
            <ShieldCheck className="h-6 w-6" strokeWidth={2} />
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl border-2 border-validation/40 transition-transform duration-700 group-hover:scale-110"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-validation">
              Seguridad y cumplimiento
            </p>
            <h3 className="mt-0.5 text-h3 font-semibold tracking-tight text-ink-strong">
              Tus datos, protegidos.{" "}
              <span className="lg-serif-italic font-normal text-validation">
                Construido bajo norma mexicana
              </span>
            </h3>
            <p className="mt-0.5 text-[0.7rem] text-ink-soft">
              {open
                ? "Toca para cerrar"
                : "Cifrado, NOM-024, LFPDPPP, Reforma 2026 — toca para ver el detalle"}
            </p>
          </div>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-validation transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
            strokeWidth={2.2}
          />
        </button>

        {/* Contenido colapsable */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="compliance-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-5">
                {/* Medidas de seguridad concretas */}
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {SEGURIDAD.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.label}
                        className="flex items-start gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5"
                      >
                        <Icon
                          className="mt-0.5 h-4 w-4 shrink-0 text-validation"
                          strokeWidth={2}
                        />
                        <div className="min-w-0">
                          <p className="text-caption font-semibold text-ink-strong leading-snug">
                            {s.label}
                          </p>
                          <p className="text-[0.7rem] text-ink-muted leading-snug">
                            {s.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Marcos regulatorios */}
                <p className="mt-6 text-caption uppercase tracking-eyebrow text-ink-soft">
                  Construido siguiendo
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-validation-soft text-validation">
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-body-sm font-semibold text-ink-strong leading-tight">
                            {item.label}
                          </p>
                          <p className="text-caption text-ink-muted leading-tight">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 max-w-prose text-caption text-ink-soft leading-relaxed">
                  LitienGuard está construido siguiendo los requerimientos
                  técnicos de la NOM-024-SSA3-2012, la Ley Federal de
                  Protección de Datos Personales en Posesión de los
                  Particulares y los lineamientos de la Reforma General de
                  Salud Digital 2026. Certificación formal por la Secretaría
                  de Salud y aval COFEPRIS en proceso conforme avanzamos en el
                  piloto clínico.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
