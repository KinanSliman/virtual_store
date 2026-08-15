import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  allowsUnauthenticatedAccess,
  verifySessionToken,
} from "./auth";

/**
 * Server-side session check, kept separate from auth.ts so the crypto there
 * stays pure and unit-testable.
 */
export async function hasDashboardSession(): Promise<boolean> {
  if (allowsUnauthenticatedAccess()) return true;
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

/**
 * Guards a mutation. The proxy already redirects unauthenticated page
 * requests, but Next's own documentation calls that an optimistic check —
 * it runs before the request reaches the action, so each mutation re-checks
 * rather than trusting that the caller came through a guarded page.
 */
export async function requireDashboardSession(): Promise<void> {
  if (!(await hasDashboardSession())) {
    throw new Error("Not authorised. Sign in to the dashboard first.");
  }
}
