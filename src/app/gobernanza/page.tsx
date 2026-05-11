import type { Metadata } from "next";
import {
  KeyRound,
  Users,
  ScrollText,
  Lock,
  Plug,
  UserCheck,
  Building2,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { FeatureList } from "@/components/feature-list";
import { FinalCta } from "@/components/final-cta";
import { TiltCard } from "@/components/tilt-card";
import { Eyebrow } from "@/components/eyebrow";

export const metadata: Metadata = {
  title: "Gobernanza de datos clínicos — LitienGuard",
  description:
    "La capa de identidad, cifrado, auditoría y cumplimiento sobre la que se construye cualquier sistema clínico moderno en México. Construida nativa para la Reforma de Salud Digital 2026, LFPDPPP, NOM-024 y la Credencial Paciente.",
};

const RETOS = [
  {
    title: "Reforma General de Salud Digital 2026",
    desc: "Telemedicina, telesalud, salud móvil y la interoperabilidad SINBA pasaron de ser opcionales a obligatorios. Quien no se adapte queda fuera.",
  },
  {
    title: "Credencial Paciente 2026",
    desc: "Identidad clínica unificada federal en camino. Los sistemas que no estén listos para emparejarla tendrán fricción para operar.",
  },
  {
    title: "LFPDPPP y derechos ARCO digitales",
    desc: "Los pacientes pueden ejercer acceso, rectificación, cancelación y oposición en cualquier momento. El sistema debe responderlos en 20 días hábiles, con trazabilidad.",
  },
  {
    title: "NOM-024-SSA3-2012",
    desc: "Obligatoria para cualquier establecimiento que opere un sistema de información de registro electrónico para la salud. El incumplimiento es sujeto a sanción.",
  },
];

const PIEZAS = [
  {
    icon: UserCheck,
    title: "Identidad clínica unificada",
    desc: "Un solo identificador del paciente conectado con CURP, RFC y la futura Credencial Paciente federal. Sin duplicados, sin expedientes huérfanos.",
  },
  {
    icon: Users,
    title: "Control de acceso basado en roles",
    desc: "Médico, asistente clínico, administrativo, auditor — cada rol con permisos específicos sobre qué puede leer, escribir y exportar. Defensa en profundidad por diseño.",
  },
  {
    icon: ScrollText,
    title: "Auditoría completa de todos los accesos",
    desc: "Cada lectura, cada modificación, cada exportación queda registrada con usuario, momento, dispositivo y motivo. Trazabilidad lista para auditoría sanitaria o judicial.",
  },
  {
    icon: Lock,
    title: "Cifrado en tránsito y en reposo",
    desc: "Conexiones TLS 1.3, almacenamiento cifrado con claves administradas, segmentación de información sensible. Estándares alineados con OWASP y los lineamientos COFEPRIS.",
  },
  {
    icon: Plug,
    title: "Transferencia controlada de datos",
    desc: "Cuando un dato sale del sistema (a un laboratorio, a un especialista, a una aseguradora), queda registrado el destinatario, el motivo y el consentimiento que lo autorizó.",
  },
  {
    icon: KeyRound,
    title: "Derechos ARCO automatizados",
    desc: "El paciente accede, rectifica, cancela u opone el uso de sus datos desde su propio portal. El sistema responde sin intervención manual del operador, en cumplimiento del artículo 32 de la LFPDPPP.",
  },
];

const AUDIENCIAS = [
  {
    icon: Building2,
    title: "Hospitales y redes de salud",
    desc: "La gobernanza incluida desde día uno te ahorra el costo de retrofit cuando la auditoría llegue. NOM-024, LFPDPPP y reporteo SINBA construidos en la arquitectura, no agregados encima.",
  },
  {
    icon: ShieldCheck,
    title: "Aseguradoras y administradoras",
    desc: "Reglas de acceso por convenio, segmentación por línea de producto, validación de pólizas con trazabilidad — la gobernanza permite operar con cumplimiento sin frenar el negocio.",
  },
  {
    icon: Stethoscope,
    title: "Profesionales de la salud",
    desc: "Tus expedientes viven en una arquitectura que cumple con la norma vigente y se anticipa a la próxima. Sin sustos cuando cambien las reglas — la base ya lo soportaba.",
  },
];

export default function GobernanzaPage() {
  return (
    <>
      <PageHero
        eyebrow="Gobernanza de datos clínicos"
        title={
          <>
            La capa{" "}
            <span className="lg-serif-italic text-validation">invisible</span>{" "}
            que sostiene todo lo demás.
          </>
        }
        description="Identidad, cifrado, control de acceso, auditoría, transferencia controlada y derechos ARCO automatizados. Todo construido nativamente para la Reforma General de Salud Digital 2026, la NOM-024-SSA3-2012, la LFPDPPP y la próxima Credencial Paciente federal."
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <Eyebrow>El reto regulatorio de México 2026</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Cuatro mandatos convergiendo en una sola arquitectura.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">
            La salud digital mexicana cambió de paradigma. Lo que antes era
            opcional ahora es obligatorio. Lo que antes vivía en silos ahora
            debe interoperar. Y los pacientes tienen herramientas para exigir
            sus derechos sobre sus datos.
          </p>
          <div className="mt-10">
            <FeatureList items={RETOS} />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt py-20">
        <div className="lg-shell">
          <Eyebrow tone="validation">Las seis piezas de gobernanza</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Lo que un sistema de salud serio debe cumplir hoy.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">
            Cada una opera en su propia capa, con sus propios accesos y su
            propio registro auditable. Juntas componen la base sobre la que
            cualquier producto clínico moderno debe construirse.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PIEZAS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-xl border border-line bg-surface p-5 shadow-soft"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-validation-soft text-validation">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <h3 className="mt-4 text-h3 font-semibold tracking-tight text-ink-strong">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-body-sm text-ink-muted leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-canvas py-20">
        <div className="lg-shell">
          <Eyebrow>Para quién es relevante</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Tres conversaciones distintas, una misma infraestructura.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {AUDIENCIAS.map((a) => {
              const Icon = a.icon;
              return (
                <TiltCard key={a.title} className="p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-validation-soft text-validation">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <h3 className="mt-4 text-h3 font-semibold tracking-tight text-ink-strong">
                    {a.title}
                  </h3>
                  <p className="mt-2 text-body-sm text-ink-muted leading-relaxed">
                    {a.desc}
                  </p>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      <FinalCta
        title="Conversa con quien construye la infraestructura."
        description="Si tu organización opera datos clínicos en México y se prepara para los próximos doce meses de cambio regulatorio, podemos sentarnos a revisar tu arquitectura actual y dónde estás expuesto. Sin compromiso, conversación técnica directa."
      />
    </>
  );
}
