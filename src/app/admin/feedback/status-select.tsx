"use client";

import { useTransition } from "react";
import { actualizarFeedback } from "./actions";

type Status = "nuevo" | "en_revision" | "resuelto" | "descartado";

export function StatusSelect({
  id,
  current,
}: {
  id: string;
  current: Status;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as Status;
        startTransition(() => actualizarFeedback(id, { status: next }));
      }}
      className="rounded-md border border-line bg-surface px-2 py-1 text-caption text-ink-strong"
    >
      <option value="nuevo">Nuevo</option>
      <option value="en_revision">En revisión</option>
      <option value="resuelto">Resuelto</option>
      <option value="descartado">Descartado</option>
    </select>
  );
}
