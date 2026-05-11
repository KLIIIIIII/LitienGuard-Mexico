import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acceso piloto — LitienGuard",
  description: "Entra a LitienGuard con tu correo invitado al piloto.",
  robots: { index: false, follow: false },
};

type SP = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params = await searchParams;
  const reason = typeof params.reason === "string" ? params.reason : undefined;
  const banner =
    reason === "link_expired"
      ? "El link que abriste expiró o ya fue usado. Pide uno nuevo aquí."
      : reason === "missing_code"
        ? "El link de acceso estaba incompleto. Pide uno nuevo."
        : reason === "invalid_link"
          ? "No pudimos validar tu link. Solicita uno nuevo."
          : null;

  return (
    <main className="min-h-[calc(100vh-72px)] bg-canvas">
      <div className="lg-shell flex items-center justify-center py-20 lg:py-28">
        <div className="w-full max-w-md space-y-4">
          {banner && (
            <div className="rounded-lg border border-warn-soft bg-warn-soft px-4 py-3 text-caption text-ink-strong">
              {banner}
            </div>
          )}
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
