import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db, categories, products } from "@/db";
import { VirtualStore } from "@/components/store3d/VirtualStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Virtual Grocery Store",
  description: "Walk through a 3D grocery store and fill your cart",
};

export default async function StorePage() {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      stock: products.stock,
      color: products.color,
      shelf: products.shelf,
      shelfSlot: products.shelfSlot,
      category: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isActive, true))
    .orderBy(asc(products.shelf), asc(products.shelfSlot));

  return <VirtualStore products={rows} />;
}
