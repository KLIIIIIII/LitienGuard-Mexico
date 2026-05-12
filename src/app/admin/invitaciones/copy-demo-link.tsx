"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copia un link de demo personalizado al portapapeles:
 *   {siteUrl}/login?email={email}
 *
 * Carlos pega ese link en WhatsApp/correo y el médico entra
 * con su correo ya prellenado al formulario de magic link.
 */
export function CopyDemoLink({
  email,
  siteUrl,
}: {
  email: string;
  siteUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const link = `${siteUrl}/login?email=${encodeURIComponent(email)}`;

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback for older browsers: open in new tab so user can copy.
      window.prompt("Copia este link:", link);
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium transition-colors ${
        copied
          ? "bg-validation-soft text-validation"
          : "border border-line bg-surface text-ink-strong hover:border-line-strong hover:bg-surface-alt"
      }`}
      title={link}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3" strokeWidth={2.4} />
          Copiado
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" strokeWidth={2.2} />
          Copiar link
        </>
      )}
    </button>
  );
}
