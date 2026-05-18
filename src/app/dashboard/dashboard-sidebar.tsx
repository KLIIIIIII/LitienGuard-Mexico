"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import {
  LayoutDashboard,
  Mic,
  ClipboardList,
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
  FlaskConical,
  Network,
  TrendingUp,
  Siren,
  ClipboardCheck,
  HeartPulse,
  ScanLine,
  Heart,
  Brain,
  Activity,
  Droplet,
  LayoutGrid,
  Bed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  TIER_LABELS,
  type SubscriptionTier,
} from "@/lib/entitlements";
import { SecurityShieldBadge } from "@/components/security-shield-badge";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  locked?: boolean;
  badge?: string;
  admin?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

function renderItem(it: NavItem, pathname: string) {
  const active = it.match(pathname);
  const Icon = it.icon;
  return (
    <Link
      key={it.href}
      href={it.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm transition-colors ${
        active
          ? "bg-validation-soft text-validation"
          : "text-ink-strong hover:bg-surface-alt"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="flex-1">{it.label}</span>
      {it.locked && (
        <Lock
          className="h-3 w-3 text-ink-quiet"
          strokeWidth={2.2}
        />
      )}
      {it.admin && (
        <span className="rounded-full bg-warn-soft px-1.5 py-0.5 text-[0.65rem] text-warn">
          admin
        </span>
      )}
    </Link>
  );
}

export function DashboardSidebar({
  tier,
  isAdmin,
  canScribe,
  canCerebro,
  canHospitalModules,
  canRecetas,
  canAgenda,
  canPacientes,
  showOdontograma = true,
  showDiferencial = true,
  showRcm = true,
  showScribe = true,
  showMisConsultas = true,
  showAreasCriticas = true,
  showApoyoDiagnostico = true,
  showEspecialidadesMedicas = true,
}: {
  tier: SubscriptionTier;
  isAdmin: boolean;
  canScribe: boolean;
  canCerebro: boolean;
  canHospitalModules: boolean;
  canRecetas: boolean;
  canAgenda: boolean;
  canPacientes: boolean;
  showOdontograma?: boolean;
  showDiferencial?: boolean;
  showRcm?: boolean;
  showScribe?: boolean;
  showMisConsultas?: boolean;
  showAreasCriticas?: boolean;
  showApoyoDiagnostico?: boolean;
  showEspecialidadesMedicas?: boolean;
}) {
  const pathname = usePathname();
  void showRcm; // reservado para items futuros RCM si se agregan al sidebar

  // Sidebar organizado por departamento — coherente con un hospital
  // real. Mi plan / Facturación / Seguridad / Refiere / Exportar
  // quedaron consolidados dentro de Configuración.
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
        ...(showScribe
          ? [
              {
                href: "/dashboard/scribe",
                label: "Scribe",
                icon: Mic,
                match: (p: string) => p.startsWith("/dashboard/scribe"),
                locked: !canScribe,
              } satisfies NavItem,
            ]
          : []),
        ...(showMisConsultas
          ? [
              {
                href: "/dashboard/consultas",
                label: "Mis consultas",
                icon: ClipboardList,
                match: (p: string) =>
                  p.startsWith("/dashboard/consultas") ||
                  p.startsWith("/dashboard/notas"),
              } satisfies NavItem,
            ]
          : []),
        ...(showOdontograma
          ? [
              {
                href: "/dashboard/odontograma",
                label: "Odontograma",
                icon: Smile,
                match: (p: string) =>
                  p.startsWith("/dashboard/odontograma"),
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
          match: (p) =>
            p.startsWith("/dashboard/cerebro") ||
            p === "/dashboard/diferencial/patrones",
          locked: !canCerebro,
        },
        ...(showDiferencial
          ? [
              {
                href: "/dashboard/diferencial",
                label: "Diferencial",
                icon: Sparkles,
                match: (p: string) =>
                  p === "/dashboard/diferencial" ||
                  p.startsWith("/dashboard/diferencial/calidad") ||
                  /^\/dashboard\/diferencial\/[^/]+$/.test(p),
                locked: !canCerebro,
              } satisfies NavItem,
              {
                href: "/dashboard/diferencial/estudios",
                label: "Motor estudios",
                icon: FlaskConical,
                match: (p: string) =>
                  p.startsWith("/dashboard/diferencial/estudios"),
                locked: !canCerebro,
              } satisfies NavItem,
              {
                href: "/dashboard/diferencial/patrones",
                label: "Patrones",
                icon: Network,
                match: (p: string) =>
                  p.startsWith("/dashboard/diferencial/patrones"),
                locked: !canCerebro,
              } satisfies NavItem,
              {
                href: "/dashboard/diferencial/calidad",
                label: "Mi calidad",
                icon: TrendingUp,
                match: (p: string) =>
                  p.startsWith("/dashboard/diferencial/calidad"),
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
    // Hub Operaciones — fusión de áreas críticas + apoyo diagnóstico
    ...(showAreasCriticas || showApoyoDiagnostico
      ? [
          {
            title: "Operaciones",
            items: [
              {
                href: "/dashboard/operaciones",
                label: "Vista general",
                icon: LayoutGrid,
                match: (p: string) => p === "/dashboard/operaciones",
                locked: !canHospitalModules,
              },
              ...(showAreasCriticas
                ? ([
                    {
                      href: "/dashboard/urgencias",
                      label: "Urgencias",
                      icon: Siren,
                      match: (p: string) =>
                        p.startsWith("/dashboard/urgencias"),
                      locked: !canHospitalModules,
                    },
                    {
                      href: "/dashboard/uci",
                      label: "UCI",
                      icon: HeartPulse,
                      match: (p: string) => p.startsWith("/dashboard/uci"),
                      locked: !canHospitalModules,
                    },
                    {
                      href: "/dashboard/quirofano",
                      label: "Quirófano",
                      icon: ClipboardCheck,
                      match: (p: string) =>
                        p.startsWith("/dashboard/quirofano"),
                      locked: !canHospitalModules,
                    },
                  ] satisfies NavItem[])
                : []),
              ...(showApoyoDiagnostico
                ? ([
                    {
                      href: "/dashboard/laboratorio",
                      label: "Laboratorio",
                      icon: FlaskConical,
                      match: (p: string) =>
                        p.startsWith("/dashboard/laboratorio"),
                      locked: !canHospitalModules,
                    },
                    {
                      href: "/dashboard/radiologia",
                      label: "Radiología",
                      icon: ScanLine,
                      match: (p: string) =>
                        p.startsWith("/dashboard/radiologia"),
                      locked: !canHospitalModules,
                    },
                  ] satisfies NavItem[])
                : []),
              {
                href: "/dashboard/camas",
                label: "Camas",
                icon: Bed,
                match: (p: string) => p.startsWith("/dashboard/camas"),
                locked: !canHospitalModules,
              },
            ],
          } satisfies NavGroup,
        ]
      : []),
    // Hub Especialidades
    ...(showEspecialidadesMedicas
      ? [
          {
            title: "Especialidades",
            items: [
              {
                href: "/dashboard/especialidades",
                label: "Vista general",
                icon: LayoutGrid,
                match: (p: string) => p === "/dashboard/especialidades",
                locked: !canHospitalModules,
              },
              {
                href: "/dashboard/cardiologia",
                label: "Cardiología",
                icon: Heart,
                match: (p: string) => p.startsWith("/dashboard/cardiologia"),
                locked: !canHospitalModules,
              },
              {
                href: "/dashboard/neurologia",
                label: "Neurología",
                icon: Brain,
                match: (p: string) => p.startsWith("/dashboard/neurologia"),
                locked: !canHospitalModules,
              },
              {
                href: "/dashboard/oncologia",
                label: "Oncología",
                icon: Activity,
                match: (p: string) => p.startsWith("/dashboard/oncologia"),
                locked: !canHospitalModules,
              },
              {
                href: "/dashboard/endocrinologia",
                label: "Endocrinología",
                icon: Droplet,
                match: (p: string) =>
                  p.startsWith("/dashboard/endocrinologia"),
                locked: !canHospitalModules,
              },
            ],
          } satisfies NavGroup,
        ]
      : []),
    {
      title: "Cuenta",
      items: [
        {
          href: "/dashboard/mi-impacto",
          label: "Mi impacto",
          icon: TrendingUp,
          match: (p) => p.startsWith("/dashboard/mi-impacto"),
        },
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
          href: "/admin/smart-hospital-progress",
          label: "Roadmap progreso",
          icon: TrendingUp,
          match: (p) => p.startsWith("/admin/smart-hospital-progress"),
          admin: true,
        },
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

  // Estado collapse por grupo (key = título del grupo). Persistido en
  // localStorage para que la elección del médico se mantenga entre
  // sesiones — patrón Epic Hyperspace / Linear.
  //
  // Default: solo el grupo activo abierto (donde el path actual cae).
  // El grupo sin título (Inicio) es siempre visible y no necesita estado.
  const activeGroupTitle = useMemo(() => {
    for (const g of grupos) {
      if (!g.title) continue;
      if (g.items.some((it) => it.match(pathname))) return g.title;
    }
    return null;
  }, [grupos, pathname]);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Restaurar estado guardado, sino abrir solo el grupo activo
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
      // Asegurar que el grupo activo esté abierto siempre al navegar a él
      if (activeGroupTitle) next[activeGroupTitle] = true;
      setOpenMap(next);
    } catch {
      // localStorage no disponible (SSR / privacy mode) — solo abre el activo
      const next: Record<string, boolean> = {};
      for (const g of grupos) {
        if (g.title) next[g.title] = g.title === activeGroupTitle;
      }
      setOpenMap(next);
    }
    setHydrated(true);
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

  return (
    <aside
      data-tour-sidebar
      className="lg:sticky lg:top-[88px] lg:self-start"
    >
      <div className="rounded-2xl border border-line bg-surface px-3 py-4 shadow-soft">
        <div className="px-3 pb-3">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
            Plan
          </p>
          <p className="mt-1 text-body-sm font-semibold text-ink-strong">
            {TIER_LABELS[tier]}
          </p>
        </div>
        <nav className="space-y-1">
          {grupos.map((grupo, gIdx) => {
            // Grupos sin título (Inicio) — siempre visibles
            if (!grupo.title) {
              return (
                <div key={`untitled-${gIdx}`} className="space-y-0.5 pb-1">
                  {grupo.items.map((it) => renderItem(it, pathname))}
                </div>
              );
            }

            const isOpen = hydrated ? !!openMap[grupo.title] : true;
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
                  <span className="text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-soft group-hover:text-ink-muted">
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
                        {grupo.items.map((it) => renderItem(it, pathname))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Sello de confianza — siempre visible, abre el certificado */}
        <div className="mt-1 border-t border-line pt-1">
          <SecurityShieldBadge />
        </div>
      </div>
    </aside>
  );
}
