import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  FileCheck,
  Network,
  KeyRound,
  Activity,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Eyebrow } from "@/components/eyebrow";
import { TiltCard } from "@/components/tilt-card";

export const metadata: Metadata = {
  title: "Reforma LGS Salud Digital 2026 — LitienGuard",
  description:
    "México oficializó por ley telemedicina, telesalud, SINBA y la credencial del paciente. LitienGuard nació compatible — los EHRs tradicionales van a tener que migrar.",
};

const MANDATOS = [
  {
    icon: Network,
    title: "Telemedicina y telesalud oficializadas",
    desc: "La consulta remota deja de ser zona gris regulatoria. Toda plataforma debe documentar el flujo y cumplir con protocolos técnicos.",
  },
  {
    icon: FileCheck,
    title: "SINBA y SINAIS — reporteo obligatorio",
    desc: "Sistema Nacional de Información Básica de Salud + Información en Salud. Hospitales y consultorios reportarán a federales.",
  },
  {
    icon: KeyRound,
    title: "Credencial del paciente lanzada",
    desc: "Identidad nacional clínica unificada. Habilita interoperabilidad real entre IMSS, ISSSTE, privado y INSABI.",
  },
  {
    icon: ShieldCheck,
    title: "Protocolos de ciberseguridad mandatados",
    desc: "Cifrado, autenticación, audit log y protección de datos personales en salud — ya no es opcional.",
  },
];

const PREPARACION = [
  {
    label: "Cifrado AES-256 nivel bancario",
    detail: "Doble capa sobre el contenido clínico — gestión de claves dedicada.",
  },
  {
    label: "Audit log inmutable",
    detail: "Cada acceso queda registrado con usuario, fecha y dispositivo.",
  },
  {
    label: "Compatible con credencial paciente",
    detail: "Arquitectura preparada para identidad clínica federada desde día uno.",
  },
  {
    label: "Estructura conforme NOM-024-SSA3",
    detail: "Expediente clínico electrónico siguiendo norma oficial mexicana.",
  },
  {
    label: "Cumplimiento LFPDPPP",
    detail: "Aviso de privacidad, consentimientos, derechos ARCO automatizados.",
  },
  {
    label: "Reporteo SINBA / SINAIS — listo",
    detail: "Módulo de reporteo estandarizado para autoridades sanitarias.",
  },
];

const COMPARATIVO = [
  {
    quien: "LitienGuard",
    hoy: "Compatible Reforma LGS 2026 desde el día uno",
    despues: "Sin migración — opera bajo el nuevo marco regulatorio",
    tone: "validation" as const,
  },
  {
    quien: "EHRs tradicionales",
    hoy: "Construidos antes de la reforma; cumplen NOM-024 base",
    despues:
      "Requieren migración a estructuras nuevas — proyecto multi-anual costoso",
    tone: "warn" as const,
  },
];

export default function Reforma2026Page() {
  return (
    <>
      <PageHero
        eyebrow="Mandato regulatorio · DOF 2026"
        title={
          <>
            La Reforma LGS Salud Digital{" "}
            <span className="lg-serif-italic text-validation">
              ya no es opcional
            </span>
            .
          </>
        }
        description="México publicó en 2026 una reforma a la Ley General de Salud que oficializa telemedicina, telesalud, salud móvil, mandata protocolos de ciberseguridad y empuja la credencialización del paciente. Lo que LitienGuard construye no es una propuesta — está mandatado por ley."
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <div className="max-w-3xl">
            <Eyebrow tone="warn">El cambio de pregunta</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              De &quot;¿por qué necesito esto?&quot; a &quot;¿con quién lo implemento?&quot;
            </h2>
            <p className="mt-4 max-w-prose text-body text-ink-muted leading-relaxed">
              La reforma cambia la conversación con el director médico, el
              área de cumplimiento y la autoridad sanitaria. Ya no se trata de
              convencer de que la salud digital es importante. Se trata de
              decidir con qué plataforma cumplir la obligación regulatoria.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <Eyebrow>Lo que mandata la reforma</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Cuatro frentes obligatorios.
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {MANDATOS.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.title}
                  className="rounded-xl border border-line bg-surface p-5"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-validation-soft text-validation">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <h3 className="mt-3 text-h3 font-semibold tracking-tight text-ink-strong">
                    {m.title}
                  </h3>
                  <p className="mt-1.5 text-body-sm text-ink-muted leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <Eyebrow tone="validation">Nuestra postura</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Lo que LitienGuard ya tiene listo.
          </h2>
          <p className="mt-3 max-w-prose text-body text-ink-muted">
            Mientras los EHRs tradicionales evalúan migraciones, LitienGuard
            opera desde el día uno sobre la arquitectura que la reforma exige.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {PREPARACION.map((p) => (
              <div
                key={p.label}
                className="flex items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3"
              >
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-validation"
                  strokeWidth={2.2}
                />
                <div className="min-w-0">
                  <p className="text-body-sm font-semibold text-ink-strong leading-snug">
                    {p.label}
                  </p>
                  <p className="mt-0.5 text-caption text-ink-muted leading-snug">
                    {p.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <Eyebrow>El comparativo cuando llegue la obligación</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Quién migra y quién ya está adentro.
          </h2>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {COMPARATIVO.map((c) => (
              <TiltCard key={c.quien} className="p-5">
                <Eyebrow tone={c.tone}>{c.quien}</Eyebrow>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                      Estado actual
                    </p>
                    <p className="mt-1 text-body-sm text-ink-strong leading-snug">
                      {c.hoy}
                    </p>
                  </div>
                  <div>
                    <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                      Cuando la obligación entre en vigor
                    </p>
                    <p className="mt-1 text-body-sm text-ink-strong leading-snug">
                      {c.despues}
                    </p>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <div className="max-w-3xl">
            <Eyebrow tone="validation">Para directores médicos</Eyebrow>
            <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
              Hablemos de implementación.
            </h2>
            <p className="mt-4 max-w-prose text-body text-ink-muted leading-relaxed">
              Si tu hospital o clínica está evaluando cómo cumplir con la
              Reforma LGS 2026 antes de que la obligatoriedad operativa
              entre en vigor, podemos sentarnos a revisar tu situación
              específica y aterrizar un plan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/contacto?plan=enterprise"
                className="lg-cta-primary inline-flex items-center gap-2"
              >
                Agendar conversación
                <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
              </Link>
              <Link href="/hospitales" className="lg-cta-ghost">
                Ver para hospitales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt py-14">
        <div className="lg-shell">
          <div className="flex items-start gap-4 max-w-3xl">
            <Activity
              className="mt-1 h-5 w-5 shrink-0 text-ink-soft"
              strokeWidth={2}
            />
            <p className="text-caption text-ink-muted leading-relaxed">
              <span className="font-semibold text-ink-strong">
                Aviso legal:
              </span>{" "}
              Este documento describe nuestra preparación técnica conforme al
              marco regulatorio vigente. La certificación formal por la
              Secretaría de Salud y los avales correspondientes (COFEPRIS,
              CSG) son hitos en curso. Para detalles vinculantes específicos
              de tu institución, consulta a tu asesor regulatorio.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
