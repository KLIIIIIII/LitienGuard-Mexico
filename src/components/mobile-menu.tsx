"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, ShieldCheck } from "lucide-react";

interface MobileMenuProps {
  isAdmin: boolean;
  isLoggedIn: boolean;
}

const PRIMARY_GROUPS = [
  {
    title: "Soluciones",
    links: [
      { href: "/medicos", label: "Para médicos" },
      { href: "/dentistas", label: "Para dentistas" },
      { href: "/hospitales", label: "Para hospitales" },
      { href: "/pacientes", label: "Para pacientes" },
      { href: "/app", label: "Próximamente" },
    ],
  },
  {
    title: "Compañía",
    links: [
      { href: "/precios", label: "Precios" },
      { href: "/contacto", label: "Contacto" },
      { href: "/gobernanza", label: "Gobernanza" },
    ],
  },
];

export function MobileMenu({ isAdmin, isLoggedIn }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Portal solo en cliente — evita hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Cerrar con tecla Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /*
   * Drawer renderizado vía Portal a document.body. iOS Safari tiene un
   * bug donde `position: fixed` dentro de un ancestor con backdrop-filter
   * queda atrapado en el stacking context del ancestor (el <header> tiene
   * backdrop-blur-sm). Sacar el drawer al body via Portal lo libera.
   */
  const drawer = (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-[70] w-[88%] max-w-sm transform overflow-y-auto bg-canvas shadow-deep transition-transform duration-300 ease-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="text-eyebrow font-semibold uppercase tracking-eyebrow text-ink-soft">
            Menú
          </p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-strong"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        <nav className="space-y-7 px-5 py-6">
          {PRIMARY_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-caption font-semibold uppercase tracking-eyebrow text-ink-soft">
                {group.title}
              </p>
              <ul className="mt-3 space-y-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-body font-medium text-ink-strong transition-colors hover:bg-surface-alt"
                    >
                      <span>{link.label}</span>
                      <ChevronRight
                        className="h-4 w-4 text-ink-quiet"
                        strokeWidth={2}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {isLoggedIn && (
            <div>
              <p className="text-caption font-semibold uppercase tracking-eyebrow text-ink-soft">
                Tu cuenta
              </p>
              <ul className="mt-3 space-y-1">
                <li>
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-body font-medium text-ink-strong hover:bg-surface-alt"
                  >
                    <span>Ir al panel</span>
                    <ChevronRight className="h-4 w-4 text-ink-quiet" />
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link
                      href="/admin/cerebro"
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-body font-medium text-warn hover:bg-warn-soft"
                    >
                      <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
                      Admin
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}
        </nav>

        <div className="space-y-3 border-t border-line px-5 py-6">
          {isLoggedIn ? null : (
            <Link
              href="/login"
              className="lg-cta-ghost w-full justify-center"
            >
              Entrar
            </Link>
          )}
          <Link
            href="/contacto#piloto"
            className="lg-cta-primary w-full justify-center"
          >
            Solicitar acceso piloto
          </Link>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink-strong transition-colors hover:bg-surface-alt"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </button>

      {mounted && createPortal(drawer, document.body)}
    </>
  );
}
