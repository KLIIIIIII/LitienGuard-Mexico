"use client";

import { useEffect } from "react";
import { captureReferralCode } from "@/app/dashboard/referidos/actions";

/**
 * Mounted once in the root layout. Watches for `?ref=CODE` query param
 * on any landing page, stores it in a server-side cookie (60 days),
 * then strips it from the URL for cleanliness. The captured code is
 * applied to the user's profile when they complete signup.
 */
export function ReferralCapture() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref");
    if (!ref) return;

    void (async () => {
      try {
        await captureReferralCode(ref);
        url.searchParams.delete("ref");
        const cleaned =
          url.pathname +
          (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "") +
          url.hash;
        window.history.replaceState({}, "", cleaned);
      } catch {
        // Silently fail — referral capture is non-critical.
      }
    })();
  }, []);

  return null;
}
