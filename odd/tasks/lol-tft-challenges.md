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
- [x] **T6 — MatchProvider port + Riot adapter.** Port defined by the domain; `RiotApiAdapter`
      implements it, reading `X-App-Rate-Limit` and `X-Method-Rate-Limit` off responses and
      honouring `Retry-After` on 429. Correct platform vs regional routing per endpoint:
      `account-v1` and `match-v5` are regional, `summoner-v4` and `league-v4` are platform.
      *Check:* Vitest against recorded fixtures; no live calls in tests.
      **Complete.** `rate-limit.ts` (header parsing, tightest-bucket headroom, `Retry-After`),
      `match-mapper.ts` (Riot payload → `MatchSummary`), `src/domain/ports/match-provider.ts`
      (the port, stated in the domain's terms) and `riot-api.ts` (`createRiotApi`, the HTTP
      client). 74 specs passing; typecheck, lint and build exit 0.
      *Verified against the live API once*, via a throwaway file outside the suite, then deleted:
      real `resolvePuuid`, `listMatchIds`, `fetchMatch` mapping, and a 404 for an unknown Riot ID.
      The committed suite makes no live calls.
      *Contract narrowed mid-task.* `fetch` was first typed as `typeof globalThis.fetch`, which
      typechecked only against the platform's full overloaded signature — no honest test double
      could satisfy it, and the suite only passed because of a cast. Replaced with `HttpFetch` and
      `HttpResponse`, declaring the four things this client actually reads. The real `fetch` still
      satisfies it structurally, and the cast is gone.
      *Retry policy:* only 429 is retried, bounded by `maxRetries` (default 3). A 404 means the
      Riot ID does not exist and a 403 means the key is bad; retrying either just burns budget.
      Errors report status and nothing else, so the key can never reach a log line.

      *Recorded from live calls against `ThothMon#LAN` on 2026-09-16, all 200:*
      - Real headers are `x-app-rate-limit: 100:120,20:1` and, for match-v5,
        `x-method-rate-limit: 2000:10` — **not** the 500:10 in the documentation found earlier.
        Reading limits off responses rather than hardcoding them was the right call, and the
        bucket order is reversed from what was assumed, so buckets must be matched by window.
      - **`lane` and `role` are unreliable legacy fields.** In the recorded match the tracked
        participant is `teamPosition: "TOP"` and `lane: "JUNGLE"` simultaneously. The mapper reads
        `teamPosition`; a spec pins this so nobody "fixes" it later.
      - PUUIDs are now 78 characters, not the older 36.
      - `gameEndedInEarlySurrender` exists and is a more precise remake signal than duration.
        Not used yet — T5's duration floor already covers remakes. See open decisions.
      - Fixture at `src/adapters/riot/__fixtures__/match-ranked-solo.json`, trimmed to two
        participants with PUUIDs replaced by obvious fakes; verified the real PUUID does not
        appear anywhere in the repo.
- [x] **T7 — Persistence.** Drizzle schema in `src/db/schema.ts` for all seven tables, plus
      `src/domain/rule-codec.ts` validating `rules_json` with Zod on the way in and out.
      D1 database `lol-tft-challenges` created (id `e9451396-09aa-4393-a2b3-f8247664ca7d`,
      region WNAM) and bound as `DB`; `cloudflare-env.d.ts` now types it as `D1Database`.
      *Observed RED:* the codec suite failed on the missing module, exit 1.
      *Observed GREEN:* 83 passed, exit 0; typecheck, lint, build exit 0.
      *Migration applied and verified twice:* `--local` then `--remote`, 16 commands each, and
      all seven tables confirmed present by querying `sqlite_master` on both.
      *`rules_json` stores the corrected T4 shape* — a target plus a criteria list — not the four
      rule variants the original plan described. Validated rather than trusted: a text column
      accepts anything, and an unrecognised criterion dropped in silence would leave a rule with
      fewer conditions, quietly making every match count.
      *Schema decisions:* `riot_accounts.puuid` is unique table-wide, so the same Riot account
      cannot be claimed by two users; `verified` is false everywhere and exists so RSO needs no
      migration; `match_cache` is keyed by match AND player, because one game yields a different
      summary per participant; `poll_state.nextPollAfter` exists so idle players can be backed off
      rather than polled at the same cadence as someone mid-session.
      *Scripts:* `pnpm db:generate`, `pnpm db:migrate:local`, `pnpm db:migrate`.
- [x] **T8 — Repository adapter.** `ChallengeRepository` port in `src/domain/ports/` and
      `createChallengeRepository` in `src/adapters/db/`. Rules cross the boundary as `Rule[]`,
      never as JSON — serialisation stays the adapter's problem.
      *Observed RED:* suite failed on the missing module, exit 1.
      *Observed GREEN:* 96 passed, exit 0; typecheck, lint, build exit 0.
      *Tested against SQLite in memory*, applying the same `drizzle/0000_initial_schema.sql` that
      D1 runs, rather than against D1 itself. D1 is SQLite so the SQL under test is the SQL that
      ships; what this does not cover is driver-level behaviour. Stated rather than glossed over.
      *The adapter is typed by what it uses* — `BaseSQLiteDatabase<"async", unknown, typeof
      schema>` — not pinned to `DrizzleD1Database`. Pinning would have forced the tests to cast,
      and a cast in a test is a lie about what the code accepts. Same lesson as `HttpFetch` in T6.
      *A type-level assertion pins the production path:* a real D1 Drizzle instance must satisfy
      `ChallengeDb`, checked by `tsc`. Verified the assertion actually bites by breaking its
      schema generic on purpose — typecheck failed — then restoring it. An assertion that cannot
      fail is worse than none.
      *Behaviour pinned by specs:* joining twice is a no-op rather than an error or a duplicate
      row; `saveProgress` upserts so repeated polls overwrite instead of accumulating; and
      `listActiveAt` treats both window bounds as inclusive, matching `evaluate` — if storage
      disagreed, a challenge would stop being polled on the day it ends.
- [ ] **T9 — Auth.** Auth.js with Discord provider, session wired through the App Router.
      *Check:* sign-in and sign-out work against the deployed preview.
      *Plan (2026-09-18):* JWT session strategy, **no Auth.js adapter**. `users` is already
      custom and keyed by `discordId`; Auth.js's four tables would duplicate it. On sign-in a
      `UserRepository` port upserts the Discord identity and the internal `users.id` rides in
      the token. Sub-steps: (a) `UserRepository` port + Drizzle adapter, tested on in-memory
      SQLite like T8; (b) pure auth callbacks in `src/auth/callbacks.ts`, tested; (c) `auth.ts`
      lazy config reading the D1 binding via `getCloudflareContext`, `trustHost: true`, route
      handler at `app/api/auth/[...nextauth]`; (d) sign-in/sign-out UI on the landing page;
      (e) `.dev.vars.example` and `.env.example` documenting `AUTH_SECRET`, `AUTH_DISCORD_ID`,
      `AUTH_DISCORD_SECRET`. No `proxy.ts` — nothing needs route protection yet.
      **Code complete, manual check pending** (2026-09-18). All five sub-steps landed on
      `feat/discord-auth`; `next-auth` pinned to `5.0.0-beta.32`.
      *Observed RED:* both new suites failed on missing modules, exit 1.
      *Observed GREEN:* 108 passed, exit 0; typecheck, lint, `next build` and the worker build
      all exit 0. `/` and `/api/auth/[...nextauth]` are now dynamic routes; `/terms` and
      `/privacy` stay static.
      *Gotcha caught by `tsc`:* in the `jwt` callback `user` is the provider's transformed
      profile (`{ id, name, email, image }`) and `profile` is the raw OAuth payload. The
      callbacks validate the transformed shape with Zod, so the avatar URL derivation stays in
      the provider and is not duplicated here.
      *Independent read-only verification* (RDD off-path, tier high) checked every assumption
      against the installed library source: lazy config is per-request; the default `redirect`
      callback is same-origin only, so `signIn`/`signOut` cannot open-redirect; server-action
      forms get Next's Origin check; the JWT is signed, so `session.user.id` cannot be forged;
      the upsert is one atomic `INSERT ... ON CONFLICT DO UPDATE` on the `discord_id` unique
      index, so a concurrent double sign-in cannot duplicate a user. Two corrections to the
      brief: a missing `AUTH_SECRET` does not throw, Auth.js logs and answers 500; and the three
      auth variables are Worker secrets, not `vars`, so `wrangler types` does not type them.
      *Not written:* `.env.example`. A permission rule blocks every `.env*` path, including the
      example. `.dev.vars.example` carries the same three variable names.
      *Native review:* consent granted, lineage `review-9ab2c78768cd9863` open at `reviewing`;
      all four lens captures failed with the same 401 as on 2026-09-16 (stale `claude` CLI OAuth
      token). Not retried; see blockers.
- [ ] **T10 — Riot ID linking.** Resolve `gameName#tagLine` to a PUUID via account-v1 and store
      it, labelled unverified in the UI.
      *Check:* Vitest RED then GREEN on the resolver; manual check of the linking flow.
      *Plan (2026-09-18), stacked on `feat/discord-auth` because it needs `session.user.id`:*
      (a) `src/domain/riot-id.ts` — `parseRiotId` with Riot's rules (game name 3–16 chars, tag
      line 3–5 alphanumerics), plus a typed `Platform` list and `regionForPlatform`, which the
      codebase lacks today (platform and region are loose strings). (b) `RiotAccountRepository`
      port and Drizzle adapter, mirroring `UserRepository`: `link`, `listByUser`, `findByPuuid`,
      `unlink`. (c) `src/application/link-riot-account.ts` — the use case, returning a typed
      result (`linked`, `already_linked`, `invalid_riot_id`, `invalid_platform`, `not_found`,
      `claimed_by_other_user`, `riot_unavailable`) rather than throwing, so the UI never
      guesses. (d) `MatchProviderError` carrying `status`, declared on the `MatchProvider` port
      and thrown by the Riot adapter, so 404 is distinguishable without parsing a message and
      without application code importing an adapter. (e) `src/lib/riot.ts`
      building a `MatchProvider` per routing region from `RIOT_API_KEY`. (f) `/account` page:
      linked accounts with an "Unverified" badge, link form, unlink. All platforms offered,
      LAN default; the launch-regions decision stays open and only trims a list later.
      **Code complete, manual check pending** (2026-09-18), on `feat/riot-id-linking` stacked
      on `feat/discord-auth`.
      *Observed RED:* every new suite failed on its missing module first, exit 1.
      *Observed GREEN:* 163 passed, exit 0; typecheck, lint, `next build` and the worker build
      exit 0. No import from `src/adapters` anywhere under `src/application` or `src/domain`.
      *Reviewed natively three times, all approved and acknowledged* (lineages
      `review-249b12d261e3b7d8`, `review-61d05f19a56b9fdf`, `review-fb978371b013677e`). The
      first two rounds' advisory findings drove two correction passes, all covered by specs:
      - `link` was check-then-insert; a concurrent duplicate would have thrown the unique
        constraint unhandled. Now `INSERT ... ON CONFLICT DO NOTHING` then one read, so the
        database is the arbiter and the three outcomes come from a single row.
      - **SEA platforms were routed to `sea` for account-v1, which only accepts `americas`,
        `asia` and `europe`.** `accountRegionForPlatform` sends them to `asia`;
        `regionForPlatform` keeps `sea` for match-v5 and the stored row.
      - `matchProviderFor` ran outside the `try`, so a missing `RIOT_API_KEY` escaped the typed
        result. Inside now, and the interactive path uses `maxRetries: 0` so a 429 surfaces at
        once instead of sleeping out `Retry-After` inside a server action.
      - `region` is derived from `platform` on write and asserted on read; re-linking refreshes
        a renamed Riot ID; `listByUser` breaks `createdAt` ties by `id`; the game-name length
        counts code points, not UTF-16 units.
      *Moved on purpose:* the status-carrying error is `MatchProviderError` on the
      `MatchProvider` port, not an adapter export. The first draft had the use case importing
      from `src/adapters`, which inverts the dependency the ports exist to prevent.
      *Accepted as-is:* one corrupt `riot_accounts` row fails the whole `/account` page
      (a guard, not a path users hit); the Next server actions have no unit specs.
      *Left from the third round, all informational, for a later polish pass:* trim each side
      of the `#` in `parseRiotId`, not only the whole input; export the length and tag-line
      constants so the form messages cannot drift from the domain; say "updated" rather than
      "already linked" when a re-link refreshed the stored identity; make the in-memory fake
      repository apply the same refresh so use-case specs can catch a regression; drop the
      unsourced "Riot's own client splits on the last `#`" from a comment; and `link` still
      throws if the conflicting row is unlinked between its insert and its read, a window the
      server action does not catch.
      *Owner decisions raised by the review:* Riot ID squatting and per-user throttling, both
      under open decisions.
      *Manual check* needs `RIOT_API_KEY` and the Discord secrets on the Worker.
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
      T6 found that Riot also sends `gameEndedInEarlySurrender`, which identifies a remake exactly
      rather than by proxy. Worth adopting if this rule stays, but it means adding a field to
      `MatchSummary` and a condition to `evaluate`.
- [ ] **Riot ID squatting before verification.** Raised by the T10 review (finding R1-001).
      Linking is first-come and exclusive across the whole table, and ownership is not checked
      until RSO exists. Any signed-in user can claim someone else's Riot ID, and the real owner
      then gets `claimed_by_other_user` with no way to reclaim it. Options: keep links
      non-exclusive until verified, or add a reclaim flow. Matters before challenge progress
      depends on these rows (T11), not before.
- [ ] **Per-user throttle on Riot ID linking.** Raised by the T10 review (finding R1-002).
      Every link submission spends one account-v1 call from the shared key, with no per-user
      limit, so a signed-in user can burn the app's rate-limit budget with invented Riot IDs.
      Cheap to add with KV once the polling pipeline (T11) also needs budget accounting.
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
- **T6 complete.** Riot adapter done, 74 specs passing, and verified once against the live API.
  Three things were learned from real responses that documentation had wrong — see the task.
- **T7 complete.** Schema and migrations applied to both local and remote D1, 83 specs passing.
- **T8 complete.** Challenge repository behind a port, 96 specs passing. Merged to `main`
  through PR #1 on 2026-09-18.
- **T9 code complete, committed as `7800236` on `feat/discord-auth`, PR #2 open.** 108 specs
  passing, all builds green, independently verified with no findings. The manual sign-in check
  waits on Discord credentials only the owner can create.
- **T10 code complete, uncommitted on `feat/riot-id-linking` (stacked on `feat/discord-auth`).**
  163 specs passing, all builds green, three native reviews approved and acknowledged. The
  manual linking check waits on `RIOT_API_KEY` and the Discord secrets on the Worker.

**Blocked, needing the owner:**

0. **For T9's manual check:** create a Discord application in the Developer Portal with
   redirect URIs `https://lol-tft-challenges.lol-tft-challenges.workers.dev/api/auth/callback/discord`
   and `http://localhost:3000/api/auth/callback/discord`; generate `AUTH_SECRET`
   (`openssl rand -base64 33`); set `AUTH_SECRET`, `AUTH_DISCORD_ID` and `AUTH_DISCORD_SECRET`
   on the Worker with `wrangler secret put <NAME>` and locally in `.dev.vars` (gitignored).

1. Create `.env.local` (gitignored, never committed) holding `RIOT_API_KEY`, `RIOT_REGION` and
   `RIOT_PLATFORM`. The agent cannot write `.env*` files — a permission rule blocks it, which is
   the correct guard. **A key was pasted into chat on 2026-09-16 and must be regenerated.**
2. Fill in `OPERATOR` in `src/lib/legal.ts`: operator name, contact email, jurisdiction. Riot
   rejects a production key application while these read "TO BE COMPLETED".
3. Re-authenticate the `claude` CLI at `~/.local/bin/claude` (2.1.114) with `claude login`.
   `claude auth status` reports logged in, but the reviewer subprocess Gentle AI spawns gets
   `401 OAuth access token is invalid`, so the cached token is stale. This blocked the T1 review
   on 2026-09-16 and the T9 review on 2026-09-18. T9's lineage `review-9ab2c78768cd9863` is
   open at `reviewing`; after re-login, re-query its bound status and re-run the reoffered
   captures. The T1 lineage is stale and not worth resuming. Blocks nothing for delivery.

**Unblocked 2026-09-16:** `wrangler login` done, T2 deployed and serving.

**Timing note:** the Riot **production** key — the one that takes one to three weeks — requires a
live site with Terms of Service and Privacy Policy. The site is now live, so finishing T13 is
what actually starts that clock. Consider pulling T13 forward ahead of T9–T12.

**Scope narrowed 2026-09-16:** League of Legends only for v1; TFT deferred to v2. No completed
work was invalidated — T1 and T2 are game-agnostic infrastructure.

**Next step:** commit T10 on `feat/riot-id-linking` and open its PR against
`feat/discord-auth`. Once the owner sets the three Discord secrets and `RIOT_API_KEY` on the
Worker, deploy and run the manual checks for T9 (sign-in/out) and T10 (link a Riot ID), then
tick both. After that, T11 — the polling pipeline — which also needs the two open decisions
raised by the T10 review (squatting, per-user throttle) settled before it depends on
`riot_accounts` rows.
