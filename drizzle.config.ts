import { defineConfig } from "drizzle-kit";

/**
 * Generates plain SQL migrations for D1. They are applied with
 * `wrangler d1 migrations apply`, which is why no credentials live here —
 * wrangler already holds the account session.
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
