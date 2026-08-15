/**
 * Shared connection helper for the scripts, mirroring src/db/index.ts:
 * Neon hosts go over the WebSocket driver (port 443), everything else uses
 * node-postgres on 5432.
 */
import { Pool as PgPool } from "pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

/** Neon's URLs carry channel_binding, which node-postgres can't satisfy. */
export function connectionStringFor(which = "pooled") {
  const raw =
    which === "unpooled"
      ? (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)
      : process.env.DATABASE_URL;

  if (!raw) throw new Error("DATABASE_URL is not set");

  try {
    const url = new URL(raw);
    url.searchParams.delete("channel_binding");
    return url.toString();
  } catch {
    return raw;
  }
}

export function createPool(which = "pooled") {
  const connectionString = connectionStringFor(which);
  let hostname = "";
  try {
    hostname = new URL(connectionString).hostname;
  } catch {
    /* key=value connection string */
  }

  if (hostname.endsWith(".neon.tech")) {
    if (typeof globalThis.WebSocket === "undefined") {
      neonConfig.webSocketConstructor = ws;
    }
    return new NeonPool({ connectionString });
  }
  return new PgPool({ connectionString });
}
