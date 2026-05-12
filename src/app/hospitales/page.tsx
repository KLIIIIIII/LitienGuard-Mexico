import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { FinalCta } from "@/components/final-cta";
import { ComplianceStrip } from "@/components/compliance-strip";
import { HospitalPlatformPreview } from "@/components/hospitales/platform-preview";
import { OperationsTabs } from "@/components/hospitales/operations-tabs";

export const metadata: Metadata = {
  title: "Para hospitales — Plataforma operativa hospitalaria",
  description:
    "Contabilización inteligente de CFDIs, dashboard financiero en tiempo real, gestor documental con audit log NOM-024. Recupera 5-15% de ingresos. Compatible con la Reforma LGS Salud Digital 2026.",
};

export default function HospitalesPage() {
  return (
    <>
      <PageHero
        eyebrow="Hospitales privados"
        title={
          <>
            Plataforma operativa{" "}
            <span className="lg-serif-italic text-validation">hospitalaria</span>{" "}
            sobre un mismo cerebro clínico.
          </>
        }
        description="Contabilización inteligente de CFDIs, dashboard financiero en tiempo real para el CFO y gestor documental con audit log NOM-024. Tres módulos que recuperan 5-15% de ingresos perdidos en fugas administrativas. Compatibles con la Reforma LGS Salud Digital 2026 desde el primer día."
        variant="alt"
      />

      <ComplianceStrip />

      {/* Adaral-style platform preview — 3 modules with mockups */}
      <HospitalPlatformPreview />

      {/* Operations tabs — RCM + EHR + Fit collapsed into a single elegant panel */}
      <OperationsTabs />

      <FinalCta
        title="Demo ejecutiva — 30 minutos, con tus números."
        description="Te mostramos exactamente cuánto podrías recuperar en tu operación. Sin compromiso, sin demos genéricas — usamos un pedazo de tu data real para cuantificar el caso."
      />
    </>
  );
}
