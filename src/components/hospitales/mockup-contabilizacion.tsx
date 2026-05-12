import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Sparkles,
} from "lucide-react";
import { AppChrome } from "@/components/demos/app-chrome";

const CFDIS = [
  {
    proveedor: "Laboratorio Médico ARC",
    rfc: "LMA850412S78",
    monto: "$28,450.00",
    fecha: "12 may 2026",
    categoria: "Laboratorio",
    estado: "procesado",
  },
  {
    proveedor: "Farmacia Hospitalaria del Sur",
    rfc: "FHS920308R12",
    monto: "$142,890.50",
    fecha: "12 may 2026",
    categoria: "Farmacia · Inventario",
    estado: "procesado",
  },
  {
    proveedor: "Medical Supplies Corp",
    rfc: "MSC180625PQ4",
    monto: "$87,230.00",
    fecha: "11 may 2026",
    categoria: "Insumos · Quirófano",
    estado: "revision",
  },
  {
    proveedor: "Servicios Imagenología SA",
    rfc: "SIS990114KZ9",
    monto: "$56,100.00",
    fecha: "11 may 2026",
    categoria: "Imagenología",
    estado: "procesado",
  },
  {
    proveedor: "Honorarios Dr. Méndez R.",
    rfc: "MERG800725HF3",
    monto: "$32,000.00",
    fecha: "10 may 2026",
    categoria: "Honorarios médicos",
    estado: "duplicado",
  },
];

export function MockupContabilizacion() {
  return (
    <AppChrome
      path="hospital/contabilizacion"
      breadcrumb={["Hospital", "Finanzas", "CFDIs recibidos"]}
      badge="Captura inteligente"
    >
      <div className="space-y-4">
        {/* Top metrics */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "CFDIs procesados hoy", value: "47", soft: "+12 vs ayer" },
            { label: "Precisión IA", value: "96.4%", soft: "extracción AI" },
            { label: "Pendientes revisión", value: "3", soft: "requieren validación" },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-lg border border-line bg-surface px-3 py-2"
            >
              <p className="text-[0.6rem] uppercase tracking-eyebrow text-ink-soft">
                {k.label}
              </p>
              <p className="mt-0.5 text-h3 font-bold tabular-nums text-ink-strong">
                {k.value}
              </p>
              <p className="text-[0.62rem] text-ink-muted">{k.soft}</p>
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div className="rounded-lg border-2 border-dashed border-validation-soft bg-validation-soft/30 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Upload
              className="h-4 w-4 text-validation shrink-0"
              strokeWidth={2}
            />
            <p className="text-caption font-semibold text-ink-strong">
              Arrastra XMLs de CFDI aquí
            </p>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-validation-soft px-2 py-0.5 text-[0.6rem] font-semibold text-validation">
              <Sparkles className="h-2.5 w-2.5" strokeWidth={2.4} />
              IA clasificación
            </span>
          </div>
          <p className="mt-1 text-[0.65rem] text-ink-muted">
            Web · email automático · app móvil · drag-and-drop · API
          </p>
        </div>

        {/* CFDI table */}
        <div className="rounded-lg border border-line overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line bg-surface-alt px-3 py-1.5">
            <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-ink-soft flex-1">
              Últimos CFDIs
            </p>
            <span className="text-[0.6rem] text-ink-quiet">5 de 47</span>
          </div>
          <div className="divide-y divide-line">
            {CFDIS.map((c, i) => {
              const stateMeta =
                c.estado === "procesado"
                  ? {
                      icon: CheckCircle2,
                      cls: "text-validation",
                      bg: "bg-validation-soft text-validation",
                      label: "Procesado",
                    }
                  : c.estado === "revision"
                    ? {
                        icon: Clock,
                        cls: "text-warn",
                        bg: "bg-warn-soft text-warn",
                        label: "En revisión",
                      }
                    : {
                        icon: AlertCircle,
                        cls: "text-rose",
                        bg: "bg-rose-soft text-rose",
                        label: "Duplicado",
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
                      {c.proveedor}
                    </p>
                    <p className="text-[0.6rem] text-ink-muted font-mono">
                      {c.rfc} · {c.fecha} · {c.categoria}
                    </p>
                  </div>
                  <p className="text-caption font-bold tabular-nums text-ink-strong">
                    {c.monto}
                  </p>
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
      </div>
    </AppChrome>
  );
}
