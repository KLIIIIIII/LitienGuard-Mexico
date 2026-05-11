"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { signOut } from "@/app/login/actions";

type Role = "medico" | "admin" | null;

export function UserChipClient({
  initials,
  displayName,
  email,
  role,
}: {
  initials: string;
  displayName: string;
  email: string;
  role: Role;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  function onSignOut() {
    setOpen(false);
    startTransition(() => {
      void signOut();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-surface px-2 py-1 text-body-sm text-ink-strong shadow-soft transition-all hover:border-line-strong hover:shadow-lift"
      >
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full bg-validation text-caption font-semibold text-surface"
        >
          {initials}
        </span>
        <span className="hidden text-body-sm font-medium md:inline">
          {displayName}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 origin-top-right overflow-hidden rounded-xl border border-line bg-surface shadow-deep"
        >
          <div className="border-b border-line-soft bg-surface-alt px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-10 w-10 items-center justify-center rounded-full bg-validation text-body-sm font-semibold text-surface"
              >
                {initials}
              </span>
              <div className="min-w-0">
                <div className="truncate text-body-sm font-semibold text-ink-strong">
                  {displayName}
                </div>
                <div className="truncate text-caption text-ink-muted">
                  {email}
                </div>
              </div>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface px-2 py-0.5 text-caption text-ink-muted">
              {role === "admin" ? (
                <>
                  <ShieldCheck
                    className="h-3 w-3 text-accent"
                    strokeWidth={2.2}
                  />
                  <span>Administrador</span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-validation" />
                  <span>Médico · Plan piloto</span>
                </>
              )}
            </div>
          </div>

          <nav className="py-1.5 text-body-sm">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-ink-strong hover:bg-surface-alt"
              role="menuitem"
            >
              <LayoutDashboard className="h-4 w-4 text-ink-muted" />
              Ir al dashboard
            </Link>
            {role === "admin" && (
              <>
                <Link
                  href="/admin/invitaciones"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-ink-strong hover:bg-surface-alt"
                  role="menuitem"
                >
                  <ShieldCheck className="h-4 w-4 text-ink-muted" />
                  Gestionar invitaciones
                </Link>
                <Link
                  href="/admin/cerebro"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-ink-strong hover:bg-surface-alt"
                  role="menuitem"
                >
                  <BookOpen className="h-4 w-4 text-ink-muted" />
                  Curar cerebro
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={onSignOut}
              disabled={pending}
              className="flex w-full items-center gap-2 border-t border-line-soft px-4 py-2 text-left text-ink-muted hover:bg-rose-soft hover:text-rose disabled:opacity-50"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              {pending ? "Cerrando…" : "Cerrar sesión"}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
