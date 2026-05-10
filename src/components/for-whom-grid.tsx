import Link from "next/link";
import { ArrowUpRight, Stethoscope, HeartPulse, Building2 } from "lucide-react";
import { TiltCard } from "@/components/tilt-card";
import { Eyebrow } from "@/components/eyebrow";

const PERSONAS = [
  {
    eyebrow: "Capa A · Médico",
    icon: Stethoscope,
    title: "Para médicos.",
    desc: "Evidencia clínica con cita verbatim, scribe ambient SOAP en segundos y un loop de calidad sobre tus propias decisiones.",
    href: "/medicos",
    cta: "Ver para médicos",
  },
  {
    eyebrow: "Capa C · Paciente",
    icon: HeartPulse,
    title: "Para pacientes.",
    desc: "LitienGuard Asistencia: navega tus derechos, triaje rápido, comparador de cobertura y plan integrado en PDF.",
    href: "/pacientes",
    cta: "Ver para pacientes",
  },
  {
    eyebrow: "Capa B · G · Hospital",
    icon: Building2,
    title: "Para hospitales.",
    desc: "RCM Copilot que recupera 5–15% de ingresos, EHR ligero compatible con SINBA y Credencial Paciente 2026.",
    href: "/hospitales",
    cta: "Ver para hospitales",
  },
];

export function ForWhomGrid() {
  return (
    <section className="border-b border-line bg-canvas py-24">
      <div className="lg-shell">
        <div className="mb-12 max-w-2xl">
          <Eyebrow>Tres frentes — un solo cerebro</Eyebrow>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Misma evidencia, tres lenguajes distintos.
          </h2>
          <p className="mt-4 text-body text-ink-muted">
            Médicos consultan en lenguaje técnico. Pacientes leen el plan en
            simple. Hospitales reciben el reporte que cobra. Es la misma fuente,
            adaptada a quien la usa.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            return (
              <TiltCard key={p.href} className="flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <Eyebrow tone="validation">{p.eyebrow}</Eyebrow>
                  <Icon className="h-5 w-5 text-ink-soft" strokeWidth={1.6} />
                </div>
                <h3 className="mt-4 text-h2 font-semibold tracking-tight text-ink-strong">
                  {p.title}
                </h3>
                <p className="mt-3 flex-1 text-body-sm leading-relaxed text-ink-muted">
                  {p.desc}
                </p>
                <Link
                  href={p.href}
                  className="mt-6 inline-flex items-center gap-1.5 text-body-sm font-medium text-accent transition-colors hover:text-accent-deep"
                >
                  {p.cta}
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                </Link>
              </TiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
