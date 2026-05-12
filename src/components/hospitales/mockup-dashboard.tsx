import {
  TrendingDown,
  TrendingUp,
  Wallet,
  Building2,
  AlertCircle,
} from "lucide-react";
import { AppChrome } from "@/components/demos/app-chrome";

const ASEGURADORAS = [
  { name: "GNP Seguros", dso: 42, monto: "$1.8M", trend: "down" },
  { name: "AXA Seguros", dso: 51, monto: "$1.3M", trend: "down" },
  { name: "MetLife México", dso: 38, monto: "$890K", trend: "down" },
  { name: "Seguros Monterrey", dso: 67, monto: "$540K", trend: "up" },
  { name: "Bupa México", dso: 29, monto: "$420K", trend: "down" },
];

const CASHFLOW = [
  { semana: "S1", height: 42 },
  { semana: "S2", height: 58 },
  { semana: "S3", height: 48 },
  { semana: "S4", height: 71 },
  { semana: "S5", height: 64 },
  { semana: "S6", height: 82 },
  { semana: "S7", height: 76, projection: true },
  { semana: "S8", height: 88, projection: true },
];

export function MockupDashboard() {
  return (
    <AppChrome
      path="hospital/finanzas/dashboard"
      breadcrumb={["Hospital", "Finanzas", "Dashboard CFO"]}
      badge="Tiempo real"
    >
      <div className="space-y-3">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi
            label="DSO promedio"
            value="44 días"
            sub="-8 días vs mes pasado"
            trend="down"
            icon={TrendingDown}
            color="text-validation"
          />
          <Kpi
            label="Ingresos mes"
            value="$8.4M"
            sub="+12% vs abril"
            trend="up"
            icon={TrendingUp}
            color="text-validation"
          />
          <Kpi
            label="Cartera vencida >90d"
            value="$1.2M"
            sub="14.3% del total"
            trend="up"
            icon={AlertCircle}
            color="text-rose"
          />
          <Kpi
            label="Cash proyectado 30d"
            value="$11.7M"
            sub="incluye cartera + cobros"
            trend="up"
            icon={Wallet}
            color="text-validation"
          />
        </div>

        {/* Two-column grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Cash flow chart */}
          <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                Cash flow semanal
              </p>
              <p className="text-[0.6rem] text-ink-quiet">8 semanas</p>
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {CASHFLOW.map((week) => (
                <div
                  key={week.semana}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-full rounded-t ${
                      week.projection
                        ? "bg-validation/30 border border-dashed border-validation"
                        : "bg-validation"
                    }`}
                    style={{ height: `${week.height}%` }}
                  />
                  <span className="text-[0.55rem] text-ink-quiet">
                    {week.semana}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-1 text-[0.6rem] text-ink-muted">
              Líneas punteadas = proyección con base en cartera vigente
            </p>
          </div>

          {/* Aseguradoras */}
          <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-[0.65rem] uppercase tracking-eyebrow font-bold text-ink-soft">
                DSO por aseguradora
              </p>
              <p className="text-[0.6rem] text-ink-quiet">Top 5</p>
            </div>
            <div className="space-y-1.5">
              {ASEGURADORAS.map((a) => {
                const max = 70;
                const pct = Math.min(100, (a.dso / max) * 100);
                return (
                  <div
                    key={a.name}
                    className="flex items-center gap-2 text-[0.65rem]"
                  >
                    <Building2
                      className="h-3 w-3 text-ink-quiet shrink-0"
                      strokeWidth={2}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-medium text-ink-strong">
                          {a.name}
                        </span>
                        <span className="font-mono tabular-nums text-ink-muted shrink-0">
                          {a.monto}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <div className="h-1 flex-1 bg-surface-alt rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              a.dso <= 45
                                ? "bg-validation"
                                : a.dso <= 60
                                  ? "bg-warn"
                                  : "bg-rose"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-ink-muted font-mono">
                          {a.dso}d
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  trend: "up" | "down";
  icon: typeof TrendingUp;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2">
      <p className="text-[0.6rem] uppercase tracking-eyebrow text-ink-soft">
        {label}
      </p>
      <p className="mt-0.5 text-h3 font-bold tabular-nums text-ink-strong leading-tight">
        {value}
      </p>
      <p
        className={`mt-0.5 inline-flex items-center gap-1 text-[0.6rem] font-medium ${color}`}
      >
        <Icon className="h-2.5 w-2.5" strokeWidth={2.4} />
        {sub}
      </p>
    </div>
  );
}
