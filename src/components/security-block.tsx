import { ShieldCheck, Lock, FileSearch, KeyRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Pillar {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PILLARS: Pillar[] = [
  {
    icon: Lock,
    title: "Cifrado AES-256-GCM con KMS",
    description:
      "Cada campo sensible cifrado en reposo con Google Cloud Key Management Service. Llave nunca toca el servidor de aplicación.",
  },
  {
    icon: KeyRound,
    title: "AAD vinculado al médico",
    description:
      "Anti cross-doctor: los bytes cifrados del expediente de un médico no descifran con la llave de otro, incluso con acceso DB.",
  },
  {
    icon: ShieldCheck,
    title: "Row Level Security auditado",
    description:
      "28 tablas con RLS habilitado. Test funcional con doctor adversarial pasa los 5 vectores de ataque conocidos.",
  },
  {
    icon: FileSearch,
    title: "Audit log + rate limit",
    description:
      "Alerta automática si un médico descifra ≥100 expedientes en menos de 5 minutos. Log inmutable de cada acceso PHI.",
  },
];

export function SecurityBlock() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-ink-strong py-20 lg:py-28">
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--canvas)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--canvas)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="lg-shell relative">
        <div className="max-w-3xl">
          <p className="text-caption uppercase tracking-eyebrow font-semibold text-validation">
            Seguridad enterprise
          </p>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-canvas">
            La defensa de tu información clínica
            <br />
            no es opcional.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-quiet leading-relaxed">
            Cuatro capas de defensa simultáneas — cifrado de campo,
            anclaje por médico, RLS auditado y observabilidad activa.
            Diseñado para sobrevivir un audit ISO 27001 o un breach
            attempt real.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-2xl border border-ink/40 bg-ink/30 p-6"
              >
                <Icon
                  className="h-5 w-5 text-validation"
                  strokeWidth={2}
                />
                <h3 className="mt-4 text-body-sm font-semibold text-canvas">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-caption text-ink-quiet leading-relaxed">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-ink/40 pt-8">
          <ComplianceBadge label="NOM-024 SSA3" />
          <ComplianceBadge label="HIPAA aligned" />
          <ComplianceBadge label="SOC 2 ready" />
          <ComplianceBadge label="ISO 27001 roadmap" />
          <ComplianceBadge label="Reforma LGS 2026" />
        </div>
      </div>
    </section>
  );
}

function ComplianceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-caption font-semibold text-canvas">
      <ShieldCheck className="h-3.5 w-3.5 text-validation" strokeWidth={2.2} />
      {label}
    </span>
  );
}
