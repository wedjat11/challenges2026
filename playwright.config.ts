import { defineConfig, devices } from "@playwright/test";

/**
 * challenge-participation: Automated End-to-End Coverage of Create-Then-Join.
 * design.md §9 (S7) — pinned verbatim, no invented options.
 *
 * `testDir: "e2e"` keeps this scoped away from Vitest's `src/**\/*.test.ts`
 * suite entirely (confirmed by the RED run: without it, Playwright's default
 * test-file glob also matched every Vitest spec in `src/`, which then failed
 * to load under Playwright's own runner). `fullyParallel: false` because
 * every spec shares one local D1 file seeded once by `globalSetup`.
 *
 * Both projects are chromium, matching design-system: Mobile-First
 * Responsive Contract's two viewports (390px, ~1200px desktop) — a second
 * browser engine tests nothing this change decides.
 *
 * **Deviation, stated plainly**: design.md pins only `fullyParallel: false`
 * with the comment "one shared local D1 file", but that setting alone does
 * not serialize the two *projects* below — Playwright still runs each
 * project's own copy of this spec in its own worker by default, confirmed
 * directly: a first run produced two challenges with the identical
 * `Date.now()`-based title, because the `mobile` and `desktop` workers hit
 * `/challenges/new` at the same real-clock millisecond against the one
 * shared local D1. `workers: 1` is the setting that actually delivers what
 * the design's own comment intends (one test running against the shared
 * database at a time); it is additive, not a removal of anything pinned.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  globalSetup: "./e2e/global-setup.ts",
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  projects: [
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: false },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
