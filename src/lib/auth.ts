import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Password gate for the dashboard.
 *
 * The storefront is public; everything under /dashboard mutates the catalogue
 * and so sits behind a single shared password, set in DASHBOARD_PASSWORD.
 *
 * The session is a signed cookie rather than server-side state: there's one
 * account, so there's nothing to look up, and a stateless token keeps the
 * serverless deployment free of a session store. The signing key is derived
 * from the password itself, which means changing the password invalidates
 * every existing session.
 */

export const SESSION_COOKIE = "vs_dashboard";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // a week

function password(): string | undefined {
  const value = process.env.DASHBOARD_PASSWORD;
  return value && value.length > 0 ? value : undefined;
}

/** False when DASHBOARD_PASSWORD is unset. */
export function isAuthConfigured(): boolean {
  return password() !== undefined;
}

/**
 * Whether an unauthenticated request may reach the dashboard.
 *
 * Development without a password configured stays open, so a fresh clone runs
 * without ceremony. Production fails closed: an unconfigured deployment locks
 * the dashboard rather than publishing it to everyone.
 */
export function allowsUnauthenticatedAccess(): boolean {
  return !isAuthConfigured() && process.env.NODE_ENV !== "production";
}

function sign(value: string, key: string): string {
  return createHmac("sha256", key).update(value).digest("hex");
}

function equals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // timingSafeEqual throws on a length mismatch, which is itself a leak-free
  // signal here: differing lengths already mean the values differ.
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Constant-time password check. */
export function verifyPassword(candidate: string): boolean {
  const expected = password();
  if (!expected) return false;
  return equals(candidate, expected);
}

/** `<expiry>.<signature>`, signed with a key derived from the password. */
export function createSessionToken(now = Date.now()): string {
  const secret = password();
  if (!secret) throw new Error("DASHBOARD_PASSWORD is not set");
  const expiresAt = String(now + SESSION_MAX_AGE_SECONDS * 1000);
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  now = Date.now(),
): boolean {
  const secret = password();
  if (!secret || !token) return false;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return false;

  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!equals(signature, sign(expiresAt, secret))) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && expiry > now;
}
