# Apply progress: challenge-ui

Change: `challenge-ui` · Store: hybrid (this file + Engram topic `sdd/challenge-ui/apply-progress`, project `challenges2026`)

## Status

**1/8 slices complete.** Phase S0 (design foundation) is done: 9/9 tasks (0.1–0.9). Delivered as two chained PRs from the tracker `feat/challenge-ui`: `feat/challenge-ui-s0a-design-tokens` (tokens) and `feat/challenge-ui-s0b-fonts-shell` (fonts, shell, lint ignore) — see "Review budget measurement".

## Completed: Phase S0 — Design foundation

- [x] 0.1 Vendored `src/styles/tokens/colors.css` byte-for-byte (verified with `diff`, identical).
- [x] 0.2 Vendored `typography.css`, `spacing.css`, `radius.css`, `elevation.css`, `motion.css`, `base.css` byte-for-byte (verified with `diff`, identical).
- [x] 0.3 Created `src/styles/tokens/app-aliases.css` — 30 `--bal-*` declarations (one per Tailwind-namespace collision: `--font-*`, `--text-*`, `--tracking-*`, `--radius-*`, `--shadow-*`, `--container-*`, `--ease-*`), plus the D3 `--bal-text-body-color`/`--bal-text-body-size` split with the `[data-theme="light"]` override.
- [x] 0.4 Created `src/styles/tokens/app-fonts.css` — real `--font-display`/`--font-body`/`--font-mono` custom properties bound to the `next/font` variables, so the vendored (unedited) `base.css` keeps resolving them directly; `app-aliases.css` re-exports these three under `--bal-font-*` for `@theme inline`.
- [x] 0.5 Created `src/app/fonts.ts` (three `next/font/local` declarations) and downloaded the fonts — see "Font files" below.
- [x] 0.6 Replaced `src/app/globals.css` in full, matching design.md §1 exactly (import order, full `@theme inline` map, D7 `dark` shim, `color-scheme: dark`).
- [x] 0.7 Modified `src/app/layout.tsx`: Geist replaced by the three self-hosted variables, `<SiteHeader />` mounted before `{children}`, `<SiteFooter />` kept after.
- [x] 0.8 Created `src/components/site-header.tsx` — server component, sticky/blur header, three destinations + `<AuthStatus />`. **Deviation**: the design's "collapse to `IconButton`s below `sm:`" is implemented with three small inline placeholder SVG glyphs (grid/plus/user), not the vendored Lucide `Icon`/`IconButton` primitives — those ship in S1, and S0 has no dependency on S1 per the slice ordering graph. Noted below under Deviations.
- [x] 0.9 Verified — see Verification below.

## TDD Cycle Evidence

Strict TDD is active project-wide, but S0 is CSS, fonts, a layout edit and one server component with no domain/application/adapter logic — there is no pure function or branching behavior to unit-test under Vitest. Per the phase brief, this is stated explicitly rather than inventing a test:

| Task | Test File | Layer | Note |
|---|---|---|---|
| 0.1–0.6 (tokens/CSS) | N/A | N/A | CSS custom properties and `@theme inline` mappings — no unit under Vitest resolves computed styles; verified by `pnpm build` (Tailwind compiles the theme without error) and the manual/smoke render check |
| 0.7 (layout.tsx) | N/A | N/A | JSX composition change only (font variables, `<SiteHeader/>` mount) — no branching logic; verified by `pnpm build` + `pnpm typecheck` + the smoke-check HTML containing the three font-variable classes |
| 0.8 (site-header.tsx) | N/A | N/A | Server component, no state, no branching beyond a static `.map()` over a fixed 3-item array — no unit worth asserting beyond typecheck/lint/build; verified by the smoke check (`/` returns 200, header renders as part of the page) |

Safety net: `pnpm test` was run before and after this slice — 275/275 passed both times (no pre-existing domain/application/adapter test was touched by S0, so no regression risk existed in that layer).

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm test` → `Test Files 24 passed (24)`, `Tests 275 passed (275)` — unchanged from baseline; S0 adds no new Vitest-testable unit (see TDD table) |
| Runtime harness command/scenario and exact result | `pnpm exec next dev --port 3100`; `curl http://localhost:3100/` → 200, HTML `<html>` class contains `spacegrotesk_..._variable instrumentsans_..._variable jetbrainsmono_..._variable`; `curl -o /dev/null -w '%{http_code}' http://localhost:3100/account` → `200` |
| Rollback boundary | Revert `src/app/globals.css`, `src/app/layout.tsx` to their pre-S0 state and delete `src/app/fonts.ts`, `src/app/fonts/`, `src/styles/tokens/`, `src/components/site-header.tsx`. Nothing else in the repo imports any of these new files yet (S1+ have not landed), so this is a clean, self-contained revert per the proposal's rollback plan. |

## Verification (S0, task 0.9)

| Command | Result |
|---|---|
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean |
| `pnpm lint` | exit 0 after adding `design/**` to `eslint.config.mjs`'s ignores (the read-only design export is never imported at runtime). Before that ignore, the only findings were inside `design/`; `pnpm exec eslint src` was already clean. |
| `pnpm build` | exit 0 — compiled successfully, all 6 existing routes (`/`, `/_not-found`, `/account`, `/api/auth/[...nextauth]`, `/privacy`, `/terms`) generated |
| `pnpm exec opennextjs-cloudflare build` | exit 0 — `Worker saved in .open-next/worker.js`, `OpenNext build complete` |
| `pnpm test` | exit 0 — `Test Files 24 passed (24)`, `Tests 275 passed (275)` (matches the required baseline) |
| `rg -n "fonts.googleapis.com\|unpkg.com" .next/ .open-next/ --glob '!**/*.map'` | `fonts.googleapis.com`: **0 matches**. `unpkg.com`: 3 matches, all inside `next-auth`'s own bundled default sign-in HTML, behind a `enableConditionalUI && simpleWebAuthnBrowserVersion` guard for a WebAuthn provider this project does not configure (Discord-only `auth.ts`) — pre-existing to the `next-auth` dependency, unrelated to S0 or to the design-system's icon-CDN requirement (icons are S1 scope). |
| Manual smoke check | `next dev --port 3100`; `curl /` → 200, HTML confirms the three self-hosted font CSS-variable classes on `<html>`; `curl -o /dev/null -w '%{http_code}' /account` → `200`. Pixel-level 390px/desktop/light-OS-profile rendering remains the owner's manual check per the phase brief. |

## Font files

Source builds downloaded from the public `google/fonts` GitHub repository (SIL OFL 1.1), `ofl/<family>/` variable TrueType, then subset to the latin range and packed as variable `woff2` with fontTools 4.65.0 (design.md §2 specifies latin-subset variable `woff2`). The TTFs are not committed; the subsetting command is recorded in `src/app/fonts/README.md`.

| Committed file | Size | Source (raw.githubusercontent.com/google/fonts/main/…) | Source commit | Axes kept |
|---|---|---|---|---|
| `SpaceGrotesk-Variable.woff2` | 26,528 B | `ofl/spacegrotesk/SpaceGrotesk[wght].ttf` (136,676 B) | `00a38a53f92aef923b9353f40128e8f4552ddae4` | wght 300–700 |
| `InstrumentSans-Variable.woff2` | 77,144 B | `ofl/instrumentsans/InstrumentSans[wdth,wght].ttf` (194,336 B) | `0b58fb370093f9a9f4ff785d94405710b79de67c` | wdth 75–100, wght 400–700 |
| `JetBrainsMono-Variable.woff2` | 40,232 B | `ofl/jetbrainsmono/JetBrainsMono[wght].ttf` (187,208 B) | `6e4b84c976cadb3c49a40fd9a1c203e4f7fcf2da` | wght 100–800 |

Plus `OFL-SpaceGrotesk.txt`, `OFL-InstrumentSans.txt`, `OFL-JetBrainsMono.txt` (verbatim SIL OFL 1.1 text) and `src/app/fonts/README.md` recording source, commit, date and the subsetting command. Italic Instrument Sans exists upstream but is not vendored — nothing in this change's screens uses italic text.

*Correction (orchestrator, 2026-09-19):* the first apply pass shipped the raw TTFs on the orchestrator's instruction, not on any authorization in the design or tasks, and the earlier text here claimed otherwise. The gate caught it; the fonts were re-vendored as latin-subset `woff2` so the artifact matches design.md §2 and the `design-system` spec.

## Review budget measurement

Measured on the corrected tree (fonts excluded from the count): about 626 authored lines across the whole of S0 — over the 400-line budget as one PR. The first apply pass claimed no honest split existed; the gate reproduced the arithmetic and showed one does, so under `auto-chain` S0 is delivered as two chained PRs:

| Sub-slice | Files | Authored lines | Builds alone because |
|---|---|---|---|
| **S0a — vendored tokens** | `src/styles/tokens/{colors,typography,spacing,radius,elevation,motion,base}.css` (byte-for-byte, D1), `src/styles/tokens/app-aliases.css` (D2/D3), `src/styles/tokens/app-fonts.css` (D4) | ~289 | nothing imports `src/styles/` until S0b; `pnpm typecheck && pnpm lint && pnpm build` unaffected |
| **S0b — fonts and shell** | `src/app/fonts.ts`, `src/app/fonts/*` (binaries excluded from the count), `src/app/globals.css`, `src/app/layout.tsx`, `src/components/site-header.tsx`, `eslint.config.mjs` (`design/**` ignore) | ~340 | imports S0a's files, which already exist on its base branch |

Neither needs a `size:exception`. Branches: `feat/challenge-ui-s0a-design-tokens` (PR targets the tracker `feat/challenge-ui`), then `feat/challenge-ui-s0b-fonts-shell` (PR targets S0a's branch), per `feature-branch-chain`.

## Deviations from design

1. **`site-header.tsx` uses inline placeholder SVG glyphs, not the vendored `Icon`/`IconButton` primitives.** Task 0.8's wording ("collapse to `IconButton`s below `sm:`") assumes S1 primitives that do not exist yet — S0 has no dependency on S1 per the slice ordering graph (`S0 ──► S1`). Building ahead of schedule would mean either duplicating Lucide glyph vendoring without S1's formal `LICENSE-lucide.txt` (task 1.1), or importing a component that doesn't exist. I implemented the same behavioral outcome (icon-only 36px tap targets below `sm:`, full text labels from `sm:` up, `aria-label` on every link) with three small original inline SVGs and a code comment pointing at S1 as the follow-up that wires in the real primitives. This is the only deviation; everything else matches design.md exactly (import order, alias names, `@theme inline` block verbatim, D7 shim, font binding chain).
2. **`eslint.config.mjs` gained a `design/**` ignore** (orchestrator, S0b). Not one of the nine S0 tasks, but required for `pnpm lint` to pass with the design export present in the repository.

## Issues found

None beyond the two deviations above.

## Remaining tasks (not in this apply)

- [ ] Phase S1 (UI primitives) — 12 tasks, depends on S0 (now unblocked)
- [ ] Phase S2 (ports + adapters) — 7 tasks, independent of S0/S1
- [ ] Phase S3a (write use cases) — 7 tasks, depends on S2
- [ ] Phase S3b (read use cases) — 7 tasks, depends on S3a
- [ ] Phase S4a (rule builder + presets) — 4 tasks, depends on S1, S3a
- [ ] Phase S4b (`/challenges/new` route) — 4 tasks, depends on S4a, S3b
- [ ] Phase S5a (`/challenges` browse) — 3 tasks, depends on S1, S3b
- [ ] Phase S5b (`/challenges/[id]` view + join) — 7 tasks (+ contingent split), depends on S1, S3b, S5a
- [ ] Phase S6 (restyle + shim removal) — 7 tasks, depends on S1, S5b
- [ ] Phase S7 (e2e) — 6 tasks, depends on S4b, S5b

## Workload / PR boundary

- Mode: chained PR slice (`feature-branch-chain`, per prompt) — PR #1, targets `feat/challenge-ui`
- Current work unit: Phase S0 — Design foundation
- Boundary: starts from the pre-S0 repo state (Geist fonts, 26-line `globals.css`, no header); ends with the full token pipeline, self-hosted fonts, and the header shell landed, buildable, and passing all verification except the two disclosed pre-existing/deviation items above
- Review budget: S0 delivered as S0a (~289) + S0b (~340), both under 400; no `size:exception` (see "Review budget measurement")
