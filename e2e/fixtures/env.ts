import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * A minimal `KEY=VALUE` reader over one env-style file. Not a parser for
 * quoting, escaping, or multi-line values — `.dev.vars`/`.env.local` in this
 * project never need those, and `next dev` (under
 * `initOpenNextCloudflareForDev()`) and wrangler read the same two files, so
 * this fixture and the app agree on `AUTH_SECRET` without a new dependency
 * (design.md §9).
 */
function readEnvFile(path: string): Record<string, string> {
  let contents: string;
  try {
    contents = readFileSync(path, "utf8");
  } catch {
    return {};
  }

  const entries: Record<string, string> = {};
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    const eq = trimmed.indexOf("=");
    if (!trimmed || trimmed.startsWith("#") || eq === -1) continue;
    entries[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return entries;
}

/**
 * Reads `key` from `.dev.vars` then `.env.local` (repo root), throwing a
 * named error when neither has it — a confusing "session cookie decrypt
 * failed three steps later" is worse than failing loudly right here.
 */
export function requireEnv(key: string): string {
  const devVars = readEnvFile(resolve(process.cwd(), ".dev.vars"));
  const envLocal = readEnvFile(resolve(process.cwd(), ".env.local"));
  const value = devVars[key] ?? envLocal[key];

  if (!value) {
    throw new Error(`Missing required env var "${key}" — set it in .dev.vars or .env.local.`);
  }
  return value;
}
