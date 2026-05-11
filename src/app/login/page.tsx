import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acceso piloto — LitienGuard",
  description: "Entra a LitienGuard con tu correo invitado al piloto.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-canvas">
      <div className="lg-shell flex items-center justify-center py-20 lg:py-28">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
