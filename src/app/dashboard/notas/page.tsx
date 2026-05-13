import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mis consultas",
  robots: { index: false, follow: false },
};

/**
 * /dashboard/notas redirige a /dashboard/consultas — el modelo
 * gestiona consultas (encuentro clínico), no notas como objeto
 * primario. Las páginas individuales /dashboard/notas/[id] siguen
 * funcionando para backwards compat.
 */
export default function NotasIndexRedirect() {
  redirect("/dashboard/consultas");
}
