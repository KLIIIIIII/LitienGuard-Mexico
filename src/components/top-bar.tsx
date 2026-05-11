import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { UserChip } from "@/components/user-chip";

const navLinks = [
  { href: "/medicos", label: "Médicos" },
  { href: "/pacientes", label: "Pacientes" },
  { href: "/hospitales", label: "Hospitales" },
  { href: "/contacto", label: "Contacto" },
];

async function tryGetUser() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }
  try {
    const supa = await createSupabaseServer();
    const {
      data: { user },
    } = await supa.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function TopBar() {
  const user = await tryGetUser();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-sm">
      <div className="lg-shell flex h-[72px] items-center justify-between gap-6">
        <Link
          href="/"
          aria-label="LitienGuard — inicio"
          className="flex items-center gap-3"
        >
          <svg
            viewBox="0 0 220 40"
            className="h-7 w-auto"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <text
              x="0"
              y="30"
              fontFamily="var(--font-manrope), system-ui, sans-serif"
              fontWeight="700"
              fontSize="28"
              letterSpacing="-0.022em"
              fill="#1F1E1B"
            >
              LitienGuard
            </text>
            <circle cx="195" cy="22" r="4" fill="#4A6B5B" />
          </svg>
          <span className="hidden text-caption text-ink-soft md:inline">
            Inteligencia Médica para México
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body-sm font-medium text-ink-muted transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <UserChip />
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-body-sm font-medium text-ink-muted transition-colors hover:text-accent md:inline"
              >
                Entrar
              </Link>
              <Link href="/contacto#piloto" className="lg-cta-primary">
                Solicita acceso piloto
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
