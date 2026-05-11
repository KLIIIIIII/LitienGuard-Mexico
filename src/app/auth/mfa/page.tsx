import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { MfaChallenge } from "./challenge";

export const metadata: Metadata = {
  title: "Verificación · LitienGuard",
  robots: { index: false, follow: false },
};

type SP = Record<string, string | string[] | undefined>;

export default async function MfaChallengePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: factorsData } = await supa.auth.mfa.listFactors();
  const verified = (factorsData?.totp ?? []).filter(
    (f) => f.status === "verified",
  );
  const factor = verified[0];

  if (!factor) {
    // No factor enrolled but somehow landed here — let them through.
    redirect("/dashboard");
  }

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/dashboard";

  return (
    <main className="min-h-[calc(100vh-72px)] bg-canvas">
      <div className="lg-shell flex items-center justify-center py-20 lg:py-28">
        <div className="w-full max-w-md">
          <MfaChallenge factorId={factor.id} nextPath={next} />
        </div>
      </div>
    </main>
  );
}
