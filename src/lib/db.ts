import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "@/db/schema";

/**
 * The application's Drizzle instance, bound to the D1 database Cloudflare
 * hands the worker at request time.
 *
 * `getCloudflareContext({ async: true })` works under both `wrangler dev` and
 * plain `next dev`, because `next.config.ts` calls
 * `initOpenNextCloudflareForDev()`. Centralised here so every task after this
 * one that needs the database — not just auth — asks one place for it,
 * instead of each repeating the same two lines.
 */
export async function getAppDb() {
  const { env } = await getCloudflareContext({ async: true });
  return drizzle(env.DB, { schema });
}
