import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { OdontogramEditor } from "./odontogram-editor";

export const metadata: Metadata = {
  title: "Odontograma — LitienGuard",
};

export default async function OdontogramaPage() {
  const supa = await createSupabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect("/login");

  return <OdontogramEditor medicoEmail={user.email ?? "—"} />;
}
