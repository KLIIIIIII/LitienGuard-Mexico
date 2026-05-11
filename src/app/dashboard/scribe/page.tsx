import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Eyebrow } from "@/components/eyebrow";
import { ScribeForm } from "./scribe-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scribe — Nueva nota",
  robots: { index: false, follow: false },
};

export default async function ScribePage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-[calc(100vh-72px)] bg-canvas">
      <div className="lg-shell py-10 lg:py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Eyebrow tone="accent">Scribe</Eyebrow>
            <h1 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
              Nueva nota SOAP
            </h1>
            <p className="mt-2 max-w-prose text-body text-ink-muted">
              Graba la consulta o sube el audio. Transcribimos con Whisper y
              estructuramos en formato SOAP con Llama 3.3 70B. Tú firmas la
              versión final.
            </p>
          </div>
          <Link href="/dashboard/notas" className="lg-cta-ghost">
            Ver mis notas
          </Link>
        </div>

        <div className="mt-10 max-w-3xl">
          <ScribeForm />
        </div>
      </div>
    </main>
  );
}
