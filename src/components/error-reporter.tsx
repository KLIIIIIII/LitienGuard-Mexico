"use client";

import { useEffect } from "react";

/**
 * Captures uncaught JS errors and unhandled promise rejections and ships
 * them to /api/errors. Best-effort — we never block UX waiting for the
 * POST and tolerate failures silently (the user-facing FeedbackFab is the
 * authoritative channel for reproducible issues).
 */
export function ErrorReporter() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sessionId = (() => {
      try {
        let s = sessionStorage.getItem("lg-session-id");
        if (!s) {
          s = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
          sessionStorage.setItem("lg-session-id", s);
        }
        return s;
      } catch {
        return null;
      }
    })();

    async function ship(payload: Record<string, unknown>) {
      try {
        await fetch("/api/errors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            url: window.location.href,
            user_agent: navigator.userAgent,
            session_id: sessionId,
          }),
          keepalive: true,
        });
      } catch {
        // swallow
      }
    }

    // Mensajes de error que NO son problemas reales — son comportamiento
    // interno de Next.js (redirects en server actions, navegación AbortError)
    // o errores cosméticos del browser. Filtrar para no ensuciar el log.
    function isInternalNoise(msg: string): boolean {
      if (!msg) return true;
      const patterns = [
        /^NEXT_REDIRECT/i,
        /^NEXT_NOT_FOUND/i,
        /AbortError/i,
        /ResizeObserver loop/i,
        /Non-Error promise rejection captured with value/i,
        /Loading chunk \d+ failed/i, // chunk reload — usuario refresca y se arregla
        /Hydration failed because/i, // hydration warnings, no rompen UX
        /Error in input stream/i, // Firefox 150 bug interno (no es nuestro)
        /Script error\.?$/i, // cross-origin script errors sin info útil
      ];
      return patterns.some((p) => p.test(msg));
    }

    function onError(e: ErrorEvent) {
      if (!e.message) return;
      if (isInternalNoise(e.message)) return;
      void ship({
        message: e.message,
        stack: e.error instanceof Error ? e.error.stack : undefined,
        metadata: {
          source: e.filename,
          lineno: e.lineno,
          colno: e.colno,
        },
      });
    }

    function onRejection(e: PromiseRejectionEvent) {
      const reason = e.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";
      if (isInternalNoise(message)) return;
      void ship({
        message,
        stack: reason instanceof Error ? reason.stack : undefined,
        metadata: { kind: "unhandledrejection" },
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
