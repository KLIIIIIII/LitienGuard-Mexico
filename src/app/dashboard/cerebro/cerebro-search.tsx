"use client";

import { useState, useTransition } from "react";
import { Search, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { buscarCerebro, type CerebroSearchResult } from "./actions";

type Hit = Extract<CerebroSearchResult, { status: "ok" }>["hits"][number];

const EXAMPLES = [
  "iSGLT2 en DM2 con enfermedad renal",
  "objetivo de TA en hipertensión",
  "sepsis hora dorada",
  "consentimiento informado expediente",
  "tratamiento paso 1 asma",
];

export function CerebroSearch() {
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [state, setState] = useState<CerebroSearchResult | null>(null);
  const [activeHit, setActiveHit] = useState<Hit | null>(null);

  function doSearch(query: string) {
    setQ(query);
    setActiveHit(null);
    startTransition(async () => {
      const result = await buscarCerebro({ q: query });
      setState(result);
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (q.trim().length >= 2) doSearch(q.trim());
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="lg-card flex flex-col gap-3">
        <label
          htmlFor="cerebro-q"
          className="text-caption font-medium text-ink-strong"
        >
          ¿Qué quieres consultar?
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-quiet"
              strokeWidth={2}
            />
            <input
              id="cerebro-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ej. ISGLT2 en DM2, sepsis, objetivos TA…"
              className="lg-input pl-9"
              autoComplete="off"
              disabled={pending}
              suppressHydrationWarning
            />
          </div>
          <button
            type="submit"
            disabled={pending || q.trim().length < 2}
            className="lg-cta-primary justify-center disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-caption text-ink-soft">Ejemplos:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => doSearch(ex)}
              disabled={pending}
              className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-caption text-ink-muted transition-colors hover:border-line-strong hover:text-ink-strong"
            >
              {ex}
            </button>
          ))}
        </div>
      </form>

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
        <>
          <p className="text-caption text-ink-muted">
            {state.hits.length} {state.hits.length === 1 ? "resultado" : "resultados"} ·{" "}
            {state.tookMs} ms
          </p>

          {state.hits.length === 0 ? (
            <div className="rounded-lg border border-line bg-surface px-5 py-6 text-center text-body-sm text-ink-muted">
              No encontramos coincidencias en el corpus actual. Prueba con otras
              palabras clave.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
              <ul className="space-y-3">
                {state.hits.map((hit) => (
                  <li key={hit.id}>
                    <button
                      type="button"
                      onClick={() => setActiveHit(hit)}
                      className={`w-full rounded-xl border bg-surface px-4 py-3 text-left transition-all hover:shadow-soft ${
                        activeHit?.id === hit.id
                          ? "border-validation shadow-soft"
                          : "border-line hover:border-line-strong"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-validation" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-body-sm font-semibold text-ink-strong">
                            {hit.title}
                          </h3>
                          <p className="mt-0.5 text-caption text-ink-muted">
                            {hit.source} · pág. {hit.page}
                          </p>
                          <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
                            {hit.snippet}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              <aside className="lg:sticky lg:top-[88px] lg:self-start">
                {activeHit ? (
                  <div className="lg-card space-y-4">
                    <div>
                      <p className="lg-eyebrow-validation">Cita verbatim</p>
                      <h3 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
                        {activeHit.title}
                      </h3>
                      <p className="mt-1 text-caption text-ink-muted">
                        {activeHit.source} · pág. {activeHit.page}
                        {activeHit.meta?.["especialidad"]
                          ? ` · ${activeHit.meta["especialidad"]}`
                          : ""}
                      </p>
                    </div>
                    <blockquote className="border-l-2 border-validation pl-4 text-body leading-relaxed text-ink-strong">
                      {activeHit.snippet.replace(/^…|…$/g, "")}
                    </blockquote>
                    <p className="text-caption text-ink-soft">
                      Cita exactamente como aparece en la fuente. Verifica
                      contexto completo en el documento original antes de usar
                      en consulta.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-line bg-surface px-5 py-8 text-center text-body-sm text-ink-soft">
                    Selecciona un resultado para ver la cita completa con su
                    fuente.
                  </div>
                )}
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}
