import type { Metadata } from "next";
import Link from "next/link";
import { Smartphone, Wifi, Zap, Shield, Apple } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Eyebrow } from "@/components/eyebrow";
import { SITE_URL } from "@/lib/utils";
import { InstallButton } from "./install-button";

export const metadata: Metadata = {
  title: "App móvil",
  description:
    "Instala LitienGuard en tu teléfono: notas SOAP en consulta sin abrir navegador.",
};

const FEATURES = [
  {
    icon: Zap,
    title: "Apertura instantánea",
    body: "Un toque en la pantalla de inicio. Sin URL, sin barra del navegador, listo para grabar la siguiente consulta.",
  },
  {
    icon: Wifi,
    title: "Funciona donde la web",
    body: "Misma cuenta, mismas notas, mismo cerebro. Solo necesitas tu correo invitado al piloto.",
  },
  {
    icon: Shield,
    title: "Misma seguridad",
    body: "Magic link, sesión en tu dispositivo, RLS en Supabase. Nada cambia en privacidad respecto a la web.",
  },
];

export default function AppPage() {
  return (
    <main className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-canvas">
        <div className="lg-shell relative grid gap-10 py-16 lg:grid-cols-[1.1fr_minmax(0,420px)] lg:items-center lg:py-24">
          <div>
            <Eyebrow tone="validation">App · Progressive Web App</Eyebrow>
            <h1 className="mt-4 max-w-2xl text-display font-semibold tracking-tight text-ink md:text-[2.6rem] lg:text-[3rem] lg:leading-[1.08]">
              LitienGuard en tu{" "}
              <span className="lg-serif-italic text-validation">teléfono</span>
              , sin pasar por la App Store.
            </h1>
            <p className="mt-5 max-w-xl text-body text-ink-muted md:text-[1.04rem]">
              Es una Progressive Web App: la misma plataforma que usas en
              navegador, instalada como ícono en tu pantalla de inicio. Sin
              esperas de revisión, sin dependencia de tu carrier, sin descargar
              nada del store.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <InstallButton />
              <Link href="/dashboard" className="lg-cta-ghost">
                Ir al dashboard
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-validation" />
                <span className="text-caption text-ink-muted">
                  iOS Safari · Android Chrome · Edge
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-caption text-ink-muted">
                  Privado primero · sin PII en LLM
                </span>
              </div>
            </div>
          </div>

          {/* QR card */}
          <div className="lg-card flex flex-col items-center text-center">
            <p className="lg-eyebrow-validation">Escanea desde tu teléfono</p>
            <div className="mt-4 rounded-2xl border border-line bg-surface p-5 shadow-soft">
              <QRCodeSVG
                value={`${SITE_URL}/app`}
                size={196}
                level="M"
                marginSize={0}
                fgColor="#1F1E1B"
                bgColor="#FFFFFF"
              />
            </div>
            <p className="mt-4 max-w-xs text-body-sm text-ink-muted">
              Abre la cámara de tu teléfono, apunta al código y entra a
              LitienGuard. Después sigue los pasos de instalación abajo.
            </p>
            <p className="mt-3 break-all text-caption text-ink-soft">
              {SITE_URL.replace("https://", "")}/app
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-line bg-surface-alt">
        <div className="lg-shell py-16">
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="lg-card">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-validation-soft text-validation">
                    <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                  </div>
                  <h2 className="mt-4 text-h3 font-semibold text-ink-strong">
                    {f.title}
                  </h2>
                  <p className="mt-2 text-body-sm text-ink-muted">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Manual install guide */}
      <section id="guia-manual" className="border-b border-line bg-canvas">
        <div className="lg-shell py-16">
          <Eyebrow tone="accent">Guía manual</Eyebrow>
          <h2 className="mt-3 text-h1 font-semibold tracking-tight text-ink">
            Si tu navegador no mostró el botón «Instalar»
          </h2>
          <p className="mt-3 max-w-prose text-body text-ink-muted">
            Algunos navegadores requieren que actives la instalación a mano. Es
            rápido. Elige tu dispositivo:
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {/* iOS */}
            <div className="lg-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-alt text-ink-strong">
                  <Apple className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="text-h2 font-semibold text-ink-strong">
                  iPhone · iPad
                </h3>
              </div>
              <p className="mt-2 text-caption text-ink-soft">
                Safari · iOS 16.4 o superior
              </p>
              <ol className="mt-5 space-y-3 text-body-sm text-ink-strong">
                <li className="flex gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-validation-soft text-caption font-semibold text-validation">
                    1
                  </span>
                  Abre <strong>litien-guard-mexico.vercel.app</strong> en Safari
                  (no en Chrome dentro de iPhone — no funciona).
                </li>
                <li className="flex gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-validation-soft text-caption font-semibold text-validation">
                    2
                  </span>
                  Toca el botón <strong>compartir</strong> (cuadrado con flecha
                  hacia arriba, en la barra inferior).
                </li>
                <li className="flex gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-validation-soft text-caption font-semibold text-validation">
                    3
                  </span>
                  Desliza hacia abajo y elige{" "}
                  <strong>«Agregar a inicio»</strong> (Add to Home Screen).
                </li>
                <li className="flex gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-validation-soft text-caption font-semibold text-validation">
                    4
                  </span>
                  Toca <strong>Agregar</strong> arriba a la derecha. Aparece el
                  ícono de LitienGuard en tu pantalla de inicio.
                </li>
              </ol>
            </div>

            {/* Android */}
            <div className="lg-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-alt text-ink-strong">
                  <Smartphone className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="text-h2 font-semibold text-ink-strong">
                  Android
                </h3>
              </div>
              <p className="mt-2 text-caption text-ink-soft">
                Chrome, Edge, Samsung Internet, Brave
              </p>
              <ol className="mt-5 space-y-3 text-body-sm text-ink-strong">
                <li className="flex gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-validation-soft text-caption font-semibold text-validation">
                    1
                  </span>
                  Abre{" "}
                  <strong>litien-guard-mexico.vercel.app</strong> en Chrome.
                </li>
                <li className="flex gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-validation-soft text-caption font-semibold text-validation">
                    2
                  </span>
                  Toca los <strong>tres puntos</strong> arriba a la derecha.
                </li>
                <li className="flex gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-validation-soft text-caption font-semibold text-validation">
                    3
                  </span>
                  Elige <strong>«Instalar app»</strong> o{" "}
                  <strong>«Agregar a pantalla de inicio»</strong>.
                </li>
                <li className="flex gap-3">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-validation-soft text-caption font-semibold text-validation">
                    4
                  </span>
                  Confirma <strong>Instalar</strong>. LitienGuard aparece en
                  tu pantalla y en el cajón de apps como cualquier otra.
                </li>
              </ol>
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-warn-soft bg-warn-soft px-5 py-4 text-body-sm text-ink-strong">
            <strong>Nota para iOS:</strong> en iPhone debes usar Safari (no
            Chrome, Firefox o Edge dentro del teléfono). Apple solo permite
            instalación de PWAs desde su propio navegador. Una vez instalada,
            funciona igual que cualquier app nativa.
          </div>
        </div>
      </section>
    </main>
  );
}
