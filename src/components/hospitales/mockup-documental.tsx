import {
  Search,
  FileText,
  Shield,
  Calendar,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AppChrome } from "@/components/demos/app-chrome";

const DOCS = [
  {
    tipo: "Consentimiento quirúrgico",
    paciente: "M.R.V. · 67a",
    fecha: "12 may 2026",
    estado: "vigente",
    tag: "Clínico · NOM-004",
  },
  {
    tipo: "Contrato GNP Seguros",
    paciente: "Vigencia 2024-2026",
    fecha: "01 ene 2024",
    estado: "vence-pronto",
    tag: "Convenio · 32 días",
  },
  {
    tipo: "Certificación COFEPRIS",
    paciente: "Lic. sanitaria principal",
    fecha: "15 mar 2024",
    estado: "vigente",
    tag: "Regulatorio",
  },
  {
    tipo: "CFDI · Factura 1284",
    paciente: "GNP Aseguradora",
    fecha: "10 may 2026",
    estado: "vigente",
    tag: "Fiscal · CFDI 4.0",
  },
  {
    tipo: "Hoja de alta médica",
    paciente: "J.G.P. · 54a",
    fecha: "11 may 2026",
    estado: "vigente",
    tag: "Clínico · NOM-004",
  },
];

export function MockupDocumental() {
  return (
    <AppChrome
      path="hospital/documental"
      breadcrumb={["Hospital", "Gestor documental"]}
      badge="Audit-ready"
    >
      <div className="space-y-3">
        {/* Search + stats */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
            <Search
              className="h-3.5 w-3.5 text-ink-quiet shrink-0"
              strokeWidth={2}
            />
            <p className="text-caption text-ink-muted flex-1">
              Buscar consentimientos, CFDIs, contratos, hojas COFEPRIS…
            </p>
            <span className="rounded-md bg-surface-alt px-1.5 py-0.5 text-[0.6rem] font-mono text-ink-quiet">
              ⌘K
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <DocStat label="Total documentos" value="12,847" />
            <DocStat label="Clínicos · NOM-004" value="6,221" />
            <DocStat label="Fiscales · CFDI" value="4,890" />
            <DocStat label="Vencen <30d" value="14" alert />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-[0.6rem] text-ink-strong">
            <Filter className="h-2.5 w-2.5" strokeWidth={2.2} />
            Filtros
          </span>
          {["Clínico", "Fiscal", "Regulatorio", "Convenios"].map((f) => (
            <span
              key={f}
              className="rounded-full border border-line bg-surface px-2 py-0.5 text-[0.6rem] text-ink-strong"
            >
              {f}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-validation-soft px-2 py-0.5 text-[0.6rem] font-semibold text-validation">
            <Download className="h-2.5 w-2.5" strokeWidth={2.4} />
            Export SAT
          </span>
        </div>

        {/* Document list */}
        <div className="rounded-lg border border-line overflow-hidden">
          <div className="divide-y divide-line">
            {DOCS.map((d, i) => {
              const stateMeta =
                d.estado === "vigente"
                  ? {
                      icon: CheckCircle2,
                      bg: "bg-validation-soft text-validation",
                      label: "Vigente",
                    }
                  : {
                      icon: AlertTriangle,
                      bg: "bg-warn-soft text-warn",
                      label: "Vence pronto",
                    };
              const Icon = stateMeta.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-surface-alt/40"
                >
                  <FileText
                    className="h-3.5 w-3.5 text-ink-quiet shrink-0"
                    strokeWidth={2}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-caption font-semibold text-ink-strong truncate">
                      {d.tipo}
                    </p>
                    <p className="text-[0.6rem] text-ink-muted">
                      {d.paciente}
                    </p>
                  </div>
                  <span className="text-[0.6rem] text-ink-muted">{d.tag}</span>
                  <span className="text-[0.6rem] text-ink-muted tabular-nums shrink-0 flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" strokeWidth={2} />
                    {d.fecha}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold ${stateMeta.bg}`}
                  >
                    <Icon className="h-2.5 w-2.5" strokeWidth={2.4} />
                    {stateMeta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compliance footer */}
        <div className="flex items-center gap-2 rounded-lg border border-validation-soft bg-validation-soft/30 px-3 py-2">
          <Shield className="h-3.5 w-3.5 text-validation" strokeWidth={2} />
          <p className="text-[0.65rem] text-ink-strong flex-1">
            <span className="font-semibold">Audit log activo</span> · NOM-024-SSA3
            · LFPDPPP · Reforma LGS Salud Digital 2026
          </p>
        </div>
      </div>
    </AppChrome>
  );
}

function DocStat({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-2.5 py-1.5">
      <p className="text-[0.55rem] uppercase tracking-eyebrow text-ink-soft">
        {label}
      </p>
      <p
        className={`mt-0.5 text-body-sm font-bold tabular-nums leading-tight ${
          alert ? "text-warn" : "text-ink-strong"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
