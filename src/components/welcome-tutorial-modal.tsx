"use client";

import { useEffect, useState, useTransition } from "react";
import {
  motion,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import {
  Mic,
  Smile,
  Pill,
  Calendar,
  Users,
  BookOpen,
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  type LucideIcon,
} from "lucide-react";
import {
  markTutorialComplete,
  markTutorialSkipped,
} from "@/app/dashboard/tutorial/actions";
import type { ProfileType } from "@/lib/entitlements";

interface Slide {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  bullets: string[];
  visualBg: string; // tailwind gradient classes
}

const EASE = [0.22, 1, 0.36, 1] as const;
const SOFT_SPRING = { type: "spring" as const, damping: 26, stiffness: 200 };

function getSlides(profileType: ProfileType, nombre: string | null): Slide[] {
  const welcome: Slide = {
    icon: Sparkles,
    eyebrow: "Bienvenida",
    title: `${nombre ? `Hola, ${nombre.split(" ")[0]}. ` : "Hola. "}Te tomamos`,
    titleAccent: "60 segundos.",
    description:
      "Un recorrido rápido por las funciones que vas a usar todos los días. Puedes saltarlo cuando quieras y repetirlo desde Configuración.",
    bullets: [
      "Tu panel personalizado a tu perfil",
      "Acceso desde computadora y celular",
      "Soporte directo con quien construye el producto",
    ],
    visualBg: "from-validation-soft via-accent-soft to-canvas",
  };

  const final: Slide = {
    icon: CheckCircle2,
    eyebrow: "Todo listo",
    title: "Eso es todo.",
    titleAccent: "Empieza a usarlo.",
    description:
      "Las funciones que no aparecen en tu sidebar son las que tu plan no incluye. Si quieres más, puedes subir de plan desde Configuración.",
    bullets: [
      "Repite este tour cuando quieras desde Configuración o Mi plan",
      "Cualquier duda, escríbenos por el botón de feedback abajo",
      "Tu primera consulta es la prueba real — pruébalo hoy",
    ],
    visualBg: "from-accent-soft via-validation-soft to-canvas",
  };

  // Slides según perfil
  if (profileType === "dentista") {
    return [
      welcome,
      {
        icon: Smile,
        eyebrow: "Tu herramienta principal",
        title: "Odontograma con",
        titleAccent: "7 estados clínicos.",
        description:
          "Mapa interactivo de las 32 piezas dentales. Marca cada pieza con su estado, genera el plan de tratamiento priorizado y firma la nota.",
        bullets: [
          "Click en pieza → estado → guardado automático",
          "Exporta a PDF firmable en menos de 1 minuto",
          "El paciente firma en papel antes de salir",
        ],
        visualBg: "from-warn-soft via-accent-soft to-canvas",
      },
      {
        icon: Pill,
        eyebrow: "Recetas digitales",
        title: "Recetas con estructura",
        titleAccent: "NOM-024.",
        description:
          "Crea recetas con tu cédula profesional, paciente, medicamentos con dosis/frecuencia/duración. Watermark de borrador hasta que firmes.",
        bullets: [
          "Folio único + código de verificación",
          "Catálogo COFEPRIS de medicamentos",
          "Exporta como PDF para imprimir o mandar por correo",
        ],
        visualBg: "from-validation-soft via-accent-soft to-canvas",
      },
      {
        icon: Users,
        eyebrow: "Padrón de pacientes",
        title: "Tus pacientes",
        titleAccent: "sin perder a nadie.",
        description:
          "Importa tu agenda completa por CSV. Identifica quiénes llevan +6 meses sin venir. Envíales un recordatorio personalizado con un click.",
        bullets: [
          "Import masivo desde Excel o Google Contacts",
          "Filtros automáticos por antigüedad",
          "Cooldown 30 días entre recordatorios al mismo paciente",
        ],
        visualBg: "from-rose-soft via-validation-soft to-canvas",
      },
      {
        icon: Calendar,
        eyebrow: "Agenda + reservación pública",
        title: "Tus pacientes",
        titleAccent: "reservan solos.",
        description:
          "Comparte tu link público (estilo Calendly) y los pacientes eligen horario disponible. Recordatorios 24h antes automáticos.",
        bullets: [
          "Link único: litienguard.mx/agendar/tu-slug",
          "Solo muestra horarios libres en tu agenda real",
          "Pacientes nuevos se agregan a tu padrón automáticamente",
        ],
        visualBg: "from-accent-soft via-warn-soft to-canvas",
      },
      final,
    ];
  }

  if (profileType === "hospital") {
    return [
      welcome,
      {
        icon: Building2,
        eyebrow: "Operación hospitalaria",
        title: "Plataforma",
        titleAccent: "multi-médico.",
        description:
          "Coordina a tu equipo médico desde un solo panel. Cada médico tiene sus permisos según rol (recepción, médico, director).",
        bullets: [
          "Dashboard agregado con métricas clave",
          "Roles personalizados por usuario",
          "Onboarding personalizado + SLA dedicado",
        ],
        visualBg: "from-validation-soft via-accent-soft to-canvas",
      },
      {
        icon: BookOpen,
        eyebrow: "Cerebro clínico",
        title: "Evidencia con",
        titleAccent: "cita verbatim.",
        description:
          "Búsqueda en guías oficiales: IMSS, CENETEC, ESC, AHA, KDIGO, Mayo Clinic. Cada respuesta cita la página exacta del documento.",
        bullets: [
          "178+ documentos curados, sin alucinación",
          "Diferencial bayesiano para casos complejos",
          "Anonimización local — PII no sale del consultorio",
        ],
        visualBg: "from-accent-soft via-validation-soft to-canvas",
      },
      {
        icon: Sparkles,
        eyebrow: "Próximamente",
        title: "RCM Copilot",
        titleAccent: "Q4 2026.",
        description:
          "Validación de pólizas en vivo, predicción de denegaciones, automatización facturación, seguimiento de cobranza. En desarrollo para tu plan Clínica.",
        bullets: [
          "Reducción DSO 20-30%",
          "Validación cobertura antes de admitir",
          "Integración bidireccional con tu HIS existente",
        ],
        visualBg: "from-warn-soft via-accent-soft to-canvas",
      },
      final,
    ];
  }

  // Default: medico_general / sin_definir
  return [
    welcome,
    {
      icon: Mic,
      eyebrow: "Tu herramienta principal",
      title: "Graba la consulta.",
      titleAccent: "SOAP en 13 segundos.",
      description:
        "Habla normal con el paciente. Cuando termines, el sistema te entrega el SOAP estructurado (Subjetivo, Objetivo, Análisis, Plan) listo para revisar y firmar.",
      bullets: [
        "Audio procesado localmente cuando es posible",
        "Auto-extracción de findings clínicos",
        "Citas verbatim al cerebro clínico para sustentar el plan",
      ],
      visualBg: "from-validation-soft via-accent-soft to-canvas",
    },
    {
      icon: BookOpen,
      eyebrow: "Cerebro clínico",
      title: "Cualquier duda,",
      titleAccent: "con evidencia citada.",
      description:
        "Búsqueda en guías oficiales mexicanas e internacionales. Cada respuesta lleva el documento fuente, página y fuerza de recomendación.",
      bullets: [
        "IMSS, CENETEC, KDIGO, ESC, AHA, Mayo Clinic",
        "Sin alucinación — solo evidencia citada",
        "Diferencial bayesiano para casos complejos",
      ],
      visualBg: "from-accent-soft via-warn-soft to-canvas",
    },
    {
      icon: Pill,
      eyebrow: "Recetas + Agenda",
      title: "Operación clínica",
      titleAccent: "en un solo lugar.",
      description:
        "Recetas con estructura NOM-024, agenda semanal y reservación pública estilo Calendly para tus pacientes.",
      bullets: [
        "Recetas con cédula profesional + folio único",
        "Pacientes reservan desde tu link público",
        "Recordatorios automáticos 24 horas antes",
      ],
      visualBg: "from-warn-soft via-validation-soft to-canvas",
    },
    {
      icon: Users,
      eyebrow: "Padrón de pacientes",
      title: "Recupera a los",
      titleAccent: "pacientes inactivos.",
      description:
        "Importa tu padrón completo. El sistema detecta quiénes llevan más de 6 meses sin venir y te permite enviarles un recordatorio personalizado.",
      bullets: [
        "Import CSV con 10 columnas automáticas",
        "Filtros por antigüedad (+3, +6, +12 meses)",
        "Cooldown 30 días para no saturar al paciente",
      ],
      visualBg: "from-rose-soft via-accent-soft to-canvas",
    },
    final,
  ];
}

interface Props {
  profileType: ProfileType;
  nombre: string | null;
  /** Si true, se cerrará al terminar sin recargar. Si false (default), recarga al cerrar. */
  inlineMode?: boolean;
  onClose?: () => void;
}

export function WelcomeTutorialModal({
  profileType,
  nombre,
  inlineMode = false,
  onClose,
}: Props) {
  const [slides] = useState(() => getSlides(profileType, nombre));
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [direction, setDirection] = useState<1 | -1>(1);

  const isFirst = index === 0;
  const isLast = index === slides.length - 1;
  const slide = slides[index];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") skip();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function next() {
    if (isLast) {
      finish();
    } else {
      setDirection(1);
      setIndex(index + 1);
    }
  }

  function prev() {
    if (!isFirst) {
      setDirection(-1);
      setIndex(index - 1);
    }
  }

  function finish() {
    startTransition(async () => {
      await markTutorialComplete();
      if (inlineMode && onClose) {
        onClose();
      } else {
        window.location.reload();
      }
    });
  }

  function skip() {
    startTransition(async () => {
      await markTutorialSkipped();
      if (inlineMode && onClose) {
        onClose();
      } else {
        window.location.reload();
      }
    });
  }

  const containerVariants: Variants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir * 40,
      filter: "blur(8px)",
    }),
    center: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 0.5, ease: EASE },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: -dir * 40,
      filter: "blur(8px)",
      transition: { duration: 0.35, ease: EASE },
    }),
  };

  const Icon = slide.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto bg-canvas/95 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-labelledby="tutorial-title"
    >
      <div className="relative w-full max-w-5xl px-6 py-8 sm:py-12">
        {/* Skip button */}
        <button
          type="button"
          onClick={skip}
          disabled={pending}
          className="absolute right-6 top-6 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-caption font-medium text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink-strong disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
          Saltar tutorial
        </button>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            variants={containerVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="grid items-center gap-10 lg:grid-cols-[1.1fr_minmax(0,1fr)]"
          >
            {/* LEFT — Visual */}
            <div className="relative order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={SOFT_SPRING}
                className={`relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-gradient-to-br ${slide.visualBg} p-8 shadow-lift`}
              >
                {/* Big icon centered */}
                <div className="flex h-full items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ ...SOFT_SPRING, delay: 0.15 }}
                    className="relative"
                  >
                    <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-canvas/60 shadow-deep backdrop-blur-sm">
                      <Icon
                        className="h-14 w-14 text-validation"
                        strokeWidth={1.6}
                      />
                    </div>
                    {/* Pulse ring */}
                    <motion.div
                      aria-hidden
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{
                        duration: 2.4,
                        ease: "easeOut",
                        repeat: Infinity,
                      }}
                      className="absolute inset-0 rounded-3xl border-2 border-validation"
                    />
                  </motion.div>
                </div>

                {/* Decorative dots */}
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-validation/40" />
                  <span className="h-2 w-2 rounded-full bg-validation/30" />
                  <span className="h-2 w-2 rounded-full bg-validation/20" />
                </div>
              </motion.div>
            </div>

            {/* RIGHT — Text */}
            <div className="space-y-5 order-1 lg:order-2">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE, delay: 0.1 }}
                className="text-[0.72rem] uppercase tracking-[0.18em] font-semibold text-validation"
              >
                {slide.eyebrow}
              </motion.p>

              <motion.h1
                id="tutorial-title"
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.6, ease: EASE, delay: 0.18 }}
                className="text-ink-strong leading-[1.04] tracking-[-0.02em] font-semibold"
                style={{ fontSize: "clamp(2rem, 4.2vw, 2.75rem)" }}
              >
                {slide.title}{" "}
                <span className="lg-serif-italic font-normal text-validation">
                  {slide.titleAccent}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.26 }}
                className="text-body text-ink-muted leading-relaxed max-w-prose"
              >
                {slide.description}
              </motion.p>

              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.32 }}
                className="space-y-2"
              >
                {slide.bullets.map((b, i) => (
                  <motion.li
                    key={b}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: EASE,
                      delay: 0.4 + i * 0.08,
                    }}
                    className="flex items-baseline gap-2 text-body-sm text-ink-strong leading-snug"
                  >
                    <span className="font-mono text-caption text-validation">
                      →
                    </span>
                    <span>{b}</span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom controls */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                disabled={pending}
                aria-label={`Ir al paso ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-8 bg-validation"
                    : i < index
                      ? "w-1.5 bg-validation/60"
                      : "w-1.5 bg-line"
                }`}
              />
            ))}
            <span className="ml-3 font-mono text-[0.65rem] text-ink-soft">
              {String(index + 1).padStart(2, "0")} / {slides.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={isFirst || pending}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-muted transition-colors hover:bg-surface-alt disabled:opacity-40"
              aria-label="Anterior"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={next}
              disabled={pending}
              className="lg-cta-primary disabled:opacity-60"
            >
              {isLast ? "Empezar" : "Siguiente"}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="mt-4 text-center text-[0.65rem] text-ink-soft">
          <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono">
            ←
          </kbd>{" "}
          <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono">
            →
          </kbd>{" "}
          navegar ·{" "}
          <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-mono">
            Esc
          </kbd>{" "}
          saltar
        </p>
      </div>
    </motion.div>
  );
}
