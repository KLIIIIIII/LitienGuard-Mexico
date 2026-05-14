"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Server,
  FileCheck2,
  Eye,
  X,
  BadgeCheck,
} from "lucide-react";

/**
 * Sello de confianza en el sidebar del dashboard. Compacto y siempre
 * visible; al hacer click abre el "certificado" completo en un modal.
 *
 * El copy refleja el estado REAL de la infraestructura. El cifrado a
 * nivel de campo (Google Cloud KMS) se describe como "en expansión"
 * mientras no cubra todo el expediente (Fases C-F del rollout).
 */

const EASE = [0.22, 1, 0.36, 1] as const;

interface Garantia {
  icon: typeof Lock;
  titulo: string;
  detalle: string;
}

const GARANTIAS: Garantia[] = [
  {
    icon: Lock,
    titulo: "Cifrado en reposo y en tránsito",
    detalle:
      "Toda la base de datos cifrada con AES-256. Conexiones protegidas con TLS.",
  },
  {
    icon: ShieldCheck,
    titulo: "Cifrado adicional con Google Cloud KMS",
    detalle:
      "Capa extra a nivel de campo sobre tu contenido clínico, con llave bajo nuestro control — en expansión a todo el expediente.",
  },
  {
    icon: Eye,
    titulo: "Aislamiento por médico",
    detalle:
      "Cada médico solo accede a sus propios pacientes y notas. Ni siquiera otros médicos de la plataforma.",
  },
  {
    icon: FileCheck2,
    titulo: "Bitácora de auditoría",
    detalle:
      "Cada acceso y cambio a información clínica queda registrado con fecha, usuario y origen.",
  },
  {
    icon: Server,
    titulo: "Servidores fuera de México",
    detalle:
      "Infraestructura en Estados Unidos (Oregon) con respaldos diarios automáticos.",
  },
];

export function SecurityShieldBadge() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* Sello compacto en el sidebar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group mt-3 flex w-full items-center gap-3 rounded-xl border border-validation/30 bg-validation-soft/50 px-3 py-2.5 text-left transition-colors hover:border-validation/60 hover:bg-validation-soft"
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-validation text-surface">
          <ShieldCheck className="h-4.5 w-4.5" strokeWidth={2.2} />
          {/* Anillo de pulso — "vivo" pero sutil */}
          <motion.span
            aria-hidden
            initial={{ scale: 1, opacity: 0.45 }}
            animate={{ scale: 1.55, opacity: 0 }}
            transition={{
              duration: 2.6,
              ease: "easeOut",
              repeat: Infinity,
            }}
            className="absolute inset-0 rounded-lg border-2 border-validation"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body-sm font-semibold text-ink-strong leading-tight">
            Datos protegidos
          </span>
          <span className="block text-[0.65rem] text-ink-muted leading-tight">
            Cifrado · Oregon · ver certificado
          </span>
        </span>
      </button>

      {/* Modal — el "certificado" */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="cert-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-ink/50 backdrop-blur-sm p-4"
                role="dialog"
                aria-modal
                aria-labelledby="cert-title"
              >
                <motion.div
                  key="cert-card"
                  initial={{ opacity: 0, scale: 0.94, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-validation/40 bg-surface shadow-deep"
                >
                  {/* Cerrar */}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Cerrar"
                    className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface/80 text-ink-muted backdrop-blur-sm transition-colors hover:bg-surface-alt hover:text-ink-strong"
                  >
                    <X className="h-4 w-4" strokeWidth={2} />
                  </button>

                  {/* Encabezado del certificado */}
                  <div className="relative bg-gradient-to-br from-validation-soft via-accent-soft to-surface px-6 pt-8 pb-6 text-center">
                    <motion.div
                      initial={{ scale: 0.5, rotate: -12, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{
                        type: "spring",
                        damping: 18,
                        stiffness: 200,
                        delay: 0.1,
                      }}
                      className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-validation text-surface shadow-deep"
                    >
                      <ShieldCheck className="h-10 w-10" strokeWidth={2} />
                      <motion.span
                        aria-hidden
                        initial={{ scale: 1, opacity: 0.4 }}
                        animate={{ scale: 1.6, opacity: 0 }}
                        transition={{
                          duration: 2.4,
                          ease: "easeOut",
                          repeat: Infinity,
                        }}
                        className="absolute inset-0 rounded-2xl border-2 border-validation"
                      />
                    </motion.div>
                    <p className="mt-4 text-[0.6rem] uppercase tracking-eyebrow font-bold text-validation">
                      Certificado de protección de datos
                    </p>
                    <h2
                      id="cert-title"
                      className="mt-1 text-h2 font-semibold tracking-tight text-ink-strong"
                    >
                      Tus datos, en buenas manos
                    </h2>
                    <p className="mt-1.5 text-caption text-ink-muted leading-relaxed max-w-sm mx-auto">
                      LitienGuard está construido siguiendo los requisitos
                      de la LFPDPPP y la NOM-024-SSA3 para el manejo de
                      información clínica.
                    </p>
                  </div>

                  {/* Garantías */}
                  <div className="px-6 py-5">
                    <ul className="space-y-2.5">
                      {GARANTIAS.map((g, i) => {
                        const Icon = g.icon;
                        return (
                          <motion.li
                            key={g.titulo}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.35,
                              ease: EASE,
                              delay: 0.25 + i * 0.07,
                            }}
                            className="flex items-start gap-3 rounded-lg border border-line bg-surface-alt/50 px-3 py-2.5"
                          >
                            <Icon
                              className="mt-0.5 h-4 w-4 shrink-0 text-validation"
                              strokeWidth={2}
                            />
                            <div className="min-w-0">
                              <p className="text-body-sm font-semibold text-ink-strong leading-snug">
                                {g.titulo}
                              </p>
                              <p className="mt-0.5 text-caption text-ink-muted leading-snug">
                                {g.detalle}
                              </p>
                            </div>
                          </motion.li>
                        );
                      })}
                    </ul>

                    {/* Pie tipo sello institucional */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.4 }}
                      className="mt-5 flex items-center gap-2.5 border-t border-line pt-4"
                    >
                      <BadgeCheck
                        className="h-8 w-8 shrink-0 text-validation"
                        strokeWidth={1.8}
                      />
                      <div>
                        <p className="text-caption font-semibold text-ink-strong">
                          LitienGuard · Inteligencia Médica para México
                        </p>
                        <p className="text-[0.65rem] text-ink-soft leading-snug">
                          Tu derecho ARCO está disponible en cualquier
                          momento desde Configuración. El cifrado con
                          Google Cloud KMS se despliega progresivamente
                          sobre todo el expediente.
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
