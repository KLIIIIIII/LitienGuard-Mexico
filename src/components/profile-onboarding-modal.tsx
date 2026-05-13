"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  Stethoscope,
  Smile,
  Building2,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { setProfileType } from "@/app/dashboard/onboarding/actions";

type ProfileTypeChoice = "medico_general" | "dentista" | "hospital";

interface ProfileOption {
  value: ProfileTypeChoice;
  icon: typeof Stethoscope;
  number: string;
  title: string;
  description: string;
  examples: string;
}

const OPTIONS: ProfileOption[] = [
  {
    value: "medico_general",
    icon: Stethoscope,
    number: "01",
    title: "Medicina general o especialidad",
    description:
      "Consulta clínica, diagnóstico diferencial, prescripción. Tu día gira alrededor del paciente uno a uno.",
    examples: "Internista · Cardiólogo · Endocrinólogo · Pediatra",
  },
  {
    value: "dentista",
    icon: Smile,
    number: "02",
    title: "Odontología",
    description:
      "Odontograma, planes de tratamiento por pieza, procedimientos secuenciales. Documentación clínica visual.",
    examples: "Odontología general · Endodoncia · Ortodoncia · Periodoncia",
  },
  {
    value: "hospital",
    icon: Building2,
    number: "03",
    title: "Hospital o clínica multi-médico",
    description:
      "Coordinas un equipo, mides operación agregada, tienes ciclo de ingresos con aseguradoras.",
    examples: "Director médico · Administrador · Dueño de clínica",
  },
];

// Spring presets — calibrados para sentirse "natural" sin oscilación excesiva
const STIFF_SPRING = { type: "spring" as const, damping: 24, stiffness: 320 };
const SOFT_SPRING = { type: "spring" as const, damping: 28, stiffness: 180 };
const EASE = [0.22, 1, 0.36, 1] as const;

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: EASE },
  },
};

export function ProfileOnboardingModal() {
  const [selected, setSelected] = useState<ProfileTypeChoice | null>(null);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [step, setStep] = useState<"pregunta" | "guardando" | "listo">(
    "pregunta",
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Keyboard shortcuts: 1/2/3 selecciona, Enter confirma
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (step !== "pregunta" || pending) return;
      if (e.key === "1") setSelected("medico_general");
      else if (e.key === "2") setSelected("dentista");
      else if (e.key === "3") setSelected("hospital");
      else if (e.key === "Enter" && selected) {
        e.preventDefault();
        onConfirm();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, pending, selected]);

  function onConfirm() {
    if (!selected || pending) return;
    setErr(null);
    setStep("guardando");
    startTransition(async () => {
      const r = await setProfileType(selected);
      if (r.status === "ok") {
        setStep("listo");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErr(r.message);
        setStep("pregunta");
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-canvas"
      role="dialog"
      aria-modal
      aria-labelledby="onboarding-title"
    >
      <OnboardingAurora />

      <div className="relative z-10 w-full max-w-4xl px-6 py-10 sm:py-16">
        <AnimatePresence mode="wait">
          {step === "pregunta" && (
            <motion.div
              key="pregunta"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -12, transition: { duration: 0.4 } }}
              className="space-y-12"
            >
              {/* Header editorial */}
              <header className="space-y-4 text-center">
                <motion.p
                  variants={itemVariants}
                  className="text-[0.72rem] uppercase tracking-[0.18em] font-semibold text-validation"
                >
                  LitienGuard · Bienvenida
                </motion.p>

                <motion.h1
                  id="onboarding-title"
                  variants={itemVariants}
                  className="mx-auto max-w-2xl text-ink-strong leading-[1.04] tracking-[-0.02em] font-semibold"
                  style={{ fontSize: "clamp(2rem, 4.4vw, 3rem)" }}
                >
                  Una pregunta antes de{" "}
                  <span className="lg-serif-italic font-normal text-validation">
                    empezar
                  </span>
                  .
                </motion.h1>

                <motion.p
                  variants={itemVariants}
                  className="mx-auto max-w-xl text-body text-ink-muted leading-relaxed"
                >
                  Tu panel se adapta a tu práctica. Esto define qué módulos
                  ves y cómo se ordenan.
                </motion.p>
              </header>

              {/* Cards */}
              <motion.div
                variants={itemVariants}
                className="grid gap-4 md:grid-cols-3"
              >
                {OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    option={opt}
                    active={selected === opt.value}
                    anyActive={selected !== null}
                    disabled={pending}
                    onClick={() => setSelected(opt.value)}
                  />
                ))}
              </motion.div>

              {/* Error feedback */}
              <AnimatePresence>
                {err && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="alert"
                    className="text-center text-caption text-rose"
                  >
                    {err}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Continue */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-center gap-4"
              >
                <ContinueButton
                  enabled={!!selected && !pending}
                  onClick={onConfirm}
                />
                <motion.p
                  variants={itemVariants}
                  className="text-caption text-ink-soft"
                >
                  <span className="hidden sm:inline">
                    Pulsa{" "}
                    <kbd className="inline-flex items-center justify-center rounded border border-line bg-surface px-1.5 py-0.5 text-[0.65rem] font-mono font-semibold text-ink-muted">
                      1
                    </kbd>
                    {" "}
                    <kbd className="inline-flex items-center justify-center rounded border border-line bg-surface px-1.5 py-0.5 text-[0.65rem] font-mono font-semibold text-ink-muted">
                      2
                    </kbd>
                    {" "}
                    <kbd className="inline-flex items-center justify-center rounded border border-line bg-surface px-1.5 py-0.5 text-[0.65rem] font-mono font-semibold text-ink-muted">
                      3
                    </kbd>
                    {" para seleccionar · "}
                    <kbd className="inline-flex items-center justify-center rounded border border-line bg-surface px-1.5 py-0.5 text-[0.65rem] font-mono font-semibold text-ink-muted">
                      ↩
                    </kbd>
                    {" para continuar · "}
                  </span>
                  Cambias esto cuando quieras desde Configuración.
                </motion.p>
              </motion.div>
            </motion.div>
          )}

          {step === "guardando" && (
            <motion.div
              key="guardando"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-6 py-24 text-center"
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={SOFT_SPRING}
                className="relative"
              >
                <Loader2
                  className="h-12 w-12 animate-spin text-validation"
                  strokeWidth={1.6}
                />
                <motion.div
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-validation/15 blur-2xl"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{
                    duration: 2.4,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
                className="space-y-1"
              >
                <p className="text-body text-ink-strong font-medium">
                  Personalizando tu panel
                </p>
                <p className="text-caption text-ink-muted">
                  Ajustando módulos a tu perfil…
                </p>
              </motion.div>
            </motion.div>
          )}

          {step === "listo" && <SuccessState />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/**
 * Aurora mesh dinámica para el onboarding — 5 blobs con movimiento
 * orgánico continuo. Mantenida ligera (sin filter:blur excesivo)
 * para que funcione bien en iOS Safari.
 */
function OnboardingAurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
        className="absolute inset-0"
      >
        <AuroraBlob
          color="rgba(74, 107, 91, 0.55)"
          size="55vh"
          startX="-15%"
          startY="-20%"
          duration={22}
          delay={0}
        />
        <AuroraBlob
          color="rgba(45, 62, 95, 0.45)"
          size="50vh"
          startX="65%"
          startY="-15%"
          duration={26}
          delay={1.2}
        />
        <AuroraBlob
          color="rgba(180, 135, 70, 0.30)"
          size="45vh"
          startX="40%"
          startY="60%"
          duration={28}
          delay={0.6}
        />
        <AuroraBlob
          color="rgba(60, 120, 115, 0.42)"
          size="40vh"
          startX="-5%"
          startY="55%"
          duration={24}
          delay={1.8}
        />
        <AuroraBlob
          color="rgba(120, 160, 140, 0.35)"
          size="38vh"
          startX="55%"
          startY="35%"
          duration={20}
          delay={0.9}
        />
      </motion.div>
      <div className="absolute inset-0 bg-canvas/40 backdrop-blur-[6px]" />
    </div>
  );
}

function AuroraBlob({
  color,
  size,
  startX,
  startY,
  duration,
  delay,
}: {
  color: string;
  size: string;
  startX: string;
  startY: string;
  duration: number;
  delay: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: startX,
        top: startY,
        background: `radial-gradient(circle, ${color}, transparent 65%)`,
        filter: "blur(32px)",
      }}
      animate={{
        x: ["0vw", "8vw", "-6vw", "4vw", "0vw"],
        y: ["0vh", "6vh", "10vh", "-4vh", "0vh"],
        scale: [1, 1.18, 1.05, 1.22, 1],
      }}
      transition={{
        duration,
        ease: "easeInOut",
        repeat: Infinity,
        delay,
      }}
    />
  );
}

/**
 * Card con mouse-tracking 3D tilt (parallax sutil). Al pasar el mouse,
 * el card se inclina ligeramente siguiendo el cursor. Cuando se
 * selecciona, transforma con spring physics. Si otra card está
 * seleccionada, esta se desvanece sutilmente para enfocar la elegida.
 */
function OptionCard({
  option,
  active,
  anyActive,
  disabled,
  onClick,
}: {
  option: ProfileOption;
  active: boolean;
  anyActive: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), {
    stiffness: 220,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), {
    stiffness: 220,
    damping: 22,
  });

  function onMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  }

  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const Icon = option.icon;
  const dim = anyActive && !active;

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      disabled={disabled}
      aria-pressed={active}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 1200,
      }}
      whileTap={{ scale: 0.97 }}
      animate={{
        opacity: dim ? 0.5 : 1,
        scale: active ? 1.02 : 1,
      }}
      transition={STIFF_SPRING}
      className={`group relative flex h-full flex-col items-start gap-4 overflow-hidden rounded-2xl border-2 bg-surface p-6 text-left transition-colors ${
        active
          ? "border-validation shadow-lift"
          : "border-line shadow-soft hover:border-line-strong"
      }`}
    >
      {/* Number indicator */}
      <div className="flex w-full items-start justify-between">
        <motion.div
          className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
            active
              ? "bg-validation text-canvas"
              : "bg-validation-soft text-validation"
          }`}
          animate={
            active
              ? { rotate: [0, -6, 6, -3, 0] }
              : { rotate: 0 }
          }
          transition={
            active
              ? { duration: 0.6, ease: EASE }
              : { duration: 0.2 }
          }
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </motion.div>
        <span
          className={`font-mono text-[0.65rem] font-bold tracking-wider transition-colors ${
            active ? "text-validation" : "text-ink-quiet"
          }`}
        >
          {option.number}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <h2 className="text-body font-semibold leading-tight text-ink-strong">
          {option.title}
        </h2>
        <p className="text-caption leading-relaxed text-ink-muted">
          {option.description}
        </p>
      </div>

      <p className="text-[0.65rem] leading-snug italic text-ink-soft">
        {option.examples}
      </p>

      {/* Glow ring cuando active */}
      <AnimatePresence>
        {active && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={SOFT_SPRING}
            className="pointer-events-none absolute -inset-1 -z-10 rounded-2xl bg-validation/15 blur-xl"
          />
        )}
      </AnimatePresence>

      {/* Check pill cuando active */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ scale: 0, opacity: 0, y: -4 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 14,
              stiffness: 320,
            }}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-validation text-canvas shadow-lift"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle border shine on hover (only when not active) */}
      {!active && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            background:
              "linear-gradient(120deg, transparent 0%, rgba(74,107,91,0.06) 50%, transparent 100%)",
          }}
        />
      )}
    </motion.button>
  );
}

function ContinueButton({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      whileHover={enabled ? { scale: 1.03 } : undefined}
      whileTap={enabled ? { scale: 0.97 } : undefined}
      transition={STIFF_SPRING}
      animate={{
        opacity: enabled ? 1 : 0.45,
      }}
      className="group inline-flex items-center gap-2 rounded-full bg-ink-strong px-7 py-3.5 text-[0.95rem] font-semibold text-canvas shadow-soft transition-shadow hover:shadow-lift disabled:cursor-not-allowed"
    >
      Continuar
      <motion.span
        animate={enabled ? { x: [0, 3, 0] } : { x: 0 }}
        transition={
          enabled
            ? { duration: 1.8, ease: "easeInOut", repeat: Infinity }
            : { duration: 0.2 }
        }
        className="inline-flex"
      >
        <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
      </motion.span>
    </motion.button>
  );
}

function SuccessState() {
  return (
    <motion.div
      key="listo"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-6 py-24 text-center"
    >
      {/* Check con expansion ring */}
      <div className="relative">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            damping: 12,
            stiffness: 220,
          }}
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-validation text-canvas shadow-lift"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, ...SOFT_SPRING }}
          >
            <Check className="h-9 w-9" strokeWidth={2.6} />
          </motion.div>
        </motion.div>

        {/* Expansion rings (3 capas escalonadas) */}
        {[0, 0.25, 0.5].map((d, i) => (
          <motion.div
            key={i}
            aria-hidden
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{
              duration: 1.6,
              ease: "easeOut",
              repeat: Infinity,
              delay: d,
            }}
            className="absolute inset-0 rounded-full border-2 border-validation"
          />
        ))}

        {/* Glow halo */}
        <motion.div
          aria-hidden
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1.6, opacity: 0.5 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="absolute inset-0 rounded-full bg-validation/30 blur-2xl -z-10"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
        className="space-y-2"
      >
        <h2
          className="text-ink-strong font-semibold tracking-tight"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}
        >
          Listo. Bienvenido a{" "}
          <span className="lg-serif-italic font-normal text-validation">
            LitienGuard
          </span>
          .
        </h2>
        <p className="text-body-sm text-ink-muted">
          Tu panel se está cargando con los módulos correctos…
        </p>
      </motion.div>
    </motion.div>
  );
}
