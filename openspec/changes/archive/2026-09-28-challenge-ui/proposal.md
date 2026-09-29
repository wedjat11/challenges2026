# Proposal: Challenge UI (T12) on the Become a Legend design system

Change: `challenge-ui` · Store: hybrid (this file + Engram topic `sdd/challenge-ui/proposal`, project `challenges2026`) · Inputs: `exploration.md`, `research.md`, `odd/tasks/lol-tft-challenges.md`.

**In one line:** build the three missing product screens — create, browse, join/view a challenge — on top of the challenge model that already exists, dressed in the exported Become a Legend design system, delivered as eight chained PRs under the 400-line review budget.

## Intent

Everything below the UI is built and tested: rules, progress evaluation, the Riot client, the D1 repositories, the polling pipeline, Discord auth and Riot ID linking (T4–T11, 275 specs). None of it is reachable. The live site is a landing page that says "Nothing can be created or joined yet."

T12 closes that gap and is what makes the project's acceptance criteria demonstrable:

- *"A user signs in with Discord, links a Riot ID, creates a challenge and shares its URL"* — no create screen exists.
- *"A second user opens that URL, joins, and both see progress update automatically after playing"* — no view or join screen exists.

At the same time the owner exported a finished design system (`design/`: tokens, 26 components, five screen mocks, wireframes). Applying it now, while only two styled pages exist (`/` and `/account`), is far cheaper than retrofitting it after four more screens are written against ad-hoc Tailwind classes.

**Success looks like:** a signed-in user creates a challenge from a phone, copies its URL, a second user opens it, joins with their linked Riot account, and both see every participant's progress — and `pnpm test:e2e` proves the create-then-join path without a human.

## Assumptions (stated so the owner can reject them)

Settled by the owner before this proposal; recorded here because the specs depend on them.

| # | Assumption | Consequence if rejected |
|---|---|---|
| A1 | T12 keeps the **existing challenge model** (target + criteria rules, N participants, public/unlisted) and borrows only the design's *shape*. The design's 1v1-duel-with-a-stake model is not adopted. | Whole change is re-scoped; the domain would need a rival and a stake. |
| A2 | The challenge page shows **every participant's progress**, not just the viewer's. | `getChallengeView` narrows to one participant; the view spec shrinks. |
| A3 | UI copy is **English**. The design ships `COPY.en` strings; Spanish and any i18n layer are a follow-up. | Adds an i18n layer to every screen in this change. |
| A4 | Joining requires an **already-linked Riot account**; otherwise the user is sent to `/account`. No inline link form on the challenge page. | Join flow embeds the link form; couples T12 to T10's use case. |
| A5 | The creator chooses **in the create form** whether to join their own challenge. | Auto-join or never-join becomes a fixed rule. |
| A6 | The champion criterion stays **free text**. A Data Dragon-backed picker is a follow-up. | Adds a Data Dragon fetch, cache and `<datalist>` to the create slice. |
| A7 | `/challenges` lists **only currently-active** public challenges. | `listPublic` gains a filter/paging story and the list grows unbounded. |
| A8 | **Dark is the product.** Light-mode tokens are scaffolded (`[data-theme="light"]`) but no theme toggle ships in T12. | Adds a toggle, its persistence, and light-mode QA on every screen. |
| A9 | Auth stays **Discord**. The design's "Entrar con Riot" Login screen is not built; RSO is gated behind a production key the project does not hold. | Blocked — cannot be built at all until RSO is granted. |
| A10 | Navigation in T12 is a **header** (Challenges · Create · Account). The design's 5-item `BottomNav` is deferred because three of its destinations (Ranking, Avisos, Perfil) do not exist. | Port `BottomNav` and stub or hide three destinations. |
| A11 | The create wizard's step 1 offers **preset starting points** (win a match, win N games with champion X, play N games, win N ranked games as role R) that pre-fill an editable rule builder. Presets are convenience, never a separate stored shape. | Create screen becomes a raw rule builder with no presets; the design's wizard step 1 is dropped. *Most likely of these to change spec scope.* |
| A12 | "Last updated" on the view page is labelled from `poll_state.last_polled_at` as **"account last checked"**, per Riot account — not as "this rule was evaluated at". | Requires adding a timestamp to `RuleProgress`, a domain + port + adapter change. |
| A13 | Action results render **inline** via `useActionState` (the `/account` pattern). No Toast/Dialog/Tooltip in T12. | Port the three feedback components and rework the result-message pattern. |
| A14 | E2E auth is **session-cookie injection** in the Playwright fixture. No test-only provider or bypass route ships in production code. | Adds a permanent, env-gated auth surface to a codebase under Riot ToS review. |

## Scope

### In scope

1. **Design foundation** — the exported tokens vendored into the app, self-hosted fonts, vendored icons, dark-first theming, mobile-first layout shell.
2. **UI primitives** — the design's `core` and `forms` components ported to TSX + Tailwind 4.
3. **Ports and adapters** — `ChallengeRepository.listPublic`, a batch progress read, `RiotAccountRepository.findById`.
4. **Use cases** — `createChallenge`, `joinChallenge`, `getChallengeView`, `listPublicChallenges`.
5. **Routes** — `/challenges/new` (create + rule builder), `/challenges` (browse), `/challenges/[id]` (view + join).
6. **Restyle** — the landing page and `/account` brought onto the design system so the product looks like one product.
7. **E2E** — Playwright installed and configured against `next dev`, with a create-then-join spec (T12's stated check).

### Out of scope — with reasons

| Excluded | Reason |
|---|---|
| Coins, wagers, escrow, coin purchase (Maqueta 05, `CoinChip`) | The backend has no coin economy, and **Riot's ToS permits cash only for fee-funded tournaments with a 70% payout**. Real-money purchase is a legal and product decision, not a UI task. |
| The 1v1 duel model: named rival, stake matching, 24 h expiry | Contradicts A1. `challenges` has no rival column, no stake, no expiry semantics beyond `endsAt`. |
| Tiers, XP, ranking, leaderboard (`TierBadge`, `XPBar`, tiers.css) | No data exists to render. An invented skill rating is also **prohibited by Riot ToS**. |
| Friends system, notifications, push, email | No backend, no transport, no schema. |
| Avatars (`Avatar`) | No avatar storage; Discord images are not currently persisted. |
| The Riot-OAuth Login screen (Maqueta 01) | **RSO is gated** behind a production key the project does not hold (A9). |
| Edit and delete a challenge | No repository method, no ownership-transfer or in-flight-progress story. Deferred. |
| TFT screens | v1 is LoL only (decided 2026-09-16). |
| Tablet breakpoint | The design has none: 390 px mobile and ~1200 px desktop only. |
| A theme toggle | A8. |
| CI for Playwright | No CI workflow exists in this repo; e2e is a local run until CI is requested. |

## Capabilities

> Contract with `sdd-spec`. `openspec/specs/` is currently empty (`.gitkeep` only), so every capability below is new.

### New Capabilities

- `design-system`: design tokens as CSS custom properties mapped into Tailwind 4, self-hosted typography, vendored icons, the dark-first theme contract, the mobile-first responsive contract, and the ported UI primitives.
- `challenge-authoring`: creating a challenge — title, window, visibility, the rule builder (target + criteria), preset starting points, the creator's optional self-join, and validation via `parseRules`.
- `challenge-discovery`: the public browse list — which challenges appear, ordering, the empty state.
- `challenge-participation`: joining — who may join, with which linked Riot account, idempotency, and the not-signed-in / no-linked-account paths.
- `challenge-view`: the challenge detail page — rules, participants, per-participant progress, freshness signal, share URL, and unauthenticated read access.

### Modified Capabilities

None. No capability is specified today; the landing page and `/account` restyle is behaviour-preserving and is covered by `design-system`.

## Approach

### 1. Design adoption

| Concern | Decision |
|---|---|
| Tokens | Vendor `design/_ds/.../tokens/*.css` into `src/styles/tokens/` (colors, typography, spacing, radius, elevation, motion, base) and `@import` them from `globals.css`. Keep them as plain custom properties so the design tool can keep re-exporting into the same files. Then map the ones Tailwind must know about with `@theme inline` — the exact form `globals.css` already uses for `--color-background` — so `bg-surface-2`, `text-text-muted`, `border-border-subtle` and friends exist as utilities. `tiers.css` is **not** vendored (nothing renders tiers). |
| Fonts | Drop the exported `fonts.css` Google Fonts `@import` — a runtime CDN dependency is wrong on Workers and would need a privacy-policy entry. Self-host with `next/font/local`: **Space Grotesk** (display), **Instrument Sans** (body), **JetBrains Mono** (numerals, eyebrows). Subset to latin, ship only the weights used. Replaces Geist in `layout.tsx`. |
| Icons | Vendor only the Lucide glyphs actually used, as inline TSX paths behind the ported `Icon` component. No `unpkg.com` fetch. |
| Theme | Dark is the product: tokens resolve dark by default; the `[data-theme="light"]` block is carried unmodified but unexercised (A8). |
| Responsive | Mobile-first at 390 px, restated once at the desktop breakpoint (~1200 px container, 40 px gutter). No tablet tier. |
| Port method | The exported components are `React.createElement` with inline style objects reading CSS variables — **not reusable as-is**. Each is rewritten as a TSX component using Tailwind utilities over the mapped tokens, keeping the exported prop names so the design's `.prompt.md` docs stay meaningful. |

**Ported now:** `Icon`, `Button`, `IconButton`, `Card`, `Badge`, `Tag`, `Input`, `Select`, `Checkbox`, `Radio`, `GameTag` (text only, no Riot marks), plus reduced forms of `ChallengeCard` (no coin row, no tier edge), `PlayerRow` (no tier badge, no avatar ring) and `StatTile` (progress counters).

**Deferred:** `Avatar`, `Switch`, `Dialog`, `Toast`, `Tooltip`, `Tabs`, `BottomNav`, `TierBadge`, `CoinChip`, `XPBar`, `MatchResult` — each renders data the backend does not produce, or a destination that does not exist.

### 2. Screen mapping

| T12 screen | Draws from | Reused | Dropped |
|---|---|---|---|
| `/challenges/new` | Maqueta 03 · **Crear Reto** | Four-step wizard shell and step indicator; step 1 preset catalogue → rule presets; final review step | Step 3 rival picker; step 4 coin wager and stake note; insufficient-coins upsell |
| `/challenges/[id]` | Maqueta 04 · **Recibir Reto** (detalle pendiente, aceptado) | Goal/rule display, participant rows, the accept CTA re-read as Join, state badges (`Pendiente`/`En curso` → Upcoming/Live/Ended) | Stake matching and escrow; 24 h auto-expiry; push and email variants |
| `/challenges` | Maqueta 02 · **Dashboard** (con retos, vacío) | Challenge card list, empty state, section rhythm | Coin/XP header chip, "Ranking entre amigos", coin and streak stat tiles, the `Para mí`/`Enviados`/`Historial` tabs (the model has no sender/recipient split) |
| `/` (landing) | Maqueta 01 · Login — **type and layout only** | Headline treatment and display type scale; the "Not open yet" panel is replaced by real CTAs | "Entrar con Riot" — Discord sign-in stays (A9) |
| `/account` | No mock | Restyled with tokens and the ported primitives; structure and behaviour unchanged | — |

### 3. Architecture

Hexagonal layering is unchanged; `src/application` never imports from `src/adapters`.

**New port methods**

- `ChallengeRepository.listPublic(now, limit)` — public challenges whose window contains `now` (A7). Nothing filters on `visibility` today.
- `ChallengeRepository.listProgressForChallenge(challengeId)` → `{ riotAccountId, rules: RuleProgress[] }[]` — one query instead of N `findProgress` calls, and it pairs naturally with `listParticipants`.
- `RiotAccountRepository.findById(id)` — turns a participant's stored `riotAccountId` into a display name and a `puuid`. Nothing resolves a bare id today.

**New use cases** (`src/application/`, typed results over thrown errors, per the house pattern)

- `createChallenge` — validates title, window (`endsAt > startsAt`), visibility, and rules through `parseRules`; generates the id; optionally joins the creator.
- `joinChallenge` — verifies the chosen `riotAccountId` belongs to `session.user.id` before calling the idempotent `join`.
- `getChallengeView` — composes `ChallengeRepository` (challenge, participants, batch progress), `RiotAccountRepository.findById` (display name, puuid) and `PollingRepository.getState` (freshness). Per-participant `findById` calls are accepted at friends-scale.
- `listPublicChallenges` — thin wrapper over `listPublic`.

**Routes** follow the `/account` trio exactly — async server `page.tsx` (session + data) + `"use server"` `actions.ts` built per call (D1 is request-scoped) + one `"use client"` component using `useActionState` with a typed result union and a `messageFor()` switch.

| Route | Auth |
|---|---|
| `/challenges/new` | Sign-in required. |
| `/challenges` | Readable signed out. |
| `/challenges/[id]` | **Readable signed out** — the shared URL must work before sign-in. Only the join action gates on `auth()` and on a linked Riot account (A4). Unlisted security is UUID opacity; no secret-token column is added. |

**Rule builder** — the one genuinely new UI pattern (nested variable-length state). Live editing state stays in plain `useState`; on submit the whole draft serialises to **one hidden JSON field**, and the server action re-validates with `parseRules(formData.get("rulesJson"))`. Zero duplicated validation: the form and the database agree because they run the same schema. The UI, not the domain, caps rule and criteria counts (`rule-codec.ts` sets no upper bound).

**The UI never calls `evaluate`.** It reads stored `progress` rows only; evaluation stays `pollPlayer`'s job (T11's split).

**No database migration.** Every column this change reads already exists (`challenges.visibility`, `participants`, `progress`, `poll_state.last_polled_at`), which is why rollback is a code-only revert.

### 4. Verification

Strict TDD (RED observed before implementation, then GREEN) with Vitest for domain, application and adapter work — `pnpm test`. `pnpm typecheck && pnpm lint && pnpm build`, plus the worker build, per slice. Playwright (`pnpm test:e2e`) against `next dev`, which serves the same local D1 binding because `next.config.ts` calls `initOpenNextCloudflareForDev()`. Server actions and client components have no unit specs today; the e2e spec is their coverage. Next-specific code is written against `node_modules/next/dist/docs/`, per `AGENTS.md`.

## Affected areas

| Area | Impact | What changes |
|---|---|---|
| `src/app/globals.css` | Modified | Token imports + `@theme inline` mapping; the two-variable Geist theme is replaced. |
| `src/styles/tokens/*.css` | New | Vendored design tokens. |
| `src/app/layout.tsx` | Modified | Three self-hosted font families replace Geist; mobile-first shell and header. |
| `src/components/ui/*` | New | Ported design primitives. |
| `src/components/icons/*` | New | Vendored Lucide glyphs. |
| `src/app/page.tsx`, `src/components/site-footer.tsx`, `src/app/account/*` | Modified | Restyled onto the design system; behaviour unchanged. |
| `src/domain/ports/challenge-repository.ts` | Modified | `listPublic`, `listProgressForChallenge`. |
| `src/domain/ports/riot-account-repository.ts` | Modified | `findById`. |
| `src/adapters/db/challenge-repository.ts`, `src/adapters/db/riot-account-repository.ts` | Modified | Implement the above. |
| `src/application/{create-challenge,join-challenge,get-challenge-view,list-public-challenges}.ts` | New | Use cases + specs. |
| `src/app/challenges/new/*`, `src/app/challenges/page.tsx`, `src/app/challenges/[id]/*` | New | The three routes. |
| `playwright.config.ts`, `e2e/*`, `package.json` | New / Modified | Harness, auth fixture, create-then-join spec, `test:e2e` script. |
| `src/domain/rule-codec.ts`, `src/domain/progress.ts`, `src/domain/ports/polling-repository.ts` | Unchanged | Consumed as-is. |
| `src/db/schema.ts`, `drizzle/` | Unchanged | No migration. |

## Risks

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| R1 | **Size.** ~2050–3250 changed lines, 5–8× the 400-line budget. | High | Eight chained slices below; the split rule for S5 is stated up front. |
| R2 | **Free-text champion.** A typo silently makes a rule unwinnable until someone notices weeks later (A6). | Medium | Preset rules supply correct names; the review step restates each rule in words ("Win 3 games as *Ahri*") so a typo is visible before submit. Data Dragon picker logged as a follow-up. |
| R3 | **No per-rule timestamp.** `RuleProgress` strips `progress.updatedAt`; only `poll_state.last_polled_at` (per puuid) is reachable. | Medium | Label it honestly as "account last checked", per participant (A12). Do not render it as a per-rule evaluation time. |
| R4 | **CDN fonts and icons on Workers.** The export loads three families from `fonts.googleapis.com` and icons from `unpkg.com`. | Medium | Self-host via `next/font/local`; vendor the icons. Also avoids a third-party request the privacy policy does not declare. |
| R5 | **Spanish design copy vs English UI.** Every mock is Spanish (`vos`); the app is English. | Medium | Take `COPY.en` where the export provides it, author English where it does not, and treat Spanish as a later i18n change (A3). Screenshots will not match copy — expected, not a defect. |
| R6 | **Mobile-first design vs desktop-ish landing.** The current `/` and `/account` are `max-w-3xl px-6 py-24` desktop-shaped. | Medium | Rebuild the shell mobile-first at 390 px with one desktop restatement; sweep the `text-black/70 dark:text-white/70` pairs onto semantic tokens in the restyle slice. |
| R7 | **Token swap breaks existing pages.** Replacing the `--background`/`--foreground` theme changes every current utility. | Medium | Keep `--color-background`/`--color-foreground` as aliases onto the new tokens through S0–S5; remove them in the restyle slice once nothing reads them. |
| R8 | **Ported components carry product assumptions.** `ChallengeCard`, `PlayerRow` and `StatTile` render coins, tiers and XP in the export. | Medium | Port reduced variants only; no prop for data the backend cannot produce, so a future coin feature adds props instead of the UI silently rendering zeros. |
| R9 | **Playwright auth fixture couples to `next-auth` internals** (JWT cookie encoding). | Low-Med | `next-auth` is pinned to an exact beta (`5.0.0-beta.32`), not a range, so no incidental bump breaks it. All risk sits in the test harness, none in shipped code (A14). |
| R10 | **Unlisted challenges are protected only by UUID opacity**, and are readable signed out. | Low | Stated, accepted: the sensitivity of "a game goal" is low, and the shared URL must work pre-sign-in. Revisit if anything private is ever attached to a challenge. |
| R11 | **Playwright browser binaries** add ~150–300 MB to a fresh checkout. | Low | Dev-only dependency; no CI in this repo yet, so nothing else pays the cost. |
| R12 | **Next 16 conventions differ from training data** (`PageProps<'/challenges/[id]'>`, `params` as a Promise). | Low | `AGENTS.md` rule: read `node_modules/next/dist/docs/` before writing route code. Already proven in `layout.tsx`. |

## Rollback plan

Rollback is cheap by construction: **no migration, no schema change, no new external service, no production auth surface.**

| Slice | Rollback |
|---|---|
| Routes (S4, S5) | Delete `src/app/challenges/`. Nothing else links to it once the header entry is removed. No orphaned data — a `challenges` row with no UI is inert, and the poller already tolerates challenges with no participants. |
| Use cases (S3) | Unreferenced once the routes are gone; revert the commit. |
| Ports/adapters (S2) | Additive methods. Reverting removes them; every existing caller is untouched. |
| Design foundation + primitives (S0, S1) | Revert restores `globals.css` and the Geist fonts in `layout.tsx`. The alias mitigation in R7 is what keeps S0 revertible independently of S6. |
| Restyle (S6) | Revert restores the current `/` and `/account` markup verbatim. |
| E2E (S7) | Remove `playwright.config.ts`, `e2e/`, the devDependency and the script. No production code to unwind (A14). |

Partial rollback is safe in either direction: the design slices ship without the routes (the site just looks new), and the routes could ship without the design (they would look like `/account` does today). If a whole-change revert is needed after merge, revert the chain in reverse slice order; the only cross-slice coupling is the token aliases in R7.

## Delivery forecast

Strategy: `auto-chain`, 400 changed lines per PR (`additions + deletions`, authored lines). **The chain strategy itself is the orchestrator's question to the owner** — this proposal forecasts slices only. Note that T9→T10→T11 already shipped as stacked feature branches, so the repo has a working precedent either way.

| # | Slice | Depends on | Estimate | Verification |
|---|---|---|---|---|
| S0 | Design foundation: vendored tokens, `@theme` mapping, three self-hosted fonts, shell + header | — | 250–400 | typecheck / lint / build; visual check of `/` |
| S1 | UI primitives: `Icon`, `Button`, `IconButton`, `Card`, `Badge`, `Tag`, `Input`, `Select`, `Checkbox`, `Radio` | S0 | 300–450 | typecheck / lint / build |
| S2 | Ports + adapters: `listPublic`, `listProgressForChallenge`, `findById` | — (parallel with S0/S1) | 200–350 | Vitest RED→GREEN on in-memory SQLite |
| S3 | Use cases: `createChallenge`, `joinChallenge`, `getChallengeView`, `listPublicChallenges` | S2 | 250–400 | Vitest RED→GREEN |
| S4 | `/challenges/new`: wizard, rule builder, presets | S1, S3 | 350–500 | build; manual create against local D1 |
| S5 | `/challenges` browse + `/challenges/[id]` view/join, with `ChallengeCard`/`PlayerRow`/`StatTile` | S1, S3 | 400–600 | build; manual browse/join |
| S6 | Restyle `/` and `/account`; drop the R7 token aliases | S1, S5 | 150–250 | build; visual check |
| S7 | Playwright: install, config, session-cookie fixture, create-then-join spec | S4, S5 | 150–300 | `pnpm test:e2e` |

**Total ≈ 2050–3250 changed lines.** (Exploration forecast 1300–1900 for the functional work; design adoption adds ~700–1350.)

Two notes for `sdd-tasks`:

- **S5 is the one slice forecast to exceed the budget.** Split rule, decided now so it is not renegotiated later: if the measured diff exceeds 400 lines, split into **S5a browse** (list + empty state) and **S5b view/join** (detail + join action). They share only the ported card component from S1.
- **Font binaries do not count** toward the authored-line budget, but they are real repo weight: latin subset, used weights only, three families.

## Dependencies

- New devDependency `@playwright/test` plus a one-time browser download (S7).
- Self-hosted font files for Space Grotesk, Instrument Sans and JetBrains Mono, committed under `public/` or `src/app/fonts/` (S0). Licences: all three are SIL OFL — confirm and record the licence files during apply.
- **No** new runtime dependency, no Riot API key, no Cloudflare resource, no migration.
- Nothing here is blocked by the open owner items (Discord secrets, `RIOT_API_KEY`, the `OPERATOR` placeholders). Those block the *manual* checks for T9–T11 and the Riot key application, not this UI work — the UI reads stored rows and can be exercised against local D1 with a hand-seeded challenge.

## Success criteria

- [ ] A signed-in user with a linked Riot account creates a challenge at `/challenges/new` and lands on its page.
- [ ] That page's URL, opened signed out, renders the challenge, its rules and every participant's progress.
- [ ] A second signed-in user with a linked Riot account joins from that page; joining twice changes nothing.
- [ ] A user with no linked Riot account who tries to join is sent to `/account` with the reason stated.
- [ ] `/challenges` lists currently-active public challenges and shows the designed empty state when there are none.
- [ ] Unlisted challenges never appear in `/challenges` but remain reachable by URL.
- [ ] Invalid rule input is rejected by `parseRules` in the server action, and the form says which rule is wrong.
- [ ] Every screen is usable at 390 px wide and restated at desktop width.
- [ ] No runtime request to `fonts.googleapis.com` or `unpkg.com` in the built worker.
- [ ] `pnpm test` (RED observed first for every new domain/application/adapter module), `pnpm typecheck`, `pnpm lint`, `pnpm build` and the worker build all exit 0.
- [ ] `pnpm test:e2e` passes the create-then-join spec against `next dev`.
- [ ] Every merged PR is at or under 400 changed lines, or carries a recorded `size:exception`.

## Open questions

**None blocking.** Every product fork exploration raised (Q7) has been settled and is recorded in *Assumptions* above. A11 (rule presets) is the assumption most likely to change spec scope if the owner rejects it; A12 (freshness label) is the one most likely to be revisited once real progress data is visible.
