import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { DesignSystemShowcase } from "./design-system-cliente";

export const metadata: Metadata = {
  title: "Design System v2 — LitienGuard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DesignSystemPage() {
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
        <p className="text-body text-ink-muted">Solo administradores.</p>
      </div>
    );
  }

  // Compute timestamps server-side so the timer starts coherent.
  const now = Date.now();
  return (
    <DesignSystemShowcase
      sepsisStartedAt={new Date(now - 23 * 60 * 1000).toISOString()}
      strokeStartedAt={new Date(now - 52 * 60 * 1000).toISOString()}
      iamStartedAt={new Date(now - 95 * 60 * 1000).toISOString()}
      dkaStartedAt={new Date(now - 45 * 60 * 1000).toISOString()}
    />
  );
}
