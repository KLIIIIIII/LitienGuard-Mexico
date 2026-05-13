import {
  Stethoscope,
  Smile,
  Building2,
  GraduationCap,
  TestTube,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";

interface TierInfo {
  key: "free" | "esencial" | "pilot" | "pro" | "enterprise";
  label: string;
  precio: string;
  icon: LucideIcon;
  paraQuien: string[];
  features: string[];
  cuandoUsar: string;
  highlight?: boolean; // tier recomendado
  tone: "free" | "esencial" | "pilot" | "pro" | "enterprise";
}

const TIERS: TierInfo[] = [
  {
    key: "free",
    label: "Explorador · Gratis",
    precio: "MXN 0",
    icon: TestTube,
    paraQuien: [
      "Prospectos en evaluación",
      "Demo casual sin compromiso",
    ],
    features: [
      "5 SOAPs/mes (sin Scribe)",
      "Cerebro: solo lectura",
      "Sin recetas, sin agenda",
    ],
    cuandoUsar:
      "Quiere ver el producto antes de comprometerse. Sin urgencia comercial.",
    tone: "free",
  },
  {
    key: "esencial",
    label: "Esencial · MXN 499/mes",
    precio: "MXN 499/mes",
    icon: Smile,
    paraQuien: [
      "Dentistas con consulta privada",
      "Médicos generales / consultorio individual",
      "Residentes y subespecialistas jóvenes",
    ],
    features: [
      "100 SOAPs/mes (carga manual)",
      "Cerebro completo en lectura",
      "Recetas estructura NOM-024",
      "Odontograma + Pacientes (import CSV)",
      "Recordatorios manuales",
    ],
    cuandoUsar:
      "Cliente comercial real, pagando. Default para demos de dentistas y médicos individuales.",
    highlight: true,
    tone: "esencial",
  },
  {
    key: "pilot",
    label: "Esencial Piloto · Gratis durante piloto",
    precio: "Gratis (piloto)",
    icon: GraduationCap,
    paraQuien: [
      "Founding members del piloto",
      "Médicos que darán feedback semanal",
      "Casos de uso a documentar para validación",
    ],
    features: [
      "Todo lo de Esencial",
      "+ Scribe ambient ilimitado",
      "Sin cobro durante el piloto",
      "Acceso a comunidad WhatsApp con founder",
    ],
    cuandoUsar:
      "Doctor que da retro a cambio de acceso. Precio futuro garantizado MXN 499 cuando lance comercial.",
    tone: "pilot",
  },
  {
    key: "pro",
    label: "Profesional · MXN 999/mes",
    precio: "MXN 999/mes",
    icon: Stethoscope,
    paraQuien: [
      "Cardiólogos, internistas, endocrinólogos",
      "Especialistas con casos complejos",
      "Médicos con 8+ consultas/día",
    ],
    features: [
      "300 SOAPs/mes con Scribe",
      "Cerebro completo + Q&A con citas",
      "Diferencial bayesiano (28 enfermedades)",
      "Agenda + reservación pública",
      "Recall automático mensual de pacientes",
      "Mi calidad personal",
    ],
    cuandoUsar:
      "Especialista activo que ya quiere Scribe + diferencial. Más caro pero ROI claro (2-4 hrs/día ahorradas).",
    tone: "pro",
  },
  {
    key: "enterprise",
    label: "Clínica · Contratado",
    precio: "A medida (≥ MXN 4,999/mes)",
    icon: Building2,
    paraQuien: [
      "Hospitales privados medianos",
      "Clínicas de 5-15 médicos",
      "Directores médicos / administración",
    ],
    features: [
      "Todo lo de Profesional",
      "Multi-médico con roles personalizados",
      "RCM (cobranza aseguradoras, 2027)",
      "Integración con sistemas existentes",
      "SLA 99.5% + onboarding personalizado",
    ],
    cuandoUsar:
      "Solo si hay director médico/administrador como interlocutor. Demos ejecutivas, no individuales.",
    tone: "enterprise",
  },
];

const TONE_CLASSES: Record<TierInfo["tone"], { border: string; badge: string; icon: string }> = {
  free: {
    border: "border-line",
    badge: "bg-surface-alt text-ink-muted",
    icon: "bg-surface-alt text-ink-muted",
  },
  esencial: {
    border: "border-validation",
    badge: "bg-validation text-canvas",
    icon: "bg-validation-soft text-validation",
  },
  pilot: {
    border: "border-accent-soft",
    badge: "bg-accent-soft text-accent",
    icon: "bg-accent-soft text-accent",
  },
  pro: {
    border: "border-validation-soft",
    badge: "bg-validation-soft text-validation",
    icon: "bg-validation-soft text-validation",
  },
  enterprise: {
    border: "border-ink",
    badge: "bg-ink text-canvas",
    icon: "bg-ink text-canvas",
  },
};

/**
 * Guía rápida de planes — montada arriba del formulario de invitación
 * en /admin/invitaciones para que el admin sepa exactamente qué tier
 * darle a cada doctor según su contexto (especialidad, perfil
 * comercial, urgencia).
 *
 * Diseñada para escaneo rápido: la primera línea de cada card
 * (Para quién) responde la pregunta "¿este doctor encaja aquí?".
 */
export function TierGuide() {
  return (
    <details className="group rounded-2xl border border-line bg-surface shadow-soft">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
            Guía rápida
          </p>
          <h2 className="mt-1 text-h3 font-semibold text-ink-strong">
            ¿Qué plan le doy a este doctor?
          </h2>
          <p className="mt-1 text-caption text-ink-muted">
            Mercado objetivo, qué incluye cada tier y cuándo usarlo.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-line bg-canvas px-3 py-1 text-caption font-medium text-ink-muted group-open:hidden">
          Mostrar
        </span>
        <span className="hidden shrink-0 rounded-full border border-line bg-canvas px-3 py-1 text-caption font-medium text-ink-muted group-open:inline">
          Ocultar
        </span>
      </summary>

      <div className="border-t border-line px-5 py-5">
        <div className="grid gap-3 lg:grid-cols-5">
          {TIERS.map((t) => {
            const Icon = t.icon;
            const tone = TONE_CLASSES[t.tone];
            return (
              <article
                key={t.key}
                className={`relative flex flex-col gap-3 rounded-xl border-2 bg-canvas p-4 ${tone.border} ${
                  t.highlight ? "shadow-lift" : ""
                }`}
              >
                {t.highlight && (
                  <span
                    className={`absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-eyebrow ${tone.badge}`}
                  >
                    <CheckCircle2 className="h-2.5 w-2.5" strokeWidth={2.4} />
                    Más usado
                  </span>
                )}

                <header className="flex items-start gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.7rem] font-bold leading-tight text-ink-strong">
                      {t.label}
                    </p>
                  </div>
                </header>

                <section>
                  <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                    Para quién
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {t.paraQuien.map((p) => (
                      <li
                        key={p}
                        className="text-caption leading-snug text-ink-strong"
                      >
                        · {p}
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                    Incluye
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {t.features.map((f) => (
                      <li
                        key={f}
                        className="text-caption leading-snug text-ink-muted"
                      >
                        · {f}
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-auto rounded-md bg-surface-alt px-2.5 py-2">
                  <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                    Cuándo usar
                  </p>
                  <p className="mt-1 text-caption leading-snug text-ink-strong">
                    {t.cuandoUsar}
                  </p>
                </section>
              </article>
            );
          })}
        </div>

        {/* Decision shortcut */}
        <div className="mt-5 rounded-xl border border-validation-soft bg-validation-soft/30 px-4 py-3">
          <p className="text-caption font-semibold text-validation">
            Atajo de decisión
          </p>
          <p className="mt-1 text-body-sm text-ink-strong leading-relaxed">
            <strong>Dentista privado o médico individual con consultorio</strong>
            {" → "}
            <span className="font-mono font-semibold text-validation">
              Esencial
            </span>
            . <strong>Especialista con casos complejos</strong>
            {" → "}
            <span className="font-mono font-semibold text-validation">
              Profesional
            </span>
            . <strong>Founding member que va a dar feedback semanal</strong>
            {" → "}
            <span className="font-mono font-semibold text-accent">Piloto</span>
            . <strong>Hospital o clínica multi-médico</strong>
            {" → "}
            <span className="font-mono font-semibold text-ink-strong">
              Clínica
            </span>
            .
          </p>
        </div>
      </div>
    </details>
  );
}
