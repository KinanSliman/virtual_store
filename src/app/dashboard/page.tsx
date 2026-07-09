import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, categories, products } from "@/db";
import { formatPrice } from "@/lib/format";
import { DeleteProductButton } from "@/components/dashboard/delete-product-button";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      stock: products.stock,
      color: products.color,
      shelf: products.shelf,
      shelfSlot: products.shelfSlot,
      isActive: products.isActive,
      category: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(asc(products.shelf), asc(products.shelfSlot), asc(products.name));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Products</h2>
        <Link
          href="/dashboard/products/new"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-500"
        >
          + New product
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-400">
          No products yet. Seed the database with{" "}
          <code className="rounded bg-neutral-800 px-1">pnpm db:seed</code> or
          create one manually.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900 text-left text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Shelf / Slot</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-900/60">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-sm"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{p.category}</td>
                  <td className="px-4 py-3">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock < 50 ? "text-amber-400" : ""}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">
                    {p.shelf} / {p.shelfSlot}
                  </td>
                  <td className="px-4 py-3">
                    {p.isActive ? (
                      <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-xs text-emerald-400">
                        active
                      </span>
                    ) : (
                      <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                        hidden
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex justify-end gap-2">
                      <Link
                        href={`/dashboard/products/${p.id}/edit`}
                        className="rounded-md border border-neutral-700 px-3 py-1 text-xs hover:bg-neutral-800"
                      >
                        Edit
                      </Link>
                      <DeleteProductButton id={p.id} name={p.name} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
