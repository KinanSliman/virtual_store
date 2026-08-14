import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Reuse the pool across dev hot reloads so we don't exhaust connections.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

/**
 * Neon hands out connection strings containing `channel_binding=require`.
 * node-postgres doesn't implement SCRAM channel binding, so it can't satisfy
 * that requirement and the connection is refused. TLS is still enforced by the
 * `sslmode` parameter, which is left untouched.
 */
function normalizeConnectionString(value: string): string {
  try {
    const url = new URL(value);
    url.searchParams.delete("channel_binding");
    return url.toString();
  } catch {
    return value; // key=value form rather than a URL; pass it through
  }
}

const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) {
  // Without this the failure surfaces as an opaque ECONNREFUSED to
  // localhost:5432, which is a confusing way to learn the variable is unset
  // on a deployment.
  throw new Error(
    "DATABASE_URL is not set. Point it at a Postgres instance the server can " +
      "reach — a local one in development, a hosted one when deployed.",
  );
}

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: normalizeConnectionString(rawConnectionString),
    // Serverless invocations are short-lived and each instance gets its own
    // pool, so keep the per-instance footprint small.
    max: process.env.NODE_ENV === "production" ? 3 : 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
export * from "./schema";
