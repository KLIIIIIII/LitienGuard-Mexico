"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle, Mail, Linkedin } from "lucide-react";

export function ReferralCard({ code }: { code: string }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const link = `${typeof window !== "undefined" ? window.location.origin : "https://litienguard.mx"}/?ref=${code}`;

  const message = `Hola, te comparto LitienGuard — la herramienta clínica que estoy usando en mi consulta. Scribe ambient en español + cerebro con citas verbatim a IMSS y guías + diferencial diagnóstico. Si te animas a probar, usa mi código ${code} y tienes 50% off los primeros 3 meses: ${link}`;

  function copyText(text: string, which: "code" | "link") {
    void navigator.clipboard.writeText(text);
    if (which === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const liUrl = `https://www.linkedin.com/messaging/?body=${encodeURIComponent(message)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent("Te comparto LitienGuard")}&body=${encodeURIComponent(message)}`;

  return (
    <section className="rounded-2xl border-2 border-validation bg-validation-soft/30 p-5 sm:p-6">
      <p className="text-caption uppercase tracking-eyebrow text-validation font-semibold">
        Tu código de referido
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <code className="font-mono text-h1 font-bold tabular-nums text-ink-strong bg-surface px-4 py-2 rounded-lg border border-validation-soft tracking-wider">
          {code}
        </code>
        <button
          type="button"
          onClick={() => copyText(code, "code")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-caption font-semibold text-ink-strong hover:bg-surface-alt transition-colors"
        >
          {copiedCode ? (
            <>
              <Check className="h-3.5 w-3.5 text-validation" strokeWidth={2.4} />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" strokeWidth={2.2} />
              Copiar
            </>
          )}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
          Tu enlace para compartir
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
          <code className="flex-1 min-w-0 truncate text-caption text-ink-muted font-mono">
            {link}
          </code>
          <button
            type="button"
            onClick={() => copyText(link, "link")}
            className="shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-caption font-semibold text-validation hover:bg-validation-soft transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="h-3 w-3" strokeWidth={2.4} />
                Listo
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" strokeWidth={2.2} />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-caption font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <MessageCircle className="h-3.5 w-3.5" strokeWidth={2.2} />
          Compartir por WhatsApp
        </a>
        <a
          href={liUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A66C2] px-3 py-2 text-caption font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <Linkedin className="h-3.5 w-3.5" strokeWidth={2.2} />
          LinkedIn
        </a>
        <a
          href={mailUrl}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-caption font-semibold text-ink-strong hover:bg-surface-alt transition-colors"
        >
          <Mail className="h-3.5 w-3.5" strokeWidth={2.2} />
          Email
        </a>
      </div>
    </section>
  );
}
