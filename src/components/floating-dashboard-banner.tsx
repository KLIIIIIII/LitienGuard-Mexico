"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

/**
 * Subtle floating chip on landing pages reminding logged-in users they
 * already have a session and can jump back to the dashboard. Hidden on
 * app-internal routes (/dashboard, /admin, /login, /auth).
 */
export function FloatingDashboardBanner({
  firstName,
}: {
  firstName: string;
}) {
  const pathname = usePathname();

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40">
      <Link
        href="/dashboard"
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-line bg-surface/95 px-4 py-2.5 text-body-sm text-ink-strong shadow-deep backdrop-blur-sm transition-all hover:shadow-lift"
      >
        <span className="hidden sm:inline">
          Hola {firstName} · Volver a tu panel
        </span>
        <span className="sm:hidden">Mi panel</span>
        <ArrowRight className="h-4 w-4 text-validation" strokeWidth={2} />
      </Link>
    </div>
  );
}
