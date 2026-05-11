"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "lg-pwa-banner-dismissed";

export function PWAInstallBanner() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    // If already running standalone (installed), never show
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as Navigator & { standalone?: boolean })
        .standalone === true;
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!evt) return;
    await evt.prompt();
    const choice = await evt.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible || !evt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-line bg-surface px-4 py-3 shadow-deep sm:bottom-6 sm:left-auto sm:right-6 sm:w-[360px]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-validation-soft text-validation">
          <Smartphone className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-semibold text-ink-strong">
            Instala LitienGuard
          </p>
          <p className="mt-0.5 text-caption text-ink-muted">
            Pantalla de inicio, abre rápido, funciona sin barra del navegador.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={install}
              className="inline-flex items-center gap-1.5 rounded-lg bg-validation px-3 py-1.5 text-caption font-semibold text-surface hover:bg-validation/90"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
              Instalar
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="text-caption text-ink-muted hover:text-ink-strong"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="-mr-1 -mt-1 rounded-md p-1 text-ink-quiet hover:bg-surface-alt hover:text-ink-muted"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
