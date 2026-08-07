import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  CONTENT_TYPE_BY_EXTENSION,
  UPLOAD_DIR,
  UPLOAD_FILENAME_PATTERN,
} from "@/lib/uploads-server";

/** Serves product images uploaded through the dashboard. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!UPLOAD_FILENAME_PATTERN.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  let data: Buffer;
  try {
    data = await readFile(path.join(UPLOAD_DIR, filename));
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const extension = filename.split(".").pop()!;
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": CONTENT_TYPE_BY_EXTENSION[extension],
      // filenames are UUIDs, so a stored image never changes under its URL
      "Cache-Control": "public, max-age=31536000, immutable",
      // an uploaded SVG can carry script; neutralize it if opened directly
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
