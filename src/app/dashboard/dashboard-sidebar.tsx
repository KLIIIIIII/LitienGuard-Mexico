"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mic,
  FileText,
  BookOpen,
  ShieldCheck,
  Lock,
  Settings,
  Download,
  MessageCircle,
  Smile,
  Pill,
  Calendar,
  CreditCard,
  Sparkles,
  Gift,
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

export function DashboardSidebar({
  tier,
  isAdmin,
  canScribe,
  canCerebro,
  canRecetas,
  canAgenda,
}: {
  tier: SubscriptionTier;
  isAdmin: boolean;
  canScribe: boolean;
  canCerebro: boolean;
  canRecetas: boolean;
  canAgenda: boolean;
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    {
      href: "/dashboard",
      label: "Inicio",
      icon: LayoutDashboard,
      match: (p) => p === "/dashboard",
    },
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
    {
      href: "/dashboard/odontograma",
      label: "Odontograma",
      icon: Smile,
      match: (p) => p.startsWith("/dashboard/odontograma"),
    },
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
      href: "/dashboard/cerebro",
      label: "Cerebro",
      icon: BookOpen,
      match: (p) => p.startsWith("/dashboard/cerebro"),
      locked: !canCerebro,
    },
    {
      href: "/dashboard/diferencial",
      label: "Diferencial",
      icon: Sparkles,
      match: (p) => p.startsWith("/dashboard/diferencial"),
      locked: !canCerebro,
    },
    {
      href: "/dashboard/exportar",
      label: "Exportar datos",
      icon: Download,
      match: (p) => p.startsWith("/dashboard/exportar"),
    },
    {
      href: "/dashboard/seguridad",
      label: "Seguridad",
      icon: Lock,
      match: (p) => p.startsWith("/dashboard/seguridad"),
    },
    {
      href: "/dashboard/billing",
      label: "Facturación",
      icon: CreditCard,
      match: (p) => p.startsWith("/dashboard/billing"),
    },
    {
      href: "/dashboard/referidos",
      label: "Refiere y gana",
      icon: Gift,
      match: (p) => p.startsWith("/dashboard/referidos"),
    },
    {
      href: "/dashboard/configuracion",
      label: "Configuración",
      icon: Settings,
      match: (p) => p.startsWith("/dashboard/configuracion"),
    },
  ];

  if (isAdmin) {
    items.push({
      href: "/admin/invitaciones",
      label: "Invitaciones",
      icon: ShieldCheck,
      match: (p) => p.startsWith("/admin/invitaciones"),
      admin: true,
    });
    items.push({
      href: "/admin/cerebro",
      label: "Curar cerebro",
      icon: BookOpen,
      match: (p) => p.startsWith("/admin/cerebro"),
      admin: true,
    });
    items.push({
      href: "/admin/feedback",
      label: "Feedback & errores",
      icon: MessageCircle,
      match: (p) => p.startsWith("/admin/feedback"),
      admin: true,
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
        <nav className="space-y-0.5">
          {items.map((it) => {
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
                  <Lock className="h-3 w-3 text-ink-quiet" strokeWidth={2.2} />
                )}
                {it.admin && (
                  <span className="rounded-full bg-warn-soft px-1.5 py-0.5 text-[0.65rem] text-warn">
                    admin
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
