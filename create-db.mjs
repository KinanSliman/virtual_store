// One-time helper: creates the database named in DATABASE_URL if it
// doesn't exist. Run with: node --env-file=.env create-db.mjs
import { Client } from "pg";

const url = new URL(process.env.DATABASE_URL);
const dbName = url.pathname.slice(1);
url.pathname = "/postgres"; // connect to the maintenance db first

const admin = new Client({ connectionString: url.toString() });

try {
  await admin.connect();
  const { rows } = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName],
  );
  if (rows.length === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database ${dbName} created.`);
  } else {
    console.log(`Database ${dbName} already exists.`);
  }
  await admin.end();
} catch (err) {
  console.error("CONNECTION FAILED:", err.message);
  process.exit(1);
}
