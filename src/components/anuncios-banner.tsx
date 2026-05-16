"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  Wrench,
  AlertTriangle,
  Lightbulb,
  X,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { dismissAnuncio, markAnuncioVisto } from "./anuncios-actions";

const easeOut: number[] = [0.16, 1, 0.3, 1];

export type AnuncioTipo = "feature" | "cambio" | "alerta" | "tip";

export interface AnuncioItem {
  id: string;
  titulo: string;
  contenido: string;
  tipo: AnuncioTipo;
  link_url: string | null;
  link_label: string | null;
  publicado_at: string | null;
}

interface Props {
  anuncios: AnuncioItem[];
}

const TIPO_CONFIG: Record<
  AnuncioTipo,
  {
    icon: typeof Sparkles;
    label: string;
    bg: string;
    border: string;
    text: string;
    iconBg: string;
  }
> = {
  feature: {
    icon: Sparkles,
    label: "Nuevo",
    bg: "bg-validation-soft/40",
    border: "border-validation",
    text: "text-validation",
    iconBg: "bg-validation text-canvas",
  },
  cambio: {
    icon: Wrench,
    label: "Cambio",
    bg: "bg-warn-soft/40",
    border: "border-warn",
    text: "text-warn",
    iconBg: "bg-warn text-canvas",
  },
  alerta: {
    icon: AlertTriangle,
    label: "Aviso",
    bg: "bg-rose-soft/40",
    border: "border-rose",
    text: "text-rose",
    iconBg: "bg-rose text-canvas",
  },
  tip: {
    icon: Lightbulb,
    label: "Tip",
    bg: "bg-surface-alt",
    border: "border-line",
    text: "text-ink-strong",
    iconBg: "bg-ink-strong text-canvas",
  },
};

export function AnunciosBanner({ anuncios }: Props) {
  const [visibles, setVisibles] = useState(anuncios);
  const [pending, startTransition] = useTransition();

  function handleDismiss(id: string) {
    setVisibles((prev) => prev.filter((a) => a.id !== id));
    startTransition(async () => {
      await dismissAnuncio(id);
    });
  }

  function handleClick(id: string) {
    startTransition(async () => {
      await markAnuncioVisto(id);
    });
  }

  if (visibles.length === 0) return null;

  return (
    <section className="space-y-2">
      <AnimatePresence initial={false}>
        {visibles.map((a) => {
          const cfg = TIPO_CONFIG[a.tipo];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.35, ease: easeOut }}
              className={`relative rounded-xl border-2 ${cfg.border} ${cfg.bg} p-4 sm:p-5`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.iconBg}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-eyebrow font-bold ${cfg.text}`}
                      style={{ background: "rgba(255,255,255,0.5)" }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <h3 className="mt-1 text-body font-semibold text-ink-strong leading-snug">
                    {a.titulo}
                  </h3>
                  <p className="mt-1 text-caption text-ink-muted leading-relaxed whitespace-pre-wrap">
                    {a.contenido}
                  </p>
                  {a.link_url && (
                    <Link
                      href={a.link_url}
                      onClick={() => handleClick(a.id)}
                      className={`mt-3 inline-flex items-center gap-1 text-caption font-semibold ${cfg.text} hover:underline`}
                    >
                      {a.link_label ?? "Ver más"}
                      <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
                    </Link>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDismiss(a.id)}
                  disabled={pending}
                  className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-canvas hover:text-ink-strong disabled:opacity-50"
                  aria-label="Descartar"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </section>
  );
}
