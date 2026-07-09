import { defineConfig } from "drizzle-kit";

// Node 22+: load .env without a dotenv dependency
process.loadEnvFile(".env");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
