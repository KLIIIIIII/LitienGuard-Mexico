"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { revokeInvite } from "./actions";

export function RevokeButton({
  id,
  disabled,
}: {
  id: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (disabled) return null;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Eliminar esta invitación?")) return;
        startTransition(async () => {
          await revokeInvite(id);
        });
      }}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-caption text-rose hover:bg-rose-soft disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "…" : "Revocar"}
    </button>
  );
}
