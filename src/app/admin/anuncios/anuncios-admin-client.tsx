"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  Wrench,
  AlertTriangle,
  Lightbulb,
  Archive,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";
import {
  crearAnuncio,
  togglePublicar,
  archivarAnuncio,
  type CrearAnuncioInput,
} from "./actions";

type Tipo = "feature" | "cambio" | "alerta" | "tip";
type Audiencia = "todos" | "esencial" | "profesional" | "clinica" | "admin";

interface AdminAnuncio {
  id: string;
  titulo: string;
  contenido: string;
  tipo: Tipo;
  audiencia: Audiencia;
  link_url: string | null;
  link_label: string | null;
  publicado_at: string | null;
  archivado_at: string | null;
  created_at: string;
}

const TIPO_ICON: Record<Tipo, typeof Sparkles> = {
  feature: Sparkles,
  cambio: Wrench,
  alerta: AlertTriangle,
  tip: Lightbulb,
};

const TIPO_LABEL: Record<Tipo, string> = {
  feature: "Feature",
  cambio: "Cambio",
  alerta: "Alerta",
  tip: "Tip",
};

export function AnunciosAdminClient({ anuncios }: { anuncios: AdminAnuncio[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [tipo, setTipo] = useState<Tipo>("feature");
  const [audiencia, setAudiencia] = useState<Audiencia>("todos");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [publicarYa, setPublicarYa] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function resetForm() {
    setTitulo("");
    setContenido("");
    setTipo("feature");
    setAudiencia("todos");
    setLinkUrl("");
    setLinkLabel("");
    setPublicarYa(true);
    setError(null);
  }

  function onCrear() {
    setError(null);
    const input: CrearAnuncioInput = {
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      tipo,
      audiencia,
      link_url: linkUrl.trim() || undefined,
      link_label: linkLabel.trim() || undefined,
      publicar_ya: publicarYa,
    };
    startTransition(async () => {
      const r = await crearAnuncio(input);
      if (r.status === "ok") {
        resetForm();
        setFormOpen(false);
      } else {
        setError(r.message);
      }
    });
  }

  function onTogglePub(id: string, publicar: boolean) {
    startTransition(async () => {
      await togglePublicar(id, publicar);
    });
  }

  function onArchivar(id: string) {
    if (!confirm("¿Archivar este anuncio? Ya no se mostrará a los médicos.")) {
      return;
    }
    startTransition(async () => {
      await archivarAnuncio(id);
    });
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <section className="lg-card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
            Crear nuevo anuncio
          </h2>
          <button
            type="button"
            onClick={() => setFormOpen((v) => !v)}
            className="lg-cta-ghost"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            {formOpen ? "Cerrar" : "Nuevo"}
          </button>
        </div>

        {formOpen && (
          <div className="space-y-3 border-t border-line pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                  Tipo
                </span>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as Tipo)}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-body-sm"
                >
                  <option value="feature">Feature (verde)</option>
                  <option value="cambio">Cambio (amarillo)</option>
                  <option value="alerta">Alerta (rojo)</option>
                  <option value="tip">Tip (gris)</option>
                </select>
              </label>
              <label className="block">
                <span className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                  Audiencia
                </span>
                <select
                  value={audiencia}
                  onChange={(e) => setAudiencia(e.target.value as Audiencia)}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1.5 text-body-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="esencial">Solo Esencial</option>
                  <option value="profesional">Solo Profesional</option>
                  <option value="clinica">Solo Clínica</option>
                  <option value="admin">Solo Admins</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Título
              </span>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={120}
                placeholder="Ej. Nueva pestaña Patrones disponible"
                className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-body-sm"
              />
            </label>
            <label className="block">
              <span className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                Contenido
              </span>
              <textarea
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Explica brevemente la novedad y por qué le importa al médico..."
                className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-body-sm resize-y"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                  Link URL (opcional)
                </span>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="/dashboard/diferencial/patrones"
                  className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-body-sm"
                />
              </label>
              <label className="block">
                <span className="text-caption uppercase tracking-eyebrow text-ink-soft font-semibold">
                  Texto del link
                </span>
                <input
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  maxLength={50}
                  placeholder="Probarlo →"
                  className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-body-sm"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-body-sm text-ink-strong">
              <input
                type="checkbox"
                checked={publicarYa}
                onChange={(e) => setPublicarYa(e.target.checked)}
                className="h-4 w-4"
              />
              Publicar inmediatamente
            </label>

            {error && (
              <p className="text-caption text-rose">{error}</p>
            )}

            <div className="flex justify-end gap-2 border-t border-line pt-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setFormOpen(false);
                }}
                disabled={pending}
                className="lg-cta-ghost"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onCrear}
                disabled={
                  pending || titulo.trim().length < 3 || contenido.trim().length < 10
                }
                className="lg-cta-primary disabled:opacity-50"
              >
                {pending ? "Creando…" : "Crear anuncio"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Lista */}
      <section>
        <h2 className="mb-3 text-h3 font-semibold tracking-tight text-ink-strong">
          Anuncios existentes ({anuncios.length})
        </h2>
        {anuncios.length === 0 ? (
          <p className="text-body-sm text-ink-muted">
            Aún no hay anuncios creados.
          </p>
        ) : (
          <div className="space-y-2">
            {anuncios.map((a) => {
              const Icon = TIPO_ICON[a.tipo];
              const isPublished =
                a.publicado_at !== null && a.archivado_at === null;
              const isArchived = a.archivado_at !== null;
              return (
                <div
                  key={a.id}
                  className={`rounded-lg border p-4 ${
                    isArchived
                      ? "border-line bg-surface-alt/40 opacity-60"
                      : isPublished
                        ? "border-validation bg-validation-soft/30"
                        : "border-line bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted"
                        strokeWidth={2}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-body-sm font-semibold text-ink-strong">
                            {a.titulo}
                          </h3>
                          <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-muted">
                            {TIPO_LABEL[a.tipo]}
                          </span>
                          <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-muted">
                            {a.audiencia}
                          </span>
                          {isPublished && (
                            <span className="rounded-full bg-validation px-2 py-0.5 text-[0.6rem] uppercase tracking-eyebrow font-bold text-canvas">
                              Publicado
                            </span>
                          )}
                          {isArchived && (
                            <span className="rounded-full bg-ink-quiet px-2 py-0.5 text-[0.6rem] uppercase tracking-eyebrow font-bold text-canvas">
                              Archivado
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-caption text-ink-muted whitespace-pre-wrap leading-relaxed">
                          {a.contenido}
                        </p>
                        <p className="mt-2 text-caption text-ink-soft">
                          Creado{" "}
                          {new Date(a.created_at).toLocaleDateString("es-MX")}
                          {a.publicado_at &&
                            ` · publicado ${new Date(a.publicado_at).toLocaleDateString("es-MX")}`}
                        </p>
                      </div>
                    </div>

                    {!isArchived && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => onTogglePub(a.id, !isPublished)}
                          disabled={pending}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface text-ink-muted hover:text-ink-strong"
                          title={isPublished ? "Despublicar" : "Publicar"}
                        >
                          {isPublished ? (
                            <EyeOff className="h-3.5 w-3.5" strokeWidth={2.2} />
                          ) : (
                            <Eye className="h-3.5 w-3.5" strokeWidth={2.2} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onArchivar(a.id)}
                          disabled={pending}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface text-rose hover:bg-rose-soft"
                          title="Archivar"
                        >
                          <Archive className="h-3.5 w-3.5" strokeWidth={2.2} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
