import { defineConfig } from "vitest/config";

export default defineConfig({
  // `.mts` so the config is loaded as ESM; the package is CommonJS by default
  resolve: {
    // resolves the "@/*" alias from tsconfig.json
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
