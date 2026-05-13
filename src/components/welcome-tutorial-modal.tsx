"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Palette,
  Gift,
  Search,
  Quote,
  Clock,
  UserCheck,
  AlertCircle,
  DollarSign,
  type LucideIcon,
} from "lucide-react";
import {
  markTutorialComplete,
  markTutorialSkipped,
} from "@/app/dashboard/tutorial/actions";
import type { ProfileType } from "@/lib/entitlements";

type VisualKind =
  | "welcome"
  | "scribe"
  | "cerebro"
  | "recetas"
  | "agenda"
  | "pacientes"
  | "odontograma"
  | "hospital"
  | "rcm"
  | "pdfBranding"
  | "referidos"
  | "done";

interface Slide {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  bullets: string[];
  visualBg: string;
  visualKind: VisualKind;
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
    visualKind: "welcome",
  };

  const pdfBranding: Slide = {
    icon: Palette,
    eyebrow: "Branding propio",
    title: "Tus PDFs con",
    titleAccent: "tu marca.",
    description:
      "Personaliza el encabezado de notas SOAP, recetas, odontograma y diferencial con el nombre de tu consultorio. Los pacientes ven tu marca, no la nuestra.",
    bullets: [
      "Título y subtítulo customizables en /Configuración",
      "Aplica a los 4 tipos de PDF que generas",
      "Footer mantiene cumplimiento NOM-024 + LFPDPPP",
    ],
    visualBg: "from-warn-soft via-validation-soft to-canvas",
    visualKind: "pdfBranding",
  };

  const referidos: Slide = {
    icon: Gift,
    eyebrow: "Refiere y gana",
    title: "Trae colegas,",
    titleAccent: "elige tu premio.",
    description:
      "Cada médico que invites con tu código y suscriba un plan, te genera recompensa. Tú eliges entre efectivo o suscripción gratis — lo que más te convenga.",
    bullets: [
      "Tu código único en /Configuración → Refiere y gana",
      "Premio activo desde el primer pago del referido",
      "Elige $ MXN o meses gratis de tu plan",
    ],
    visualBg: "from-validation-soft via-warn-soft to-canvas",
    visualKind: "referidos",
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
    visualKind: "done",
  };

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
        visualKind: "odontograma",
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
        visualKind: "recetas",
      },
      pdfBranding,
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
        visualKind: "pacientes",
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
        visualKind: "agenda",
      },
      referidos,
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
        visualKind: "hospital",
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
        visualKind: "cerebro",
      },
      pdfBranding,
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
        visualKind: "rcm",
      },
      referidos,
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
      visualKind: "scribe",
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
      visualKind: "cerebro",
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
      visualKind: "recetas",
    },
    pdfBranding,
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
      visualKind: "pacientes",
    },
    referidos,
    final,
  ];
}

interface Props {
  profileType: ProfileType;
  nombre: string | null;
  inlineMode?: boolean;
  onClose?: () => void;
}

export function WelcomeTutorialModal({
  profileType,
  nombre,
  inlineMode = false,
  onClose,
}: Props) {
  const router = useRouter();
  const [slides] = useState(() => getSlides(profileType, nombre));
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [direction, setDirection] = useState<1 | -1>(1);
  const [exiting, setExiting] = useState(false);

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
    if (exiting) return;
    if (isLast) {
      finish();
    } else {
      setDirection(1);
      setIndex(index + 1);
    }
  }

  function prev() {
    if (exiting) return;
    if (!isFirst) {
      setDirection(-1);
      setIndex(index - 1);
    }
  }

  async function finishWithAction(
    action: () => Promise<{ status: "ok" } | { status: "error"; message: string }>,
  ) {
    if (exiting) return;
    setExiting(true);

    // Lanzar la mutación en paralelo con la animación de salida
    const mutationPromise = action();

    // Esperar a que la animación de fade-out termine (450ms)
    await new Promise((r) => setTimeout(r, 480));

    // Asegurar que la mutación terminó antes de refrescar el server component
    await mutationPromise;

    startTransition(() => {
      if (inlineMode && onClose) {
        onClose();
      } else {
        // router.refresh() re-renderiza server components sin reload completo:
        // sin flash de pantalla blanca, sin perder el contexto del cliente.
        router.refresh();
      }
    });
  }

  function finish() {
    void finishWithAction(markTutorialComplete);
  }

  function skip() {
    void finishWithAction(markTutorialSkipped);
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.45, ease: EASE }}
      className={`fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto bg-canvas/95 backdrop-blur-sm ${
        exiting ? "pointer-events-none" : ""
      }`}
      role="dialog"
      aria-modal
      aria-labelledby="tutorial-title"
    >
      <motion.div
        initial={{ scale: 0.96, y: 12 }}
        animate={{
          scale: exiting ? 0.94 : 1,
          y: exiting ? 18 : 0,
        }}
        transition={{ duration: 0.45, ease: EASE }}
        className="relative w-full max-w-5xl px-6 py-8 sm:py-12"
      >
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
            {/* LEFT — Visual coherente con el contenido */}
            <div className="relative order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={SOFT_SPRING}
                className={`relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-gradient-to-br ${slide.visualBg} p-6 shadow-lift`}
              >
                <SlideVisual kind={slide.visualKind} />
              </motion.div>
            </div>

            {/* RIGHT — Texto */}
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

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (exiting) return;
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                disabled={pending || exiting}
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
      </motion.div>
    </motion.div>
  );
}

// =============================================================
// SlideVisual — visual coherente con el contenido del slide
// =============================================================

function SlideVisual({ kind }: { kind: VisualKind }) {
  switch (kind) {
    case "welcome":
      return <WelcomeVisual />;
    case "scribe":
      return <ScribeVisual />;
    case "cerebro":
      return <CerebroVisual />;
    case "recetas":
      return <RecetasVisual />;
    case "agenda":
      return <AgendaVisual />;
    case "pacientes":
      return <PacientesVisual />;
    case "odontograma":
      return <OdontogramaVisual />;
    case "hospital":
      return <HospitalVisual />;
    case "rcm":
      return <RcmVisual />;
    case "pdfBranding":
      return <PdfBrandingVisual />;
    case "referidos":
      return <ReferidosVisual />;
    case "done":
      return <DoneVisual />;
    default:
      return null;
  }
}

function MockChrome({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="h-full w-full rounded-2xl border border-line bg-canvas shadow-deep overflow-hidden flex flex-col">
      <div className="flex items-center gap-1.5 border-b border-line bg-surface-alt px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-rose/40" />
        <span className="h-2 w-2 rounded-full bg-warn/40" />
        <span className="h-2 w-2 rounded-full bg-validation/40" />
        {title && (
          <span className="ml-2 text-[0.55rem] uppercase tracking-eyebrow font-bold text-ink-soft">
            {title}
          </span>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden p-3">{children}</div>
    </div>
  );
}

// --- Welcome ---
function WelcomeVisual() {
  return (
    <div className="flex h-full items-center justify-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ ...SOFT_SPRING, delay: 0.15 }}
        className="relative"
      >
        <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-canvas/60 shadow-deep backdrop-blur-sm">
          <Sparkles className="h-14 w-14 text-validation" strokeWidth={1.6} />
        </div>
        <motion.div
          aria-hidden
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 2.4, ease: "easeOut", repeat: Infinity }}
          className="absolute inset-0 rounded-3xl border-2 border-validation"
        />
      </motion.div>
    </div>
  );
}

// --- Scribe (audio waveform → SOAP) ---
function ScribeVisual() {
  return (
    <MockChrome title="Scribe">
      <div className="flex h-full flex-col gap-3">
        {/* Audio waveform animado */}
        <div className="flex items-end justify-center gap-1 rounded-lg bg-validation-soft px-4 py-3">
          <Mic className="h-4 w-4 text-validation" strokeWidth={2.2} />
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ height: 4 }}
              animate={{ height: [4, 14 + (i % 5) * 4, 4] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: i * 0.06,
                ease: "easeInOut",
              }}
              className="w-1 rounded-full bg-validation"
            />
          ))}
          <span className="ml-2 text-[0.6rem] font-mono text-validation">
            00:13
          </span>
        </div>
        {/* SOAP que aparece */}
        <div className="flex-1 min-h-0 grid grid-cols-2 gap-1.5">
          {[
            { l: "S", t: "Subjetivo", c: "Dolor torácico 2 días…" },
            { l: "O", t: "Objetivo", c: "TA 130/85, FC 88…" },
            { l: "A", t: "Análisis", c: "Angina inestable…" },
            { l: "P", t: "Plan", c: "ASA 100 mg, derivar…" },
          ].map((row, i) => (
            <motion.div
              key={row.l}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.4, ease: EASE }}
              className="rounded-md border border-line bg-surface p-1.5"
            >
              <p className="text-[0.55rem] uppercase tracking-eyebrow font-bold text-validation">
                {row.l} · {row.t}
              </p>
              <p className="mt-0.5 text-[0.6rem] text-ink-strong leading-tight">
                {row.c}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </MockChrome>
  );
}

// --- Cerebro (búsqueda → cita) ---
function CerebroVisual() {
  return (
    <MockChrome title="Cerebro clínico">
      <div className="flex h-full flex-col gap-2">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2">
          <Search className="h-3 w-3 text-ink-quiet" strokeWidth={2} />
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: "auto" }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.3 }}
            className="text-[0.65rem] text-ink-strong overflow-hidden whitespace-nowrap"
          >
            tratamiento DM2 segunda línea
          </motion.span>
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: 3 }}
            className="text-validation text-[0.65rem]"
          >
            |
          </motion.span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.5, ease: EASE }}
          className="flex-1 min-h-0 rounded-lg border-2 border-validation-soft bg-validation-soft/40 p-2.5"
        >
          <div className="flex items-start gap-1.5">
            <Quote className="h-3 w-3 shrink-0 text-validation mt-0.5" strokeWidth={2.2} />
            <p className="text-[0.6rem] text-ink-strong leading-tight italic">
              &ldquo;Metformina + iSGLT2 reduce mortalidad CV en DM2 con
              enfermedad CV establecida (Clase I, NE A).&rdquo;
            </p>
          </div>
          <p className="mt-1.5 text-[0.55rem] text-ink-soft">
            GPC-IMSS-103 · pág. 47 · ESC 2023
          </p>
        </motion.div>
      </div>
    </MockChrome>
  );
}

// --- Recetas (campos llenándose) ---
function RecetasVisual() {
  const fields = [
    { l: "Paciente", v: "Juan Pérez · 54 a" },
    { l: "Diagnóstico", v: "DM2 (E11.9)" },
    { l: "Medicamento", v: "Metformina 850 mg" },
    { l: "Posología", v: "1 tab c/12h x 30 días" },
  ];
  return (
    <MockChrome title="Receta digital">
      <div className="flex h-full flex-col gap-1.5">
        <div className="flex items-center justify-between border-b border-line pb-1.5">
          <Pill className="h-3.5 w-3.5 text-validation" strokeWidth={2.2} />
          <span className="text-[0.55rem] font-mono text-ink-soft">
            #RX-0024-2026
          </span>
        </div>
        {fields.map((f, i) => (
          <motion.div
            key={f.l}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.18, duration: 0.4, ease: EASE }}
            className="rounded-md bg-surface-alt px-2 py-1.5"
          >
            <p className="text-[0.5rem] uppercase tracking-eyebrow font-bold text-ink-soft">
              {f.l}
            </p>
            <p className="text-[0.65rem] font-semibold text-ink-strong leading-tight">
              {f.v}
            </p>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, ...SOFT_SPRING }}
          className="mt-auto inline-flex items-center gap-1 self-end rounded-full bg-validation px-2 py-0.5 text-[0.55rem] font-bold text-surface"
        >
          <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.5} />
          NOM-024 ✓
        </motion.div>
      </div>
    </MockChrome>
  );
}

// --- Agenda (slots se llenan) ---
function AgendaVisual() {
  const slots = [
    { h: "09:00", taken: true },
    { h: "10:00", taken: true },
    { h: "11:00", taken: false },
    { h: "12:00", taken: false },
    { h: "16:00", taken: true },
    { h: "17:00", taken: false },
  ];
  return (
    <MockChrome title="litienguard.mx/agendar/…">
      <div className="flex h-full flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-[0.6rem] font-semibold text-ink-strong">
            Martes 14 mayo
          </p>
          <Calendar className="h-3 w-3 text-validation" strokeWidth={2.2} />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {slots.map((s, i) => (
            <motion.button
              key={s.h}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.3, ease: EASE }}
              className={`rounded-md border px-2 py-1.5 text-[0.6rem] font-mono ${
                s.taken
                  ? "border-line bg-surface-alt text-ink-quiet line-through"
                  : "border-validation bg-validation-soft text-validation font-bold"
              }`}
            >
              {s.h}
            </motion.button>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="mt-auto flex items-center gap-1.5 rounded-md bg-validation/10 px-2 py-1.5"
        >
          <UserCheck className="h-3 w-3 text-validation" strokeWidth={2.2} />
          <p className="text-[0.55rem] text-ink-strong">
            Recordatorio 24h: enviado
          </p>
        </motion.div>
      </div>
    </MockChrome>
  );
}

// --- Pacientes (lista con flags inactividad) ---
function PacientesVisual() {
  const pts = [
    { n: "Ana M.", meses: 2, ok: true },
    { n: "Carlos R.", meses: 8, ok: false },
    { n: "Luisa F.", meses: 14, ok: false },
    { n: "Roberto V.", meses: 4, ok: true },
  ];
  return (
    <MockChrome title="Padrón">
      <div className="flex h-full flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[0.55rem] text-ink-soft">
          <Users className="h-3 w-3 text-validation" strokeWidth={2.2} />
          <span>624 pacientes</span>
          <span className="ml-auto rounded-full bg-warn-soft px-1.5 py-0.5 font-bold text-warn">
            2 inactivos
          </span>
        </div>
        {pts.map((p, i) => (
          <motion.div
            key={p.n}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.12, duration: 0.35 }}
            className={`flex items-center justify-between rounded-md border px-2 py-1.5 ${
              p.ok ? "border-line bg-surface" : "border-warn-soft bg-warn-soft/50"
            }`}
          >
            <span className="text-[0.6rem] font-semibold text-ink-strong">
              {p.n}
            </span>
            <span
              className={`flex items-center gap-1 text-[0.55rem] font-mono ${
                p.ok ? "text-ink-soft" : "text-warn font-bold"
              }`}
            >
              {!p.ok && <AlertCircle className="h-2.5 w-2.5" />}
              {p.meses} m
            </span>
          </motion.div>
        ))}
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="mt-auto inline-flex items-center justify-center gap-1 rounded-md bg-validation px-2 py-1.5 text-[0.6rem] font-bold text-surface"
        >
          <Clock className="h-2.5 w-2.5" strokeWidth={2.5} />
          Enviar recordatorio
        </motion.button>
      </div>
    </MockChrome>
  );
}

// --- Odontograma (dientes se marcan) ---
function OdontogramaVisual() {
  const teeth = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  ];
  const states = ["", "caries", "", "", "restaurado", "", "", "", "", "", "endodoncia", "", "", "corona", "", ""];
  const stateColor: Record<string, string> = {
    caries: "bg-warn",
    restaurado: "bg-validation",
    endodoncia: "bg-accent",
    corona: "bg-ink",
  };
  return (
    <MockChrome title="Odontograma">
      <div className="flex h-full flex-col gap-2">
        <p className="text-[0.55rem] uppercase tracking-eyebrow font-bold text-ink-soft">
          Maxilar superior · Notación FDI
        </p>
        <div className="grid grid-cols-8 gap-1">
          {teeth.map((t, i) => {
            const state = states[i];
            return (
              <motion.div
                key={t}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.04, duration: 0.3 }}
                className="flex flex-col items-center gap-0.5"
              >
                <motion.div
                  initial={{ backgroundColor: "#fff" }}
                  animate={
                    state ? { backgroundColor: undefined } : undefined
                  }
                  transition={{ delay: 0.8 + i * 0.05 }}
                  className={`h-5 w-5 rounded border border-line ${
                    state ? stateColor[state] : "bg-surface"
                  }`}
                />
                <span className="text-[0.45rem] text-ink-soft">{t}</span>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 text-[0.5rem]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-warn" /> Caries
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-validation" /> Restaurado
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-accent" /> Endodoncia
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-ink" /> Corona
          </span>
        </div>
      </div>
    </MockChrome>
  );
}

// --- Hospital (multi-médico dashboard) ---
function HospitalVisual() {
  const docs = [
    { n: "Dra. López", rol: "médico", csl: 18 },
    { n: "Dr. Ortiz", rol: "médico", csl: 22 },
    { n: "Recepción", rol: "admin", csl: 0 },
    { n: "Director", rol: "director", csl: 0 },
  ];
  return (
    <MockChrome title="Panel multi-médico">
      <div className="flex h-full flex-col gap-2">
        <div className="grid grid-cols-2 gap-1.5">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-md bg-validation-soft p-1.5"
          >
            <p className="text-[0.5rem] text-ink-soft">Consultas hoy</p>
            <p className="text-h3 font-bold text-validation leading-none">40</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-md bg-warn-soft p-1.5"
          >
            <p className="text-[0.5rem] text-ink-soft">Pendientes</p>
            <p className="text-h3 font-bold text-warn leading-none">7</p>
          </motion.div>
        </div>
        {docs.map((d, i) => (
          <motion.div
            key={d.n}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="flex items-center gap-2 rounded-md border border-line bg-surface px-2 py-1"
          >
            <Building2 className="h-3 w-3 text-validation" strokeWidth={2.2} />
            <span className="text-[0.6rem] font-semibold text-ink-strong">
              {d.n}
            </span>
            <span className="ml-auto text-[0.5rem] uppercase tracking-eyebrow text-ink-soft">
              {d.rol}
            </span>
          </motion.div>
        ))}
      </div>
    </MockChrome>
  );
}

// --- RCM (claim validation) ---
function RcmVisual() {
  return (
    <MockChrome title="RCM · Validación">
      <div className="flex h-full flex-col gap-2">
        <div className="rounded-lg border border-line bg-surface p-2">
          <p className="text-[0.55rem] uppercase tracking-eyebrow font-bold text-ink-soft">
            Claim #4729
          </p>
          <p className="mt-0.5 text-[0.6rem] text-ink-strong">
            Apendicectomía laparoscópica
          </p>
        </div>
        {[
          { l: "Póliza activa", ok: true, delay: 0.3 },
          { l: "Cobertura quirúrgica", ok: true, delay: 0.6 },
          { l: "Pre-autorización", ok: true, delay: 0.9 },
          { l: "Riesgo denegación", ok: false, label: "Bajo (12%)", delay: 1.2 },
        ].map((c) => (
          <motion.div
            key={c.l}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: c.delay, duration: 0.4 }}
            className="flex items-center justify-between rounded-md bg-surface-alt px-2 py-1.5"
          >
            <span className="text-[0.6rem] text-ink-strong">{c.l}</span>
            <span
              className={`flex items-center gap-1 text-[0.55rem] font-bold ${
                c.ok ? "text-validation" : "text-warn"
              }`}
            >
              {c.ok ? (
                <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.5} />
              ) : null}
              {c.label ?? "OK"}
            </span>
          </motion.div>
        ))}
      </div>
    </MockChrome>
  );
}

// --- PDF Branding (default vs custom) ---
function PdfBrandingVisual() {
  return (
    <div className="grid h-full grid-cols-2 gap-3">
      {/* Default */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="rounded-xl border-2 border-line bg-canvas p-2.5 shadow-deep"
      >
        <p className="text-[0.5rem] uppercase tracking-eyebrow font-bold text-ink-soft">
          Antes
        </p>
        <div className="mt-2 border-b-2 border-ink pb-1.5">
          <p className="text-[0.5rem] uppercase tracking-eyebrow font-bold text-validation">
            Documento clínico
          </p>
          <p className="text-[0.85rem] font-bold tracking-tight text-ink-strong leading-none mt-0.5">
            LitienGuard
          </p>
          <p className="text-[0.4rem] text-ink-muted mt-0.5">
            Inteligencia médica para México
          </p>
        </div>
        <div className="mt-2 space-y-1">
          <div className="h-1 rounded bg-line w-3/4" />
          <div className="h-1 rounded bg-line w-1/2" />
        </div>
      </motion.div>
      {/* Custom */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="rounded-xl border-2 border-validation bg-canvas p-2.5 shadow-lift relative"
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1.1, ...SOFT_SPRING }}
          className="absolute -top-2 -right-2 rounded-full bg-validation p-1"
        >
          <Palette className="h-2.5 w-2.5 text-surface" strokeWidth={2.5} />
        </motion.div>
        <p className="text-[0.5rem] uppercase tracking-eyebrow font-bold text-validation">
          Después
        </p>
        <div className="mt-2 border-b-2 border-ink pb-1.5">
          <p className="text-[0.5rem] uppercase tracking-eyebrow font-bold text-validation">
            Documento clínico
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-[0.8rem] font-bold tracking-tight text-ink-strong leading-none mt-0.5"
          >
            Clínica Dental Sandoval
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-[0.4rem] text-ink-muted mt-0.5"
          >
            Odontología integral · CDMX
          </motion.p>
        </div>
        <div className="mt-2 space-y-1">
          <div className="h-1 rounded bg-line w-3/4" />
          <div className="h-1 rounded bg-line w-1/2" />
        </div>
      </motion.div>
    </div>
  );
}

// --- Referidos (código + recompensa) ---
function ReferidosVisual() {
  return (
    <MockChrome title="Refiere y gana">
      <div className="flex h-full flex-col gap-2.5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-lg border-2 border-dashed border-validation bg-validation-soft px-3 py-2.5 text-center"
        >
          <p className="text-[0.5rem] uppercase tracking-eyebrow font-bold text-ink-soft">
            Tu código
          </p>
          <p className="mt-0.5 font-mono text-h3 font-bold text-validation tracking-tight">
            DRG-CARLOS-2026
          </p>
        </motion.div>

        <p className="text-[0.55rem] uppercase tracking-eyebrow font-bold text-ink-soft text-center">
          Cuando un colega se suscribe…
        </p>

        <div className="grid grid-cols-2 gap-2">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, ...SOFT_SPRING }}
            className="rounded-lg bg-warn-soft p-2 text-center"
          >
            <DollarSign
              className="mx-auto h-4 w-4 text-warn"
              strokeWidth={2.2}
            />
            <p className="mt-1 text-[0.6rem] font-bold text-ink-strong">
              Efectivo
            </p>
            <p className="text-[0.5rem] text-ink-muted">MXN al banco</p>
          </motion.div>
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9, ...SOFT_SPRING }}
            className="rounded-lg bg-validation-soft p-2 text-center"
          >
            <Gift
              className="mx-auto h-4 w-4 text-validation"
              strokeWidth={2.2}
            />
            <p className="mt-1 text-[0.6rem] font-bold text-ink-strong">
              Meses gratis
            </p>
            <p className="text-[0.5rem] text-ink-muted">de tu plan</p>
          </motion.div>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-auto text-center text-[0.55rem] text-ink-soft italic"
        >
          Tú decides cómo cobrarlo
        </motion.p>
      </div>
    </MockChrome>
  );
}

// --- Done (checkmark + sparkles) ---
function DoneVisual() {
  return (
    <div className="flex h-full items-center justify-center">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={SOFT_SPRING}
        className="relative"
      >
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-validation shadow-deep">
          <CheckCircle2
            className="h-16 w-16 text-surface"
            strokeWidth={2}
          />
        </div>
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <motion.div
            key={deg}
            aria-hidden
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              x: Math.cos((deg * Math.PI) / 180) * 80,
              y: Math.sin((deg * Math.PI) / 180) * 80,
            }}
            transition={{
              duration: 1.5,
              delay: 0.3 + i * 0.05,
              repeat: Infinity,
              repeatDelay: 0.6,
            }}
            className="absolute inset-0 m-auto h-3 w-3"
          >
            <Sparkles className="h-full w-full text-validation" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
