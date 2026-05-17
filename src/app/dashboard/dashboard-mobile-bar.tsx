"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Mic,
  FileText,
  BookOpen,
  ShieldCheck,
  Lock,
  Settings,
  MessageCircle,
  Smile,
  Pill,
  Calendar,
  Sparkles,
  Users,
  Menu,
  X,
  ChevronRight,
  Siren,
  ClipboardCheck,
  HeartPulse,
  FlaskConical,
  ScanLine,
  Heart,
  Brain,
  Activity,
  Droplet,
  Network,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  TIER_LABELS,
  type SubscriptionTier,
} from "@/lib/entitlements";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  locked?: boolean;
  admin?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

function renderMobileItem(it: NavItem, pathname: string) {
  const active = it.match(pathname);
  const Icon = it.icon;
  return (
    <Link
      key={it.href}
      href={it.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-sm transition-colors ${
        active
          ? "bg-validation-soft text-validation"
          : "text-ink-strong hover:bg-surface-alt"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="flex-1">{it.label}</span>
      {it.locked && (
        <Lock className="h-3 w-3 text-ink-quiet" strokeWidth={2.2} />
      )}
      {it.admin && (
        <span className="rounded-full bg-warn-soft px-1.5 py-0.5 text-[0.65rem] text-warn">
          admin
        </span>
      )}
      {!it.locked && !it.admin && (
        <ChevronRight
          className="h-3.5 w-3.5 text-ink-quiet"
          strokeWidth={2}
        />
      )}
    </Link>
  );
}

/**
 * Mobile-only top bar + drawer para el dashboard. Reemplaza a la
 * sidebar vertical en pantallas < lg. El usuario ve siempre su plan
 * en el header y abre el menú con un tap. El drawer se renderiza
 * via createPortal a document.body para evitar conflictos con
 * stacking contexts (como el del TopBar con backdrop-blur).
 */
export function DashboardMobileBar({
  tier,
  isAdmin,
  canScribe,
  canCerebro,
  canRecetas,
  canAgenda,
  canPacientes,
  showOdontograma = true,
  showDiferencial = true,
  showAreasCriticas = true,
  showApoyoDiagnostico = true,
  showEspecialidadesMedicas = true,
}: {
  tier: SubscriptionTier;
  isAdmin: boolean;
  canScribe: boolean;
  canCerebro: boolean;
  canRecetas: boolean;
  canAgenda: boolean;
  canPacientes: boolean;
  showOdontograma?: boolean;
  showDiferencial?: boolean;
  showAreasCriticas?: boolean;
  showApoyoDiagnostico?: boolean;
  showEspecialidadesMedicas?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cerrar al cambiar de ruta
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquear scroll del body cuando el drawer está abierto
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

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Mi plan / Facturación / Seguridad / Exportar datos / Refiere y gana
  // están consolidados dentro de /dashboard/configuracion.
  const grupos: NavGroup[] = [
    {
      title: "",
      items: [
        {
          href: "/dashboard",
          label: "Inicio",
          icon: LayoutDashboard,
          match: (p) => p === "/dashboard",
        },
      ],
    },
    {
      title: "Consulta",
      items: [
        {
          href: "/dashboard/scribe",
          label: "Scribe",
          icon: Mic,
          match: (p) => p.startsWith("/dashboard/scribe"),
          locked: !canScribe,
        },
        {
          href: "/dashboard/notas",
          label: "Mis notas",
          icon: FileText,
          match: (p) => p.startsWith("/dashboard/notas"),
        },
        ...(showOdontograma
          ? [
              {
                href: "/dashboard/odontograma",
                label: "Odontograma",
                icon: Smile,
                match: (p: string) => p.startsWith("/dashboard/odontograma"),
              } satisfies NavItem,
            ]
          : []),
        {
          href: "/dashboard/recetas",
          label: "Recetas",
          icon: Pill,
          match: (p) => p.startsWith("/dashboard/recetas"),
          locked: !canRecetas,
        },
        {
          href: "/dashboard/agenda",
          label: "Agenda",
          icon: Calendar,
          match: (p) => p.startsWith("/dashboard/agenda"),
          locked: !canAgenda,
        },
        {
          href: "/dashboard/pacientes",
          label: "Pacientes",
          icon: Users,
          match: (p) => p.startsWith("/dashboard/pacientes"),
          locked: !canPacientes,
        },
      ],
    },
    {
      title: "Inteligencia clínica",
      items: [
        {
          href: "/dashboard/cerebro",
          label: "Cerebro",
          icon: BookOpen,
          match: (p) => p.startsWith("/dashboard/cerebro"),
          locked: !canCerebro,
        },
        ...(showDiferencial
          ? [
              {
                href: "/dashboard/diferencial",
                label: "Diferencial",
                icon: Sparkles,
                match: (p: string) => p.startsWith("/dashboard/diferencial"),
                locked: !canCerebro,
              } satisfies NavItem,
            ]
          : []),
        {
          href: "/dashboard/cruces",
          label: "Cruces clínicos",
          icon: Network,
          match: (p) => p.startsWith("/dashboard/cruces"),
          locked: !canCerebro,
        },
      ],
    },
    ...(showAreasCriticas
      ? [
          {
            title: "Áreas críticas",
            items: [
              {
                href: "/dashboard/urgencias",
                label: "Urgencias",
                icon: Siren,
                match: (p: string) => p.startsWith("/dashboard/urgencias"),
                locked: !canCerebro,
              },
              {
                href: "/dashboard/uci",
                label: "UCI",
                icon: HeartPulse,
                match: (p: string) => p.startsWith("/dashboard/uci"),
                locked: !canCerebro,
              },
              {
                href: "/dashboard/quirofano",
                label: "Quirófano",
                icon: ClipboardCheck,
                match: (p: string) => p.startsWith("/dashboard/quirofano"),
                locked: !canCerebro,
              },
            ],
          } satisfies NavGroup,
        ]
      : []),
    ...(showApoyoDiagnostico
      ? [
          {
            title: "Apoyo diagnóstico",
            items: [
              {
                href: "/dashboard/laboratorio",
                label: "Laboratorio",
                icon: FlaskConical,
                match: (p: string) => p.startsWith("/dashboard/laboratorio"),
                locked: !canCerebro,
              },
              {
                href: "/dashboard/radiologia",
                label: "Radiología",
                icon: ScanLine,
                match: (p: string) => p.startsWith("/dashboard/radiologia"),
                locked: !canCerebro,
              },
            ],
          } satisfies NavGroup,
        ]
      : []),
    ...(showEspecialidadesMedicas
      ? [
          {
            title: "Especialidades",
            items: [
              {
                href: "/dashboard/cardiologia",
                label: "Cardiología",
                icon: Heart,
                match: (p: string) => p.startsWith("/dashboard/cardiologia"),
                locked: !canCerebro,
              },
              {
                href: "/dashboard/neurologia",
                label: "Neurología",
                icon: Brain,
                match: (p: string) => p.startsWith("/dashboard/neurologia"),
                locked: !canCerebro,
              },
              {
                href: "/dashboard/oncologia",
                label: "Oncología",
                icon: Activity,
                match: (p: string) => p.startsWith("/dashboard/oncologia"),
                locked: !canCerebro,
              },
              {
                href: "/dashboard/endocrinologia",
                label: "Endocrinología",
                icon: Droplet,
                match: (p: string) => p.startsWith("/dashboard/endocrinologia"),
                locked: !canCerebro,
              },
            ],
          } satisfies NavGroup,
        ]
      : []),
    {
      title: "Cuenta",
      items: [
        {
          href: "/dashboard/configuracion",
          label: "Configuración",
          icon: Settings,
          match: (p) => p.startsWith("/dashboard/configuracion"),
        },
      ],
    },
  ];

  if (isAdmin) {
    grupos.push({
      title: "Admin",
      items: [
        {
          href: "/admin/invitaciones",
          label: "Invitaciones",
          icon: ShieldCheck,
          match: (p) => p.startsWith("/admin/invitaciones"),
          admin: true,
        },
        {
          href: "/admin/cerebro",
          label: "Curar cerebro",
          icon: BookOpen,
          match: (p) => p.startsWith("/admin/cerebro"),
          admin: true,
        },
        {
          href: "/admin/feedback",
          label: "Feedback & errores",
          icon: MessageCircle,
          match: (p) => p.startsWith("/admin/feedback"),
          admin: true,
        },
      ],
    });
  }

  // Flatten for active-item lookup in the top bar label
  const allItems = grupos.flatMap((g) => g.items);
  const activeItem = allItems.find((it) => it.match(pathname));

  // Collapsible por grupo — mismo patrón que el sidebar desktop.
  // Persistido en localStorage para coherencia entre vistas.
  const activeGroupTitle = useMemo(() => {
    for (const g of grupos) {
      if (!g.title) continue;
      if (g.items.some((it) => it.match(pathname))) return g.title;
    }
    return null;
  }, [grupos, pathname]);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [hydratedNav, setHydratedNav] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lg-sidebar-groups-v1");
      const stored = raw
        ? (JSON.parse(raw) as Record<string, boolean>)
        : null;
      const next: Record<string, boolean> = {};
      for (const g of grupos) {
        if (!g.title) continue;
        if (stored && Object.prototype.hasOwnProperty.call(stored, g.title)) {
          next[g.title] = stored[g.title]!;
        } else {
          next[g.title] = g.title === activeGroupTitle;
        }
      }
      if (activeGroupTitle) next[activeGroupTitle] = true;
      setOpenMap(next);
    } catch {
      const next: Record<string, boolean> = {};
      for (const g of grupos) {
        if (g.title) next[g.title] = g.title === activeGroupTitle;
      }
      setOpenMap(next);
    }
    setHydratedNav(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupTitle]);

  function toggleGroup(title: string) {
    setOpenMap((prev) => {
      const next = { ...prev, [title]: !prev[title] };
      try {
        localStorage.setItem("lg-sidebar-groups-v1", JSON.stringify(next));
      } catch {
        /* swallow */
      }
      return next;
    });
  }

  const drawer = (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-[70] flex w-[88%] max-w-sm transform flex-col bg-canvas shadow-deep transition-transform duration-300 ease-out lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
              Plan
            </p>
            <p className="mt-0.5 text-body-sm font-semibold text-ink-strong">
              {TIER_LABELS[tier]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-strong"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {grupos.map((grupo, gIdx) => {
              // Grupos sin título — siempre visibles
              if (!grupo.title) {
                return (
                  <div
                    key={`untitled-${gIdx}`}
                    className="space-y-0.5 pb-1"
                  >
                    {grupo.items.map((it) => renderMobileItem(it, pathname))}
                  </div>
                );
              }

              const isOpen = hydratedNav ? !!openMap[grupo.title] : true;
              return (
                <div key={`${grupo.title}-${gIdx}`}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(grupo.title)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-surface-alt"
                  >
                    <ChevronRight
                      className={`h-3 w-3 shrink-0 text-ink-quiet transition-transform duration-200 ${
                        isOpen ? "rotate-90" : ""
                      }`}
                      strokeWidth={2.4}
                    />
                    <span className="text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-soft">
                      {grupo.title}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.22,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-0.5 pt-0.5 pb-1.5">
                          {grupo.items.map((it) =>
                            renderMobileItem(it, pathname),
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );

  return (
    <>
      {/* Top bar mobile (sticky justo debajo del TopBar global de 72px) */}
      <header className="sticky top-[72px] z-30 -mx-6 mb-2 border-b border-line bg-canvas/95 backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-between gap-3 px-6 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.6rem] uppercase tracking-eyebrow text-ink-soft">
              {TIER_LABELS[tier]} · Panel
            </p>
            <p className="mt-0.5 truncate text-body-sm font-semibold text-ink-strong">
              {activeItem?.label ?? "Dashboard"}
            </p>
          </div>
          <button
            type="button"
            data-tour-sidebar
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-body-sm font-medium text-ink-strong"
          >
            <Menu className="h-4 w-4" strokeWidth={2} />
            Menú
          </button>
        </div>
      </header>

      {mounted && createPortal(drawer, document.body)}
    </>
  );
}
