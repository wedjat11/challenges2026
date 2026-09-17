# LoL/TFT Challenges

## Objective

A web app where players create custom challenges for League of Legends and Teamfight Tactics
("win 10 ranked games as Jungle this week", "place top 4 in 5 TFT games") and have progress
tracked automatically against their real match history.

## Problem

Challenge tracking between friends happens manually today: someone posts a goal in Discord and
everyone reports their own results. Riot exposes match history through a public API, so the
tracking can be automated and shared by URL.

## Why this shape

Full rationale, sourced and costed, lives in the decision document:
<https://claude.ai/code/artifact/fde952dc-b41b-4d46-99e8-da0c81502080>

Three constraints decide the architecture:

1. **Budget is 100 MXN/month.** A native iOS app costs 142 MXN/month for the Apple Developer
   Program alone, before any hosting. Web is the only option that fits.
2. **Riot has no webhooks.** Match completion is discovered by polling, against a rate limit
   shared by every user of the app and partitioned per routing region.
3. **Riot Sign On is gated** behind an already-approved production key. Until then a Riot ID is
   an unverified claim, so Discord carries identity.

## Scope

**League of Legends only in v1.** Decided 2026-09-16. TFT is deferred, not cancelled, which is
why the domain keeps a `game` discriminant from the start — see the note under T4.

**In scope for v1**

- Create, share and join challenges for League of Legends
- Automatic progress tracking from LoL match history
- Discord sign-in; link one or more Riot IDs to an account
- Public challenge pages shareable by URL

**Out of scope for v1**

- Teamfight Tactics. Deferred to v2: `tft-match-v1`, `tft-league-v1`, `tft-summoner-v1`, the
  `tft` variant of `MatchSummary`, and placement-based rules.
- Real account ownership verification (blocked on RSO)
- Cash prizes or entry fees (Riot ToS permits only fee-funded tournaments with a 70% payout)
- Any invented skill rating or MMR (prohibited by Riot ToS)
- Native mobile apps

## Constraints

- Budget ceiling 100 MXN/month; target ~19 MXN/month
- Riot personal key during development: 100 requests / 2 minutes, per routing region
- A visible "not endorsed by Riot Games" disclaimer is mandatory
- Terms of Service and Privacy Policy pages are required before applying for a production key

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16, App Router, TypeScript strict |
| Runtime | Cloudflare Workers via `@opennextjs/cloudflare` |
| Package manager | pnpm |
| Database | Cloudflare D1 + Drizzle ORM |
| Cache / counters | Cloudflare KV |
| Scheduling | Cron Triggers + Cloudflare Queues |
| Auth | Auth.js, Discord provider |
| Validation | Zod |
| UI | Tailwind + shadcn/ui |
| Tests | Vitest (domain), Playwright (end-to-end) |

## Verification

- **TDD mode: strict**, resolved from the project CLAUDE.md directive "Strict TDD Mode: enabled".
  Observed RED before implementation, then GREEN, then refactor. No invented test evidence.
- **Test runner: Vitest** (`pnpm test`), installed in T3. Playwright (`pnpm test:e2e`) from T12.
- Typecheck: `pnpm typecheck` — runs `next typegen && pnpm cf-typegen && tsc --noEmit`. Both
  generator steps are load-bearing, because both emit types that are gitignored: Next 16 writes
  `LayoutProps` and friends into `.next/types`, and `wrangler types` writes the 596 KB
  `cloudflare-env.d.ts`. A bare `tsc --noEmit` fails on a clean checkout.
- Lint: `pnpm lint` — generated output (`.open-next/`, `.wrangler/`, `cloudflare-env.d.ts`) is
  excluded in `eslint.config.mjs`; without that, ESLint reports thousands of problems in
  bundled worker code.
- Build: `pnpm build` (Next) and `pnpm exec opennextjs-cloudflare build` (worker)
- Local runtime: `pnpm exec wrangler dev` serves the built worker on `workerd`

Until T3 lands there is no runner, so tasks before it are verified by build and typecheck only.

## Tasks

- [x] **T1 — Scaffold.** Next.js 16.3.5, React 19.2.8, Tailwind 4, TypeScript strict plus
      `noUncheckedIndexedAccess`, via pnpm. Scaffolded into a temp subdirectory and moved up,
      because `create-next-app` refuses a directory holding files it does not recognise; the
      generated `.gitignore` was merged into the existing one rather than replacing it.
      *Observed:* `pnpm typecheck` exit 0, `pnpm build` exit 0, `pnpm lint` exit 0.
- [x] **T2 — Cloudflare target.** `@opennextjs/cloudflare` 1.20.6 and `wrangler` 4.133.0;
      `wrangler.jsonc`, `open-next.config.ts` and `initOpenNextCloudflareForDev()` in place.
      **Live at <https://lol-tft-challenges.lol-tft-challenges.workers.dev>**
      *Observed:* `opennextjs-cloudflare build` exit 0 producing `.open-next/worker.js`; the
      worker served `GET / 200 OK` under local `workerd`; after the owner ran `wrangler login`,
      `pnpm run deploy` exit 0 and the deployed URL returned **200, 11908 bytes** — byte-identical
      to what local `workerd` served. Worker startup 33 ms.
      *Note:* the deploy printed "You need to register a workers.dev subdomain before publishing
      to workers.dev", but the URL resolves and serves correctly. Harmless so far; worth a second
      look if the URL ever stops resolving.
      *Gotcha:* use `pnpm run deploy`, not `pnpm deploy` — the latter is pnpm's own workspace
      deploy command and will not run this script.
- [x] **T3 — Test harness.** Vitest 5.0.1 in `vitest.config.mts`, node environment, specs matched
      at `src/**/*.test.ts`, `@/*` resolved through `resolve.tsconfigPaths`. Scripts `pnpm test`
      and `pnpm test:watch`.
      *Instead of a throwaway placeholder*, the RED was proven against `src/domain/game.ts` —
      the `Game` discriminant, which T4 needs anyway. That also proved the `@/` alias resolves
      under Vitest, which a self-contained placeholder could not.
      *Observed RED twice:* first a missing-module failure before `game.ts` existed, then, after
      the config was rewritten, a deliberate assertion failure reporting
      `expected [ 'lol' ] to include 'deliberate-failure'` at `game.test.ts:7` with exit 1.
      *Observed GREEN:* 3 passed, exit 0; `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0.
      *Dropped:* `vite-tsconfig-paths`, which Vite now supersedes with native
      `resolve.tsconfigPaths`. `@types/node` bumped 20 → 22 to satisfy Vitest 5's peer range and
      to match the actual Node 22.16.0 runtime.
- [x] **T4 — Domain types.** `LolMatchSummary` (champion, role, queue, win, duration, played-at)
      behind a `MatchSummary` alias that widens to a union in v2; `Role` and `Queue` with their
      guards; `Criterion`, `Rule` and `qualifies` in `src/domain/rule.ts`. Zero Riot imports.
      *Design corrected during this task.* The plan said four `Rule` variants — `WinCount`,
      `ChampionPlayed`, `RolePlayed`, `QueueType` — each with its own target. That model cannot
      express the motivating example: "win 10 ranked games as Jungle" is one goal with three
      simultaneous conditions, and as separate rules it would be satisfied by thirty unrelated
      games. The four variants became `Criterion` values and the count moved up to the `Rule`,
      which holds a `target` and a list of criteria that a match must satisfy in full. An empty
      criteria list expresses "play N games".
      *Also landed here:* `src/domain/match.fixture.ts`, an `aMatch()` builder that T5 reuses.
      *Observed RED:* both suites failed on missing modules before implementation.
      *Observed GREEN:* 22 passed, exit 0; `pnpm typecheck`, `pnpm lint`, `pnpm build` exit 0.
      *Why keep a discriminant with one variant:* TFT is scheduled, not speculative. The field
      costs one literal now and makes v2 additive — a new union member plus new rules — instead
      of revisiting every consumer. Rules declare the game they apply to for the same reason.
      *Check:* Vitest RED then GREEN; typecheck passes.
- [x] **T5 — Progress evaluation.** `evaluate(rules, matches, window)` in `src/domain/progress.ts`,
      returning `ChallengeProgress` with one `RuleProgress` per rule. Pure: no clock, no network,
      no storage — every input that affects the answer is an argument.
      *Three decisions the plan did not settle:*
      1. The challenge window is a parameter of `evaluate`, not something the caller pre-filters.
         Forgetting to filter is a silent wrong-answer bug, so the domain owns it. Both bounds
         inclusive.
      2. Matches shorter than `MINIMUM_COUNTED_DURATION_SECONDS` (300) do not count. Without
         this, "play 20 games" is farmable by remaking twenty times. LoL permits a remake at
         three minutes; five gives margin. **Open to change — see open decisions.**
      3. `current` is not clamped to `target`. 12/10 is honest; the UI can clamp a bar, the
         domain should not discard the fact.
      *Also added:* deduplication by `matchId`, because `match_cache` is shared across
      overlapping challenges and double-counting would complete a challenge early.
      *Observed RED:* suite failed on the missing module, exit 1.
      *Observed GREEN:* 36 passed, exit 0; `pnpm typecheck`, `pnpm lint`, `pnpm build` exit 0.
- [ ] **T6 — MatchProvider port + Riot adapter.** Port defined by the domain; `RiotApiAdapter`
      implements it, reading `X-App-Rate-Limit` and `X-Method-Rate-Limit` off responses and
      honouring `Retry-After` on 429. Correct platform vs regional routing per endpoint:
      `account-v1` and `match-v5` are regional, `summoner-v4` and `league-v4` are platform.
      *Check:* Vitest against recorded fixtures; no live calls in tests.
- [ ] **T7 — Persistence.** D1 schema and Drizzle migrations for `users`, `riot_accounts`,
      `challenges`, `participants`, `progress`, `match_cache`, `poll_state`.
      *Check:* migrations apply to a local D1; typecheck passes.
- [ ] **T8 — Repository adapter.** `ChallengeRepository` port + `DrizzleD1Adapter`.
      *Check:* Vitest RED then GREEN against local D1.
- [ ] **T9 — Auth.** Auth.js with Discord provider, session wired through the App Router.
      *Check:* sign-in and sign-out work against the deployed preview.
- [ ] **T10 — Riot ID linking.** Resolve `gameName#tagLine` to a PUUID via account-v1 and store
      it, labelled unverified in the UI.
      *Check:* Vitest RED then GREEN on the resolver; manual check of the linking flow.
- [ ] **T11 — Polling pipeline.** Cron trigger enqueues one Queue message per player due for
      polling; the consumer fetches only matches newer than `poll_state.last_match_id` and updates
      progress. Never loop players inline in the cron handler.
      *Check:* Vitest on the due-player selector and the incremental fetch; observed queue drain
      in a deployed preview.
- [ ] **T12 — Challenge UI.** Create, browse, join and view a challenge. Playwright covers the
      create-then-join flow.
      *Check:* `pnpm test:e2e` passes.
- [x] **T13 — Legal pages.** *Pulled forward from after T12, because the Riot production key
      review needs a live site with these pages and that review takes one to three weeks.*
      `/terms` and `/privacy`, a `SiteFooter` carrying the Riot disclaimer and both links on every
      page, and `src/lib/legal.ts` holding the disclaimer text and operator details.
      *Slightly beyond the task as written:* the landing page replaced the create-next-app
      template. Riot's review requires the site to show what the product does, which the template
      did not. It is not the real product UI — that is still T12.
      *Observed RED:* `legal.test.ts` failed on the missing module, exit 1.
      *Observed GREEN:* 41 passed, exit 0; typecheck, lint, build exit 0.
      *Verified in production* after deploy: `/` 200, `/terms` 200, `/privacy` 200; the Riot
      disclaimer string present on all three; `href="/terms"` and `href="/privacy"` present in the
      footer.
      **Not launch-ready.** `unresolvedPlaceholders()` still reports `name`, `contactEmail` and
      `jurisdiction`. They render as visible "TO BE COMPLETED" text on the live pages, deliberately,
      so nobody mistakes the pages for finished. Riot will reject the application while they stand.
      **Not legal advice.** Written to be honest about what the service actually collects and does,
      not reviewed by a lawyer.
- [ ] **T14 — Launch prep.** Buy the domain, point it at the Worker, apply for the Riot production
      key.
      *Check:* Riot ownership-verification string served from the live domain.

## Acceptance criteria

- A user signs in with Discord, links a Riot ID, creates a challenge and shares its URL
- A second user opens that URL, joins, and both see progress update automatically after playing
- Progress is correct for LoL challenges across win-count, champion, role and queue rules
- Polling stays inside the personal key's rate limit during private beta
- Monthly cost stays at or under 19 MXN

## Open decisions

- [x] **LoL and TFT together, or LoL first?** Answered 2026-09-16: **LoL only in v1.** TFT
      deferred to v2. Scope, T4, T5 and T6 revised accordingly.
- [ ] Launch regions. LAN and LAS are the likely first targets; each carries its own rate-limit
      budget. Asked, unanswered. Blocks nothing before T6.
- [ ] Should remakes and early surrenders count towards a challenge? T5 currently excludes
      anything under 5 minutes, to stop "play 20 games" being farmed by remaking. Assumed, not
      confirmed — change `MINIMUM_COUNTED_DURATION_SECONDS` if you disagree.
- [ ] Personal goals only, or group competitions with a shared leaderboard?
- [ ] Monetization intent — changes what Riot requires at registration.
- [ ] UI language: Spanish, English, or both.

## Progress

Started 2026-09-16. Repository on `main`.

- **T1 complete.** Next.js 16.3.5 scaffold in place; typecheck, build and lint all pass.
  Committed as `b4b4122`.
- **T2 complete.** Deployed and live at
  <https://lol-tft-challenges.lol-tft-challenges.workers.dev>, returning 200.
- **T3 complete.** Vitest harness running; RED observed twice and GREEN at 3 passing specs. The
  first domain module, `src/domain/game.ts`, is in place.
- **T4 complete.** Match and rule types landed, 22 specs passing. The rule model was corrected
  mid-task: criteria combine inside one rule instead of being separate rules. This changes the
  shape stored in `challenges.rules_json` at T7.
- **T5 complete.** `evaluate` landed, 36 specs passing. The domain layer is now finished and
  fully tested without a Riot key, a database or a network — which was the point of building it
  first.
- **T13 complete (pulled forward).** Legal pages live and verified in production, 41 specs
  passing. Operator placeholders still unfilled, so the Riot production key application cannot
  be submitted yet.

**Blocked, needing the owner:**

1. Create `.env.local` (gitignored, never committed) holding `RIOT_API_KEY`, `RIOT_REGION` and
   `RIOT_PLATFORM`. The agent cannot write `.env*` files — a permission rule blocks it, which is
   the correct guard. **A key was pasted into chat on 2026-09-16 and must be regenerated.**
2. Fill in `OPERATOR` in `src/lib/legal.ts`: operator name, contact email, jurisdiction. Riot
   rejects a production key application while these read "TO BE COMPLETED".
3. Re-authenticate the `claude` CLI. The native review lineage `review-15df7d00d361b982` is open
   at state `reviewing` for the T1 candidate; its reviewer subprocess fails with a 401 on an
   invalid OAuth token, so no receipt exists. That candidate is now several commits stale, so
   starting a fresh review is better than resuming it. Blocks nothing.

**Unblocked 2026-09-16:** `wrangler login` done, T2 deployed and serving.

**Timing note:** the Riot **production** key — the one that takes one to three weeks — requires a
live site with Terms of Service and Privacy Policy. The site is now live, so finishing T13 is
what actually starts that clock. Consider pulling T13 forward ahead of T9–T12.

**Scope narrowed 2026-09-16:** League of Legends only for v1; TFT deferred to v2. No completed
work was invalidated — T1 and T2 are game-agnostic infrastructure.

**Next step:** T6 — `MatchProvider` port and `RiotApiAdapter`, RED first against recorded
fixtures. Needs `.env.local` in place first; the key never enters source, tests or commits.
