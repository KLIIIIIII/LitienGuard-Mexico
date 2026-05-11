import { CheckCircle2, Clock, XCircle } from "lucide-react";

const STYLES = {
  borrador: {
    label: "Borrador",
    cls: "bg-warn-soft text-warn",
    icon: Clock,
  },
  firmada: {
    label: "Firmada",
    cls: "bg-validation-soft text-validation",
    icon: CheckCircle2,
  },
  descartada: {
    label: "Descartada",
    cls: "bg-rose-soft text-rose",
    icon: XCircle,
  },
} as const;

export function NoteStatusBadge({
  status,
}: {
  status: keyof typeof STYLES;
}) {
  const cfg = STYLES[status] ?? STYLES.borrador;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium ${cfg.cls}`}
    >
      <Icon className="h-3 w-3" strokeWidth={2.2} />
      {cfg.label}
    </span>
  );
}
