/**
 * Runs a .sql file against the database in DATABASE_URL.
 *
 *   node --env-file=.env scripts/apply-sql.mjs neon-setup.sql
 */
import { readFile } from "node:fs/promises";
import { createPool } from "./db-url.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node --env-file=.env scripts/apply-sql.mjs <file.sql>");
  process.exit(1);
}

const sql = await readFile(file, "utf8");
const pool = createPool();

try {
  await pool.query(sql);
  console.log(`applied ${file}`);

  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' ORDER BY table_name`,
  );
  console.log(`tables: ${rows.map((r) => r.table_name).join(", ")}`);
  for (const { table_name: name } of rows) {
    if (name.includes("drizzle")) continue;
    const count = await pool.query(`SELECT count(*)::int AS n FROM "${name}"`);
    console.log(`  ${name}: ${count.rows[0].n} rows`);
  }
} catch (error) {
  console.error("FAILED:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
