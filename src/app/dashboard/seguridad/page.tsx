import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { MfaPanel } from "./mfa-panel";

export const metadata: Metadata = {
  title: "Seguridad — LitienGuard",
  description: "Activa autenticación de dos factores (MFA) para tu cuenta.",
};

export default async function SeguridadPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: factorsData } = await supa.auth.mfa.listFactors();
  const verifiedTotp = (factorsData?.totp ?? []).filter(
    (f) => f.status === "verified",
  );
  const verifiedFactor = verifiedTotp[0] ?? null;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
          Cuenta
        </p>
        <h1 className="mt-1 text-h1 font-semibold tracking-tight text-ink-strong">
          Seguridad
        </h1>
        <p className="mt-2 max-w-2xl text-body-sm text-ink-muted">
          La autenticación de dos factores (2FA) añade un código de 6 dígitos
          desde tu celular cada vez que entras. Si pierdes acceso a tu correo
          o a tu cuenta, el segundo factor evita que alguien más pueda entrar.
        </p>
      </header>

      <MfaPanel
        userEmail={user.email ?? ""}
        existingFactorId={verifiedFactor?.id ?? null}
        existingFactorName={verifiedFactor?.friendly_name ?? null}
      />
    </div>
  );
}
