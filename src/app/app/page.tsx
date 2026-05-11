import type { Metadata } from "next";
import { Globe, Smartphone, ShieldCheck, Clock } from "lucide-react";
import { Eyebrow } from "@/components/eyebrow";
import { WaitlistForm } from "./waitlist-form";

export const metadata: Metadata = {
  title: "App nativa — próximamente",
  description:
    "La app nativa para iOS y Android llega después del piloto. Únete a la lista de espera para enterarte primero.",
};

const PORQUE_NO_AUN = [
  {
    icon: Clock,
    title: "Primero, validar con doctores reales",
    body: "Antes de invertir meses en construir una app nativa, estamos midiendo qué tan bien LitienGuard resuelve el problema en la práctica diaria. La web es el camino rápido para llegar a esos 10-20 médicos del piloto.",
  },
  {
    icon: Smartphone,
    title: "La web ya funciona en tu cel",
    body: "Abre Safari (iPhone) o Chrome (Android), ve a litien-guard-mexico.vercel.app y entra con tu correo invitado. La interfaz se adapta al tamaño de pantalla — todo el dashboard, Scribe, cerebro, exportes — funciona ahí.",
  },
  {
    icon: ShieldCheck,
    title: "App nativa no es un wrapper de web",
    body: "Una app real significa Face ID, micrófono nativo de alta fidelidad para el Scribe, push notifications reales, e instalación desde App Store y Play Store. Eso requiere desarrollo nativo, no un atajo del navegador.",
  },
];

export default function AppPage() {
  return (
    <main className="min-h-screen bg-canvas">
      <section className="relative overflow-hidden border-b border-line bg-canvas">
        <div className="lg-shell relative grid gap-12 py-16 lg:grid-cols-[1.1fr_minmax(0,420px)] lg:items-center lg:py-24">
          <div>
            <Eyebrow tone="validation">App nativa · próximamente</Eyebrow>
            <h1 className="mt-4 max-w-2xl text-display font-semibold tracking-tight text-ink md:text-[2.6rem] lg:text-[3rem] lg:leading-[1.08]">
              La app nativa llegará{" "}
              <span className="lg-serif-italic text-validation">
                cuando esté lista
              </span>
              .
            </h1>
            <p className="mt-5 max-w-xl text-body text-ink-muted md:text-[1.04rem]">
              Estamos en fase de piloto. Hoy LitienGuard funciona en el
              navegador de tu computadora y de tu celular. La app nativa para
              iOS y Android — con instalación desde App Store y Play Store —
              llega después de validar el producto con los médicos del piloto.
            </p>
            <p className="mt-3 max-w-xl text-body-sm text-ink-soft">
              Si te interesa la app, déjanos tu correo y la plataforma que usas.
              Cuando suficientes médicos la pidan, la construimos y eres de los
              primeros en saberlo.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#waitlist" className="lg-cta-primary">
                Únete a la lista de espera
              </a>
              <a
                href="https://litien-guard-mexico.vercel.app"
                className="lg-cta-ghost"
              >
                <Globe className="h-4 w-4" strokeWidth={2} />
                Abrir versión web
              </a>
            </div>
          </div>

          <div id="waitlist" className="scroll-mt-24">
            <WaitlistForm />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface-alt">
        <div className="lg-shell py-16">
          <Eyebrow>¿Por qué no la lanzamos hoy?</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-h1 font-semibold tracking-tight text-ink-strong">
            Lanzar una app a medio terminar es peor que esperar.
          </h2>
          <p className="mt-4 max-w-prose text-body text-ink-muted">
            Tres razones honestas detrás de la decisión, en vez de prometerte
            una app que aún no merece serlo.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {PORQUE_NO_AUN.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="lg-card">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-validation-soft text-validation">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <h3 className="mt-4 text-h3 font-semibold text-ink-strong">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-body-sm text-ink-muted leading-relaxed">
                    {f.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
