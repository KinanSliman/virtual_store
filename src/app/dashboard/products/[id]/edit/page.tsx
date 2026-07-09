import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, categories, products } from "@/db";
import { updateProduct } from "@/app/dashboard/actions";
import { ProductForm } from "@/components/dashboard/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId));
  if (!product) notFound();

  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.name));

  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold tracking-tight">
        Edit product
      </h2>
      <ProductForm
        categories={cats}
        product={product}
        action={updateProduct.bind(null, productId)}
      />
    </div>
  );
}
