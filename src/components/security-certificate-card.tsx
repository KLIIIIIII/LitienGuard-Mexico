import {
  ShieldCheck,
  Lock,
  Server,
  FileCheck2,
  Eye,
} from "lucide-react";

/**
 * Card de certificado de seguridad para el dashboard del médico.
 *
 * El copy refleja el estado REAL de la infraestructura — no promete
 * de más. El cifrado a nivel de campo (Google Cloud KMS) está en
 * expansión: hoy cubre las notas clínicas; al completar todas las
 * fases cubrirá recetas, diferencial, consultas y datos de paciente.
 */

interface Garantia {
  icon: typeof Lock;
  titulo: string;
  detalle: string;
}

const GARANTIAS: Garantia[] = [
  {
    icon: Lock,
    titulo: "Cifrado en reposo y en tránsito",
    detalle:
      "Toda la base de datos cifrada con AES-256. Las conexiones usan TLS.",
  },
  {
    icon: ShieldCheck,
    titulo: "Cifrado adicional con Google Cloud KMS",
    detalle:
      "Capa extra a nivel de campo sobre tu contenido clínico, con llave que controlamos nosotros — en expansión a todo el expediente.",
  },
  {
    icon: Eye,
    titulo: "Aislamiento por médico (RLS)",
    detalle:
      "Cada médico solo puede ver sus propios pacientes y notas. Nadie más, ni otros médicos de la plataforma.",
  },
  {
    icon: FileCheck2,
    titulo: "Bitácora de auditoría",
    detalle:
      "Cada acceso y cambio a información clínica queda registrado con fecha, usuario y origen.",
  },
  {
    icon: Server,
    titulo: "Servidores fuera de México",
    detalle:
      "Infraestructura en Estados Unidos (Oregon) con respaldos diarios automáticos.",
  },
];

export function SecurityCertificateCard() {
  return (
    <section className="lg-card overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-validation text-surface">
          <ShieldCheck className="h-6 w-6" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <p className="text-[0.6rem] uppercase tracking-eyebrow font-bold text-validation">
            Certificado de seguridad
          </p>
          <h2 className="mt-0.5 text-h3 font-semibold tracking-tight text-ink-strong">
            Tus datos y los de tus pacientes, protegidos
          </h2>
          <p className="mt-1 text-caption text-ink-muted leading-relaxed">
            LitienGuard está construido siguiendo los requisitos de la
            LFPDPPP y la NOM-024-SSA3 para el manejo de información
            clínica.
          </p>
        </div>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {GARANTIAS.map((g) => {
          const Icon = g.icon;
          return (
            <li
              key={g.titulo}
              className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-alt/60 px-3 py-2.5"
            >
              <Icon
                className="mt-0.5 h-4 w-4 shrink-0 text-validation"
                strokeWidth={2}
              />
              <div className="min-w-0">
                <p className="text-body-sm font-semibold text-ink-strong leading-snug">
                  {g.titulo}
                </p>
                <p className="mt-0.5 text-caption text-ink-muted leading-snug">
                  {g.detalle}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 border-t border-line pt-3 text-[0.65rem] text-ink-soft leading-relaxed">
        El cifrado adicional con Google Cloud KMS se está desplegando
        progresivamente sobre todo el expediente. Tu derecho ARCO
        (acceso, rectificación, cancelación, oposición) está disponible
        en cualquier momento desde Configuración.
      </p>
    </section>
  );
}
