import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db, categories, products } from "@/db";
import { getStoreSettings } from "@/lib/store-settings";
import { VirtualStore } from "@/components/store3d/VirtualStore";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getStoreSettings();
  return {
    title: name,
    description: "Walk through a 3D grocery store and fill your cart",
  };
}

export default async function StorePage() {
  const [rows, settings] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        nameAr: products.nameAr,
        description: products.description,
        descriptionAr: products.descriptionAr,
        price: products.price,
        stock: products.stock,
        color: products.color,
        imageUrl: products.imageUrl,
        shelf: products.shelf,
        shelfSlot: products.shelfSlot,
        category: categories.name,
        categoryAr: categories.nameAr,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isActive, true))
      .orderBy(asc(products.shelf), asc(products.shelfSlot)),
    getStoreSettings(),
  ]);

  return <VirtualStore products={rows} settings={settings} />;
}
