import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Target } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { ProgressBoard } from "./progress-board";

export const metadata: Metadata = {
  title: "Smart Hospital Progress — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SmartHospitalProgressPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return (
      <div className="lg-shell py-12">
        <Eyebrow tone="warn">Solo administradores</Eyebrow>
        <p className="mt-3 text-body text-ink-muted">
          Esta página es herramienta interna para preparar demos
          ejecutivas. No está expuesta públicamente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Volver al dashboard
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-accent-soft p-1.5 text-accent">
            <Target className="h-5 w-5" strokeWidth={2} />
          </div>
          <Eyebrow tone="accent">Roadmap interno · admin</Eyebrow>
        </div>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Smart Hospital Progress
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted leading-relaxed">
          Nuestro progreso real contra las 10 áreas de evaluación
          Newsweek/Statista World&apos;s Best Smart Hospitals 2026. Sin
          diplomacia — estos números son auditables y se actualizan al
          completar cada sprint. Útil para preparar demos ejecutivas a
          Christus, TecSalud, Médica Sur, IMSS Digital, ISSSTE.
        </p>
      </header>

      <ProgressBoard />
    </div>
  );
}
