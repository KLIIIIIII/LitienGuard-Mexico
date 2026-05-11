"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, AlertCircle, Check } from "lucide-react";
import { importarChunks } from "../actions";

type State =
  | { kind: "idle" }
  | { kind: "ok"; inserted: number }
  | { kind: "error"; message: string };

export function ImportForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [json, setJson] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!json.trim()) return;
    setState({ kind: "idle" });
    startTransition(async () => {
      const result = await importarChunks(json);
      if (result.status === "ok") {
        setState({ kind: "ok", inserted: result.inserted });
        setJson("");
        router.refresh();
      } else {
        setState({ kind: "error", message: result.message });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="lg-card space-y-4">
      <label
        htmlFor="json"
        className="block text-caption font-medium text-ink-strong"
      >
        JSON de chunks
      </label>
      <textarea
        id="json"
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={18}
        placeholder='{"chunks": [{...}, {...}]}'
        className="lg-input resize-y font-mono text-body-sm"
        disabled={pending}
        suppressHydrationWarning
      />

      {state.kind === "error" && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-rose-soft bg-rose-soft px-4 py-3 text-body-sm text-ink-strong"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 text-rose" />
          <span>{state.message}</span>
        </div>
      )}
      {state.kind === "ok" && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-validation-soft bg-validation-soft px-4 py-3 text-body-sm text-ink-strong"
        >
          <Check className="mt-0.5 h-4 w-4 text-validation" />
          <span>
            {state.inserted} chunk{state.inserted === 1 ? "" : "s"}{" "}
            importado{state.inserted === 1 ? "" : "s"}.
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !json.trim()}
          className="lg-cta-primary disabled:opacity-60"
        >
          <Upload className="h-4 w-4" />
          {pending ? "Importando…" : "Importar"}
        </button>
      </div>
    </form>
  );
}
