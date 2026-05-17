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
  Sparkles,
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
  color: string;
  esencial: Feature[];
  profesional: Feature[];
  hospital: Feature[];
};

/* ============================================================
   Datos curados por especialidad
   ============================================================ */

const WORKFLOWS: SpecialtyWorkflow[] = [
  {
    key: "cardiologia",
    label: "Cardiología",
    icon: HeartPulse,
    tagline: "12 diagnósticos curados · trials pivotal 2018-2024 · 4 pilares HFrEF",
    color: "rose",
    esencial: [
      {
        icon: BookOpen,
        label: "Cerebro cardiológico",
        detail: "12 dx curados: HFrEF/HFpEF subtypes, SCAD, ATTR-CM, IC aguda, EA severa LFLG. AHA/ESC + 2025 ACC ATTR-CM guidance.",
      },
      {
        icon: Sparkles,
        label: "Fármacos Cuadro Básico cardio",
        detail: "Los 4 pilares HFrEF (IECA/ARNI, BB, ARM, SGLT2). Anticoagulantes, antiagregantes, estatinas IMSS.",
      },
      {
        icon: Check,
        label: "Recetas con allergy hard-stop",
        detail: "Cross-check sintáctico contra alergias documentadas antes de firmar.",
      },
    ],
    profesional: [
      {
        icon: Sparkles,
        label: "Diferencial bayesiano cardio",
        detail: "Multi-señal con anti-anclaje, posteriors por hipótesis con cita verbatim.",
      },
      {
        icon: FlaskConical,
        label: "Motor de estudios cardio",
        detail: "EKG, eco con strain, troponina, NT-proBNP, gammagrafía PYP, angio-TC, RM cardíaca, FLC.",
      },
      {
        icon: Network,
        label: "Patrones canónicos curados",
        detail: "SCAD en mujer joven, EA severa LFLG, ATTR-CM diagnóstico no-invasivo, IC aguda fenotipos.",
      },
      {
        icon: Siren,
        label: "Urgencias · Código IAM (STEMI)",
        detail: "Protocolo puerta-balón ≤90 min con checklist + timer en vivo + alertas de tiempo.",
      },
      {
        icon: Mic,
        label: "Scribe español MX cardio",
        detail: "Captura terminología cardiológica MX, genera SOAP estructurado con citas a guías.",
      },
    ],
    hospital: [
      {
        icon: ClipboardCheck,
        label: "UCI con vasoactivos y SOFA",
        detail: "Calculadora SOFA + dosis vasoactivos por peso + bundle FAST-HUG.",
      },
      {
        icon: TrendingUp,
        label: "Dashboards compliance AHA/ESC",
        detail: "% pacientes con los 4 pilares, % anticoagulados con FA, time-to-troponina.",
      },
    ],
  },
  {
    key: "oncologia",
    label: "Oncología",
    icon: Ribbon,
    tagline: "Work-up curado · BRCA · smart radiomics · tumor board",
    color: "accent",
    esencial: [
      {
        icon: BookOpen,
        label: "Cerebro oncológico",
        detail: "Patrones de work-up de los cánceres más prevalentes en MX. NCCN guidelines como anclaje.",
      },
      {
        icon: Sparkles,
        label: "Fármacos quimioterapia básica",
        detail: "Cuadro Básico CAUSES + esquemas estándar primera línea. Soporte cuidados.",
      },
      {
        icon: Check,
        label: "Recetas con allergy hard-stop",
        detail: "Cross-check contra alergias + interacciones críticas de quimioterapia.",
      },
    ],
    profesional: [
      {
        icon: Sparkles,
        label: "Diferencial oncológico multi-señal",
        detail: "Combinación de marcadores tumorales, imagen, biopsia y genómica con LRs ponderados.",
      },
      {
        icon: FlaskConical,
        label: "Motor de estudios oncológicos",
        detail: "TAC, RM, PET, biopsia con IHC, marcadores tumorales, BRCA, paneles moleculares Foundation/Tempus.",
      },
      {
        icon: Network,
        label: "Patrones canónicos",
        detail: "Work-up de cánceres top en MX: pulmón, próstata, colon, hígado. Decisiones primera línea.",
      },
      {
        icon: ScanLine,
        label: "Smart radiomics — lectura asistida",
        detail: "Análisis cuantitativo de imagen con AI assist (siguiendo modelo Mayo/MD Anderson).",
      },
      {
        icon: Mic,
        label: "Scribe español MX oncológico",
        detail: "Captura notas con terminología NCCN traducida, esquemas de quimioterapia estructurados.",
      },
    ],
    hospital: [
      {
        icon: ClipboardCheck,
        label: "Workflow multidisciplinario",
        detail: "Tumor board coordination, integración con patología y radiología, decisiones colegiadas.",
      },
      {
        icon: TrendingUp,
        label: "Dashboards adherencia NCCN",
        detail: "% pacientes con tratamiento estándar, time-to-treatment, outcome a 1-2-5 años.",
      },
    ],
  },
  {
    key: "gineco_oncologia",
    label: "Gineco-oncología",
    icon: CircleDot,
    tagline: "4 cánceres curados · mama · cérvix · ovario · endometrio · BRCA + Lynch",
    color: "validation",
    esencial: [
      {
        icon: BookOpen,
        label: "Cerebro gineco-oncológico",
        detail: "4 cánceres curados: mama (ER/PR/HER2), cérvix (FIGO), ovario (BRCA), endometrio (Lynch). NCCN + ASCO.",
      },
      {
        icon: Sparkles,
        label: "Fármacos hormonoterapia + quimio",
        detail: "Tamoxifeno, IA, trastuzumab, T-DM1, PARPi (olaparib, niraparib). Cuadro CAUSES.",
      },
      {
        icon: Check,
        label: "Recetas con allergy hard-stop",
        detail: "Cross-check + alertas de toxicidad cumulativa.",
      },
    ],
    profesional: [
      {
        icon: Sparkles,
        label: "Diferencial multi-señal gineco-onco",
        detail: "Combina genómica BRCA/Lynch, biopsia, imagen multi-modal, marcadores CA-125, HE4.",
      },
      {
        icon: FlaskConical,
        label: "Motor de estudios gineco-onco",
        detail: "Mamografía + USG + RM, citología cervical + VPH, USG transvaginal + biopsia endometrio, panel BRCA1/2, Lynch syndrome.",
      },
      {
        icon: Network,
        label: "Patrones canónicos",
        detail: "BRCA mutation work-up, Lynch screening, mama triple negativo, ovario seroso de alto grado.",
      },
      {
        icon: Mic,
        label: "Scribe español MX gineco",
        detail: "Captura estadificación FIGO, estadísticas TNM, perfil molecular tumor.",
      },
    ],
    hospital: [
      {
        icon: ClipboardCheck,
        label: "Workflow oncoginecológico",
        detail: "Cirugía + quimio + radio coordinados. Trazabilidad de estadificación FIGO.",
      },
      {
        icon: TrendingUp,
        label: "Consejo genético BRCA/Lynch",
        detail: "Trazabilidad de testing genético, recomendaciones cascada familiar.",
      },
    ],
  },
  {
    key: "diabetes_endo",
    label: "Diabetes / Endo",
    icon: Droplet,
    tagline: "13 diagnósticos · ADA 2024 · DKA + HHS · gestacional · tiroides",
    color: "accent",
    esencial: [
      {
        icon: BookOpen,
        label: "Cerebro endocrinológico",
        detail: "13 dx: DM2 ADA 2024, DM gestacional, DKA, HHS, hipotiroidismo, Cushing, suprarrenal, hiperparatiroidismo.",
      },
      {
        icon: Sparkles,
        label: "Fármacos Cuadro Básico IMSS",
        detail: "Metformina, sulfonilureas, DPP4, GLP-1 (semaglutida), SGLT2 (dapa/empa), insulinas, levotiroxina.",
      },
      {
        icon: Check,
        label: "Recetas con allergy hard-stop sulfas",
        detail: "Detecta alergia a sulfamidas → bloquea glibenclamida y tiazidas.",
      },
    ],
    profesional: [
      {
        icon: Sparkles,
        label: "Diferencial endo multi-señal",
        detail: "DKA vs HHS, sospecha de feocromocitoma vs incidentaloma, hiper/hipotiroidismo subclínico.",
      },
      {
        icon: FlaskConical,
        label: "Motor de estudios endo",
        detail: "HbA1c, glucosa ayuno/postprandial, perfil tiroideo, anti-GAD, péptido C, ITT, cortisol AM, aldosterona, PTH.",
      },
      {
        icon: Network,
        label: "Patrones canónicos",
        detail: "DKA criterios completos, sospecha LADA, fenotipos DM2, retinopatía diabética estratificación.",
      },
      {
        icon: Siren,
        label: "Urgencias · Protocolo DKA",
        detail: "Bundle de manejo: NaCl 0.9%, insulina IV titulada, K reposición, alerta edema cerebral en pediatría.",
      },
      {
        icon: Mic,
        label: "Scribe español MX endocrinología",
        detail: "Captura ADA targets, ajustes insulínicos, escalamiento terapéutico ADA.",
      },
    ],
    hospital: [
      {
        icon: ClipboardCheck,
        label: "UCI con bomba insulina",
        detail: "Control glicémico continuo, protocolo Yale en perioperatorio.",
      },
      {
        icon: TrendingUp,
        label: "Dashboards quality DM",
        detail: "% pacientes con HbA1c <7%, retinopatía screening anual, microalbuminuria seguimiento.",
      },
    ],
  },
  {
    key: "neurologia",
    label: "Neurología",
    icon: Brain,
    tagline: "11 diagnósticos · EVC + cefalea + epilepsia + demencia · ventana terapéutica",
    color: "warn",
    esencial: [
      {
        icon: BookOpen,
        label: "Cerebro neurológico",
        detail: "11 dx: EVC isquémico/hemorrágico, cefalea (migrañas/tensional), epilepsia, demencia (Alzheimer/vascular), neuropatías.",
      },
      {
        icon: Sparkles,
        label: "Fármacos Cuadro Básico neuro",
        detail: "Anticonvulsivantes (valproato, levetiracetam, fenitoína), antimigrañosos (triptanes, CGRP), L-DOPA, donepezilo.",
      },
      {
        icon: Check,
        label: "Recetas con allergy hard-stop",
        detail: "Cross-check + alertas de interacciones AED-AED, monitoreo niveles séricos.",
      },
    ],
    profesional: [
      {
        icon: Sparkles,
        label: "Diferencial neurológico multi-señal",
        detail: "EVC isq vs hem, cefalea primaria vs secundaria, demencia subtypes con biomarcadores.",
      },
      {
        icon: FlaskConical,
        label: "Motor de estudios neuro",
        detail: "TAC craneal, RM cerebro multi-secuencia, EEG, EMG, LCR, biomarcadores Alzheimer (Aβ42, p-tau), NIHSS calculator.",
      },
      {
        icon: Network,
        label: "Patrones canónicos",
        detail: "EVC ventana terapéutica (≤4.5h trombolisis), HSA work-up, status epiléptico, encefalopatía urémica.",
      },
      {
        icon: Siren,
        label: "Urgencias · Código Stroke",
        detail: "Protocolo puerta-aguja ≤60 min con NIHSS + TC craneal + decisión alteplasa/trombectomía. Timer en vivo.",
      },
      {
        icon: Mic,
        label: "Scribe español MX neuro",
        detail: "Captura NIHSS, mMRC, escalas neurocognitivas (MoCA, MMSE), Glasgow.",
      },
    ],
    hospital: [
      {
        icon: ClipboardCheck,
        label: "UCI neurológica",
        detail: "Monitoreo PIC, doppler transcraneal, sedación protocolizada para status epiléptico.",
      },
      {
        icon: TrendingUp,
        label: "Workflow trombectomía mecánica",
        detail: "Coordinación con hemodinamia, ventana 6-24h, ASPECTS automático, dashboards puerta-recanalización.",
      },
    ],
  },
];

const TIER_LABEL: Record<TierKey, { name: string; price: string }> = {
  esencial: { name: "Esencial", price: "desde $1,209/mes" },
  profesional: { name: "Profesional", price: "desde $2,429/mes" },
  hospital: { name: "Hospital", price: "custom" },
};

/* ============================================================
   Componente principal
   ============================================================ */
export function SpecialtyWorkflows() {
  const [active, setActive] = useState<SpecialtyWorkflow["key"]>("cardiologia");
  const current = WORKFLOWS.find((w) => w.key === active)!;
  const Icon = current.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-caption uppercase tracking-eyebrow text-validation font-semibold">
          Workflows por especialidad
        </p>
        <h2 className="mt-2 text-h1 font-semibold tracking-tight text-ink-strong">
          Exactamente qué hace LitienGuard para ti.
        </h2>
        <p className="mt-3 text-body-sm text-ink-muted leading-relaxed">
          5 especialidades core con cerebro curado, motor de patrones, motor
          de estudios diagnósticos y protocolos críticos integrados. Cada
          tier añade capa de profundidad.
        </p>
      </div>

      {/* Specialty tabs */}
      <div role="tablist" className="flex flex-wrap items-center justify-center gap-2">
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
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-all ${
                isActive
                  ? "border-validation bg-validation text-canvas shadow-lift"
                  : "border-line bg-surface text-ink-strong hover:border-line-strong"
              }`}
            >
              <WIcon className="h-4 w-4" strokeWidth={2.2} />
              <span className="text-body-sm font-semibold">{w.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          {/* Tagline */}
          <div className="rounded-2xl border-2 border-validation/30 bg-validation-soft/20 p-6 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-validation text-canvas p-2.5 mb-3">
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>
            <h3 className="text-h2 font-bold tracking-tight text-ink-strong">
              {current.label}
            </h3>
            <p className="mt-2 text-body-sm text-ink-muted italic max-w-prose mx-auto">
              {current.tagline}
            </p>
          </div>

          {/* 3 tier columns */}
          <div className="grid gap-4 lg:grid-cols-3">
            <TierColumn
              tier="esencial"
              features={current.esencial}
              tierLabel="Esencial"
              tierPrice={TIER_LABEL.esencial.price}
            />
            <TierColumn
              tier="profesional"
              features={current.profesional}
              tierLabel="Profesional"
              tierPrice={TIER_LABEL.profesional.price}
              highlight
            />
            <TierColumn
              tier="hospital"
              features={current.hospital}
              tierLabel="Hospital"
              tierPrice={TIER_LABEL.hospital.price}
            />
          </div>

          {/* Footer note */}
          <p className="text-caption text-ink-soft italic text-center max-w-prose mx-auto leading-relaxed">
            Todos los features superiores incluyen lo del tier anterior.
            Esencial es la base · Profesional añade diferencial bayesiano +
            módulos hospitalarios + scribe · Hospital añade UCI + dashboards
            agregados + integraciones enterprise.
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   TierColumn
   ============================================================ */
function TierColumn({
  tier,
  tierLabel,
  tierPrice,
  features,
  highlight,
}: {
  tier: TierKey;
  tierLabel: string;
  tierPrice: string;
  features: Feature[];
  highlight?: boolean;
}) {
  const ringClass = highlight
    ? "border-validation shadow-lift"
    : "border-line";

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-surface p-5 ${ringClass}`}
    >
      <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-line">
        <div>
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
            Plan
          </p>
          <p className="text-h3 font-bold text-ink-strong">{tierLabel}</p>
        </div>
        <p className="text-caption text-ink-muted text-right">{tierPrice}</p>
      </div>

      <ul className="mt-4 space-y-3 flex-1">
        {features.length === 0 ? (
          <li className="text-caption text-ink-quiet italic">
            Sin features adicionales para esta especialidad en este tier.
          </li>
        ) : (
          features.map((f, i) => {
            const FIcon = f.icon;
            return (
              <li key={i} className="flex items-start gap-2.5">
                <div
                  className={`rounded-lg p-1.5 shrink-0 ${highlight ? "bg-validation-soft text-validation" : "bg-surface-alt text-ink-strong"}`}
                >
                  <FIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-body-sm font-semibold text-ink-strong">
                    {f.label}
                  </p>
                  <p className="mt-0.5 text-caption text-ink-muted leading-relaxed">
                    {f.detail}
                  </p>
                </div>
              </li>
            );
          })
        )}
      </ul>

      {tier === "hospital" && features.length > 0 && (
        <p className="mt-4 text-caption text-ink-soft italic">
          Solo en Hospital Enterprise · contacto comercial
        </p>
      )}
    </div>
  );
}
