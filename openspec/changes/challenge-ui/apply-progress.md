# Apply progress: challenge-ui

Change: `challenge-ui` · Store: hybrid (this file + Engram topic `sdd/challenge-ui/apply-progress`, project `challenges2026`)

## Status

**5/8 slices complete.** Phase S0 (design foundation), Phase S1 (UI primitives), Phase S2 (ports + adapters), Phase S3a (write use cases), and Phase S3b (read use cases) are done. S0: 9/9 tasks (0.1–0.9), delivered as two chained PRs from the tracker `feat/challenge-ui`: `feat/challenge-ui-s0a-design-tokens` (tokens) and `feat/challenge-ui-s0b-fonts-shell` (fonts, shell, lint ignore). S1: 12/12 tasks (1.1–1.12), delivered as **four** chained PRs (not the two the tasks-agent forecast — see "Review budget measurement (S1)"): `feat/challenge-ui-s1a-icons-button`, `feat/challenge-ui-s1b-layout-primitives`, `feat/challenge-ui-s1c-form-inputs`, `feat/challenge-ui-s1d-remaining-primitives`. S2: 7/7 tasks (2.1–2.7), delivered on branch `feat/challenge-ui-s2-ports-adapters` (one PR, under budget — see "Review budget measurement (S2)"). S3a: 7/7 tasks (3a.1–3a.7), delivered as **three** chained PRs (not the two the tasks-agent's own example suggested — see "Review budget measurement (S3a)"): `feat/challenge-ui-s3a-i-rule-codec`, `feat/challenge-ui-s3a-ii-create-challenge`, `feat/challenge-ui-s3a-iii-join-challenge`. S3b: 7/7 tasks (3b.1–3b.7), delivered as **three** chained PRs, the middle one carrying a `size:exception` (see "Review budget measurement (S3b)"): `feat/challenge-ui-s3b-i-rule-text`, `feat/challenge-ui-s3b-ii-challenge-view` (**518 lines, exception**), `feat/challenge-ui-s3b-iii-public-list`.

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

## Completed: Phase S1 — UI primitives

- [x] 1.1 Created `src/components/icons/paths.ts` — frozen (`Object.freeze` + `as const satisfies`) `ICON_PATHS` record for the 14 glyphs, copied verbatim from `lucide@0.544.0`'s `dist/esm/icons/<name>.js` sources; created `src/components/icons/LICENSE-lucide.txt` (byte-identical `diff` against the vendored package's `LICENSE`).
- [x] 1.2 Created `src/components/icons/icon.tsx` — `Icon({ name, size, strokeWidth, className, title })`, inline `<svg>`, `aria-hidden="true"` when `title` is omitted, real `<title>` + `role="img"` when supplied.
- [x] 1.3 Created `src/components/ui/button.tsx` — `variant`/`size`/`icon`/`iconAfter`/`fullWidth`/`loading`; `loading` forces `disabled` + `aria-busy="true"` + the `loader-circle` glyph; no `onClick` in the prop type (D8). Also introduced `src/lib/cn.ts`, the shared conditional class-name joiner every primitive below needed — not a numbered task, but required infrastructure (see "Utility names used / gaps (S1)").
- [x] 1.4 Created `src/components/ui/icon-button.tsx` — `label` is required, always renders `aria-label`.
- [x] 1.5 Created `src/components/ui/card.tsx` — `as: "div"|"article"|"li"`, `interactive`, `accentEdge`, no `onClick`.
- [x] 1.6 Created `src/components/ui/badge.tsx` — six tones, optional `icon`/`dot`/`pill`.
- [x] 1.7 Created `src/components/ui/tag.tsx` — remove control renders only when `removable`; `onRemove` stays a plain optional prop (D8), so a server component renders `Tag` with zero interactivity.
- [x] 1.8 Created `src/components/ui/input.tsx` — uncontrolled (D9); `error` wires `aria-invalid="true"`, `aria-describedby` to a `{id ?? name}-error` id (no `useId`), the `circle-alert` glyph, and the message; always a real `<label htmlFor>`.
- [x] 1.9 Created `src/components/ui/select.tsx` — uncontrolled native `<select>`, options rendered as real `<option>`s, `chevron-down` glyph, identical error wiring to `Input`.
- [x] 1.10 Created `src/components/ui/checkbox.tsx` and `src/components/ui/radio.tsx` — uncontrolled native inputs, real `<label htmlFor>`, optional `description`.
- [x] 1.11 Created `src/components/ui/game-tag.tsx` — text only; `queue` typed from `src/domain/match.ts`'s `Queue` union (see "Deviations from design" — `QUEUE_LABELS` does not exist until S3b).
- [x] 1.12 Verified — see "Verification (S1, task 1.12)".

Also resolved the S0 deviation recorded above: `src/components/site-header.tsx` now renders the vendored `Icon` primitive (glyphs `layout-grid`, `plus`, `user` for the three nav links, `swords` added to the wordmark lockup per design.md's icon table) instead of the three inline placeholder SVGs. Behaviour is unchanged (same three destinations, same 36px icon-only tap targets below `sm:`, same `aria-label` per link, same labels from `sm:` up).

## TDD Cycle Evidence (S1)

Strict TDD active. Every primitive followed RED (test importing the not-yet-existing module, confirmed failing) → GREEN (implementation, confirmed passing) → REFACTOR (typecheck clean, no behaviour change needed). Component tests use `react-dom/server`'s `renderToStaticMarkup` under Vitest's existing `environment: "node"` — no jsdom/happy-dom dependency added; `vitest.config.mts`'s `include` glob was widened from `src/**/*.test.ts` to also match `src/**/*.test.tsx`.

Per strict-tdd's assertion-quality rules, no test asserts a literal Tailwind/CSS class name. Variant/size/state props that have no other DOM-observable signal (e.g. `Button`'s `variant`) are proven by asserting the prop produces genuinely different rendered markup (`expect(a).not.toBe(b)`), never by pinning the exact class string; states with a real DOM signal (`disabled`, `aria-busy`, `aria-invalid`, `aria-describedby`, a rendered `<option>`, a specific glyph's `d`/`points` attribute, presence/absence of the remove `<button>`) are asserted directly.

| Task | Component | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|---|
| 1.1 | `paths.ts` | N/A | N/A | N/A (new) | — | — | Triangulation skipped: purely structural glyph data, one correct mapping, no branching | N/A |
| 1.2 | `Icon` | `icon.test.tsx` | Component (SSR markup) | N/A (new) | ✅ Written | ✅ 4/4 passed | ✅ 4 cases (aria-hidden, title, viewBox/stroke, distinct glyph data) | ➖ None needed |
| — | `cn` | `cn.test.ts` | Unit | N/A (new) | ✅ Written | ✅ 2/2 passed | ✅ 2 cases (join, drop falsy) | ➖ None needed |
| 1.3 | `Button` | `button.test.tsx` | Component (SSR markup) | N/A (new) | ✅ Written | ✅ 8/8 passed | ✅ 8 cases | ➖ None needed |
| 1.4 | `IconButton` | `icon-button.test.tsx` | Component (SSR markup) | N/A (new) | ✅ Written | ✅ 5/5 passed | ✅ 5 cases | ➖ None needed |
| 1.5 | `Card` | `card.test.tsx` | Component (SSR markup) | N/A (new) | ✅ Written | ✅ 5/5 passed | ✅ 5 cases | ➖ None needed |
| 1.6 | `Badge` | `badge.test.tsx` | Component (SSR markup) | N/A (new) | ✅ Written | ✅ 5/5 passed | ✅ 5 cases | ➖ None needed |
| 1.7 | `Tag` | `tag.test.tsx` | Component (SSR markup) | N/A (new) | ✅ Written | ✅ 5/5 passed | ✅ 5 cases | ➖ None needed |
| 1.8 | `Input` | `input.test.tsx` | Component (SSR markup) | N/A (new) | ✅ Written | ✅ 5/5 passed | ✅ 5 cases | ✅ fixed a `cn()` type error surfaced by `tsc`, tests still green |
| 1.9 | `Select` | `select.test.tsx` | Component (SSR markup) | N/A (new) | ✅ Written | ✅ 5/5 passed | ✅ 5 cases | ➖ None needed |
| 1.10 | `Checkbox` | `checkbox.test.tsx` | Component (SSR markup) | N/A (new) | ✅ Written | ✅ 3/3 passed | ✅ 3 cases | ➖ None needed |
| 1.10 | `Radio` | `radio.test.tsx` | Component (SSR markup) | N/A (new) | ✅ Written | ✅ 3/3 passed | ✅ 3 cases | ➖ None needed |
| 1.11 | `GameTag` | `game-tag.test.tsx` | Component (SSR markup) | N/A (new) | ✅ Written | ✅ 4/4 passed | ✅ 4 cases | ➖ None needed |
| — | `site-header.tsx` (glyph swap) | none | N/A | ✅ 329/329 (full suite) | N/A | N/A | N/A | See rationale below |

**`site-header.tsx` — no dedicated test, same reasoning as S0's evidence table for this file.** This is a 1:1 glyph-source swap (inline SVG → the now-existing `Icon` primitive) with no new branching logic and no change to rendered text, `href`s, or `aria-label`s. `SiteHeader` renders the async `AuthStatus` (`await auth()`) inline; `renderToStaticMarkup` cannot resolve an async Server Component the way Next's runtime does, so a direct render test would require mocking `next-auth` for a change with no new logic to protect. Verified instead by `pnpm typecheck && pnpm lint && pnpm build` and the same manual-smoke-check pattern S0 already established for this file.

### Test Summary (S1)

- **Total tests written**: 54 (icon 4, cn 2, button 8, icon-button 5, card 5, badge 5, tag 5, input 5, select 5, checkbox 3, radio 3, game-tag 4)
- **Total tests passing**: 54/54 new, 329/329 full suite (baseline 275 + 54)
- **Layers used**: Unit (`cn`, 2 tests), Component/SSR markup via `renderToStaticMarkup` (52 tests), Integration/E2E (0 — not applicable to unreferenced presentational primitives)
- **Approval tests** (refactoring): None — `site-header.tsx`'s change is covered by the rationale above, not an approval-test pair
- **Pure functions created**: 1 (`cn`)

## Work Unit Evidence (S1)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run src/components/icons src/components/ui src/lib/cn.test.ts` → 20 test files, 54 tests, all passing (run incrementally per task during RED/GREEN; full-suite confirmation: `pnpm test` → `Test Files 36 passed (36)`, `Tests 329 passed (329)`) |
| Runtime harness command/scenario and exact result | `pnpm build` → exit 0, `Route (app)` unchanged (same 6 routes, all `ƒ` dynamic, no new entry) — proven by `rg -l` showing only `site-header.tsx` (server component) and the primitives' own internal cross-imports reference the new modules; no route or client component imports them yet, so there is no new client JS chunk on `/` or `/account` by construction, not by bundle-size guesswork |
| Rollback boundary | Delete `src/components/ui/*`, `src/components/icons/*`, `src/lib/cn.ts` (+ their `.test.*` files); revert `vitest.config.mts`'s `include` glob back to `["src/**/*.test.ts"]`; revert `src/components/site-header.tsx` to its S0 state (restores the three inline placeholder SVGs). Nothing else in the repo references any of these files yet (S4a/S5a/S5b have not landed), so this reverts cleanly with no orphaned imports. |

## Verification (S1, task 1.12)

| Command | Result |
|---|---|
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean |
| `pnpm lint` | exit 0 |
| `pnpm build` | exit 0 — compiled successfully, same 6 routes as S0 (`/`, `/_not-found`, `/account`, `/api/auth/[...nextauth]`, `/privacy`, `/terms`), all still `ƒ` dynamic |
| `pnpm test` | exit 0 — `Test Files 36 passed (36)`, `Tests 329 passed (329)` (baseline 275 + 54 new) |
| `rg '"use client"' src/components/ui src/components/icons` | 0 matches (exit 1, no output) — required one round-trip fix: three doc comments *named* the directive in quotes to explain its absence, which the same `rg` pattern matched; reworded to state the same fact without the literal quoted string, re-ran clean |
| No new client JS chunk on `/` or `/account` | Confirmed by reasoning, per the phase brief's explicit fallback: `rg -l "from \"@/components/ui/\|from \"@/components/icons/icon\"" src --glob '!*.test.*'` shows only `site-header.tsx` (server component, no client-boundary directive) and the primitives' own mutual imports. No `page.tsx`, `layout.tsx`, or client component imports any S1 primitive yet — they ship unreferenced until S4a/S5a/S5b, matching the tasks-agent's own runtime-harness note for this slice. |

## Review budget measurement (S1)

Measured against `feat/challenge-ui-s0b-fonts-shell`, per-commit cumulative `git diff --stat`, excluding `openspec/` and the vendored `LICENSE-lucide.txt` (licence text, excluded per the same policy S0 used). **Total S1: ~1,336 authored lines** — far above the tasks-agent's own forecast (300–450, median 375) and above the pre-authorized two-way S1a/S1b split (tasks.md's contingent-split note assumed 1.1–1.7 alone would fit under 400; measured, it is ~754).

One honest slicing pass over the actual per-commit sizes found a **four-way** cohesive split, each slice under 400 raw changed lines with no code shrunk, no test or comment removed to fit:

| Sub-slice | Tasks | Files | Base | Raw changed lines | Builds/tests alone because |
|---|---|---|---|---|---|
| **S1a** — icons + Button | 1.1, 1.2, 1.3 (+ `src/lib/cn.ts`) | `icons/{paths.ts,icon.tsx,icon.test.tsx,LICENSE-lucide.txt}`, `ui/{button.tsx,button.test.tsx}`, `lib/cn.{ts,test.ts}`, `vitest.config.mts` | `feat/challenge-ui-s0b-fonts-shell` | 395 (356 excl. licence) | Nothing else imports `Icon`/`cn` yet; `pnpm exec tsc --noEmit` and `pnpm exec vitest run` both clean in isolation on this branch |
| **S1b** — layout/status primitives | 1.4, 1.5, 1.6, 1.7 | `ui/{icon-button,card,badge,tag}.tsx` + their tests | S1a | 398 | Each imports only `Icon`/`cn` from S1a; typecheck/test clean in isolation |
| **S1c** — form inputs | 1.8, 1.9 | `ui/{input,select}.tsx` + their tests | S1b | 269 | Each imports only `Icon`/`cn`; typecheck/test clean in isolation |
| **S1d** — remaining primitives + verify | 1.10, 1.11, 1.12, header wiring | `ui/{checkbox,radio,game-tag}.tsx` + tests, `site-header.tsx` (glyph swap), `tasks.md`, doc-comment fixes | S1c | 325 | Completes the primitive set and resolves the S0 header deviation; full `pnpm typecheck && pnpm lint && pnpm build && pnpm test` run here |

Every intermediate branch (`feat/challenge-ui-s1a-icons-button`, `feat/challenge-ui-s1b-layout-primitives`, `feat/challenge-ui-s1c-form-inputs`) was checked out and independently verified with `pnpm exec tsc --noEmit` and `pnpm exec vitest run` before this report — all three clean (289, 309, and 319 tests passing respectively, on top of the 275-test S0 baseline). `feat/challenge-ui-s1d-remaining-primitives` (current branch, was `feat/challenge-ui-s1-ui-primitives`) carries the full `pnpm typecheck && pnpm lint && pnpm build && pnpm test` run reported above.

**Deviation from the tasks-agent's forecast, stated plainly:** the pre-authorized contingent split named exactly two branches (`feat/challenge-ui-s1a-core-primitives` for 1.1–1.7, `feat/challenge-ui-s1b-form-primitives` for 1.8–1.11) and assumed measuring only once, after 1.11. Measuring after 1.7 already showed ~754 authored lines — the two-way split does not fit. No `size:exception` was needed because a cohesive four-way split *does* fit every slice under 400 with nothing shrunk; per the chained-pr skill's decision gate ("PR >400, each slice can land independently → use the split that fits"), that overrides falling back to `size:exception`. The branch names above follow the existing `s{phase}{letter}-{description}` convention (matching `feat/challenge-ui-s0a-design-tokens`/`-s0b-fonts-shell`) rather than the two originally-named branches, since those two names described a split that measurement disproved. Commit SHAs for each cut point: S1a ends at `6e15b6a`, S1b ends at `92dcd4d`, S1c ends at `cb66814`, S1d (HEAD) ends at `78c3698`.

## Utility names used / gaps (S1)

Every class is a mapped `@theme inline` utility from `globals.css` (`bg-action-primary`, `text-action-primary-fg`, `rounded-control`, `rounded-card`, `rounded-pill`, `shadow-1`/`shadow-2`/`shadow-3`, `font-display`, `font-mono`, `text-title-3`, `tracking-title`, `text-body`/`text-body-sm`/`text-body-lg`/`text-caption`/`text-micro`, `tracking-eyebrow`, `border-border-hairline`/`border-border-subtle`/`border-border-strong`/`border-border-accent`, `bg-surface-1`/`bg-surface-2`/`bg-surface-3`, `text-text-primary`/`text-text-secondary`/`text-text-muted`/`text-text-faint`/`text-text-inverse`, `bg-red-500`/`text-red-500`/`bg-red-tint`, `text-green-500`/`bg-green-tint`, `text-amber-500`/`bg-amber-tint`, `text-blue-500`/`bg-blue-tint`) or an unmapped Tailwind default (`h-8`/`h-10`/`h-12`, `px-*`/`py-*`/`gap-*` on the default 4px scale per D5, `w-full`, `disabled:opacity-38` — verified this compiles under Tailwind 4's bare-numeric opacity utility, `pnpm build` shows no warning). **No arbitrary value (`[...]`) and no inline `style` were used anywhere in `src/components/ui` or `src/components/icons`.** No token name needed by this slice was missing from `app-aliases.css`/`globals.css`'s `@theme inline` map.

## Deviations from design

1. **`site-header.tsx` used inline placeholder SVG glyphs, not the vendored `Icon`/`IconButton` primitives.** *(S0 finding.)* Task 0.8's wording ("collapse to `IconButton`s below `sm:`") assumes S1 primitives that do not exist yet — S0 has no dependency on S1 per the slice ordering graph (`S0 ──► S1`). Building ahead of schedule would mean either duplicating Lucide glyph vendoring without S1's formal `LICENSE-lucide.txt` (task 1.1), or importing a component that doesn't exist. S0 implemented the same behavioral outcome (icon-only 36px tap targets below `sm:`, full text labels from `sm:` up, `aria-label` on every link) with three small original inline SVGs and a code comment pointing at S1 as the follow-up. **Resolved in S1** (task list item above): `site-header.tsx` now imports and renders the real `Icon` primitive.
2. **`eslint.config.mjs` gained a `design/**` ignore** (orchestrator, S0b). Not one of the nine S0 tasks, but required for `pnpm lint` to pass with the design export present in the repository.
3. **`GameTag`'s `queue` prop renders the raw `Queue` string, not a human label.** *(S1 finding.)* Design.md's primitives table types `queue` from `src/domain/match.ts` but does not specify a rendering format beyond "text only"; `QUEUE_LABELS` (e.g. `"ranked-solo"` → `"Ranked Solo"`) is added in S3b task 3b.2, alongside `rule-text.ts`, and S1 has no dependency on S3b. `GameTag` renders `queue` verbatim (e.g. `"ranked-solo"`) until then. Not a spec violation — no `challenge-view`/`design-system` scenario names the queue's exact wording — but noted so S3b/S5b know to revisit `game-tag.tsx` once `QUEUE_LABELS` exists.

## Issues found

None beyond the deviations above.

## Completed: Phase S2 — Ports + adapters

- [x] 2.1 RED: added 10 failing cases to `src/adapters/db/challenge-repository.test.ts` for `listPublic` against `createTestDb()` — public + in-window appears · unlisted excluded regardless of window · not-yet-started excluded · ended excluded · `startsAt === now` included · `endsAt === now` included · ordering by `endsAt` ascending · tie on `endsAt` broken by `id` ascending · `limit` respected · empty result is `[]`.
- [x] 2.2 GREEN: added `listPublic(now: Date, limit: number): Promise<StoredChallenge[]>` to `src/domain/ports/challenge-repository.ts`; implemented in `src/adapters/db/challenge-repository.ts` with `and(eq(visibility,"public"), lte(startsAt, now), gte(endsAt, now))`, `.orderBy(asc(endsAt), asc(id))`, `.limit(limit)`, mapped through the existing `toStoredChallenge`.
- [x] 2.3 RED: added 5 failing cases to `src/adapters/db/challenge-repository.test.ts` for `listProgressForChallenge` — two participants each get their own rows · `ruleIndex` order preserved within a participant · `completedAt` null → `completed: false` · participant with zero rows absent · unknown challenge id → `[]`.
- [x] 2.4 GREEN: added `ParticipantProgress` type and `listProgressForChallenge(challengeId: string): Promise<ParticipantProgress[]>` to `src/domain/ports/challenge-repository.ts`; implemented in `src/adapters/db/challenge-repository.ts`, grouping rows by `riotAccountId` (one query, ordered `riot_account_id asc, rule_index asc`) into `ParticipantProgress[]`. **Refactor**: extracted `toRuleProgress(row)` out of `findProgress`'s inline mapping so both methods share the exact same `completed = completedAt !== null` logic instead of duplicating it, per the design's "reuse its row mapping rather than duplicating it" instruction.
- [x] 2.5 RED: added 4 failing cases to `src/adapters/db/riot-account-repository.test.ts` for `findById` — hit returns the mapped account · miss returns `null` · existing platform/region corruption guards still throw on a corrupt row (both the platform guard and the platform/region-mismatch guard, matching the two existing guard tests for `listByUser`/`findByPuuid`).
- [x] 2.6 GREEN: added `findById(id: string): Promise<RiotAccount | null>` to `src/domain/ports/riot-account-repository.ts`; implemented in `src/adapters/db/riot-account-repository.ts` as `where id = ? limit 1` through the existing `toRiotAccount` guards — byte-identical query shape to `findByPuuid`, just keyed on `id`.
- [x] 2.7 Verify — see "Verification (S2, task 2.7)" below.

**Fakes extended to keep typecheck green.** Widening `ChallengeRepository` and `RiotAccountRepository` breaks any object literal typed against those interfaces that doesn't implement every method. Two existing in-memory test fakes are typed that way:
- `src/application/poll-player.test.ts`'s `fakeChallenges(...)` (and one inline `ChallengeRepository` literal at the "backs off when listActiveForAccount throws" test, which spreads `fakeChallenges([])` and therefore needed no separate edit) — added `listPublic` and `listProgressForChallenge`, each throwing `"not used by pollPlayer"`, matching the fake's existing convention for every method `pollPlayer` does not call.
- `src/application/link-riot-account.test.ts`'s `fakeRiotAccounts()` — added `findById(id)` returning `rows.find((row) => row.id === id) ?? null`, matching the fake's existing `findByPuuid` pattern (this one actually needed a real implementation, not a throw, because `id`-based lookup over the same in-memory `rows` array is trivial and keeps the fake internally consistent with `link`'s generated ids).

No fake implementation of these ports exists anywhere else in `src` (checked with `rg -l "ChallengeRepository|RiotAccountRepository" src` — only the two port files, the two adapter files, `poll-player.{ts,test.ts}`, `link-riot-account.{ts,test.ts}`, and the two route files `src/app/account/page.tsx` / `src/app/account/actions.ts`, which consume the real adapter, not a fake).

## TDD Cycle Evidence (S2)

Strict TDD active. Every method followed RED (test against `createTestDb()` referencing the not-yet-existing method, confirmed failing with `TypeError: repository.<method> is not a function`) → GREEN (port signature + adapter implementation, confirmed passing) → REFACTOR (`listProgressForChallenge` only — extracted `toRuleProgress`; the other two needed no refactor, code was already minimal and clean).

| Task | Method | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|---|
| 2.1–2.2 | `listPublic` | `challenge-repository.test.ts` | Adapter (in-memory SQLite via `createTestDb()`) | ✅ 33/33 (pre-existing suite) | ✅ Written — `pnpm exec vitest run src/adapters/db/challenge-repository.test.ts` → 10 failed (`TypeError: repository.listPublic is not a function`), 18 passed | ✅ 28/28 passed | ✅ 10 cases (public+in-window, unlisted-excluded, not-started-excluded, ended-excluded, startsAt-boundary, endsAt-boundary, order-by-endsAt, tie-by-id, limit, empty) | ➖ None needed |
| 2.3–2.4 | `listProgressForChallenge` | `challenge-repository.test.ts` | Adapter | ✅ 28/28 (post-2.2 baseline) | ✅ Written — 5 failed (`TypeError: repository.listProgressForChallenge is not a function`), 28 passed | ✅ 33/33 passed | ✅ 5 cases (two-participants-own-rows, ruleIndex-order, null-completedAt, zero-rows-omitted, unknown-id) | ✅ extracted `toRuleProgress`, re-ran `pnpm exec vitest run src/adapters/db/challenge-repository.test.ts` → still 33/33 |
| 2.5–2.6 | `findById` | `riot-account-repository.test.ts` | Adapter | ✅ 15/15 (pre-existing suite) | ✅ Written — 4 failed (`TypeError: repository.findById is not a function` / `repo.findById is not a function`), 15 passed | ✅ 19/19 passed | ✅ 4 cases (hit, miss, corrupt-platform-guard, platform/region-mismatch-guard) | ➖ None needed |

### Test Summary (S2)

- **Total tests written**: 19 (`listPublic` 10, `listProgressForChallenge` 5, `findById` 4)
- **Total tests passing**: 19/19 new, 348/348 full suite (baseline 329 + 19)
- **Layers used**: Adapter/integration against in-memory SQLite (19), no new unit or component tests
- **Approval tests** (refactoring): None — the `toRuleProgress` extraction is covered by re-running the same 33-test suite before and after, not a dedicated approval-test pair
- **Pure functions created**: 1 (`toRuleProgress`)

## Work Unit Evidence (S2)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run src/adapters/db/challenge-repository.test.ts src/adapters/db/riot-account-repository.test.ts` → `Test Files 2 passed (2)`, `Tests 52 passed (52)`; the two dependent application fakes independently confirmed with `pnpm exec vitest run src/application/poll-player.test.ts src/application/link-riot-account.test.ts` → `Test Files 2 passed (2)`, `Tests 42 passed (42)` |
| Runtime harness command/scenario and exact result | N/A — additive port/adapter methods with no route or use case calling them yet (S3b's `getChallengeView`/`list-public-challenges` are the first callers). Proven by construction: `git diff --stat` for this slice touches only `src/domain/ports/`, `src/adapters/db/`, and two existing application test files (fakes, not production callers); `pnpm build` shows the same 6 routes as S1, none touching these methods |
| Rollback boundary | Revert `src/domain/ports/challenge-repository.ts`, `src/adapters/db/challenge-repository.ts`, `src/domain/ports/riot-account-repository.ts`, `src/adapters/db/riot-account-repository.ts` to their pre-S2 state, and revert the fake extensions in `src/application/poll-player.test.ts` and `src/application/link-riot-account.test.ts`. Every existing caller of these two repositories (`link-riot-account.ts`, `poll-player.ts`, `src/app/account/{page,actions}.tsx`) uses only pre-existing methods, so this reverts cleanly with no orphaned imports. |

## Verification (S2, task 2.7)

| Command | Result |
|---|---|
| `pnpm test` | exit 0 — `Test Files 36 passed (36)`, `Tests 348 passed (348)` (baseline 329 + 19 new) |
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean |
| `pnpm lint` | exit 0 |
| `pnpm build` | exit 0 — compiled successfully, same 6 routes as S0/S1 (`/`, `/_not-found`, `/account`, `/api/auth/[...nextauth]`, `/privacy`, `/terms`), all still `ƒ` dynamic — expected, since S2 adds no route |

## Review budget measurement (S2)

Measured with `git diff --stat feat/challenge-ui-s1d-remaining-primitives -- ':!openspec/**'` against the two commits landed on this branch: **340 authored lines** (334 insertions + 6 deletions across `src/adapters/db/{challenge-repository,riot-account-repository}.{ts,test.ts}`, `src/domain/ports/{challenge-repository,riot-account-repository}.ts`, and the two fake-extension lines in `src/application/{poll-player,link-riot-account}.test.ts`). Within the tasks-agent's own 200–350 estimate and under the 400-line budget — delivered as **one** PR, no split and no `size:exception` needed.

Commits on `feat/challenge-ui-s2-ports-adapters` (targets `feat/challenge-ui-s1d-remaining-primitives` per `feature-branch-chain`, since S2 branches from wherever it lands in the chain rather than in parallel per the tasks-agent's dependency note — see "Deviations from design" below):
- `9e9b0f1` — `feat(challenge-repository): add listPublic and listProgressForChallenge`
- `a1e17aa` — `feat(riot-account-repository): add findById for account lookups by id`

## Deviations from design (S2)

1. **S2 was implemented after S1 instead of in parallel, on a branch chained onto S1d rather than an independent branch off the tracker.** The tasks-agent's own dependency graph states S2 "runs in parallel with S0/S1" and "has no dependency on the design foundation", and offers `feat/challenge-ui-s2-ports-adapters` as an independent branch (`Depends on: —`). The orchestrator sequenced this apply after S1 completed and started the branch from `feat/challenge-ui-s1d-remaining-primitives` (this repository's actual current branch at launch), not from the tracker `feat/challenge-ui`. This is a sequencing/branch-base deviation only — S2's file scope (`src/domain/ports/`, `src/adapters/db/`) never overlaps S1's file scope (`src/components/`, `src/app/fonts*`, `src/app/globals.css`, `src/app/layout.tsx`), so the diff itself is exactly as independent as the design intended; only the branch's parent commit differs from what a fully-parallel delivery would have used.

## Issues found (S2)

None.

## Completed: Phase S3a — Write use cases

- [x] 3a.1 RED: added 5 failing cases to `src/domain/rule-codec.test.ts` for `safeParseRules` — valid · non-JSON → `not_json` · empty array → `invalid` · bad target on rule index 1 → `{ ruleIndex: 1, field: "target" }` · unknown criterion kind.
- [x] 3a.2 GREEN: added `ParsedRules` type and `safeParseRules(json: string): ParsedRules` to `src/domain/rule-codec.ts`, wrapping `JSON.parse` + `rulesSchema.safeParse` and translating the first zod issue's `path` into `{ ruleIndex, field }` — a numeric first path segment names the rule index, a string second segment names the field; anything else (e.g. the top-level "at least one rule" issue on an empty array) has no single rule to blame and yields `{ ruleIndex: null, field: null }`. `parseRules`/`serialiseRules` are unchanged and keep their existing callers; `src/application` still never imports zod.
- [x] 3a.3 RED: created `src/application/create-challenge.test.ts` with hand-written in-memory port fakes (no mocking library, no casts) — 14 cases: happy path stores exactly the submitted title/window/visibility/rules · creation with `joinAsRiotAccountId: null` produces zero participants · whitespace-only title · `endsAt === startsAt` · `endsAt < startsAt` · unparseable date · bad visibility · `safeParseRules` failure names the second rule · zero rules rejected · 6 rules rejected (`too_many_rules`) · 5 criteria on one rule rejected (`too_many_criteria`) · self-join stores a participant · self-join with a foreign-owned account refused, nothing created · self-join with an unknown account id refused, nothing created.
- [x] 3a.4 GREEN: created `src/application/create-challenge.ts` — factory `createChallenge(deps: { challenges, riotAccounts, newId })`, `CreateChallengeInput`/`CreateChallengeResult` typed union, validation order exactly as design §7: title trim → window parse (`NaN` → `unparseable`) → window order (`endsAt > startsAt`) → visibility ∈ `{public, unlisted}` → `safeParseRules` → 5-rule/4-criteria caps (re-checked server-side since a Server Function is reachable by direct POST) → self-join ownership via `riotAccounts.findById` (null or foreign `userId` → `riot_account_not_owned`, nothing created) → `newId()` → `challenges.create` → optional `challenges.join` → `{ kind: "created", id }`. Create-then-join documented inline as non-transactional, matching design.
- [x] 3a.5 RED: created `src/application/join-challenge.test.ts` — 8 cases: joins, recording exactly one participant row · second join reports `already_joined` and adds no row · unknown challenge → `challenge_not_found` · ended challenge refused (`challenge_ended`) · upcoming challenge allowed · live challenge allowed · foreign-owned account refused with no write · unknown account id refused with no write.
- [x] 3a.6 GREEN: created `src/application/join-challenge.ts` — factory `joinChallenge(deps: { challenges, riotAccounts, now })`, `JoinChallengeInput`/`JoinChallengeResult` typed union, order exactly as design §7: `challenges.findById` → `challenge_not_found`; `now() > endsAt` → `challenge_ended` (upcoming and live both allowed); `riotAccounts.findById` ownership check → `riot_account_not_owned`; `listParticipants` contains the id → `already_joined`; else `challenges.join`. The pre-check exists only to *report* `already_joined` accurately — correctness against a race relies on the adapter's `onConflictDoNothing` (confirmed present in `src/adapters/db/challenge-repository.ts`'s `join`), so a race reports `joined` twice and still stores exactly one row.
- [x] 3a.7 Verify — see "Verification (S3a, task 3a.7)" below.

## TDD Cycle Evidence (S3a)

Strict TDD active. Every pair followed RED (test importing/calling the not-yet-existing function, confirmed failing) → GREEN (implementation, confirmed passing) → REFACTOR (no refactor needed — both use cases came out clean on the first pass; no duplication, no magic numbers left un-named).

| Task | Function | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|---|
| 3a.1–3a.2 | `safeParseRules` | `rule-codec.test.ts` | Unit (pure) | ✅ 9/9 (pre-existing suite) | ✅ Written — `pnpm exec vitest run src/domain/rule-codec.test.ts` → 5 failed (`TypeError: safeParseRules is not a function`), 9 passed | ✅ 14/14 passed | ✅ 5 cases (valid, not_json, empty-array-invalid, named-rule-index-1, unknown-criterion-kind) | ➖ None needed |
| 3a.3–3a.4 | `createChallenge` | `create-challenge.test.ts` | Unit (in-memory port fakes) | N/A (new file) | ✅ Written — `pnpm exec vitest run src/application/create-challenge.test.ts` → module-resolution failure (`Cannot find package '@/application/create-challenge'`), 0 tests ran | ✅ 14/14 passed | ✅ 14 cases (see 3a.3 above) | ➖ None needed |
| 3a.5–3a.6 | `joinChallenge` | `join-challenge.test.ts` | Unit (in-memory port fakes) | N/A (new file) | ✅ Written — `pnpm exec vitest run src/application/join-challenge.test.ts` → module-resolution failure (`Cannot find package '@/application/join-challenge'`), 0 tests ran | ✅ 8/8 passed | ✅ 8 cases (see 3a.5 above) | ➖ None needed |

### Test Summary (S3a)

- **Total tests written**: 27 (`safeParseRules` 5, `createChallenge` 14, `joinChallenge` 8)
- **Total tests passing**: 27/27 new, 375/375 full suite (baseline 348 + 27)
- **Layers used**: Unit — pure function (5), Unit — hand-written in-memory port fakes, no mocking library, no casts (22)
- **Approval tests** (refactoring): None — no refactoring tasks in this slice
- **Pure functions created**: 1 (`safeParseRules`); the two use cases are factories closing over injected async dependencies, not pure, by design (D8-equivalent for application code: they call `Date.now`-equivalent via injected `now`/`newId`, never directly)

## Work Unit Evidence (S3a)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run src/domain/rule-codec.test.ts src/application/create-challenge.test.ts src/application/join-challenge.test.ts` → 3 test files, 36 tests (14 in `rule-codec.test.ts` incl. the 5 new `safeParseRules` cases, 14 in `create-challenge.test.ts`, 8 in `join-challenge.test.ts`), all passing; full-suite confirmation: `pnpm test` → `Test Files 38 passed (38)`, `Tests 375 passed (375)` |
| Runtime harness command/scenario and exact result | N/A — `createChallenge` and `joinChallenge` are unreferenced application-layer functions with no route or composition root calling them yet (S4b's `actions.ts` and S5b's `actions.ts` are the first callers, per the dependency graph `S3a ──► S4b`, `S3a ──► S5b`). Proven by construction: `git diff --stat` for this slice touches only `src/domain/rule-codec.ts` and `src/application/{create-challenge,join-challenge}.ts` (+ their tests); `pnpm build` shows the same 6 routes as S2, none touching these functions |
| Rollback boundary | Revert `src/domain/rule-codec.ts` to its pre-S3a state (removing `safeParseRules`/`ParsedRules`) and delete `src/application/create-challenge.ts`, `src/application/create-challenge.test.ts`, `src/application/join-challenge.ts`, `src/application/join-challenge.test.ts`. Nothing else in the repo imports any of these three new/changed symbols yet (S4a/S4b/S5b have not landed), so this reverts cleanly with no orphaned imports. |

## Verification (S3a, task 3a.7)

| Command | Result |
|---|---|
| `pnpm test` | exit 0 — `Test Files 38 passed (38)`, `Tests 375 passed (375)` (baseline 348 + 27 new) |
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean |
| `pnpm lint` | exit 0 |
| `pnpm build` | exit 0 — compiled successfully, same 6 routes as S0/S1/S2 (`/`, `/_not-found`, `/account`, `/api/auth/[...nextauth]`, `/privacy`, `/terms`), all still `ƒ` dynamic — expected, since S3a adds no route |

## Review budget measurement (S3a)

Measured per sub-slice with `git diff --stat <base>..HEAD -- ':!openspec/**'`: **total S3a: 746 authored lines** (84 + 395 + 267, see table) — well above the tasks-agent's own 250–400 estimate for the whole slice, and above what its single pre-authorized two-way example split (`feat/challenge-ui-s3a-i-rules-and-create` = 3a.1–3a.4, `feat/challenge-ui-s3a-ii-join` = 3a.5–3a.6) would have fit: measuring that exact split shows 3a.1–3a.4 alone is 480 lines, already over budget.

One honest slicing pass over the actual per-task-pair sizes found a **three-way** cohesive split, each slice under 400 raw changed lines with no code shrunk, no test or comment removed to fit — nothing in `createChallenge`'s or `joinChallenge`'s hand-written fakes could be trimmed without breaking the task's explicit "no mocking library, no casts" requirement, since implementing a port fake means stubbing every method the interface declares (9 on `ChallengeRepository`, 5 on `RiotAccountRepository`), not just the ones each use case calls:

| Sub-slice | Tasks | Files | Base | Raw changed lines | Builds/tests alone because |
|---|---|---|---|---|---|
| **S3a-i** — `safeParseRules` | 3a.1, 3a.2 | `src/domain/rule-codec.{ts,test.ts}` | `feat/challenge-ui-s2-ports-adapters` | 84 | Additive to an existing domain module; nothing calls `safeParseRules` yet; `pnpm exec vitest run src/domain/rule-codec.test.ts` clean in isolation |
| **S3a-ii** — `createChallenge` | 3a.3, 3a.4 | `src/application/create-challenge.{ts,test.ts}` | S3a-i | 395 | Imports only `safeParseRules` from S3a-i and the pre-existing ports; no route calls it yet; `pnpm exec vitest run src/application/create-challenge.test.ts` clean in isolation |
| **S3a-iii** — `joinChallenge` + verify | 3a.5, 3a.6, 3a.7 | `src/application/join-challenge.{ts,test.ts}`, `tasks.md`, this file | S3a-ii | 267 | Imports only the pre-existing ports, independent of `createChallenge`; carries the full `pnpm typecheck && pnpm lint && pnpm build && pnpm test` run reported above |

Neither needs a `size:exception`. Branches, in `feature-branch-chain` order: `feat/challenge-ui-s3a-i-rule-codec` (targets `feat/challenge-ui-s2-ports-adapters`) → `feat/challenge-ui-s3a-ii-create-challenge` (targets S3a-i) → `feat/challenge-ui-s3a-iii-join-challenge` (targets S3a-ii, current branch). Commit SHAs: S3a-i ends at `257c675`, S3a-ii ends at `e9e3f3d`, S3a-iii (HEAD) is committed alongside this apply-progress update.

**Deviation from the tasks-agent's own example, stated plainly:** the tasks artifact's own suggested split for "if the measured total exceeds 400" (`feat/challenge-ui-s3a-i-rules-and-create` = 3a.1–3a.4, `feat/challenge-ui-s3a-ii-join` = 3a.5–3a.6) does not fit — measured, 3a.1–3a.4 alone is 480 lines. The three-way split above keeps every branch under 400 with nothing shrunk, following the same reasoning S1's apply-progress already established for this exact situation (a pre-authorized example split proving too coarse once measured). Branch names follow the existing `s{phase}{roman}-{description}` convention used by S1 (`s1a`/`s1b`/`s1c`/`s1d`) rather than the two originally-named branches, since those two names described a split that measurement disproved.

## Completed: Phase S3b — Read use cases

- [x] 3b.1 RED: added 8 failing cases to a new `src/domain/rule-text.test.ts` for `ruleToSentence`/`rulesToSentences` — `Win 3 games as Ahri` · `Play 20 games` · singular `Win 1 game` · role label (`Play 5 games in Jungle`) · queue word (`Play 10 ranked solo games`) · combined criteria ordering (`Win 10 ranked solo games in Jungle`, matching design.md's worked example verbatim) · unknown role · `rulesToSentences` preserves order across two rules. Also added 4 failing cases to `src/domain/match.test.ts` for the not-yet-existing `ROLE_LABELS`/`QUEUE_LABELS`.
- [x] 3b.2 GREEN: added `ROLE_LABELS: Record<Role, string>` and `QUEUE_LABELS: Record<Queue, string>` to `src/domain/match.ts` next to `ROLES`/`QUEUES`; created `src/domain/rule-text.ts` with `ruleToSentence(rule)` and `rulesToSentences(rules)` per the deterministic template, finding each criterion kind once via a small typed `findCriterion` helper rather than four separate `.find()` calls with repeated type guards.
- [x] 3b.3 RED: added 4 failing cases to a new `src/domain/challenge-state.test.ts` for the not-yet-existing `deriveChallengeState` (see "Shared state derivation" below), and 11 failing cases to a new `src/application/get-challenge-view.test.ts` — unknown id → `not_found` · state boundaries (`now < startsAt` → upcoming, `now === startsAt` → live, `now === endsAt` → live, `now > endsAt` → ended) · every participant listed, not just one · progress zero-filled to `challenge.rules.length` for a participant with no stored rows · `lastCheckedAt` null when no poll state · `lastCheckedAt` from `poll_state.last_polled_at` when present · `ruleText` equals `rulesToSentences(challenge.rules)` · participants sorted by lowercased `displayName` ascending.
- [x] 3b.4 GREEN: created `src/domain/challenge-state.ts` (`ChallengeState` type + `deriveChallengeState(window, now)`) and `src/application/get-challenge-view.ts` — factory `getChallengeView(deps: { challenges, riotAccounts, polling, now })`, `ParticipantView`/`ChallengeView`/`GetChallengeViewResult` types (`ChallengeState` re-exported from the domain module); `findById` → `not_found`; concurrent `listParticipants` + `listProgressForChallenge` via `Promise.all`; per participant, `riotAccounts.findById` then `polling.getState(account.puuid)`; progress zero-filled when a participant has no stored rows; participants sorted by lowercased `displayName` ascending. See "Shared state derivation" and "Vanished-account degradation" below for the two design-authorized judgment calls this task made.
- [x] 3b.5 RED: created `src/application/list-public-challenges.test.ts` with 4 failing cases — delegates `now`/`limit` to `challenges.listPublic` · defaults `limit` to `DEFAULT_PUBLIC_LIMIT` when omitted · empty list is `[]` · summaries carry `ruleText` from `rulesToSentences` and `state` from `deriveChallengeState`.
- [x] 3b.6 GREEN: created `src/application/list-public-challenges.ts` — `ChallengeSummary` type, `DEFAULT_PUBLIC_LIMIT = 50`, `listPublicChallenges(deps: { challenges, now })(limit?)` returning a plain array (no `{ kind }` union, matching design's "this query has exactly one outcome" reasoning and D15's no-participant-count rule).
- [x] 3b.7 Verify — see "Verification (S3b, task 3b.7)" below.

### Shared state derivation

The prompt's hard constraints ask for "one small shared pure function used by both use cases" for `upcoming`/`live`/`now`/`ended`, leaving the location to this apply. Chose **`src/domain/challenge-state.ts`**, not `src/application`: `evaluate` in `progress.ts` already established the house convention that a pure window-vs-clock function with no ports and no I/O belongs in `src/domain`, and `deriveChallengeState(window, now)` reuses `progress.ts`'s existing `ChallengeWindow` type rather than inventing a second one. `getChallengeView` re-exports `ChallengeState` (`export type { ChallengeState }`) so `design.md`'s `import { type ChallengeState } from "./get-challenge-view"` shape still resolves for any future caller that imports it from there instead of from the domain module directly. This is one file beyond design.md's File Changes table for S3b (which names only `get-challenge-view.ts`/`list-public-challenges.ts` as new), the same kind of judgment-call extraction as S2's `toRuleProgress` and S1's `cn.ts`.

### Vanished-account degradation

Design's hard constraints state `displayName = "GameName#TAG"` or `"Unknown account"` if the account row vanished, and say platformLabel/lastCheckedAt should "degrade sensibly." Implemented: `platformLabel = "Unknown"` (not "Unknown account" — avoids repeating the same string in two fields of one row) and `lastCheckedAt = null`, which falls out naturally since a vanished account has no `puuid` left to call `polling.getState` with — the code short-circuits to `pollState = null` rather than treating it as a separate case. Commented inline in `get-challenge-view.ts`. No RED/GREEN test case exists for this branch specifically: the apply brief said "cover exactly the cases in tasks 3b.1, 3b.3 and 3b.5," and this branch is not named in 3b.3's bullet list, so it is implemented per the hard constraint but not separately tested in this batch — flagged in "Issues found (S3b)" below as a coverage gap for `sdd-verify` to weigh.

## TDD Cycle Evidence (S3b)

Strict TDD active. Every pair followed RED (test referencing a not-yet-existing symbol, confirmed failing) → GREEN (implementation, confirmed passing) → REFACTOR (checked, none needed — every file came out clean on the first pass: no duplication, no magic numbers, `findCriterion` in `rule-text.ts` already avoided repeating the four `.find()` type guards inline).

| Task | Function(s) | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|---|
| 3b.1–3b.2 | `ruleToSentence`, `rulesToSentences`, `ROLE_LABELS`, `QUEUE_LABELS` | `rule-text.test.ts`, `match.test.ts` | Unit (pure) | ✅ 375/375 (pre-existing suite) | ✅ Written — `pnpm exec vitest run src/domain/rule-text.test.ts src/domain/match.test.ts` → `rule-text.test.ts`: `Error: Cannot find package '@/domain/rule-text'`, 0 tests ran; `match.test.ts`: 4 failed (`ROLE_LABELS`/`QUEUE_LABELS` undefined), 7 passed | ✅ 19/19 passed | ✅ 8 cases in `rule-text.test.ts` (won+champion, no-criteria, singular, role, queue, combined-ordering, unknown-role, `rulesToSentences`-order) + 4 in `match.test.ts` | ➖ None needed |
| 3b.3–3b.4 | `deriveChallengeState`, `getChallengeView` | `challenge-state.test.ts`, `get-challenge-view.test.ts` | Unit (pure) + Unit (in-memory port fakes) | N/A (new files) | ✅ Written — `pnpm exec vitest run src/domain/challenge-state.test.ts src/application/get-challenge-view.test.ts` → both: `Error: Cannot find package '@/domain/challenge-state'` / `'@/application/get-challenge-view'`, 0 tests ran | ✅ 15/15 passed (4 + 11) | ✅ 15 cases total (see task list above) | ➖ None needed |
| 3b.5–3b.6 | `listPublicChallenges` | `list-public-challenges.test.ts` | Unit (in-memory port fake) | N/A (new file) | ✅ Written — `pnpm exec vitest run src/application/list-public-challenges.test.ts` → `Error: Cannot find package '@/application/list-public-challenges'`, 0 tests ran | ✅ 4/4 passed | ✅ 4 cases (see task list above) | ➖ None needed |

### Test Summary (S3b)

- **Total tests written**: 31 (`rule-text` 8, `match` (`ROLE_LABELS`/`QUEUE_LABELS`) 4, `challenge-state` 4, `get-challenge-view` 11, `list-public-challenges` 4)
- **Total tests passing**: 31/31 new, 406/406 full suite (baseline 375 + 31)
- **Layers used**: Unit — pure function (27: rule-text 8 + match 4 + challenge-state 4 + list-public-challenges' `deriveChallengeState`-dependent assertions folded into its 4 + rule-text/match subtotal already counted), Unit — hand-written in-memory port fakes, no mocking library, no casts (11, all in `get-challenge-view.test.ts`; `list-public-challenges.test.ts` also uses one hand-written fake but its assertions are covered above)
- **Approval tests** (refactoring): None — no refactoring tasks in this slice
- **Pure functions created**: 3 (`ruleToSentence`/`rulesToSentences` counted as one cohesive pair, `deriveChallengeState`); `getChallengeView` and `listPublicChallenges` are factories closing over injected async dependencies, not pure, by design (same pattern as S3a's `createChallenge`/`joinChallenge`)

## Work Unit Evidence (S3b)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run src/domain/rule-text.test.ts src/domain/match.test.ts src/domain/challenge-state.test.ts src/application/get-challenge-view.test.ts src/application/list-public-challenges.test.ts` → 5 test files, 42 tests (11 in `match.test.ts` incl. the 4 new label cases, 8 in `rule-text.test.ts`, 4 in `challenge-state.test.ts`, 11 in `get-challenge-view.test.ts`, 4 in `list-public-challenges.test.ts`), all passing; full-suite confirmation: `pnpm test` → `Test Files 42 passed (42)`, `Tests 406 passed (406)` |
| Runtime harness command/scenario and exact result | N/A — `getChallengeView` and `listPublicChallenges` are unreferenced application-layer functions with no route or composition root calling them yet (S4b's create action needs neither; S5a's browse page and S5b's view page are the first callers, per the dependency graph `S3b ──► S5a`, `S3b ──► S5b`). Proven by construction: `git diff --stat` for this slice touches only `src/domain/{match,rule-text,challenge-state}.ts` and `src/application/{get-challenge-view,list-public-challenges}.ts` (+ their tests); `pnpm build` shows the same 6 routes as S3a, none touching these functions |
| Rollback boundary | Revert `src/domain/match.ts`/`src/domain/match.test.ts` to their pre-S3b state (removing `ROLE_LABELS`/`QUEUE_LABELS`) and delete `src/domain/rule-text.ts`, `src/domain/rule-text.test.ts`, `src/domain/challenge-state.ts`, `src/domain/challenge-state.test.ts`, `src/application/get-challenge-view.ts`, `src/application/get-challenge-view.test.ts`, `src/application/list-public-challenges.ts`, `src/application/list-public-challenges.test.ts`. Nothing else in the repo imports any of these new/changed symbols yet (S4a/S4b/S5a/S5b have not landed), so this reverts cleanly with no orphaned imports. Each of the three chained branches below reverts independently at its own boundary too. |

## Verification (S3b, task 3b.7)

| Command | Result |
|---|---|
| `pnpm test` | exit 0 — `Test Files 42 passed (42)`, `Tests 406 passed (406)` (baseline 375 + 31 new) |
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean |
| `pnpm lint` | exit 0 |
| `pnpm build` | exit 0 — compiled successfully, same 6 routes as S0/S1/S2/S3a (`/`, `/_not-found`, `/account`, `/api/auth/[...nextauth]`, `/privacy`, `/terms`), all still `ƒ` dynamic — expected, since S3b adds no route |
| `rg -n "from \"@/adapters\|from \"zod` on the 4 new/modified `src/application`+`src/domain` non-test files | 0 matches — no `src/adapters` import, no `zod` import from `src/application` |
| `rg -n "throw new"` on the same 4 files | 0 matches — no thrown domain errors, matching the "factory + typed result" house rule |
| Each of the three chained branches checked out and independently verified with `pnpm exec vitest run` + `pnpm exec tsc --noEmit` before this report | s3b-i: 387/387 tests, clean typecheck. s3b-ii: 402/402 tests, clean typecheck. s3b-iii (current branch): 406/406 tests, clean typecheck — see "Review budget measurement (S3b)" |

## Review budget measurement (S3b)

Measured per sub-slice with `git diff --stat <base>..<branch> -- ':!openspec/**'`: **total S3b: 873 authored lines** (195 + 518 + 160) — well above the tasks-agent's own 250–400 estimate for the whole slice, and above the pre-authorized three-way example split the prompt itself suggested (`feat/challenge-ui-s3b-i-rule-text` = 3b.1–3b.2, `feat/challenge-ui-s3b-ii-challenge-view` = 3b.3–3b.4, `feat/challenge-ui-s3b-iii-public-list` = 3b.5–3b.7 + docs): measuring that exact split shows the middle slice alone is 518 lines, over budget.

| Sub-slice | Tasks | Files | Base | Raw changed lines | Builds/tests alone because |
|---|---|---|---|---|---|
| **s3b-i** — `rule-text` + labels | 3b.1, 3b.2 | `src/domain/{match,rule-text}.{ts,test.ts}` | `feat/challenge-ui-s3a-iii-join-challenge` | 195 | Pure domain additions; nothing calls `ruleToSentence`/`ROLE_LABELS`/`QUEUE_LABELS` outside their own tests yet; `pnpm exec vitest run` + `pnpm exec tsc --noEmit` both clean in isolation |
| **s3b-ii** — `challenge-state` + `get-challenge-view` | 3b.3, 3b.4 | `src/domain/challenge-state.{ts,test.ts}`, `src/application/get-challenge-view.{ts,test.ts}` | s3b-i | **518 — exceeds budget, see below** | Imports only `rule-text`/labels from s3b-i and the pre-existing ports; no route calls it yet; clean in isolation |
| **s3b-iii** — `list-public-challenges` + verify | 3b.5, 3b.6, 3b.7 | `src/application/list-public-challenges.{ts,test.ts}`, `tasks.md`, this file | s3b-ii | 160 | Imports only `deriveChallengeState`/`rulesToSentences` from earlier slices and the pre-existing ports; carries the full `pnpm typecheck && pnpm lint && pnpm build && pnpm test` run reported above |

**s3b-ii needs `size:exception` — one honest slicing pass found no cohesive split, stated plainly.** Three restructurings were considered and rejected before accepting the exception:

1. *Move `challenge-state.ts` (49 lines) into s3b-i or s3b-iii instead of s3b-ii.* Tried the arithmetic: `get-challenge-view.ts` + `get-challenge-view.test.ts` alone are 128 + 341 = **469 lines** — still over 400 with `challenge-state.ts` moved out entirely. Rejected: doesn't fix the actual problem, and it separates the shared helper from its first consumer for no benefit.
2. *Split `get-challenge-view.test.ts`'s 11 cases across two commits, both against the same finished `get-challenge-view.ts`.* Rejected: the apply brief's own instruction is "cover exactly the cases in tasks 3b.3, 3b.5" as one RED batch before one GREEN; shipping the production code in commit 1 with only some of its branches under test (e.g., sorting or zero-fill proven only in commit 2) means commit 1 ships tested-looking code that is not actually fully tested yet, which is worse than one honestly-oversized PR.
3. *Extract `buildParticipantView` into its own file with its own smaller fake set (only `riotAccounts`+`polling`, not the full `ChallengeRepository`), to create a genuine sub-module boundary.* This is real architecture, not a size trick, but it is not what design.md or tasks.md 3b.3/3b.4 asked for — task 3b.4 names one file, `get-challenge-view.ts`, and design.md's use-case snippet shows no such split. Doing it only to hit a line count would be restructuring code to fit the budget, which the chained-pr skill and this apply's own hard constraints explicitly forbid ("the budget constrains how work is sliced, never the code itself").

The 518 lines are irreducible without cutting one of: the three hand-written port fakes this use case's dependencies require (`ChallengeRepository` — 9 methods, `RiotAccountRepository` — 5, `PollingRepository` — 5, none of which can be a partial stub per the house "no mocking library, no casts" rule), or one of the 11 test cases the apply brief named as required coverage. Per the chained-pr skill's decision gate ("No cohesive split fits the budget after one slicing pass → Stop; deliver the best split, report the overage and why it cannot shrink further, and recommend `size:exception`"), `feat/challenge-ui-s3b-ii-challenge-view` ships as one PR at 518 lines with `size:exception` recorded here. This is the first slice in this change where a genuine irreducible pair exceeded budget; S1 and S3a's larger-than-forecast slices always found a cohesive split that fit.

Branches, in `feature-branch-chain` order: `feat/challenge-ui-s3b-i-rule-text` (targets `feat/challenge-ui-s3a-iii-join-challenge`) → `feat/challenge-ui-s3b-ii-challenge-view` (targets s3b-i, **`size:exception`, 518 lines**) → `feat/challenge-ui-s3b-iii-public-list` (targets s3b-ii, current branch). Commit SHAs: s3b-i ends at `04b0776`, s3b-ii ends at `2bad35c`, s3b-iii (HEAD) ends at `92bd94b`.

## Deviations from design (S3b)

1. **`src/domain/challenge-state.ts` is a new file not named in design.md's File Changes table for S3b.** Design's hard constraints (relayed via this apply's prompt, not design.md's table) explicitly asked for the state derivation to be extracted into one shared pure function and left the location as this apply's call — see "Shared state derivation" above for the reasoning and the file this apply chose.
2. **`platformLabel`/`lastCheckedAt` degradation for a vanished participant account is implemented but not covered by a dedicated RED/GREEN test case in this batch**, because task 3b.3's bullet list does not name that scenario and the apply brief said to cover exactly the named cases. See "Vanished-account degradation" above and "Issues found" below.
3. **`feat/challenge-ui-s3b-ii-challenge-view` ships at 518 authored lines, over the 400-line budget, with `size:exception` recorded rather than a further split.** See "Review budget measurement (S3b)" for the three rejected alternatives and why none fit.

## Issues found (S3b)

1. The vanished-Riot-account branch in `getChallengeView` (`displayName: "Unknown account"`, `platformLabel: "Unknown"`, `lastCheckedAt: null`) has no dedicated test in this apply — it follows directly from the existing fake wiring (`riotAccounts.findById` returning `null`) and the code's own short-circuit logic, but was not independently exercised because it is not one of task 3b.3's named cases. Recommend `sdd-verify` (or a follow-up task) add one case asserting this branch explicitly before S5b's view page ships it to users.

## Remaining tasks (not in this apply)

- [x] Phase S3a (write use cases) — 7/7 tasks complete (see above)
- [x] Phase S3b (read use cases) — 7/7 tasks complete (see above)
- [ ] Phase S4a (rule builder + presets) — 4 tasks, depends on S1 (now unblocked), S3a (now unblocked)
- [ ] Phase S4b (`/challenges/new` route) — 4 tasks, depends on S4a, S3b
- [ ] Phase S5a (`/challenges` browse) — 3 tasks, depends on S1 (now unblocked), S3b
- [ ] Phase S5b (`/challenges/[id]` view + join) — 7 tasks (+ contingent split), depends on S1 (now unblocked), S3b, S5a
- [ ] Phase S6 (restyle + shim removal) — 7 tasks, depends on S1 (now unblocked), S5b
- [ ] Phase S7 (e2e) — 6 tasks, depends on S4b, S5b

## Workload / PR boundary

### S0

- Mode: chained PR slice (`feature-branch-chain`, per prompt) — PR #1, targets `feat/challenge-ui`
- Current work unit: Phase S0 — Design foundation
- Boundary: starts from the pre-S0 repo state (Geist fonts, 26-line `globals.css`, no header); ends with the full token pipeline, self-hosted fonts, and the header shell landed, buildable, and passing all verification except the two disclosed pre-existing/deviation items above
- Review budget: S0 delivered as S0a (~289) + S0b (~340), both under 400; no `size:exception` (see "Review budget measurement")

### S1

- Mode: chained PR slice (`feature-branch-chain`) — four PRs, each targeting the previous slice's branch (S1a → `feat/challenge-ui-s0b-fonts-shell`; S1b → S1a; S1c → S1b; S1d → S1c)
- Current work unit: Phase S1 — UI primitives (all 12 tasks)
- Boundary: starts from S0's shipped shell (self-hosted fonts, token pipeline, header with placeholder glyphs); ends with all 11 ported primitives, the vendored icon set, and the S0 header deviation resolved — buildable and fully verified, no known issues beyond the disclosed deviations
- Review budget: S1 delivered as S1a (395) + S1b (398) + S1c (269) + S1d (325), all under 400; no `size:exception` — see "Review budget measurement (S1)" for why the pre-planned two-way split didn't hold and how the four-way split was derived

### S2

- Mode: chained PR slice (`feature-branch-chain`) — one PR, branch `feat/challenge-ui-s2-ports-adapters`, targeting `feat/challenge-ui-s1d-remaining-primitives` (see "Deviations from design (S2)" for why this branches off S1d instead of the tracker)
- Current work unit: Phase S2 — Ports + adapters (all 7 tasks)
- Boundary: starts from S1's shipped primitive set; ends with `listPublic`, `listProgressForChallenge`, and `findById` landed on their respective ports and adapters, covered by 19 new adapter tests, with the two existing in-memory application fakes extended to keep typecheck green — buildable and fully verified, no known issues, no route or use case calls any of the three new methods yet
- Review budget: 340 authored lines, under 400; no `size:exception` — see "Review budget measurement (S2)"

### S3a

- Mode: chained PR slice (`feature-branch-chain`) — three PRs, each targeting the previous slice's branch (S3a-i → `feat/challenge-ui-s2-ports-adapters`; S3a-ii → S3a-i; S3a-iii → S3a-ii)
- Current work unit: Phase S3a — Write use cases (all 7 tasks)
- Boundary: starts from S2's shipped ports/adapters; ends with `safeParseRules`, `createChallenge`, and `joinChallenge` landed with 27 new unit tests against hand-written in-memory port fakes — buildable and fully verified, no known issues, no route or composition root calls any of the three new/changed symbols yet
- Review budget: S3a delivered as S3a-i (84) + S3a-ii (395) + S3a-iii (267), all under 400; no `size:exception` — see "Review budget measurement (S3a)" for why the tasks-agent's own two-way example didn't hold and how the three-way split was derived

### S3b

- Mode: chained PR slice (`feature-branch-chain`) — three PRs, each targeting the previous slice's branch (s3b-i → `feat/challenge-ui-s3a-iii-join-challenge`; s3b-ii → s3b-i; s3b-iii → s3b-ii)
- Current work unit: Phase S3b — Read use cases (all 7 tasks)
- Boundary: starts from S3a's shipped write use cases; ends with `ruleToSentence`/`rulesToSentences`/`ROLE_LABELS`/`QUEUE_LABELS`, `deriveChallengeState`, `getChallengeView`, and `listPublicChallenges` landed with 31 new unit tests — buildable and fully verified, no known issues beyond the one disclosed coverage gap (vanished-account branch, see "Issues found (S3b)"), no route or composition root calls any of the four new/changed symbols yet
- Review budget: S3b delivered as s3b-i (195) + s3b-ii (**518, `size:exception`**) + s3b-iii (160) — see "Review budget measurement (S3b)" for why the pre-authorized three-way example held for two of three slices but the middle one is irreducibly over budget, and why the two considered further splits were rejected
