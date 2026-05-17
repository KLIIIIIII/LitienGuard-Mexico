"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  User,
  Users,
  Building2,
  Hospital,
  Stethoscope,
  HeartPulse,
  Smile,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  quotePrice,
  type Segment,
  type Specialty,
  type FunctionalTier,
  type BillingCycle,
  SOAP_QUOTA,
  SOAP_OVERAGE_MXN,
  HOSPITAL_ENTERPRISE_MIN_MXN,
} from "@/lib/stripe";
import { CheckoutButton } from "./checkout-button";

const FEATURES_BY_TIER: Record<
  "free" | "esencial" | "profesional" | "clinica" | "hospital",
  Array<{ label: string; ok: boolean }>
> = {
  free: [
    { label: "5 notas SOAP al mes", ok: true },
    { label: "Cerebro lectura básica", ok: true },
    { label: "Scribe ambient con SOAP automático", ok: false },
    { label: "Diferencial diagnóstico", ok: false },
    { label: "Recetas digitales", ok: false },
    { label: "Critical value alerting", ok: false },
    { label: "Allergy hard-stop", ok: false },
    { label: "Módulos hospitalarios", ok: false },
    { label: "Adaptive importer con IA", ok: false },
  ],
  esencial: [
    { label: "100 SOAPs/mes manuales", ok: true },
    { label: "Cerebro lectura completo con cita verbatim", ok: true },
    { label: "Padrón de pacientes con alergias", ok: true },
    { label: "Adaptive importer con IA (CSV cualquier formato)", ok: true },
    { label: "Recetas digitales NOM-024 con allergy hard-stop", ok: true },
    { label: "Agenda + reservación pública", ok: true },
    { label: "Critical value alerting (ACR + AHRQ)", ok: true },
    { label: "Patient header sticky global", ok: true },
    { label: "Diferencial diagnóstico", ok: false },
    { label: "Scribe ambient", ok: false },
    { label: "Workflows hospitalarios completos", ok: false },
  ],
  profesional: [
    { label: "300 SOAPs/mes con scribe ambient español MX", ok: true },
    { label: "Todo lo de Esencial", ok: true },
    { label: "Diferencial bayesiano multi-señal con anti-anclaje", ok: true },
    { label: "Auto-extracción de findings", ok: true },
    { label: "Motor de patrones multi-estudio (60 estudios)", ok: true },
    { label: "5 módulos hospitalarios (Urgencias/OR/UCI/Lab/Rad)", ok: true },
    { label: "Mi calidad personal — PPV calibrado", ok: true },
    { label: "Outcome loop con patient memory", ok: true },
    { label: "Tour interactivo + capacitación inline", ok: true },
    { label: "Soporte correo (24 h)", ok: true },
  ],
  clinica: [
    { label: "6 médicos base · escalable hasta 30", ok: true },
    { label: "Todo lo de Profesional para cada médico", ok: true },
    { label: "Multi-tenant con roles personalizados", ok: true },
    { label: "Dashboards agregados de calidad por médico", ok: true },
    { label: "RCM Copilot — validación pólizas (Q3 2027)", ok: true },
    { label: "SMART on FHIR app launch (Q4 2026)", ok: true },
    { label: "Integraciones HL7 v2 ORM bidireccional", ok: true },
    { label: "SLA 99.5% y soporte dedicado", ok: true },
    { label: "Onboarding + capacitación 1 día", ok: true },
  ],
  hospital: [
    { label: "30+ médicos · multi-departamento", ok: true },
    { label: "Todo lo de Clínica", ok: true },
    { label: "SLA 99.9% + soporte 24/7 (<4h respuesta)", ok: true },
    { label: "Onboarding presencial + 3 turnos capacitación", ok: true },
    { label: "Integración SMART on FHIR + USCDI v5", ok: true },
    { label: "DICOM lite + Modality Worklist", ok: true },
    { label: "Critical value notification a múltiples canales", ok: true },
    { label: "Audit per-field HIPAA-grade", ok: true },
    { label: "Cumplimiento Reforma LGS 2026 + NOM-024 documentado", ok: true },
    { label: "Account manager dedicado", ok: true },
  ],
};

const SEGMENTS: Array<{
  key: Segment;
  label: string;
  desc: string;
  icon: LucideIcon;
}> = [
  {
    key: "solo",
    label: "Solo",
    desc: "1 médico, consultorio propio",
    icon: User,
  },
  {
    key: "equipo",
    label: "Equipo",
    desc: "2-5 médicos, clínica chica",
    icon: Users,
  },
  {
    key: "clinica",
    label: "Clínica",
    desc: "6-30 médicos",
    icon: Building2,
  },
];

const SPECIALTIES: Array<{
  key: Specialty;
  label: string;
  desc: string;
  icon: LucideIcon;
}> = [
  {
    key: "general",
    label: "Médico General",
    desc: "Familiar, internista, urgenciólogo",
    icon: Stethoscope,
  },
  {
    key: "especialista",
    label: "Especialista",
    desc: "Cardio, neuro, endo, gineco, cirugía",
    icon: HeartPulse,
  },
  {
    key: "dentista",
    label: "Dentista",
    desc: "Odontología general y especializada",
    icon: Smile,
  },
];

export function PricingMatrix({
  billingEnabled,
}: {
  billingEnabled: boolean;
}) {
  const [segment, setSegment] = useState<Segment>("solo");
  const [specialty, setSpecialty] = useState<Specialty>("general");
  const [cycle, setCycle] = useState<BillingCycle>("mensual");

  const quoteEsencial = useMemo(
    () => quotePrice(segment, specialty, "esencial", cycle),
    [segment, specialty, cycle],
  );
  const quoteProfesional = useMemo(
    () => quotePrice(segment, specialty, "profesional", cycle),
    [segment, specialty, cycle],
  );

  const labelSegment = segment === "clinica" ? "Clínica" : segment === "equipo" ? "Equipo" : "Solo";

  return (
    <div className="space-y-10">
      {/* Selector — Segmento */}
      <div>
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold mb-3">
          1. Tamaño del consultorio
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {SEGMENTS.map((s) => {
            const Icon = s.icon;
            const active = segment === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSegment(s.key)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  active
                    ? "border-validation bg-validation-soft/30 shadow-lift"
                    : "border-line bg-surface hover:border-line-strong"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 ${active ? "text-validation" : "text-ink-strong"}`}
                    strokeWidth={2.2}
                  />
                  <p
                    className={`text-body-sm font-semibold ${active ? "text-validation" : "text-ink-strong"}`}
                  >
                    {s.label}
                  </p>
                </div>
                <p className="mt-1 text-caption text-ink-muted">{s.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector — Especialidad */}
      <div>
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold mb-3">
          2. Especialidad del médico {segment === "clinica" ? "(promedio del equipo)" : ""}
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {SPECIALTIES.map((s) => {
            const Icon = s.icon;
            const active = specialty === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSpecialty(s.key)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  active
                    ? "border-validation bg-validation-soft/30 shadow-lift"
                    : "border-line bg-surface hover:border-line-strong"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 ${active ? "text-validation" : "text-ink-strong"}`}
                    strokeWidth={2.2}
                  />
                  <p
                    className={`text-body-sm font-semibold ${active ? "text-validation" : "text-ink-strong"}`}
                  >
                    {s.label}
                  </p>
                </div>
                <p className="mt-1 text-caption text-ink-muted">{s.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cycle toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => setCycle("mensual")}
            className={`rounded-full px-5 py-1.5 text-caption font-medium transition-all ${
              cycle === "mensual"
                ? "bg-accent text-canvas"
                : "text-ink-muted hover:text-ink-strong"
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            onClick={() => setCycle("anual")}
            className={`rounded-full px-5 py-1.5 text-caption font-medium transition-all ${
              cycle === "anual"
                ? "bg-accent text-canvas"
                : "text-ink-muted hover:text-ink-strong"
            }`}
          >
            Anual <span className="text-validation">−16%</span>
          </button>
        </div>
      </div>

      {/* Tier cards */}
      <div className="grid gap-5 lg:grid-cols-4">
        {/* Free */}
        <TierCard
          name="Explorador"
          eyebrow="Empieza gratis"
          price="$0"
          cycle="para siempre"
          description="Conoce el sistema. Cerebro lectura básica + 5 SOAPs/mes."
          features={FEATURES_BY_TIER.free}
          cta={
            <Link
              href="/contacto#piloto"
              className="lg-cta-ghost w-full justify-center"
            >
              Empezar gratis
            </Link>
          }
        />

        {/* Esencial */}
        <TierCard
          name="Esencial"
          eyebrow={`${labelSegment} · ${specialty === "general" ? "MG" : specialty === "especialista" ? "Esp" : "Dent"}`}
          price={`$${quoteEsencial.monthlyMxn.toLocaleString("es-MX")}`}
          priceSuffix={segment === "equipo" ? "/médico" : ""}
          cycle={cycle === "anual" ? "MXN/mes · pagado anual" : "MXN/mes"}
          annualNote={
            cycle === "anual"
              ? `$${(quoteEsencial.annualMxn ?? 0).toLocaleString("es-MX")} pagado anual · ahorras 2 meses`
              : null
          }
          description={
            segment === "clinica"
              ? `Base 6 médicos + $${quoteEsencial.extraSeatMxn} MXN/médico extra. Hasta 30.`
              : segment === "equipo"
                ? `Mínimo 2, máximo 5 médicos. $${quoteEsencial.monthlyMxn}/médico/mes.`
                : "Complemento de tu EHR existente. Cerebro completo + recetas con allergy hard-stop."
          }
          features={FEATURES_BY_TIER.esencial}
          quotaNote={`${SOAP_QUOTA.esencial} SOAPs incluidos · exceso $${SOAP_OVERAGE_MXN.esencial}/SOAP`}
          cta={
            quoteEsencial.priceId ? (
              <CheckoutButton
                plan="esencial"
                cycle={cycle}
                enabled={billingEnabled}
                label="Suscribirme"
              />
            ) : (
              <Link
                href={`/contacto?plan=esencial&segment=${segment}&specialty=${specialty}`}
                className="lg-cta-ghost w-full justify-center"
              >
                Hablar con ventas
              </Link>
            )
          }
        />

        {/* Profesional (recomendado) */}
        <TierCard
          name="Profesional"
          eyebrow={`${labelSegment} · Recomendado`}
          price={`$${quoteProfesional.monthlyMxn.toLocaleString("es-MX")}`}
          priceSuffix={segment === "equipo" ? "/médico" : ""}
          cycle={cycle === "anual" ? "MXN/mes · pagado anual" : "MXN/mes"}
          annualNote={
            cycle === "anual"
              ? `$${(quoteProfesional.annualMxn ?? 0).toLocaleString("es-MX")} pagado anual · ahorras 2 meses`
              : null
          }
          description={
            segment === "clinica"
              ? `Base 6 médicos + $${quoteProfesional.extraSeatMxn} MXN/médico extra. Multi-tenant.`
              : segment === "equipo"
                ? `Mínimo 2, máximo 5 médicos. $${quoteProfesional.monthlyMxn}/médico/mes.`
                : "El motor completo: cerebro + diferencial + scribe + 5 módulos hospitalarios."
          }
          features={
            segment === "clinica"
              ? FEATURES_BY_TIER.clinica
              : FEATURES_BY_TIER.profesional
          }
          quotaNote={`${SOAP_QUOTA.profesional} SOAPs incluidos · exceso $${SOAP_OVERAGE_MXN.profesional}/SOAP`}
          highlight
          cta={
            quoteProfesional.priceId ? (
              <CheckoutButton
                plan="profesional"
                cycle={cycle}
                enabled={billingEnabled}
                label="Suscribirme"
                variant="primary"
              />
            ) : (
              <Link
                href={`/contacto?plan=profesional&segment=${segment}&specialty=${specialty}`}
                className="lg-cta-primary w-full justify-center"
              >
                Hablar con ventas
              </Link>
            )
          }
        />

        {/* Hospital Enterprise */}
        <TierCard
          name="Hospital"
          eyebrow="Enterprise"
          price="A medida"
          cycle={`desde $${HOSPITAL_ENTERPRISE_MIN_MXN.toLocaleString("es-MX")} MXN/mes`}
          description="30+ médicos · multi-departamento · SLA 99.9% · SMART on FHIR · DICOM. Christus, TecSalud, Médica Sur level."
          features={FEATURES_BY_TIER.hospital}
          quotaNote="SOAPs ilimitados"
          cta={
            <Link
              href="/contacto?plan=hospital"
              className="lg-cta-ghost w-full justify-center"
            >
              Hablar con ventas
            </Link>
          }
        />
      </div>

      {/* Footnote */}
      <div className="rounded-lg bg-surface-alt/40 p-4">
        <p className="text-caption text-ink-muted leading-relaxed text-center">
          <strong className="text-ink-strong">Selección actual:</strong>{" "}
          {labelSegment} · {SPECIALTIES.find((s) => s.key === specialty)?.label} · {cycle}.
          Cambia los filtros arriba para ver tu precio personalizado.
          IVA incluido. Sin contratos largos. Cancela en cualquier momento.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   TierCard
   ============================================================ */
function TierCard({
  name,
  eyebrow,
  price,
  priceSuffix,
  cycle,
  annualNote,
  description,
  features,
  quotaNote,
  cta,
  highlight,
}: {
  name: string;
  eyebrow: string;
  price: string;
  priceSuffix?: string;
  cycle: string;
  annualNote?: string | null;
  description: string;
  features: Array<{ label: string; ok: boolean }>;
  quotaNote?: string;
  cta: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-xl border bg-surface p-6 shadow-soft ${
        highlight ? "border-validation shadow-deep" : "border-line"
      }`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
          {eyebrow}
        </p>
        {highlight && (
          <span className="inline-flex items-center gap-1 rounded-full bg-validation-soft px-2 py-0.5 text-caption font-semibold text-validation">
            <Sparkles className="h-3 w-3" strokeWidth={2.2} />
            Más elegido
          </span>
        )}
      </div>
      <h3 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
        {name === "Hospital" ? "Hospital" : name}
      </h3>
      <div className="mt-4">
        <p className="text-display font-bold text-ink-strong leading-none">
          {price}
          {priceSuffix && (
            <span className="text-h3 font-normal text-ink-muted ml-1">
              {priceSuffix}
            </span>
          )}
        </p>
        <p className="mt-1 text-caption text-ink-muted">
          {cycle}
          {price !== "$0" && price !== "A medida" && (
            <span className="ml-1 text-ink-soft">· IVA incluido</span>
          )}
        </p>
        {annualNote && (
          <p className="mt-1 text-caption font-semibold text-validation">
            {annualNote}
          </p>
        )}
      </div>
      <p className="mt-4 text-body-sm text-ink-muted leading-relaxed">
        {description}
      </p>

      {quotaNote && (
        <p className="mt-2 text-caption text-ink-soft italic">{quotaNote}</p>
      )}

      <ul className="mt-6 flex-1 space-y-2">
        {features.map((f) => (
          <li
            key={f.label}
            className="flex items-start gap-2 text-body-sm"
          >
            {f.ok ? (
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-validation"
                strokeWidth={2.2}
              />
            ) : (
              <X
                className="mt-0.5 h-4 w-4 shrink-0 text-ink-quiet"
                strokeWidth={2.2}
              />
            )}
            <span className={f.ok ? "text-ink-strong" : "text-ink-soft"}>
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6">{cta}</div>

      {name === "Hospital" && (
        <p className="mt-3 text-caption text-ink-soft text-center">
          <Hospital className="inline h-3 w-3 mr-1" strokeWidth={2} />
          Custom contracting
        </p>
      )}
    </div>
  );
}
