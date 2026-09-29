import { execFileSync } from "node:child_process";

/**
 * D17 — seeds local D1 through `wrangler d1 execute --local`, run once
 * before the whole suite (fullyParallel: false shares one local D1 file).
 *
 * `execFileSync` with a fixed argv array, never a shell string: every
 * argument below is a literal, nothing from `seed.sql`'s contents or any
 * env var is ever interpolated into the command line (threat matrix:
 * Test-time subprocess — interpolated SQL / silent-no-op seed / missing
 * wrangler). `--local` only, never `--remote`.
 *
 * The read-back matters because a seed that silently did nothing produces a
 * confusing test failure three steps later, not here.
 */
export default function globalSetup(): void {
  execFileSync(
    "pnpm",
    ["exec", "wrangler", "d1", "execute", "DB", "--local", "--file", "e2e/fixtures/seed.sql"],
    { stdio: "inherit" },
  );

  const output = execFileSync(
    "pnpm",
    [
      "exec",
      "wrangler",
      "d1",
      "execute",
      "DB",
      "--local",
      "--command",
      "SELECT id FROM users WHERE id = 'e2e-user-a'",
      "--json",
    ],
    { encoding: "utf8" },
  );

  const rows: unknown = JSON.parse(output);
  const found =
    Array.isArray(rows) &&
    rows.length > 0 &&
    Array.isArray((rows[0] as { results?: unknown[] })?.results) &&
    ((rows[0] as { results: unknown[] }).results.length > 0);

  if (!found) {
    throw new Error(
      "e2e seed did not apply: 'e2e-user-a' is missing from local D1 after running e2e/fixtures/seed.sql.",
    );
  }
}
