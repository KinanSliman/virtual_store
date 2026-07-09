import { NextResponse } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";
import { db, orderItems, orders, products } from "@/db";

type CheckoutItem = { productId: number; quantity: number };

/**
 * Demo checkout — no payment. Prices are taken from the database (never
 * trusted from the client), an order snapshot is stored, and stock is
 * decremented.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawItems: unknown = body?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const items: CheckoutItem[] = [];
  for (const raw of rawItems) {
    const productId = Number((raw as CheckoutItem)?.productId);
    const quantity = Number((raw as CheckoutItem)?.quantity);
    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      quantity > 99
    ) {
      return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
    }
    items.push({ productId, quantity });
  }

  const ids = items.map((i) => i.productId);
  const dbProducts = await db
    .select({ id: products.id, price: products.price })
    .from(products)
    .where(inArray(products.id, ids));
  const priceById = new Map(dbProducts.map((p) => [p.id, p.price]));

  if (items.some((i) => !priceById.has(i.productId))) {
    return NextResponse.json({ error: "Unknown product" }, { status: 400 });
  }

  const total = items
    .reduce(
      (sum, i) => sum + Number(priceById.get(i.productId)) * i.quantity,
      0,
    )
    .toFixed(2);

  const orderId = await db.transaction(async (tx) => {
    const [order] = await tx.insert(orders).values({ total }).returning();
    await tx.insert(orderItems).values(
      items.map((i) => ({
        orderId: order.id,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: priceById.get(i.productId)!,
      })),
    );
    for (const i of items) {
      await tx
        .update(products)
        .set({ stock: sql`greatest(${products.stock} - ${i.quantity}, 0)` })
        .where(eq(products.id, i.productId));
    }
    return order.id;
  });

  return NextResponse.json({ ok: true, orderId, total });
}
