/**
 * Filesystem side of product image uploads. Server-only — do not import
 * from a client component.
 *
 * Files live in an `uploads/` directory outside `public/` so that writing
 * one doesn't trip the dev server's file watcher, and so user uploads never
 * land in the repo. They're served by src/app/api/images/[filename]/route.ts.
 */
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  UPLOAD_URL_PREFIX,
  formatBytes,
  isUploadedImage,
  type AcceptedImageType,
} from "./uploads";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

/**
 * Names we generate, and the only shape the serving route will accept:
 * a UUID plus a known extension. Anything else — including any path
 * separator or `..` — is rejected before touching the filesystem.
 */
export const UPLOAD_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|gif|svg)$/;

export const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

export type SaveResult = { url: string } | { error: string };

/** Writes an uploaded image to disk and returns the URL to serve it from. */
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

  // The stored name comes from randomUUID, never from the upload's own
  // filename, so there's nothing user-controlled in the path.
  const filename = `${randomUUID()}.${extension}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(
    path.join(UPLOAD_DIR, filename),
    new Uint8Array(await file.arrayBuffer()),
  );

  return { url: `${UPLOAD_URL_PREFIX}${filename}` };
}

/**
 * Deletes a previously uploaded file. Silently ignores URLs that aren't
 * ours (the seeded /products/*.svg illustrations stay put) and files that
 * are already gone.
 */
export async function deleteUploadedImage(url: string | null): Promise<void> {
  if (!isUploadedImage(url)) return;
  const filename = url!.slice(UPLOAD_URL_PREFIX.length);
  if (!UPLOAD_FILENAME_PATTERN.test(filename)) return;
  await unlink(path.join(UPLOAD_DIR, filename)).catch(() => {});
}
