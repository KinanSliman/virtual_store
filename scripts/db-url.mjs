/**
 * Picks a connection string and makes it usable by node-postgres.
 *
 * Neon's copy-paste URLs carry `channel_binding=require`. node-postgres does
 * not implement SCRAM channel binding, so the handshake stalls rather than
 * failing cleanly; dropping the parameter (TLS is still required via
 * `sslmode`) makes the connection work.
 */
export function connectionStringFor(which = "pooled") {
  const raw =
    which === "unpooled"
      ? (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)
      : process.env.DATABASE_URL;

  if (!raw) throw new Error("DATABASE_URL is not set");

  const url = new URL(raw);
  url.searchParams.delete("channel_binding");
  return url.toString();
}
