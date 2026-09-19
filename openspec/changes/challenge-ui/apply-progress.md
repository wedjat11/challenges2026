# Apply progress: challenge-ui

Change: `challenge-ui` · Store: hybrid (this file + Engram topic `sdd/challenge-ui/apply-progress`, project `challenges2026`)

## Status

**2/8 slices complete.** Phase S0 (design foundation) and Phase S1 (UI primitives) are done. S0: 9/9 tasks (0.1–0.9), delivered as two chained PRs from the tracker `feat/challenge-ui`: `feat/challenge-ui-s0a-design-tokens` (tokens) and `feat/challenge-ui-s0b-fonts-shell` (fonts, shell, lint ignore). S1: 12/12 tasks (1.1–1.12), delivered as **four** chained PRs (not the two the tasks-agent forecast — see "Review budget measurement (S1)"): `feat/challenge-ui-s1a-icons-button`, `feat/challenge-ui-s1b-layout-primitives`, `feat/challenge-ui-s1c-form-inputs`, `feat/challenge-ui-s1d-remaining-primitives`.

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

## Remaining tasks (not in this apply)

- [ ] Phase S2 (ports + adapters) — 7 tasks, independent of S0/S1
- [ ] Phase S3a (write use cases) — 7 tasks, depends on S2
- [ ] Phase S3b (read use cases) — 7 tasks, depends on S3a
- [ ] Phase S4a (rule builder + presets) — 4 tasks, depends on S1 (now unblocked), S3a
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
