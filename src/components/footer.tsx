import Link from "next/link";

const columns = [
  {
    title: "Producto",
    links: [
      { href: "/medicos", label: "Para médicos" },
      { href: "/pacientes", label: "Para pacientes" },
      { href: "/hospitales", label: "Para hospitales" },
    ],
  },
  {
    title: "Compañía",
    links: [
      { href: "/contacto", label: "Contacto" },
      { href: "/contacto#piloto", label: "Acceso piloto" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/aviso-privacidad", label: "Aviso de privacidad" },
      { href: "/terminos", label: "Términos de uso" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface-alt">
      <div className="lg-shell py-14">
        <div className="grid gap-10 md:grid-cols-[2fr_repeat(3,1fr)]">
          <div>
            <Link href="/" aria-label="LitienGuard">
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
            </Link>
            <p className="mt-4 max-w-xs text-body-sm text-ink-muted">
              Sistema operativo clínico latinoamericano. Evidencia curada en
              español, anclada en México.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="lg-eyebrow">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-body-sm text-ink-muted transition-colors hover:text-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-caption text-ink-soft md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} LitienGuard. Información clínica con
            evidencia citada — no sustituye atención médica profesional.
          </p>
          <p>
            Hecho en México · <span className="text-validation">●</span> v0.1
          </p>
        </div>
      </div>
    </footer>
  );
}
