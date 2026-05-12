import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { RequestAccessForm } from "./request-form";

export const metadata: Metadata = {
  title: "Acceso a tu expediente — LitienGuard",
  description:
    "Accede a tu información clínica registrada: citas próximas y pasadas, recetas firmadas y derechos ARCO.",
  robots: { index: false, follow: false },
};

export default function PacientePortalPage() {
  return (
    <>
      <PageHero
        eyebrow="Portal del paciente"
        title={
          <>
            Acceso a tu{" "}
            <span className="lg-serif-italic text-validation">expediente</span>
          </>
        }
        description="Escribe el correo con el que reservaste tu cita o que tu médico tiene registrado. Te enviamos un enlace seguro para ver tu información clínica."
        variant="alt"
      />

      <section className="border-b border-line bg-canvas py-12">
        <div className="lg-shell max-w-xl">
          <RequestAccessForm />

          <div className="mt-10 space-y-3 rounded-xl border border-line bg-surface-alt px-5 py-4">
            <p className="text-caption uppercase tracking-eyebrow text-ink-soft">
              Qué encuentras en tu expediente
            </p>
            <ul className="space-y-1.5 text-body-sm text-ink-strong">
              <li>· Tus citas próximas y pasadas</li>
              <li>· Cancelación directa de citas que aún no han ocurrido</li>
              <li>· Recetas firmadas asociadas a tu correo</li>
              <li>· Solicitudes ARCO (Acceso, Rectificación, Cancelación, Oposición)</li>
            </ul>
          </div>

          <p className="mt-6 text-caption leading-relaxed text-ink-soft">
            Conforme al artículo 22 de la Ley Federal de Protección de Datos
            Personales en Posesión de los Particulares (LFPDPPP), tienes
            derecho a acceder a tu información clínica en cualquier momento.
            Cada visita al expediente queda registrada en el sistema.
          </p>
        </div>
      </section>
    </>
  );
}
