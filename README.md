# 🛒 Fresh Mart — Virtual Grocery Store

A portfolio project: a **3D grocery store you can walk through in the browser**, backed by a PostgreSQL database and a management dashboard.

| Route | What it is |
|---|---|
| `/` | The 3D storefront — walk in, browse two shelves, click products, fill a cart, demo checkout (no payment) |
| `/dashboard` | Product CRUD — create, edit, delete, stock, shelf placement, image upload |
| `/dashboard/analytics` | Revenue per day, top sellers, most-viewed products, stock by category, low-stock alerts |

## Controls (3D store)

- **W A S D** or **arrow keys** — move
- **Hold left mouse button + drag** — look around
- **Click a product** — description popup, add to cart

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

PNG, JPEG, WebP, GIF, and SVG are accepted, up to 4MB (`serverActions.bodySizeLimit`
in `next.config.ts` allows 5MB of request body to leave room for form overhead).
Replacing or removing an image — or deleting the product — also deletes the file
from disk. Seeded illustrations are never deleted.

## How data flows

- `src/db/schema.ts` is the single source of truth: `categories`, `products`,
  `orders`, `order_items`, `product_views`.
- The storefront page server-renders products straight from the database; every
  product click logs a row in `product_views` (feeding "most viewed" analytics),
  and the demo checkout writes an order with price snapshots and decrements stock.
- Dashboard mutations use Server Actions; the storefront uses two small route
  handlers (`/api/views`, `/api/orders`).
