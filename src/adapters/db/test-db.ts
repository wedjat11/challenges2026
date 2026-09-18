import { readFileSync, readdirSync } from "node:fs";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@/db/schema";

/**
 * An in-memory SQLite database migrated with the same SQL D1 runs.
 *
 * Shared by every adapter test suite so each one does not re-implement
 * "apply every drizzle/*.sql file to :memory:". D1 is SQLite, so the SQL
 * under test is the SQL that ships — what this does not cover is
 * driver-level behaviour.
 *
 * Every `drizzle/NNNN_*.sql` file is replayed in filename order (drizzle-kit
 * numbers them so lexical order is migration order), not just the first one —
 * otherwise a test database would silently miss every column or table a
 * later migration added, and pass against a schema D1 no longer has.
 *
 * Callers seed their own rows: what a challenge-repository test needs
 * (users, riot accounts) is not what a user-repository test needs, so seeding
 * stays with each suite rather than living here.
 */
export async function createTestDb() {
  const client = createClient({ url: ":memory:" });

  const migrationFiles = readdirSync("drizzle")
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of migrationFiles) {
    const migration = readFileSync(`drizzle/${file}`, "utf8");
    for (const statement of migration.split("--> statement-breakpoint")) {
      const sql = statement.trim();
      if (sql) await client.execute(sql);
    }
  }

  return drizzle(client, { schema });
}
