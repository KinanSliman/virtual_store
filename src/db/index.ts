import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Reuse the pool across dev hot reloads so we don't exhaust connections.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDb.pgPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
export * from "./schema";
