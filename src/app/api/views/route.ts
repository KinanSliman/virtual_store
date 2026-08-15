import { NextResponse } from "next/server";
import { db, productViews } from "@/db";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/** A shopper browsing quickly clicks a few products a second at most. */
const VIEW_LIMIT = 60;
const VIEW_WINDOW_MS = 60_000;

/** Logs a product click in the 3D store; feeds the "most viewed" analytics. */
export async function POST(request: Request) {
  const limit = rateLimit(
    clientKey(request, "views"),
    VIEW_LIMIT,
    VIEW_WINDOW_MS,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const body = await request.json().catch(() => null);
  const productId = Number(body?.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
  }

  await db.insert(productViews).values({ productId });
  return NextResponse.json({ ok: true });
}
