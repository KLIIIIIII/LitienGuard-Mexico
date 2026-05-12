import { LayoutDashboard, TrendingUp } from "lucide-react";

// Datos ilustrativos — basados en un mes típico del piloto.
const BAR_DATA = [
  { day: "L", value: 8 },
  { day: "M", value: 11 },
  { day: "M", value: 12 },
  { day: "J", value: 10 },
  { day: "V", value: 14 },
  { day: "S", value: 4 },
];
const MAX_BAR = Math.max(...BAR_DATA.map((d) => d.value));

const DONUT_SEGMENTS = [
  { label: "Siguió", value: 64, color: "#4A6B5B" },
  { label: "Modificado", value: 22, color: "#C9A35A" },
  { label: "No siguió", value: 14, color: "#B8847C" },
];

function Donut({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const circumference = 2 * Math.PI * 36;
  let offset = 0;
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
      <circle
        cx="50"
        cy="50"
        r="36"
        fill="none"
        stroke="#F4F2EB"
        strokeWidth="14"
      />
      {segments.map((s) => {
        const len = (s.value / total) * circumference;
        const dasharray = `${len} ${circumference}`;
        const node = (
          <circle
            key={s.label}
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={dasharray}
            strokeDashoffset={-offset}
          />
        );
        offset += len;
        return node;
      })}
    </svg>
  );
}

export function DashboardMockup() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
      <div className="flex items-center gap-2 border-b border-line pb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warn-soft text-warn">
          <LayoutDashboard className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
            Ejemplo · Mi calidad este mes
          </p>
          <p className="text-body-sm font-semibold text-ink-strong">
            Loop de calidad sobre tus propias decisiones
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-line bg-surface-alt px-3 py-3">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
            Consultas
          </p>
          <p className="mt-1 text-h2 font-bold text-ink-strong leading-none">
            127
          </p>
          <p className="mt-1 flex items-center gap-1 text-caption text-validation">
            <TrendingUp className="h-3 w-3" strokeWidth={2.4} />
            +12% vs mes pasado
          </p>
        </div>
        <div className="rounded-lg border border-line bg-surface-alt px-3 py-3">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
            Tiempo SOAP
          </p>
          <p className="mt-1 text-h2 font-bold text-ink-strong leading-none">
            18s
          </p>
          <p className="mt-1 text-caption text-ink-muted">promedio por nota</p>
        </div>
        <div className="rounded-lg border border-line bg-surface-alt px-3 py-3">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
            Outcomes
          </p>
          <p className="mt-1 text-h2 font-bold text-ink-strong leading-none">
            89%
          </p>
          <p className="mt-1 text-caption text-ink-muted">registrados</p>
        </div>
      </div>

      {/* Bar chart + Donut */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft mb-3">
            Consultas por día
          </p>
          <div className="flex h-32 items-end justify-between gap-2">
            {BAR_DATA.map((d, i) => {
              const h = (d.value / MAX_BAR) * 100;
              return (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center gap-1.5"
                >
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-validation"
                      style={{ height: `${h}%` }}
                      aria-label={`${d.value} consultas`}
                    />
                  </div>
                  <span className="text-caption text-ink-soft">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft mb-3">
            Adherencia a tu recomendación
          </p>
          <div className="flex items-center gap-4">
            <Donut segments={DONUT_SEGMENTS} />
            <ul className="space-y-1.5 flex-1">
              {DONUT_SEGMENTS.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-caption">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-ink-strong font-medium">
                    {s.value}%
                  </span>
                  <span className="text-ink-muted">{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="mt-5 text-caption text-ink-soft leading-relaxed">
        Datos ilustrativos. Cada médico ve su propio panel con métricas
        reales conforme construye historia con el sistema.
      </p>
    </div>
  );
}
