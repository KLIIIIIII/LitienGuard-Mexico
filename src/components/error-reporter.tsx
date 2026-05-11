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

    function onError(e: ErrorEvent) {
      if (!e.message) return;
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
