import { defineConfig } from "vitest/config";
import path from "node:path";

// Integration tests hit a REAL local Supabase (supabase start). They are kept out of
// the default unit run (vitest.config.ts includes only *.test.ts) and only match
// *.itest.ts here. Run with: npm run test:integration (after `npm run db:start`).
// Each suite self-skips when the required env vars are absent.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.itest.ts"],
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
