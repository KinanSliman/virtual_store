/**
 * Storage side of product image uploads. Server-only — do not import from a
 * client component.
 *
 * Images are rows in the `images` table, not files on disk: a serverless
 * deployment has a read-only filesystem and no storage shared between
 * requests, so anything written would fail or disappear. They're served by
 * src/app/api/images/[filename]/route.ts.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, images } from "@/db";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  UPLOAD_URL_PREFIX,
  formatBytes,
  isUploadedImage,
  type AcceptedImageType,
} from "./uploads";

/**
 * Names we generate, and the only shape the serving route will accept:
 * a UUID plus a known extension.
 */
export const UPLOAD_FILENAME_PATTERN =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(png|jpg|webp|gif|svg)$/;

export const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export type SaveResult = { url: string } | { error: string };

/** Returns the image id encoded in an /api/images/ URL, if it is one. */
export function imageIdFromUrl(url: string | null): string | null {
  if (!isUploadedImage(url)) return null;
  const match = UPLOAD_FILENAME_PATTERN.exec(url!.slice(UPLOAD_URL_PREFIX.length));
  return match ? match[1] : null;
}

/** Stores an uploaded image and returns the URL to serve it from. */
export async function saveUploadedImage(file: File): Promise<SaveResult> {
  const extension = ACCEPTED_IMAGE_TYPES[file.type as AcceptedImageType];
  if (!extension) {
    return {
      error: `Unsupported image type "${file.type || "unknown"}". Use PNG, JPEG, WebP, GIF, or SVG.`,
    };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      error: `Image is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
    };
  }
  if (file.size === 0) {
    return { error: "That file is empty." };
  }

  // The id comes from randomUUID, never from the upload's own filename, so
  // there's nothing user-controlled in the URL.
  const id = randomUUID();
  const data = Buffer.from(await file.arrayBuffer());
  await db.insert(images).values({
    id,
    extension,
    contentType: file.type,
    data,
    byteSize: data.byteLength,
  });

  return { url: `${UPLOAD_URL_PREFIX}${id}.${extension}` };
}

/**
 * Deletes a previously uploaded image. Silently ignores URLs that aren't ours
 * (the seeded /products/*.svg illustrations stay put) and rows already gone.
 */
export async function deleteUploadedImage(url: string | null): Promise<void> {
  const id = imageIdFromUrl(url);
  if (!id) return;
  await db.delete(images).where(eq(images.id, id));
}
