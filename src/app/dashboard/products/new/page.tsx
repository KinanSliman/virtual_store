import { asc } from "drizzle-orm";
import { db, categories } from "@/db";
import { createProduct } from "@/app/dashboard/actions";
import { ProductForm } from "@/components/dashboard/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.name));

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold tracking-tight">
        New product
      </h2>
      <ProductForm categories={cats} action={createProduct} />
    </div>
  );
}
