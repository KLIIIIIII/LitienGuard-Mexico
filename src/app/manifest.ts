import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LitienGuard — Inteligencia Médica",
    short_name: "LitienGuard",
    description:
      "Sistema operativo clínico para médicos, pacientes y hospitales en México. Notas SOAP con IA + búsqueda con evidencia.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#FBFAF6",
    background_color: "#FBFAF6",
    lang: "es-MX",
    categories: ["medical", "health", "productivity"],
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Nueva nota SOAP",
        short_name: "Scribe",
        description: "Crear una nota SOAP con IA",
        url: "/dashboard/scribe",
      },
      {
        name: "Mis notas",
        short_name: "Notas",
        description: "Ver historial de notas",
        url: "/dashboard/notas",
      },
      {
        name: "Cerebro",
        short_name: "Cerebro",
        description: "Buscar con evidencia",
        url: "/dashboard/cerebro",
      },
    ],
  };
}
