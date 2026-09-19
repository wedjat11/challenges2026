# Tasks: Challenge UI (T12) on the Become a Legend design system

Change: `challenge-ui` · Store: hybrid (this file + Engram topic `sdd/challenge-ui/tasks`, project `challenges2026`) · Source of truth: `design.md` (D1–D18, Slice Map S0–S7, File Changes table), `specs/{design-system,challenge-authoring,challenge-discovery,challenge-participation,challenge-view}/spec.md` (34 requirements), `proposal.md` (A1–A14).

Every checklist item below is `- [ ] <slice>.<n> <action>` and names the exact file(s) it creates or modifies, the requirement(s) it satisfies (`capability: Requirement Name`), and, for domain/application/adapter work, whether it is the RED or GREEN half of a strict-TDD pair. A path the task only reads is marked `(read-only)`.

---

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 2400–3800 (11 slices unconditionally; up to 13 if both contingent splits fire) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | S0 → S1 (→ S1a/S1b if measured >400) → S2 (parallel to S0/S1) → S3a → S3b → S4a → S4b → S5a → S5b (→ S5b-i/S5b-ii if measured >400) → S6 → S7 |
| Delivery strategy | auto-chain |
| Chain strategy | pending — the orchestrator asks the owner once, after this forecast |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High
```

`Decision needed before apply: Yes` names the chain-strategy pick specifically — **stacked-to-main** (each slice merges to main in order) vs **feature-branch-chain** (each slice targets the previous slice's branch; only `feat/challenge-ui`, the existing tracker branch this repo is already stacked on, merges to main). Every phase below states files, dependencies, and branch names that hold under either strategy; only the PR base target changes.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| S0 | Vendored tokens, `@theme` mapping, self-hosted fonts, header shell | PR 1 | `pnpm typecheck && pnpm lint && pnpm build` | Manual: "/", "/account", "/terms", "/privacy" at 390px + desktop, light-OS profile; no `fonts.googleapis.com` in devtools | Revert restores `src/app/globals.css` and the Geist fonts in `src/app/layout.tsx` |
| S1 | Core + form UI primitives | PR 2 | `pnpm typecheck && pnpm lint && pnpm build` | N/A — components are unreferenced until S4a/S5a/S5b import them; verified by absence of a new client bundle | Delete `src/components/ui/*` and `src/components/icons/*`; nothing else references them yet |
| S2 | `listPublic`, `listProgressForChallenge`, `findById` | PR 3 (parallel to S0/S1) | `pnpm test` (RED→GREEN on `createTestDb()`) | N/A — additive port/adapter methods, no route calls them yet | Revert the two port files and two adapter files; every existing caller is untouched |
| S3a | `createChallenge`, `joinChallenge`, `safeParseRules` | PR 4 | `pnpm test` (RED→GREEN) | N/A — unreferenced until S4b/S5b | Revert the three new/modified files; no route imports them yet |
| S3b | `getChallengeView`, `listPublicChallenges`, `rule-text` | PR 5 | `pnpm test` (RED→GREEN) | N/A — unreferenced until S4b/S5a/S5b | Revert the four new/modified files |
| S4a | Rule builder + presets | PR 6 | `pnpm test` (RED→GREEN on presets) | N/A — `rule-builder.tsx` is unreferenced until S4b | Delete `src/domain/rule-presets.ts` (+test) and `src/app/challenges/new/rule-builder.tsx` |
| S4b | "/challenges/new" page + action | PR 7 | `pnpm test` | Manual: create a challenge against a seeded local D1 at 390px | Delete `src/app/challenges/new/{page.tsx,actions.ts,create-form.tsx}` |
| S5a | "/challenges" browse | PR 8 | `pnpm typecheck && pnpm lint && pnpm build` | Manual: browse with/without active challenges, incl. empty state | Delete `src/components/ui/challenge-card.tsx` and `src/app/challenges/page.tsx` |
| S5b | "/challenges/[id]" view + join | PR 9 | `pnpm typecheck && pnpm lint && pnpm build` | Manual: join, already-joined, ended-challenge refusal, signed-out read + redirect-with-reason | Delete `src/app/challenges/[id]/*`, `src/components/ui/{player-row,stat-tile}.tsx`; revert the "/account" reason banner |
| S6 | Restyle "/" and "/account"; delete the S0 shim | PR 10 | `pnpm typecheck && pnpm lint && pnpm build` | Manual: every page at 390px + desktop; `rg "dark:" src/` returns nothing | Revert restores the current "/" and "/account" markup verbatim |
| S7 | Playwright harness + create-then-join spec | PR 11 | `pnpm test:e2e` | `pnpm test:e2e` against `next dev`, both viewport projects | Remove `playwright.config.ts`, `e2e/`, the devDependency, and the two scripts — no production code to unwind |

---

## Ordering and parallelism

```
S0 ──► S1 ──────────────┬──► S4a ──► S4b ──┐
                        │                  ├──► S7
S2 ──► S3a ──► S3b ─────┴──► S5a ──► S5b ──┘
                                       │
                                       └──► S6
```

**S2 runs in parallel with S0/S1** — it touches only `src/domain/ports/` and `src/adapters/db/`, has no dependency on the design foundation, and nothing in S0/S1 depends on it. A team may land S2 before, during, or after S0/S1; the dependency graph above is authoritative, not the numbering.

---

## Phase S0: Design foundation

**PR title**: `feat: vendor design tokens and self-hosted fonts into the app shell`
**Branch**: `feat/challenge-ui-s0-design-foundation`
**Depends on**: — (first slice)
**Est. changed lines**: 250–400

- [x] 0.1 Vendor `src/styles/tokens/colors.css` byte-for-byte from `design/_ds/become-a-legend-design-system-cbebf259-7f79-47a7-9501-a332cdf16208/tokens/colors.css` (read-only) — design-system: Design Tokens as CSS Custom Properties (D1)
- [x] 0.2 Vendor `src/styles/tokens/typography.css`, `src/styles/tokens/spacing.css`, `src/styles/tokens/radius.css`, `src/styles/tokens/elevation.css`, `src/styles/tokens/motion.css`, `src/styles/tokens/base.css` byte-for-byte from `design/_ds/become-a-legend-design-system-cbebf259-7f79-47a7-9501-a332cdf16208/tokens/{typography,spacing,radius,elevation,motion,base}.css` (read-only); do **not** vendor `tokens/fonts.css` or `tokens/tiers.css` (D1, D4) — design-system: Design Tokens as CSS Custom Properties
- [x] 0.3 Create `src/styles/tokens/app-aliases.css` — one `--bal-*` declaration per token name colliding with a Tailwind 4 theme namespace, plus the `--bal-text-body-color` / `--bal-text-body-size` split under `[data-theme="light"]` (D2, D3)
- [x] 0.4 Create `src/styles/tokens/app-fonts.css` binding `--font-display`, `--font-body`, `--font-mono` to the `next/font` CSS variables declared in `src/app/fonts.ts` (D4)
- [x] 0.5 Create `src/app/fonts.ts` with three `next/font/local` declarations (Space Grotesk 400–700, Instrument Sans 400–600, JetBrains Mono 400–500). Download the latin-subset variable `woff2` files under `src/app/fonts/`, confirm SIL OFL 1.1 licensing for all three, and add `src/app/fonts/OFL-SpaceGrotesk.txt`, `src/app/fonts/OFL-InstrumentSans.txt`, `src/app/fonts/OFL-JetBrainsMono.txt`, `src/app/fonts/README.md` recording source and version — design-system: Self-Hosted Typography, No Runtime Font CDN
- [x] 0.6 Replace `src/app/globals.css` in full: `@import "tailwindcss"`, the vendored token imports (unlayered), `app-fonts.css` / `app-aliases.css` imports, `base.css` imported `layer(base)` (D6), the `@theme inline` block (every `--color-*`/`--font-*`/`--text-*`/`--tracking-*`/`--leading-*`/`--radius-*`/`--shadow-*`/`--container-*`/`--ease-*` mapping plus the R7 `--color-background`/`--color-foreground` compatibility aliases), the `@custom-variant dark (&:where(:root, :root *));` shim (D7), and `:root { color-scheme: dark; }` — design-system: Design Tokens as CSS Custom Properties, Dark-First Theming Without a Toggle
- [x] 0.7 Modify `src/app/layout.tsx`: replace the two Geist font variables with `${spaceGrotesk.variable} ${instrumentSans.variable} ${jetbrainsMono.variable}` on `<html className="… h-full antialiased">`, set `<body className="min-h-full flex flex-col">`, and mount `<SiteHeader />` before `{children}` (keep `<SiteFooter />` after) — design-system: Header Navigation
- [x] 0.8 Create `src/components/site-header.tsx` (server component, no `"use client"`) — sticky `bg-bg-canvas/88 backdrop-blur-[20px]` header, `max-w-container-max` container with `px-5 lg:px-10`, wordmark, exactly three destinations ("/challenges", "/challenges/new", "/account"), `<AuthStatus />`; below `sm:` the three links collapse to `IconButton`s — design-system: Header Navigation, Mobile-First Responsive Contract
- [x] 0.9 Verify: `pnpm typecheck && pnpm lint && pnpm build`; `pnpm exec opennextjs-cloudflare build`; manually render "/", "/account", "/terms", "/privacy" at 390px and desktop **on a light-OS profile** (proves the `dark` shim keeps them readable); confirm the devtools network panel shows no request to `fonts.googleapis.com`

---

## Phase S1: UI primitives

**PR title**: `feat: port design-system UI primitives to Tailwind 4`
**Branch**: `feat/challenge-ui-s1-ui-primitives`
**Depends on**: S0
**Est. changed lines**: 300–450 (median 375 — carries a contingent split, see below)

- [x] 1.1 Create `src/components/icons/paths.ts` — frozen `ICON_PATHS` record for the 14 used glyphs (`swords`, `layout-grid`, `plus`, `user`, `x`, `check`, `circle-check`, `circle-alert`, `clock`, `chevron-down`, `arrow-left`, `arrow-right`, `copy`, `loader-circle`), copied from `lucide@0.544.0`, `strokeLinecap="round" strokeLinejoin="round"`; create `src/components/icons/LICENSE-lucide.txt` (ISC) — design-system: Vendored Icons, No External Icon CDN
- [x] 1.2 Create `src/components/icons/icon.tsx` — `Icon({ name, size = 18, strokeWidth = 1.75, className, title })`, inline `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">`, `aria-hidden="true"` when `title` is omitted — design-system: Vendored Icons, No External Icon CDN
- [x] 1.3 Create `src/components/ui/button.tsx` — `variant: primary|secondary|ghost|outline|danger`, `size: sm|md|lg`, `icon"/"iconAfter`, `fullWidth`, `loading` → `disabled` + `aria-busy` + `motion-safe:animate-spin` `loader-circle` (`motion-reduce:animate-none`); spreads `ButtonHTMLAttributes`, no `onClick` prop, no `"use client"` (D8) — design-system: UI Primitives and Their States (Disabled primitive is non-interactive; Button loading state blocks resubmission)
- [x] 1.4 Create `src/components/ui/icon-button.tsx` — `{ icon, label, size?, variant?: "ghost"|"solid", active? }`, `label` required → `aria-label` — design-system: UI Primitives and Their States
- [x] 1.5 Create `src/components/ui/card.tsx` — `{ children, surface?, padding?, accentEdge?, elevation?, interactive?, as?: "div"|"article"|"li" }`, `interactive` adds `hover:bg-surface-3` with no JS — design-system: UI Primitives and Their States
- [x] 1.6 Create `src/components/ui/badge.tsx` — `{ children, tone?: neutral|win|pending|live|info|loss, icon?, dot?, pill? }` — design-system: UI Primitives and Their States
- [x] 1.7 Create `src/components/ui/tag.tsx` — `{ children, selected?, removable?, onRemove?: () => void }` — design-system: UI Primitives and Their States
- [x] 1.8 Create `src/components/ui/input.tsx` — uncontrolled, `{ label, hint?, error?, icon?, suffix? } & InputHTMLAttributes`; `error` wires `aria-invalid="true"`, `aria-describedby`, `circle-alert` icon, and the error message (D9) — design-system: UI Primitives and Their States (Input error state is visually distinct)
- [x] 1.9 Create `src/components/ui/select.tsx` — uncontrolled native `<select>`, `{ label, hint?, error?, options: {value,label}[] } & SelectHTMLAttributes`, `chevron-down` (D9) — design-system: UI Primitives and Their States
- [x] 1.10 Create `src/components/ui/checkbox.tsx` and `src/components/ui/radio.tsx` — uncontrolled native inputs, `{ label, description? } & InputHTMLAttributes` (D9) — design-system: UI Primitives and Their States
- [x] 1.11 Create `src/components/ui/game-tag.tsx` — `{ game?: "lol", short?, queue?: Queue }`, text only, `queue` typed from `src/domain/match.ts` — design-system: UI Primitives and Their States
- [x] 1.12 Verify: `pnpm typecheck && pnpm lint && pnpm build`; `rg '"use client"' src/components/ui src/components/icons` returns nothing (D8); confirm "/" and "/account" produce no new client JS chunk

**Contingent split — measure before opening the PR.** After 1.11, run `git diff --stat` against the slice's base branch. If the total exceeds 400 authored lines, split before continuing:
- **S1a** (`feat/challenge-ui-s1a-core-primitives`): `Icon`, `Button`, `IconButton`, `Card`, `Badge`, `Tag` (tasks 1.1–1.2, 1.3, 1.4, 1.5, 1.6, 1.7).
- **S1b** (`feat/challenge-ui-s1b-form-primitives`, based on S1a): `Input`, `Select`, `Checkbox`, `Radio`, `GameTag` (tasks 1.8–1.11), sharing only `Icon` from S1a.

---

## Phase S2: Ports + adapters (parallel with S0/S1)

**PR title**: `feat: add challenge listing and progress read ports`
**Branch**: `feat/challenge-ui-s2-ports-adapters`
**Depends on**: — (independent of S0/S1; land in any order)
**Est. changed lines**: 200–350
**Strict TDD — RED first** for every pair below.

- [x] 2.1 RED: add failing cases to `src/adapters/db/challenge-repository.test.ts` for `listPublic` against `createTestDb()` — public + in-window appears · `unlisted` excluded regardless of window · not-yet-started excluded · ended excluded · `startsAt === now` included · `endsAt === now` included · ordering by `endsAt` ascending · tie on `endsAt` broken by `id` ascending · `limit` respected · empty result is `[]`
- [x] 2.2 GREEN: add `listPublic(now: Date, limit: number): Promise<StoredChallenge[]>` to `src/domain/ports/challenge-repository.ts`; implement it in `src/adapters/db/challenge-repository.ts` with `and(eq(visibility,"public"), lte(startsAt, now), gte(endsAt, now))`, `.orderBy(asc(endsAt), asc(id))`, `.limit(limit)`, mapped through the existing `toStoredChallenge` — challenge-discovery: Listing Scope — Active Public Challenges Only, Ordering — Soonest-Ending First
- [x] 2.3 RED: add failing cases to `src/adapters/db/challenge-repository.test.ts` for `listProgressForChallenge` — two participants each get their own rows · `ruleIndex` order preserved within a participant · `completedAt` null → `completed: false` · participant with zero rows absent from the result · unknown challenge id → `[]`
- [x] 2.4 GREEN: add `ParticipantProgress` type and `listProgressForChallenge(challengeId: string): Promise<ParticipantProgress[]>` to `src/domain/ports/challenge-repository.ts`; implement it in `src/adapters/db/challenge-repository.ts`, grouping by `riotAccountId` and mapping `completed = completedAt !== null` (identical semantics to `findProgress`) — challenge-view: Every Participant's Progress from Stored Rows
- [x] 2.5 RED: add failing cases to `src/adapters/db/riot-account-repository.test.ts` for `findById` — hit returns the mapped account · miss returns `null` · existing platform/region guards still throw on a corrupt row
- [x] 2.6 GREEN: add `findById(id: string): Promise<RiotAccount | null>` to `src/domain/ports/riot-account-repository.ts`; implement it in `src/adapters/db/riot-account-repository.ts` reusing the existing `toRiotAccount` guards — challenge-participation: Account Selection When Multiple Linked Accounts Exist, challenge-view: Every Participant's Progress from Stored Rows
- [x] 2.7 Verify: `pnpm test` (every case from 2.1/2.3/2.5 is GREEN); `pnpm typecheck && pnpm lint && pnpm build`

---

## Phase S3a: Write use cases

**PR title**: `feat: add challenge create and join use cases`
**Branch**: `feat/challenge-ui-s3a-write-use-cases`
**Depends on**: S2
**Est. changed lines**: 250–400
**Strict TDD — RED first** for every pair below.

- [x] 3a.1 RED: add failing cases to `src/domain/rule-codec.test.ts` for `safeParseRules` — valid · non-JSON → `not_json` · empty array → `invalid` · bad target on rule index 1 → `{ ruleIndex: 1, field: "target" }` · unknown criterion kind
- [x] 3a.2 GREEN: add `ParsedRules` type and `safeParseRules(json: string): ParsedRules` to `src/domain/rule-codec.ts`, wrapping `JSON.parse` + `rulesSchema.safeParse` and translating `issues[0].path` into `{ ruleIndex, field }` (D14) — challenge-authoring: Server-Side Rule Validation via parseRules
- [x] 3a.3 RED: create `src/application/create-challenge.test.ts` with hand-written in-memory port fakes (no mocking library, no casts) — happy path stores exactly the submitted values · whitespace-only title · `endsAt === startsAt` · `endsAt < startsAt` · unparseable date · bad visibility · `safeParseRules` failure names the second rule · zero rules rejected · 6 rules rejected · 5 criteria on one rule rejected · self-join stores a participant · self-join with a foreign account refused, nothing created · creation succeeds with `joinAsRiotAccountId: null`
- [x] 3a.4 GREEN: create `src/application/create-challenge.ts` — factory `createChallenge(deps: { challenges, riotAccounts, newId })`, `CreateChallengeInput"/"CreateChallengeResult` typed union, validation order (title trim → window parse/order → visibility → `safeParseRules` → 5-rule/4-criteria caps → self-join ownership via `findById` → `newId()` → `challenges.create` → optional `challenges.join`) — challenge-authoring: Challenge Fields and Window Validation, Rule Builder Structure and Caps, Preset Starting Points (validates preset-originated rules identically), Creator's Optional Self-Join, Server-Side Rule Validation via parseRules, Redirect to the Created Challenge (returns the id the action redirects to)
- [x] 3a.5 RED: create `src/application/join-challenge.test.ts` — joins · second join reports `already_joined` and adds no row · unknown challenge · ended challenge refused · upcoming challenge allowed · live challenge allowed · foreign account refused with no write
- [x] 3a.6 GREEN: create `src/application/join-challenge.ts` — factory `joinChallenge(deps: { challenges, riotAccounts, now })`, `JoinChallengeInput"/"JoinChallengeResult` typed union, order (`findById` challenge → `challenge_not_found`; `now() > endsAt` → `challenge_ended`; `riotAccounts.findById` ownership check → `riot_account_not_owned`; `listParticipants` contains id → `already_joined`; else `join`, relying on `onConflictDoNothing` for the race) — challenge-participation: Sign-In and Linked Account Required to Join, Account Selection When Multiple Linked Accounts Exist, Idempotent Duplicate-Free Join, Window-Gated Join
- [x] 3a.7 Verify: `pnpm test` (every case from 3a.1/3a.3/3a.5 is GREEN); `pnpm typecheck && pnpm lint && pnpm build`

---

## Phase S3b: Read use cases

**PR title**: `feat: add challenge view and browse use cases`
**Branch**: `feat/challenge-ui-s3b-read-use-cases`
**Depends on**: S3a
**Est. changed lines**: 250–400
**Strict TDD — RED first** for every pair below.

- [x] 3b.1 RED: create `src/domain/rule-text.test.ts` — `Win 3 games as Ahri` · `Play 20 games` · singular `Win 1 game` · role label · queue word · combined criteria ordering · unknown role
- [x] 3b.2 GREEN: add `ROLE_LABELS"/"QUEUE_LABELS` to `src/domain/match.ts` next to `ROLES"/"QUEUES` (with a matching test addition in `src/domain/match.test.ts`); create `src/domain/rule-text.ts` with `ruleToSentence(rule)` and `rulesToSentences(rules)` per the deterministic template `{Win|Play} {target} {queueWord?} {game|games}{ as {champion}}{ in {roleLabel}}` (D11) — challenge-view: Rules Rendered in Words
- [x] 3b.3 RED: create `src/application/get-challenge-view.test.ts` — unknown id → `not_found` · state boundaries (`now < startsAt`, `now === startsAt`, `now === endsAt`, `now > endsAt`) · every participant listed, not just one · participant without progress rows zero-filled · `lastCheckedAt` null when no poll state · sentences come from `rulesToSentences` · participants sorted deterministically
- [x] 3b.4 GREEN: create `src/application/get-challenge-view.ts` — factory `getChallengeView(deps: { challenges, riotAccounts, polling, now })`, `ChallengeState"/"ParticipantView"/"ChallengeView"/"GetChallengeViewResult` types; `findById` → `not_found`; concurrent `listParticipants` + `listProgressForChallenge`; per participant `riotAccounts.findById` then `polling.getState(puuid)`; progress zero-filled to `rules.length`; participants sorted by lowercased `displayName` ascending — challenge-view: Challenge Summary and Computed State, Every Participant's Progress from Stored Rows, Per-Participant Freshness Signal, Unknown Challenge Id Renders Not Found
- [x] 3b.5 RED: create `src/application/list-public-challenges.test.ts` — delegates `now` and `limit` to `listPublic` · empty list is `[]` · summaries carry sentences
- [x] 3b.6 GREEN: create `src/application/list-public-challenges.ts` — `ChallengeSummary` type, `DEFAULT_PUBLIC_LIMIT = 50`, `listPublicChallenges(deps: { challenges, now })(limit?)` returning a plain array with computed `state` and `ruleText` — challenge-discovery: Listing Scope — Active Public Challenges Only, Ordering — Soonest-Ending First
- [x] 3b.7 Verify: `pnpm test` (every case from 3b.1/3b.3/3b.5 is GREEN); `pnpm typecheck && pnpm lint && pnpm build`

---

## Phase S4a: Rule builder + presets

**PR title**: `feat: add rule builder and preset rules for challenge creation`
**Branch**: `feat/challenge-ui-s4a-rule-builder`
**Depends on**: S1, S3a
**Est. changed lines**: 180–260

- [x] 4a.1 RED: create `src/domain/rule-presets.test.ts` — each preset's `build(...)` output survives `parseRules` · edited args flow through
- [x] 4a.2 GREEN: create `src/domain/rule-presets.ts` with `RULE_PRESETS: { id, label, description, build(args): Rule }[]` for the four presets (Win the match; Win N games with champion X; Play N games; Win N ranked games as role R) (D12) — challenge-authoring: Preset Starting Points
- [ ] 4a.3 Create `src/app/challenges/new/rule-builder.tsx` (`"use client"`) — 1–5 rules via `useState<Rule[]>`, each with a target and 0–4 criteria rendered as `Tag` chips, add/remove controls disabled at the caps (`Add rule` disabled at 5, `Remove` disabled at 1 remaining rule, `Add criterion` disabled at 4 per rule) — challenge-authoring: Rule Builder Structure and Caps
- [ ] 4a.4 Verify: `pnpm test` (rule-presets suite GREEN from 4a.1); `pnpm typecheck && pnpm lint && pnpm build` — `rule-builder.tsx` is unreferenced at this point and ships without changing any rendered page, matching S1's independence property

---

## Phase S4b: "/challenges/new" page + action

**PR title**: `feat: add the challenge creation route`
**Branch**: `feat/challenge-ui-s4b-create-route`
**Depends on**: S4a, S3b
**Est. changed lines**: 170–240

- [ ] 4b.1 Create `src/app/challenges/new/actions.ts` (`"use server"`) — `createChallengeAction(prev, formData)`: `auth()` gate returning `{ kind: "unauthenticated" }` when absent, `getAppDb()`, calls `createChallenge({ challenges, riotAccounts, newId: () => crypto.randomUUID() })(input)`; on `kind !== "created"` returns the result; on success `revalidatePath("/challenges")` then `redirect(\"/challenges/${result.id}\")` **outside any try** (Next docs: redirect throws) — challenge-authoring: Redirect to the Created Challenge
- [ ] 4b.2 Create `src/app/challenges/new/page.tsx` (server) — `auth()` + `listByUser` for the signed-in user's linked accounts; renders a sign-in panel with `<AuthStatus />` (rule builder **not** rendered) when signed out, or `<CreateForm />` when signed in — challenge-authoring: Sign-In Required to Create a Challenge
- [ ] 4b.3 Create `src/app/challenges/new/create-form.tsx` (`"use client"`) — single `<form action={formAction}>` wrapping all four wizard steps (`preset` → `rules` → `details` → `review`) with inactive steps hidden via the `hidden` attribute so `FormData` always carries every field; `useState<Step>` for the step machine with Back/Next; `preset` step renders `RULE_PRESETS` as selectable `Card`s plus "Start from scratch"; `details` step collects title, `startsAt"/"endsAt` (`datetime-local`), visibility `Radio` pair, and the self-join control (unavailable-with-explanation at 0 accounts, bare `Checkbox` at 1, `Checkbox` + `Select` at >1); `review` step restates every rule via `ruleToSentence` and is the only step with a `type="submit"` button; `useActionState(createChallengeAction, null)`; `messageFor()` maps every `CreateChallengeActionState.kind` to its English message from the design's error-mapping table — challenge-authoring: Challenge Fields and Window Validation, Preset Starting Points, Creator's Optional Self-Join, Server-Side Rule Validation via parseRules
- [ ] 4b.4 Verify: `pnpm test`; `pnpm typecheck && pnpm lint && pnpm build`; manually create a challenge against a seeded local D1 at 390px (the post-submit redirect target 404s until S5b lands — expected within the chain, not a regression in this slice)

---

## Phase S5a: "/challenges" browse

**PR title**: `feat: add the challenge browse route`
**Branch**: `feat/challenge-ui-s5a-browse-route`
**Depends on**: S1, S3b
**Est. changed lines**: 150–250

- [ ] 5a.1 Create `src/components/ui/challenge-card.tsx` — `{ href, title, state: ChallengeState, ruleText: string[], endsAt: Date }`, `accentEdge` when `state === "live"`, whole card wrapped in a `next/link` (D10, reduced from the export's coin/tier/stake props) — design-system: UI Primitives and Their States, No Gamification or Social Surface
- [ ] 5a.2 Create `src/app/challenges/page.tsx` (server) — calls `listPublicChallenges()`, renders a `<ul>` of `Card as="li"` (via `ChallengeCard`), or the designed empty state (`Card` with "No challenges are running right now." plus a primary `Button` linking to "/challenges/new") — challenge-discovery: Public Read Access, Listing Scope — Active Public Challenges Only, Ordering — Soonest-Ending First, Empty State, No Gamification Chrome on the Browse List
- [ ] 5a.3 Verify: `pnpm typecheck && pnpm lint && pnpm build`; manually browse with active challenges and with zero, incl. the empty state, against a seeded local D1 (cards link to a 404 until S5b lands — expected within the chain)

---

## Phase S5b: "/challenges/[id]" view + join

**PR title**: `feat: add the challenge view and join route`
**Branch**: `feat/challenge-ui-s5b-view-join-route`
**Depends on**: S1, S3b, S5a
**Est. changed lines**: 300–450 (median 375 — carries a contingent split, see below)

- [ ] 5b.1 Create `src/components/ui/player-row.tsx` (`{ name, meta?, right? }`, rows separated by `border-divider`, none on the last) and `src/components/ui/stat-tile.tsx` (`{ label, value, hint? }`, `value` in `font-mono tabular-nums`) (D10) — design-system: UI Primitives and Their States, No Gamification or Social Surface
- [ ] 5b.2 Create `src/app/challenges/[id]/page.tsx` (server, `PageProps<'/challenges/[id]'>`) — `getChallengeView(deps)(id)`; `notFound()` on `kind === "not_found"`, called in the render path; `generateMetadata` sets the document title from a single `challenges.findById`; renders title, computed state `Badge`, rules via `ruleText`, the share control, and every participant as `PlayerRow` + per-rule `StatTile`s with the "account last checked" / "not checked yet" freshness label; `lg:` sticky summary column, one breakpoint — challenge-view: Unauthenticated Read Access Including Unlisted, Challenge Summary and Computed State, Rules Rendered in Words, Every Participant's Progress from Stored Rows, Per-Participant Freshness Signal, Unknown Challenge Id Renders Not Found, No Gamification Rendering on the View Page, design-system: Mobile-First Responsive Contract
- [ ] 5b.3 Create `src/app/challenges/[id]/copy-link.tsx` (`"use client"`) — clipboard `copy` control exposing the exact "/challenges/{id}" URL — challenge-view: Share URL Affordance
- [ ] 5b.4 Create `src/app/challenges/[id]/actions.ts` (`"use server"`) — `joinChallengeAction(prev, formData)`: `auth()` absent → `redirect("/account?reason=sign-in-to-join")` (D18); zero linked accounts → `redirect("/account?reason=link-account-to-join")` (D18); resolves `riotAccountId` from `formData` or the sole linked account; calls `joinChallenge({ challenges, riotAccounts, now: () => new Date() })(input)`; on `kind === "joined"`, `revalidatePath(\"/challenges/${challengeId}\")` (literal path, no `type`) — challenge-participation: Sign-In and Linked Account Required to Join, Account Selection When Multiple Linked Accounts Exist, Window-Gated Join
- [ ] 5b.5 Create `src/app/challenges/[id]/join-form.tsx` (`"use client"`) — `useActionState(joinChallengeAction, null)`; a single linked account used directly with no picker, a `Select` when more than one (challenge-participation: Account Selection When Multiple Linked Accounts Exist — Single/Multiple linked account scenarios); inline `role="status"` result region rendering the design's per-`kind` message (`joined` / `already_joined` / `challenge_ended` / `challenge_not_found` / `riot_account_not_owned`) — challenge-participation: Idempotent Duplicate-Free Join, Inline Result Reporting
- [ ] 5b.6 Modify `src/app/account/page.tsx` to read `PageProps<'/account'>`'s `searchParams`, map the closed `reason` union (`sign-in-to-join` | `link-account-to-join`) to a banner via a `Card`, and render nothing for any unrecognised value — challenge-participation: Sign-In and Linked Account Required to Join (D18)
- [ ] 5b.7 Verify: `pnpm typecheck && pnpm lint && pnpm build`; manually exercise join, already-joined (participant count unchanged), ended-challenge refusal, and signed-out read + redirect-with-reason against a seeded local D1

**Contingent split — measure before opening the PR.** After 5b.6, run `git diff --stat` against the slice's base branch. If the total exceeds 400 authored lines, split before continuing:
- **S5b-i — read-only view** (`feat/challenge-ui-s5b-i-view-route`): `src/components/ui/player-row.tsx`, `src/components/ui/stat-tile.tsx`, `src/app/challenges/[id]/page.tsx` (incl. `generateMetadata"/"notFound()`), `src/app/challenges/[id]/copy-link.tsx` (tasks 5b.1–5b.3). Est. 180–260. Ships a complete, readable, shareable challenge page with no Join control.
- **S5b-ii — join** (`feat/challenge-ui-s5b-ii-join-action`, based on S5b-i): `src/app/challenges/[id]/actions.ts`, `src/app/challenges/[id]/join-form.tsx`, `~ src/app/account/page.tsx` (tasks 5b.4–5b.6). Est. 120–190.
- **Pre-authorised fallback**: if the split proves impossible during apply (for example, the join form cannot be added without restructuring `page.tsx`), record `size:exception` on the whole S5b slice with the reason "view and join share one page composition that cannot be cut without a throwaway intermediate layout" and keep it as one PR. This exception is pre-authorised by design.md; no additional approval round is needed if it is invoked exactly for this reason.

---

## Phase S6: Restyle + shim removal

**PR title**: `feat: restyle landing and account pages onto the design system`
**Branch**: `feat/challenge-ui-s6-restyle`
**Depends on**: S1, S5b
**Est. changed lines**: 200–300

- [ ] 6.1 Restyle `src/app/page.tsx` onto the token utilities; remove its 4 `dark:` pairs; preserve markup structure and behaviour — design-system: Design Tokens as CSS Custom Properties, Mobile-First Responsive Contract
- [ ] 6.2 Restyle `src/app/account/page.tsx` (6 `dark:` pairs) and `src/app/account/link-form.tsx` (5 `dark:` pairs) onto the token utilities; preserve markup structure and behaviour, keeping the `?reason=` banner added in S5b — design-system: Design Tokens as CSS Custom Properties
- [ ] 6.3 Restyle `src/components/auth-status.tsx` (3 `dark:` pairs); remove its own "Your account" link now that `SiteHeader` owns that destination
- [ ] 6.4 Restyle `src/components/site-footer.tsx` (2 `dark:` pairs) onto the same `max-w-container-max` container as the header, `border-divider`, `text-text-muted`; keep the Riot disclaimer and the two legal links untouched
- [ ] 6.5 Restyle `src/components/legal-page.tsx` (1 `dark:` pair)
- [ ] 6.6 Modify `src/app/globals.css`: delete `@custom-variant dark (&:where(:root, :root *));` and the two R7 compatibility aliases (`--color-background`, `--color-foreground`) now that no file reads them (D7)
- [ ] 6.7 Verify: `pnpm typecheck && pnpm lint && pnpm build`; every page readable at 390px and desktop; `rg "dark:" src/` returns nothing

---

## Phase S7: End-to-end coverage

**PR title**: `feat: add Playwright e2e coverage for create-then-join`
**Branch**: `feat/challenge-ui-s7-e2e`
**Depends on**: S4b, S5b
**Est. changed lines**: 150–300

- [ ] 7.1 Add devDependency `@playwright/test`; add `"test:e2e": "playwright test"` and `"test:e2e:install": "playwright install --with-deps chromium"` to `package.json`; add "/test-results/", "/playwright-report/", "/blob-report/" to `.gitignore`
- [ ] 7.2 Create `playwright.config.ts` — `testDir: "e2e"`, `fullyParallel: false` (one shared local D1 file), `globalSetup: "./e2e/global-setup.ts"`, `use.baseURL: "http://localhost:3000"`, two chromium projects (`mobile` 390×844, `desktop` 1280×900), `webServer` running `pnpm dev` with `reuseExistingServer: !process.env.CI`
- [ ] 7.3 Create `e2e/fixtures/env.ts` (`requireEnv` — a ~10-line `KEY=VALUE` reader over `.dev.vars` then `.env.local`, throwing a named error when `AUTH_SECRET` is missing) and `e2e/fixtures/session.ts` (`signIn(context, user)` — mints the `authjs.session-token` cookie via `encode` from `next-auth/jwt` with `salt: "authjs.session-token"`, `token: { sub, name, userId }`, `maxAge: 3600`) (D16)
- [ ] 7.4 Create `e2e/fixtures/seed.sql` (delete `e2e-%` rows, then `INSERT OR REPLACE` two users and one Riot account each — `e2e-user-a"/"e2e-user-b`, `e2e-account-a"/"e2e-account-b`, puuid `e2e-puuid-a"/"e2e-puuid-b`, platform `la1`, region `americas`) and `e2e/global-setup.ts` (`execFileSync("pnpm", ["exec", "wrangler", "d1", "execute", "DB", "--local", "--file", "e2e/fixtures/seed.sql"])` — fixed argv array, no shell string; reads one seeded row back and throws if absent) — threat matrix: Test-time subprocess (interpolated SQL / silent-no-op seed / missing wrangler)
- [ ] 7.5 Create `e2e/create-then-join.spec.ts` — (1) context A signed in as user A creates via preset "Play N games", target 5, and lands on "/\/challenges\/[0-9a-f-]{36}$/"; (2) a signed-out context opens that URL, the page renders, clicking Join lands on "/account?reason=sign-in-to-join"; (3) context B signed in as user B joins, sees the inline "You joined with …" confirmation, and both display names appear as participants at `0 / 5`; (4) context B joins again, sees "You have already joined this challenge.", participant count unchanged; (5) "/challenges" lists the created challenge — challenge-participation: Automated End-to-End Coverage of Create-Then-Join
- [ ] 7.6 Verify: `pnpm test:e2e:install`; `pnpm test:e2e` passes both the `mobile` and `desktop` projects

---

## Apply notes

**Owner-blocked prerequisites that do NOT block apply.** Discord OAuth secrets, `RIOT_API_KEY`, and the remote D1 migration (`pnpm db:migrate` against `--remote`) are all outstanding owner items, but none of them block this change. This UI work reads and writes stored rows only; it can be built, tested, and manually exercised entirely against local D1 with hand-seeded or e2e-seeded data, exactly as the proposal states ("Nothing here is blocked by the open owner items").

**What apply needs locally, before or during S0–S2:**
- `pnpm db:migrate:local` already applied — confirm the local D1 schema is current before S2's adapter tests run against `createTestDb()`.
- A seeded local D1 for the manual checks in S4b, S5a, and S5b — hand-insert a `users` row, a `riot_accounts` row, and a `challenges` row (or, once S7 lands, reuse `e2e/fixtures/seed.sql` directly via `wrangler d1 execute DB --local --file e2e/fixtures/seed.sql`).
- Font files downloaded under OFL for S0, task 0.5: **Space Grotesk**, **Instrument Sans**, **JetBrains Mono** — latin-subset variable `.woff2` per family, placed under `src/app/fonts/`, with their licence files at `src/app/fonts/OFL-SpaceGrotesk.txt`, `src/app/fonts/OFL-InstrumentSans.txt`, `src/app/fonts/OFL-JetBrainsMono.txt`, plus `src/app/fonts/README.md` recording source and version. Confirm SIL OFL 1.1 licensing for each family before committing the binaries (proposal §Dependencies).

**`design/` is read-only input.** Every path under `design/_ds/become-a-legend-design-system-cbebf259-7f79-47a7-9501-a332cdf16208/` is a copy source for S0 (D1) and is never imported at runtime by any file this change creates or modifies — the app owns its own vendored copies in `src/styles/tokens/`. Do not add an `@import` or module resolution path that reaches into `design/` from `src/`.

**Next-specific code is written against `node_modules/next/dist/docs/`** (resolved under pnpm per `AGENTS.md`), not training-data assumptions about Next.js. The specific facts this design relies on — `PageProps<'/challenges/[id]'>` as a generated global helper, `params"/"searchParams` as Promises, `next/font/local`'s `src` array form, `redirect()` throwing outside any `try`, `notFound()` called in the render path, `revalidatePath`'s literal-vs-`type: 'page'` distinction, and Server Functions being reachable via direct POST — are listed in `design.md`'s "Next.js 16 facts this design is built on" table and apply directly to tasks 4b.1, 5b.2, and 5b.4.
