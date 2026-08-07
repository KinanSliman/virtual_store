/**
 * Shared upload constants. No Node built-ins here — this module is
 * imported by client components too (see uploads-server.ts for the
 * filesystem side).
 */

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB

/** Accepted image MIME types mapped to the extension we store them as. */
export const ACCEPTED_IMAGE_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
} as const;

export type AcceptedImageType = keyof typeof ACCEPTED_IMAGE_TYPES;

/** Value for an <input type="file"> accept attribute. */
export const ACCEPT_ATTRIBUTE = Object.keys(ACCEPTED_IMAGE_TYPES).join(",");

/** Uploaded images are served by the /api/images route handler. */
export const UPLOAD_URL_PREFIX = "/api/images/";

/** True for images this app stored on disk (not the seeded /products/*.svg). */
export function isUploadedImage(url: string | null): boolean {
  return typeof url === "string" && url.startsWith(UPLOAD_URL_PREFIX);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
