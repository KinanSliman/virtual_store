# 🛒 Fresh Mart — Virtual Grocery Store

A portfolio project: a **3D grocery store you can walk through in the browser**, backed by a PostgreSQL database and a management dashboard.

| Route | What it is |
|---|---|
| `/` | The 3D storefront — walk in, browse two shelves, click products, fill a cart, demo checkout (no payment) |
| `/dashboard` | Product CRUD — create, edit, delete, stock, shelf placement, image upload |
| `/dashboard/analytics` | Revenue per day, top sellers, most-viewed products, stock by category, low-stock alerts |
| `/dashboard/settings` | Store name (English + Arabic) and logo |

## Controls (3D store)

**Desktop**

- **W A S D** or **arrow keys** — move
- **Hold left mouse button + drag** — look around
- **Click a product** — description popup, add to cart

**Touch** — the entry screen detects a coarse pointer and shows these instead:

- **On-screen thumbstick** (bottom corner) — analog movement; a half-push walks
  at half speed
- **Swipe anywhere** — look around
- **Tap a product** — popup

## Language

Shoppers pick **English or العربية on the entry screen, before the door opens**.
Arabic switches the document to `dir="rtl"`, so the overlays, cart, and popup
mirror; the choice is remembered in `localStorage` and read back through
`useSyncExternalStore`. Leaving for the dashboard resets direction to LTR.

Product names, descriptions, category names, and the store name each have an
optional Arabic column, editable in the dashboard and falling back to the
English text when blank.

3D text (the storefront sign and shelf labels) is drawn to a 2D canvas and
mapped onto a plane rather than using drei's `<Text>` — its bundled font has no
Arabic glyphs, whereas canvas goes through the platform text engine and shapes
Arabic correctly. See `src/components/store3d/TextPlane.tsx`.

## Tech stack

- **Next.js 16** (App Router, React Server Components, Server Actions, React Compiler)
- **TypeScript** everywhere
- **PostgreSQL + Drizzle ORM** (`drizzle-kit` migrations)
- **React Three Fiber + drei** for the 3D scene (procedural geometry, no model files)
- **Tailwind CSS**, **Recharts**, **Zustand**

## Getting started

1. Have PostgreSQL running locally and copy `.env.example` to `.env`, adjusting
   `DATABASE_URL` to your credentials.

2. Install and set up the database:

   ```bash
   pnpm install
   node --env-file=.env create-db.mjs   # creates the database if missing
   pnpm db:migrate                      # applies the schema
   pnpm db:seed                         # 12 products + 30 days of demo analytics data
   ```

3. Run it:

   ```bash
   pnpm dev
   ```

   Open http://localhost:3000 for the store, http://localhost:3000/dashboard to manage it.

## Product images

Each product can carry an image, shown in the store popup and in the dashboard
table. There are two sources:

- The **seeded illustrations** in `public/products/*.svg`, served statically.
- **Your own uploads** — the product form takes a file from your computer by
  click or drag-and-drop, previews it before saving, and stores it in the
  gitignored `uploads/` directory (outside `public/`, so writing one doesn't
  restart the dev server). Uploaded files get a UUID filename and are served by
  `/api/images/[filename]`, which only accepts that exact name shape, so a
  request can't walk out of the upload directory.

The image appears in two places in the store: as the texture on the product's
box on the shelf (composited over the product colour onto a square canvas, so
transparent PNGs get an opaque backdrop and non-square artwork is letterboxed
rather than stretched — see `useProductTexture.ts`) and full size in the popup.
A product with no image falls back to a plain coloured box.

PNG, JPEG, WebP, GIF, and SVG are accepted, up to 4MB (`serverActions.bodySizeLimit`
in `next.config.ts` allows 5MB of request body to leave room for form overhead).
Replacing or removing an image — or deleting the product — also deletes the file
from disk. Seeded illustrations are never deleted.

## Deploying (Vercel + Neon)

The app talks to Postgres on every request, so a deployment needs a database it
can actually reach — a `localhost` URL in the hosting provider's environment
variables is the usual cause of a build that succeeds and then 500s.

**Two drivers, picked by host** (`src/db/index.ts`). A `*.neon.tech` URL goes
through `@neondatabase/serverless`, which carries the Postgres protocol over a
WebSocket on port **443**; anything else uses `node-postgres` on 5432. This
matters beyond serverless: plenty of networks — corporate filtering, VPNs, some
ISPs — reset raw 5432 connections, which surfaces as `read ECONNRESET` the
instant a query runs, from a machine with otherwise fine internet. Port 443
gets through, so the same code works locally against Neon.

Neon's connection strings also carry `channel_binding=require`, which
node-postgres can't satisfy; the parameter is stripped before connecting, with
TLS still enforced by `sslmode`.

1. **Environment variables** in the Vercel project:
   - `DATABASE_URL` — Neon's **pooled** connection string (the `-pooler` host).
   - `DATABASE_URL_UNPOOLED` — the direct host, for migrations run with
     `drizzle-kit`; DDL isn't reliable through a transaction-mode pooler.

2. **Create the schema** on the hosted database:

   ```bash
   DATABASE_URL="$DATABASE_URL_UNPOOLED" pnpm db:migrate
   ```

   `drizzle-kit` connects on 5432, so on a network that blocks it, build one
   SQL script from a working local database and apply it over the WebSocket
   driver instead:

   ```bash
   node scripts/export-for-neon.mjs "postgres://user:pass@localhost:5432/virtual_store"
   node --env-file=.env scripts/apply-sql.mjs neon-setup.sql
   ```

   `neon-setup.sql` holds the schema plus every row, uploaded images included.
   It can equally be pasted into Neon's browser SQL Editor.

3. `node --env-file=.env scripts/db-status.mjs` lists the tables and row counts
   of whatever `DATABASE_URL` points at — the quickest way to tell an empty
   database from an unreachable one.

Uploaded images are rows in the database rather than files on disk, so they
survive on hosts with a read-only or ephemeral filesystem. `scripts/import-uploads.mjs`
migrates any images left over from the old `uploads/` directory.

## How data flows

- `src/db/schema.ts` is the single source of truth: `store_settings`,
  `categories`, `products`, `orders`, `order_items`, `product_views`, `images`.
- `store_settings` is a single row (id = 1) holding the store name and logo;
  read on the server via `src/lib/store-settings.ts`. Client components use the
  pure helpers in `src/lib/branding.ts` instead — importing the former would
  pull `pg` into the browser bundle.
- The storefront page server-renders products straight from the database; every
  product click logs a row in `product_views` (feeding "most viewed" analytics),
  and the demo checkout writes an order with price snapshots and decrements stock.
- Dashboard mutations use Server Actions; the storefront uses two small route
  handlers (`/api/views`, `/api/orders`).
