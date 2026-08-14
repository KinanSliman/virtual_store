/** Reports which tables exist and how many rows they hold. */
import { Client } from "pg";
import { connectionStringFor } from "./db-url.mjs";

const url = connectionStringFor(process.argv[2]);
const client = new Client({ connectionString: url, connectionTimeoutMillis: 15000 });
await client.connect();

const { rows: tables } = await client.query(
  `SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' ORDER BY table_name`,
);

console.log(`host: ${new URL(url).host}`);
console.log(
  `tables: ${tables.length ? tables.map((t) => t.table_name).join(", ") : "(none)"}`,
);

for (const { table_name: name } of tables) {
  if (name.includes("drizzle")) continue;
  const { rows } = await client.query(`SELECT count(*)::int AS n FROM "${name}"`);
  console.log(`  ${name}: ${rows[0].n} rows`);
}

await client.end();
