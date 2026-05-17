import {
  Bed,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Skull,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {
  type EncounterRow,
  type EncounterSeveridad,
  DISPOSITION_LABEL,
} from "@/lib/encounters/types";
import { formatLOS, formatAdmittedAgo } from "@/lib/encounters/status";

type EncounterCardData = EncounterRow & {
  paciente?: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    sexo: "M" | "F" | null;
    fecha_nacimiento: string | null;
  } | null;
};

const SEV_BADGE: Record<EncounterSeveridad, { bg: string; text: string; label: string; ringPulse?: boolean }> = {
  rojo: { bg: "bg-code-red-bg", text: "text-code-red", label: "Crítico", ringPulse: true },
  naranja: { bg: "bg-code-amber-bg", text: "text-code-amber", label: "Muy urgente" },
  amarillo: { bg: "bg-code-amber-bg/60", text: "text-warn", label: "Urgente" },
  verde: { bg: "bg-code-green-bg", text: "text-code-green", label: "Estable" },
  azul: { bg: "bg-surface-alt", text: "text-ink-muted", label: "No urgente" },
};

function calcAge(fechaNac: string | null): number | null {
  if (!fechaNac) return null;
  const years =
    (Date.now() - new Date(fechaNac).getTime()) / (365.25 * 24 * 3600 * 1000);
  return Math.floor(years);
}

function patientLabel(e: EncounterCardData): string {
  if (!e.paciente) return "Paciente sin vincular";
  const p = e.paciente;
  return `${p.nombre} ${p.apellido_paterno}${p.apellido_materno ? " " + p.apellido_materno : ""}`;
}

function patientMeta(e: EncounterCardData): string {
  if (!e.paciente) return "";
  const edad = calcAge(e.paciente.fecha_nacimiento);
  const sexo = e.paciente.sexo;
  const parts = [];
  if (edad !== null) parts.push(`${edad} años`);
  if (sexo) parts.push(sexo === "M" ? "M" : "F");
  return parts.join(" · ");
}

export function EncounterCardActive({ e }: { e: EncounterCardData }) {
  const sev = e.severidad ? SEV_BADGE[e.severidad] : SEV_BADGE.verde;
  return (
    <article
      className={`group relative flex items-stretch rounded-xl border bg-surface transition-all hover:shadow-lift hover:border-validation/40 ${
        e.severidad === "rojo"
          ? "border-code-red/30"
          : e.severidad === "naranja"
            ? "border-code-amber/30"
            : "border-line"
      }`}
    >
      <div
        className={`flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-l-xl border-r ${sev.bg} ${
          e.severidad === "rojo"
            ? "border-code-red/30"
            : e.severidad === "naranja"
              ? "border-code-amber/30"
              : "border-line"
        }`}
      >
        <Bed className={`h-4 w-4 ${sev.text}`} strokeWidth={2} />
        <span
          className={`font-mono text-caption font-semibold tabular-nums ${sev.text}`}
        >
          {e.bed_label?.split("-")[1] ?? "—"}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-eyebrow ${sev.bg} ${sev.text} ${sev.ringPulse ? "ring-1 ring-code-red/30" : ""}`}
              >
                {sev.ringPulse && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-code-red opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-code-red" />
                  </span>
                )}
                {sev.label}
              </span>
              <span className="text-caption text-ink-quiet">
                {e.bed_label ?? "Sin cama"}
              </span>
            </div>
            <h3 className="mt-1 truncate text-body-sm font-semibold text-ink-strong">
              {patientLabel(e)}
            </h3>
            <p className="text-caption text-ink-muted">{patientMeta(e)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-caption uppercase tracking-eyebrow text-ink-quiet">
              Admitido
            </p>
            <p className="font-mono text-caption font-semibold tabular-nums text-ink-strong">
              {formatAdmittedAgo(e.admitted_at)}
            </p>
          </div>
        </div>

        {e.motivo_admision && (
          <p className="line-clamp-2 text-caption text-ink-muted leading-relaxed">
            {e.motivo_admision}
          </p>
        )}

        {e.paciente_id && (
          <Link
            href={`/dashboard/pacientes/${e.paciente_id}`}
            className="inline-flex items-center gap-1 text-caption font-semibold text-validation opacity-0 transition-opacity group-hover:opacity-100"
          >
            Ver paciente
            <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
          </Link>
        )}
      </div>
    </article>
  );
}

export function EncounterCardDischarged({ e }: { e: EncounterCardData }) {
  const isFallecido = e.status === "fallecido";
  const dispoLabel = e.disposition
    ? DISPOSITION_LABEL[e.disposition]
    : "Cierre";

  return (
    <article className="group flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 transition-all hover:border-validation/30">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isFallecido
            ? "bg-code-red-bg/40 text-code-red"
            : "bg-validation-soft/40 text-validation"
        }`}
      >
        {isFallecido ? (
          <Skull className="h-4 w-4" strokeWidth={2} />
        ) : (
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-body-sm font-semibold text-ink-strong">
            {patientLabel(e)}
          </h3>
          <span className="text-caption text-ink-quiet">{patientMeta(e)}</span>
        </div>
        <p className="truncate text-caption text-ink-muted">
          {dispoLabel}
          {e.bed_label ? ` · ${e.bed_label}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-caption font-semibold tabular-nums text-ink-strong">
          {formatLOS(e.los_minutes)}
        </p>
        <p className="text-caption text-ink-quiet">
          {e.discharged_at
            ? new Date(e.discharged_at).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
              })
            : "—"}
        </p>
      </div>
    </article>
  );
}

export function EncounterRowHistorico({ e }: { e: EncounterCardData }) {
  const dispoLabel = e.disposition ? DISPOSITION_LABEL[e.disposition] : "—";
  return (
    <tr className="hover:bg-surface-alt/40">
      <td className="px-3 py-2.5 align-top">
        <p className="text-body-sm font-medium text-ink-strong">
          {patientLabel(e)}
        </p>
        <p className="text-caption text-ink-quiet">{patientMeta(e)}</p>
      </td>
      <td className="px-3 py-2.5 align-top text-caption text-ink-muted">
        {e.motivo_admision ?? "—"}
      </td>
      <td className="px-3 py-2.5 align-top text-caption text-ink-muted">
        {dispoLabel}
      </td>
      <td className="px-3 py-2.5 align-top font-mono tabular-nums text-caption text-ink-strong">
        {formatLOS(e.los_minutes)}
      </td>
      <td className="px-3 py-2.5 align-top tabular-nums text-caption text-ink-muted">
        {e.discharged_at
          ? new Date(e.discharged_at).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
              year: "2-digit",
            })
          : "—"}
      </td>
    </tr>
  );
}

export function EmptyStateCard({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof AlertTriangle;
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center">
      <Icon className="mx-auto h-7 w-7 text-ink-quiet" strokeWidth={1.6} />
      <p className="mt-3 text-body-sm font-semibold text-ink-strong">
        {title}
      </p>
      {hint && (
        <p className="mt-1 text-caption text-ink-muted max-w-prose mx-auto leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}
