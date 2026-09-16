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

**In scope for v1**

- Create, share and join challenges for LoL and TFT
- Automatic progress tracking from match history
- Discord sign-in; link one or more Riot IDs to an account
- Public challenge pages shareable by URL

**Out of scope for v1**

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
- Typecheck: `pnpm typecheck` — runs `next typegen && tsc --noEmit`. The typegen step is not
  optional: Next 16 generates `LayoutProps` and friends into `.next/types`, so a bare `tsc
  --noEmit` fails on a clean checkout.
- Lint: `pnpm lint`
- Build: `pnpm build`

Until T3 lands there is no runner, so tasks before it are verified by build and typecheck only.

## Tasks

- [x] **T1 — Scaffold.** Next.js 16.3.5, React 19.2.8, Tailwind 4, TypeScript strict plus
      `noUncheckedIndexedAccess`, via pnpm. Scaffolded into a temp subdirectory and moved up,
      because `create-next-app` refuses a directory holding files it does not recognise; the
      generated `.gitignore` was merged into the existing one rather than replacing it.
      *Observed:* `pnpm typecheck` exit 0, `pnpm build` exit 0, `pnpm lint` exit 0.
- [ ] **T2 — Cloudflare target.** Add `@opennextjs/cloudflare` and `wrangler.jsonc`. Deploy the
      empty app to a `workers.dev` subdomain.
      *Check:* deployed URL returns 200.
- [ ] **T3 — Test harness.** Vitest configured for the domain layer. One failing placeholder test
      to prove RED is observable.
      *Check:* `pnpm test` runs and reports the expected failure, then passes once implemented.
- [ ] **T4 — Domain types.** `MatchSummary` as a discriminated union on `game: 'lol' | 'tft'`,
      plus `Rule` variants (`WinCount`, `ChampionPlayed`, `PlacementUnder`, `QueueType`). Zero
      Riot imports in this layer.
      *Check:* Vitest RED then GREEN; typecheck passes.
- [ ] **T5 — Progress evaluation.** Pure `evaluate(rules, matches)` returning per-rule progress
      and completion. Covers both games.
      *Check:* Vitest RED then GREEN, including edge cases (empty match list, rule targeting the
      other game, matches outside the challenge window).
- [ ] **T6 — MatchProvider port + Riot adapter.** Port defined by the domain; `RiotApiAdapter`
      implements it, reading `X-App-Rate-Limit` and `X-Method-Rate-Limit` off responses and
      honouring `Retry-After` on 429. Correct platform vs regional routing per endpoint.
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
- Progress is correct for both LoL and TFT challenges
- Polling stays inside the personal key's rate limit during private beta
- Monthly cost stays at or under 19 MXN

## Open decisions

- [ ] Launch regions. LAN and LAS are the likely first targets; each carries its own rate-limit
      budget. Asked, unanswered.
- [ ] LoL and TFT together in v1, or LoL first? Asked via a comment on the decision document,
      unanswered. T4 and T5 are written to support both either way, so this does not block them.
- [ ] Personal goals only, or group competitions with a shared leaderboard?
- [ ] Monetization intent — changes what Riot requires at registration.
- [ ] UI language: Spanish, English, or both.

## Progress

Started 2026-09-16. Repository on `main`.

- **T1 complete.** Next.js 16.3.5 scaffold in place; typecheck, build and lint all pass.

**Next step:** T2 — add `@opennextjs/cloudflare` and `wrangler.jsonc`, deploy to `workers.dev`.
