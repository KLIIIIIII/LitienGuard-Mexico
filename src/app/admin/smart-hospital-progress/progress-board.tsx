"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  FileText,
  ShieldCheck,
  Bot,
  Video,
  Cloud,
  TrendingUp,
  Users,
  ScanLine,
  Network,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ============================================================
   Dimensiones según Newsweek/Statista Smart Hospitals 2026
   ============================================================ */

type Sprint = "shipped" | "q3-2026" | "q4-2026" | "2027" | "2028+";

type Item = {
  label: string;
  status: Sprint;
  ref?: string;
};

type Dimension = {
  id: string;
  area: string;
  icon: LucideIcon;
  weightStatista: number; // % aproximado dentro de la evaluación
  progressPct: number;
  ourCommit: string;
  tenemos: Item[];
  faltan: Item[];
  benchmark: string;
};

const DIMS: Dimension[] = [
  {
    id: "ai",
    area: "Inteligencia Artificial",
    icon: Brain,
    weightStatista: 18,
    progressPct: 42,
    ourCommit:
      "Cerebro bayesiano + scribe español MX nativo + cita verbatim + outcome loop personal del médico — diferenciadores defendibles vs Mayo/Cleveland en mercado MX.",
    tenemos: [
      { label: "Cerebro bayesiano 51 dx × 124 findings × 330 LRs", status: "shipped" },
      { label: "Hybrid retrieval BM25 + vector RRF", status: "shipped" },
      { label: "Multi-hop reasoning dx → guidelines → fármacos", status: "shipped" },
      { label: "Scribe AI español MX con SOAP estructurado", status: "shipped" },
      { label: "Cita verbatim a fuente (contrarresta automation bias FDA CDS 2026)", status: "shipped" },
      { label: "Patient memory embeddings", status: "shipped" },
    ],
    faltan: [
      { label: "Ambient scribe a nivel Abridge benchmark (-13 min/día EHR time)", status: "q3-2026" },
      { label: "Predictive sepsis online (modelo entrenado con data asset)", status: "2027" },
      { label: "Imaging AI assisted reading (integración con vendors)", status: "2027" },
      { label: "Bias audit + fairness evaluation por subgrupo (Jabbour 2023)", status: "q4-2026" },
      { label: "Mayo Clinic Platform Insights-style multi-tenant AI deployment", status: "2028+" },
    ],
    benchmark:
      "Cleveland Clinic Ambience scribe: -14 min/día EHR time (4,000+ clínicos). Mayo Clinic Platform Insights con 200+ AI pilots activos.",
  },
  {
    id: "electronic",
    area: "Electronic functionalities",
    icon: FileText,
    weightStatista: 12,
    progressPct: 28,
    ourCommit:
      "Documentación SOAP + recetas + agenda básica + padrón. Ruta clara a CPOE/eMAR vía Track B + Track A SMART on FHIR.",
    tenemos: [
      { label: "Notas SOAP cifradas (KMS)", status: "shipped" },
      { label: "Recetas con allergy hard-stop (ISMP)", status: "shipped" },
      { label: "Agenda básica", status: "shipped" },
      { label: "Padrón de pacientes con alergias documentadas", status: "shipped" },
      { label: "Audit per-action HIPAA-style", status: "shipped" },
    ],
    faltan: [
      { label: "CPOE completo con drug-drug interactions", status: "q4-2026" },
      { label: "ePrescribing con cédula profesional COFEPRIS", status: "q3-2026" },
      { label: "Order sets pre-configurables por especialidad", status: "q4-2026" },
      { label: "eMAR (electronic Medication Administration Record)", status: "2027" },
      { label: "Audit per-field (no solo per-action)", status: "q4-2026" },
    ],
    benchmark: "Epic Hyperspace + Cerner PowerChart como ground truth — 30 años de iteración.",
  },
  {
    id: "patient-safety",
    area: "Patient Safety Technologies",
    icon: ShieldCheck,
    weightStatista: 12,
    progressPct: 22,
    ourCommit:
      "Foundation puesta con critical value alerting + allergy hard-stop + patient header sticky. Sprint actual completó base de seguridad clínica AMIA + AHRQ + ISMP.",
    tenemos: [
      { label: "Critical value alerting automático (26 patrones · ACR/AHRQ)", status: "shipped" },
      { label: "Allergy hard-stop sintáctico en recetas (9 clases farmacológicas · ISMP)", status: "shipped" },
      { label: "Acknowledge workflow con audit (Joint Commission NPSG 02.03.01)", status: "shipped" },
      { label: "Patient header sticky global (HIMSS preservation of context)", status: "shipped" },
      { label: "Red flags por síntoma (8 síntomas × 35 flags)", status: "shipped" },
    ],
    faltan: [
      { label: "BCMA (Barcode Medication Administration) — reduce errors 57%", status: "2028+" },
      { label: "Smart pumps integration (BD/B.Braun/ICU Medical)", status: "2028+" },
      { label: "Early Warning Score continuo a partir de vitales del monitor", status: "2027" },
      { label: "Fall risk prediction con ML", status: "2027" },
      { label: "Delirium screening CAM-ICU integrado", status: "2027" },
    ],
    benchmark:
      "Mayo Clinic AWARE: filtra 1348 datapoints/día/paciente en ICU. Joint Commission NPSG 02.03.01 obligatorio.",
  },
  {
    id: "robotics",
    area: "Robótica (quirúrgica + logística)",
    icon: Bot,
    weightStatista: 10,
    progressPct: 0,
    ourCommit:
      "NO construimos hardware. Estrategia: integración via HL7 v2 a robots existentes del hospital cuando sea relevante (Fase 3+).",
    tenemos: [],
    faltan: [
      { label: "Integración HL7 con da Vinci surgical events", status: "2028+" },
      { label: "Tracking de Moxi/Vecna delivery events", status: "2028+" },
      { label: "Pharmacy automation (Pyxis/Omnicell) interface", status: "2028+" },
    ],
    benchmark:
      "Houston Methodist + Cleveland: Vecna Robotics logística cloud-based, Moxi 300k+ deliveries.",
  },
  {
    id: "telemedicine",
    area: "Telemedicine",
    icon: Video,
    weightStatista: 10,
    progressPct: 15,
    ourCommit: "Foundation con agenda + portal paciente. Video integrado próximo trimestre.",
    tenemos: [
      { label: "Agenda con citas y recordatorios automáticos", status: "shipped" },
      { label: "Portal paciente con expediente compartido vía token", status: "shipped" },
      { label: "Recetas digitales con QR/share", status: "shipped" },
    ],
    faltan: [
      { label: "Video consulta integrada (WebRTC)", status: "q4-2026" },
      { label: "Async messaging seguro paciente↔médico", status: "q4-2026" },
      { label: "Remote patient monitoring (RPM) con devices ingest", status: "2027" },
      { label: "Virtual ICU módulo (CareCompass equivalent)", status: "2028+" },
    ],
    benchmark: "Charité Berlin: 50% remote visits target 2030. Cleveland AI-supported remote ED triage.",
  },
  {
    id: "virtualization",
    area: "Virtualization (cloud, vICU)",
    icon: Cloud,
    weightStatista: 8,
    progressPct: 32,
    ourCommit: "Cloud-native nativo (Vercel + Supabase + GCP KMS) — base sólida, falta vICU.",
    tenemos: [
      { label: "Stack 100% cloud-native (multi-region)", status: "shipped" },
      { label: "GCP KMS envelope encryption para PHI", status: "shipped" },
      { label: "Watermark forense en queries con cláusula legal", status: "shipped" },
      { label: "Multi-tenant via Supabase RLS", status: "shipped" },
    ],
    faltan: [
      { label: "Virtual ICU módulo con monitor stream", status: "2028+" },
      { label: "Edge platform deployment (low-latency)", status: "2028+" },
      { label: "Disaster recovery con RPO < 5 min", status: "q4-2026" },
    ],
    benchmark: "Karolinska + Stockholm: openEHR vendor-neutral con ecosistema de apps.",
  },
  {
    id: "predictive",
    area: "Predictive analytics",
    icon: TrendingUp,
    weightStatista: 10,
    progressPct: 12,
    ourCommit:
      "Cerebro bayesiano off-line es el primer step. Online streaming sepsis/deterioration requiere data asset maduro (Fase 3+).",
    tenemos: [
      { label: "Inferencia bayesiana on-demand (no streaming)", status: "shipped" },
      { label: "Priors MX por estado (32 estados) + epidemio", status: "shipped" },
      { label: "Outcome loop personal del médico (PPV propio)", status: "shipped" },
    ],
    faltan: [
      { label: "Sepsis prediction online streaming (sliding window 4-6h)", status: "2027" },
      { label: "eCART continuous (Electronic Cardiac Arrest Risk Triage)", status: "2027" },
      { label: "Readmission risk model 30 días", status: "2027" },
      { label: "No-show prediction para agenda", status: "q4-2026" },
    ],
    benchmark: "Hopkins LCICM: ML sobre EHR + monitor streams + imagen. Desautels 2016 sepsis hours antes.",
  },
  {
    id: "patient-experience",
    area: "Patient experience (portal, wearables)",
    icon: Users,
    weightStatista: 8,
    progressPct: 22,
    ourCommit:
      "Portal paciente con expediente. Faltan digital front door completo + wearables ingest.",
    tenemos: [
      { label: "Portal paciente con expediente compartido", status: "shipped" },
      { label: "Tokens seguros con expiración", status: "shipped" },
      { label: "PDFs branded por consultorio", status: "shipped" },
    ],
    faltan: [
      { label: "Digital front door completo (agendamiento self-service + resultados push)", status: "2027" },
      { label: "Wearables ingest (Apple Health, Google Fit, BT Generic Health Sensor)", status: "2027" },
      { label: "Chatbot Emmie-style para FAQs sobre el expediente", status: "2027" },
      { label: "Cuestionarios PROM digitales pre/post consulta", status: "q4-2026" },
    ],
    benchmark: "Mayo Digital Front Door + Epic MyChart Central (50 estados USA).",
  },
  {
    id: "imaging",
    area: "Imaging + DICOM AI",
    icon: ScanLine,
    weightStatista: 7,
    progressPct: 8,
    ourCommit:
      "Worklist + reportes estructurados. Sin PACS ni DICOM (out of scope MVP).",
    tenemos: [
      { label: "Worklist priorizada (STAT/urgente/rutina)", status: "shipped" },
      { label: "Reporte texto con detección automática de hallazgos críticos", status: "shipped" },
      { label: "Motor de patrones multi-estudio (60 estudios + 25 patrones)", status: "shipped" },
    ],
    faltan: [
      { label: "DICOM Q/R lite (visor read-only)", status: "2027" },
      { label: "Structured reporting RadLex-compliant", status: "2027" },
      { label: "Templates por estudio (TAC craneal, eco, RM)", status: "q4-2026" },
      { label: "AI-assisted reading integración (Aidoc, Qure.ai)", status: "2028+" },
      { label: "Modality worklist DICOM MWL", status: "2027" },
    ],
    benchmark:
      "UCSF Nuance Workflow Orchestrator multi-PACS. Mayo + Cleveland + Aidoc partnerships.",
  },
  {
    id: "interoperability",
    area: "Interoperability (FHIR, USCDI, SMART)",
    icon: Network,
    weightStatista: 5,
    progressPct: 18,
    ourCommit:
      "Importers HL7 v2 + CDA listos. SMART on FHIR es el unlock estratégico para Track A (hospitales con Cerner/Epic).",
    tenemos: [
      { label: "HL7 v2 importer (PID/PV1/DG1/OBX/RXE/AL1)", status: "shipped" },
      { label: "CDA XML importer (NOM-024-SSA3-2012 compliant)", status: "shipped" },
    ],
    faltan: [
      { label: "FHIR R4 data model (Patient + Observation + Condition + MedicationRequest)", status: "q4-2026" },
      { label: "SMART on FHIR app launch (OAuth2 + launch context + EHR session passthrough)", status: "q4-2026" },
      { label: "USCDI v5/v6 compliance (Clinical Notes ED + Operative)", status: "q4-2026" },
      { label: "HL7 v2 ORM bidireccional (enviar órdenes a LIS/RIS externos)", status: "2027" },
      { label: "IHE profiles XDS, PIX, PDQ, MWL", status: "2027" },
      { label: "TEFCA-style participation MX (cuando exista marco)", status: "2028+" },
    ],
    benchmark: "Harvard Mandl & Kohane SMART on FHIR. Epic MyChart Central + TEFCA en 50 estados USA.",
  },
];

/* ============================================================
   Sprint labels + colors
   ============================================================ */
const SPRINT_LABEL: Record<Sprint, string> = {
  shipped: "Listo",
  "q3-2026": "Q3 2026",
  "q4-2026": "Q4 2026",
  "2027": "2027",
  "2028+": "2028+",
};

const SPRINT_TONE: Record<Sprint, string> = {
  shipped: "bg-code-green-bg text-code-green",
  "q3-2026": "bg-accent-soft text-accent",
  "q4-2026": "bg-accent-soft text-accent",
  "2027": "bg-warn-soft text-warn",
  "2028+": "bg-surface-alt text-ink-muted",
};

/* ============================================================
   Componente principal
   ============================================================ */
export function ProgressBoard() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const overall = useMemo(() => {
    const totalWeight = DIMS.reduce((s, d) => s + d.weightStatista, 0);
    const weighted = DIMS.reduce(
      (s, d) => s + (d.progressPct * d.weightStatista) / totalWeight,
      0,
    );
    return Math.round(weighted);
  }, []);

  return (
    <div className="space-y-6">
      {/* Big number */}
      <div className="rounded-2xl border-2 border-line bg-surface p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
              Progreso global ponderado
            </p>
            <p className="mt-1 flex items-baseline gap-3">
              <span className="text-display font-bold tabular-nums text-ink-strong">
                {overall}%
              </span>
              <span className="text-body-sm text-ink-muted">
                de Smart Hospital top 25 (Statista 2026)
              </span>
            </p>
            <p className="mt-2 text-caption text-ink-muted leading-relaxed max-w-prose">
              Cálculo ponderado por peso aproximado de cada área en la evaluación.
              Honestidad operacional: estamos en MVP serio, no en paridad con
              Mayo/Cleveland. Diferenciador defendible = cerebro MX + scribe
              español + cumplimiento estándares AMIA/HIMSS/FDA.
            </p>
          </div>
          <div className="space-y-1 text-caption">
            <p className="text-ink-strong">
              <strong className="font-bold">
                {DIMS.filter((d) => d.progressPct >= 30).length}
              </strong>{" "}
              áreas con foundation sólida
            </p>
            <p className="text-ink-strong">
              <strong className="font-bold">
                {DIMS.filter((d) => d.progressPct < 15).length}
              </strong>{" "}
              áreas pendientes de roadmap
            </p>
            <p className="text-ink-strong">
              <strong className="font-bold">
                {DIMS.reduce(
                  (s, d) => s + d.tenemos.filter((i) => i.status === "shipped").length,
                  0,
                )}
              </strong>{" "}
              items shipped ya verificables
            </p>
          </div>
        </div>

        {/* Macro progress bar */}
        <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-surface-alt">
          {DIMS.map((d) => (
            <div
              key={d.id}
              style={{
                width: `${d.weightStatista}%`,
                opacity: d.progressPct / 100,
              }}
              className="bg-validation"
              title={`${d.area} · ${d.progressPct}%`}
            />
          ))}
        </div>
      </div>

      {/* Dimension cards */}
      <div className="space-y-3">
        {DIMS.map((d) => {
          const Icon = d.icon;
          const isOpen = expanded === d.id;
          const shippedCount = d.tenemos.filter((i) => i.status === "shipped").length;

          const progressTone =
            d.progressPct >= 30
              ? "bg-code-green"
              : d.progressPct >= 15
                ? "bg-code-amber"
                : d.progressPct === 0
                  ? "bg-ink-quiet"
                  : "bg-code-red";

          return (
            <div
              key={d.id}
              className="rounded-xl border border-line bg-surface overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : d.id)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-surface-alt/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="rounded-lg bg-accent-soft p-1.5 text-accent shrink-0">
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-semibold text-ink-strong">
                      {d.area}
                    </p>
                    <p className="text-caption text-ink-muted">
                      Peso Statista ~{d.weightStatista}% · {shippedCount} items
                      shipped · {d.faltan.length} pendientes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-h3 font-bold tabular-nums text-ink-strong">
                      {d.progressPct}%
                    </p>
                  </div>
                  <div className="hidden sm:flex h-2 w-28 overflow-hidden rounded-full bg-surface-alt">
                    <div
                      className={`h-full ${progressTone} transition-all`}
                      style={{ width: `${d.progressPct}%` }}
                    />
                  </div>
                  {isOpen ? (
                    <ChevronUp
                      className="h-4 w-4 text-ink-muted"
                      strokeWidth={2.2}
                    />
                  ) : (
                    <ChevronDown
                      className="h-4 w-4 text-ink-muted"
                      strokeWidth={2.2}
                    />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-line px-5 py-4 space-y-4">
                      <div className="rounded-lg bg-validation-soft/30 p-3">
                        <p className="text-caption uppercase tracking-eyebrow text-validation font-semibold">
                          Nuestra apuesta
                        </p>
                        <p className="mt-1 text-body-sm text-ink-strong">
                          {d.ourCommit}
                        </p>
                      </div>

                      {d.tenemos.length > 0 && (
                        <div>
                          <p className="text-caption uppercase tracking-eyebrow text-code-green font-semibold mb-2">
                            ✓ Tenemos ({d.tenemos.length})
                          </p>
                          <ul className="space-y-1.5">
                            {d.tenemos.map((it, i) => (
                              <ItemRow key={i} item={it} kind="shipped" />
                            ))}
                          </ul>
                        </div>
                      )}

                      {d.faltan.length > 0 && (
                        <div>
                          <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold mb-2">
                            Faltan ({d.faltan.length})
                          </p>
                          <ul className="space-y-1.5">
                            {d.faltan.map((it, i) => (
                              <ItemRow key={i} item={it} kind="pending" />
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="rounded-lg bg-surface-alt/40 p-3">
                        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                          Benchmark (referente honesto)
                        </p>
                        <p className="mt-1 text-caption text-ink-muted italic leading-relaxed">
                          {d.benchmark}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Demo prep block */}
      <section className="rounded-2xl border-2 border-accent/30 bg-accent-soft/30 p-6">
        <p className="text-caption uppercase tracking-eyebrow text-accent font-semibold">
          Para preparar demo ejecutiva
        </p>
        <h2 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
          Talking points por audiencia
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <DemoPoint
            audience="Christus / TecSalud / Médica Sur"
            angle="Estrategia híbrida"
            points={[
              "Standalone funcional desde día 1 si no tienen EHR enterprise",
              "Track A SMART on FHIR (Q4 2026) se acopla a Cerner/Epic existente",
              "Cerebro MX defendible — nadie más lo tiene en LATAM",
              "Cumplimiento AMIA + HIMSS + FDA CDS 2026 documentado",
            ]}
          />
          <DemoPoint
            audience="IMSS Digital / ISSSTE"
            angle="Reforma LGS 2026"
            points={[
              "Cumple NOM-024-SSA3-2012 + Reforma LGS 2026 expediente electrónico",
              "Plazo escalonado 2026-2028 ya planificado en roadmap",
              "HL7 v2 + CDA XML importers para migración masiva sin lock-in",
              "Audit trail + RLS + KMS para PHI sensible",
            ]}
          />
          <DemoPoint
            audience="Médicos individuales"
            angle="ROI inmediato"
            points={[
              "Scribe español MX nativo → -X min/día documentación",
              "Cerebro bayesiano para diferencial con cita verbatim",
              "Workflows hospitalarios listos (5 módulos)",
              "Outcome loop propio = PPV personal medible",
            ]}
          />
        </div>
      </section>

      {/* Footnotes */}
      <div className="rounded-lg bg-surface-alt/30 p-4 space-y-2">
        <p className="text-caption text-ink-muted leading-relaxed">
          <strong className="font-semibold">Fuentes primarias:</strong>{" "}
          Newsweek/Statista World&apos;s Best Smart Hospitals 2026 ·
          AMIA Task Force EHR Usability 2013 · HIMSS 9 Essential Principles ·
          FDA Clinical Decision Support Guidance 2026 · NHS DCB0129/DCB0160 ·
          IEC 62366-1:2015 · AAMI HE75:2025 · Mayo Clinic AWARE (HBR 2018) ·
          Almarri et al 2025 (Hospitals MDPI) · Lin et al 2024 (Healthcare MDPI).
        </p>
        <p className="text-caption text-ink-muted leading-relaxed">
          <strong className="font-semibold">Documento de gap completo:</strong>{" "}
          <code className="text-caption">
            knowledge/strategic_thinking/litienguard_av_smart_hospitals_gap.md
          </code>
        </p>
        <p className="text-caption text-ink-soft italic">
          Esta página es interna · admin-only. Sin URLs en sitemap. Prep para
          demos privadas, no para distribución pública.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Subcomponentes
   ============================================================ */

function ItemRow({
  item,
  kind,
}: {
  item: Item;
  kind: "shipped" | "pending";
}) {
  const IconCmp = kind === "shipped" ? CheckCircle2 : item.status === "shipped" ? CheckCircle2 : Clock;
  const iconColor =
    kind === "shipped"
      ? "text-code-green"
      : item.status === "q3-2026" || item.status === "q4-2026"
        ? "text-accent"
        : item.status === "2027"
          ? "text-warn"
          : "text-ink-quiet";

  return (
    <li className="flex items-start gap-2">
      <IconCmp
        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${iconColor}`}
        strokeWidth={2.2}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2">
        <span
          className={`text-caption ${kind === "shipped" ? "text-ink-strong" : "text-ink-muted"}`}
        >
          {item.label}
        </span>
        {kind === "pending" && (
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0 text-[0.65rem] font-semibold uppercase tracking-eyebrow ${SPRINT_TONE[item.status]}`}
          >
            {SPRINT_LABEL[item.status]}
          </span>
        )}
      </div>
    </li>
  );
}

function DemoPoint({
  audience,
  angle,
  points,
}: {
  audience: string;
  angle: string;
  points: string[];
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
        {audience}
      </p>
      <p className="mt-1 text-body-sm font-bold text-ink-strong">{angle}</p>
      <ul className="mt-2.5 space-y-1.5">
        {points.map((p, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <Circle
              className="mt-1 h-1.5 w-1.5 shrink-0 fill-accent text-accent"
              strokeWidth={2.4}
            />
            <span className="text-caption text-ink-muted leading-relaxed">
              {p}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
