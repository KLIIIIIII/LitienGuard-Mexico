"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HeartPulse,
  Ribbon,
  CircleDot,
  Droplet,
  Brain,
  Siren,
  ClipboardCheck,
  FlaskConical,
  ScanLine,
  BookOpen,
  TrendingUp,
  Network,
  Mic,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type TierKey = "esencial" | "profesional" | "hospital";

type Feature = {
  icon: LucideIcon;
  label: string;
  detail: string;
};

type SpecialtyWorkflow = {
  key:
    | "cardiologia"
    | "oncologia"
    | "gineco_oncologia"
    | "diabetes_endo"
    | "neurologia";
  label: string;
  icon: LucideIcon;
  tagline: string;
  esencial: Feature[];
  profesional: Feature[];
  hospital: Feature[];
};

/* ============================================================
   Datos curados por especialidad — anclados a guías clínicas
   ============================================================ */

const WORKFLOWS: SpecialtyWorkflow[] = [
  {
    key: "cardiologia",
    label: "Cardiología",
    icon: HeartPulse,
    tagline:
      "Doce diagnósticos curados anclados a AHA/ESC + 2025 ACC ATTR-CM guidance. Trials pivotal 2018-2024 referenciados con cita verbatim.",
    esencial: [
      {
        icon: BookOpen,
        label: "Cerebro cardiológico",
        detail:
          "12 diagnósticos curados: HFrEF/HFpEF subtypes, SCAD, ATTR-CM, IC aguda, EA severa LFLG. Anclado en AHA/ESC y 2025 ACC concise guidance.",
      },
      {
        icon: Check,
        label: "Cuadro Básico cardio",
        detail:
          "Los cuatro pilares HFrEF (IECA/ARNI, BB, ARM, SGLT2). Anticoagulantes, antiagregantes y estatinas IMSS.",
      },
      {
        icon: Check,
        label: "Recetas con allergy hard-stop",
        detail:
          "Cross-check sintáctico contra alergias documentadas del paciente antes de firmar.",
      },
    ],
    profesional: [
      {
        icon: Network,
        label: "Diferencial bayesiano cardio",
        detail:
          "Multi-señal con anti-anclaje. Posteriors por hipótesis con cita verbatim a la fuente.",
      },
      {
        icon: FlaskConical,
        label: "Motor de estudios cardio",
        detail:
          "EKG, ecocardiograma con strain, troponina, NT-proBNP, gammagrafía PYP, angio-TC, RM cardíaca y cadenas ligeras libres.",
      },
      {
        icon: BookOpen,
        label: "Patrones canónicos",
        detail:
          "SCAD en mujer joven, EA severa LFLG, ATTR-CM diagnóstico no invasivo, fenotipos de IC aguda.",
      },
      {
        icon: Siren,
        label: "Urgencias · Código IAM (STEMI)",
        detail:
          "Protocolo puerta-balón ≤90 min con checklist secuencial, timer en vivo y alertas por desviación de tiempo.",
      },
      {
        icon: Mic,
        label: "Scribe español MX",
        detail:
          "Captura terminología cardiológica y genera SOAP estructurado con citas a guías.",
      },
    ],
    hospital: [
      {
        icon: ClipboardCheck,
        label: "UCI con vasoactivos y SOFA",
        detail:
          "Calculadora SOFA, dosis vasoactivos por peso y bundle FAST-HUG integrados.",
      },
      {
        icon: TrendingUp,
        label: "Dashboards de compliance AHA/ESC",
        detail:
          "% de pacientes con los cuatro pilares de IC, % anticoagulados con FA, tiempo-a-troponina.",
      },
    ],
  },
  {
    key: "oncologia",
    label: "Oncología",
    icon: Ribbon,
    tagline:
      "Patrones de work-up curados anclados a NCCN. Cobertura de cánceres prevalentes en México con genómica y smart radiomics.",
    esencial: [
      {
        icon: BookOpen,
        label: "Cerebro oncológico",
        detail:
          "Patrones de work-up de los cánceres más prevalentes en MX, anclados en NCCN Guidelines.",
      },
      {
        icon: Check,
        label: "Quimioterapia base CAUSES",
        detail:
          "Cuadro Básico CAUSES con esquemas estándar de primera línea y soporte de cuidados.",
      },
      {
        icon: Check,
        label: "Recetas con allergy hard-stop",
        detail:
          "Cross-check contra alergias documentadas más alertas críticas de interacción de quimioterapia.",
      },
    ],
    profesional: [
      {
        icon: Network,
        label: "Diferencial oncológico multi-señal",
        detail:
          "Combina marcadores tumorales, imagen, biopsia y genómica con LRs ponderados por evidencia.",
      },
      {
        icon: FlaskConical,
        label: "Motor de estudios oncológicos",
        detail:
          "TAC, RM, PET, biopsia con IHC, marcadores tumorales, BRCA y paneles moleculares.",
      },
      {
        icon: BookOpen,
        label: "Patrones canónicos",
        detail:
          "Work-up de cánceres top en MX (pulmón, próstata, colon, hígado) con decisiones de primera línea.",
      },
      {
        icon: ScanLine,
        label: "Smart radiomics",
        detail:
          "Análisis cuantitativo de imagen con AI assist, modelo Mayo / MD Anderson.",
      },
      {
        icon: Mic,
        label: "Scribe español MX",
        detail:
          "Captura notas con terminología NCCN traducida y esquemas de quimioterapia estructurados.",
      },
    ],
    hospital: [
      {
        icon: ClipboardCheck,
        label: "Workflow multidisciplinario",
        detail:
          "Coordinación de tumor board, integración con patología y radiología, decisiones colegiadas.",
      },
      {
        icon: TrendingUp,
        label: "Dashboards de adherencia NCCN",
        detail:
          "% pacientes con tratamiento estándar, time-to-treatment, outcome a 1-2-5 años.",
      },
    ],
  },
  {
    key: "gineco_oncologia",
    label: "Gineco-oncología",
    icon: CircleDot,
    tagline:
      "Cuatro cánceres curados (mama, cérvix, ovario, endometrio) con consejo BRCA y Lynch syndrome. Anclado en NCCN y ASCO.",
    esencial: [
      {
        icon: BookOpen,
        label: "Cerebro gineco-oncológico",
        detail:
          "Cuatro cánceres curados: mama (ER/PR/HER2), cérvix (FIGO), ovario (BRCA), endometrio (Lynch).",
      },
      {
        icon: Check,
        label: "Hormonoterapia y quimio",
        detail:
          "Tamoxifeno, IA, trastuzumab, T-DM1, PARPi (olaparib, niraparib) — Cuadro CAUSES.",
      },
      {
        icon: Check,
        label: "Recetas con allergy hard-stop",
        detail:
          "Cross-check con alertas de toxicidad cumulativa.",
      },
    ],
    profesional: [
      {
        icon: Network,
        label: "Diferencial multi-señal",
        detail:
          "Combina genómica BRCA/Lynch, biopsia, imagen multi-modal, marcadores CA-125 y HE4.",
      },
      {
        icon: FlaskConical,
        label: "Motor de estudios",
        detail:
          "Mamografía + USG + RM, citología cervical + VPH, USG transvaginal + biopsia endometrio, panel BRCA1/2, Lynch syndrome.",
      },
      {
        icon: BookOpen,
        label: "Patrones canónicos",
        detail:
          "BRCA mutation work-up, Lynch screening, mama triple negativo, ovario seroso de alto grado.",
      },
      {
        icon: Mic,
        label: "Scribe español MX",
        detail:
          "Captura estadificación FIGO, TNM y perfil molecular tumoral.",
      },
    ],
    hospital: [
      {
        icon: ClipboardCheck,
        label: "Workflow oncoginecológico",
        detail:
          "Coordinación de cirugía, quimioterapia y radioterapia con trazabilidad de estadificación FIGO.",
      },
      {
        icon: TrendingUp,
        label: "Consejo genético BRCA/Lynch",
        detail:
          "Trazabilidad de testing genético y recomendaciones de cascada familiar.",
      },
    ],
  },
  {
    key: "diabetes_endo",
    label: "Diabetes / Endocrinología",
    icon: Droplet,
    tagline:
      "Trece diagnósticos curados anclados en ADA 2024. Cobertura completa de emergencias metabólicas y patología tiroidea.",
    esencial: [
      {
        icon: BookOpen,
        label: "Cerebro endocrinológico",
        detail:
          "13 diagnósticos curados: DM2 ADA 2024, DM gestacional, DKA, HHS, hipotiroidismo, Cushing, suprarrenal, hiperparatiroidismo.",
      },
      {
        icon: Check,
        label: "Cuadro Básico IMSS",
        detail:
          "Metformina, sulfonilureas, DPP-4, GLP-1 (semaglutida), SGLT-2 (dapa/empa), insulinas, levotiroxina.",
      },
      {
        icon: Check,
        label: "Allergy hard-stop sulfas",
        detail:
          "Detecta alergia a sulfamidas y bloquea glibenclamida y tiazidas en prescripción.",
      },
    ],
    profesional: [
      {
        icon: Network,
        label: "Diferencial endocrinológico",
        detail:
          "DKA vs HHS, sospecha de feocromocitoma vs incidentaloma, hiper/hipotiroidismo subclínico.",
      },
      {
        icon: FlaskConical,
        label: "Motor de estudios",
        detail:
          "HbA1c, glucosa ayuno/postprandial, perfil tiroideo, anti-GAD, péptido C, cortisol AM, aldosterona, PTH.",
      },
      {
        icon: BookOpen,
        label: "Patrones canónicos",
        detail:
          "DKA criterios completos, sospecha de LADA, fenotipos de DM2, retinopatía diabética estratificación.",
      },
      {
        icon: Siren,
        label: "Urgencias · Protocolo DKA",
        detail:
          "Bundle de manejo: NaCl 0.9%, insulina IV titulada, reposición de K y alerta edema cerebral en pediatría.",
      },
      {
        icon: Mic,
        label: "Scribe español MX",
        detail:
          "Captura targets ADA, ajustes insulínicos y escalamiento terapéutico.",
      },
    ],
    hospital: [
      {
        icon: ClipboardCheck,
        label: "UCI con bomba de insulina",
        detail:
          "Control glicémico continuo con protocolo Yale en perioperatorio.",
      },
      {
        icon: TrendingUp,
        label: "Dashboards quality DM",
        detail:
          "% pacientes con HbA1c <7%, screening anual de retinopatía, seguimiento de microalbuminuria.",
      },
    ],
  },
  {
    key: "neurologia",
    label: "Neurología",
    icon: Brain,
    tagline:
      "Once diagnósticos curados con ventana terapéutica codificada. Anclado en AHA/ASA Stroke Guidelines y NIH-NIA criteria.",
    esencial: [
      {
        icon: BookOpen,
        label: "Cerebro neurológico",
        detail:
          "11 diagnósticos curados: EVC isquémico/hemorrágico, cefalea (migraña, tensional), epilepsia, demencia (Alzheimer, vascular), neuropatías.",
      },
      {
        icon: Check,
        label: "Cuadro Básico neuro",
        detail:
          "Anticonvulsivantes (valproato, levetiracetam, fenitoína), antimigrañosos (triptanes, CGRP), L-DOPA, donepezilo.",
      },
      {
        icon: Check,
        label: "Recetas con allergy hard-stop",
        detail:
          "Cross-check con alertas de interacciones AED-AED y monitoreo de niveles séricos.",
      },
    ],
    profesional: [
      {
        icon: Network,
        label: "Diferencial neurológico multi-señal",
        detail:
          "EVC isquémico vs hemorrágico, cefalea primaria vs secundaria, subtipos de demencia con biomarcadores.",
      },
      {
        icon: FlaskConical,
        label: "Motor de estudios",
        detail:
          "TAC craneal, RM cerebro multi-secuencia, EEG, EMG, LCR, biomarcadores Alzheimer (Aβ42, p-tau), calculadora NIHSS.",
      },
      {
        icon: BookOpen,
        label: "Patrones canónicos",
        detail:
          "EVC ventana terapéutica ≤4.5h, HSA work-up, status epiléptico, encefalopatía urémica.",
      },
      {
        icon: Siren,
        label: "Urgencias · Código Stroke",
        detail:
          "Protocolo puerta-aguja ≤60 min con NIHSS, TC craneal y decisión alteplasa/trombectomía. Timer en vivo.",
      },
      {
        icon: Mic,
        label: "Scribe español MX",
        detail:
          "Captura NIHSS, mMRC, escalas neurocognitivas (MoCA, MMSE) y Glasgow.",
      },
    ],
    hospital: [
      {
        icon: ClipboardCheck,
        label: "UCI neurológica",
        detail:
          "Monitoreo PIC, doppler transcraneal y sedación protocolizada para status epiléptico.",
      },
      {
        icon: TrendingUp,
        label: "Trombectomía mecánica",
        detail:
          "Coordinación con hemodinamia, ventana 6-24h, ASPECTS automático, dashboards puerta-recanalización.",
      },
    ],
  },
];

const TIER_LABEL: Record<TierKey, { name: string; pricing: string }> = {
  esencial: { name: "Esencial", pricing: "$1,209 MXN/mes" },
  profesional: { name: "Profesional", pricing: "$2,429 MXN/mes" },
  hospital: { name: "Hospital", pricing: "Custom" },
};

/* ============================================================
   Componente principal — estilo Oracle Health enterprise
   ============================================================ */
export function SpecialtyWorkflows() {
  const [active, setActive] =
    useState<SpecialtyWorkflow["key"]>("cardiologia");
  const current = WORKFLOWS.find((w) => w.key === active)!;
  const Icon = current.icon;

  return (
    <div className="space-y-12">
      {/* Section header — Oracle/Cerner style */}
      <div className="border-b border-line pb-8">
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
          Workflows por especialidad
        </p>
        <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong max-w-3xl">
          Capacidades clínicas por área de especialidad.
        </h2>
        <p className="mt-4 max-w-3xl text-body text-ink-muted leading-relaxed">
          LitienGuard organiza el cerebro curado, el motor de estudios
          diagnósticos y los protocolos críticos por especialidad. Cada
          tier expone una capa adicional de capacidades sobre la anterior.
          La cobertura de evidencia clínica se mantiene anclada a guías
          internacionales reconocidas — AHA/ESC, NCCN, ASCO, ADA, AHA/ASA —
          y al Cuadro Básico IMSS / CAUSES para fármacos en México.
        </p>
      </div>

      {/* Specialty nav — underline tabs (Oracle/Cerner sobrio) */}
      <nav
        role="tablist"
        className="flex flex-wrap items-center border-b border-line gap-x-1 gap-y-2"
      >
        {WORKFLOWS.map((w) => {
          const WIcon = w.icon;
          const isActive = active === w.key;
          return (
            <button
              key={w.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(w.key)}
              className={`inline-flex items-center gap-2 px-4 py-3 -mb-px transition-colors border-b-2 ${
                isActive
                  ? "border-accent text-accent"
                  : "border-transparent text-ink-muted hover:text-ink-strong"
              }`}
            >
              <WIcon className="h-4 w-4" strokeWidth={2} />
              <span className="text-body-sm font-semibold">{w.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Active panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-10"
        >
          {/* Specialty heading */}
          <div className="flex items-start gap-5 max-w-4xl">
            <div className="rounded-lg bg-accent-soft p-3 text-accent shrink-0">
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-h2 font-semibold tracking-tight text-ink-strong">
                {current.label}
              </h3>
              <p className="mt-2 text-body-sm text-ink-muted leading-relaxed">
                {current.tagline}
              </p>
            </div>
          </div>

          {/* Three tier columns — Oracle table-style */}
          <div className="grid gap-px bg-line lg:grid-cols-3 rounded-lg overflow-hidden border border-line">
            <TierColumn
              tierKey="esencial"
              label={TIER_LABEL.esencial.name}
              pricing={TIER_LABEL.esencial.pricing}
              features={current.esencial}
            />
            <TierColumn
              tierKey="profesional"
              label={TIER_LABEL.profesional.name}
              pricing={TIER_LABEL.profesional.pricing}
              features={current.profesional}
              recommended
            />
            <TierColumn
              tierKey="hospital"
              label={TIER_LABEL.hospital.name}
              pricing={TIER_LABEL.hospital.pricing}
              features={current.hospital}
            />
          </div>

          {/* Footer note */}
          <p className="text-caption text-ink-soft leading-relaxed max-w-3xl">
            Cada tier superior incluye todas las capacidades del tier
            anterior. Profesional añade el motor de diferencial bayesiano,
            los módulos hospitalarios y el scribe ambient en español MX.
            Hospital añade UCI con scores SOFA / APACHE II, dashboards
            agregados y las integraciones enterprise (SMART on FHIR,
            HL7 v2 ORM, DICOM lite).
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   TierColumn — estilo Oracle table-cell
   ============================================================ */
function TierColumn({
  tierKey,
  label,
  pricing,
  features,
  recommended,
}: {
  tierKey: TierKey;
  label: string;
  pricing: string;
  features: Feature[];
  recommended?: boolean;
}) {
  return (
    <div
      className={`bg-surface p-6 flex flex-col ${recommended ? "ring-1 ring-inset ring-accent/40" : ""}`}
    >
      {/* Header */}
      <div className="pb-4 border-b border-line">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
            Plan
          </p>
          {recommended && (
            <span className="text-caption text-accent font-semibold uppercase tracking-eyebrow">
              Recomendado
            </span>
          )}
        </div>
        <p className="mt-1 text-h3 font-semibold text-ink-strong">{label}</p>
        <p className="mt-0.5 text-caption text-ink-muted tabular-nums">
          {pricing}
        </p>
      </div>

      {/* Features */}
      <ul className="mt-5 space-y-4 flex-1">
        {features.length === 0 ? (
          <li className="text-caption text-ink-quiet italic">
            Sin capacidades adicionales para esta especialidad en este tier.
          </li>
        ) : (
          features.map((f, i) => {
            const FIcon = f.icon;
            return (
              <li key={i} className="flex items-start gap-3">
                <FIcon
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-body-sm font-semibold text-ink-strong">
                    {f.label}
                  </p>
                  <p className="mt-1 text-caption text-ink-muted leading-relaxed">
                    {f.detail}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ul>

      {tierKey === "hospital" && features.length > 0 && (
        <p className="mt-6 pt-4 border-t border-line text-caption text-ink-soft">
          Disponible en Hospital Enterprise — contacto comercial.
        </p>
      )}
    </div>
  );
}
