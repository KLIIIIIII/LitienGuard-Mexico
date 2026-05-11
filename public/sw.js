// LitienGuard PWA service worker (minimal)
// Required for installability. We deliberately do NOT cache HTML/JS so the
// app always stays in sync with Vercel deploys — no stale screens.

const VERSION = "v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through. Only catch network errors gracefully.
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          `<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><title>Sin conexión</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="font-family:system-ui;padding:32px;color:#1F1E1B;background:#FBFAF6"><h1 style="font-weight:600">Sin conexión</h1><p style="color:#57554F">LitienGuard necesita internet para conectarse a Whisper, Llama y la base de datos. Verifica tu conexión y vuelve a intentar.</p></body></html>`,
          {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          },
        ),
    ),
  );
});
