import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Siren,
  HeartPulse,
  ClipboardCheck,
  FlaskConical,
  ScanLine,
  ChevronRight,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import type { LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Operaciones hospitalarias — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface OpModule {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  modulo: string;
  tone: string;
}

const MODULES: OpModule[] = [
  {
    href: "/dashboard/urgencias",
    label: "Urgencias",
    description:
      "Tracking board en tiempo real + protocolos críticos (sepsis 1h, código stroke, código IAM, DKA).",
    icon: Siren,
    modulo: "urgencias",
    tone: "border-rose/30 bg-rose-soft/30 text-rose",
  },
  {
    href: "/dashboard/uci",
    label: "UCI",
    description:
      "Critical care con SOFA seguimiento + scores pronósticos + monitoreo longitudinal.",
    icon: HeartPulse,
    modulo: "uci",
    tone: "border-warn/30 bg-warn-soft/30 text-warn",
  },
  {
    href: "/dashboard/quirofano",
    label: "Quirófano",
    description:
      "Surgical flow con checklist WHO + outcomes 30 días + risk scoring perioperatorio.",
    icon: ClipboardCheck,
    modulo: "quirofano",
    tone: "border-accent/30 bg-accent-soft/30 text-accent",
  },
  {
    href: "/dashboard/laboratorio",
    label: "Laboratorio",
    description:
      "Lab pathway 8 fases con catálogo MX, peticiones, resultados y critical value alerting.",
    icon: FlaskConical,
    modulo: "laboratorio",
    tone: "border-validation/30 bg-validation-soft/30 text-validation",
  },
  {
    href: "/dashboard/radiologia",
    label: "Radiología",
    description:
      "Worklist priorizada con catálogo de estudios, templates estructurados y critical findings.",
    icon: ScanLine,
    modulo: "radiologia",
    tone: "border-ink/20 bg-surface-alt text-ink-strong",
  },
];

export default async function OperacionesHubPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;

  if (!canUseCerebro(tier)) {
    return (
      <div className="space-y-3">
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="text-h1 font-semibold tracking-tight text-ink-strong">
          Operaciones hospitalarias — Plan Profesional o superior
        </h1>
        <Link href="/precios" className="lg-cta-primary mt-2 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  // Conteo de eventos activos por módulo (últimas 24h)
  const desdeIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
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

  const totalActivos = (conteos ?? []).length;

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <Eyebrow tone="validation">Operaciones hospitalarias</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Workflows operacionales del hospital
        </h1>
        <p className="mt-3 text-body text-ink-muted leading-relaxed">
          Cinco áreas de operación hospitalaria — cuidados críticos (Urgencias,
          UCI, Quirófano) y apoyo diagnóstico (Laboratorio, Radiología) — cada
          una con su workflow operativo. {totalActivos > 0 && (
            <span className="text-ink-strong font-semibold">
              {totalActivos} evento{totalActivos === 1 ? "" : "s"} registrado
              {totalActivos === 1 ? "" : "s"} en las últimas 24 h.
            </span>
          )}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    {count} en 24 h
                  </span>
                )}
              </div>
              <h2 className="mt-4 text-h3 font-semibold tracking-tight text-ink-strong">
                {m.label}
              </h2>
              <p className="mt-1 text-caption text-ink-muted leading-relaxed flex-1">
                {m.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-caption font-semibold text-validation group-hover:gap-2 transition-all">
                Abrir workflow
                <ChevronRight className="h-3 w-3" strokeWidth={2.4} />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="rounded-xl border border-line bg-surface-alt px-5 py-4">
        <p className="text-caption text-ink-muted leading-relaxed max-w-3xl">
          <span className="font-semibold text-ink-strong">
            Motor LitienGuard · Hospital Operations.
          </span>{" "}
          Cinco workflows operacionales con scoring clínico, tracking
          de tiempos y métricas de calidad alineadas a estándares
          hospitalarios internacionales.
        </p>
      </section>
    </div>
  );
}
