import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { ChunkForm } from "../chunk-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nuevo chunk",
  robots: { index: false, follow: false },
};

export default async function NuevoChunkPage() {
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
            Agregar chunk al cerebro
          </h1>
          <p className="mt-2 max-w-prose text-body text-ink-muted">
            Cada chunk es un fragmento atómico de evidencia. Mantén el contenido
            entre 100 y 700 palabras para que el RAG lo recupere bien.
          </p>
        </div>

        <div className="mt-8 max-w-3xl">
          <ChunkForm
            mode="create"
            initial={{
              id: "",
              source: "",
              page: "",
              title: "",
              content: "",
              meta_json: '{"especialidad": ""}',
              is_active: true,
            }}
          />
        </div>
      </div>
    </main>
  );
}
