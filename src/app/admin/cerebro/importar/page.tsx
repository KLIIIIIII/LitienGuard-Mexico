import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { ImportForm } from "./import-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Importar chunks",
  robots: { index: false, follow: false },
};

const EXAMPLE = `{
  "chunks": [
    {
      "id": "imss-718-iSGLT2-renal",
      "source": "GPC IMSS SS-718-15",
      "page": "24",
      "title": "iSGLT2 en DM2 con ERC",
      "content": "En pacientes con DM2 y ERC con TFG ≥25 mL/min se recomienda agregar empagliflozina o dapagliflozina…",
      "meta": { "especialidad": "endocrinología", "año": "2024" }
    }
  ]
}`;

export default async function ImportarPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") redirect("/dashboard");

  return (
    <main className="min-h-[calc(100vh-72px)] bg-canvas">
      <div className="lg-shell py-10 lg:py-14">
        <Link
          href="/admin/cerebro"
          className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al corpus
        </Link>

        <div className="mt-4">
          <Eyebrow tone="accent">Admin · Cerebro</Eyebrow>
          <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
            Importar chunks en lote
          </h1>
          <p className="mt-2 max-w-prose text-body text-ink-muted">
            Pega un JSON con uno o varios chunks. Si el ID ya existe se
            actualiza. Acepta tanto un arreglo plano como un objeto con clave{" "}
            <code>chunks</code>.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="max-w-3xl">
            <ImportForm />
          </div>

          <aside className="lg-card">
            <p className="lg-eyebrow-validation">Ejemplo</p>
            <h2 className="mt-2 text-h3 font-semibold text-ink-strong">
              Estructura esperada
            </h2>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-alt px-3 py-3 text-caption text-ink-strong">
              {EXAMPLE}
            </pre>
            <p className="mt-3 text-caption text-ink-soft">
              IDs en minúsculas con guiones. Hasta 500 chunks por importación.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
