import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Mic,
  BookOpen,
  Sparkles,
  Pill,
  Calendar,
  Smile,
  FileText,
  ShieldCheck,
  Lock,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Stethoscope,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import {
  canUseScribe,
  canUseCerebro,
  canReadCerebro,
  canUseRecetas,
  canUseAgenda,
  canUseRcm,
  scribeMonthlyLimit,
  TIER_LABELS,
  TIER_DESCRIPTIONS,
  tierBadgeClass,
  type SubscriptionTier,
} from "@/lib/entitlements";

export const metadata: Metadata = {
  title: "Mi plan — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type FeatureKey =
  | "soap"
  | "scribe"
  | "cerebro-read"
  | "cerebro-full"
  | "diferencial"
  | "recetas"
  | "agenda"
  | "odontograma"
  | "rcm"
  | "multi-medico";

interface FeatureDef {
  key: FeatureKey;
  name: string;
  description: string;
  howToUse: string;
  href: string;
  icon: typeof Mic;
}

const FEATURES: Record<FeatureKey, FeatureDef> = {
  soap: {
    key: "soap",
    name: "Notas SOAP",
    description:
      "Captura estructurada de la consulta en formato Subjetivo, Objetivo, Análisis, Plan. Firmas y exportas como PDF.",
    howToUse:
      "Entra a Mis notas → Nueva nota. Captura manual o (si tu plan incluye Scribe) graba la consulta y deja que la IA arme el SOAP.",
    href: "/dashboard/notas",
    icon: FileText,
  },
  scribe: {
    key: "scribe",
    name: "Scribe ambient",
    description:
      "Grabas la consulta — Whisper transcribe en español y Llama 3.3 70B la estructura como SOAP en segundos. Tú firmas la versión final.",
    howToUse:
      "Scribe → Empezar grabación. Habla normal con el paciente. Detén la grabación al terminar. En 10-20 segundos tienes el SOAP estructurado listo para revisar.",
    href: "/dashboard/scribe",
    icon: Mic,
  },
  "cerebro-read": {
    key: "cerebro-read",
    name: "Cerebro — búsqueda en guías",
    description:
      "Busca recomendaciones verbatim en IMSS, CENETEC, NICE, KDIGO, ESC, AHA, Mayo Clinic. Cada respuesta cita la página exacta del documento fuente.",
    howToUse:
      "Cerebro → escribe tu pregunta clínica en español ('Iniciar SGLT2i en ERC etapa 3'). Te devuelve el chunk verbatim de la guía oficial con número de página y URL.",
    href: "/dashboard/cerebro",
    icon: BookOpen,
  },
  "cerebro-full": {
    key: "cerebro-full",
    name: "Cerebro completo + Q&A",
    description:
      "Búsqueda + Q&A conversacional + comparación entre guías. Útil para casos donde IMSS dice una cosa y ESC otra.",
    howToUse:
      "Cerebro → activa modo Q&A. Pega historia clínica completa y pregunta ('¿qué guía recomienda PCSK9 para este perfil?'). Respuesta con citas paralelas.",
    href: "/dashboard/cerebro",
    icon: BookOpen,
  },
  diferencial: {
    key: "diferencial",
    name: "Diferencial bayesiano",
    description:
      "28 enfermedades complejas (ATTR-CM, EhD, Cushing, sarcoidosis, etc.) con 51 findings. Inferencia bayesiana en vivo.",
    howToUse:
      "Diferencial → pega H&P o lista de findings. La IA extrae automáticamente los findings reconocidos y calcula top-5 con probabilidades + LR+ de cada signo.",
    href: "/dashboard/diferencial",
    icon: Sparkles,
  },
  recetas: {
    key: "recetas",
    name: "Recetas electrónicas NOM-024",
    description:
      "Recetas digitales con código QR de verificación, firmas conforme NOM-024-SSA3, exportación PDF.",
    howToUse:
      "Recetas → Nueva receta. Carga paciente, agrega medicamentos del catálogo COFEPRIS. Firma y descarga PDF o envía por correo.",
    href: "/dashboard/recetas",
    icon: Pill,
  },
  agenda: {
    key: "agenda",
    name: "Agenda + reservación pública",
    description:
      "Calendario semanal de citas. Tus pacientes reservan solos desde un link público tipo Calendly. Recordatorios automáticos por WhatsApp/correo.",
    howToUse:
      "Agenda → configura horarios. Configuración → activa reservación pública. Comparte tu link público para que pacientes reserven sin llamarte.",
    href: "/dashboard/agenda",
    icon: Calendar,
  },
  odontograma: {
    key: "odontograma",
    name: "Odontograma digital",
    description:
      "Mapa dental visual con estado por pieza, tratamientos realizados y pendientes. Export PDF para expediente.",
    howToUse:
      "Odontograma → selecciona paciente. Click sobre cada pieza para marcar estado (caries, ausente, corona, etc.). Exportas PDF o adjuntas a la nota SOAP.",
    href: "/dashboard/odontograma",
    icon: Smile,
  },
  rcm: {
    key: "rcm",
    name: "RCM Copilot (próximamente)",
    description:
      "Validación de pólizas en vivo, predicción de denegaciones, automatización facturación, seguimiento de cobranza. Llega 2027.",
    howToUse:
      "Disponible solo en plan Clínica. Cuando lance, validas cobertura del paciente en el momento de la consulta y predices qué claims rechazará la aseguradora antes de enviarlos.",
    href: "/precios",
    icon: ShieldCheck,
  },
  "multi-medico": {
    key: "multi-medico",
    name: "Multi-médico + roles",
    description:
      "Varios médicos en la misma cuenta con roles personalizados (recepción, médico, director médico). Director ve métricas agregadas.",
    howToUse:
      "Disponible en plan Clínica. Configuras roles desde admin → invitas a cada médico → cada uno entra con magic link y ve solo lo que su rol permite.",
    href: "/precios",
    icon: Stethoscope,
  },
};

function featuresUnlocked(tier: SubscriptionTier): FeatureKey[] {
  const list: FeatureKey[] = ["soap"];
  if (canUseScribe(tier)) list.push("scribe");
  if (canUseCerebro(tier)) {
    list.push("cerebro-full", "diferencial");
  } else if (canReadCerebro(tier)) {
    list.push("cerebro-read");
  }
  if (canUseRecetas(tier)) list.push("recetas");
  if (canUseAgenda(tier)) list.push("agenda");
  list.push("odontograma"); // disponible en todos los tiers
  if (canUseRcm(tier)) {
    list.push("rcm", "multi-medico");
  }
  return list;
}

function featuresLocked(tier: SubscriptionTier): FeatureKey[] {
  const unlocked = new Set(featuresUnlocked(tier));
  const all: FeatureKey[] = [
    "scribe",
    "cerebro-read",
    "cerebro-full",
    "diferencial",
    "recetas",
    "agenda",
    "rcm",
    "multi-medico",
  ];
  return all.filter((k) => !unlocked.has(k));
}

const USE_CASES: Record<SubscriptionTier, string[]> = {
  free: [
    "Probar el sistema antes de comprometerte: capturas hasta 5 SOAPs al mes a mano y buscas en el cerebro para verificar que las citas verbatim funcionan con tus casos reales.",
    "Médico que aún evalúa: usa la búsqueda en guías como reemplazo de UpToDate durante un mes y mide si te ahorra tiempo real.",
  ],
  esencial: [
    "Médico privado de consultorio con 5-10 pacientes/día: notas SOAP, recetas electrónicas con QR y cerebro para resolver dudas de guías clínicas.",
    "Dentista con consulta activa: SOAP + odontograma digital + recetas NOM-024 todo en un sistema.",
    "Residente o subespecialista joven: usa el cerebro como UpToDate en español + lleva expediente digital sin pagar suite completa.",
  ],
  pilot: [
    "Médico piloto (founding member): Scribe gratis durante el piloto para grabar todas tus consultas y evaluar la calidad del SOAP automático antes de pagar.",
    "Tu feedback se incorpora directo al producto. Acceso a la comunidad de WhatsApp con otros founders.",
  ],
  pro: [
    "Especialista activo (cardiólogo, internista, endocrinólogo): graba con Scribe, usa diferencial bayesiano para los casos complejos que no te cuadran y publica tu agenda con reservación pública.",
    "Cardiólogo con HFpEF + CTS bilateral: en lugar de 6.1 años para diagnosticar ATTR-CM, el diferencial te lo sugiere en la primera consulta con cita verbatim 2025 ACC pág. 14.",
    "Médico con consultorio establecido: agenda pública + recordatorios automáticos por WhatsApp = menos no-shows + menos llamadas para confirmar citas.",
  ],
  enterprise: [
    "Director médico de clínica con 5-15 médicos: dashboard agregado con % de pacientes en meta clínica, cumplimiento NOM-024, productividad por médico.",
    "Hospital privado mediano: integración con tu HIS existente sin reemplazarlo. RCM Copilot reduce DSO de 60-90 días a 30-45 vía predicción de denegaciones y validación de pólizas en vivo.",
    "Multi-médico con roles personalizados (recepción, médico, director). Onboarding personalizado + capacitación + SLA 99.5%.",
  ],
};

export default async function MiPlanPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier, nombre, hospital")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;

  // Uso del mes — solo notas SOAP, que es el contador principal
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const { count: notasMes } = await supa
    .from("notas_scribe")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString());

  const usedThisMonth = notasMes ?? 0;
  const limit = scribeMonthlyLimit(tier);
  const usagePct =
    Number.isFinite(limit) && limit > 0
      ? Math.min(100, Math.round((usedThisMonth / limit) * 100))
      : 0;

  const unlocked = featuresUnlocked(tier);
  const locked = featuresLocked(tier);
  const useCases = USE_CASES[tier] ?? [];

  return (
    <div className="space-y-10">
      {/* Header del plan */}
      <header>
        <Eyebrow tone="validation">Tu plan</Eyebrow>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-h1 font-semibold tracking-tight text-ink-strong">
              {TIER_LABELS[tier]}
            </h1>
            <p className="mt-2 max-w-prose text-body text-ink-muted">
              {TIER_DESCRIPTIONS[tier]}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-caption font-semibold ${tierBadgeClass(
              tier,
            )}`}
          >
            Plan activo
          </span>
        </div>

        {/* Uso del mes (solo si hay límite) */}
        {Number.isFinite(limit) && limit > 0 && (
          <div className="mt-6 max-w-md rounded-xl border border-line bg-surface px-5 py-4 shadow-soft">
            <div className="flex items-baseline justify-between">
              <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
                Notas este mes
              </p>
              <p className="text-body-sm font-semibold text-ink-strong">
                {usedThisMonth}{" "}
                <span className="text-ink-muted font-normal">/ {limit}</span>
              </p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
              <div
                className="h-full rounded-full bg-validation transition-all"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            {usagePct >= 80 && (
              <p className="mt-2 text-caption text-warn">
                Estás cerca del límite. Considera subir de plan si lo
                necesitas.
              </p>
            )}
          </div>
        )}
        {limit === Infinity && (
          <p className="mt-4 text-caption text-validation">
            Tu plan no tiene límite mensual de notas.
          </p>
        )}
      </header>

      {/* Lo que está activo */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
            Lo que tienes desbloqueado
          </h2>
          <p className="text-caption text-ink-muted">
            {unlocked.length} {unlocked.length === 1 ? "función" : "funciones"}{" "}
            activas
          </p>
        </div>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
          Tu plan {TIER_LABELS[tier]} te da acceso a estas funciones. Click en
          cualquiera para abrirla directo, o lee &ldquo;Cómo se usa&rdquo;
          primero.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {unlocked.map((key) => {
            const f = FEATURES[key];
            const Icon = f.icon;
            return (
              <Link
                key={key}
                href={f.href}
                className="group flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 transition-all hover:border-validation hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-validation-soft p-2 text-validation">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <h3 className="text-body font-semibold text-ink-strong">
                      {f.name}
                    </h3>
                  </div>
                  <CheckCircle2
                    className="mt-1 h-4 w-4 shrink-0 text-validation"
                    strokeWidth={2.4}
                  />
                </div>
                <p className="text-body-sm text-ink-muted leading-relaxed">
                  {f.description}
                </p>
                <div className="rounded-lg bg-surface-alt px-3 py-2.5">
                  <p className="text-caption font-semibold uppercase tracking-eyebrow text-ink-soft">
                    Cómo se usa
                  </p>
                  <p className="mt-1 text-caption text-ink-strong leading-relaxed">
                    {f.howToUse}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-caption font-medium text-validation group-hover:gap-1.5 transition-all">
                  Abrir
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Lo que falta (si hay) */}
      {locked.length > 0 && (
        <section>
          <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
            Lo que aún no tienes
          </h2>
          <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
            Estas funciones requieren un plan superior. Si las necesitas,
            puedes subir de plan en cualquier momento — el cambio surte efecto
            inmediato con prorrateo.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {locked.map((key) => {
              const f = FEATURES[key];
              const Icon = f.icon;
              return (
                <div
                  key={key}
                  className="flex flex-col gap-2 rounded-xl border border-line bg-surface-alt p-5 opacity-90"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-surface p-2 text-ink-quiet">
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <h3 className="text-body font-semibold text-ink-muted">
                        {f.name}
                      </h3>
                    </div>
                    <Lock
                      className="mt-1 h-4 w-4 shrink-0 text-ink-quiet"
                      strokeWidth={2.2}
                    />
                  </div>
                  <p className="text-body-sm text-ink-muted leading-relaxed">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/precios" className="lg-cta-primary">
              <CreditCard className="h-4 w-4" />
              Ver planes y subir de tier
            </Link>
            <Link href="/contacto" className="lg-cta-ghost">
              Hablar con ventas
            </Link>
          </div>
        </section>
      )}

      {/* Casos de uso del plan */}
      {useCases.length > 0 && (
        <section className="rounded-2xl border border-accent-soft bg-accent-soft/30 p-6 lg:p-8">
          <Eyebrow tone="accent">Cómo lo usan otros médicos</Eyebrow>
          <h2 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
            Casos típicos del plan {TIER_LABELS[tier]}
          </h2>
          <ul className="mt-5 space-y-3">
            {useCases.map((useCase, idx) => (
              <li
                key={idx}
                className="flex gap-3 text-body-sm leading-relaxed text-ink-strong"
              >
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[0.65rem] font-bold text-canvas">
                  {idx + 1}
                </span>
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer: gestión y soporte */}
      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/billing"
          className="lg-card transition-all hover:border-line-strong hover:shadow-lift"
        >
          <Eyebrow tone="validation">Facturación</Eyebrow>
          <p className="mt-2 text-body-sm font-semibold text-ink-strong">
            Método de pago, recibos, cambiar plan
          </p>
          <p className="mt-1 text-caption text-ink-muted">
            Gestiona tu suscripción y descarga facturas fiscales con tu RFC.
          </p>
        </Link>
        <a
          href="mailto:compras@grupoprodi.net?subject=Consulta%20sobre%20mi%20plan%20LitienGuard"
          className="lg-card transition-all hover:border-line-strong hover:shadow-lift"
        >
          <Eyebrow tone="accent">¿Dudas?</Eyebrow>
          <p className="mt-2 text-body-sm font-semibold text-ink-strong">
            Escríbenos
          </p>
          <p className="mt-1 text-caption text-ink-muted">
            compras@grupoprodi.net · Te respondemos en el mismo día hábil con
            recomendaciones específicas para tu práctica.
          </p>
        </a>
      </section>
    </div>
  );
}
