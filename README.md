# VEYA

Marketing site, design system and dashboard concept for VEYA Technologies.

    npm run dev      # http://localhost:5173
    npm run build    # type-check + production build
    docker build -t veya-web .

## Stack
Vite · React 19 · TypeScript · Tailwind v4 · React Router · **Framer Motion** (page transitions, scroll reveals,
parallax, hover/tap, menus, FAQ) · **anime.js v4** (hero intro + ambient loops, split-text headings, SVG line drawing,
workflow packet, dashboard counters/sparklines). All motion respects `prefers-reduced-motion`.

## Routes
`/` · `/platform` · `/solutions` · `/how-it-works` · `/about` · `/contact` · `/credits` · `/app` (dashboard concept)

## Layout
- `src/pages` – one file per route. `src/sections` – page sections. `src/components` – nav, hero, layout, shared UI.
- `src/content.ts` – all copy/data. `src/lib/api.ts` – REST client for the future FastAPI backend
  (cookie auth, CSRF header, `X-Org-Id` tenant header; no secrets in the browser). `src/lib/types.ts` – tenant-scoped types.
- `public/img` – photos from Wikimedia Commons; attribution in `src/credits.json`, rendered at `/credits`.

## Not built yet
FastAPI, PostgreSQL, Redis/Celery, auth. The contact form POSTs to `/api/v1/public/audit-requests` and falls back to
`mailto:` until the API exists. Dashboard numbers are sample data.
