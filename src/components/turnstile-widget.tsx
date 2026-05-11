"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        params: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string | null) => void;
  theme?: "light" | "dark" | "auto";
}

/**
 * Renders a Cloudflare Turnstile widget. Calls `onToken(token)` when solved,
 * `onToken(null)` on expire/error. Always shows; if the user never reaches
 * an interactive challenge (managed mode handles many cases silently),
 * the token comes back automatically.
 */
export function TurnstileWidget({
  siteKey,
  onToken,
  theme = "auto",
}: TurnstileWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    function tryRender() {
      if (!ref.current || !window.turnstile) return false;
      if (widgetIdRef.current) return true;
      try {
        widgetIdRef.current = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          theme,
          size: "flexible",
          callback: (token: string) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
        });
      } catch (e) {
        console.warn("[turnstile] render failed:", e);
      }
      return true;
    }
    if (!tryRender()) {
      // Wait for script. Poll a few times instead of fighting with onload race.
      const t = setInterval(() => {
        if (tryRender()) clearInterval(t);
      }, 200);
      return () => clearInterval(t);
    }
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onToken, theme]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={ref} className="flex w-full justify-center" />
    </>
  );
}
