"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Save } from "lucide-react";
import {
  actualizarChunk,
  crearChunk,
  type ChunkActionResult,
} from "./actions";

export interface ChunkInitial {
  id: string;
  source: string;
  page: string;
  title: string;
  content: string;
  meta_json: string;
  is_active: boolean;
}

export function ChunkForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: ChunkInitial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ChunkActionResult | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState(null);
    startTransition(async () => {
      const result =
        mode === "create" ? await crearChunk(fd) : await actualizarChunk(fd);
      setState(result);
      if (result.status === "ok" && mode === "create") {
        router.push(`/admin/cerebro/${result.id}`);
        router.refresh();
      } else if (result.status === "ok") {
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="lg-card space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-2">
            <label
              htmlFor="id"
              className="block text-caption font-medium text-ink-strong"
            >
              ID del chunk
            </label>
            <input
              id="id"
              name="id"
              type="text"
              required
              defaultValue={initial.id}
              readOnly={mode === "edit"}
              placeholder="ada-2024-hba1c-metas"
              className="lg-input"
              suppressHydrationWarning
            />
            <p className="text-caption text-ink-soft">
              Slug único, solo minúsculas, números y guiones. No se puede
              cambiar después.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-caption font-medium text-ink-strong">
              Estado
            </label>
            <label className="flex h-[42px] items-center gap-2 rounded-lg border border-line bg-surface px-3">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={initial.is_active}
                className="h-4 w-4 rounded border-line-strong"
              />
              <span className="text-body-sm text-ink-strong">Activo</span>
            </label>
            <p className="text-caption text-ink-soft">
              Si lo desactivas, no aparece en búsquedas ni RAG.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor="source"
              className="block text-caption font-medium text-ink-strong"
            >
              Fuente
            </label>
            <input
              id="source"
              name="source"
              type="text"
              required
              defaultValue={initial.source}
              placeholder="GPC IMSS SS-718-15"
              className="lg-input"
              suppressHydrationWarning
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="page"
              className="block text-caption font-medium text-ink-strong"
            >
              Página / sección
            </label>
            <input
              id="page"
              name="page"
              type="text"
              required
              defaultValue={initial.page}
              placeholder="24"
              className="lg-input"
              suppressHydrationWarning
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="title"
            className="block text-caption font-medium text-ink-strong"
          >
            Título del chunk
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={initial.title}
            placeholder="iSGLT2 en DM2 con enfermedad renal crónica"
            className="lg-input"
            suppressHydrationWarning
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="content"
            className="block text-caption font-medium text-ink-strong"
          >
            Contenido (paráfrasis clínica · 20-4000 caracteres)
          </label>
          <textarea
            id="content"
            name="content"
            required
            defaultValue={initial.content}
            rows={10}
            className="lg-input resize-y font-mono text-body-sm leading-relaxed"
            placeholder="En pacientes con DM2 y ERC con TFG ≥25 se recomienda agregar un inhibidor de SGLT2 (empagliflozina o dapagliflozina)…"
            suppressHydrationWarning
          />
          <p className="text-caption text-ink-soft">
            Parafrasea de la fuente oficial. NO copies texto literal con
            derechos de autor activos. Sé clínicamente preciso.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="meta_json"
            className="block text-caption font-medium text-ink-strong"
          >
            Meta (JSON)
          </label>
          <textarea
            id="meta_json"
            name="meta_json"
            defaultValue={initial.meta_json}
            rows={3}
            className="lg-input resize-y font-mono text-body-sm"
            placeholder='{"especialidad": "endocrinología", "año": "2024"}'
            suppressHydrationWarning
          />
          <p className="text-caption text-ink-soft">
            Objeto JSON con campos como <code>especialidad</code>,{" "}
            <code>año</code>, <code>categoría</code>.
          </p>
        </div>
      </section>

      {state?.status === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-rose-soft bg-rose-soft px-4 py-3 text-body-sm text-ink-strong"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 text-rose" />
          <span>{state.message}</span>
        </div>
      )}
      {state?.status === "ok" && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-validation-soft bg-validation-soft px-4 py-3 text-body-sm text-ink-strong"
        >
          <Check className="mt-0.5 h-4 w-4 text-validation" />
          <span>
            {mode === "create" ? "Chunk creado." : "Chunk actualizado."}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="lg-cta-primary disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {pending
            ? "Guardando…"
            : mode === "create"
              ? "Crear chunk"
              : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
