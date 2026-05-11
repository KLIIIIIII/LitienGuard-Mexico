"use client";

import { useEffect, useState } from "react";
import { Download, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallButton() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    if (isStandalone) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (installed) {
    return (
      <button
        type="button"
        disabled
        className="lg-cta-primary cursor-default opacity-80"
      >
        <Check className="h-4 w-4" strokeWidth={2.2} />
        Ya instalada
      </button>
    );
  }

  if (!evt) {
    return (
      <a href="#guia-manual" className="lg-cta-ghost">
        <Download className="h-4 w-4" strokeWidth={2} />
        Cómo instalar a mano
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => {
        await evt.prompt();
        const c = await evt.userChoice;
        if (c.outcome === "accepted") setInstalled(true);
      }}
      className="lg-cta-primary"
    >
      <Download className="h-4 w-4" strokeWidth={2.2} />
      Instalar en este dispositivo
    </button>
  );
}
