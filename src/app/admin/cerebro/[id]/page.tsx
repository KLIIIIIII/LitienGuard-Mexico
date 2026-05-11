import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { ChunkForm } from "../chunk-form";
import {
  DeleteChunkButton,
  ToggleActiveButton,
} from "./delete-button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Editar chunk",
  robots: { index: false, follow: false },
};

export default async function EditarChunkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const { data: chunk } = await supa
    .from("cerebro_chunks")
    .select(
      "id,source,page,title,content,meta,is_active,created_at,updated_at",
    )
    .eq("id", id)
    .single();
  if (!chunk) notFound();

  const c = chunk as {
    id: string;
    source: string;
    page: string;
    title: string;
    content: string;
    meta: Record<string, unknown> | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };

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

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Eyebrow tone="accent">Admin · Cerebro</Eyebrow>
            <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
              Editar chunk
            </h1>
            <p className="mt-2 text-caption text-ink-muted">
              <code>{c.id}</code> · creado{" "}
              {new Date(c.created_at).toLocaleDateString("es-MX")} · última
              edición {new Date(c.updated_at).toLocaleDateString("es-MX")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ToggleActiveButton id={c.id} active={c.is_active} />
            <DeleteChunkButton id={c.id} />
          </div>
        </div>

        <div className="mt-8 max-w-3xl">
          <ChunkForm
            mode="edit"
            initial={{
              id: c.id,
              source: c.source,
              page: c.page,
              title: c.title,
              content: c.content,
              meta_json: JSON.stringify(c.meta ?? {}, null, 2),
              is_active: c.is_active,
            }}
          />
        </div>
      </div>
    </main>
  );
}
