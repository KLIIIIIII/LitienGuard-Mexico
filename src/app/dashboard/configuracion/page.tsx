import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { CollectiveToggle } from "./collective-toggle";
import { ConsultorioForm } from "./consultorio-form";

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
    .select("share_with_collective,nombre,email,role,cedula_profesional,especialidad,consultorio_nombre,consultorio_direccion,consultorio_telefono")
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
          <ConsultorioForm
            initial={{
              nombre: profile?.nombre ?? null,
              cedula_profesional: profile?.cedula_profesional ?? null,
              especialidad: profile?.especialidad ?? null,
              consultorio_nombre: profile?.consultorio_nombre ?? null,
              consultorio_direccion: profile?.consultorio_direccion ?? null,
              consultorio_telefono: profile?.consultorio_telefono ?? null,
            }}
          />

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

          <div className="lg-card border-warn-soft">
            <h2 className="text-h2 font-semibold tracking-tight text-ink-strong">
              Derechos ARCO (LFPDPPP)
            </h2>
            <p className="mt-2 text-body-sm text-ink-muted">
              Acceso · Rectificación · Cancelación · Oposición. Tienes derecho
              de ejercer estas acciones sobre tus datos en cualquier momento.
            </p>
            <ul className="mt-3 space-y-2 text-body-sm text-ink-strong">
              <li>
                <strong>Acceso:</strong> descarga tu información completa desde{" "}
                <a
                  href="/dashboard/exportar"
                  className="text-validation underline"
                >
                  Exportar datos
                </a>
                .
              </li>
              <li>
                <strong>Rectificación:</strong> edita o firma cada nota desde
                Mis notas.
              </li>
              <li>
                <strong>Cancelación:</strong> elimina tu cuenta y todos tus
                datos —{" "}
                <a
                  href="/dashboard/cancelar"
                  className="text-rose underline"
                >
                  ir al flujo de cancelación
                </a>
                .
              </li>
              <li>
                <strong>Oposición:</strong> el opt-out del cerebro colectivo
                ya cumple este derecho parcialmente.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
