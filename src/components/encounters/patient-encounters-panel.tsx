import {
  Activity,
  Bed,
  CheckCircle2,
  History,
  Skull,
  Network,
} from "lucide-react";
import type {
  EncounterRow,
  EncounterModulo,
} from "@/lib/encounters/types";
import {
  MODULO_LABEL_ENCOUNTER,
  DISPOSITION_LABEL,
} from "@/lib/encounters/types";
import {
  formatLOS,
  formatAdmittedAgo,
  getEncounterPhase,
} from "@/lib/encounters/status";

interface PatientEncountersPanelProps {
  encounters: EncounterRow[];
  cruces?: Array<{ id: string; nombre: string; severidad: "critica" | "importante" | "informativa" }>;
}

function modulePill(m: EncounterModulo): string {
  switch (m) {
    case "urgencias":
      return "bg-code-red-bg/40 text-code-red";
    case "uci":
      return "bg-code-amber-bg/40 text-code-amber";
    case "quirofano":
      return "bg-accent-soft/40 text-accent";
    case "laboratorio":
      return "bg-validation-soft/40 text-validation";
    case "radiologia":
      return "bg-surface-alt text-ink-strong";
    case "cardiologia":
      return "bg-rose-soft/40 text-rose";
    case "neurologia":
      return "bg-accent-soft/40 text-accent";
    case "oncologia":
      return "bg-warn-soft/40 text-warn";
    case "endocrinologia":
      return "bg-validation-soft/40 text-validation";
    case "hospitalizacion":
      return "bg-warn-soft/40 text-warn";
    case "ambulatorio":
      return "bg-surface-alt text-ink-muted";
    default:
      return "bg-surface-alt text-ink-muted";
  }
}

export function PatientEncountersPanel({
  encounters,
  cruces = [],
}: PatientEncountersPanelProps) {
  // Encontrar el estado actual: encounter activo si existe, sino el más reciente
  const activo = encounters.find((e) => e.status === "activo");
  const ultimoCerrado = encounters
    .filter((e) => e.status !== "activo" && e.discharged_at)
    .sort((a, b) =>
      (b.discharged_at ?? "").localeCompare(a.discharged_at ?? ""),
    )[0];

  const ultimo12meses = encounters
    .filter((e) => {
      const ref = e.discharged_at ?? e.admitted_at;
      return (
        Date.now() - new Date(ref).getTime() < 365 * 24 * 3600 * 1000
      );
    })
    .sort((a, b) =>
      (b.admitted_at ?? "").localeCompare(a.admitted_at ?? ""),
    );

  const crucesCriticos = cruces.filter((c) => c.severidad === "critica");
  const crucesImportantes = cruces.filter(
    (c) => c.severidad === "importante",
  );

  return (
    <section className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-h3 font-semibold text-ink-strong">
          Encounter actual
        </h2>
        <p className="text-caption text-ink-muted">
          {encounters.length} encounter{encounters.length === 1 ? "" : "s"} en
          el padrón
        </p>
      </div>

      {/* Estado actual */}
      <div className="mt-4">
        {activo ? (
          <div className="flex items-start gap-3 rounded-xl border border-code-red/30 bg-code-red-bg/30 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-code-red/15 text-code-red">
              <Bed className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-code-red opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-code-red" />
                </span>
                <p className="text-caption font-semibold uppercase tracking-eyebrow text-code-red">
                  En el hospital ahora
                </p>
              </div>
              <p className="mt-1 text-body font-semibold text-ink-strong">
                {MODULO_LABEL_ENCOUNTER[activo.modulo]}
                {activo.bed_label ? ` · ${activo.bed_label}` : ""}
              </p>
              {activo.motivo_admision && (
                <p className="mt-0.5 text-caption text-ink-muted">
                  {activo.motivo_admision}
                </p>
              )}
              <p className="mt-2 font-mono text-caption text-ink-strong tabular-nums">
                Admitido {formatAdmittedAgo(activo.admitted_at)}
              </p>
            </div>
          </div>
        ) : ultimoCerrado ? (
          <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-alt/40 p-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                ultimoCerrado.status === "fallecido"
                  ? "bg-code-red-bg/40 text-code-red"
                  : "bg-validation-soft/40 text-validation"
              }`}
            >
              {ultimoCerrado.status === "fallecido" ? (
                <Skull className="h-5 w-5" strokeWidth={2} />
              ) : (
                <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
              )}
            </div>
            <div className="flex-1">
              <p className="text-caption font-semibold uppercase tracking-eyebrow text-ink-soft">
                {ultimoCerrado.status === "fallecido"
                  ? "Última atención"
                  : getEncounterPhase(ultimoCerrado) === "alta_reciente"
                    ? "Alta reciente — seguimiento outcome"
                    : "Última atención cerrada"}
              </p>
              <p className="mt-1 text-body font-semibold text-ink-strong">
                {MODULO_LABEL_ENCOUNTER[ultimoCerrado.modulo]}
                {ultimoCerrado.disposition
                  ? ` · ${DISPOSITION_LABEL[ultimoCerrado.disposition]}`
                  : ""}
              </p>
              {ultimoCerrado.motivo_admision && (
                <p className="mt-0.5 text-caption text-ink-muted">
                  {ultimoCerrado.motivo_admision}
                </p>
              )}
              <p className="mt-2 font-mono text-caption text-ink-muted tabular-nums">
                LOS {formatLOS(ultimoCerrado.los_minutes)} ·{" "}
                {ultimoCerrado.discharged_at
                  ? new Date(ultimoCerrado.discharged_at).toLocaleDateString(
                      "es-MX",
                      { day: "numeric", month: "long", year: "numeric" },
                    )
                  : "—"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-surface-alt/30 p-4">
            <Activity className="h-5 w-5 text-ink-quiet" strokeWidth={1.8} />
            <p className="text-caption text-ink-muted">
              Sin encounters registrados. El primer encounter se crea cuando
              el paciente es admitido a un departamento.
            </p>
          </div>
        )}
      </div>

      {/* Cruces clínicos activos */}
      {(crucesCriticos.length > 0 || crucesImportantes.length > 0) && (
        <div className="mt-4 rounded-xl border border-warn/30 bg-warn-soft/20 p-4">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-warn" strokeWidth={2} />
            <p className="text-caption font-semibold uppercase tracking-eyebrow text-warn">
              Cruces clínicos activos
            </p>
          </div>
          <ul className="mt-2 space-y-1">
            {[...crucesCriticos, ...crucesImportantes].slice(0, 4).map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 text-caption text-ink-strong"
              >
                <span
                  className={`inline-flex h-1.5 w-1.5 rounded-full ${
                    c.severidad === "critica" ? "bg-code-red" : "bg-warn"
                  }`}
                />
                <span className="font-semibold">
                  {c.severidad === "critica" ? "Crítico" : "Importante"}:
                </span>
                <span className="truncate">{c.nombre}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Timeline últimos 12 meses */}
      {ultimo12meses.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-ink-quiet" strokeWidth={2} />
            <p className="text-caption font-semibold uppercase tracking-eyebrow text-ink-soft">
              Timeline · últimos 12 meses
            </p>
          </div>
          <ol className="mt-3 space-y-2">
            {ultimo12meses.slice(0, 8).map((e) => (
              <li key={e.id} className="flex items-start gap-3">
                <span
                  className={`mt-1 inline-flex h-2 w-2 shrink-0 rounded-full ${
                    e.status === "activo"
                      ? "bg-code-red"
                      : e.status === "fallecido"
                        ? "bg-code-red/60"
                        : getEncounterPhase(e) === "alta_reciente"
                          ? "bg-validation"
                          : "bg-ink-quiet"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-eyebrow ${modulePill(e.modulo)}`}
                    >
                      {MODULO_LABEL_ENCOUNTER[e.modulo]}
                    </span>
                    <span className="text-caption text-ink-muted">
                      {new Date(e.admitted_at).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </span>
                  </div>
                  {e.motivo_admision && (
                    <p className="mt-0.5 text-caption text-ink-strong truncate">
                      {e.motivo_admision}
                    </p>
                  )}
                  <p className="font-mono text-caption text-ink-quiet tabular-nums">
                    {e.status === "activo"
                      ? "en curso"
                      : `LOS ${formatLOS(e.los_minutes)}`}
                    {e.disposition
                      ? ` · ${DISPOSITION_LABEL[e.disposition]}`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {ultimo12meses.length > 8 && (
            <p className="mt-2 text-caption text-ink-quiet">
              +{ultimo12meses.length - 8} encounters más en histórico
            </p>
          )}
        </div>
      )}
    </section>
  );
}
