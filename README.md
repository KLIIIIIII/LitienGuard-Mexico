# LitienGuard — Web

<img src="public/logo.svg" alt="LitienGuard" width="220" />

**Inteligencia Médica para México.**
Sistema operativo clínico latinoamericano. Decisiones clínicas con evidencia, pacientes con respuestas, hospitales con cobranza limpia.

Esta es la web pública (Hito 1). El cerebro clínico, la app del médico Streamlit y el AI Scribe viven en el repo hermano `litienguard_av`.

---

## Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript strict
- **Styling**: Tailwind CSS v3 + sistema visual Clinical Calm
- **3D / animación**: React Three Fiber v9 + drei + Framer Motion + GSAP + Lottie
- **Forms**: React Hook Form + Zod
- **Backend**: Supabase (DB + auth) + Resend (email transaccional)
- **Deploy**: Vercel
- **Package manager**: **pnpm** (no npm, no yarn)

---

## Setup local

### 1. Requisitos

- Node.js >= 18.18 (recomendado 20+)
- pnpm 9+ (instalar con `npm install -g pnpm`)
- Cuenta de Supabase, Resend y Vercel (gratis para empezar)

### 2. Instalación

```bash
git clone https://github.com/KLIIIIIII/LitienGuard-Mexico.git
cd LitienGuard-Mexico
pnpm install
```

### 3. Variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` y llena las credenciales (ver secciones Supabase y Resend más abajo).

### 4. Correr en desarrollo

```bash
pnpm dev
```

Abre http://localhost:3000

---

## Setup Supabase

1. Entra a https://supabase.com y crea un proyecto nuevo en la región más cercana.
2. Una vez creado, ve a **Project Settings → API** y copia:
   - `Project URL` → variable `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → variable `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (secret) → variable `SUPABASE_SERVICE_ROLE_KEY` (no compartir)
3. Ve a **SQL Editor**, abre una consulta nueva, pega el contenido de `supabase/migrations/0001_initial.sql` y ejecuta. Esto crea la tabla `preregistros` con RLS.
4. Verifica en **Table Editor** que `preregistros` exista con las columnas correctas.

---

## Setup Resend

1. Entra a https://resend.com y crea cuenta.
2. Ve a **API Keys**, genera una key con permisos `Sending access`.
3. Copia la key a `RESEND_API_KEY` en `.env.local`.
4. Por ahora puedes usar el dominio compartido `litienguard@resend.dev`. Cuando tengas dominio propio, verifica DNS y cambia `RESEND_FROM` a tu dominio.

---

## Setup Vercel (deploy)

1. Push del repo a GitHub (el operador lo hace con su PAT, ver sección "Push remoto").
2. Entra a https://vercel.com → **Add New Project** → importa `KLIIIIIII/LitienGuard-Mexico`.
3. Vercel detecta Next.js automáticamente. Antes de hacer deploy, ve a **Environment Variables** y agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `RESEND_FROM`
   - `NEXT_PUBLIC_SITE_URL` (URL final del proyecto, ej. `https://litienguard-mexico.vercel.app`)
4. Click **Deploy**.

---

## Push remoto (solo el operador, primera vez)

```bash
cd C:\Users\ro-g9\litienguard-web
git remote add origin https://github.com/KLIIIIIII/LitienGuard-Mexico.git
git branch -M main
git push -u origin main
```

Pedirá tu PAT como password.

---

## Comandos útiles

```bash
pnpm dev          # Dev server con hot reload
pnpm build        # Build producción
pnpm start        # Servir build producción local
pnpm lint         # ESLint
pnpm typecheck    # TypeScript check (tsc --noEmit)
pnpm format       # Prettier write
```

---

## Estructura

```
litienguard-web/
├── public/                       # Assets estáticos (logo, og, favicon)
├── src/
│   ├── app/                      # App Router (Next.js)
│   │   ├── actions/              # Server Actions
│   │   ├── api/                  # API routes
│   │   ├── medicos/              # /medicos
│   │   ├── pacientes/            # /pacientes
│   │   ├── hospitales/           # /hospitales
│   │   ├── contacto/             # /contacto
│   │   ├── aviso-privacidad/     # /aviso-privacidad
│   │   ├── terminos/             # /terminos
│   │   ├── layout.tsx            # Root layout (TopBar + Footer)
│   │   ├── page.tsx              # Home
│   │   ├── globals.css           # Tailwind + Clinical Calm tokens
│   │   ├── sitemap.ts            # SEO sitemap auto
│   │   └── robots.ts             # SEO robots auto
│   ├── components/               # Componentes reutilizables
│   └── lib/                      # fonts, utils, schemas, clients
├── supabase/migrations/0001_initial.sql
├── tailwind.config.ts            # Tokens Clinical Calm
├── postcss.config.mjs
├── .env.example                  # Plantilla env vars (sin valores reales)
└── .env.local.example
```

---

## Convenciones

- **TypeScript strict**. Cero `any`, cero `@ts-ignore` salvo casos extremos comentados.
- **Server Components por default**. `'use client'` solo cuando se necesita state, refs, animations o hooks de browser.
- **Sistema visual Clinical Calm** es la única paleta. No inventar colores. Tokens definidos en `tailwind.config.ts`.
- **`prefers-reduced-motion`**: todas las animaciones deben respetarlo.
- **Cero PII en el cliente**. Datos sensibles solo viajan a Server Actions / API routes.
- **Cero datos médicos hardcoded** — vienen del cerebro `litienguard_av` en hitos posteriores.
- **Copy en español neutro mexicano**.
- **Disclaimers legales** en cada página relevante.

---

## Roadmap

- **Hito 1 (este repo)**: landing pública + formulario pre-registro
- **Hito 2**: LitienGuard Asistencia con auth Supabase, wizard "¿Qué hago ahora?", export PDF
- **Hito 3**: Cerebro clínico + AI Scribe expuestos vía Cloudflare Workers + Hono + Groq

---

© 2026 LitienGuard · Hecho en México
