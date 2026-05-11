"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * Cleans up Supabase auth error params (?error=access_denied&error_code=otp_expired&...)
 * that get stuck in the URL when an expired magic link is clicked while a valid session
 * is already active. If no session is active, sends the user to /login with a clear message.
 */
export function AuthErrorHandler({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const queryHasError =
      params.has("error") || params.has("error_code");
    const hashHasError =
      typeof window !== "undefined" &&
      (window.location.hash.includes("error=") ||
        window.location.hash.includes("error_code="));

    if (!queryHasError && !hashHasError) return;

    if (isLoggedIn) {
      // Already authenticated — silently strip the noisy params.
      window.history.replaceState(null, "", pathname);
    } else {
      // No session — explain the expired-link case at /login.
      router.replace("/login?reason=link_expired");
    }
  }, [isLoggedIn, params, pathname, router]);

  return null;
}
