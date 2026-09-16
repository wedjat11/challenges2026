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
- [ ] **T2 — Cloudflare target.** *Partial: configured and verified locally, deploy blocked.*
      `@opennextjs/cloudflare` 1.20.6 and `wrangler` 4.133.0 installed; `wrangler.jsonc`,
      `open-next.config.ts` and `initOpenNextCloudflareForDev()` in place.
      *Observed:* `opennextjs-cloudflare build` exit 0 producing `.open-next/worker.js`; the
      worker served `GET / 200 OK` under local `workerd`; `pnpm typecheck`, `pnpm lint` and
      `pnpm build` all exit 0.
      *Blocked:* `wrangler whoami` reports not authenticated. Deploying needs an interactive
      `wrangler login` OAuth flow, which is the repository owner's to run.
      *Remaining check:* deployed `workers.dev` URL returns 200.
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
- [ ] **T4 — Domain types.** `MatchSummary` with a `game: 'lol'` discriminant and the LoL fields
      (champion, role, queue, win, duration, played-at). `Rule` variants `WinCount`,
      `ChampionPlayed`, `RolePlayed` and `QueueType`. Zero Riot imports in this layer.
      *Already landed in T3:* `src/domain/game.ts` with `Game`, `SUPPORTED_GAMES` and
      `isSupportedGame`, plus its specs.
      *Why keep a discriminant with one variant:* TFT is scheduled, not speculative. The field
      costs one literal now and makes v2 additive — a new union member plus new rules — instead
      of revisiting every consumer. Rules declare the game they apply to for the same reason.
      *Check:* Vitest RED then GREEN; typecheck passes.
- [ ] **T5 — Progress evaluation.** Pure `evaluate(rules, matches)` returning per-rule progress
      and completion.
      *Check:* Vitest RED then GREEN, including edge cases (empty match list, matches outside
      the challenge window, a rule whose target is already exceeded, remakes and very short
      games).
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
- [ ] **T13 — Legal pages.** Terms of Service, Privacy Policy, and the mandatory Riot disclaimer
      in the footer.
      *Check:* pages reachable and linked from the footer.
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
- [ ] Personal goals only, or group competitions with a shared leaderboard?
- [ ] Monetization intent — changes what Riot requires at registration.
- [ ] UI language: Spanish, English, or both.

## Progress

Started 2026-09-16. Repository on `main`.

- **T1 complete.** Next.js 16.3.5 scaffold in place; typecheck, build and lint all pass.
  Committed as `b4b4122`.
- **T2 partial.** Cloudflare target configured and proven locally — the OpenNext build produces
  a worker that serves 200 under `workerd`. The deploy step is blocked on an interactive
  `wrangler login`, which only the repository owner can run.
- **T3 complete.** Vitest harness running; RED observed twice and GREEN at 3 passing specs. The
  first domain module, `src/domain/game.ts`, is in place.

**Blocked, needing the owner:**

1. `wrangler login`, to finish T2's deploy.
2. Re-authenticate the `claude` CLI. The native review lineage `review-15df7d00d361b982` is open
   at state `reviewing` for the T1 candidate; its reviewer subprocess fails with a 401 on an
   invalid OAuth token, so no receipt exists. This does not block T3.

**Scope narrowed 2026-09-16:** League of Legends only for v1; TFT deferred to v2. No completed
work was invalidated — T1 and T2 are game-agnostic infrastructure.

**Next step:** T4 — `MatchSummary` and the four `Rule` variants, RED first.
