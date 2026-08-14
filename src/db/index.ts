import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Reuse the pool across dev hot reloads so we don't exhaust connections.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
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
    connectionString,
    // Serverless invocations are short-lived and each instance gets its own
    // pool, so keep the per-instance footprint small.
    max: process.env.NODE_ENV === "production" ? 3 : 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
export * from "./schema";
