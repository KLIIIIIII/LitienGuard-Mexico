import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { manrope, sourceSerif } from "@/lib/fonts";
import { SITE_URL } from "@/lib/utils";
import { TopBar } from "@/components/top-bar";
import { Footer } from "@/components/footer";
import { SessionAware } from "@/components/session-aware";
import { PWARegister } from "@/components/pwa-register";
import { PWAInstallBanner } from "@/components/pwa-install-banner";
import { FeedbackFab } from "@/components/feedback-fab";
import { ErrorReporter } from "@/components/error-reporter";
import { ReferralCapture } from "@/components/referral-capture";
import { ThemeProvider, themeInitScript } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LitienGuard — Inteligencia Médica para México",
    template: "%s · LitienGuard",
  },
  description:
    "Sistema operativo clínico latinoamericano. Decisiones clínicas con evidencia, pacientes con respuestas, hospitales con cobranza limpia.",
  keywords: [
    "inteligencia medica",
    "Mexico",
    "salud digital",
    "GPC IMSS",
    "telemedicina",
    "expediente clinico",
    "AI medico",
  ],
  authors: [{ name: "LitienGuard" }],
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: SITE_URL,
    title: "LitienGuard — Inteligencia Médica para México",
    description:
      "Decisiones clínicas con evidencia, pacientes con respuestas, hospitales con cobranza limpia.",
    siteName: "LitienGuard",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "LitienGuard — Inteligencia Médica para México",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LitienGuard — Inteligencia Médica para México",
    description:
      "Sistema operativo clínico latinoamericano para médicos, pacientes y hospitales.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "LitienGuard",
    statusBarStyle: "default",
  },
  applicationName: "LitienGuard",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF6" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F14" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-MX"
      className={`${manrope.variable} ${sourceSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-canvas text-ink antialiased">
        <ThemeProvider>
          <TopBar />
          <main className="flex-1 pt-[72px]">{children}</main>
          <Footer />
          <Suspense fallback={null}>
            <SessionAware />
          </Suspense>
          <PWARegister />
          <PWAInstallBanner />
          <FeedbackFab />
          <ErrorReporter />
          <ReferralCapture />
        </ThemeProvider>
      </body>
    </html>
  );
}
