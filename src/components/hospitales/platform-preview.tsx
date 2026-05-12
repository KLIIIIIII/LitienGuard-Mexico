import Link from "next/link";
import {
  FileText,
  LineChart,
  FolderKanban,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Eyebrow } from "@/components/eyebrow";
import { MockupContabilizacion } from "./mockup-contabilizacion";
import { MockupDashboard } from "./mockup-dashboard";
import { MockupDocumental } from "./mockup-documental";

interface Module {
  number: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  mockup: React.ReactNode;
  reverse?: boolean;
}

const MODULES: Module[] = [
  {
    number: "01",
    eyebrow: "Contabilización inteligente",
    icon: FileText,
    title: "Captura, extrae y contabiliza cada CFDI automáticamente.",
    description:
      "Web, email automático a buzón fiscal, app móvil o drag-and-drop. La IA reconoce el XML CFDI 4.0, valida el sello SAT, categoriza por centro de costo hospitalario y detecta duplicados. Tu equipo deja de capturar a mano y se enfoca en lo que importa.",
    bullets: [
      "96% precisión extracción de XML CFDI 4.0",
      "Categorización automática por centro de costo (urgencias, quirófano, farmacia, etc.)",
      "Detección de duplicados y reclasificación inteligente",
      "Integración bidireccional con Contpaqi, Aspel COI, Microsip",
      "Lock fiscal post-cierre mensual",
    ],
    mockup: <MockupContabilizacion />,
  },
  {
    number: "02",
    eyebrow: "Dashboard financiero",
    icon: LineChart,
    title: "Una pantalla, todas las respuestas que necesita tu CFO.",
    description:
      "DSO por aseguradora, cash flow proyectado, cartera vencida, denegaciones acumuladas, margen por especialidad. Métricas en tiempo real, no reporteo mensual. Roles diferenciados: lo que ve el CFO no es lo mismo que ve el director médico.",
    bullets: [
      "DSO por aseguradora con tendencia mes a mes",
      "Cash flow proyectado 30/60/90 días con base en cartera vigente",
      "Cartera vencida segmentada 0-30, 31-60, 61-90, 90+ días",
      "Conciliación bancaria automática (Belvo · BBVA · Banamex · Santander)",
      "Top denegaciones por aseguradora con razón principal",
    ],
    mockup: <MockupDashboard />,
    reverse: true,
  },
  {
    number: "03",
    eyebrow: "Gestor documental",
    icon: FolderKanban,
    title: "Auditoría SAT o COFEPRIS en 5 minutos, no en 5 semanas.",
    description:
      "Consentimientos informados, contratos con aseguradoras, CFDIs, licencias sanitarias, hojas COFEPRIS — todo centralizado con búsqueda full-text. Audit log inmutable NOM-024 + LFPDPPP. Alertas de vencimiento de cada documento crítico.",
    bullets: [
      "Búsqueda full-text + facetas (tipo, paciente, médico, aseguradora, fecha)",
      "Audit log inmutable NOM-024-SSA3 + LFPDPPP",
      "Alertas 30/60/90 días antes del vencimiento legal/fiscal",
      "Export auditoría SAT/COFEPRIS en menos de 5 minutos",
      "OCR de documentos legacy escaneados",
    ],
    mockup: <MockupDocumental />,
  },
];

export function HospitalPlatformPreview() {
  return (
    <section className="border-b border-line bg-canvas py-20">
      <div className="lg-shell">
        {/* Section header */}
        <div className="max-w-3xl">
          <Eyebrow tone="validation">Plataforma operativa hospitalaria</Eyebrow>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
            Tres módulos sobre el mismo cerebro. Operación{" "}
            <span className="lg-serif-italic text-validation">papel cero</span>{" "}
            en seis meses.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">
            Inspirado en lo que <span className="font-semibold">Adaral</span>{" "}
            hace para despachos contables en España, adaptado al hospital
            privado mexicano. Cumplimiento CFDI 4.0 + NOM-024 + Reforma LGS
            Salud Digital 2026 desde el primer día.
          </p>
        </div>

        {/* Roadmap pill */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-warn-soft bg-warn-soft px-3 py-1.5">
          <Sparkles className="h-3 w-3 text-warn" strokeWidth={2.4} />
          <p className="text-caption font-semibold text-warn">
            Construcción Fase 2A · 2027 Q4 — 2028 Q4 · Design partners abiertos
            ahora
          </p>
        </div>

        {/* Module rows */}
        <div className="mt-12 space-y-20">
          {MODULES.map((m) => (
            <ModuleRow key={m.number} module={m} />
          ))}
        </div>

        {/* Section CTA */}
        <div className="mt-20 rounded-2xl border border-validation bg-validation-soft/30 p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-[2fr_1fr] sm:items-center">
            <div>
              <Eyebrow tone="validation">¿Por qué esto importa ahora?</Eyebrow>
              <h3 className="mt-3 text-h2 font-semibold tracking-tight text-ink-strong">
                El 20-30% del gasto sanitario es administrativo. Recuperarlo
                paga el sistema en un trimestre.
              </h3>
              <p className="mt-3 text-body-sm text-ink-muted leading-relaxed">
                Estamos abriendo cupo a 2 hospitales como{" "}
                <span className="font-semibold">design partners</span> con
                precio especial de fundación. Construimos los módulos contigo,
                no contra ti.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/contacto?plan=clinica"
                className="lg-cta-primary justify-center"
              >
                Aplicar como design partner
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contacto?plan=clinica&demo=hospital"
                className="lg-cta-ghost justify-center"
              >
                Solicitar demo ejecutiva
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ModuleRow({ module: m }: { module: Module }) {
  const Icon = m.icon;
  return (
    <div
      className={`grid gap-8 lg:grid-cols-2 lg:items-center ${
        m.reverse ? "lg:grid-flow-dense" : ""
      }`}
    >
      {/* Text */}
      <div className={m.reverse ? "lg:col-start-2" : ""}>
        <div className="inline-flex items-center gap-2 rounded-full bg-validation-soft px-3 py-1 mb-3">
          <Icon className="h-3.5 w-3.5 text-validation" strokeWidth={2.2} />
          <span className="font-mono text-caption font-bold text-validation">
            {m.number}
          </span>
          <span className="text-caption font-semibold text-validation uppercase tracking-eyebrow">
            {m.eyebrow}
          </span>
        </div>

        <h3 className="text-h2 font-semibold tracking-tight text-ink-strong leading-tight">
          {m.title}
        </h3>

        <p className="mt-4 text-body text-ink-muted leading-relaxed">
          {m.description}
        </p>

        <ul className="mt-6 space-y-2">
          {m.bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2.5 text-body-sm text-ink-strong"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-validation" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Mockup */}
      <div className={m.reverse ? "lg:col-start-1 lg:row-start-1" : ""}>
        {m.mockup}
      </div>
    </div>
  );
}
