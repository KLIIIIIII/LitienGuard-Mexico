import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { canUseScribe, canUseCerebro, type SubscriptionTier } from "@/lib/entitlements";
import { DashboardSidebar } from "./dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("role, subscription_tier")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "free") as SubscriptionTier;
  const isAdmin = profile?.role === "admin";

  return (
    <div className="lg-shell grid gap-8 py-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 lg:py-8">
      <DashboardSidebar
        tier={tier}
        isAdmin={isAdmin}
        canScribe={canUseScribe(tier)}
        canCerebro={canUseCerebro(tier)}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
