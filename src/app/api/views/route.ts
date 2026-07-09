import { NextResponse } from "next/server";
import { db, productViews } from "@/db";

/** Logs a product click in the 3D store; feeds the "most viewed" analytics. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const productId = Number(body?.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
  }

  await db.insert(productViews).values({ productId });
  return NextResponse.json({ ok: true });
}
