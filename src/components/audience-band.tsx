import Link from "next/link";
import { Building2, Stethoscope, UserCheck, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Eyebrow } from "@/components/eyebrow";

interface Audience {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  href: string;
  cta: string;
  tone: "validation" | "accent" | "rose";
}

const AUDIENCES: Audience[] = [
  {
    icon: Building2,
    eyebrow: "Hospital",
    title: "Plataforma completa multi-departamento",
    description:
      "Si operas un hospital privado mediano a grande con Urgencias, UCI, Quirófano y especialidades.",
    highlights: [
      "Bed Management + 10 departamentos",
      "RCM con validación de pólizas",
      "Multi-médico + admin tools",
      "SLA enterprise + soporte 24/7",
    ],
    href: "/hospitales",
    cta: "Solución para hospitales",
    tone: "validation",
  },
  {
    icon: Stethoscope,
    eyebrow: "Especialista",
    title: "Cerebro clínico de tu especialidad",
    description:
      "Si eres cardiólogo, neurólogo, oncólogo o endocrinólogo en práctica privada o consultorio.",
    highlights: [
      "Cerebro completo + diferencial",
      "Tu módulo de especialidad (HEART, NIHSS, ECOG, HbA1c)",
      "Patrones personales + loop de calidad",
      "Cruces clínicos multivariables",
    ],
    href: "/medicos",
    cta: "Para médicos especialistas",
    tone: "accent",
  },
  {
    icon: UserCheck,
    eyebrow: "Práctica individual",
    title: "Scribe + cerebro de lectura",
    description:
      "Si eres médico general, dentista o practicante individual con padrón propio y consulta privada.",
    highlights: [
      "Scribe 100 SOAPs/mes",
      "Cerebro lectura (búsqueda de guías)",
      "Recetas, agenda, padrón de pacientes",
      "Importación desde fotos/PDFs",
    ],
    href: "/precios",
    cta: "Plan Esencial",
    tone: "rose",
  },
];

const TONE_RING = {
  validation: "ring-validation/30",
  accent: "ring-accent/30",
  rose: "ring-rose/30",
};

const TONE_ICON_BG = {
  validation: "bg-validation-soft text-validation",
  accent: "bg-accent-soft text-accent",
  rose: "bg-rose-soft text-rose",
};

export function AudienceBand() {
  return (
    <section className="border-b border-line bg-surface-alt py-20 lg:py-28">
      <div className="lg-shell">
        <div className="max-w-3xl">
          <Eyebrow>Plataforma única, tres formas de usarla</Eyebrow>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Una solución para cada escala de práctica clínica.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted leading-relaxed">
            El mismo cerebro de evidencia. Las features que activamos
            cambian según la escala de tu operación — médico individual,
            especialista o hospital multi-departamento.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {AUDIENCES.map((a) => {
            const Icon = a.icon;
            return (
              <article
                key={a.title}
                className={`group flex flex-col rounded-2xl border border-line bg-surface p-7 transition-all hover:shadow-lift hover:ring-2 hover:${TONE_RING[a.tone]}`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${TONE_ICON_BG[a.tone]}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="mt-5 text-caption font-semibold uppercase tracking-eyebrow text-ink-soft">
                  {a.eyebrow}
                </p>
                <h3 className="mt-1 text-h3 font-semibold tracking-tight text-ink-strong">
                  {a.title}
                </h3>
                <p className="mt-2 text-body-sm text-ink-muted leading-relaxed">
                  {a.description}
                </p>
                <ul className="mt-4 space-y-1.5 flex-1">
                  {a.highlights.map((h) => (
                    <li
                      key={h}
                      className="flex items-start gap-2 text-caption text-ink-strong"
                    >
                      <span className="mt-1.5 inline-flex h-1 w-1 shrink-0 rounded-full bg-validation" />
                      {h}
                    </li>
                  ))}
                </ul>
                <Link
                  href={a.href}
                  className="mt-6 inline-flex items-center gap-1 text-body-sm font-semibold text-validation group-hover:gap-2 transition-all"
                >
                  {a.cta}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
