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
  Users,
  CheckCircle2,
  Archive,
  Bed,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseHospitalModules, type SubscriptionTier } from "@/lib/entitlements";
import { Eyebrow } from "@/components/eyebrow";
import { ClinicalMetric } from "@/components/clinical/clinical-metric";
import { getEncounterCensus } from "@/lib/encounters/queries";
import type { LucideIcon } from "lucide-react";
import type { EncounterModulo } from "@/lib/encounters/types";

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
  modulo: EncounterModulo;
  tone: string;
}

const MODULES: OpModule[] = [
  {
    href: "/dashboard/urgencias",
    label: "Urgencias",
    description:
      "Patient Tracking Board en tiempo real + protocolos críticos (sepsis 1h, código stroke, código IAM, DKA).",
    icon: Siren,
    modulo: "urgencias",
    tone: "border-rose/30 bg-rose-soft/30 text-rose",
  },
  {
    href: "/dashboard/uci",
    label: "UCI",
    description:
      "Census board con SOFA evolución + bundle compliance (APACHE II, FAST-HUG, CAM-ICU).",
    icon: HeartPulse,
    modulo: "uci",
    tone: "border-warn/30 bg-warn-soft/30 text-warn",
  },
  {
    href: "/dashboard/quirofano",
    label: "Quirófano",
    description:
      "OR schedule + PACU con WHO Safety Checklist 3 pausas + RCRI perioperatorio.",
    icon: ClipboardCheck,
    modulo: "quirofano",
    tone: "border-accent/30 bg-accent-soft/30 text-accent",
  },
  {
    href: "/dashboard/laboratorio",
    label: "Laboratorio",
    description:
      "Critical values worklist + reflex testing + delta check con catálogo MX.",
    icon: FlaskConical,
    modulo: "laboratorio",
    tone: "border-validation/30 bg-validation-soft/30 text-validation",
  },
  {
    href: "/dashboard/radiologia",
    label: "Radiología",
    description:
      "Reading queue priorizada por urgencia + critical findings con callback + comparación previa.",
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

  if (!canUseHospitalModules(tier)) {
    return (
      <div className="space-y-3">
        <Eyebrow tone="warn">Plan requerido</Eyebrow>
        <h1 className="text-h1 font-semibold tracking-tight text-ink-strong">
          Operaciones hospitalarias — Plan Clínica
        </h1>
        <Link href="/precios" className="lg-cta-primary mt-2 inline-flex">
          Ver planes
        </Link>
      </div>
    );
  }

  const census = await getEncounterCensus(supa, { userId: user.id });

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <Eyebrow tone="validation">Operaciones hospitalarias</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Hospital Operating System
        </h1>
        <p className="mt-3 text-body text-ink-muted leading-relaxed">
          Census global del hospital · pacientes activos en este momento,
          egresos en seguimiento outcome 15 días, y archivo histórico para
          auditoría operacional.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <ClinicalMetric
          label="Census hospitalario"
          value={census.activos}
          unit={census.activos === 1 ? "paciente" : "pacientes"}
          icon={Users}
          critical={census.activos > 0}
          caption="en este momento"
        />
        <ClinicalMetric
          label="Alta últimos 15 días"
          value={census.altaReciente}
          unit="pacientes"
          icon={CheckCircle2}
          caption="ventana outcome inmediato"
        />
        <ClinicalMetric
          label="Histórico"
          value={census.historico}
          unit="encounters"
          icon={Archive}
          caption="archivo + analytics"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => {
          const Icon = m.icon;
          const entry = census.porModulo[m.modulo] ?? {
            activos: 0,
            altaReciente: 0,
          };
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
                <div className="flex flex-col items-end gap-1">
                  {entry.activos > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-code-red-bg/40 px-2 py-0.5 text-caption font-semibold text-code-red">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-code-red opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-code-red" />
                      </span>
                      {entry.activos} activo{entry.activos === 1 ? "" : "s"}
                    </span>
                  )}
                  {entry.altaReciente > 0 && (
                    <span className="inline-flex items-center rounded-full bg-validation-soft px-2 py-0.5 text-caption font-semibold text-validation">
                      {entry.altaReciente} en 15 d
                    </span>
                  )}
                </div>
              </div>
              <h2 className="mt-4 text-h3 font-semibold tracking-tight text-ink-strong">
                {m.label}
              </h2>
              <p className="mt-1 text-caption text-ink-muted leading-relaxed flex-1">
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
        <div className="flex items-start gap-3">
          <Bed className="mt-0.5 h-4 w-4 shrink-0 text-ink-quiet" strokeWidth={2} />
          <p className="text-caption text-ink-muted leading-relaxed max-w-3xl">
            <span className="font-semibold text-ink-strong">
              Motor LitienGuard · Hospital OS.
            </span>{" "}
            Cada departamento opera con su workflow nativo y reporta al
            census global. La ventana de 15 días post-alta permite cerrar
            el outcome loop antes de archivar al histórico.
          </p>
        </div>
      </section>
    </div>
  );
}
