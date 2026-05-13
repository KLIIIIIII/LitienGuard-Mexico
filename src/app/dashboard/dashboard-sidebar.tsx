"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  badge?: string;
  admin?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export function DashboardSidebar({
  tier,
  isAdmin,
  canScribe,
  canCerebro,
  canRecetas,
  canAgenda,
  canPacientes,
  showOdontograma = true,
  showDiferencial = true,
  showRcm = true,
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
  showRcm?: boolean;
}) {
  const pathname = usePathname();
  void showRcm; // reservado para items futuros RCM si se agregan al sidebar

  // Agrupar items por contexto. Mi plan / Facturación / Seguridad /
  // Refiere / Exportar quedaron consolidados dentro de Configuración
  // — sus pages siguen existiendo pero se acceden desde ahí.
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
          href: "/dashboard/consultas",
          label: "Mis consultas",
          icon: ClipboardList,
          match: (p) =>
            p.startsWith("/dashboard/consultas") ||
            p.startsWith("/dashboard/notas"),
        },
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
      title: "Conocimiento",
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
                match: (p: string) =>
                  p.startsWith("/dashboard/diferencial"),
                locked: !canCerebro,
              } satisfies NavItem,
            ]
          : []),
      ],
    },
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

  return (
    <aside className="lg:sticky lg:top-[88px] lg:self-start">
      <div className="rounded-2xl border border-line bg-surface px-3 py-4 shadow-soft">
        <div className="px-3 pb-3">
          <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
            Plan
          </p>
          <p className="mt-1 text-body-sm font-semibold text-ink-strong">
            {TIER_LABELS[tier]}
          </p>
        </div>
        <nav className="space-y-3">
          {grupos.map((grupo, gIdx) => (
            <div key={`${grupo.title}-${gIdx}`}>
              {grupo.title && (
                <p className="px-3 pt-2 pb-1.5 text-[0.6rem] uppercase tracking-eyebrow font-semibold text-ink-soft">
                  {grupo.title}
                </p>
              )}
              <div className="space-y-0.5">
                {grupo.items.map((it) => {
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
                      <Icon
                        className="h-4 w-4 shrink-0"
                        strokeWidth={2}
                      />
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
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
