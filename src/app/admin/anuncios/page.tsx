import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { AnunciosAdminClient } from "./anuncios-admin-client";

export const metadata: Metadata = {
  title: "Admin · Anuncios",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AnunciosAdminPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supa
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: anuncios } = await supa
    .from("anuncios")
    .select(
      "id, titulo, contenido, tipo, audiencia, link_url, link_label, publicado_at, archivado_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-caption text-ink-muted hover:text-ink-strong"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
        Volver al dashboard
      </Link>

      <header>
        <Eyebrow tone="validation">Admin · Anuncios</Eyebrow>
        <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink-strong">
          Comunica nuevas features a los doctores
        </h1>
        <p className="mt-2 max-w-prose text-body-sm text-ink-muted">
          Los anuncios publicados aparecen en el dashboard de los doctores
          según la audiencia que elijas. Pueden descartarlos individualmente.
        </p>
      </header>

      <AnunciosAdminClient anuncios={anuncios ?? []} />
    </div>
  );
}
