import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { CollectiveToggle } from "./collective-toggle";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Configuración",
  robots: { index: false, follow: false },
};

export default async function ConfiguracionPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("share_with_collective,nombre,email,role")
    .eq("id", user.id)
    .single();

  const { count: practiceCount } = await supa
    .from("cerebro_chunks")
    .select("*", { count: "exact", head: true })
    .eq("tipo", "practica_observada")
    .eq("created_by", user.id);

  return (
    <div>
      <div>
        <Eyebrow tone="validation">Configuración</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
          Preferencias de cuenta
        </h1>
        <p className="mt-2 max-w-prose text-body text-ink-muted">
          {profile?.nombre ? `${profile.nombre} · ` : ""}
          {profile?.email}
        </p>

        <div className="mt-10 max-w-3xl space-y-6">
          <CollectiveToggle
            initial={profile?.share_with_collective ?? false}
            practiceCount={practiceCount ?? 0}
          />

          <div className="lg-card">
            <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
              Tu rol
            </h2>
            <p className="mt-2 text-body-sm text-ink-muted">
              {profile?.role === "admin"
                ? "Administrador — puedes gestionar invitaciones, curar el cerebro y ver todas las notas."
                : "Médico — puedes crear y firmar tus propias notas SOAP."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
