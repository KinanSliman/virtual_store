/**
 * Migrates images previously written to the `uploads/` directory into the
 * `images` table, so URLs stored on products keep working after the switch to
 * database-backed image storage.
 *
 * Safe to run more than once — existing rows are left alone.
 *
 *   node --env-file=.env scripts/import-uploads.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const FILENAME_PATTERN =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(png|jpg|webp|gif|svg)$/;
const CONTENT_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

let files;
try {
  files = await readdir(UPLOAD_DIR);
} catch {
  console.log("No uploads/ directory — nothing to import.");
  process.exit(0);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

let imported = 0;
let skipped = 0;
for (const file of files) {
  const match = FILENAME_PATTERN.exec(file);
  if (!match) continue;
  const [, id, extension] = match;

  const existing = await client.query("SELECT 1 FROM images WHERE id = $1", [id]);
  if (existing.rowCount > 0) {
    skipped++;
    continue;
  }

  const data = await readFile(path.join(UPLOAD_DIR, file));
  await client.query(
    `INSERT INTO images (id, extension, content_type, data, byte_size)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, extension, CONTENT_TYPES[extension], data, data.byteLength],
  );
  imported++;
}

console.log(`imported ${imported} image(s), skipped ${skipped} already present`);
await client.end();
