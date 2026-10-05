# Proposal: Email Magic-Link Sign-In (replacing Discord OAuth)

Change: `email-magic-link-auth` · Store: hybrid (this file + Engram topic `sdd/email-magic-link-auth/proposal`, project `challenges2026`) · Written 2026-10-03 · Input: `openspec/changes/email-magic-link-auth/exploration.md` (Engram #109)

## Intent

Sign-in is the one blocked path in the whole product. Nothing is deployed with working auth because the only provider is Discord OAuth, and the owner blockers list has carried "Discord OAuth secrets" unchanged since 2026-09-16 (Engram #27, #54, #100). Every feature behind a session — `/account`, `/challenges/new`, join, the polling loop's owner scoping — is built, tested and unreachable in production.

The owner has decided to remove Discord as the sign-in method and replace it with a passwordless email magic link. That removes a third-party OAuth application, its two secrets, its developer-portal registration and its redirect-URI configuration from the critical path, and replaces them with one HTTP API key and a verified sender domain. Riot Sign On stays gated, so email is the identity of record; a user still links their Riot account afterwards exactly as today (`/account`, `riot_accounts` keyed by `users.id`).

This is a cold swap, not a migration: `users.discord_id` has zero production rows (nothing has ever been deployed with real auth), so the identity column can be replaced outright rather than dual-written.

Success looks like: the owner can set two environment values, open `/login`, type an email, receive a link, click it, land signed in at `/account`, and link a Riot ID — on Cloudflare Workers, with no SMTP, no OAuth application, and no change to any of the eight existing `session.user.id` consumers.

## Scope

### In Scope

1. **Identity model swap.** `users` keyed by a normalised lowercase `email` (unique) with `email_verified`; `discord_id` dropped; `display_name` derived from the email local part; `avatar_url` kept nullable and always null.
2. **`verification_tokens` table** (Auth.js's minimal shape) plus its port and D1 adapter.
3. **A minimal custom Auth.js `Adapter`** over the project's hexagonal ports — exploration Option B — implementing exactly the six methods the email + JWT path actually calls, with a unit test that asserts all six exist.
4. **Resend email provider** wired into `src/auth.ts` (`AUTH_RESEND_KEY` auto-wiring, `EMAIL_FROM` project convention), with a project-owned `sendVerificationRequest` so the email copy, subject and sender are ours rather than Auth.js's defaults.
5. **`/login` as an email form**, a dedicated `/login/check-email` "check your inbox" route (`pages.verifyRequest`), and reworked `messageForAuthError` cases covering `EmailSignInError`, `Verification`, a merged `Configuration`, and a provider-neutral `AccessDenied`/generic.
6. **Per-email send throttling** at the single choke point Auth.js calls for every entry path, so the unauthenticated send-link endpoint cannot be used to spam inboxes or burn the Resend quota.
7. **Removal of every Discord reference** from code, copy, tests, env examples, legal pages and `openspec/config.yaml`'s context block.
8. **Test coverage**: pure-helper unit tests, adapter contract tests, D1-adapter tests over `createTestDb()`, static-render tests for the login states, updated e2e seed/fixture, plus a written manual verification plan.

### Out of Scope

- **Riot Sign On** — still gated by Riot; `riot_accounts.verified` stays `false` for every row.
- **Email + password**, social providers, account linking between two sign-in methods, or keeping Discord alongside email. One provider, one identity column.
- **The mockup's "05 Cuenta nueva" display-name step** (deferred — see Approach §5 and A5). No `pages.newUser`, no onboarding route.
- **A display-name rename surface** anywhere (`/account` gains no profile editor in this change).
- **Email change / account deletion / "sign in on another device" flows.**
- **Transactional email beyond the sign-in link** (no welcome email, no notifications).
- **Cloudflare WAF rate-limiting rules and Turnstile** (see A4 — neither is reachable today; `*.workers.dev` has no zone, so WAF rules cannot be attached).
- **Remote D1 migration and deployment** — still an owner action on the existing blocker list, unchanged by this change.
- **The five open follow-ups** in Engram #100 (RuleBuilder `onChange`-in-initializer, styled `not-found.tsx`, `GameTag` queue labels, login F1–F4, progress-table cascading FKs).

## Capabilities

### New Capabilities

- `email-authentication`: passwordless email sign-in — email normalisation and identity, magic-link issue/consume semantics and TTL, the enumeration-neutral request response, per-email send throttling, session identity (`session.user.id`), display-name derivation at first sign-in, and the `/login` + `/login/check-email` + error-state surface. No auth capability spec exists today (Discord auth predates SDD), so this is the first.

### Modified Capabilities

- None. The four existing non-design specs (`challenge-authoring`, `challenge-discovery`, `challenge-participation`, `challenge-view`) phrase their auth requirements provider-agnostically ("an authenticated session", "a signed-in user") and never name Discord — verified by grep across `openspec/specs/`. `challenge-participation`'s e2e requirement (session-cookie injection only, no test-only provider) also still holds unchanged. `design-system` requirements apply to the new screens but are not themselves changing.

## Approach

Exploration's **Option B** — a minimal custom Auth.js `Adapter` composed over this project's hexagonal ports — over **Option A** (`@auth/d1-adapter`), whose four fixed, unprefixable tables collide by name with the existing `users` table and would route DB access around `UserRepository`, breaking the one convention every other feature in this codebase keeps.

### 1. Identity model and migration

`users` final shape:

| column | type | notes |
|---|---|---|
| `id` | `text` PK | unchanged; referenced by `riot_accounts`, `challenges` |
| `email` | `text` NOT NULL UNIQUE | normalised lowercase (NFKC, trimmed) — see below |
| `email_verified` | `integer` (`timestamp_ms`), nullable | set by `updateUser({id, emailVerified})` on every successful link consumption |
| `display_name` | `text` NOT NULL | derived from the email local part at first sign-in |
| `avatar_url` | `text`, nullable | kept; always `null` now (no provider supplies one) |
| `created_at` | `integer` (`timestamp_ms`) | unchanged |

**`discord_id` is dropped outright, not kept as a nullable legacy column** (exploration Q1). Rationale: there are zero production rows to preserve, nothing in the codebase would read it, a `NOT NULL UNIQUE` column cannot simply be relaxed in place in SQLite anyway, and a dead column that every future `INSERT` has to reason about is a worse cost than a second migration if Discord ever returns. The owner's decision removes Discord as *the* sign-in method, so there is no coexistence requirement to design for.

Because `discord_id` carries a `UNIQUE` index, SQLite cannot `ALTER TABLE ... DROP COLUMN` it. The migration is therefore drizzle-kit's standard SQLite **table recreate** (`PRAGMA foreign_keys=OFF` → `CREATE TABLE __new_users` → `INSERT INTO __new_users SELECT …` → `DROP TABLE users` → `RENAME` → `PRAGMA foreign_keys=ON`), generated by `pnpm drizzle-kit generate` rather than hand-written, and it must survive `createTestDb()`'s statement-by-statement replay (it splits on `--> statement-breakpoint`, which drizzle-kit emits).

Three migrations, numbered in the order the slices land so every slice leaves the tree green:

- `drizzle/0002_auth_email_tables.sql` — additive: `verification_tokens` + `auth_email_throttle`.
- `drizzle/0003_users_email_identity.sql` — the `users` recreate (adds `email`, `email_verified`; drops `discord_id`). The copy step carries no rows that matter; local `seed-*`/`e2e-*` rows are disposable and re-seeded.
- The exact filenames follow whatever `drizzle-kit generate` produces; the numbering and ordering above is the contract.

`verification_tokens` (Auth.js's documented minimal shape, `@auth/core/adapters.d.ts:224-241`):

| column | type | notes |
|---|---|---|
| `identifier` | `text` NOT NULL | the normalised email |
| `token` | `text` NOT NULL | **already hashed by Auth.js** before `createVerificationToken` is called (`createHash(token + secret)`); this project never sees or stores the raw token |
| `expires` | `integer` (`timestamp_ms`) NOT NULL | |

Composite primary key `(identifier, token)`, plus an index on `expires`. No `created_at` — the "when did we last actually send" question is answered by `auth_email_throttle`, not here, because a throttled request still creates a token row (see §6).

`auth_email_throttle`: `identifier` text PK, `last_sent_at` integer, `window_started_at` integer, `sent_in_window` integer. One fixed-size row per email address, so a flood does not grow the table.

**Email normalisation** lives in a pure `normalizeEmail` helper so the same rule applies to the repository, the throttle key and any future lookup. It mirrors what `@auth/core`'s `sendToken` already does to the identifier (NFKC normalize, trim, lowercase) so our stored value and Auth.js's `identifier` can never disagree — a mismatch there would make every link unredeemable.

### 2. Ports and the Auth.js adapter

`UserRepository` (`src/domain/ports/user-repository.ts`) loses `upsertFromDiscord` and `DiscordIdentity`, and gains:

```
findById(id): Promise<User | null>            // kept
findByEmail(email): Promise<User | null>
createFromEmail({ email, displayName }): Promise<User>
markEmailVerified(id, verifiedAt): Promise<User>
```

New port `VerificationTokenRepository` (`src/domain/ports/verification-token-repository.ts`):

```
create(token: VerificationToken): Promise<void>
consume({ identifier, token }): Promise<VerificationToken | null>   // single-use: deletes and returns, or null
```

`consume` deletes the row and returns it in one operation, because a magic link that can be redeemed twice is not a magic link. `create` also opportunistically deletes already-expired rows for the same identifier — bounded, cheap housekeeping that removes the need for a cron job. It does **not** delete live tokens for that identifier (A6).

The Auth.js adapter (`src/adapters/auth/auth-adapter.ts`) is a factory taking the two ports and returning a plain object. It performs no DB access of its own and imports nothing from `src/adapters/db`, so it is fully unit-testable with fake ports. It implements exactly the six methods exploration verified the email + JWT path reaches:

| Auth.js method | maps to |
|---|---|
| `createVerificationToken` | `tokens.create` |
| `useVerificationToken` | `tokens.consume` |
| `getUserByEmail` | `users.findByEmail(normalizeEmail(email))` |
| `createUser` | `users.createFromEmail({ email, displayName: displayNameFromEmail(email) })` |
| `updateUser` | `users.markEmailVerified(id, emailVerified)` |
| `getUser` | `users.findById` |

`createUser` **ignores the `id` Auth.js passes in** and lets the repository generate `crypto.randomUUID()`, keeping id generation in the one place that already owns it; the returned `id` is what Auth.js puts on the token, so it is the internal id either way. `updateUser` is only ever called with `{ id, emailVerified }` on this path; it maps that and ignores nothing silently — any other field present is a signal the Auth.js version changed, and the adapter should fail loudly rather than drop a write.

**Guard against the runtime-only requirement gap** (exploration's first risk): `assertConfig` statically checks only three of the six methods, so a missing `createUser`/`updateUser`/`getUser` surfaces as an opaque `TypeError` on the first real sign-in — and a missing *checked* method surfaces as a bare `500 JSON` from the `signin` POST, not the styled `/login` page. The mitigation is a unit test over the adapter object that asserts all six keys exist and are functions, driven by an exported `REQUIRED_ADAPTER_METHODS` tuple used by both the test and a doc comment citing the source files. A build-time test is the only place this can be caught, because Auth.js itself will not catch it until a human clicks a link.

### 3. Sessions

Unchanged: `session: { strategy: "jwt" }`. The adapter is present but no `sessions` table exists and none is needed — `createSession`/`getSessionAndUser`/`deleteSession` are only reached when the strategy is not `jwt`, and the strategy is set explicitly (Auth.js would otherwise default to `database` once an adapter is configured — this is a one-line footgun worth naming in the code comment).

What the token carries: Auth.js builds the email-callback token as `{ name, email, picture, sub: user.id }` where `user` is the **adapter** user — so **`token.sub` is the internal `users.id`**, not an external provider id (today it is the Discord snowflake). The `jwt` callback still calls `enrichToken(token, user.id)` so `token.userId` keeps existing, and `sessionFromToken` is untouched. `token.sub === token.userId` from now on; the duplication is kept deliberately so no consumer and no e2e fixture has to change its contract.

The `jwt` callback **stops touching the database**: the adapter has already created or found the user by the time it runs, so the `getAppDb()` + `upsertFromDiscord` round trip disappears. `discordIdentityFromProfile` and `discordProfileSchema` are deleted with it.

Consumer impact: zero. All eight session consumers key on `session.user.id` only (exploration §Other session consumers). The e2e fixture changes one line (`sub: user.discordId` → `sub: user.id`) and its `SessionUser` type drops `discordId`.

### 4. Login UX

**Main state** (`/login`): the existing `LoginPanel` shell (wordmark, badge, three-line headline, subtitle, legal line) with the single Discord button replaced by an `Input type="email" name="email" label="Email" required` (uncontrolled, per the primitive's D9 contract — `type` passes straight through to the native input) plus the hidden `from` field and a primary CTA **"Email me a sign-in link"**. The note line becomes **"No password. We email you a link that signs you in."**

**Check-inbox state**: a dedicated route `src/app/login/check-email/page.tsx`, wired as `pages: { verifyRequest: "/login/check-email" }` (exploration Q3). Decided over `/login?sent=1` because:

- Auth.js appends its own `?provider=resend&type=email` to whatever path is configured; a `/login` variant would have to branch on Auth.js's internal query shape, which is exactly the kind of coupling the `/login` helpers were factored to avoid.
- `/login`'s state machine stays two-way (form / error) instead of three-way, and the new page is a parameterless static render — the cheapest possible test.
- Auth.js does **not** put the email address in that redirect, so the page cannot echo "we sent it to x@y" anyway. Generic copy is forced, and it happens to be exactly what the enumeration-neutral requirement wants (§9, R-ENUM).

Copy: headline **"Check your inbox."**, body **"If that email can sign in here, a link is on its way. It expires in 15 minutes and works once."** — true for both a new and an existing address — plus a ghost "Back to sign in" link to `/login`.

**Error state**: `messageForAuthError` gains and reworks cases.

| code | title | body |
|---|---|---|
| `Verification` | That link no longer works. | This sign-in link has expired or was already used. Request a new one. |
| `EmailSignInError` | We couldn't send your sign-in link. | Something went wrong on our side before the email went out. Nothing changed on your account. Try again. |
| `Configuration` | We couldn't use that sign-in link. | The link was incomplete, or sign-in is temporarily misconfigured. Request a new link — if it keeps failing, that's on us, not on you. |
| `AccessDenied` | We can't sign you in with that email. | That address can't be used here. Nothing changed. |
| *(default)* | We couldn't sign you in. | Something went wrong while signing you in. Nothing changed on your account. Try again. |

The `Configuration` **merge** (not a split) is the honest resolution of exploration Q6: `@auth/core` throws the same `Configuration` kind for a genuinely missing adapter method *and* for a magic link opened with `token` stripped or mangled, and the handler has only the code to go on — there is no second signal to branch on that is not guesswork. One sentence that is true in both cases beats two confident sentences one of which is wrong. The old copy ("The server is missing its sign-in settings") was accurate for only one of them. See A3.

The error state's CTA stays the same form as the main state (an email field relabelled "Try again"), so the visitor can retry without a second navigation.

**Magic-link email.** The Resend provider's default `sendVerificationRequest` sends Auth.js-branded HTML with subject `Sign in to ${host}`; that is not shippable product copy. This change supplies its own, built from three pieces so the content is testable without network:

- `src/domain/auth/magic-link-email.ts` — pure `magicLinkEmail({ url, expiresInMinutes })` → `{ subject, text, html }`. Subject: **"Your sign-in link for Become a Legend"**. Both a plain-text and a minimal inline-styled HTML part (multipart improves deliverability and some clients strip HTML). Body names the 15-minute expiry, the single-use property, and "if you didn't ask for this, ignore it — nothing happened".
- `src/domain/ports/email-sender.ts` — `EmailSender { send({ to, from, subject, text, html }): Promise<void> }`.
- `src/adapters/email/resend-email-sender.ts` — the `fetch` to `https://api.resend.com/emails` (plain HTTP, no SMTP, Workers-compatible — verified in exploration).

`src/auth.ts` then configures `Resend({ from: process.env.EMAIL_FROM, maxAge: 15 * 60, sendVerificationRequest })`. `apiKey` is auto-wired from `AUTH_RESEND_KEY` by `setEnvDefaults` — the same mechanism `AUTH_DISCORD_ID` already relies on, so no new env plumbing (exploration verified this from source). `EMAIL_FROM` has no Auth.js auto-wiring and is read from `process.env` explicitly, matching the existing Discord pattern (so no `pnpm cf-typegen` change is needed).

**TTL: 15 minutes** (`maxAge: 15 * 60`), down from the provider's 24-hour default (exploration Q2). A link in an inbox is a bearer credential; 24 hours of validity for a credential that arrives in seconds buys nothing. 15 minutes is long enough to survive a slow mail relay and a "finish this on my phone" detour.

**Display name: derived, not asked** (exploration Q4). A pure `displayNameFromEmail(email)` takes the local part, trims, truncates to 20 characters (matching the mockup's own counter), and falls back to `"Player"` if nothing usable remains. The mockup's "05 Cuenta nueva" step is **deferred**, because: (a) the mockup state is built around an already-connected Riot account displaying `DiegoR#LAN` with a "Connected" badge — at first email sign-in no Riot account exists yet, so adopting it means removing its central element, not restyling it; (b) it would add a `pages.newUser` route, a redirect rule, a server action, a fourth login state and a mandatory step between "clicked the link" and "signed in", into a slice plan already at budget risk; (c) a derived name is never *wrong* in a way the user cannot fix once a rename surface exists — and the rename surface is the real missing feature, worth its own change (A5, follow-up F-NAME).

### 5. What is removed

| removed | locations |
|---|---|
| Discord provider + its import | `src/auth.ts:2,20` |
| `discordIdentityFromProfile`, `discordProfileSchema` | `src/auth/callbacks.ts:16-39`, `src/auth/callbacks.test.ts:5-44` |
| `upsertFromDiscord`, `DiscordIdentity` | `src/domain/ports/user-repository.ts`, `src/adapters/db/user-repository.ts`, `src/adapters/db/user-repository.test.ts` |
| `AUTH_DISCORD_ID`, `AUTH_DISCORD_SECRET` | `.dev.vars.example:7-11` (+ the owner's real `.dev.vars`/`.env.local`) |
| "Sign in with Discord" / "We use your Discord sign-in" | `src/app/login/login-panel.tsx:74,77`, `src/app/hero.tsx:43`, `src/app/hero.test.tsx:27`, `src/app/login/login-panel.test.tsx:25,35,82,86` |
| Discord in legal copy | `src/app/terms/page.tsx:27`, `src/app/privacy/page.tsx:23,24,67,94` — **not flagged in exploration; found during this pass.** Privacy must now describe what we actually collect (an email address) and that Resend is the processor that receives it |
| Discord comments | `src/components/auth-status.tsx:9,12,42`, `src/app/login/return-path.test.ts:8`, `src/db/schema.ts:14`, `src/auth.ts:10` |
| `discord_id` in test seeds | `src/adapters/db/{riot-account,challenge,polling,user}-repository.test.ts` (11 insert sites), `e2e/fixtures/seed.sql:24-26`, `e2e/create-then-join.spec.ts:25-26`, `e2e/fixtures/session.ts:20,26` |
| "Auth.js (Discord, JWT sessions)" | `openspec/config.yaml:6-7` context block — **not flagged in exploration** |

`AuthStatus`'s avatar `<img>` branch stays (the field still exists on the session type and is simply always absent now); the eslint-disable comment's justification changes from "external Discord avatar" to a general external-URL note. Removing the branch outright is a separate cleanup, not this change's business.

### 6. Abuse protection for the send-link endpoint

The problem is structural: `POST /api/auth/signin/resend` must be reachable by an unauthenticated stranger — that is what a magic link *is* — and it causes an email to be sent to an attacker-chosen address at our cost. There is no rate limiting anywhere in this codebase to copy from (exploration confirmed no `src/middleware.ts`).

Options considered:

| option | reach | cost | verdict |
|---|---|---|---|
| **(a) Cloudflare rate-limiting rule** on the endpoint path | before the Worker even runs; strongest per-IP bound | zero code, zero D1 ops | **Not available today.** WAF/rate-limiting rules attach to a *zone*; the deployment is `lol-tft-challenges.workers.dev`, which has none. Requires the owner to buy and attach a custom domain first. Also dashboard-configured, so unversioned and untestable in CI |
| **(b) D1-backed per-email throttle** inside `sendVerificationRequest` | every entry path (the Server Function *and* a direct POST to the Auth.js endpoint), because this is the one function Auth.js calls to actually send | 1 read + 1 write per request, one fixed-size row per address | **Recommended** |
| **(c) Turnstile** on the login form | strongest against bots | a client component, a second secret, a verify round trip, and a form that no longer works with JS disabled | overkill at friends scale; a good *addition* if abuse ever materialises |

**Recommendation: (b).** It is versioned, unit-testable, works on `workers.dev` today, needs no new infrastructure, and bounds the Resend spend *per address*, which is the quota that actually gets burned. Critically, it must sit in `sendVerificationRequest` rather than in the login Server Function: a throttle in the action is bypassed by POSTing the Auth.js endpoint directly. Returning from `sendVerificationRequest` without sending (and without throwing) leaves Auth.js's behaviour identical — it still writes the token and still redirects to the check-inbox page — which is exactly the enumeration-neutral response the flow needs.

Shape: a pure policy `allowSend(state, now, policy)` → `{ allowed, nextState }` in `src/domain/auth/send-throttle.ts`, a `EmailThrottleRepository` port, a D1 adapter over `auth_email_throttle`. Policy defaults: **at most one link per address per 60 seconds, and at most 5 per address per rolling hour** (A4 — numbers are the owner's to change).

Two residual gaps, stated rather than hidden: a throttled request still writes a `verification_tokens` row (tiny, and the rows self-clean on the next `create` for that identifier), and a per-*address* throttle does not bound an attacker cycling through thousands of distinct addresses. The hard ceiling for that second case is Resend's own free-tier cap (100 emails/day), which fails closed — unpleasant but not expensive. Closing it properly needs (a), which needs a custom domain. Recorded as risk R6 and follow-up F-WAF.

### 7. Testing strategy

Strict TDD throughout (observed RED before implementation, per `openspec/config.yaml` `rules.apply.tdd`). Vitest, node environment, no DOM.

**Pure unit tests** (no DB, no framework):
- `normalizeEmail` — case folding, trimming, NFKC, and that it agrees with what `@auth/core`'s `sendToken` does to the identifier (the one invariant that, if broken, makes every link unredeemable).
- `displayNameFromEmail` — local part extraction, 20-char truncation, the empty/degenerate fallback.
- `magicLinkEmail` — subject, that both `text` and `html` contain the URL exactly once, and that the expiry is stated.
- `allowSend` — inside cooldown, outside cooldown, window rollover, hourly cap reached, first-ever send.
- `messageForAuthError` — one case per row of the table in §4, plus the unknown-code default.

**Adapter contract test** (fake ports, no DB): the six-method existence assertion driven by `REQUIRED_ADAPTER_METHODS`, plus per-method mapping tests (`getUserByEmail` normalises its argument; `createUser` ignores the incoming id and derives the display name; `updateUser` maps `emailVerified`).

**D1 adapter tests** over `createTestDb()` (in-memory SQLite replaying `drizzle/*.sql` — so they also prove the migrations replay cleanly, including the table recreate):
- `VerificationTokenRepository`: create → consume round trip; consume twice returns `null` the second time (single use); consume with a wrong token/identifier returns `null`; an expired row is still returned by `consume` (Auth.js owns the expiry comparison) **and** is reaped by the next `create` for that identifier.
- `UserRepository`: `createFromEmail` then `findByEmail`/`findById`; the unique-email constraint; `markEmailVerified` sets the timestamp and preserves `id`/`created_at` (the two values `riot_accounts.user_id` depends on).
- `EmailThrottleRepository`: read-modify-write of one row.

**Static-render tests** (`renderToStaticMarkup`, the established pattern) for the three login surfaces: the email-form state (field present with `type="email"`, `name="email"`, `required`; hidden `from` present/absent; CTA label), the error state (one row per error code's title), and `/login/check-email`.

**E2E**: mechanism unchanged — the Playwright fixture keeps minting the session cookie directly, which `challenge-participation`'s spec requires and which never touches `signIn()`, so the provider swap does not affect it. Only the fixture's token payload (`sub: user.id`), the `SessionUser` type, and `seed.sql` change. **No e2e coverage of the real magic-link round trip**: it needs a live inbox, and the spec explicitly forbids a test-only auth bypass route (A14). That path is covered by the manual plan instead.

**Local development**: with `AUTH_RESEND_KEY` set to a real Resend test key, links arrive in a real inbox; Resend's free tier allows sending to the account owner's own verified address without a domain, which is enough to exercise the full flow locally. A dev-only `console.log` of the URL is **rejected** — it would have to live in shipped production code where a misconfiguration could print a bearer credential to Cloudflare's log stream (risk R5). Instead, when `AUTH_RESEND_KEY` is absent the adapter throws a loud, named configuration error at send time, which surfaces as `EmailSignInError` on `/login` rather than silently appearing to work.

**Manual verification plan** (owner, with a real key — the part no automated test can cover):
1. New address → `/login` → submit → check-inbox page renders → email arrives → subject and copy correct → click → signed in, landed on `/account`, `users` has one row with the derived display name and `email_verified` set.
2. Same address again → signs in to the *same* `users.id` (no duplicate row), `email_verified` refreshed.
3. Click the same link twice → second click shows the `Verification` copy.
4. Wait out the TTL → expired link shows the `Verification` copy.
5. Submit twice inside 60s → the check-inbox page both times, exactly one email.
6. Unregistered address → the check-inbox page, identical to the registered case (R-ENUM).
7. `?from=/challenges/new` survives the round trip; a hostile `from` (`//evil.com`) does not.
8. Link an existing Riot ID after signing in; confirm the existing `/account` flow is untouched.

### 8. Delivery slices

Chained PRs onto the existing `feature-branch-chain` (branch `feat/email-magic-link-auth`, based on chain tip `feat/public-landing-gated-nav`; the chain is `#2 → #38`). 400-line budget per slice. **Strict-TDD slices in this repo have measured 2–3.5× their forecast** (Engram #101, three owner-accepted `size:exception`s), so the forecast column below is the *budget risk after* applying that factor, not the raw line estimate.

Ordering rule: every slice must leave `pnpm test && pnpm typecheck && pnpm lint && pnpm build` green. That forces the pure and additive work ahead of the schema swap, because the moment `discord_id` goes, `src/auth.ts` and six test files must already be ready.

| slice | content | budget risk |
|---|---|---|
| **S0** | Pure helpers only: `normalizeEmail`, `displayNameFromEmail`, `magicLinkEmail`, reworked `messageForAuthError` + all their tests. Nothing wired. | Low |
| **S1** | `drizzle/0002_auth_email_tables.sql` (`verification_tokens`, `auth_email_throttle`) + `VerificationTokenRepository` and `EmailThrottleRepository` ports + D1 adapters + `createTestDb()` tests. Purely additive; nothing references them yet. | Medium |
| **S2** | `allowSend` policy (pure) + `EmailSender` port + `resend-email-sender` adapter + tests. Still unwired. | Low–Medium |
| **S3a** | `src/adapters/auth/auth-adapter.ts` + `REQUIRED_ADAPTER_METHODS` + the six-method contract test and mapping tests, over fake ports. No DB, no `src/auth.ts` change. | Medium |
| **S3b** | The atomic one: `drizzle/0003_users_email_identity.sql` + `src/db/schema.ts` + `UserRepository` rewrite + the 11 `discordId` test-seed sites + `src/auth.ts` swap (Resend provider, adapter, `verifyRequest`, simplified `jwt` callback) + deletion of `discordIdentityFromProfile`. Cannot be split further without a red tree. | **High** — expect a `size:exception` request |
| **S4** | `/login` email form state + `/login/check-email` route + `page.tsx`/`actions.ts` rewiring + static-render tests. | Medium–High |
| **S5** | Throttle wiring into `sendVerificationRequest` + its integration test. | Low–Medium |
| **S6** | Discord copy removal: `hero`, `terms`, `privacy` (rewritten for email + Resend as processor), comments, `.dev.vars.example`, `openspec/config.yaml` context + affected tests. | Medium |
| **S7** | `e2e/fixtures/{session.ts,seed.sql}`, `e2e/create-then-join.spec.ts`, plus the manual verification plan recorded in the change folder. | Low |

`sdd-tasks` owns the final forecast and the `Decision needed before apply` / `Chained PRs recommended` / `400-line budget risk` guard lines; this table is the proposal's input to that, not a substitute for it.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `src/auth.ts` | Modified | Discord → Resend provider; `adapter` added; `pages.verifyRequest`; `jwt` callback no longer touches D1 |
| `src/auth/callbacks.ts` (+ test) | Modified | `discordIdentityFromProfile`/`discordProfileSchema` deleted; `enrichToken`/`sessionFromToken` unchanged |
| `src/db/schema.ts` | Modified | `users` keyed by `email`; `verification_tokens`, `auth_email_throttle` added |
| `drizzle/0002_*.sql`, `drizzle/0003_*.sql` | New | Additive auth tables, then the `users` table recreate |
| `src/domain/ports/user-repository.ts` | Modified | `DiscordIdentity`/`upsertFromDiscord` out; email methods in |
| `src/domain/ports/verification-token-repository.ts`, `email-sender.ts`, `email-throttle-repository.ts` | New | Three new ports |
| `src/domain/auth/{magic-link-email,send-throttle,email-identity}.ts` | New | Pure email copy builder, throttle policy, `normalizeEmail`/`displayNameFromEmail` |
| `src/adapters/db/user-repository.ts` (+ test) | Modified | Rewritten around email |
| `src/adapters/db/{verification-token,email-throttle}-repository.ts` (+ tests) | New | D1 adapters |
| `src/adapters/auth/auth-adapter.ts` (+ test) | New | The six-method Auth.js adapter over ports |
| `src/adapters/email/resend-email-sender.ts` (+ test) | New | HTTP send; throws a named error when unconfigured |
| `src/app/login/{page,actions,login-panel,auth-error}.tsx\|ts` (+ tests) | Modified | Email form, new action, new/reworded error copy |
| `src/app/login/check-email/page.tsx` (+ test) | New | `pages.verifyRequest` target |
| `src/app/{hero.tsx,terms/page.tsx,privacy/page.tsx}` (+ tests) | Modified | Discord copy removed; privacy rewritten for email + Resend |
| `src/components/auth-status.tsx` | Modified | Comments only (plus the eslint-disable justification) |
| `src/adapters/db/{riot-account,challenge,polling}-repository.test.ts` | Modified | Test seeds lose `discordId`, gain `email` |
| `e2e/fixtures/{session.ts,seed.sql}`, `e2e/create-then-join.spec.ts` | Modified | `sub: user.id`; `SessionUser` drops `discordId`; seed uses emails |
| `.dev.vars.example` | Modified | `AUTH_DISCORD_*` out; `AUTH_RESEND_KEY`, `EMAIL_FROM` in |
| `openspec/config.yaml` | Modified | Context block: "Auth.js (Discord, JWT sessions)" → email magic link |
| `src/app/account/*`, `src/app/challenges/**`, `src/components/site-header.tsx`, `src/app/page.tsx` | Unchanged | Every one keys on `session.user.id` only; verified in exploration |

## Risks

| # | Risk | Likelihood | Mitigation |
|---|---|---|---|
| R1 | **Bare-500 misconfiguration path.** A missing adapter method makes the `signin` POST return raw `500 JSON`, bypassing `pages.error` entirely — the visitor sees a broken Server Function, not the styled error page | Med | The `REQUIRED_ADAPTER_METHODS` contract test (§2) catches it at build time, which is the only place it *can* be caught. Documented in the adapter's doc comment with the `@auth/core` source lines |
| R2 | **Runtime-only method gap**: `createUser`/`updateUser`/`getUser` are unchecked by `assertConfig`, so a gap is a `TypeError` on the first real click | Med | Same contract test; plus manual plan steps 1–2 exercise all three on a real round trip |
| R3 | **Email deliverability.** Sign-in is now entirely dependent on an email arriving. An unverified sender domain, a spam-filtered message or a Resend outage means nobody can sign in at all | Med-High | Owner prerequisite P2 (verified sender/domain) is non-negotiable; both plain-text and HTML parts; project-owned subject/copy rather than Auth.js's `no-reply@authjs.dev` default (which Resend rejects for an unverified domain); 15-min TTL keeps a late-arriving link from being a silent failure mode. Residual: a single point of failure with no fallback sign-in method, by the owner's design decision |
| R4 | **Token leakage in logs.** The magic link is a bearer credential; printing it anywhere (dev convenience log, error message, Cloudflare observability) hands over an account | Low-Med | No dev-only URL logging in shipped code (§7, decided against); the adapter throws a named error *without* the URL in its message; `observability.enabled` is already on, so nothing may log the `url` argument of `sendVerificationRequest` |
| R5 | **Enumeration of registered emails.** If the response differs for a known vs. unknown address, the endpoint becomes an account-existence oracle | Med | Requirement R-ENUM: the flow MUST respond identically — same redirect, same page, same copy — for new, existing and throttled addresses. Auth.js already helps here (it fabricates a throwaway user for unknown addresses, and does not put the address in the verify-request redirect); the throttle returns without throwing for the same reason. Covered by manual step 6 and asserted at the use-case level |
| R6 | **Unauthenticated send endpoint abuse** across many distinct addresses — the per-address throttle does not bound it, and WAF rate limiting is unavailable without a zone | Med | Per-address throttle (§6) bounds the common case; Resend's free-tier daily cap is the hard, fail-closed ceiling; F-WAF once a custom domain exists. Explicitly an accepted residual at friends scale (A4) |
| R7 | **Open redirect via `redirectTo`.** Already mitigated — `safeReturnPath` validates `from` in the Server Function, and `signIn("resend", { email, redirectTo })` routes `redirectTo` into `callbackUrl` exactly as the Discord flow does | Low | Keep the existing `safeReturnPath` re-validation in the new action (it is re-validated server-side, not trusted from the hidden field); the existing `return-path.test.ts` cases carry over unchanged |
| R8 | **SQLite table recreate.** Dropping and renaming `users` can break `riot_accounts`/`challenges` foreign-key references if the migration is hand-rolled or replayed out of order | Med | Generate the migration with `drizzle-kit`, never by hand; `createTestDb()` replays every `drizzle/*.sql` in order, so the full adapter suite (which seeds users → riot accounts → challenges → participants) is itself the regression test for FK integrity after the recreate |
| R9 | **`Configuration` code is ambiguous** between a server misconfiguration and a mangled link, and no second signal distinguishes them | Low | One merged message that is true in both cases (§4, A3). Accepted as a copy compromise, not an engineering one |
| R10 | **S3b exceeds the 400-line budget** and cannot be split without a red tree | High | Declared up front here so `sdd-tasks` forecasts it and the owner decides `size:exception` *before* apply, not during review |
| R11 | **Local `.dev.vars` churn.** The owner's real `.dev.vars`/`.env.local` still hold the empty `AUTH_DISCORD_*` keys; a stale file plus the new code means a confusing `EmailSignInError` | Low | `.dev.vars.example` is updated in S6 and the prerequisites below name the exact two keys to add and two to delete |

## Rollback Plan

Per slice, the chain makes rollback cheap: every slice is its own PR targeting the previous branch, so reverting is `git revert` of one merge commit, in reverse slice order.

- **Before S3b** (S0–S3a): every slice is purely additive — new pure modules, new tables, new unreferenced adapters. Reverting any of them touches nothing the running app reads. The two new tables can be left in place harmlessly or dropped with a follow-up migration.
- **S3b and later** (the identity swap): rollback is the full revert of S3b onward, *plus* a new forward migration recreating `users` with `discord_id` — D1 migrations are forward-only (`wrangler d1 migrations apply`), so there is no `down`. This is cheap today precisely because there are zero production rows: the recreate carries no data either direction. **It stops being cheap the moment a real user signs in with an email.** That is the point of no return, and it lands with S3b.
- **If email delivery itself turns out unworkable** (R3) after S3b, the fastest forward path is not a revert but a second provider on the same adapter (e.g. a different HTTP email API behind the same `EmailSender` port) — the port boundary exists so that swap is one adapter file, not an auth rewrite.
- **Nothing is deployed** until the owner applies the remote D1 migration, so until then rollback is purely a local/branch operation with zero user impact.

## Dependencies

**Owner prerequisites** (blocking — the flow cannot be verified end-to-end without them):

- **P1 — `AUTH_RESEND_KEY`**: a Resend API key (free tier: 100 emails/day, 3,000/month). Goes in `.dev.vars`/`.env.local` locally and `wrangler secret put AUTH_RESEND_KEY` for the deployed worker.
- **P2 — `EMAIL_FROM`**: a verified sender. Either a verified domain in Resend (required for sending to *anyone*) or, for local development only, the account owner's own verified address. Resend will reject Auth.js's `no-reply@authjs.dev` default outright.
- **P3 — remote D1 migration** (already on the standing blocker list): `wrangler d1 migrations apply` against the remote database for `0002`/`0003`.
- **P4 — delete** `AUTH_DISCORD_ID`/`AUTH_DISCORD_SECRET` from the real `.dev.vars`/`.env.local` (and from Discord's developer portal, if an application was ever registered).
- `AUTH_SECRET` is already set and unchanged. `RIOT_API_KEY` remains a separate, unrelated blocker.

**Technical dependencies**: `next-auth@5.0.0-beta.32` / `@auth/core@0.41.3` already installed; `next-auth/providers/resend` already present — **no new npm dependency is added by this change**. Not `@auth/d1-adapter` (rejected, Option A).

**Not a dependency**: a custom domain. It is only needed for the optional WAF hardening follow-up (F-WAF), not for the flow.

## Assumptions

The owner can veto any of these; each is a product or policy call, not a technical constraint.

- **A1 — `discord_id` is dropped, not retained as nullable.** Zero production rows; a dead unique column costs every future insert and migration a paragraph of explanation. If Discord might genuinely return as a *second* provider, say so now — that changes the adapter (it would also need `getUserByAccount`/`linkAccount` and an `accounts` table) and this proposal with it.
- **A2 — `pages.verifyRequest` is a dedicated `/login/check-email` route**, not a third `/login` state keyed on Auth.js's `?provider=&type=` query.
- **A3 — one merged `Configuration` message** covering both the misconfigured-server and the mangled-link case, rather than two messages one of which is sometimes wrong.
- **A4 — per-address throttling only**, at 1 send/60s and 5 sends/hour, with Resend's daily cap as the hard ceiling. No Turnstile, no WAF rule, no per-IP limit in this change. Numbers are tunable; the *shape* is the assumption.
- **A5 — no display-name step at first sign-in.** `display_name` is derived from the email local part (≤20 chars, `"Player"` fallback) and is not user-editable anywhere until a separate profile-rename change ships.
- **A6 — requesting a second link does not invalidate the first.** Both stay valid until their own 15-minute expiry. The alternative (newest-link-only) is arguably more secure but breaks the common "I clicked the first email after all" case.
- **A7 — 15-minute link TTL**, single use.
- **A8 — `avatar_url` stays in the schema** as a nullable column that nothing writes, rather than being dropped and re-added when avatars become real.
- **A9 — `token.sub` becoming the internal user id** (it is the Discord snowflake today) is an acceptable, invisible change, because every consumer and the e2e fixture read `token.userId` / `session.user.id` instead.
- **A10 — no e2e coverage of the real magic-link round trip.** It needs a live inbox, and `challenge-participation` forbids a test-only sign-in bypass (A14). The manual plan in §7 is the substitute.
- **A11 — the privacy and terms pages are rewritten** as part of this change (email as the collected identifier, Resend as a processor). Leaving them naming Discord would make them factually false.

## Success Criteria

- [ ] A visitor can submit an email at `/login`, receive a link, open it, and land signed in — end to end, on a real Resend key (manual plan §7, steps 1–8 all pass).
- [ ] A second sign-in with the same address reuses the same `users.id` and `created_at`; linked `riot_accounts` rows survive.
- [ ] A consumed link, an expired link, and a link with a stripped `token` each render their own styled copy on `/login` — never a bare 500, never "Discord didn't complete the sign-in".
- [ ] The response to a sign-in request is byte-identical for a registered address, an unregistered address and a throttled address (R-ENUM).
- [ ] Two submissions for the same address inside 60 seconds produce exactly one email.
- [ ] `rg -i discord src/ e2e/ openspec/config.yaml .dev.vars.example` returns nothing.
- [ ] The adapter contract test fails if any of the six required Auth.js methods is removed.
- [ ] `pnpm test` green (537+ existing unit tests still passing, plus the new suites), `pnpm typecheck && pnpm lint && pnpm build` green, both Playwright projects (mobile 390 / desktop 1280) green.
- [ ] `/login` and `/login/check-email` honour the `design-system` requirements: 390px primary with a single ~1200px desktop restatement, dark-only, token utilities only, visible focus ring on the email field, and the `Input` error state used for field-level errors.
- [ ] `?from=` survives the full round trip; a hostile `from` is dropped.
- [ ] No magic-link URL appears in any log, error message, or shipped `console` call.
- [ ] Every slice S0–S7 lands as its own PR in the chain with a green verification table, and S3b's size is an owner decision taken before apply, not during review.

## Follow-Ups (not this change)

- **F-NAME** — a profile surface where a user can set their display name (the deferred "05 Cuenta nueva" content, done properly, once there is somewhere to edit it from).
- **F-WAF** — a Cloudflare rate-limiting rule on the sign-in endpoint, once a custom domain gives the deployment a zone.
- **F-AVATAR** — either real avatars or the removal of the now-dead `avatar_url` column and `AuthStatus`'s image branch.
- The five standing follow-ups in Engram #100 remain untouched.
