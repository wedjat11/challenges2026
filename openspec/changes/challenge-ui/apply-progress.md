# Apply progress: challenge-ui

Change: `challenge-ui` · Store: hybrid (this file + Engram topic `sdd/challenge-ui/apply-progress`, project `challenges2026`)

## Status

**10/11 slices complete.** Phase S0 (design foundation), Phase S1 (UI primitives), Phase S2 (ports + adapters), Phase S3a (write use cases), Phase S3b (read use cases), Phase S4a (rule builder + presets), Phase S4b (`/challenges/new` route + action), Phase S5a (`/challenges` browse), Phase S5b (`/challenges/[id]` view + join), and Phase S6 (restyle + shim removal) are done. Remaining: S7 (11 total slices in the plan: S0, S1, S2, S3a, S3b, S4a, S4b, S5a, S5b, S6, S7). S6: 7/7 tasks (6.1–6.7), delivered as **six** work-unit commits on branch `feat/challenge-ui-s6-restyle` (targets `feat/challenge-ui-s5b-ii-d-reason-banner` per `feature-branch-chain`), measured at 211 authored lines — under the 400-line budget as one PR, no split needed. No `size:exception` was needed. See "Completed: Phase S6" below for the per-task detail, TDD/work-unit evidence, verification, and review budget measurement. S0: 9/9 tasks (0.1–0.9), delivered as two chained PRs from the tracker `feat/challenge-ui`: `feat/challenge-ui-s0a-design-tokens` (tokens) and `feat/challenge-ui-s0b-fonts-shell` (fonts, shell, lint ignore). S1: 12/12 tasks (1.1–1.12), delivered as **four** chained PRs (not the two the tasks-agent forecast — see "Review budget measurement (S1)"): `feat/challenge-ui-s1a-icons-button`, `feat/challenge-ui-s1b-layout-primitives`, `feat/challenge-ui-s1c-form-inputs`, `feat/challenge-ui-s1d-remaining-primitives`. S2: 7/7 tasks (2.1–2.7), delivered on branch `feat/challenge-ui-s2-ports-adapters` (one PR, under budget — see "Review budget measurement (S2)"). S3a: 7/7 tasks (3a.1–3a.7), delivered as **three** chained PRs (not the two the tasks-agent's own example suggested — see "Review budget measurement (S3a)"): `feat/challenge-ui-s3a-i-rule-codec`, `feat/challenge-ui-s3a-ii-create-challenge`, `feat/challenge-ui-s3a-iii-join-challenge`. S3b: 7/7 tasks (3b.1–3b.7), delivered as **three** chained PRs, the middle one carrying an **owner-accepted** `size:exception` (see "Review budget measurement (S3b)"): `feat/challenge-ui-s3b-i-rule-text`, `feat/challenge-ui-s3b-ii-challenge-view` (**553 lines, owner-accepted exception**, after a coverage backfill — see "Vanished-account degradation"), `feat/challenge-ui-s3b-iii-public-list`. S4a: 4/4 tasks (4a.1–4a.4), delivered as **two** chained PRs, the second carrying an **owner-accepted** `size:exception` (see "Review budget measurement (S4a)"): `feat/challenge-ui-s4a-i-rule-presets`, `feat/challenge-ui-s4a-ii-rule-builder` (**454 lines, owner-accepted exception**). S4b: 4/4 tasks (4b.1–4b.4), delivered as **three** chained PRs (not the two the phase brief's own split suggested — see "Review budget measurement (S4b)"), the middle one carrying an **owner-accepted** `size:exception`: `feat/challenge-ui-s4b-i-create-action`, `feat/challenge-ui-s4b-ii-create-form-body` (**633 lines, owner-accepted exception**), `feat/challenge-ui-s4b-iii-create-page`. S5a: 3/3 tasks (5a.1–5a.3), delivered as **two** chained PRs (this apply pass measured 526 authored lines, over budget as one PR; a two-way split at existing commit boundaries brought both slices under 400 with nothing shrunk — see "Review budget measurement (S5a)"): `feat/challenge-ui-s5a-i-challenge-card` (`buttonClassName` + `ChallengeCard`, 350 lines) and `feat/challenge-ui-s5a-ii-browse-page` (`browse-list.tsx` + `page.tsx`, 176 lines, based on s5a-i). This apply pass resumed an interrupted prior attempt that had left the S5a production/test files uncommitted on `feat/challenge-ui-s5a-browse-route` (no commits, no docs) — see "Completed: Phase S5a" below for the audit performed against that uncommitted work, the one real gap it found and fixed, and why the branch was split rather than reused as-is. S5b: 7/7 tasks (5b.1–5b.7), delivered as **seven** chained PRs (the contingent split's own two-branch estimate did not hold, measured after 5b.3 and again after 5b.6 — see "Review budget measurement (S5b)"): `feat/challenge-ui-s5b-i-a-view-primitives`, `feat/challenge-ui-s5b-i-b-view-body`, `feat/challenge-ui-s5b-i-c-view-page` (the S5b-i read-only view, no Join control), then `feat/challenge-ui-s5b-ii-a-join-action`, `feat/challenge-ui-s5b-ii-b-join-form-body`, `feat/challenge-ui-s5b-ii-c-join-wiring`, `feat/challenge-ui-s5b-ii-d-reason-banner` (the S5b-ii join half). No `size:exception` was needed — every slice landed under 400 authored lines.

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

Design's hard constraints state `displayName = "GameName#TAG"` or `"Unknown account"` if the account row vanished, and say platformLabel/lastCheckedAt should "degrade sensibly." Implemented: `platformLabel = "Unknown"` (not "Unknown account" — avoids repeating the same string in two fields of one row) and `lastCheckedAt = null`, which falls out naturally since a vanished account has no `puuid` left to call `polling.getState` with — the code short-circuits to `pollState = null` rather than treating it as a separate case. Commented inline in `get-challenge-view.ts`.

**Coverage backfill (correction pass on `feat/challenge-ui-s3b-ii-challenge-view`, commit `e6405cf`):** this branch originally shipped without a dedicated test for this case (see the former "Issues found" entry, now resolved). A characterization test, `"degrades to a placeholder when the Riot account row vanished after joining"`, was added to `get-challenge-view.test.ts`. Because the production code already existed, this is a characterization backfill, not new RED/GREEN: the test was observed **PASSING on first run** (12/12 in the file, `pnpm exec vitest run src/application/get-challenge-view.test.ts`). Test coverage of the branch was then proven with a one-off mutation check — temporarily changed the `"Unknown account"` fallback string to `"MUTATED_FOR_CHECK"` in `get-challenge-view.ts`, re-ran the same command, observed exactly the new test **FAIL** (`AssertionError`, `displayName` expected `"Unknown account"`, received `"MUTATED_FOR_CHECK"`; 1 failed, 11 passed), then reverted the mutation (confirmed via `git diff --stat` on the production file returning empty) and re-ran, observing **12/12 PASS** again. The mutation was never committed. `pnpm typecheck` and `pnpm lint` stayed clean on `feat/challenge-ui-s3b-ii-challenge-view` throughout. This closes the coverage gap; the branch is otherwise unchanged.

## TDD Cycle Evidence (S3b)

Strict TDD active. Every pair followed RED (test referencing a not-yet-existing symbol, confirmed failing) → GREEN (implementation, confirmed passing) → REFACTOR (checked, none needed — every file came out clean on the first pass: no duplication, no magic numbers, `findCriterion` in `rule-text.ts` already avoided repeating the four `.find()` type guards inline).

| Task | Function(s) | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|---|
| 3b.1–3b.2 | `ruleToSentence`, `rulesToSentences`, `ROLE_LABELS`, `QUEUE_LABELS` | `rule-text.test.ts`, `match.test.ts` | Unit (pure) | ✅ 375/375 (pre-existing suite) | ✅ Written — `pnpm exec vitest run src/domain/rule-text.test.ts src/domain/match.test.ts` → `rule-text.test.ts`: `Error: Cannot find package '@/domain/rule-text'`, 0 tests ran; `match.test.ts`: 4 failed (`ROLE_LABELS`/`QUEUE_LABELS` undefined), 7 passed | ✅ 19/19 passed | ✅ 8 cases in `rule-text.test.ts` (won+champion, no-criteria, singular, role, queue, combined-ordering, unknown-role, `rulesToSentences`-order) + 4 in `match.test.ts` | ➖ None needed |
| 3b.3–3b.4 | `deriveChallengeState`, `getChallengeView` | `challenge-state.test.ts`, `get-challenge-view.test.ts` | Unit (pure) + Unit (in-memory port fakes) | N/A (new files) | ✅ Written — `pnpm exec vitest run src/domain/challenge-state.test.ts src/application/get-challenge-view.test.ts` → both: `Error: Cannot find package '@/domain/challenge-state'` / `'@/application/get-challenge-view'`, 0 tests ran | ✅ 15/15 passed (4 + 11) | ✅ 15 cases total (see task list above) | ➖ None needed |
| 3b.3–3b.4 backfill (correction pass, `feat/challenge-ui-s3b-ii-challenge-view` @ `e6405cf`) | `getChallengeView` — vanished-account branch | `get-challenge-view.test.ts` | Unit (in-memory port fakes) | ✅ 11/11 (pre-existing file, before backfill) | ➖ N/A — characterization test, production code pre-existed | ✅ Observed PASSING on first run: 12/12 (`pnpm exec vitest run src/application/get-challenge-view.test.ts`) | ➖ N/A — single case for the one named branch | ✅ Mutation check in place of REFACTOR: mutated `"Unknown account"` → `"MUTATED_FOR_CHECK"`, re-ran → 1 failed/11 passed (only the new case), reverted (`git diff --stat` on production file empty), re-ran → 12/12 PASS |
| 3b.5–3b.6 | `listPublicChallenges` | `list-public-challenges.test.ts` | Unit (in-memory port fake) | N/A (new file) | ✅ Written — `pnpm exec vitest run src/application/list-public-challenges.test.ts` → `Error: Cannot find package '@/application/list-public-challenges'`, 0 tests ran | ✅ 4/4 passed | ✅ 4 cases (see task list above) | ➖ None needed |

### Test Summary (S3b)

- **Total tests written**: 32 (`rule-text` 8, `match` (`ROLE_LABELS`/`QUEUE_LABELS`) 4, `challenge-state` 4, `get-challenge-view` 12 — 11 original + 1 vanished-account backfill, `list-public-challenges` 4)
- **Total tests passing**: 32/32 new, 407/407 full suite (baseline 375 + 32)
- **Layers used**: Unit — pure function (27: rule-text 8 + match 4 + challenge-state 4 + list-public-challenges' `deriveChallengeState`-dependent assertions folded into its 4 + rule-text/match subtotal already counted), Unit — hand-written in-memory port fakes, no mocking library, no casts (11, all in `get-challenge-view.test.ts`; `list-public-challenges.test.ts` also uses one hand-written fake but its assertions are covered above)
- **Approval tests** (refactoring): None — no refactoring tasks in this slice
- **Pure functions created**: 3 (`ruleToSentence`/`rulesToSentences` counted as one cohesive pair, `deriveChallengeState`); `getChallengeView` and `listPublicChallenges` are factories closing over injected async dependencies, not pure, by design (same pattern as S3a's `createChallenge`/`joinChallenge`)

## Work Unit Evidence (S3b)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run src/domain/rule-text.test.ts src/domain/match.test.ts src/domain/challenge-state.test.ts src/application/get-challenge-view.test.ts src/application/list-public-challenges.test.ts` → 5 test files, 43 tests (11 in `match.test.ts` incl. the 4 new label cases, 8 in `rule-text.test.ts`, 4 in `challenge-state.test.ts`, 12 in `get-challenge-view.test.ts` incl. the vanished-account backfill, 4 in `list-public-challenges.test.ts`), all passing; full-suite confirmation: `pnpm test` → `Test Files 42 passed (42)`, `Tests 407 passed (407)` |
| Runtime harness command/scenario and exact result | N/A — `getChallengeView` and `listPublicChallenges` are unreferenced application-layer functions with no route or composition root calling them yet (S4b's create action needs neither; S5a's browse page and S5b's view page are the first callers, per the dependency graph `S3b ──► S5a`, `S3b ──► S5b`). Proven by construction: `git diff --stat` for this slice touches only `src/domain/{match,rule-text,challenge-state}.ts` and `src/application/{get-challenge-view,list-public-challenges}.ts` (+ their tests); `pnpm build` shows the same 6 routes as S3a, none touching these functions |
| Rollback boundary | Revert `src/domain/match.ts`/`src/domain/match.test.ts` to their pre-S3b state (removing `ROLE_LABELS`/`QUEUE_LABELS`) and delete `src/domain/rule-text.ts`, `src/domain/rule-text.test.ts`, `src/domain/challenge-state.ts`, `src/domain/challenge-state.test.ts`, `src/application/get-challenge-view.ts`, `src/application/get-challenge-view.test.ts`, `src/application/list-public-challenges.ts`, `src/application/list-public-challenges.test.ts`. Nothing else in the repo imports any of these new/changed symbols yet (S4a/S4b/S5a/S5b have not landed), so this reverts cleanly with no orphaned imports. Each of the three chained branches below reverts independently at its own boundary too. |

## Verification (S3b, task 3b.7)

| Command | Result |
|---|---|
| `pnpm test` | exit 0 — `Test Files 42 passed (42)`, `Tests 407 passed (407)` (baseline 375 + 32 new, incl. the vanished-account backfill) |
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean |
| `pnpm lint` | exit 0 |
| `pnpm build` | exit 0 — compiled successfully, same 6 routes as S0/S1/S2/S3a (`/`, `/_not-found`, `/account`, `/api/auth/[...nextauth]`, `/privacy`, `/terms`), all still `ƒ` dynamic — expected, since S3b adds no route |
| `rg -n "from \"@/adapters\|from \"zod` on the 4 new/modified `src/application`+`src/domain` non-test files | 0 matches — no `src/adapters` import, no `zod` import from `src/application` |
| `rg -n "throw new"` on the same 4 files | 0 matches — no thrown domain errors, matching the "factory + typed result" house rule |
| Each of the three chained branches checked out and independently verified with `pnpm exec vitest run` + `pnpm exec tsc --noEmit` before this report | s3b-i: 387/387 tests, clean typecheck. s3b-ii (after the coverage-backfill correction, `e6405cf`): 403/403 tests, clean typecheck. s3b-iii (current branch, rebased onto the corrected s3b-ii): 407/407 tests, clean typecheck — see "Review budget measurement (S3b)" |

## Review budget measurement (S3b)

Measured per sub-slice with `git diff --stat <base>..<branch> -- ':!openspec/**'`: **total S3b: 908 authored lines** (195 + 553 + 160) — well above the tasks-agent's own 250–400 estimate for the whole slice, and above the pre-authorized three-way example split the prompt itself suggested (`feat/challenge-ui-s3b-i-rule-text` = 3b.1–3b.2, `feat/challenge-ui-s3b-ii-challenge-view` = 3b.3–3b.4, `feat/challenge-ui-s3b-iii-public-list` = 3b.5–3b.7 + docs): measuring that exact split shows the middle slice alone is 553 lines (after the coverage-backfill correction below), over budget.

| Sub-slice | Tasks | Files | Base | Raw changed lines | Builds/tests alone because |
|---|---|---|---|---|---|
| **s3b-i** — `rule-text` + labels | 3b.1, 3b.2 | `src/domain/{match,rule-text}.{ts,test.ts}` | `feat/challenge-ui-s3a-iii-join-challenge` | 195 | Pure domain additions; nothing calls `ruleToSentence`/`ROLE_LABELS`/`QUEUE_LABELS` outside their own tests yet; `pnpm exec vitest run` + `pnpm exec tsc --noEmit` both clean in isolation |
| **s3b-ii** — `challenge-state` + `get-challenge-view` | 3b.3, 3b.4 | `src/domain/challenge-state.{ts,test.ts}`, `src/application/get-challenge-view.{ts,test.ts}` | s3b-i | **553 — exceeds budget, owner-accepted `size:exception`, see below** (518 as first delivered + 35 from the coverage-backfill correction pass) | Imports only `rule-text`/labels from s3b-i and the pre-existing ports; no route calls it yet; clean in isolation |
| **s3b-iii** — `list-public-challenges` + verify | 3b.5, 3b.6, 3b.7 | `src/application/list-public-challenges.{ts,test.ts}`, `tasks.md`, this file | s3b-ii | 160 | Imports only `deriveChallengeState`/`rulesToSentences` from earlier slices and the pre-existing ports; carries the full `pnpm typecheck && pnpm lint && pnpm build && pnpm test` run reported above |

**s3b-ii needs `size:exception` — one honest slicing pass found no cohesive split, stated plainly. The owner has explicitly ACCEPTED this exception; do not attempt to shrink s3b-ii further.** Three restructurings were considered and rejected before accepting the exception:

1. *Move `challenge-state.ts` (49 lines) into s3b-i or s3b-iii instead of s3b-ii.* Tried the arithmetic: `get-challenge-view.ts` + `get-challenge-view.test.ts` alone are 128 + 341 = **469 lines** — still over 400 with `challenge-state.ts` moved out entirely. Rejected: doesn't fix the actual problem, and it separates the shared helper from its first consumer for no benefit.
2. *Split `get-challenge-view.test.ts`'s cases across two commits, both against the same finished `get-challenge-view.ts`.* Rejected: the apply brief's own instruction is "cover exactly the cases in tasks 3b.3, 3b.5" as one RED batch before one GREEN; shipping the production code in commit 1 with only some of its branches under test (e.g., sorting or zero-fill proven only in commit 2) means commit 1 ships tested-looking code that is not actually fully tested yet, which is worse than one honestly-oversized PR.
3. *Extract `buildParticipantView` into its own file with its own smaller fake set (only `riotAccounts`+`polling`, not the full `ChallengeRepository`), to create a genuine sub-module boundary.* This is real architecture, not a size trick, but it is not what design.md or tasks.md 3b.3/3b.4 asked for — task 3b.4 names one file, `get-challenge-view.ts`, and design.md's use-case snippet shows no such split. Doing it only to hit a line count would be restructuring code to fit the budget, which the chained-pr skill and this apply's own hard constraints explicitly forbid ("the budget constrains how work is sliced, never the code itself").

The lines are irreducible without cutting one of: the three hand-written port fakes this use case's dependencies require (`ChallengeRepository` — 9 methods, `RiotAccountRepository` — 5, `PollingRepository` — 5, none of which can be a partial stub per the house "no mocking library, no casts" rule), or one of the 12 test cases now required for full coverage (the original 11 named by the apply brief, plus the vanished-account backfill). Per the chained-pr skill's decision gate ("No cohesive split fits the budget after one slicing pass → Stop; deliver the best split, report the overage and why it cannot shrink further, and recommend `size:exception`"), `feat/challenge-ui-s3b-ii-challenge-view` ships as one PR at 553 lines with `size:exception` recorded here and **explicitly accepted by the owner**. This is the first slice in this change where a genuine irreducible pair exceeded budget; S1 and S3a's larger-than-forecast slices always found a cohesive split that fit.

Branches, in `feature-branch-chain` order: `feat/challenge-ui-s3b-i-rule-text` (targets `feat/challenge-ui-s3a-iii-join-challenge`) → `feat/challenge-ui-s3b-ii-challenge-view` (targets s3b-i, **`size:exception`, owner-accepted, 553 lines**) → `feat/challenge-ui-s3b-iii-public-list` (targets s3b-ii, current branch, rebased). Commit SHAs: s3b-i ends at `04b0776`, s3b-ii ends at `e6405cf` (after the coverage-backfill correction commit `test(get-challenge-view): cover the vanished Riot account branch`, superseding the earlier `2bad35c`), s3b-iii is rebased onto `e6405cf` — its feature commit is `796cac1`, and the immediately preceding docs commit (rebased) is `9927ac4`; this apply-progress update lands as a new commit on top of that.

## Deviations from design (S3b)

1. **`src/domain/challenge-state.ts` is a new file not named in design.md's File Changes table for S3b.** Design's hard constraints (relayed via this apply's prompt, not design.md's table) explicitly asked for the state derivation to be extracted into one shared pure function and left the location as this apply's call — see "Shared state derivation" above for the reasoning and the file this apply chose.
2. **`feat/challenge-ui-s3b-ii-challenge-view` ships at 553 authored lines, over the 400-line budget, with an owner-accepted `size:exception` recorded rather than a further split.** See "Review budget measurement (S3b)" for the three rejected alternatives and why none fit.

## Issues found (S3b)

None outstanding. The vanished-Riot-account branch in `getChallengeView` originally shipped without a dedicated test (see the former deviation/issue entry, now resolved) — see "Vanished-account degradation" above for the backfilled characterization test and its mutation-check evidence, committed on `feat/challenge-ui-s3b-ii-challenge-view` as `e6405cf`.

## Completed: Phase S4a — Rule builder + presets

- [x] 4a.1 RED: created `src/domain/rule-presets.test.ts` — asserts `RULE_PRESETS` exposes exactly the four presets in the spec's order · each preset's default `build({})` output survives `parseRules(serialiseRules([rule]))` (via `it.each`) · `"Win the match"` always builds `{ target: 1, criteria: [{ kind: "won" }] }`, ignoring unrelated args · an edited `target`/`champion` flows through `"Win N games with champion X"`, preserving the spec's `won, champion` criteria order · an edited `target` flows through `"Play N games"`, keeping `criteria: []` · an edited `target`/`role` flows through `"Win N ranked games as role R"`, preserving the spec's exact `won, role, queue` criteria order (not `won, queue, role` — verified against `specs/challenge-authoring/spec.md`'s "Preset Starting Points" requirement, which the design.md hard-constraint summary paraphrased in the opposite order) · a blank edited champion falls back to a non-empty default rather than producing an invalid rule.
- [x] 4a.2 GREEN: created `src/domain/rule-presets.ts` — `RulePresetArgs = { target?: number; champion?: string; role?: Role }` (one shared shape, not a discriminated union per preset; see the file's doc comment for why — every preset only reads the fields its own rule shape needs, and `parseRules` stays the only validator regardless), `RulePreset = { id, label, description, build(args): Rule }`, `RULE_PRESETS: readonly RulePreset[]` with the four presets in the spec's order: `win-the-match` (target 1, `[won]`, args ignored), `win-n-with-champion` (default target 5, `[won, champion]`), `play-n-games` (default target 10, `[]`), `win-n-ranked-as-role` (default target 5, `[won, role, queue: "ranked-solo"]`). `sanitizeTarget`/`sanitizeChampion` keep every default build valid without duplicating `parseRules`'s own rules.
- [x] 4a.3 Created `src/app/challenges/new/rule-builder.tsx` (`"use client"`, the first client component in this change) — `RuleBuilder({ initialRules, invalidRule? })`, draft in `useState<Rule[]>` seeded once from `initialRules`; renders exactly one `<input type="hidden" name="rulesJson" value={JSON.stringify(rules)} />` and no other named field; per rule, a target `Input` (type number, min 1) plus 0–4 criteria as removable `Tag` chips, a live `ruleToSentence` preview, and one `CriterionPicker` control (kind `Select` filtered to kinds not already present on that rule, with a conditional champion `Input` / role `Select` / queue `Select`, "won" needing no extra value) behind one "Add criterion" button, disabled at 4 criteria or when every kind is already present — a single unambiguous control per the spec's "Criteria count per rule is bounded between 0 and 4" scenario, rather than four separate always-visible mini-controls. "Add rule" disabled at 5 rules; each rule's "Remove rule N" disabled when it is the only remaining rule. `invalidRule` sets `error` on the named rule's target `Input` (`aria-invalid="true"`), matching D14's error naming and the design's "the builder also sets `error` on that rule's `Input`" note. See "Deviations from design (S4a)" for why the add/remove controls are plain `<button>` elements, not `Button`/`IconButton`.
- [x] 4a.4 Verify — see "Verification (S4a, task 4a.4)" below.

### Composition contract for S4b (binding — read before wiring `RuleBuilder` into `create-form.tsx`)

- **Props**: `RuleBuilder({ initialRules: Rule[], invalidRule?: { ruleIndex: number; field: string | null } | null })`.
- **Seeding**: `initialRules` is read only on mount (`useState(initialRules)`). S4b's `preset` step builds a rule via `RULE_PRESETS[i].build(args)`, wraps it in a one-element array, and passes that as `initialRules` — this is what design.md's wizard table calls "one rule appended to the draft".
- **Remount on preset change**: because `initialRules` is read once, `create-form.tsx` MUST remount `RuleBuilder` (e.g. `<RuleBuilder key={selectedPresetId} initialRules={[...]} />`) whenever the selected preset changes, or the new preset's rule is silently ignored and the old draft survives.
- **Hidden field is the only channel**: the rendered `<input type="hidden" name="rulesJson">` is the only named field this subtree contributes to the enclosing `<form>`. `create-form.tsx`'s `createChallengeAction` reads it via `formData.get("rulesJson")` and validates through `safeParseRules`, exactly as D13/D14 specify.
- **Error wiring**: on a `createChallengeAction` result with `kind: "invalid_rules"`, pass `invalidRule={{ ruleIndex: result.ruleIndex, field: result.field }}` back into `RuleBuilder` (this requires the `rules` wizard step to stay mounted, or be re-selected, when that error kind comes back — a UX decision left to S4b since it also owns the step machine).
- **Documented in the file itself**: this contract is repeated as a doc comment directly above `RuleBuilder` in `rule-builder.tsx`, so S4b does not need to cross-reference this document while wiring it in.

## TDD Cycle Evidence (S4a)

Strict TDD active. `rule-presets.ts` followed RED (test importing the not-yet-existing module, confirmed failing with `Cannot find package '@/domain/rule-presets'`) → GREEN (implementation, confirmed passing) → REFACTOR (none needed — `sanitizeTarget`/`sanitizeChampion` were written directly as named helpers, not extracted after the fact). `rule-builder.tsx` has no explicit RED/GREEN designation in tasks.md, but strict TDD is project-wide and every scenario in `challenge-authoring: Rule Builder Structure and Caps` is testable by static render given props — so its test was written first too (RED: `Cannot find package '@/app/challenges/new/rule-builder'`), confirmed failing, then implemented, then confirmed GREEN.

| Task | Function/Component | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|---|
| 4a.1–4a.2 | `RULE_PRESETS` | `rule-presets.test.ts` | Unit (pure) | ✅ 407/407 (pre-existing suite) | ✅ Written — `pnpm exec vitest run src/domain/rule-presets.test.ts` → `Error: Cannot find package '@/domain/rule-presets'`, 0 tests ran | ✅ 10/10 passed | ✅ 10 cases (preset order, 4× default-build-round-trip via `it.each`, fixed-shape-ignores-args, edited-champion-flow, edited-target-flow, edited-role-flow-with-order-check, blank-champion-fallback) | ➖ None needed |
| 4a.3 | `RuleBuilder` (+ `CriterionPicker`, `RuleEditor`) | `rule-builder.test.tsx` | Component (SSR markup) | N/A (new file) | ✅ Written — `pnpm exec vitest run src/app/challenges/new/rule-builder.test.tsx` → `Error: Cannot find package '@/app/challenges/new/rule-builder'`, 0 tests ran | ⚠️ First GREEN attempt failed on 4/10 cases — see the note below | ✅ 10 cases (add-rule cap on/off, remove-rule cap on/off, add-criterion cap on/off, 0-criteria "play N games" rendering, exactly-one hidden field with the correct serialised value, invalidRule marks `aria-invalid`, no `aria-invalid` when absent) | ➖ None needed |

**Note on the 4a.3 GREEN cycle — a test-helper bug, not a production bug.** The first implementation attempt failed 4/10 cases. Root-caused to the *test* file, not `rule-builder.tsx`: (1) a naive `.not.toContain("disabled")` false-positived against every button's own `disabled:opacity-38 disabled:cursor-not-allowed` Tailwind classes, which contain the substring `"disabled"` regardless of the real `disabled` attribute's state; (2) the `buttonMarkup` regex helper closed a button's opening tag (`<button[^>]*>`) before searching for a needle, so a needle living inside the opening tag's own attributes (`aria-label="Remove rule 1"`) could never match. Fixed both in the test only: `isDisabledButton()` now checks the literal `\sdisabled=""` attribute string, and `buttonMarkup()`'s regex no longer closes the opening tag before searching. Re-ran → 10/10 passed with no production-code change. Recorded here because strict-tdd's evidence table is meant to catch exactly this kind of false failure/false pass distinction.

### Test Summary (S4a)

- **Total tests written**: 20 (`rule-presets` 10, `rule-builder` 10)
- **Total tests passing**: 20/20 new, 427/427 full suite (baseline 407 + 20)
- **Layers used**: Unit — pure function (10, `rule-presets`), Component — SSR markup via `renderToStaticMarkup` (10, `rule-builder`)
- **Approval tests** (refactoring): None — no refactoring tasks in this slice
- **Pure functions created**: 3 (`sanitizeTarget`, `sanitizeChampion`, and the module-level `RULE_PRESETS` array of `build` functions, each pure); `RuleBuilder`/`RuleEditor`/`CriterionPicker` are stateful client components, not pure, by design

## Work Unit Evidence (S4a)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run src/domain/rule-presets.test.ts src/app/challenges/new/rule-builder.test.tsx` → 2 test files, 20 tests, all passing; full-suite confirmation: `pnpm test` → `Test Files 44 passed (44)`, `Tests 427 passed (427)` |
| Runtime harness command/scenario and exact result | N/A — `RULE_PRESETS` and `RuleBuilder` are unreferenced: no route or composition root imports either yet (S4b's `create-form.tsx` is the first caller of both, per the dependency graph `S4a ──► S4b`). Proven by construction: `pnpm build` shows the same 6 routes as S3b, none touching these modules; `rg -l "from \"@/domain/rule-presets\"\|from \"@/app/challenges/new/rule-builder\"" src --glob '!*.test.*'` returns only the two production files' own internal use (`rule-builder.tsx` does not import `rule-presets.ts` — presets are S4b's concern, consumed only through the `initialRules` prop) |
| Rollback boundary | Delete `src/domain/rule-presets.ts`, `src/domain/rule-presets.test.ts`, `src/app/challenges/new/rule-builder.tsx`, `src/app/challenges/new/rule-builder.test.tsx`. Nothing else in the repo imports any of these yet (S4b has not landed), so this reverts cleanly with no orphaned imports. |

## Verification (S4a, task 4a.4)

| Command | Result |
|---|---|
| `pnpm test` | exit 0 — `Test Files 44 passed (44)`, `Tests 427 passed (427)` (baseline 407 + 20 new) |
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean |
| `pnpm lint` | exit 0 |
| `pnpm build` | exit 0 — compiled successfully, same 6 routes as S0/S1/S2/S3a/S3b (`/`, `/_not-found`, `/account`, `/api/auth/[...nextauth]`, `/privacy`, `/terms`), all still `ƒ` dynamic — expected, since S4a adds no route |
| `rg '"use client"' src/components/ui src/components/icons` | 0 matches (exit 1, no output) — confirms no S1 primitive gained the directive; `rule-builder.tsx` itself is the one new file that carries it |
| Each sub-slice branch checked out and independently verified with `pnpm exec vitest run` + `pnpm exec tsc --noEmit` | s4a-i (`feat/challenge-ui-s4a-i-rule-presets`): 417/417 tests, clean typecheck. s4a-ii (`feat/challenge-ui-s4a-ii-rule-builder`, current branch): 427/427 tests, clean typecheck, plus the full `pnpm typecheck && pnpm lint && pnpm build` run reported above |

## Review budget measurement (S4a)

Measured with `git diff --numstat <base>..<branch> -- ':!openspec/**'`: **total S4a: 631 authored lines** (177 + 454) — well above the tasks-agent's own 180–260 estimate for the whole slice, and above what the tasks-agent's own pre-authorized split (`feat/challenge-ui-s4a-i-rule-presets` = 4a.1–4a.2, `feat/challenge-ui-s4a-ii-rule-builder` = 4a.3–4a.4 + docs) can fit into budget on its own: measuring that exact split shows the *first* half comfortably under budget, but the second half is 454 lines by itself — already over 400 as a single task pair, before any docs commit is added on top.

| Sub-slice | Tasks | Files | Base | Raw changed lines | Builds/tests alone because |
|---|---|---|---|---|---|
| **s4a-i** — `rule-presets` | 4a.1, 4a.2 | `src/domain/rule-presets.{ts,test.ts}` | `feat/challenge-ui-s3b-iii-public-list` | 177 | Pure domain addition; nothing calls `RULE_PRESETS` yet; `pnpm exec vitest run src/domain/rule-presets.test.ts` + `pnpm exec tsc --noEmit` both clean in isolation |
| **s4a-ii** — `rule-builder` + verify | 4a.3, 4a.4 | `src/app/challenges/new/rule-builder.{tsx,test.tsx}`, `tasks.md`, this file | s4a-i | **454 — exceeds budget, `size:exception` accepted by the owner** | Imports only `Tag`/`Input`/`Select`/`Card`/`Icon` from S1 and `ruleToSentence` from S3b, not `rule-presets` from s4a-i; carries the full `pnpm typecheck && pnpm lint && pnpm build && pnpm test` run reported above |

**s4a-ii needs `size:exception` — one honest slicing pass found no cohesive split, stated plainly. The owner accepted this exception on 2026-09-19 after the apply pass, through the orchestrator, matching the process used for S3b.** Two restructurings were considered and rejected before recommending the exception, following the same reasoning `apply-progress.md`'s S3b section already used for its own irreducible `get-challenge-view` pair:

1. *Split `rule-builder.test.tsx`'s cases across two commits, both against the same finished `rule-builder.tsx`.* Rejected: shipping the production component in commit 1 with only some of its rendered branches under test (e.g. the caps proven in commit 1, the hidden-field serialisation and `invalidRule` wiring only in commit 2) means commit 1 ships tested-looking code that is not actually fully tested yet — the same reasoning S3b's own review-budget section already rejected this exact move for.
2. *Extract `CriterionPicker` (and/or `RuleEditor`) into their own file(s), each with their own smaller test file, to create a genuine sub-module boundary and a real second commit.* `CriterionPicker` is self-contained enough that this is not obviously artificial the way S3b's rejected `buildParticipantView` extraction was — but design.md's File Changes table names exactly one file for this task (`src/app/challenges/new/rule-builder.tsx` — "Client rule/criteria editors"), and task 4a.3 in `tasks.md` names the same single file with no sub-module called out. Splitting it now, only to land under 400, is the same move S3b's review-budget section already rejected for `get-challenge-view.ts`: "restructuring code to fit the budget, which the chained-pr skill and this apply's own hard constraints explicitly forbid." Not done.

The lines are irreducible without either shipping the component partially tested (rejected above) or inventing a file split the design never asked for (also rejected above). Per the chained-pr skill's decision gate ("No cohesive split fits the budget after one slicing pass → Stop; deliver the best split, report the overage and why it cannot shrink further, and recommend `size:exception`"), `feat/challenge-ui-s4a-ii-rule-builder` ships as one PR at 454 lines with `size:exception` recommended by the apply pass and **accepted by the owner** (2026-09-19) before the PR was opened.

Branches, in `feature-branch-chain` order: `feat/challenge-ui-s4a-i-rule-presets` (targets `feat/challenge-ui-s3b-iii-public-list`) → `feat/challenge-ui-s4a-ii-rule-builder` (targets s4a-i, current branch, **`size:exception` owner-accepted, 454 lines**). Commit SHAs: s4a-i ends at `09871da`, s4a-ii's feature commit is `0f24ad3`, this apply-progress update lands as a new commit on top of that.

**Working-tree note.** The orchestrator's launch prompt checked out a single branch, `feat/challenge-ui-s4a-rule-builder`, based on `feat/challenge-ui-s3b-iii-public-list`, and both commits (4a.1–4a.2, then 4a.3–4a.4) initially landed on it. Once the measured total exceeded 400, that branch was split at its existing commit boundary — `git branch feat/challenge-ui-s4a-i-rule-presets` at the first commit, then `git branch -m ... feat/challenge-ui-s4a-ii-rule-builder` renaming the original branch — with no code changes, matching the pattern S1/S3a/S3b's apply-progress already used when a single-branch plan proved too coarse once measured.

## Deviations from design (S4a)

1. **`rule-builder.tsx`'s add/remove controls are plain `<button>` elements, not the `Button`/`IconButton` primitives, even though the prompt says "Use only S1 primitives and theme utility names."** D8 (decided in S1, `apply-progress.md`'s S1 section, and restated in `design.md` line 120) deliberately drops `onClick` from both `Button`'s and `IconButton`'s prop types — `Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">` — because every other consumer of those primitives drives them through a form submission or a server action, never client state. `rule-builder.tsx`'s "Add rule" / "Remove rule N" / "Add criterion" controls mutate `useState`, not a form, so TypeScript rejects passing `onClick` to either primitive (confirmed: `tsc` reports `Property 'onClick' does not exist`). Reopening D8 to add `onClick` back to two already-shipped, already-tested S1 files was rejected — it would be a cross-cutting change to a finalized shared component outside this task's assigned scope (4a.1–4a.4 only). Instead, `rule-builder.tsx` defines two local class-name constants (`SECONDARY_BUTTON_CLASSES`, `GHOST_ICON_BUTTON_CLASSES`) that reuse the exact same theme utility tokens `Button`'s `secondary` variant and `IconButton`'s `ghost` variant already use, and renders plain `<button>` elements with those classes plus the vendored `Icon` component — satisfying "theme utility names" and "no arbitrary values / no inline styles" literally, while satisfying "S1 primitives" for every element that does not need `onClick` (`Card`, `Input`, `Select`, `Tag`, `Icon` are all used as-is).
2. **Preset criterion order for "Win N ranked games as role R" follows `specs/challenge-authoring/spec.md` (`won, role, queue`), not the paraphrase in this apply's own prompt's hard constraints (`won, queue, role`).** Verified directly against the spec file before implementing (see "Apply Notes" in the return report) — `specs/challenge-authoring/spec.md` line 82 states the criteria array as `[{ kind: "won" }, { kind: "role", role: R }, { kind: "queue", queue: "ranked-solo" }]` verbatim, and the spec is the named source of truth in this change's `tasks.md` header. A dedicated test case (`"matching the spec's criteria order"`) pins this exact order so a future edit cannot silently drift either way.
3. **`feat/challenge-ui-s4a-ii-rule-builder` ships at 454 authored lines, over the 400-line budget, with an owner-accepted `size:exception`.** See "Review budget measurement (S4a)" for the two rejected alternatives and why neither fits without either under-testing the component or inventing a file split the design never asked for.

## Issues found (S4a)

None outstanding. See the "Note on the 4a.3 GREEN cycle" above for a test-helper bug that was caught and fixed before any test was reported as passing (it never produced a false GREEN — the affected cases failed loudly, as intended).

## Completed: Phase S4b — `/challenges/new` route + action

- [x] 4b.1 Created `src/app/challenges/new/actions.ts` (`"use server"`) — `createChallengeAction(_prevState, formData)`: `auth()` gate returning `{ kind: "unauthenticated" }` when absent; fresh `getAppDb()` per call; `createChallenge({ challenges: createChallengeRepository(db), riotAccounts: createRiotAccountRepository(db), newId: () => crypto.randomUUID() })({ ownerId, title, startsAt, endsAt, visibility, rulesJson, joinAsRiotAccountId })`, reading every field via `String(formData.get(...) ?? "")`; `selfJoin` is `true` only when `formData.get("selfJoin") === "on"`, and `joinAsRiotAccountId` is `null` unless `selfJoin` is true **and** a non-empty `riotAccountId` was submitted; on `kind !== "created"` returns the result unchanged; on success `revalidatePath("/challenges")` then `redirect(\`/challenges/${result.id}\`)`, both calls **outside** any try/catch, matching `redirect.md`'s documented behaviour (it throws).
- [x] 4b.2 Created `src/app/challenges/new/page.tsx` (server) — `auth()`; signed out renders a sign-in panel (`<AuthStatus />`, no rule builder) inside a `Card`, matching `/account`'s pattern and keeping the URL shareable per the spec's "redirected **or** shown a sign-in prompt"; signed in calls `createRiotAccountRepository(db).listByUser(session.user.id)` and renders `<CreateForm accounts={accounts} />`. `metadata.title = "Create a challenge"`.
- [x] 4b.3 Created `src/app/challenges/new/create-form.tsx` (`"use client"`, thin) and `src/app/challenges/new/create-form-body.tsx` (`"use client"`, the actual wizard) — see "Deviation: create-form-body.tsx split" below for why this is two files, not the one design.md names. `create-form-body.tsx` contains: one `<form action={formAction}>` wrapping all four steps (`preset → rules → details → review`), inactive steps carrying the `hidden` attribute (never unmounted) so `FormData` always carries every field and Back never loses input; no field carries `required` anywhere; the `preset` step renders `RULE_PRESETS` as selectable `Card`s (plain `<button>` wrappers, D8) plus "Start from scratch", seeding `<RuleBuilder key={presetId} initialRules={[preset.build({})]} onChange={setRulesDraft} />` (remounted via `key` on preset change, per S4a's composition contract); the `details` step collects `title` (`Input`), `startsAt`/`endsAt` (`Input type="datetime-local"`), visibility as a `Radio` pair, and the self-join control; the `review` step restates every rule via `rulesToSentences(rulesDraft)`, shows the window/visibility/self-join summary, and holds the **only** `type="submit"` button (`Button`, `loading={pending}`); `messageFor(state)` maps every `CreateChallengeActionState.kind` to its exact English message from design.md's table; on `kind === "invalid_rules"` the step machine jumps back to `rules` and `invalidRule` is passed into `RuleBuilder`. The `role="status"` message region satisfies A13.
- [x] 4b.4 Verify — see "Verification (S4b, task 4b.4)" below.

### Deviation: `create-form-body.tsx` split

Design.md's File Changes table and task 4b.3 name exactly one file, `create-form.tsx`. This apply ships two: `create-form.tsx` (thin — just `useActionState(createChallengeAction, null)` wired to `<CreateFormBody />`) and `create-form-body.tsx` (everything structural, the self-join control, and `messageFor`).

This is not a style choice or a budget trick — it is forced by a hard, pre-existing Vitest infrastructure limit, confirmed directly before writing any test: `import("@/auth")` throws `ERR_MODULE_NOT_FOUND` under plain Vitest (`next-auth`'s `lib/env.js` does `import ... from "next/server"`, which only resolves inside Next's own bundler, not plain Node ESM). `create-form.tsx` must import the runtime value `createChallengeAction` from `actions.ts`, which imports `@/auth` — and ES module imports evaluate eagerly at load time regardless of which named export a caller actually uses, so **any** test importing anything from a file that also imports `actions.ts` at the top level would hit this failure, including a test that only imports a pure helper like `messageFor`. No existing test in this codebase imports `@/auth` either (`link-form.tsx`/`account/actions.ts` have no test file — the same gap, just not previously named).

The fix: `create-form-body.tsx` imports `type { CreateChallengeActionState }` from `actions.ts` (a type-only import, confirmed to be elided entirely by esbuild/Vitest's transform — no runtime module load happens) but never imports the runtime `createChallengeAction`. It takes `state`/`formAction`/`pending` as plain props instead, matching Next's own documented "Passing actions as props" pattern (`07-mutating-data.md`). This keeps `create-form.tsx`'s literal skeleton exactly as design.md specifies (`useActionState(createChallengeAction, null)` lives there) while making every testable behaviour reachable without ever loading `next-auth`.

### Composition contract used from S4a (confirmed, not reopened)

`RuleBuilder`'s S4a-documented contract was followed exactly: `initialRules` seeded from `RULE_PRESETS[i].build({})` (or one empty-criteria `{ target: 1, criteria: [] }` rule for "Start from scratch"), remounted via `key={presetId}` on every preset change, `invalidRule` passed back on `kind === "invalid_rules"`. One small, additive change was made to `rule-builder.tsx` itself in this slice — see "S4a addition" below.

### S4a addition: `RuleBuilder` gains an optional `onChange` prop

The review step needs a read-only copy of the current rule draft to preview via `rulesToSentences`, and `RuleBuilder`'s draft lives in its own `useState`, unreachable from outside (the hidden `rulesJson` field is the only other channel, and it is not readable as React state without re-parsing JSON on every keystroke). Per the phase brief's own suggestion, `rule-builder.tsx` gained an optional `onChange?(rules: Rule[]): void` prop:

- Fires once synchronously on mount, from a `useState` lazy initializer (`useState<Rule[]>(() => { onChange?.(initialRules); return initialRules; })`) — this executes during the component's first render, including under `react-dom/server`'s `renderToStaticMarkup`, which is what makes the initial notification provable by a static-markup test (see the TDD evidence table below). A `useEffect` was considered and rejected: effects never run during SSR, so an effect-based notification would be entirely untestable at this layer, and (separately) `eslint`'s `react-hooks/set-state-in-effect` rule already flags synchronous `setState` inside an effect body elsewhere in this same slice — see the next deviation.
- Fires again after every add/remove/edit handler, computed via a small internal `commit(updater)` helper that reads `rules` from the closure and calls `setRules(next)` then `onChange?.(next)` as two plain synchronous statements — deliberately **not** inside `setRules`'s functional-updater form, because that updater function must stay pure (React may call it more than once), and calling a prop callback that can trigger a *different* component's `setState` from inside it would violate that.

Interactive updates (add/remove) are not provable under `renderToStaticMarkup` (no event system) — the same documented limitation every other add/remove test in `rule-builder.test.tsx` already carries; the S7 Playwright spec is the interaction coverage. The *initial* notification is a real, render-time behavioural signal this layer can prove, and is the one covered here.

### Deviation: step-back navigation uses render-time state adjustment, not `useEffect`

The wizard needs to jump back to the `rules` step when a fresh `invalid_rules` result arrives (the `review` step has no target `Input` to mark invalid). The first implementation used `useEffect(() => { if (state?.kind === "invalid_rules") setStep("rules"); }, [state])`, which `pnpm lint` rejected: `react-hooks/set-state-in-effect` — "Calling setState synchronously within an effect can trigger cascading renders." Replaced with React's own documented "adjusting state when a prop changes" pattern (`https://react.dev/learn/you-might-not-need-an-effect`): a `reactedToState` state variable tracks the last `state` this component reacted to, and the comparison + `setStep` call happen directly in the render body (`if (state !== reactedToState) { setReactedToState(state); if (state?.kind === "invalid_rules") setStep("rules"); }`), which React explicitly supports and does not trigger the lint rule (confirmed: `pnpm lint` is clean after the change).

## TDD Cycle Evidence (S4b)

Strict TDD active project-wide. Tasks.md lists no explicit RED/GREEN pairs for S4b (a route/action/form slice, not a domain/application pair), so — per the phase brief — every testable behaviour was still test-first: RED (test referencing a not-yet-existing export or asserting a not-yet-implemented behaviour, confirmed failing) → GREEN (implementation, confirmed passing).

| Task | Behaviour | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|---|
| S4a addition (used by 4b.3) | `RuleBuilder`'s `onChange` prop | `rule-builder.test.tsx` | Component (SSR markup) | ✅ 10/10 (pre-existing suite) | ✅ Written — `pnpm exec vitest run src/app/challenges/new/rule-builder.test.tsx` → 1 failed (`expected [] to have a length of 1 but got +0`), 11 passed | ✅ 12/12 passed | ➖ Single case for the one provable behaviour (initial notification); interactive updates are not provable under `renderToStaticMarkup`, documented above | ➖ None needed |
| 4b.3 | `messageFor` (all 9 `kind`s) | `create-form-body.test.tsx` | Unit (pure) | N/A (new file) | ✅ Written — `pnpm exec vitest run src/app/challenges/new/create-form-body.test.tsx` → `Error: Cannot find package '@/app/challenges/new/create-form-body'`, 0 tests ran | ✅ 12/12 passed | ✅ 12 cases (null, created→null, invalid_title, invalid_window×2 reasons, invalid_visibility, invalid_rules-with-field, invalid_rules-no-field, invalid_rules-null-ruleIndex, too_many_rules, too_many_criteria, riot_account_not_owned, unauthenticated) | ➖ None needed |
| 4b.3 | Four steps mounted, three `hidden` | `create-form-body.test.tsx` | Component (SSR markup) | (same new-file run) | ✅ Written (same failing run above) | ✅ Passed | ➖ Single case — a structural fact with one correct answer | ➖ None needed |
| 4b.3 | Exactly one `type="submit"`, in `review` | `create-form-body.test.tsx` | Component (SSR markup) | (same) | ✅ Written | ✅ Passed | ➖ Single case | ➖ None needed |
| 4b.3 | No `required` attribute anywhere | `create-form-body.test.tsx` | Component (SSR markup) | (same) | ✅ Written | ✅ Passed | ➖ Single case | ➖ None needed |
| 4b.3 | Self-join control's 3 shapes | `create-form-body.test.tsx` | Component (SSR markup) | (same) | ✅ Written | ⚠️ First GREEN attempt failed 1/3 — see note below | ✅ 3 cases (0, 1, >1 accounts) | ➖ None needed |

**Note on the self-join GREEN cycle — a test-scoping bug, not a production bug.** The "1 account" case's first assertion (`expect(html).not.toContain("<select")`) failed because the `rules` step's own `CriterionPicker` (from S4a's `rule-builder.tsx`) always renders an unrelated `<select>` for its criterion-kind picker, regardless of self-join. Root-caused to the test asserting too broad a scope (the whole document) instead of the field it meant to check. Fixed in the test only: `expect(html).not.toMatch(/<select[^>]*name="joinAsRiotAccountId"/)`, scoping the check to the account-picker `<select>` specifically; the ">1 accounts" case's assertion was tightened the same way for symmetry. Re-ran → 3/3 passed with no production-code change.

**`actions.ts` has no dedicated test — this is not a coverage gap, it is documented and matches the phase brief.** `createChallengeAction` depends on `auth()`, `getAppDb()`, and `redirect()`; a unit test would require mocking `next-auth`, Cloudflare's `getCloudflareContext`, and `next/navigation`, and the brief explicitly forbids adding a mocking library for this. It stays a thin composition root over the already-tested `createChallenge` use case (S3a, 14 cases) — every branch of actual *logic* (validation order, caps, self-join ownership) is already covered there. `createChallengeAction` itself is exercised by the manual smoke check (below) and is the target of the S7 end-to-end `create-then-join` spec (task 7.5), which drives it through a real signed-in session against a seeded local D1 — the same position this codebase already takes for `linkRiotAccountAction`/`unlinkRiotAccountAction` (also untested under Vitest, also composition roots over tested use cases).

### Test Summary (S4b)

- **Total tests written**: 22 (`RuleBuilder onChange` 2 — one behavioural, one "does not throw when omitted" guard; `create-form-body` 20 — `messageFor` 12, structural 4, self-join 3, plus the `<form>`-count check folded into structural)
- **Total tests passing**: 22/22 new, 449/449 full suite (baseline 427 + 22)
- **Layers used**: Unit — pure function (`messageFor`, 12), Component — SSR markup via `renderToStaticMarkup` (10: 2 `RuleBuilder` + 8 `CreateFormBody`)
- **Approval tests** (refactoring): None — no refactoring tasks in this slice
- **Pure functions created**: 1 (`messageFor`); `rulesForPreset`/`initialDetails` are small pure helpers, not separately RED/GREEN'd since they have one correct output per input with no branching worth a dedicated test beyond what the structural/self-join tests already exercise

## Work Unit Evidence (S4b)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run src/app/challenges/new` → 2 test files, 32 tests (12 in `rule-builder.test.tsx` incl. the 2 new `onChange` cases, 20 in `create-form-body.test.tsx`), all passing; full-suite confirmation: `pnpm test` → `Test Files 45 passed (45)`, `Tests 449 passed (449)` |
| Runtime harness command/scenario and exact result | Manual smoke check against the repo's already-running `next dev` preview server (port 3100, left untouched — a second instance was started on port 3101 for the check and killed afterward once the existing server was found): `curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/challenges/new` → `200`; response body contains "Sign in to create a challenge." and no `<form>`/rule-builder markup (signed-out branch, confirmed correct). **Signed-in create against local D1 is deferred** — `AUTH_SECRET`/Discord OAuth are not configured locally (owner-blocked, pre-existing, not blocking per `tasks.md`'s "Apply notes"); deferred to the owner or to S7's Playwright `create-then-join` spec, which mints a real session via `next-auth/jwt`'s `encode()` and does not need interactive OAuth. |
| Rollback boundary | Delete `src/app/challenges/new/{actions,create-form,create-form-body,page}.tsx` and `src/app/challenges/new/create-form-body.test.tsx`; revert `src/app/challenges/new/rule-builder.tsx` and `rule-builder.test.tsx` to their pre-S4b state (removing the `onChange` prop). Nothing else in the repo imports any of these four new files yet (S5a/S5b have not landed); `rule-builder.tsx`'s only other consumer is `create-form-body.tsx` itself, so reverting both together is clean with no orphaned imports. |

## Verification (S4b, task 4b.4)

| Command | Result |
|---|---|
| `pnpm test` | exit 0 — `Test Files 45 passed (45)`, `Tests 449 passed (449)` (baseline 427 + 22 new) |
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean. Two real type errors were found and fixed during this slice (not pre-existing, both from `noUncheckedIndexedAccess`): `STEPS[...]` indexing in `goBack`/`goNext` needed a `?? step` fallback (`Step[]` is not a literal tuple, unlike S4a's `ROLES`/`QUEUES as const` arrays), and `accounts[0]` in the self-join control needed an explicit `firstAccount` binding rather than being read as `accounts[0].id` inline. |
| `pnpm lint` | exit 0. One real finding was caught and fixed during this slice: `react-hooks/set-state-in-effect` on the original `useEffect`-based step-back navigation — see "Deviation: step-back navigation" above for the fix. |
| `pnpm build` | exit 0 — compiled successfully; `/challenges/new` now appears in the route table alongside the existing 6 routes (`/`, `/_not-found`, `/account`, `/api/auth/[...nextauth]`, `/privacy`, `/terms`), all still `ƒ` dynamic |
| Manual smoke check (signed out) | `curl -o /dev/null -w '%{http_code}' http://localhost:3100/challenges/new` → `200`; body contains "Sign in to create a challenge." and no create-form markup |
| Manual check (signed in) | **Deferred** — no `AUTH_SECRET`/Discord OAuth configured locally; see Work Unit Evidence above for the S7 fallback path |
| Each of the three chained branches checked out and independently verified with `pnpm exec tsc --noEmit` + `pnpm exec vitest run` (+ `pnpm lint` on the largest) | s4b-i (`feat/challenge-ui-s4b-i-create-action`): 429/429 tests, clean typecheck. s4b-ii (`feat/challenge-ui-s4b-ii-create-form-body`): 449/449 tests, clean typecheck, clean lint. s4b-iii (current branch, was `feat/challenge-ui-s4b-create-route`): full `pnpm typecheck && pnpm lint && pnpm build && pnpm test` run reported above. |

## Review budget measurement (S4b)

Measured with `git diff --numstat feat/challenge-ui-s4a-ii-rule-builder -- ':!openspec/**'` (openspec docs excluded per this change's established convention): **total S4b: 845 authored lines** (66 + 65 + 633 + 81) — well above the phase brief's own 170–240 forecast (even at "about 2x", ~480), and above what the phase brief's own pre-authorized two-way split (`feat/challenge-ui-s4b-i-create-action` = 4b.1 + its test, `feat/challenge-ui-s4b-ii-create-page` = 4b.2–4b.4 + docs) can fit: 4b.1 (`actions.ts`) has no test per this slice's own documented decision, and measuring the *other* half alone (`page.tsx` + `create-form.tsx` + `create-form-body.tsx` + its test) is ~715 lines — nowhere near 400.

One honest slicing pass over the actual per-file sizes found a **three-way** cohesive split, following the same pattern S3b/S4a already established for an irreducible middle pair:

| Sub-slice | Tasks | Files | Base | Raw changed lines | Builds/tests alone because |
|---|---|---|---|---|---|
| **s4b-i** — server action + `RuleBuilder` onChange | 4b.1 (+ the S4a addition `RuleBuilder` needed) | `challenges/new/actions.ts` (65), `challenges/new/rule-builder.{tsx,test.tsx}` (44+22=66) | `feat/challenge-ui-s4a-ii-rule-builder` | 131 | `actions.ts` is unreferenced (nothing imports it yet); `rule-builder.tsx`'s `onChange` addition is purely additive and optional — every existing S4a caller/test still compiles and passes unchanged; `pnpm exec tsc --noEmit` + `pnpm exec vitest run` clean in isolation |
| **s4b-ii** — the create-form wizard body | 4b.3 | `challenges/new/create-form-body.{tsx,test.tsx}` | s4b-i | **633 — exceeds budget, `size:exception` recommended** | Imports only S1 primitives, S3b's `rulesToSentences`, S4a's `RULE_PRESETS`/`RuleBuilder`, and `type`-only from `actions.ts` (no runtime `next-auth` load); nothing routes to it yet; clean in isolation |
| **s4b-iii** — composition root + route + verify | 4b.2, 4b.4 | `challenges/new/{create-form,page}.tsx` (28+53=81), `tasks.md`, this file | s4b-ii | 81 (+ docs, excluded) | Wires `create-form-body.tsx` and `actions.ts` together into the actual route; carries the full `pnpm typecheck && pnpm lint && pnpm build && pnpm test` run reported above |

**s4b-ii needs `size:exception` — one honest slicing pass found no cohesive split, stated plainly. The owner accepted this exception on 2026-09-19 through the orchestrator, after the apply pass, as for s3b-ii and s4a-ii.** Two restructurings were considered and rejected before recommending the exception, following the exact reasoning S3b's and S4a's own review-budget sections already used:

1. *Split `create-form-body.test.tsx`'s cases across two commits, both against the same finished `create-form-body.tsx`.* Rejected: shipping the production component in commit 1 with only some of its rendered branches under test (e.g. structural coverage in commit 1, self-join coverage only in commit 2) means commit 1 ships tested-looking code that is not actually fully tested yet — the same reasoning S3b's and S4a's own review-budget sections already rejected this exact move for.
2. *Extract `messageFor` (and/or `SelfJoinControl`) into their own file(s), each with their own smaller test file.* `messageFor` is genuinely a pure, framework-free function — the same shape as `rule-text.ts`'s separation from `rule-builder.tsx` — so this is not obviously artificial. But design.md's task 4b.3 explicitly names `messageFor()` as part of `create-form.tsx`'s own bullet, and the one split this slice *did* make (`create-form.tsx` → `create-form.tsx` + `create-form-body.tsx`) was forced by a hard Vitest/`next-auth` resolution failure, not chosen for size — extending that same justified split further, this time *only* to reduce a line count, would blur "necessary" with "convenient for budget," which the chained-pr skill and this apply's own hard constraints explicitly forbid ("the budget constrains how work is sliced, never the code itself"). Not done.

The lines are irreducible without either shipping the component partially tested (rejected above) or extending a forced infra-driven file split purely for size (also rejected above). Per the chained-pr skill's decision gate ("No cohesive split fits the budget after one slicing pass → Stop; deliver the best split, report the overage and why it cannot shrink further, and recommend `size:exception`"), `feat/challenge-ui-s4b-ii-create-form-body` ships as one PR at 633 lines with `size:exception` recommended by the apply pass and **accepted by the owner** (2026-09-19) before the PR was opened, the same process S3b-ii and S4a-ii went through.

Branches, in `feature-branch-chain` order: `feat/challenge-ui-s4b-i-create-action` (targets `feat/challenge-ui-s4a-ii-rule-builder`) → `feat/challenge-ui-s4b-ii-create-form-body` (targets s4b-i, **`size:exception` recommended, 633 lines**) → `feat/challenge-ui-s4b-iii-create-page` (targets s4b-ii, current branch, was `feat/challenge-ui-s4b-create-route`). Commit SHAs: s4b-i ends at `cba79e5` (two commits: `754327b` `RuleBuilder` onChange, `cba79e5` `actions.ts`), s4b-ii's feature commit is `801b139`, s4b-iii's feature commit is `da55889`; this apply-progress update lands as a new commit on top of that.

**Working-tree note.** The orchestrator's launch prompt checked out a single branch, `feat/challenge-ui-s4b-create-route`, based on `feat/challenge-ui-s4a-ii-rule-builder`; all four commits initially landed on it in sequence. Once the measured total (845 lines) proved far over budget, that branch was split at two of its existing commit boundaries — `git branch feat/challenge-ui-s4b-i-create-action` after the second commit, `git branch feat/challenge-ui-s4b-ii-create-form-body` after the third — with no code changes, and the original branch (now holding all four commits plus this apply-progress update) keeps its name as the final `s4b-iii` slice's branch, matching the pattern S1/S3a/S3b/S4a's apply-progress already used for the same situation.

## What S4b left for S5a/S5b

- The redirect target `/challenges/[id]` 404s until S5b lands — expected, not a regression, matching the same note S4b's own task 4b.4 already carried in tasks.md.
- `create-form-body.tsx`'s split pattern (thin composition root + testable body, separated only because of the `next-auth`/Vitest resolution failure) is a precedent S5b's `join-form.tsx` may hit too, if it also needs `useActionState` bound to an action that imports `@/auth` — check before assuming a single-file `join-form.tsx` is testable as one piece.
- `RiotAccount`'s shape (`id, userId, puuid, gameName, tagLine, platform, region, verified, createdAt`) was used directly in this slice's self-join control and its tests; S5b's `PlayerRow`/`join-form.tsx` will likely need the same fields.

## Completed: Phase S5a — "/challenges" browse

- [x] 5a.1 Created `src/components/ui/challenge-card.tsx` — `ChallengeCard({ href, title, state, ruleText, endsAt })` exactly per design.md's primitives table and D10/D15 (no participant count, no coin/tier/stake props at the type level). `Card as="li" padding="none" interactive accentEdge={state === "live"}`; the whole card is one `<Link>` wrapping all content, the only anchor/interactive element in the card; a `Badge` whose tone/label pair varies per state (`upcoming` → `pending`/"Upcoming", `live` → `live`/"Live", `ended` → `neutral`/"Ended"); every `ruleText` sentence rendered via `.map()`; `endsAt` rendered through **both** deterministic mechanisms the audit brief offered — a real `<time dateTime={endsAt.toISOString()}>` **and** a fixed `Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })` for its visible text, so the rendered string is identical on every machine regardless of local timezone/locale — design-system: UI Primitives and Their States, No Gamification or Social Surface.
- [x] 5a.2 Created `src/app/challenges/page.tsx` (server, no `auth()` gate — readable signed out) — `getAppDb()` + `createChallengeRepository(db)` + `listPublicChallenges({ challenges, now: () => new Date() })()` called with no argument (default `DEFAULT_PUBLIC_LIMIT`); `metadata.title = "Challenges"`; renders `<BrowseList challenges={challenges} />`. All rendering logic (the `<ul>`/empty-state branch) lives in the sibling `browse-list.tsx`, not `page.tsx` — `page.tsx` imports `@/lib/db`'s Cloudflare-bound context exactly like `/challenges/new`'s `page.tsx` and `/account`'s, so it stays a thin, untested server root by the same precedent those routes already established; `browse-list.tsx` is fully covered under `renderToStaticMarkup` instead. No tabs, no stat tiles, no ranking module, no `actions.ts` (this route has no mutation) — challenge-discovery: Public Read Access, Listing Scope — Active Public Challenges Only, Ordering — Soonest-Ending First, Empty State, No Gamification Chrome on the Browse List. **Deviation, stated plainly**: design.md's task wording names `page.tsx` as the file that "renders a `<ul>` of `Card as="li"` … or the designed empty state" — the presentational split into `browse-list.tsx` is additive structure, not a scope change; every one of those requirements is met, just one file over from where the design's prose names them, for the same testability reason `create-form.tsx`/`create-form-body.tsx` and `page.tsx`/`login-panel.tsx` already split in S4b/earlier slices.
- [x] 5a.3 Verified — see "Verification (S5a, task 5a.3)" below.

**Additive, not-in-tasks.md change**: `src/components/ui/button.tsx` gained `buttonClassName(options)`, an exported pure function that returns the exact class string `Button` itself renders for the same `variant`/`size`/`fullWidth`/`className`, by calling the same `BASE_CLASSES`/`VARIANT_CLASSES`/`SIZE_CLASSES` maps `Button` already used. `Button`'s own render path, props, and behavior are unchanged — `buttonClassName` is purely additive. This exists because the browse page's empty-state CTA must be a `<Link>` to `/challenges/new` (a route navigation, not a form submission) styled like a primary button, and `Button` renders a `<button>` with no `href`; nesting a `<button>` inside an `<a>` is invalid HTML and two competing interactive elements. No `challenge-discovery`/`design-system` requirement is affected — this is infrastructure the design's own "primary `Button` linking to `/challenges/new`" bullet (design.md, `/challenges` — discovery) requires a caller to be able to build without inventing a second button implementation.

### Audit of the interrupted first apply pass

This apply pass resumed uncommitted work left by an earlier interrupted attempt on `feat/challenge-ui-s5a-browse-route` (based on `feat/login-page-ii-route-rewire` @ `c2e09cd`): `button.tsx`/`button.test.tsx` modified, `challenge-card.{tsx,test.tsx}`, `browse-list.{tsx,test.tsx}`, `page.tsx` created, `tasks.md`'s 5a.1–5a.3 already ticked, no commits, no apply-progress. Every item in the orchestrator's audit checklist was verified against the actual files (not assumed from the prior pass's claims):

| # | Checklist item | Finding |
|---|---|---|
| 1a | `ChallengeCard` prop shape exact match | ✅ Confirmed by reading `challenge-card.tsx` — exactly `{ href, title, state, ruleText, endsAt }` |
| 1b | `Card as="li"` + `interactive` + `accentEdge={state === "live"}` | ✅ Confirmed in code |
| 1c | One `next/link` wraps all content, no other interactive element inside | ✅ Confirmed by code read and by the existing "no nested interactive element besides the anchor" test (`expect(html).not.toContain("<button")`) |
| 1d | State `Badge` differs per state | ✅ Confirmed — `STATE_BADGE` map, tested by the existing "badge's state-specific label text" test |
| 1e | Every `ruleText` sentence rendered | ✅ Confirmed by the existing "renders every sentence of ruleText" test (2-sentence case) |
| 1f | `endsAt` rendered deterministically | ✅ Confirmed — fixed UTC/en-US `Intl.DateTimeFormat` **and** a real `<time dateTime>`, both present; tested by the existing exact-string assertion |
| 1g | No participant count, no coin/tier/stake props | ✅ Confirmed at the type level — `ChallengeCardProps` has exactly the five fields |
| 2a | `<ul>` of cards when summaries exist | ✅ Confirmed in `browse-list.tsx` and its test |
| 2b | Empty state exact copy + link CTA via `buttonClassName`, no nested `<button>` | ✅ Confirmed — exact string `"No challenges are running right now."`, `<Link href="/challenges/new" className={cta()}>`, tested by both the exact-copy assertion and the explicit `not.toContain("<button")` assertion |
| 3a | `page.tsx` server, no `auth()` gate | ✅ Confirmed — no `@/auth` import anywhere in the file |
| 3b | `metadata.title` set | ✅ Confirmed — `"Challenges"` |
| 3c | `getAppDb()` + `createChallengeRepository(db)` + `listPublicChallenges(...)()` default limit | ✅ Confirmed — called with zero arguments, so `DEFAULT_PUBLIC_LIMIT` (50) applies |
| 3d | No tabs/stat tiles/ranking, no `actions.ts` | ✅ Confirmed — `ls src/app/challenges/` shows only `page.tsx`, `browse-list.tsx`, `browse-list.test.tsx`; no `actions.ts` |
| 4a | `buttonClassName` additive, reuses `Button`'s own maps, `Button` unchanged in behavior | ✅ Confirmed by reading the diff on `button.tsx` — the new export is appended, `Button`'s own function body is byte-identical to its pre-S5a form |
| 4b | `buttonClassName` tests compare against `Button`'s own rendered output, not hardcoded Tailwind strings | ✅ Confirmed — every `buttonClassName` test extracts `Button`'s actual rendered `class` attribute via `classAttribute(html)` and compares against it; no literal Tailwind class name appears in any assertion |
| 5 | Tests assert structure/text, not class strings; English copy; no inline styles; only existing theme utilities | ✅ Confirmed — `rg` found no `style=` in any of the five new/changed files; every `text-*`/`font-*`/`bg-*`/`border-*`/`rounded-*` utility used (`text-title-3`, `text-text-primary`, `text-body-sm`, `text-text-secondary`, `text-caption`, `text-text-muted`, `text-title-2`, `tracking-title`, `text-body`) is defined in `globals.css`'s `@theme inline` map (verified with `rg` against `globals.css`); `max-w-3xl`/`max-w-md`/`mx-auto`/`px-6`/`py-24`/`mt-4`/`mt-8`/`gap-4` are unmapped default Tailwind utilities, matching the precedent S1's review already established for `h-8`/`px-3`/etc. |

**One real gap found, and fixed.** Item 1b/1d above passed as written, but a mutation check (required by this apply's TDD-evidence instructions, see below) revealed the existing "adds the accent edge only when state is live" test does not actually prove `accentEdge` tracks `state` — it passes even with `accentEdge` hardcoded to `false`, because the `Badge`'s own label/tone already differs across `live`/`upcoming`/`ended`, so the three renders are unequal regardless of `accentEdge`. A new, properly isolated test was added under strict TDD's RED → GREEN cycle (see the TDD/characterization table below): it extracts only the outer `<li ...>` opening tag — the one element `accentEdge` actually touches, and the one element `Badge` never touches — and compares that substring across states. RED confirmed against the same `accentEdge={false}` mutation (fails for the right reason), then GREEN confirmed against the restored production code. This is the one production-facing correction this apply pass made to the inherited uncommitted work; every other checklist item was already correct as found.

### TDD Cycle Evidence / characterization (S5a)

Strict TDD is active project-wide. The inherited work's own RED phase cannot be honestly re-observed (the tests and implementation both already existed, uncommitted, when this apply pass started), so per the orchestrator's explicit instruction this is recorded as **characterization**: each existing test file was run and confirmed passing, then one targeted mutation was applied to each production file and the specific test expected to catch it was confirmed to fail, then the file was restored and confirmed passing again.

| File | Characterization run | Mutation applied | Test that failed | Restored — still green? |
|---|---|---|---|---|
| `challenge-card.tsx` | `pnpm exec vitest run src/components/ui/challenge-card.test.tsx` → 8/8 passed (pre-fix) | `accentEdge={state === "live"}` → `accentEdge={false}` | **Gap found**: "adds the accent edge only when state is live" did **not** fail (see above) — a new isolated test was added (RED confirmed against this exact mutation, "expected '...' not to be '...'" on the `<li>` opening tag), then the mutation was reverted | ✅ 9/9 passed, including the new test |
| `browse-list.tsx` | `pnpm exec vitest run src/app/challenges/browse-list.test.tsx` → 5/5 passed | Empty-state copy changed from `"No challenges are running right now."` to `"Nothing is happening right now."` | "renders the designed empty state with the exact copy and no error" — failed as expected (`AssertionError: expected '...' to contain 'No challenges are running right now.'`) | ✅ 5/5 passed after revert |
| `button.tsx` | `pnpm exec vitest run src/components/ui/button.test.tsx` → 12/12 passed | `buttonClassName`'s `cn(...)` call had its `fullWidth && "w-full"` term dropped | "matches Button's own rendered class list when fullWidth is set" — failed as expected (`w-full` missing from the diff) | ✅ 12/12 passed after revert |

All three mutations/reverts and their observed outputs are captured verbatim above from the actual `vitest run` invocations executed during this apply pass (not reconstructed). Backups of the three pre-mutation files were kept under the session scratchpad and diffed byte-for-byte against the restored files to confirm the revert was exact (`diff` produced no output for any of the three).

### Test Summary (S5a)

- **Total tests in the three touched/new files**: 26 (`challenge-card.test.tsx` 9 — 8 inherited + 1 new isolated accentEdge test, `browse-list.test.tsx` 5, `button.test.tsx` 12)
- **Total tests passing**: 26/26
- **New test written by this apply pass**: 1 (`challenge-card.test.tsx`'s isolated accentEdge test), following RED → GREEN per strict-tdd
- **Layers used**: Component/SSR markup via `renderToStaticMarkup` (all 26 — matching every other UI primitive/route test in this codebase)
- **Pure functions created**: 1 (`buttonClassName`)

## Work Unit Evidence (S5a)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run src/components/ui/challenge-card.test.tsx src/app/challenges/browse-list.test.tsx src/components/ui/button.test.tsx` → `Test Files 3 passed (3)`, `Tests 26 passed (26)` |
| Runtime harness command/scenario and exact result | `pnpm exec next dev --port 3100` (started by this apply pass — no instance was actually running despite the launch prompt's claim; verified with `lsof -i :3100` and `ps aux` returning nothing before starting it); `curl http://localhost:3100/challenges` against an emptied local D1 → 200, body contains the exact empty-state copy; seeded four rows (see "Verification" below) and re-curled → 200, body contains exactly the two public-live titles, soonest-ending first, no unlisted/ended title |
| Rollback boundary | Revert `src/components/ui/button.tsx`/`button.test.tsx` to their pre-S5a form (drops `buttonClassName` and its tests only — `Button`'s own code is untouched by the revert either way); delete `src/components/ui/challenge-card.tsx`, `challenge-card.test.tsx`, `src/app/challenges/browse-list.tsx`, `browse-list.test.tsx`, `src/app/challenges/page.tsx`. Nothing else in the repo imports any of these five files yet (S5b/S6/S7 have not landed), so this reverts cleanly with no orphaned imports. |

## Verification (S5a, task 5a.3)

| Command | Result |
|---|---|
| `pnpm test` (full suite) | exit 0 — `Test Files 50 passed (50)`, `Tests 492 passed (492)` (baseline 491 + the 1 new isolated test) |
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean, on both split branches independently and on the final combined tree |
| `pnpm lint` | exit 0 |
| `pnpm build` | exit 0 — `Route (app)` now lists `ƒ /challenges` alongside the pre-existing 8 routes (`/`, `/_not-found`, `/account`, `/api/auth/[...nextauth]`, `/challenges/new`, `/login`, `/privacy`, `/terms`) |
| `pnpm db:migrate:local` | `✅ No migrations to apply!` — local D1 schema already current |
| Manual check — true empty state | The interrupted first pass had already left four `seed-*` rows in local D1 (obviously test rows by their id prefix and owner `seed-user-s5a`). Per instruction, deleted `users` row `seed-user-s5a` (cascades to its four `challenges` rows via `owner_id`'s `onDelete: "cascade"` FK), confirmed `SELECT id FROM challenges` → `[]`, then `curl http://localhost:3100/challenges` → 200, body contains `"No challenges are running right now."` |
| Manual check — seeded active/inactive mix | Wrote `seed-s5a.sql` under the session scratchpad (`/private/tmp/claude-501/-Users-jesusalfonsomontielperez-IdeaProjects-challenges/4e3dcefe-cbc0-4f0c-82db-7a2a87c65180/scratchpad/seed-s5a.sql`, not the repository) — one `users` row (`seed-user-s5a`) and four `challenges` rows it owns: `seed-challenge-public-live-3d` (public, ends in 3 days), `seed-challenge-public-live-1d` (public, ends tomorrow), `seed-challenge-unlisted-live` (unlisted, live window), `seed-challenge-public-ended` (public, ended). Column names and `mode: "timestamp_ms"` epoch-ms values match `src/db/schema.ts`; `rules_json` values (e.g. `[{"target":3,"criteria":[{"kind":"won"}]}]`) match exactly what `serialiseRules` (`JSON.stringify(rulesSchema.parse(rules))`) would emit for the same `Rule[]`, per `src/domain/rule-codec.ts`. Applied with `pnpm exec wrangler d1 execute DB --local --file <path>` → `🚣 2 commands executed successfully`. Re-curled `/challenges` → 200, body's two `<h3>` titles are exactly `"Public Live — Ends Tomorrow"` then `"Public Live — Ends In 3 Days"` (soonest-ending first, matching the challenge-discovery Ordering requirement) — neither the unlisted nor the ended title/id appears anywhere in the response (`rg -c` for both returned 0). **Rows left seeded in local D1** for the orchestrator's screenshot, per instruction. Card links to `/challenges/{id}` 404 until S5b lands — expected within the chain, not a regression. |

## Review budget measurement (S5a)

Measured with `git diff --cached --shortstat feat/login-page-ii-route-rewire -- . ':!openspec'` after staging all five touched/new `src` files: **526 authored lines** (525 insertions + 1 deletion) — over the tasks-agent's own 150–250 estimate and over the 400-line budget as one PR.

One honest slicing pass over the actual per-file sizes found a cohesive **two-way** split, each slice under 400 raw changed lines with nothing shrunk, no test or comment removed to fit:

| Sub-slice | Tasks | Files | Base | Raw changed lines | Builds/tests alone because |
|---|---|---|---|---|---|
| **s5a-i** — `buttonClassName` + `ChallengeCard` | 5a.1 (+ the additive `buttonClassName` export) | `ui/button.{tsx,test.tsx}` (59+1=60), `ui/challenge-card.{tsx,test.tsx}` (290) | `feat/login-page-ii-route-rewire` | **350** | `challenge-card.tsx` is unreferenced by any route yet; `buttonClassName` is purely additive to `button.tsx`, and `Button`'s own behavior/tests are unchanged — `pnpm exec tsc --noEmit` (via `pnpm typecheck`, to regenerate Next's route-type validator) and `pnpm exec vitest run` both clean in isolation on this branch |
| **s5a-ii** — the browse route | 5a.2, 5a.3 | `app/challenges/{browse-list,browse-list.test,page}.tsx` (176) | s5a-i | **176** | Imports only S1's `Card`/`Button` (via `buttonClassName`), S5a-i's `ChallengeCard`, and S3b's `listPublicChallenges`; wires the actual `/challenges` route; carries the full `pnpm typecheck && pnpm lint && pnpm build && pnpm test` run and the local-D1 manual checks reported above |

350 + 176 = 526, matching the combined measurement exactly. Neither slice needs a `size:exception`.

**Branch layout.** The orchestrator's launch prompt checked out one branch, `feat/challenge-ui-s5a-browse-route` (based on `feat/login-page-ii-route-rewire` @ `c2e09cd`), with all five files uncommitted on it. Per this apply's `auto-chain` instruction, that branch was left untouched (still pointing at `c2e09cd`, holding no S5a commits) and two new branches were created instead, in `feature-branch-chain` order:
- `feat/challenge-ui-s5a-i-challenge-card` (targets `feat/login-page-ii-route-rewire`) — two commits: `d5f4109` `feat(ui): add buttonClassName for link-shaped calls to action`, `3540b35` `feat(ui): add the ChallengeCard primitive`.
- `feat/challenge-ui-s5a-ii-browse-page` (targets s5a-i, current branch) — one commit so far: `b7c8999` `feat(challenges): add the /challenges browse route`. This apply-progress/tasks.md update lands as a fourth commit on top of it, per the `work-unit-commits` skill (docs stay with the work they describe rather than joining an unrelated code commit).

Both intermediate branches were checked out and independently verified with `pnpm typecheck` (after regenerating Next's route types) and `pnpm exec vitest run` before this report — both clean (21/21 and 26/26 tests passing respectively). `feat/challenge-ui-s5a-ii-browse-page` (current branch) carries the full `pnpm typecheck && pnpm lint && pnpm build && pnpm test` run and the local-D1 manual verification reported above.

## Deviations from design (S5a)

1. **`buttonClassName` is an additive export on the S1 `Button` primitive, not named in design.md's primitives table.** Needed because `Button` renders a `<button>` with no `href`, and the empty-state CTA must be a `<Link>` (a route navigation) styled identically to `Button`'s primary variant — nesting a `<button>` inside an `<a>` is invalid HTML. `Button` itself is unchanged; every test asserting `buttonClassName`'s output compares it against `Button`'s own actually-rendered class attribute rather than a hand-copied literal, so the two cannot silently drift apart.
2. **`browse-list.tsx` is a presentational split out of `page.tsx`**, not named as a separate file in design.md's `/challenges` — discovery prose. `page.tsx` stays a thin, untested server root (it imports `@/lib/db`'s Cloudflare-bound context, exactly like `/challenges/new`'s and `/account`'s `page.tsx`); `browse-list.tsx` carries every behavior named in the spec/design and is fully covered under `renderToStaticMarkup`. Same pattern S4b already used for `create-form.tsx`/`create-form-body.tsx` and earlier slices used for `page.tsx`/`login-panel.tsx`.
3. **This apply pass resumed an interrupted prior attempt** that had left all five S5a files uncommitted, `tasks.md`'s 5a.1–5a.3 already ticked, and local D1 already seeded with four rows matching this apply's own verification scenario — evidence that phase S5a had already been implemented once before this session, without being committed or documented. Every claim in that inherited state was independently re-verified against the actual code and actual test runs rather than trusted, per the orchestrator's explicit audit instruction; the one gap found (the accentEdge test's missing isolation) was fixed under strict TDD's RED → GREEN cycle before this phase was marked complete.
4. **The launch prompt's claim that a dev server was already running on port 3100 was false** — `lsof -i :3100` and `ps aux` both showed nothing before this apply pass started one itself. Noted because the manual-verification instructions depended on that server actually existing.

## What S5a leaves for S5b

- `ChallengeCard`'s `href` is a plain string built by the caller (`` `/challenges/${challenge.id}` `` in `browse-list.tsx`) — S5b's own card/detail page linking pattern, if any, can reuse the same convention.
- `listPublicChallenges`'s `ChallengeSummary` (`{ id, title, startsAt, endsAt, state, ruleText }`) has no participant count by design (D15); `getChallengeView` (S3b, already shipped) is the read path that actually lists participants for the detail page — S5b's `page.tsx` should call that, not try to extend `ChallengeSummary`.
- The true-empty-state / seeded-mix manual-verification pattern used here (delete seed rows → curl → confirm empty copy → apply a scratchpad-only `.sql` file via `wrangler d1 execute DB --local --file` → curl → confirm exact expected rows) is reusable as-is for S5b's join/view manual checks.

## Completed: Phase S5b — "/challenges/[id]" view + join

- [x] 5b.1 Created `src/components/ui/player-row.tsx` (`{ name, meta?, right? }` plus an additive `divider?` prop, default `true`) and `src/components/ui/stat-tile.tsx` (`{ label, value, hint? }`, `value` rendered inside a semantic `<data value>` element) — design-system: UI Primitives and Their States, No Gamification or Social Surface. **Deviation, stated plainly**: `PlayerRow`'s exact signature in design.md/tasks.md is `{ name, meta?, right? }` only, with "none on the last" assumed to come from the CSS `:last-child` selector on a `divide-y`-style parent. That is invisible in `renderToStaticMarkup` output — every row would carry an identical class string regardless of position — so the phase brief's own instruction to "assert by markup distinctness … not a Tailwind class string" could not be satisfied without a structural signal. `divider` (default `true`) renders an actual `<hr>` only when true; the caller sets it `false` on the last row. Same precedent as `Card`'s `as` prop and `Button`'s `buttonClassName` export, both additive beyond the design's original table.
- [x] 5b.3 Created `src/app/challenges/[id]/copy-link.tsx` (`"use client"`) — challenge-view: Share URL Affordance. Built ahead of 5b.2 in task-number order (not out of the phase, just resequenced) because `ChallengeViewBody` (5b.2) renders it for the Share row; a plain `<button>` styled to match `Icon`, not `IconButton`, since `IconButtonProps` omits `onClick` by design (D8) and this control's only job is a client-side clipboard write. Static-render tests cover the readonly input's value and the button's accessible label; the clipboard write and the "Copied" confirmation are interaction behaviour, explicitly uncovered under `renderToStaticMarkup` (no event dispatch, no jsdom) — stated plainly, matching the phase brief's own instruction.
- [x] 5b.2 Created `src/app/challenges/[id]/challenge-view-body.tsx` (the testable presentational half — title, computed state `Badge`, the window as two `<time>` elements, every `ruleText` sentence, the `CopyLink` share row, a reserved "Join" section rendering `joinSlot`, every participant as `PlayerRow` with a per-rule `StatTile`, the "account last checked"/"not checked yet" freshness label derived from an injected `now`, and an empty-participants state) and `src/app/challenges/[id]/page.tsx` (thin, untested server root — same precedent as `/challenges`'s and `/challenges/new`'s `page.tsx`; `PageProps<'/challenges/[id]'>`, `generateMetadata` via one `findById`, `notFound()` in the render path) — challenge-view: Unauthenticated Read Access Including Unlisted, Challenge Summary and Computed State, Rules Rendered in Words, Every Participant's Progress from Stored Rows, Per-Participant Freshness Signal, Unknown Challenge Id Renders Not Found, No Gamification Rendering on the View Page, design-system: Mobile-First Responsive Contract (one `lg:` breakpoint, sticky summary column beside the participants list). At this point `page.tsx` did **not** wire a Join control (`joinSlot` left unset) — this is the exact S5b-i/S5b-ii cut tasks.md's contingent split names, so the read-only view could ship and be measured before the join half existed.
- [x] 5b.4 Created `src/app/challenges/[id]/actions.ts` (`"use server"`) — `joinChallengeAction(prev, formData)`: `auth()` absent → `redirect("/account?reason=sign-in-to-join")` (D18); zero linked accounts → `redirect("/account?reason=link-account-to-join")`; `riotAccountId` resolved from `formData` or the sole linked account; calls `joinChallenge({ challenges, riotAccounts, now: () => new Date() })(input)`; on `kind === "joined"`, `revalidatePath(\`/challenges/${challengeId}\`)` (literal path, no `type`) — challenge-participation: Sign-In and Linked Account Required to Join, Account Selection When Multiple Linked Accounts Exist, Window-Gated Join. Untested directly — transitively imports `@/auth`, which fails to resolve under plain Vitest (same constraint `create-form.tsx`'s split from `create-form-body.tsx` and `/login`'s `actions.ts` already document in this codebase).
- [x] 5b.5 Created `src/app/challenges/[id]/join-form-body.tsx` (the testable body — hidden `challengeId`, no picker for one linked account (hidden `riotAccountId`), a `Select` for several, a submit `Button` with `loading` from `pending`, and a `role="status"` region rendering `messageFor(state, accountName)`) and `src/app/challenges/[id]/join-form.tsx` (`"use client"`, thin — `useActionState(joinChallengeAction, null)`, untested for the same `@/auth` resolution reason as `actions.ts`) — challenge-participation: Account Selection When Multiple Linked Accounts Exist, Idempotent Duplicate-Free Join, Inline Result Reporting. `messageFor` maps exactly: `joined` → "You joined with {name}." · `already_joined` → "You have already joined this challenge." · `challenge_ended` → "This challenge has ended, so it can no longer be joined." · `challenge_not_found` → "This challenge no longer exists." · `riot_account_not_owned` → "That Riot account is not linked to your sign-in." **Signed-out join-area decision** (see the doc comment on `join-form.tsx` for the full rationale): `page.tsx` passes `accounts: RiotAccount[] | null` (`null` = no session) down through `ChallengeViewBody`'s `joinSlot`; `JoinForm` renders a plain "Sign in to join" link to `/login?from=/challenges/{id}` via the existing `withReturnPath` helper when `accounts === null`, and a "Link a Riot account" link to `/account` when `accounts.length === 0` — preferred over a form that only redirects on submit, per the phase brief's explicit instruction, because the challenge page is already readable signed out and a submit-then-redirect round trip is a worse experience than showing the correct next step up front. `joinChallengeAction`'s own redirects (D18) still exist as the defense-in-depth path for a direct POST.
- [x] 5b.6 Modified `src/app/account/page.tsx` to read `PageProps<'/account'>`'s `searchParams`, extract `reason` via a `firstValue` helper (matching `/login/page.tsx`'s own), and render `src/app/account/reason-banner.tsx`'s `<ReasonBanner reason={...} />` in both the signed-out and signed-in branches (the redirect can land a signed-out visitor here too) — challenge-participation: Sign-In and Linked Account Required to Join (D18). The mapping lives in the exported pure `messageForReason(reason)` (`sign-in-to-join` → "Sign in to join that challenge.", `link-account-to-join` → "Link a Riot account to join that challenge.", anything else → `null`); `ReasonBanner` renders a `Card` with that message in a `role="status"` region, or nothing. `page.tsx` itself gained only the `searchParams` read and two `<ReasonBanner>` call sites — no restyle, matching the "keep S6 restyle to S6" boundary.
- [x] 5b.7 Verified — see "Verification (S5b, task 5b.7)" below.

## TDD Cycle Evidence (S5b)

Strict TDD active. Every task with production behaviour followed RED (test importing the not-yet-existing module/export, confirmed failing) → GREEN (implementation, confirmed passing) → REFACTOR (no refactor needed — every file below came out clean on the first or second GREEN pass; the one near-miss, `StatTile`'s test, needed one assertion-pattern fix, not a production change).

| Task | Component/Function | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|---|
| 5b.1 | `PlayerRow` | `player-row.test.tsx` | Component (SSR markup) | ✅ 492/492 (pre-existing suite) | ✅ Written — `Cannot find package '@/components/ui/player-row'` | ✅ 5/5 passed | ✅ 5 cases (name, meta present/absent, right slot, divider present/absent) | ➖ None needed |
| 5b.1 | `StatTile` | `stat-tile.test.tsx` | Component (SSR markup) | ✅ 492/492 | ✅ Written — `Cannot find package '@/components/ui/stat-tile'` | ⚠️ 1/3 failed first pass (test asserted a `<data>`-with-no-attributes literal; fixed the *test's* regex to allow the `class` attribute `Button`-style components always carry, no production change) → 3/3 passed | ✅ 3 cases (label, `<data>` structural signal, hint present/absent) | ➖ None needed |
| 5b.3 | `CopyLink` | `copy-link.test.tsx` | Component (SSR markup) | ✅ 492/492 | ✅ Written — `Cannot find package '@/app/challenges/[id]/copy-link'` | ⚠️ 2/3 failed first pass (test asserted the literal string `"readonly"`; React's SSR output is `readOnly=""`, so the test's own assertion string was wrong, not the markup — fixed the test) → 3/3 passed | ✅ 3 cases (input value, button label, empty status region) | ➖ None needed |
| 5b.2 | `ChallengeViewBody` | `challenge-view-body.test.tsx` | Component (SSR markup) | ✅ 515/515 (post-5b.1/5b.3 baseline) | ✅ Written — `Cannot find package '@/app/challenges/[id]/challenge-view-body'` | ✅ 12/12 passed on first implementation | ✅ 12 cases (title, state-badge markup distinctness ×2, rule sentences, share URL, every participant listed, one `StatTile` per rule via `<data>`, "account last checked" present, "not checked yet" present, empty-participants state, no gamification words, `joinSlot` present/absent) | ➖ None needed |
| 5b.2 | `page.tsx` | none | N/A | N/A (new) | N/A | N/A | N/A | See rationale below |
| 5b.4 | `actions.ts` | none | N/A | N/A (new) | N/A | N/A | N/A | See rationale below |
| 5b.5 | `messageFor` (join) | `join-form-body.test.tsx` | Unit (pure) | N/A (new) | ✅ Written — `Cannot find package '@/app/challenges/[id]/join-form-body'` | ✅ 12/12 passed on first implementation | ✅ 6 cases for `messageFor` (5 kinds + `null`), 6 cases for `JoinFormBody` (hidden field, no-picker, `Select` for 2 accounts, `aria-busy` idle/pending, result message present, result region absent before submission) | ➖ None needed |
| 5b.5 | `join-form.tsx` | none | N/A | N/A (new) | N/A | N/A | N/A | See rationale below |
| 5b.6 | `messageForReason` / `ReasonBanner` | `reason-banner.test.tsx` | Unit (pure) + Component (SSR markup) | ✅ 527/527 (post-5b.5 baseline) | ✅ Written — `Cannot find package '@/app/account/reason-banner'` | ✅ 7/7 passed on first implementation | ✅ 4 cases for `messageForReason` (2 known reasons, unrecognised, `undefined`), 3 cases for `ReasonBanner` (recognised → text, unrecognised → empty string, `undefined` → empty string) | ➖ None needed |

**`page.tsx`, `actions.ts`, `join-form.tsx` — no dedicated test, same reasoning S0/S4b/S5a's own evidence tables already established for these exact file shapes.** `page.tsx` imports `@/lib/db`'s Cloudflare-bound context (like every other route root in this codebase) and `actions.ts`/`join-form.tsx` transitively import `@/auth`, which fails to resolve under plain Vitest — confirmed directly (`Cannot find package 'next/server'` when `@/auth` is imported outside Next's own bundler; no existing test in this codebase imports `@/auth` either). Every branch with actual behaviour in these three files lives in the tested `ChallengeViewBody`/`JoinFormBody`/`ReasonBanner` they compose. Verified instead by `pnpm typecheck && pnpm lint && pnpm build` and the manual/curl checks below.

### Test Summary (S5b)

- **Total tests written**: 42 (`PlayerRow` 5, `StatTile` 3, `CopyLink` 3, `ChallengeViewBody` 12, `messageFor`+`JoinFormBody` 12, `messageForReason`+`ReasonBanner` 7)
- **Total tests passing**: 42/42 new, 534/534 full suite (baseline 492 + 42)
- **Layers used**: Unit — pure function (10: `messageFor` 6, `messageForReason` 4), Component/SSR markup via `renderToStaticMarkup` (32)
- **Approval tests** (refactoring): None — no refactoring tasks in this slice
- **Pure functions created**: 4 (`freshnessLabel`/`formatRelative` inside `challenge-view-body.tsx`, `messageFor` in `join-form-body.tsx`, `messageForReason` in `reason-banner.tsx`)

## Work Unit Evidence (S5b)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run src/components/ui/player-row.test.tsx src/components/ui/stat-tile.test.tsx "src/app/challenges/[id]/copy-link.test.tsx" "src/app/challenges/[id]/challenge-view-body.test.tsx" "src/app/challenges/[id]/join-form-body.test.tsx" src/app/account/reason-banner.test.tsx` → 6 test files, 42 tests, all passing (run incrementally per task during RED/GREEN; full-suite confirmation: `pnpm test` → `Test Files 56 passed (56)`, `Tests 534 passed (534)`) |
| Runtime harness command/scenario and exact result | `pnpm build` → exit 0, `/challenges/[id]` appears in the route table alongside the pre-existing 9 routes. Manual: seeded `seed-s5b.sql` against local D1 (one `riot_accounts` row, one new two-rule public live challenge, a `participants` row, `progress` rows for both rules — one completed 3/3, one partial 4/10 — and a `poll_state` row with a recent `last_polled_at`), then `next dev --port 3100` (already running, reused per instruction) — see "Verification (S5b, task 5b.7)" for every curl result |
| Rollback boundary | Delete `src/components/ui/{player-row,stat-tile}.tsx` (+ tests), `src/app/challenges/[id]/*`, `src/app/account/reason-banner.tsx` (+ test); revert `src/app/account/page.tsx` and `src/app/challenges/[id]/page.tsx` to their pre-S5b state. Nothing else in the repo references any of these new files yet (S6/S7 have not landed), so this reverts cleanly with no orphaned imports. |

## Verification (S5b, task 5b.7)

| Command | Result |
|---|---|
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean |
| `pnpm lint` | exit 0 |
| `pnpm build` | exit 0 — `Route (app)` now lists `ƒ /challenges/[id]` alongside the pre-existing 9 routes (`/`, `/_not-found`, `/account`, `/api/auth/[...nextauth]`, `/challenges`, `/challenges/new`, `/login`, `/privacy`, `/terms`) |
| `pnpm test` | exit 0 — `Test Files 56 passed (56)`, `Tests 534 passed (534)` (baseline 492 + 42 new) |
| Seed applied | `seed-s5b.sql` (session scratchpad, not the repo — `/private/tmp/claude-501/-Users-jesusalfonsomontielperez-IdeaProjects-challenges/4e3dcefe-cbc0-4f0c-82db-7a2a87c65180/scratchpad/seed-s5b.sql`) via `pnpm exec wrangler d1 execute DB --local --file <path>` → `🚣 4 commands executed successfully` (after fixing two column-name bugs in the seed file itself, caught by the first two failed attempts — see "Issues found (S5b)"). S5a's four seeded challenges were confirmed still present first. |
| `/challenges/seed-challenge-join-live` (the new seeded live, two-rule challenge with a participant) | `200` — body contains the exact title "S5b Join Target — Two Rules", "Live" (state badge), both rule sentences ("Win 3 games", "Play 10 games"), the participant "Riven#NA1", both `<data value="3 / 3">`/`<data value="4 / 10">` progress tiles, the exact freshness text "account last checked 5 minutes ago", and the share URL `value="/challenges/seed-challenge-join-live"`. Signed out (no session cookie sent), the "Join" section serialises `accounts: null`, confirming `JoinForm` receives the sign-out signal correctly. |
| `/challenges/seed-challenge-unlisted-live` (S5a's unlisted seed, readable signed out) | `200` |
| `/challenges/seed-challenge-public-ended` | `200` — body contains "Ended" |
| `/challenges/does-not-exist` | `404` |
| `/account?reason=sign-in-to-join` | `200` — body contains the exact banner text "Sign in to join that challenge." |
| `/account?reason=link-account-to-join` | `200` — body contains the exact banner text "Link a Riot account to join that challenge." |
| `/account?reason=bogus` | `200` — zero matches for "that challenge" anywhere in the body (no banner rendered) |
| `/challenges` (regression sanity) | `200` — still lists both S5a public-live titles and now also "S5b Join Target — Two Rules"; unlisted/ended titles absent, matching S5a's own Ordering/Listing-Scope checks |
| **Signed-in join / already-joined / ended-refusal checks** | **Deferred to the owner or S7's Playwright coverage** — no `AUTH_SECRET`/Discord OAuth configured locally, the same owner-blocked precondition S4b's own manual-check section already disclosed. No session was faked to exercise these; `joinChallengeAction`'s logic itself is unit-covered indirectly through `join-challenge.test.ts` (S3a) and `messageFor`'s exhaustive mapping (this slice) — only the live end-to-end click-path is deferred. |

**Seed-file bugs found and fixed, stated plainly.** The first `wrangler d1 execute` attempt failed with `table participants has no column named joined_at` — `participants.joinedAt` is declared through the shared `createdAt()` helper in `schema.ts`, which hardcodes the column name `"created_at"` regardless of the TS field name, so the actual column is `created_at`. The second attempt then failed identically on `progress.updatedAt` (same helper, same hardcoded column). Both were confirmed to have applied **nothing** before failing (`wrangler d1 execute --file` did not partially commit — re-querying both tables after each failure returned empty), so no cleanup was needed before the corrected third attempt, which applied cleanly. The seed file at the scratchpad path now has an inline comment on both `INSERT`s explaining the actual column name, so a future re-run of this exact file will not repeat the mistake.

## Review budget measurement (S5b)

Measured with `git diff --shortstat <base> <tip> -- . ':!openspec/**'` per slice, on the actual per-commit boundaries — same method S0–S5a already used.

Tasks 5b.1–5b.3 (the read-only view) alone already measured **674 lines** against `feat/challenge-ui-s5a-ii-browse-page` after landing them — over budget as a single "S5b-i" PR, and already over the tasks-agent's own 300–450 median forecast for the *entire* S5b slice. One honest slicing pass over the actual per-file sizes found a **three-way** cohesive split for the read-only half, each slice under 400 with nothing shrunk:

| Sub-slice | Tasks | Files | Base | Raw changed lines | Builds/tests alone because |
|---|---|---|---|---|---|
| **s5b-i-a** — view primitives | 5b.1, 5b.3 | `ui/{player-row,stat-tile}.{tsx,test.tsx}`, `challenges/[id]/copy-link.{tsx,test.tsx}` | `feat/challenge-ui-s5a-ii-browse-page` | **247** | None of the three files is imported by any route yet; `pnpm exec tsc --noEmit` + `pnpm exec vitest run` both clean in isolation |
| **s5b-i-b** — `ChallengeViewBody` | 5b.2 (component half) | `challenges/[id]/challenge-view-body.{tsx,test.tsx}` | s5b-i-a | **365** | Imports only s5b-i-a's primitives and S3b's `getChallengeView` types; unreferenced by any route until s5b-i-c; clean in isolation |
| **s5b-i-c** — the view route | 5b.2 (page.tsx) | `challenges/[id]/page.tsx` | s5b-i-b | **63** | Wires `ChallengeViewBody` into the actual `/challenges/[id]` route with no Join control; carries a full `pnpm typecheck && pnpm lint && pnpm build && pnpm test` run |

Tasks 5b.4–5b.6 (the join half) measured **548 lines** against s5b-i-c — also over budget as a single "S5b-ii" PR. A second honest slicing pass, following the module dependency order (`join-form-body.tsx` type-imports from `actions.ts`, so `actions.ts` must exist first for typecheck), found a **four-way** cohesive split:

| Sub-slice | Tasks | Files | Base | Raw changed lines | Builds/tests alone because |
|---|---|---|---|---|---|
| **s5b-ii-a** — join action | 5b.4 | `challenges/[id]/actions.ts` | s5b-i-c | **62** | Unreferenced by any component yet (only a later type-only import needs it to exist); `@/auth`'s Vitest-resolution failure is pre-existing and untouched |
| **s5b-ii-b** — join form body | 5b.5 (testable half) | `challenges/[id]/join-form-body.{tsx,test.tsx}` | s5b-ii-a | **262** | Imports only `actions.ts`'s *type*, S1's `Button`/`Select`; unreferenced by any route yet |
| **s5b-ii-c** — join wiring | 5b.5 (client wrapper + route wiring) | `challenges/[id]/join-form.tsx`, `~ challenges/[id]/page.tsx` | s5b-ii-b | **116** | Wires the join control into the actual route (`joinSlot`); the S5a auth/accounts fetch this adds to `page.tsx` is additive, not a rewrite |
| **s5b-ii-d** — reason banner | 5b.6 | `account/{page.tsx,reason-banner.tsx,reason-banner.test.tsx}` | s5b-ii-c | **108** | Independent file scope (`src/app/account/`); carries the full `pnpm typecheck && pnpm lint && pnpm build && pnpm test` run and every manual/curl check reported above |

Neither half needed a `size:exception` — every one of the seven slices lands under 400 raw changed lines with no code shrunk, no test or comment removed to fit, matching the chained-pr skill's decision gate ("PR >400, each slice can land independently → use the split that fits"). **Cross-check note**: summing all seven slices' raw changed lines (247+365+63+62+262+116+108 = 1223, close to but not identical to the direct endpoint-to-endpoint `git diff --shortstat feat/challenge-ui-s5a-ii-browse-page HEAD` total of **1198**) — the ~25-line gap is `page.tsx` and `account/page.tsx` each being *created or first-touched* in one slice and then *edited again* in a later slice; a direct base-to-tip diff only ever sees each file's final state (pure insertions, since the file did not exist or was minimally different at the base), while two adjacent per-slice diffs both count the intermediate edit's insertions and deletions separately. Both numbers are reported here rather than silently picking one: 1198 is "if squashed into one commit," 1223 is "sum of what each chained PR's reviewer actually sees."

**Contingent-split forecast, stated plainly.** tasks.md's own contingent-split note offered exactly two branches per half (`feat/challenge-ui-s5b-i-view-route` for 5b.1–5b.3, `feat/challenge-ui-s5b-ii-join-action` for 5b.4–5b.6) and assumed measuring once, after 5b.6. Measuring after 5b.3 alone already showed the two-way split for the read half would not fit (674 lines); the same was true for the join half, measured after 5b.6 (548 lines). The pre-authorised whole-S5b `size:exception` fallback named in tasks.md ("view and join share one page composition that cannot be cut without a throwaway intermediate layout") was **not invoked** — the actual implementation proved the opposite: `page.tsx` accepted the Join wiring as a clean additive edit (new imports, one new `Promise.all` branch, one new prop on `ChallengeViewBody`) with no throwaway intermediate layout, exactly as `joinSlot`'s own doc comment predicted when it was designed in task 5b.2. Branch names follow the existing `s{phase}{sub-letter}-{description}` convention from S1/S3a/S3b/S4a/S4b/S5a rather than the two originally-named branches, since those two names described a split that measurement disproved twice.

Commit SHAs (all on `feat/challenge-ui-s5b-ii-d-reason-banner`, the final branch — was `feat/challenge-ui-s5b-view-join-route`, the branch this apply pass was launched on): s5b-i-a ends at `df6e917`, s5b-i-b ends at `df8f973`, s5b-i-c ends at `5671a2c`, s5b-ii-a ends at `edb6aa6`, s5b-ii-b ends at `e2c059a`, s5b-ii-c ends at `6ab58ab`, s5b-ii-d (HEAD) ends at `8d926ca`. Every intermediate branch (`feat/challenge-ui-s5b-i-a-view-primitives` through `feat/challenge-ui-s5b-ii-c-join-wiring`) was checked out and independently verified with `pnpm exec tsc --noEmit` (after regenerating route types with `next typegen`, since a stale `.next/types` cache from a later checkout otherwise reports a phantom missing-module error) and `pnpm exec vitest run` before this report — all clean.

## Deviations from design (S5b)

1. **`PlayerRow` gained an additive `divider?: boolean` prop**, not named in design.md's `{ name, meta?, right? }` signature — needed to make "no divider on the last row" a structural, testable fact rather than relying on an invisible-to-`renderToStaticMarkup` CSS pseudo-selector. See task 5b.1's note above for the full reasoning; same precedent as `Card`'s `as` and `Button`'s `buttonClassName`.
2. **`StatTile`'s `value` renders inside a semantic `<data value>` element**, not a plain `<span>` — the phase brief's own instruction named this exact mechanism as the structural alternative to asserting the `tabular-nums` class literally.
3. **The S5b-i/S5b-ii contingent split, measured twice, produced seven chained branches instead of the two originally forecast** — see "Review budget measurement (S5b)" above for the full breakdown; no code was restructured to fit the budget, only sliced at existing task/file boundaries.
4. **The pre-authorised whole-S5b `size:exception` fallback was not used.** Design.md's own reasoning for offering it ("view and join share one page composition") did not hold once implemented — see the "Contingent-split forecast" paragraph above.
5. **`page.tsx` fetches `accounts` via `Promise.all` alongside `getChallengeView`**, not sequentially — a small performance-only deviation from design.md's literal code sketch (which called `getChallengeView` first, then checked `result.kind`, then fetched accounts), made because the two calls are independent and `notFound()` only needs to short-circuit rendering, not the accounts fetch. Behaviourally identical.

## What S5b leaves for S6/S7

- `/account/page.tsx` now reads `PageProps<'/account'>`'s `searchParams` and renders `<ReasonBanner>` — S6's restyle of this file (task 6.2) must preserve both, not just the pre-S5b markup structure the phase brief's rollback note describes.
- `src/app/challenges/[id]/page.tsx`'s `auth()` + `accounts` fetch is additive to what S3b/S5a left behind — S6 has no dependency on this file's internals, but S7's Playwright spec (task 7.5) will exercise this exact page for the create-then-join flow and should expect the "Sign in to join" link (signed-out) / picker-or-hidden-field (signed-in) branches this slice built.
- Seeded ids for the orchestrator's screenshots (left in local D1, not cleaned up): the new **live challenge with a joined participant is `seed-challenge-join-live`** (title "S5b Join Target — Two Rules", two rules, one completed 3/3 and one partial 4/10, participant "Riven#NA1"). S5a's four challenges (`seed-challenge-public-live-3d`, `seed-challenge-public-live-1d`, `seed-challenge-unlisted-live`, `seed-challenge-public-ended`) are still present and untouched.
- `join-form-body.tsx`'s split pattern (thin `join-form.tsx` client wrapper + testable body, forced by the same `@/auth`/Vitest resolution failure `create-form.tsx`/`create-form-body.tsx` and `actions.ts` already hit) is now the fourth precedent for this exact shape in this codebase (after `/login`, `/challenges/new`, and this file) — any future action-bound form in this codebase should expect the same split, not attempt a single file.

## Remaining tasks (not in this apply)

- [x] Phase S3a (write use cases) — 7/7 tasks complete (see above)
- [x] Phase S3b (read use cases) — 7/7 tasks complete (see above)
- [x] Phase S4a (rule builder + presets) — 4/4 tasks complete (see above)
- [x] Phase S4b (`/challenges/new` route) — 4/4 tasks complete (see above)
- [x] Phase S5a (`/challenges` browse) — 3/3 tasks complete (see above)
- [x] Phase S5b (`/challenges/[id]` view + join) — 7/7 tasks complete (see above)
- [x] Phase S6 (restyle + shim removal) — 7/7 tasks complete (see below)
- [ ] Phase S7 (e2e) — 6 tasks, depends on S4b (now unblocked), S5b (now unblocked)

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
- Boundary: starts from S3a's shipped write use cases; ends with `ruleToSentence`/`rulesToSentences`/`ROLE_LABELS`/`QUEUE_LABELS`, `deriveChallengeState`, `getChallengeView`, and `listPublicChallenges` landed with 32 new unit tests (incl. the vanished-account backfill) — buildable and fully verified, no known issues (see "Issues found (S3b)"), no route or composition root calls any of the four new/changed symbols yet
- Review budget: S3b delivered as s3b-i (195) + s3b-ii (**553, owner-accepted `size:exception`**) + s3b-iii (160) — see "Review budget measurement (S3b)" for why the pre-authorized three-way example held for two of three slices but the middle one is irreducibly over budget, why the two considered further splits were rejected, and the coverage-backfill correction that added 35 lines to s3b-ii after the owner accepted the original exception

### S4a

- Mode: chained PR slice (`feature-branch-chain`) — two PRs, each targeting the previous slice's branch (s4a-i → `feat/challenge-ui-s3b-iii-public-list`; s4a-ii → s4a-i)
- Current work unit: Phase S4a — Rule builder + presets (all 4 tasks)
- Boundary: starts from S3b's shipped read use cases; ends with `RULE_PRESETS` and the `RuleBuilder` client component landed with 20 new tests — buildable and fully verified, no known issues, unreferenced by any route (S4b's `create-form.tsx` is the first caller of both)
- Review budget: S4a delivered as s4a-i (177) + s4a-ii (**454, owner-accepted `size:exception`**) — see "Review budget measurement (S4a)" for why the tasks-agent's own pre-authorized two-way split does not fit even though each half maps to exactly one task pair, and the two considered further splits that were rejected. The owner accepted the exception through the orchestrator on 2026-09-19, before the PR was opened.

### S4b

- Mode: chained PR slice (`feature-branch-chain`) — three PRs, each targeting the previous slice's branch (s4b-i → `feat/challenge-ui-s4a-ii-rule-builder`; s4b-ii → s4b-i; s4b-iii → s4b-ii)
- Current work unit: Phase S4b — `/challenges/new` route + action (all 4 tasks)
- Boundary: starts from S4a's shipped rule builder + presets; ends with `createChallengeAction`, the `/challenges/new` route (signed-out sign-in panel / signed-in wizard), and the full create-form wizard (preset → rules → details → review, self-join, `messageFor`) landed with 22 new tests — buildable and fully verified except the deferred signed-in manual check (no local `AUTH_SECRET`/Discord OAuth, pre-existing owner-blocked item, not a regression); the redirect target `/challenges/[id]` 404s until S5b lands, expected within the chain
- Review budget: S4b delivered as s4b-i (131) + s4b-ii (**633, owner-accepted `size:exception`**) + s4b-iii (81) — see "Review budget measurement (S4b)" for why the phase brief's own pre-authorized two-way split does not fit, the two considered further splits that were rejected, and the forced (not budget-driven) `create-form.tsx`/`create-form-body.tsx` file split this slice introduced

### S5a

- Mode: chained PR slice (`feature-branch-chain`) — two PRs, each targeting the previous slice's branch (s5a-i → `feat/login-page-ii-route-rewire`; s5a-ii → s5a-i)
- Current work unit: Phase S5a — `/challenges` browse (all 3 tasks), resumed from an interrupted uncommitted prior attempt and audited against the checklist above
- Boundary: starts from S1's shipped primitives and S3b's shipped `listPublicChallenges`; ends with `ChallengeCard`, the additive `buttonClassName` export, and the `/challenges` browse route (list + empty state) landed with 26 tests (1 new, added by this apply pass to close the accentEdge isolation gap) — buildable and fully verified, incl. a true-empty-state and a seeded-mix manual check against local D1; card links to `/challenges/{id}` 404 until S5b lands, expected within the chain
- Review budget: S5a delivered as s5a-i (**350**) + s5a-ii (**176**), both under 400; no `size:exception` — see "Review budget measurement (S5a)" for the per-file breakdown and why a two-way split was sufficient

### S5b

- Mode: chained PR slice (`feature-branch-chain`) — seven PRs, each targeting the previous slice's branch (s5b-i-a → `feat/challenge-ui-s5a-ii-browse-page`; s5b-i-b → s5b-i-a; s5b-i-c → s5b-i-b; s5b-ii-a → s5b-i-c; s5b-ii-b → s5b-ii-a; s5b-ii-c → s5b-ii-b; s5b-ii-d → s5b-ii-c)
- Current work unit: Phase S5b — `/challenges/[id]` view + join (all 7 tasks, + the contingent split measured twice)
- Boundary: starts from S1's shipped primitives, S3b's shipped `getChallengeView`/`join-challenge` use cases, and S5a's shipped browse route; ends with `PlayerRow`/`StatTile`, the `/challenges/[id]` view (title, state, rules, share, participants with progress and freshness), the join action/form (with a signed-out "Sign in to join" link and a zero-accounts "Link a Riot account" link), and the `/account?reason=` banner landed with 42 new tests — buildable and fully verified against local D1 except the signed-in join/already-joined/ended-refusal click-paths, explicitly deferred (no local `AUTH_SECRET`/Discord OAuth, pre-existing owner-blocked item matching S4b's own precedent, not a regression)
- Review budget: S5b delivered as s5b-i-a (247) + s5b-i-b (365) + s5b-i-c (63) + s5b-ii-a (62) + s5b-ii-b (262) + s5b-ii-c (116) + s5b-ii-d (108), all under 400; no `size:exception` — see "Review budget measurement (S5b)" for why the pre-authorised two-branch split did not hold on either half, the seven-way split's per-file rationale, and the pre-authorised whole-S5b exception that was considered and explicitly not used

### S6

- Mode: chained PR slice (`feature-branch-chain`) — one PR, branch `feat/challenge-ui-s6-restyle`, targeting `feat/challenge-ui-s5b-ii-d-reason-banner` (the S5b chain tip)
- Current work unit: Phase S6 — Restyle landing/account and delete the S0 `dark:` shim (all 7 tasks)
- Boundary: starts from S5b's shipped view/join route and S1's shipped primitives; ends with every `dark:` pair in `src/` gone, the six carrying files restyled onto the mapped `@theme inline` tokens, the landing page's "Not open yet" panel replaced by two real CTAs, `AuthStatus`'s duplicate "Your account" link removed, and the S0 shim plus the two R7 compatibility aliases deleted from `globals.css` — buildable and fully verified, no known issues
- Review budget: 211 authored lines across six commits, under 400; no `size:exception` — see "Review budget measurement (S6)"

## Completed: Phase S6 — Restyle + shim removal

- [x] 6.1 Restyled `src/app/page.tsx`: headline now uses `login-panel.tsx`'s display type scale (`font-display text-display-3 font-bold tracking-display text-text-primary`), the two intro paragraphs moved onto `text-text-secondary`, and the "Not open yet" panel (which said "Nothing can be created or joined yet" — no longer true) is replaced by `HeroCtas`, a new component rendering a primary link to `/challenges/new` ("Create a challenge") and an outline link to `/challenges` ("Browse challenges") via `buttonClassName`. All 4 `dark:` pairs removed.
- [x] 6.2 Restyled `src/app/account/page.tsx` (6 `dark:` pairs → `text-text-secondary`, `text-text-muted`, `border-border-hairline` ×2, `text-text-faint`, `text-amber-500`) and ported `src/app/account/link-form.tsx`'s raw `<input>`/`<select>`/`<button>` onto the S1 `Input`/`Select`/`Button` primitives (5 `dark:` pairs removed by construction) — same `name`s (`riotId`, `platform`), `id`s, labels, `required`, `defaultValue`, and `useActionState` wiring as before; the message colours moved to `text-green-500`/`text-red-500`, the Badge's own win/loss tones. The `?reason=` banner (`ReasonBanner`, S5b) is untouched.
- [x] 6.3 Restyled `src/components/auth-status.tsx` (3 `dark:` pairs, one of them on the removed link): the two remaining borders moved to `border-border-hairline`; the signed-in branch no longer renders its own "Your account" `<Link>` — `SiteHeader` (S0) already owns that destination in its three-item nav.
- [x] 6.4 Restyled `src/components/site-footer.tsx` (2 `dark:` pairs): container matches `SiteHeader`'s `max-w-container-max` with `px-5 lg:px-10` gutters (was `max-w-3xl px-6`), the rule moved to `border-divider` (design.md §5 names this token explicitly, not `border-border-hairline`), the disclaimer to `text-text-muted`. `mt-auto` kept (body is `flex flex-col`, footer must still push to the bottom on short pages). The Riot disclaimer text and the two legal links (`/terms`, `/privacy`) are unchanged.
- [x] 6.5 Restyled `src/components/legal-page.tsx` (1 `dark:` pair → `text-text-muted`). `/terms` and `/privacy` content is unchanged.
- [x] 6.6 Modified `src/app/globals.css`: deleted the `@custom-variant dark (&:where(:root, :root *));` line and its doc comment, and the two R7 compatibility aliases (`--color-background`, `--color-foreground`) from `@theme inline`. `color-scheme: dark` kept as the only remaining theming statement in `@layer base`.
- [x] 6.7 Verified — see "Verification (S6, task 6.7)" below.

## TDD Cycle Evidence (S6)

Strict TDD active. This slice is behaviour-preserving for five of its six production files (6.2–6.6): markup structure, copy, links, forms and server actions stay the same, only class lists (and, in `link-form.tsx`'s case, the underlying element — raw `<input>`/`<select>`/`<button>` to `Input`/`Select`/`Button`, with identical `name`/`id`/`required`/`defaultValue`/wiring) change. None of the six carrying files had a pre-existing test (`rg -l "auth-status|site-footer|legal-page|link-form|reason-banner" src --glob "*.test.*"` → only `reason-banner.test.tsx`, which covers `messageForReason`, unrelated to this slice's changes), so there is no pre-existing safety net to run for those five files — per the phase brief's explicit fallback ("if a task is class-only with no behaviour change, say 'no unit; verified by build + rg + render smoke' per the S0 precedent"), stated honestly rather than inventing RED evidence.

Task 6.1 is the one genuine behaviour change with a testable piece: the landing's CTAs. `page.tsx` itself stays untested — it renders `<AuthStatus />`, an async Server Component (`await auth()`) that `renderToStaticMarkup` cannot resolve, the same reason `SiteHeader` and `challenges/page.tsx` stay untested (see apply-progress.md's S1/S5a evidence tables). The new CTA markup was extracted into `HeroCtas` (`src/app/hero-ctas.tsx`), which imports neither `@/auth` nor `@/lib/db`, so it renders cleanly under `renderToStaticMarkup` — this followed the full RED → GREEN → TRIANGULATE cycle. Task 6.3's link removal (`auth-status.tsx`) is a real behaviour change but the component itself is untestable for the same `@/auth` reason the phase brief names explicitly; it is instead verified by `rg` (source-level: the string "Your account" is gone from the file) and a `curl` smoke check confirming the header's own `/account` destination still resolves.

| Task | File | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|---|
| 6.1 | `hero-ctas.tsx` (new, extracted from `page.tsx`) | `hero-ctas.test.tsx` | Component (SSR markup) | N/A (new file) | ✅ Written — `pnpm exec vitest run src/app/hero-ctas.test.tsx` failed with `Cannot find package '@/app/hero-ctas'` | ✅ 3/3 passed | ✅ 3 cases (create-link href+text, browse-link href+text, absence of retired "Not open yet"/"Nothing can be created or joined yet" copy) | ➖ None needed — component has no branching |
| 6.1 | `page.tsx` (headline + composition) | N/A | N/A | N/A (no pre-existing test) | — | — | Triangulation skipped: composition-only change (headline classes, `<HeroCtas/>` swapped in for the removed panel), no branching logic; verified by `pnpm build` + `pnpm typecheck` + the curl smoke check below | N/A |
| 6.2 | `account/page.tsx` | N/A | N/A | N/A (no pre-existing test) | — | — | "no unit; verified by build + rg + render smoke" per the S0 precedent — class-only, `?reason=` banner behaviour untouched | N/A |
| 6.2 | `account/link-form.tsx` | N/A | N/A | N/A (no pre-existing test — also untestable via render, see below) | — | — | "no unit; verified by build + rg + render smoke" — the primitive port preserves every `name`/`id`/`required`/`defaultValue`/`disabled`/message-text behaviour; `link-form.tsx` imports `linkRiotAccountAction` from `actions.ts`, which imports `@/auth` and `@/lib/db`, the exact "hard Vitest/`next-auth` module-resolution failure" tasks.md's own 4b.3 deviation note already documents for `create-form.tsx` | N/A |
| 6.3 | `auth-status.tsx` | N/A | N/A | N/A (no pre-existing test) | — | — | Untestable root (imports `@/auth` directly, per the phase brief's explicit instruction); covered instead by `rg -n "Your account" src/components/auth-status.tsx` (0 matches) and the curl smoke check confirming `SiteHeader`'s own `aria-label="Account"` destination still resolves | N/A |
| 6.4 | `site-footer.tsx` | N/A | N/A | N/A (no pre-existing test) | — | — | "no unit; verified by build + rg + render smoke" — class-only, no auth import (testable in principle, but no new behaviour to assert beyond what the curl smoke check already covers) | N/A |
| 6.5 | `legal-page.tsx` | N/A | N/A | N/A (no pre-existing test) | — | — | "no unit; verified by build + rg + render smoke" — single class swap | N/A |
| 6.6 | `globals.css` | N/A | N/A | N/A | — | — | Triangulation skipped: CSS deletion only, no branching; verified by `pnpm build` (Tailwind compiles without error) and the `rg` proof below | N/A |

### Test Summary (S6)

- **Total tests written**: 3 (`hero-ctas.test.tsx`)
- **Total tests passing**: 3/3 new, 537/537 full suite (baseline 534 + 3)
- **Layers used**: Component/SSR markup via `renderToStaticMarkup` (3)
- **Approval tests** (refactoring): None — none of the five class-only/ported files had a pre-existing test to capture as an approval baseline; each is instead verified by the build/rg/smoke triad, stated honestly rather than invented
- **Pure functions created**: 0

## Work Unit Evidence (S6)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run src/app/hero-ctas.test.tsx` → `Test Files 1 passed (1)`, `Tests 3 passed (3)`; full-suite confirmation: `pnpm test` → `Test Files 57 passed (57)`, `Tests 537 passed (537)` |
| Runtime harness command/scenario and exact result | `pnpm exec next dev --port 3100` (already running, reused — `lsof -nP -iTCP:3100 -sTCP:LISTEN` confirmed one instance, no second one started); `curl` against `/`, `/account`, `/account?reason=sign-in-to-join`, `/terms`, `/privacy`, `/challenges`, `/challenges/seed-challenge-join-live`, `/login` → all `200`; `/`'s body contains both `href="/challenges/new"` and `href="/challenges"` and no longer contains "Not open yet"; `/account`'s signed-out copy and the `?reason=` banner text both render; the header's three `aria-label`s (`Challenges`, `Create`, `Account`) and the footer's `/terms`/`/privacy` links are present on `/` |
| Rollback boundary | Revert the six commits on `feat/challenge-ui-s6-restyle` (or delete `src/app/hero-ctas.{tsx,test.tsx}` and restore `src/app/page.tsx`, `src/app/account/{page,link-form}.tsx`, `src/components/{auth-status,site-footer,legal-page}.tsx`, `src/app/globals.css` to their pre-S6 state). Nothing outside these seven files was touched; the six restyled files carry no new imports from S7-scope code, so this reverts cleanly with no orphaned imports. |

## Verification (S6, task 6.7)

| Command | Result |
|---|---|
| `pnpm test` | exit 0 — `Test Files 57 passed (57)`, `Tests 537 passed (537)` (baseline 534 + 3 new) |
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean |
| `pnpm lint` | exit 0 |
| `pnpm build` | exit 0 — compiled successfully, same 10 routes as S5b (`/`, `/_not-found`, `/account`, `/api/auth/[...nextauth]`, `/challenges`, `/challenges/[id]`, `/challenges/new`, `/login`, `/privacy`, `/terms`), all still `ƒ` dynamic |
| `rg -n "bg-background\|text-foreground\|--color-background\|--color-foreground\|dark:" src/` (run **before** 6.6, proving nothing reads the aliases/shim) | 3 matches, **all three inside `src/app/globals.css` itself** (the two alias declarations and the shim's own doc comment) — zero matches in any other file, confirming nothing consumes them before they are deleted. One round-trip fix was needed: a doc comment added in 6.2 (`link-form.tsx`) named the `dark:` directive literally in prose and the same pattern matched it; reworded to "light-OS-variant utility pair" without the literal string, matching the S1 precedent for the same class of false positive. |
| `rg "dark:" src/` (run **after** 6.6) | 0 matches (exit 1, no output) |
| Manual smoke check (`curl`, port 3100) | `/` → 200, contains `href="/challenges/new"`, `href="/challenges"`, "Create a challenge", "Browse challenges"; no "Not open yet" text. `/account` → 200, signed-out copy present. `/account?reason=sign-in-to-join` → 200, banner text present. `/terms`, `/privacy` → 200, "Last updated" present. `/challenges`, `/challenges/seed-challenge-join-live`, `/login` → 200. Pixel-level 390px/desktop rendering remains the orchestrator's (browser) manual check per the phase brief — not run here. |

## Review budget measurement (S6)

Measured with `git diff --stat feat/challenge-ui-s5b-ii-d-reason-banner -- ':!openspec/**'` plus the two new untracked files (`src/app/hero-ctas.tsx` 27 lines, `src/app/hero-ctas.test.tsx` 37 lines, both counted as pure additions since they are new files): **211 authored lines total** — well under the 400-line budget and within the tasks-agent's own 200–300 forecast. Delivered as **one** PR, six work-unit commits, no split and no `size:exception` needed.

| Commit | Files | Insertions | Deletions |
|---|---|---|---|
| `feat(landing): restyle onto the design tokens and add real CTAs` | `page.tsx`, `hero-ctas.tsx` (new), `hero-ctas.test.tsx` (new) | 76 | 13 |
| `feat(account): restyle onto the design tokens and port link-form to primitives` | `account/page.tsx`, `account/link-form.tsx` | 34 | 50 |
| `feat(auth-status): restyle onto tokens and drop the duplicate account link` | `auth-status.tsx` | 6 | 5 |
| `feat(site-footer): restyle onto the header's container and divider token` | `site-footer.tsx` | 8 | 5 |
| `feat(legal-page): restyle the last dark: pair onto text-text-muted` | `legal-page.tsx` | 1 | 3 |
| `chore(globals): drop the S0 dark shim and the R7 compatibility aliases` | `globals.css` | 0 | 10 |
| **Total** | 7 files | **125** | **86** |

Branch: `feat/challenge-ui-s6-restyle` (targets `feat/challenge-ui-s5b-ii-d-reason-banner`, the S5b chain tip, per `feature-branch-chain`).

## Deviations from design (S6)

1. **`link-form.tsx` was ported onto the S1 `Input`/`Select`/`Button` primitives**, not just given token classes on the raw elements. The phase brief offered this as a choice ("Consider porting... ONLY if it preserves `name`s, ids, labels and the `useActionState` wiring exactly; if it grows the diff past budget, keep raw elements"). The port preserves every `name`, `id`, `required`, `defaultValue`, and the `disabled={isPending}`/message-text behaviour exactly, and it *reduced* line count (34 insertions / 50 deletions net negative) rather than growing the diff, so the primitive port was kept.
2. **The landing page's headline uses `text-display-3`**, not `text-display-1`/`text-display-2` (the sizes `login-panel.tsx` itself uses for its full-bleed marketing headline). The landing `h1` shares a row with `<AuthStatus />` in a `flex items-center justify-between` header, not a standalone centred hero — `display-3` (`clamp(32px,3.6vw,44px)`) is the smallest step in the same `font-display`/`tracking-display` family the task named, sized to fit that row without overflowing at 390px. This reuses the exact utility classes (`font-display`, `tracking-display`) the task specified; only the scale step within that family differs from `login-panel.tsx`'s own (larger) usage.
3. **`account/page.tsx`'s and `legal-page.tsx`'s non-`dark:` heading classes (`text-2xl font-semibold tracking-tight`, `text-3xl font-semibold tracking-tight`) were left unchanged.** Design.md §5 permits broader class changes ("only classes ... change"), but the phase brief's hard constraint for 6.2 says "same structure, tokens only" — read narrowly: convert the classes that carry a `dark:` pair (or an untoken arbitrary colour) to their token equivalent, and leave classes that were never dark/light-variant-dependent alone. This keeps the diff minimal and matches the explicit per-file `dark:` pair counts the task named.
4. **`site-footer.tsx`'s `text-sm`/`text-xs` sizing classes were converted to `text-body-sm`/`text-caption`** even though neither carried a `dark:` pair — done because the container/border classes on the same lines were already being touched for the `max-w-container-max`/`border-divider` change, and design.md §5 explicitly names this file's restyle scope as going beyond just the `dark:` pairs ("Footer restyled in S6 onto the same container, `border-divider`, `text-text-muted`").

## Issues found (S6)

None.
