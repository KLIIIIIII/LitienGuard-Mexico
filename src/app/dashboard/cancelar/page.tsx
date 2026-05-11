import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { DeleteFlow } from "./delete-flow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cancelar mi cuenta",
  robots: { index: false, follow: false },
};

export default async function CancelarPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const [{ count: notasCount }, { count: practiceCount }] = await Promise.all([
    supa
      .from("notas_scribe")
      .select("*", { count: "exact", head: true })
      .eq("medico_id", user.id),
    supa
      .from("cerebro_chunks")
      .select("*", { count: "exact", head: true })
      .eq("tipo", "practica_observada")
      .eq("created_by", user.id),
  ]);

  return (
    <div>
      <Link
        href="/dashboard/configuracion"
        className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a configuración
      </Link>

      <div className="mt-4">
        <Eyebrow tone="warn">Derechos ARCO · Cancelación</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
          Eliminar mi cuenta
        </h1>
        <p className="mt-2 max-w-prose text-body text-ink-muted">
          La Ley Federal de Protección de Datos Personales en Posesión de los
          Particulares te otorga el derecho de cancelar el tratamiento de tus
          datos personales. Aquí lo puedes ejercer directo, sin trámites.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <DeleteFlow
          notasCount={notasCount ?? 0}
          practiceCount={practiceCount ?? 0}
        />

        <aside className="lg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-validation-soft text-validation">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-h3 font-semibold tracking-tight text-ink-strong">
              Lo que se elimina
            </h2>
          </div>
          <ul className="mt-4 space-y-2 text-body-sm text-ink-strong">
            <li>• Todas tus notas SOAP (cualquier estado).</li>
            <li>• Tu perfil, rol, configuración y opt-in.</li>
            <li>
              • Tus chunks anonimizados en el cerebro colectivo (si los hubo).
            </li>
            <li>• Tu cuenta de autenticación (no podrás volver a entrar).</li>
          </ul>
          <h3 className="mt-5 text-caption font-semibold uppercase tracking-eyebrow text-ink-muted">
            Lo que no se elimina
          </h3>
          <ul className="mt-2 space-y-2 text-body-sm text-ink-muted">
            <li>
              • Registros de auditoría con tu user_id desvinculado (NOM-024).
            </li>
            <li>• Copias de respaldo de Supabase (retención de 7 días).</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
