import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Heart,
  Brain,
  Activity,
  Droplet,
  ChevronRight,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import {
  canUseCerebro,
  shouldShowEspecialidadesMedicas,
  type SubscriptionTier,
  type ProfileType,
} from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Especialidades clínicas — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface SpecModule {
  href: string;
  label: string;
  description: string;
  score: string;
  icon: LucideIcon;
  modulo: string;
  tone: string;
}

const MODULES: SpecModule[] = [
  {
    href: "/dashboard/cardiologia",
    label: "Cardiología",
    description:
      "Estratificación de pacientes con dolor torácico y riesgo de síndrome coronario agudo.",
    score: "HEART score",
    icon: Heart,
    modulo: "cardiologia",
    tone: "border-rose/30 bg-rose-soft/30 text-rose",
  },
  {
    href: "/dashboard/neurologia",
    label: "Neurología",
    description:
      "Evaluación de severidad de EVC y candidatura a tratamiento trombolítico.",
    score: "NIHSS",
    icon: Brain,
    modulo: "neurologia",
    tone: "border-accent/30 bg-accent-soft/30 text-accent",
  },
  {
    href: "/dashboard/oncologia",
    label: "Oncología",
    description:
      "Performance status del paciente oncológico y aptitud para terapia.",
    score: "ECOG / Karnofsky",
    icon: Activity,
    modulo: "oncologia",
    tone: "border-warn/30 bg-warn-soft/30 text-warn",
  },
  {
    href: "/dashboard/endocrinologia",
    label: "Endocrinología",
    description:
      "Control glucémico individualizado en pacientes con diabetes.",
    score: "HbA1c control",
    icon: Droplet,
    modulo: "endocrinologia",
    tone: "border-validation/30 bg-validation-soft/30 text-validation",
  },
];

export default async function EspecialidadesHubPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier, profile_type")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const profileType = (profile?.profile_type ??
    "sin_definir") as ProfileType;

  if (!shouldShowEspecialidadesMedicas(profileType)) {
    return (
      <div className="space-y-3">
        <Eyebrow tone="warn">No aplicable a tu perfil</Eyebrow>
        <h1 className="text-h1 font-semibold tracking-tight text-ink-strong">
          Especialidades médicas no están en tu vertical actual
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
          Estos módulos están diseñados para médicos generales y hospitales.
          Si tu práctica es de otra área, revisa tu perfil en configuración.
        </p>
        <Link
          href="/dashboard/configuracion"
          className="lg-cta-primary mt-2 inline-flex"
        >
          Ir a configuración
        </Link>
      </div>
    );
  }

  if (!canUseCerebro(tier)) {
    return (
      <div className="space-y-3">
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="text-h1 font-semibold tracking-tight text-ink-strong">
          Especialidades clínicas — Plan Profesional o superior
        </h1>
        <Link href="/precios" className="lg-cta-primary mt-2 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  // Conteo de eventos por especialidad (últimos 30 días)
  const desdeIso = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data: conteos } = await supa
    .from("eventos_modulos")
    .select("modulo")
    .eq("user_id", user.id)
    .gte("created_at", desdeIso);

  const conteoPorModulo = new Map<string, number>();
  for (const e of conteos ?? []) {
    const m = e.modulo as string;
    conteoPorModulo.set(m, (conteoPorModulo.get(m) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <Eyebrow tone="validation">Especialidades clínicas</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Departamentos por dominio clínico
        </h1>
        <p className="mt-3 text-body text-ink-muted leading-relaxed">
          Cuatro especialidades con scores clínicos validados, registro de
          pacientes y seguimiento longitudinal. Los módulos se construyen
          sobre el cerebro curado de evidencia, anclados a guías
          internacionales (AHA, ESC, ADA, NCCN, NIH NINDS).
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        {MODULES.map((m) => {
          const Icon = m.icon;
          const count = conteoPorModulo.get(m.modulo) ?? 0;
          return (
            <Link
              key={m.modulo}
              href={m.href}
              className="group flex flex-col rounded-xl border border-line bg-surface p-5 transition-all hover:border-validation/40 hover:shadow-lift"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${m.tone}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                {count > 0 && (
                  <span className="inline-flex items-center rounded-full bg-validation-soft px-2 py-0.5 text-caption font-semibold text-validation">
                    {count} en 30 d
                  </span>
                )}
              </div>
              <div className="mt-4">
                <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
                  {m.label}
                </h2>
                <p className="mt-0.5 text-caption text-ink-soft font-semibold">
                  {m.score}
                </p>
              </div>
              <p className="mt-2 text-caption text-ink-muted leading-relaxed flex-1">
                {m.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-caption font-semibold text-validation group-hover:gap-2 transition-all">
                Abrir departamento
                <ChevronRight className="h-3 w-3" strokeWidth={2.4} />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="rounded-xl border border-line bg-surface-alt px-5 py-4">
        <p className="text-caption text-ink-muted leading-relaxed max-w-3xl">
          <span className="font-semibold text-ink-strong">Más especialidades.</span>{" "}
          Próximamente: Gineco-obstetricia, Reumatología, Nefrología, Pediatría,
          Medicina interna. Cada nueva especialidad agrega su score
          representativo + cruces clínicos con las ya existentes.
        </p>
      </section>
    </div>
  );
}
