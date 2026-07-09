"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, products } from "@/db";

export type ProductFormState = {
  error?: string;
};

function parseProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();
  const stock = Number(formData.get("stock") ?? 0);
  const categoryId = Number(formData.get("categoryId"));
  const color = String(formData.get("color") ?? "#22c55e");
  const shelf = Number(formData.get("shelf") ?? 1);
  const shelfSlot = Number(formData.get("shelfSlot") ?? 0);
  const isActive = formData.get("isActive") === "on";

  if (!name) return { error: "Name is required." } as const;
  if (!categoryId) return { error: "Category is required." } as const;
  const priceNum = Number(price);
  if (!price || Number.isNaN(priceNum) || priceNum < 0)
    return { error: "Price must be a non-negative number." } as const;
  if (!Number.isInteger(stock) || stock < 0)
    return { error: "Stock must be a non-negative integer." } as const;
  if (shelf !== 1 && shelf !== 2)
    return { error: "Shelf must be 1 or 2." } as const;
  if (!Number.isInteger(shelfSlot) || shelfSlot < 0 || shelfSlot > 5)
    return { error: "Shelf slot must be between 0 and 5." } as const;

  return {
    values: {
      name,
      description,
      price: priceNum.toFixed(2),
      stock,
      categoryId,
      color,
      shelf,
      shelfSlot,
      isActive,
    },
  } as const;
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await db.insert(products).values(parsed.values);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateProduct(
  id: number,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const parsed = parseProductForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await db
    .update(products)
    .set({ ...parsed.values, updatedAt: new Date() })
    .where(eq(products.id, id));
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteProduct(id: number): Promise<void> {
  // order_items reference products with ON DELETE RESTRICT — a product
  // that has been sold stays in the DB for order history; deactivate it
  // instead so it disappears from the storefront.
  try {
    await db.delete(products).where(eq(products.id, id));
  } catch {
    await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id));
  }
  revalidatePath("/dashboard");
}
