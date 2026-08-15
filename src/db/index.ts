import { drizzle as drizzlePg, NodePgDatabase } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as PgPool } from "pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema";

// Reuse the pool across dev hot reloads so we don't exhaust connections.
const globalForDb = globalThis as unknown as {
  dbInstance?: NodePgDatabase<typeof schema>;
};

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

/**
 * Neon hands out connection strings containing `channel_binding=require`.
 * node-postgres doesn't implement SCRAM channel binding, so it can't satisfy
 * that requirement. TLS is still enforced by `sslmode`, left untouched.
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

function hostOf(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

const connectionString = normalizeConnectionString(rawConnectionString);
const isNeon = hostOf(connectionString).endsWith(".neon.tech");

/**
 * Two drivers, chosen by host.
 *
 * Neon goes through @neondatabase/serverless, which carries the Postgres
 * protocol over a WebSocket on port 443. Plain Postgres needs a raw socket on
 * 5432, and plenty of networks (corporate filtering, VPNs, some ISPs) reset
 * those — the symptom is `read ECONNRESET` the moment a query runs, from a
 * host that can otherwise reach the internet fine. Port 443 goes through.
 * It is also the driver Neon recommends for serverless hosts, where each
 * invocation would otherwise pay for a fresh TCP + TLS handshake.
 *
 * Anything else — a local Postgres in development — keeps using node-postgres.
 *
 * The Neon database is cast to the node-postgres type: the two expose the same
 * query surface, and this keeps a single type flowing through the app.
 */
function createDb(): NodePgDatabase<typeof schema> {
  if (isNeon) {
    // Node 22 has a global WebSocket, but older runtimes need the polyfill.
    if (typeof globalThis.WebSocket === "undefined") {
      neonConfig.webSocketConstructor = ws;
    }
    const pool = new NeonPool({ connectionString });
    return drizzleNeon(pool, { schema }) as unknown as NodePgDatabase<
      typeof schema
    >;
  }

  const pool = new PgPool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 3 : 10,
  });
  return drizzlePg(pool, { schema });
}

export const db: NodePgDatabase<typeof schema> =
  globalForDb.dbInstance ?? createDb();

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbInstance = db;
}

export * from "./schema";
