/**
 * Reports which tables exist and how many rows they hold.
 *
 *   node --env-file=.env scripts/db-status.mjs
 */
import { createPool, connectionStringFor } from "./db-url.mjs";

const pool = createPool(process.argv[2]);

try {
  const { rows: tables } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name`,
  );

  console.log(`host: ${new URL(connectionStringFor(process.argv[2])).host}`);
  console.log(
    `tables: ${tables.length ? tables.map((t) => t.table_name).join(", ") : "(none)"}`,
  );

  for (const { table_name: name } of tables) {
    if (name.includes("drizzle")) continue;
    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM "${name}"`);
    console.log(`  ${name}: ${rows[0].n} rows`);
  }
} finally {
  await pool.end();
}
