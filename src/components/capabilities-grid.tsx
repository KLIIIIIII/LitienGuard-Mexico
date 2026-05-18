import Link from "next/link";
import {
  Brain,
  Activity,
  Bed,
  ScanLine,
  CircleDollarSign,
  Shield,
  ArrowUpRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Eyebrow } from "@/components/eyebrow";

interface Capability {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  href: string;
  cta: string;
}

const CAPABILITIES: Capability[] = [
  {
    icon: Brain,
    eyebrow: "Cerebro clínico",
    title: "Diferencial bayesiano con evidencia anclada",
    description:
      "Motor de razonamiento clínico que cruza síntomas, signos y estudios contra 51 diagnósticos curados de literatura primaria. Cada sugerencia incluye likelihood ratios, red flags y cita verbatim.",
    bullets: [
      "Auto-extracción de hallazgos desde nota SOAP",
      "Detección de 20 cruces de comorbilidad multivariables",
      "Loop de calidad — outcome confirmado vs sugerido",
    ],
    href: "/medicos",
    cta: "Cerebro para médicos",
  },
  {
    icon: Activity,
    eyebrow: "Workflows hospitalarios",
    title: "Operaciones clínicas departamento por departamento",
    description:
      "Patient Tracking Board en Urgencias, Census + bundle compliance en UCI, OR Schedule + PACU en Quirófano, Critical Values en Laboratorio, Reading Queue en Radiología.",
    bullets: [
      "Patrones de Epic ASAP · Cerner ICU · WHO Surgical Safety",
      "3 estados por paciente: activos · alta 15d · histórico",
      "SOFA, APACHE II, FAST-HUG, NIHSS, HEART score integrados",
    ],
    href: "/hospitales",
    cta: "Para hospitales",
  },
  {
    icon: Bed,
    eyebrow: "Gestión de camas",
    title: "Bed Management en tiempo real",
    description:
      "Mapa visual de las camas del hospital — ocupación por área, libres, en limpieza o mantenimiento. Sincronización automática con encounters activos.",
    bullets: [
      "Distribución por departamento + ala + piso",
      "% ocupación con alertas si supera 90%",
      "Click en cama ocupada → perfil del paciente",
    ],
    href: "/hospitales",
    cta: "Bed Management",
  },
  {
    icon: CircleDollarSign,
    eyebrow: "Revenue Cycle Management",
    title: "RCM para hospitales privados",
    description:
      "Validación de pólizas en tiempo real, predicción de denegaciones, automatización de facturación SAT, seguimiento de cartera vencida y detección de fraude.",
    bullets: [
      "5-15% de ingresos recuperados vs facturación manual",
      "Codificación CPT/CIE-10 asistida por IA",
      "Integración nativa con principales aseguradoras MX",
    ],
    href: "/hospitales",
    cta: "RCM para hospitales",
  },
  {
    icon: ScanLine,
    eyebrow: "Cumplimiento Reforma 2026",
    title: "Compatible con Reforma LGS Salud Digital",
    description:
      "Expediente clínico interoperable HL7 FHIR R4, SMART on FHIR, importación universal de EHR existentes (HL7v2, CDA XML, PDF, imágenes). Compatible desde día uno con el mandato del DOF 2026.",
    bullets: [
      "Importadores adaptivos: SaludTotal · MediSel · Nimbo",
      "Exportación para auditoría CONAMED",
      "Padrón de pacientes con identificación múltiple (CURP, MRN)",
    ],
    href: "/reforma-2026",
    cta: "Cumplimiento normativo",
  },
  {
    icon: Shield,
    eyebrow: "Seguridad enterprise",
    title: "Cifrado AES-256-GCM con KMS + AAD por médico",
    description:
      "Cada campo sensible (notas SOAP, recetas, diferencial) cifrado en reposo con Google Cloud KMS. AAD vinculado al médico — bytes cifrados de uno no descifran con la llave de otro.",
    bullets: [
      "NOM-024 SSA3 + HIPAA aligned + SOC 2 ready",
      "Row Level Security en 28 tablas auditadas",
      "Rate-limit + audit log + alerta de descifrado masivo",
    ],
    href: "/seguridad",
    cta: "Modelo de seguridad",
  },
];

export function CapabilitiesGrid() {
  return (
    <section className="border-b border-line bg-canvas py-20 lg:py-28">
      <div className="lg-shell">
        <div className="max-w-3xl">
          <Eyebrow>Capacidades</Eyebrow>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Una plataforma. Seis capas de valor.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted leading-relaxed">
            Desde el médico individual con su propio cerebro clínico, hasta
            el hospital multi-departamento operando con bed management +
            RCM + departamentos especializados. La misma infraestructura
            escala según el plan.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {CAPABILITIES.map((c) => {
            const Icon = c.icon;
            return (
              <article
                key={c.title}
                className="group relative flex flex-col rounded-2xl border border-line bg-surface p-6 transition-all hover:border-validation/40 hover:shadow-lift"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-validation-soft/40 text-validation">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                    {c.eyebrow}
                  </p>
                </div>
                <h3 className="mt-5 text-h3 font-semibold tracking-tight text-ink-strong">
                  {c.title}
                </h3>
                <p className="mt-2 text-body-sm text-ink-muted leading-relaxed">
                  {c.description}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {c.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2 text-caption text-ink-strong"
                    >
                      <span className="mt-1.5 inline-flex h-1 w-1 shrink-0 rounded-full bg-validation" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href={c.href}
                  className="mt-5 inline-flex items-center gap-1 text-caption font-semibold text-validation group-hover:gap-2 transition-all"
                >
                  {c.cta}
                  <ArrowUpRight className="h-3 w-3" strokeWidth={2.4} />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
