import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { signOut } from "@/app/login/actions";
import { Eyebrow } from "@/components/eyebrow";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("nombre, role, hospital, especialidad")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-[calc(100vh-72px)] bg-canvas">
      <div className="lg-shell py-12 lg:py-16">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <Eyebrow tone="validation">
              {profile?.role === "admin" ? "Panel admin" : "Panel del médico"}
            </Eyebrow>
            <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
              Hola{profile?.nombre ? `, ${profile.nombre.split(" ")[0]}` : ""}.
            </h1>
            <p className="mt-2 max-w-prose text-body text-ink-muted">
              {user.email}
              {profile?.hospital ? ` · ${profile.hospital}` : ""}
            </p>
          </div>
          <form action={signOutAndRedirect}>
            <button type="submit" className="lg-cta-ghost">
              Cerrar sesión
            </button>
          </form>
        </div>

        <section className="mt-12 grid gap-4 lg:grid-cols-2">
          <div className="lg-card">
            <Eyebrow tone="accent">Scribe</Eyebrow>
            <h2 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
              Notas SOAP automáticas
            </h2>
            <p className="mt-3 text-body-sm text-ink-muted">
              Sube un audio de tu consulta y obtén una nota SOAP estructurada en
              segundos. Disponible en la próxima entrega.
            </p>
            <span className="mt-4 inline-block rounded-full bg-warn-soft px-3 py-1 text-caption text-ink-strong">
              Próximamente
            </span>
          </div>

          <div className="lg-card">
            <Eyebrow tone="validation">Cerebro</Eyebrow>
            <h2 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
              Búsqueda con evidencia
            </h2>
            <p className="mt-3 text-body-sm text-ink-muted">
              Consulta el cerebro curado en español con citas verbatim de guías
              oficiales (IMSS, NOM, NICE, etc.).
            </p>
            <span className="mt-4 inline-block rounded-full bg-warn-soft px-3 py-1 text-caption text-ink-strong">
              Próximamente
            </span>
          </div>
        </section>

        {profile?.role === "admin" && (
          <section className="mt-12">
            <Eyebrow tone="accent">Admin</Eyebrow>
            <h2 className="mt-2 text-h2 font-semibold tracking-tight text-ink-strong">
              Herramientas administrativas
            </h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/admin/invitaciones"
                className="lg-cta-primary"
              >
                Gestionar invitaciones
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

async function signOutAndRedirect() {
  "use server";
  await signOut();
  redirect("/login");
}
