"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { eliminarChunk, toggleActivoChunk } from "../actions";

export function ToggleActiveButton({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleActivoChunk(id))}
      className="lg-cta-ghost"
    >
      {pending ? "…" : active ? "Desactivar" : "Activar"}
    </button>
  );
}

export function DeleteChunkButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Eliminar este chunk? No se puede deshacer.")) return;
        startTransition(() => eliminarChunk(id));
      }}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-caption text-rose hover:bg-rose-soft disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "…" : "Eliminar"}
    </button>
  );
}
