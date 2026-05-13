"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  RotateCcw,
  Mail,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  revokeInvite,
  resetInvitation,
  resendInvitationEmail,
  revokeFullAccess,
} from "./actions";

interface Props {
  id: string;
  email: string;
  usada: boolean;
}

type Mode = null | "menu" | "revoke-confirm";

export function InvitationActionsMenu({ id, email, usada }: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    | { kind: "ok"; msg: string }
    | { kind: "error"; msg: string }
    | null
  >(null);
  const [motivo, setMotivo] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        if (mode === "menu") setMode(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMode(null);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [mode]);

  // Auto-clear feedback after 4s
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4500);
    return () => clearTimeout(t);
  }, [feedback]);

  function runAction(
    fn: () =>
      | Promise<{ status: "ok"; message: string } | { status: "error"; message: string }>
      | Promise<void>,
  ) {
    startTransition(async () => {
      const r = await fn();
      setMode(null);
      if (!r) {
        setFeedback({ kind: "ok", msg: "Acción completada" });
        return;
      }
      if (r.status === "ok") {
        setFeedback({ kind: "ok", msg: r.message });
      } else {
        setFeedback({ kind: "error", msg: r.message });
      }
    });
  }

  return (
    <div className="relative inline-flex items-center gap-2" ref={menuRef}>
      {feedback && (
        <span
          className={`hidden sm:inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.65rem] font-medium ${
            feedback.kind === "ok"
              ? "bg-validation-soft text-validation"
              : "bg-rose-soft text-rose"
          }`}
        >
          {feedback.kind === "ok" ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          <span className="max-w-[160px] truncate">{feedback.msg}</span>
        </span>
      )}

      <button
        type="button"
        onClick={() => setMode(mode === "menu" ? null : "menu")}
        disabled={pending}
        aria-label="Más acciones"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-ink-muted hover:bg-surface-alt disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <MoreHorizontal className="h-3.5 w-3.5" />
        )}
      </button>

      {mode === "menu" && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-60 rounded-xl border border-line bg-surface shadow-lift overflow-hidden">
          <p className="border-b border-line bg-surface-alt px-3 py-2 text-[0.6rem] uppercase tracking-eyebrow font-bold text-ink-soft">
            Acciones
          </p>
          <MenuItem
            icon={Mail}
            label="Reenviar correo"
            hint="No toca DB. Vuelve a mandar el link de bienvenida."
            disabled={usada}
            disabledHint="Usa 'Reiniciar' — la invitación está marcada como usada"
            onClick={() =>
              runAction(() => resendInvitationEmail(id))
            }
          />
          <MenuItem
            icon={RotateCcw}
            label="Reiniciar invitación"
            hint="Pone usada=false + renueva 60 días + reenvía correo."
            tone="warn"
            onClick={() => runAction(() => resetInvitation(id))}
          />
          <MenuItem
            icon={Trash2}
            label="Eliminar invitación"
            hint="Sin tocar cuenta Auth. Reversible recreando invitación."
            tone="rose"
            onClick={() => {
              if (!confirm(`¿Eliminar invitación de ${email}? Esta acción borra solo la invitación, no la cuenta.`))
                return;
              runAction(async () => {
                await revokeInvite(id);
                return { status: "ok" as const, message: `Invitación de ${email} eliminada` };
              });
            }}
          />
          <div className="border-t border-line">
            <MenuItem
              icon={AlertCircle}
              label="Revocar acceso completo"
              hint="Borra invitación + cuenta Supabase Auth. Destructivo."
              tone="rose"
              onClick={() => setMode("revoke-confirm")}
            />
          </div>
        </div>
      )}

      {mode === "revoke-confirm" && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-80 rounded-xl border-2 border-rose bg-surface shadow-lift p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose" />
            <div className="min-w-0">
              <p className="text-body-sm font-bold text-ink-strong">
                Revocar acceso completo
              </p>
              <p className="mt-1 text-caption text-ink-muted leading-relaxed">
                Esto borra la invitación de <strong>{email}</strong> y elimina
                la cuenta de Supabase Auth si existe. No se puede deshacer.
              </p>
            </div>
          </div>
          <label className="mt-3 block text-caption font-medium text-ink-strong">
            Motivo (queda en el audit log)
          </label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Ej. médico se equivocó de correo"
            className="lg-input mt-1"
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setMode(null);
                setMotivo("");
              }}
              disabled={pending}
              className="text-caption text-ink-muted hover:text-ink-strong disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={pending || !motivo.trim()}
              onClick={() => {
                runAction(() => revokeFullAccess(id, motivo));
                setMotivo("");
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose px-3 py-1.5 text-caption font-medium text-surface disabled:opacity-50"
            >
              {pending && <Loader2 className="h-3 w-3 animate-spin" />}
              Confirmar revocación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  hint,
  tone,
  disabled,
  disabledHint,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  tone?: "warn" | "rose";
  disabled?: boolean;
  disabledHint?: string;
  onClick: () => void;
}) {
  const colorCls = disabled
    ? "text-ink-quiet"
    : tone === "rose"
      ? "text-rose hover:bg-rose-soft"
      : tone === "warn"
        ? "text-warn hover:bg-warn-soft"
        : "text-ink-strong hover:bg-surface-alt";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledHint : undefined}
      className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-body-sm transition-colors ${colorCls} disabled:cursor-not-allowed`}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug">{label}</p>
        <p className="mt-0.5 text-[0.65rem] text-ink-soft leading-snug">
          {disabled && disabledHint ? disabledHint : hint}
        </p>
      </div>
    </button>
  );
}
