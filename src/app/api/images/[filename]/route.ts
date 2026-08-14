import { eq } from "drizzle-orm";
import { db, images } from "@/db";
import {
  CONTENT_TYPE_BY_EXTENSION,
  UPLOAD_FILENAME_PATTERN,
} from "@/lib/uploads-server";

/** Serves product images uploaded through the dashboard. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  const match = UPLOAD_FILENAME_PATTERN.exec(filename);
  if (!match) {
    return new Response("Not found", { status: 404 });
  }
  const [, id, extension] = match;

  const [row] = await db
    .select({ data: images.data, contentType: images.contentType })
    .from(images)
    .where(eq(images.id, id));

  if (!row) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type":
        row.contentType || CONTENT_TYPE_BY_EXTENSION[extension],
      // ids are UUIDs, so a stored image never changes under its URL
      "Cache-Control": "public, max-age=31536000, immutable",
      // an uploaded SVG can carry script; neutralize it if opened directly
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
