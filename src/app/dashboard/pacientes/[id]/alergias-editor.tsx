"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { updateAlergias } from "./alergias-actions";

const SUGGESTIONS = [
  "Penicilina",
  "Sulfamidas",
  "AINEs",
  "Aspirina",
  "Yodo / contraste",
  "Macrólidos",
  "Quinolonas",
  "Látex",
];

export function AlergiasEditor({
  pacienteId,
  initial,
}: {
  pacienteId: string;
  initial: string[];
}) {
  const [items, setItems] = useState<string[]>(initial);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function commit(next: string[]) {
    setItems(next);
    setError(null);
    startTransition(async () => {
      const r = await updateAlergias({ pacienteId, alergias: next });
      if (r.status === "ok") {
        setSavedAt(Date.now());
      } else {
        setError(r.message);
      }
    });
  }

  function add(label: string) {
    const clean = label.trim();
    if (clean.length === 0 || clean.length > 80) return;
    if (items.some((a) => a.toLowerCase() === clean.toLowerCase())) return;
    commit([...items, clean]);
    setInput("");
  }

  function remove(label: string) {
    commit(items.filter((a) => a !== label));
  }

  const remainingSuggestions = SUGGESTIONS.filter(
    (s) => !items.some((a) => a.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="rounded-lg border border-warn-soft bg-warn-soft/30 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle
          className="h-4 w-4 text-warn"
          strokeWidth={2.2}
          aria-hidden="true"
        />
        <p className="text-caption uppercase tracking-eyebrow text-warn font-semibold">
          Alergias documentadas
        </p>
        {pending && (
          <Loader2
            className="h-3 w-3 text-ink-muted animate-spin ml-1"
            strokeWidth={2.4}
            aria-hidden="true"
          />
        )}
        {savedAt && !pending && (
          <span
            className="inline-flex items-center gap-1 text-caption text-validation"
            aria-live="polite"
          >
            <CheckCircle2 className="h-3 w-3" strokeWidth={2.4} />
            Guardado
          </span>
        )}
      </div>
      <p className="mt-1 text-caption text-ink-muted">
        Usado por el cross-check sintáctico en recetas (allergy hard-stop) y por
        el patient header en módulos clínicos.
      </p>

      {/* Chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <p className="text-caption text-ink-quiet italic">
            Sin alergias documentadas.
          </p>
        ) : (
          items.map((a) => (
            <motion.span
              key={a}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="inline-flex items-center gap-1 rounded-full bg-warn px-2.5 py-1 text-caption font-semibold text-canvas"
            >
              {a}
              <button
                type="button"
                onClick={() => remove(a)}
                disabled={pending}
                className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-warn-soft hover:text-warn"
                aria-label={`Quitar ${a}`}
              >
                <X className="h-2.5 w-2.5" strokeWidth={2.6} />
              </button>
            </motion.span>
          ))
        )}
      </div>

      {/* Add input */}
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 80))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(input);
            }
          }}
          placeholder="Agregar alergia (Enter)"
          className="lg-input flex-1 text-caption"
          disabled={pending || items.length >= 30}
        />
        <button
          type="button"
          onClick={() => add(input)}
          disabled={pending || input.trim().length === 0 || items.length >= 30}
          className="lg-cta-ghost inline-flex items-center gap-1 text-caption disabled:opacity-50"
        >
          <Plus className="h-3 w-3" strokeWidth={2.4} />
          Agregar
        </button>
      </div>

      {/* Suggestions */}
      {remainingSuggestions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          <span className="text-caption text-ink-soft">Sugeridas:</span>
          {remainingSuggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              disabled={pending}
              className="rounded-full border border-line bg-surface px-2 py-0.5 text-caption text-ink-muted hover:border-warn hover:text-warn disabled:opacity-50"
            >
              + {s}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 text-caption text-rose"
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
