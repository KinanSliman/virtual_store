# Fresh Mart — a virtual grocery store

[![CI](https://github.com/KinanSliman/virtual_store/actions/workflows/ci.yml/badge.svg)](https://github.com/KinanSliman/virtual_store/actions/workflows/ci.yml)

A grocery store you walk through in the browser. Push open the door, wander the
aisle, pick products off the shelves, and check out — while a separate admin
dashboard manages the catalogue and reports on what shoppers actually did.

Built with Next.js 16, TypeScript, PostgreSQL, and React Three Fiber. The
storefront is bilingual (English / العربية) and works on desktop and touch.

```
┌──────────────────────────┐        ┌──────────────────────────┐
│  /                       │        │  /dashboard              │
│  3D storefront           │◄──────►│  catalogue + analytics   │
│  shoppers                │  same  │  the shopkeeper          │
└──────────────────────────┘   DB   └──────────────────────────┘
```

---

## Contents

- [What it does](#what-it-does)
- [Controls](#controls)
- [Tech stack](#tech-stack)
- [Running it locally](#running-it-locally)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Security](#security)
- [Testing and CI](#testing-and-ci)
- [Deployment](#deployment)
- [Scripts](#scripts)

---

## What it does

### The storefront (`/`)

The shopper picks a language, the door swings open, and they're inside a room
with two stocked shelves. Every box on those shelves is a database row: its
price, stock, shelf position, colour and artwork all come from the catalogue.
Clicking one opens its details and adds it to the cart. Checkout is a demo — it
records a real order and decrements stock, but takes no payment.

### The dashboard (`/dashboard`)

| Route | Purpose |
| --- | --- |
| `/dashboard` | Product CRUD — name, description, price, stock, category, shelf placement, colour, image |
| `/dashboard/analytics` | Revenue over time, top sellers, most-viewed products, stock by category, low-stock alerts |
| `/dashboard/settings` | Store name (English and Arabic) and logo |

The dashboard is password-protected — see [Security](#security).

Anything changed here shows up in the 3D store on the next load — including the
name on the sign above the door.

### Bilingual, right-to-left aware

Language is chosen on the entry screen, **before** the door opens. Arabic
switches the document to `dir="rtl"`, so overlays, the cart, and the product
popup all mirror — the on-screen movement stick moves to the other side too. The
choice persists across visits.

Products, categories, and the store name each carry an optional Arabic field,
editable in the dashboard and falling back to English when blank.

---

## Controls

**Desktop**

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` or arrow keys | Move |
| Hold left mouse button + drag | Look around |
| Click a product | Open details, add to cart |

**Touch** — detected automatically, and the instructions change to match:

| Input | Action |
| --- | --- |
| On-screen thumbstick | Move (analog — a half-push walks at half speed) |
| Swipe | Look around |
| Tap a product | Open details |

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 — App Router, Server Components, Server Actions, React Compiler |
| Language | TypeScript, strict |
| Database | PostgreSQL with Drizzle ORM and `drizzle-kit` migrations |
| 3D | React Three Fiber + drei, entirely procedural geometry (no model files) |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Client state | Zustand (cart) |
| Audio | Web Audio API — synthesised, no audio files |

---

## Running it locally

**Prerequisites:** Node.js 20.9+, pnpm, and a PostgreSQL instance.

```bash
git clone https://github.com/KinanSliman/virtual_store.git
cd virtual_store
pnpm install
cp .env.example .env          # then set DATABASE_URL
```

Create and populate the database:

```bash
node --env-file=.env create-db.mjs   # creates the database if it doesn't exist
pnpm db:migrate                      # applies the schema
pnpm db:seed                         # 12 products + 30 days of demo activity
```

Start it:

```bash
pnpm dev
```

The store is at [localhost:3000](http://localhost:3000), the dashboard at
[localhost:3000/dashboard](http://localhost:3000/dashboard).

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                  # 3D storefront (server-rendered catalogue)
│   ├── dashboard/                # catalogue, analytics, settings + server actions
│   └── api/
│       ├── views/                # logs a product click
│       ├── orders/               # demo checkout
│       └── images/[filename]/    # serves uploaded images
├── components/
│   ├── store3d/                  # scene, controls, labels, textures, HUD
│   └── dashboard/                # forms, tables, charts
├── db/
│   ├── schema.ts                 # single source of truth
│   └── seed.ts
└── lib/                          # i18n, cart, branding, uploads, formatting
```

---

## How it works

A few decisions worth explaining, since they're the parts that weren't obvious.

### Arabic text inside a 3D scene

drei's `<Text>` renders with a bundled Latin font, so Arabic came out as empty
boxes. Shelf labels and the storefront sign are instead drawn to a 2D canvas and
mapped onto a plane
([`TextPlane.tsx`](src/components/store3d/TextPlane.tsx)). Canvas goes through
the platform's text engine, which shapes Arabic correctly — joined letterforms,
right-to-left ordering — and falls back per-glyph across a font stack.

### Product images

Each product's artwork is composited over its colour onto a square canvas and
used as the texture on the four upright faces of its box, like a real package
([`useProductTexture.ts`](src/components/store3d/useProductTexture.ts)). Going
through a canvas means transparent PNGs get an opaque backdrop instead of
rendering black, and non-square photos are letterboxed rather than stretched. A
product with no image falls back to a plain coloured box.

Images upload from the dashboard by click or drag-and-drop (PNG, JPEG, WebP,
GIF, SVG, up to 4 MB) and are stored **as rows in the database**, not as files.
Serverless hosts give each request a read-only filesystem and no storage shared
between invocations, so a written file would fail or vanish. Filenames are
UUIDs generated server-side, so nothing user-controlled reaches a path, and the
serving route sends a restrictive CSP so an uploaded SVG can't execute script.

### Two database drivers, chosen by host

A `*.neon.tech` URL connects through `@neondatabase/serverless`, which carries
the Postgres protocol over a WebSocket on port **443**. Anything else uses
`node-postgres` on 5432.

This isn't only a serverless optimisation. Many networks — corporate filtering,
VPNs, some ISPs — reset raw 5432 connections, which surfaces as `read
ECONNRESET` the instant a query runs, on a machine whose internet is otherwise
fine. Port 443 goes through, so the same code works locally against a hosted
database. Neon's connection strings also carry `channel_binding=require`, which
node-postgres can't satisfy; the parameter is stripped before connecting, with
TLS still enforced by `sslmode`.

### Sound

Footsteps and the door creak are synthesised at runtime with the Web Audio API
([`sfx.ts`](src/lib/sfx.ts)) — filtered noise bursts and a vibrato sweep — so
the repo ships no audio files. Footsteps fire once per stride actually walked,
so they stop when you bump into a shelf.

### Data flow

- [`schema.ts`](src/db/schema.ts) is the single source of truth: `store_settings`,
  `categories`, `products`, `orders`, `order_items`, `product_views`, `images`.
- The storefront server-renders products straight from the database. Each
  product click logs a `product_views` row, feeding the "most viewed" chart.
- Checkout writes an order with unit-price snapshots and decrements stock, in a
  transaction. Prices come from the database, never from the client.
- Dashboard mutations use Server Actions; the storefront uses small route
  handlers.
- `store_settings` is a single row. Server code reads it through
  `lib/store-settings.ts`; client components use the pure helpers in
  `lib/branding.ts` instead, because importing the former would pull the
  Postgres driver into the browser bundle.

---

## Security

The storefront is public. Everything under `/dashboard` changes the catalogue,
so it sits behind a password set in `DASHBOARD_PASSWORD`.

- **Session** — a signed cookie rather than server-side state. There's one
  account, so there's nothing to look up, and a stateless token keeps a
  serverless deployment free of a session store. The signing key is derived
  from the password, so changing it invalidates every existing session. The
  cookie is `httpOnly`, `sameSite=lax`, and `secure` in production.
- **Two layers** — `proxy.ts` redirects unauthenticated page requests, and each
  mutating Server Action re-checks the session. Next's own documentation calls
  proxy an *optimistic* check, since it runs before the request reaches the
  action; the action-level guard is the one that actually authorises.
- **Fails closed** — with no password configured, the dashboard stays open on
  localhost for convenience but locks itself in production, so a deployment
  can't accidentally publish an open admin panel.
- **Password comparison** is constant-time, and the login form only accepts
  same-site `/dashboard` redirect targets, so `?next=` can't be used as an
  open redirect.
- **Rate limiting** on the public write routes — 60 views/min and 10
  checkouts/min per client — so the analytics can't be poisoned in a loop.
  Counters are per-process; a shared store would be the next step if this
  needed to be exact.
- **Uploads** get server-generated UUID names, so nothing user-controlled
  reaches a path, and are served with a restrictive CSP so an uploaded SVG
  can't execute script.

---

## Testing and CI

```bash
pnpm test        # Vitest
pnpm typecheck   # tsc --noEmit
pnpm lint        # ESLint
```

58 tests cover the logic worth pinning down: session token signing, tampering
and expiry; the rate limiter's windows and per-key isolation; cart arithmetic;
upload validation; and the Arabic-to-English fallbacks that decide what a
shopper actually reads.

[GitHub Actions](.github/workflows/ci.yml) runs lint, typecheck, tests, and a
production build on every push and pull request.

---

## Deployment

Deployed on Vercel with a Neon database. The app queries Postgres on every
request, so the deployment needs a database it can actually reach — a
`localhost` URL in the host's environment variables produces a build that
succeeds and then returns a server error on every page.

1. Set environment variables in the Vercel project:
   - `DATABASE_URL` — Neon's **pooled** connection string (the `-pooler` host).
   - `DATABASE_URL_UNPOOLED` — the direct host, for migrations. DDL isn't
     reliable through a transaction-mode pooler.
   - `DASHBOARD_PASSWORD` — required, or the dashboard locks itself.

2. Create the schema on the hosted database:

   ```bash
   DATABASE_URL="$DATABASE_URL_UNPOOLED" pnpm db:migrate
   ```

   `drizzle-kit` connects on 5432. On a network that blocks it, export one SQL
   script from a working local database and apply it over the WebSocket driver
   instead — or paste it into Neon's browser SQL Editor:

   ```bash
   node scripts/export-for-neon.mjs "postgres://user:pass@localhost:5432/virtual_store"
   node --env-file=.env scripts/apply-sql.mjs neon-setup.sql
   ```

3. Confirm what's actually there:

   ```bash
   node --env-file=.env scripts/db-status.mjs
   ```

---

## Scripts

| Command | Does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm test` / `pnpm test:watch` | Vitest |
| `pnpm db:generate` | Generate a migration from schema changes |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Reset to demo catalogue and 30 days of activity |
| `scripts/db-status.mjs` | List tables and row counts for the current `DATABASE_URL` |
| `scripts/apply-sql.mjs` | Run a `.sql` file through the host-appropriate driver |
| `scripts/export-for-neon.mjs` | Dump schema + data to a single SQL script |
| `scripts/import-uploads.mjs` | Migrate legacy `uploads/` files into the database |

---

## Notes

No payment processing is involved anywhere — checkout records an order and
adjusts stock, nothing more. This is a portfolio project built to demonstrate
full-stack and 3D web work.
