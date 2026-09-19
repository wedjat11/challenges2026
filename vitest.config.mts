import { defineConfig } from "vitest/config";

// .mts rather than .ts: Vite's native config loader would otherwise treat this
// ESM file as CommonJS and warn.
export default defineConfig({
  resolve: {
    // Resolves the "@/*" alias from tsconfig, so tests import exactly the way
    // application code does. Native since Vite 8 — no plugin needed.
    tsconfigPaths: true,
  },
  test: {
    // The domain layer is pure: no DOM, no network, no Cloudflare bindings.
    // Component tests (S1+) render server components via react-dom/server's
    // renderToStaticMarkup, which needs no DOM — so they stay on this same
    // "node" environment rather than pulling in jsdom/happy-dom.
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", ".open-next/**", ".wrangler/**"],
  },
});
