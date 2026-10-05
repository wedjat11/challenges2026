# Tasks: Email Magic-Link Sign-In (replacing Discord OAuth)

Change: `email-magic-link-auth` · Store: hybrid (this file + Engram topic `sdd/email-magic-link-auth/tasks`, project `challenges2026`) · Source of truth: `design.md` (D1–D23, Slice Map, File Changes, Testing Strategy, Threat Matrix), `specs/email-authentication/spec.md` (23 requirements), `proposal.md` (A1–A11, §8).

Every checklist item is `- [ ] <slice>.<n> <action>`, naming the exact file(s) it creates or modifies, strict-TDD RED/GREEN pairing where applicable, and the `email-authentication: <Requirement Name>` it satisfies. `src/auth.ts`, `page.tsx`, and `actions.ts` files are thin roots that import `@/auth` and cannot be unit-tested under Vitest (per design.md §6/§Testing Strategy) — each such task names the manual or e2e check that covers it instead.

---

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | ~2000–2850 authored (design.md's own advisory forecast across 9 slices) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | S0 → S1 → S2 → S3b-i → S3a → S4 → S3b-ii → S6 → S7 (S0, S1 carry pre-planned contingent sub-splits; S3b-i carries a pre-authorised `size:exception`) |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High
```

`Decision needed before apply: No` because both decisions this guard normally forces are already closed: the chain strategy is cached (`feature-branch-chain`, session facts), and the one slice that cannot fit the 400-line budget (**S3b-i**) already carries a `size:exception` pre-authorised in design.md itself (§Budget reconciliation, quoted verbatim under S3b-i below) — the owner decided it in the design document, not during review.

**Empirical factor applied.** Strict-TDD slices in this repo with hand-written fakes or component tests have measured 2–3.5× their planning forecast (Engram #101: challenge-ui's S1 ~1,340 vs 300–450 forecast; S3a 746 vs 250–400; S4b 845 vs 170–240; by contrast its adapter-only S2 held at 340 vs 200–350). design.md's own Slice Map states its Est. column is "the budget risk *after* that factor, not the raw estimate" and its Budget Reconciliation table already classifies **S2, S3a, S4, S3b-ii, S6, S7 as under budget by median and upper bound** even accounting for it, and **S0, S1 at the line** (contingent split), with **S3b-i over budget and unsplittable**. This document carries design's splits forward unchanged and adds one lightweight guard per slice below: *measure `git diff --stat` against the slice's base branch before opening its PR*; if a slice that design classified safe is measured over 400 anyway, apply the one-honest-slicing-pass rule from the chained-pr skill along the seam named in that slice's note, or fall back to `size:exception` with the stated reason — never compress code or drop tests to fit.

### Branch Strategy

Tracker `feat/email-magic-link-auth` (draft, no-merge) is based on chain tip `feat/public-landing-gated-nav` (PR #38); only the tracker merges to main. Each slice branch `feat/email-magic-link-auth-<slice>` targets the previous slice's branch; the first slice (**S0**) targets `feat/public-landing-gated-nav` directly (session facts). Because each branch is cumulative, a slice's declared dependency is satisfied the moment that dependency appears anywhere earlier in this linear order, not only on its immediate parent branch.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| S0 | Pure identity and copy helpers | PR 1 | `pnpm test` (RED→GREEN) | N/A — nothing wired; unit tests only | Revert the 4 files + tests; nothing imports them yet |
| S1 | Auth tables, token/throttle ports and D1 adapters | PR 2 | `pnpm test` (RED→GREEN on `createTestDb()`) | N/A — additive; nothing references either table (the adapter test *is* the migration-replay harness) | Revert the 2 ports + 2 adapters + schema diff + migration; no existing caller touched |
| S2 | Throttle policy, Resend HTTP adapter, the send use case | PR 3 | `pnpm test` (RED→GREEN) | N/A — unwired; no network call in any test | Revert the 4 new files; unreferenced until S3b-ii |
| S3b-i | Identity schema swap — the atomic slice | PR 4 | `pnpm test` (RED→GREEN) | `pnpm db:migrate:local` then the full adapter suite (FK-integrity regression, R8) | Full revert + a new forward migration recreating `users` with `discord_id` — the point of no return once a real user signs in |
| S3a | Auth.js adapter | PR 5 | `pnpm test` (RED→GREEN); `pnpm typecheck` (the `satisfies` clause is part of the test) | N/A — unreferenced until S3b-ii, exactly like S1's tables | Revert the single adapter file + test |
| S4 | Login UX (`/login`, `/login/check-email`) | PR 6 | `pnpm test` (static-render) | Manual: `/login` and `/login/check-email` at 390px and ~1200px, keyboard focus ring, `?invalid=email` field error | Revert `login-panel.tsx`/`page.tsx`/`actions.ts`/`check-email/page.tsx` |
| S3b-ii | `src/auth.ts` swap — the slice that makes it work | PR 7 | `pnpm test`; `pnpm exec opennextjs-cloudflare build` | **Manual verification plan steps 1–8 on a real Resend key** | Revert `src/auth.ts` + `.dev.vars.example` — falls back to no working sign-in (pre-change state) |
| S6 | Discord copy and config removal | PR 8 | `pnpm test`; `rg -i discord src/ e2e/ openspec/config.yaml .dev.vars.example` | Manual: `/`, `/terms`, `/privacy` at both viewports | Revert hero/terms/privacy/auth-status/config.yaml/.gitignore copy |
| S7 | E2E fixtures + manual verification plan | PR 9 | `pnpm test:e2e` | `pnpm test:e2e` against `next dev`, both viewport projects | Revert `e2e/fixtures/*`, `e2e/create-then-join.spec.ts`; delete `manual-verification.md`; no production code to unwind |

### Ordering and parallelism (design.md's authoritative dependency graph)

```
S0 ─────────────────────────────┬──► S4 ───────────┐
                                │                  │
S1 ──► S2 ──────────────────────┤                  ├──► S3b-ii ──► S6
  └──► S3b-i ──► S3a ───────────┘                  │
            └──► S7 ────────────────────────────────
```

The linear chain order above (S0 → S1 → S2 → S3b-i → S3a → S4 → S3b-ii → S6 → S7) is a valid topological sort of this graph and is what `feature-branch-chain` requires.

---

## Phase S0: Pure identity and copy helpers

**PR title**: `feat: add email identity, magic-link copy, and reworked auth-error helpers`
**Branch**: `feat/email-magic-link-auth-s0`
**Depends on**: — (first slice; targets `feat/public-landing-gated-nav`)
**Est. changed lines**: 300–420 (median 360 — contingent split, see below)

- [x] 0.1 RED: `src/domain/email-identity.test.ts` — case folding, NFKC (fullwidth `＠` rejected after normalization), leading/trailing whitespace and NBSP, quote rejection, 0/2/3 `@`-parts, empty local, empty domain, `domain,second` comma-trim, non-string and empty input — email-authentication: Email as the Unique Account Identifier
- [x] 0.2 GREEN: create `src/domain/email-identity.ts` — `normalizeEmail(raw: unknown): string | null` mirroring `defaultNormalizer` by the cited case table (D17)
- [x] 0.3 RED: add to `src/domain/email-identity.test.ts` — `displayNameFromEmail`: ordinary local part, exactly-20, 21-char truncation, whitespace-only → `"Player"`, no plus-tag stripping — email-authentication: Display Name Derivation at First Sign-In
- [x] 0.4 GREEN: add `displayNameFromEmail`, `DISPLAY_NAME_MAX_LENGTH = 20`, `DISPLAY_NAME_FALLBACK = "Player"` to `src/domain/email-identity.ts` (D23)
- [x] 0.5 RED: `src/domain/magic-link-email.test.ts` — subject contains `siteName`; `text` contains the URL exactly once; `html` contains the **escaped** URL exactly once; unescaping the `href` yields the original URL; both parts state the expiry in minutes; neither contains "Discord" — email-authentication: Magic-Link Email Delivery Content and Channel, No Token Leakage in Logs
- [x] 0.6 GREEN: create `src/domain/magic-link-email.ts` — `magicLinkEmail({ url, expiresInMinutes, siteName })` per D16's exact subject/text/html content, HTML-escaped `href`
- [x] 0.7 RED: add to `src/app/login/auth-error.test.ts` — one case per D20 row (`Verification`, `Configuration`, `AccessDenied`, `EmailSignInError`, default) plus an unknown code → the generic fallback; no returned string contains "Discord" — email-authentication: Login Error State Copy, Mangled Link and Server Misconfiguration Share One Message, Expired or Already-Used Link Messaging
- [x] 0.8 GREEN: rewrite `messageForAuthError` in `src/app/login/auth-error.ts` per D20's table (the `Configuration` body says "temporarily unavailable", not "misconfigured")
- [x] 0.9 RED: add to `src/app/login/return-path.test.ts` — `invalidEmailLoginPath`: safe `from` carried; unsafe `from` ("//evil.com", backslash, absolute URL, non-string) dropped; absent `from` emits no `from` parameter — email-authentication: Return Path Honoured Through safeReturnPath
- [x] 0.10 GREEN: add `invalidEmailLoginPath(from: unknown): string` to `src/app/login/return-path.ts`, re-running `safeReturnPath(from, "")` (D18); `safeReturnPath"/"withReturnPath` and all existing cases stay unchanged
- [x] 0.11 Verify: `pnpm test` (0.1/0.3/0.5/0.7/0.9 all GREEN); `pnpm typecheck && pnpm lint && pnpm build`. Nothing is wired yet, so no rendered page changes.

**Contingent split — measure before opening the PR.** After 0.6, run `git diff --stat` against `feat/public-landing-gated-nav`. If the total exceeds 400 authored lines, split before continuing:
- **S0a** (`feat/email-magic-link-auth-s0a`): `email-identity.ts`, `auth-error.ts`, `return-path.ts` + their 3 test files (tasks 0.1–0.4, 0.7–0.10). Est. 180–250.
- **S0b** (`feat/email-magic-link-auth-s0b`, based on S0a): `magic-link-email.ts` + test (tasks 0.5–0.6). Est. 120–170. Shares nothing with S0a and has no dependency on it.

---

## Phase S1: Auth tables, token and throttle ports and adapters

**PR title**: `feat: add verification-token and email-throttle tables, ports, and D1 adapters`
**Branch**: `feat/email-magic-link-auth-s1`
**Depends on**: — (independent of S0; sequenced here by the linear chain)
**Est. changed lines**: 280–400 (median 340 — contingent split, see below)
**Strict TDD — RED first** for every pair below.

- [ ] 1.1 Run `pnpm db:generate` to produce `drizzle/0002_auth_email_tables.sql` (`verification_tokens`, `auth_email_throttle`) — generated, unedited
- [ ] 1.2 Modify `src/db/schema.ts`: add `verificationTokens` and `authEmailThrottle` table definitions per the schema diff in design.md §1; `users` is untouched in this slice
- [ ] 1.3 Create `src/domain/ports/verification-token-repository.ts` — `VerificationToken` type, `create"/"consume` signatures — email-authentication: Magic-Link Token Single-Use and TTL, Concurrent Link Requests Do Not Invalidate Each Other
- [ ] 1.4 RED: `src/adapters/db/verification-token-repository.test.ts` over `createTestDb()` — create→consume round trip; consume twice → `null` the second time; wrong token or wrong identifier → `null`; an expired row is still returned by `consume` (Auth.js owns the comparison) **and** is reaped by the next `create` for that identifier; a live token for the same identifier survives that reap (A6)
- [ ] 1.5 GREEN: create `src/adapters/db/verification-token-repository.ts` — `DELETE … RETURNING` for `consume` (D6), insert-then-reap for `create` (D7)
- [ ] 1.6 Create `src/domain/ports/email-throttle-repository.ts` — `SendThrottleState` type, `find"/"save` signatures — email-authentication: Per-Address Send Throttling
- [ ] 1.7 RED: `src/adapters/db/email-throttle-repository.test.ts` over `createTestDb()` — `find` on unknown identifier → `null`; `save` then `find` round trip; `save` twice replaces rather than duplicating (single row per identifier)
- [ ] 1.8 GREEN: create `src/adapters/db/email-throttle-repository.ts` — one-row read / insert-or-replace
- [ ] 1.9 Verify: `pnpm test` (1.4/1.7 GREEN — also proves `0002` replays cleanly in `createTestDb()`); `pnpm typecheck && pnpm lint && pnpm build`. Purely additive; nothing references either table yet.

**Contingent split — measure before opening the PR.** After 1.5, run `git diff --stat` against S0's branch. If the total exceeds 400 authored lines, split before continuing:
- **S1a** (`feat/email-magic-link-auth-s1a`): `drizzle/0002_*.sql`, `schema.ts`, the verification-token port and adapter + test (tasks 1.1–1.5). Est. 170–240.
- **S1b** (`feat/email-magic-link-auth-s1b`, based on S1a): the throttle port and adapter + test (tasks 1.6–1.8). Est. 110–160. S1a must go first: the migration creates both tables, and S1b's adapter needs `auth_email_throttle` to exist in `createTestDb()`.

**Local note**: run `pnpm db:migrate:local` once this slice lands, so `0002` is applied to the local D1 before S3b-i's local migration run.

---

## Phase S2: Delivery, throttle policy, and the send use case

**PR title**: `feat: add send-throttle policy, Resend adapter, and the magic-link send use case`
**Branch**: `feat/email-magic-link-auth-s2`
**Depends on**: S0, S1
**Est. changed lines**: 260–380 (design.md classifies this under budget by median and upper bound after the empirical factor)
**Strict TDD — RED first** for every pair below.

- [ ] 2.1 RED: `src/domain/send-throttle.test.ts` — first-ever send; inside cooldown; exactly at the cooldown boundary; outside cooldown; cap reached; window rollover resets the count but keeps `lastSentAt`; rollover plus cooldown still refuses; backwards clock refuses; every path returns a `nextState` — email-authentication: Per-Address Send Throttling
- [ ] 2.2 GREEN: create `src/domain/send-throttle.ts` — `allowSend(state, now, policy)`, `DEFAULT_SEND_POLICY` (1/60s, 5/rolling hour) per D12/D13's ordered rules
- [ ] 2.3 Create `src/domain/ports/email-sender.ts` — `OutgoingEmail`, `EmailSender` types (no `from` on the message; moved to the adapter's constructor) — email-authentication: Magic-Link Email Delivery Content and Channel
- [ ] 2.4 RED: `src/adapters/email/resend-email-sender.test.ts` with an injected `HttpFetch` (no mocking library, no casts) — a 2xx response resolves; a non-2xx rejects with a message containing the status; the rejection message contains neither the URL, the recipient, nor the html/text body; an empty `apiKey` rejects with the named unconfigured error **without performing a request**; the request body carries `from`, `to`, `subject`, `text`, `html` — email-authentication: Magic-Link Email Delivery Content and Channel, No Token Leakage in Logs
- [ ] 2.5 GREEN: create `src/adapters/email/resend-email-sender.ts` — `createResendEmailSender({ apiKey, from })`, `fetch` to `https://api.resend.com/emails`, `EmailSenderNotConfiguredError` (D14)
- [ ] 2.6 RED: `src/application/request-magic-link.test.ts` with hand-written fake `EmailThrottleRepository"/"EmailSender` (no mocking library, no casts) — allowed → saves state and sends once; throttled → saves state and does **not** send; the state is saved before the send (a rejecting sender still leaves the state written); a sender rejection propagates — email-authentication: Per-Address Send Throttling, Magic-Link Request Enumeration Neutrality
- [ ] 2.7 GREEN: create `src/application/request-magic-link.ts` — `requestMagicLink(deps)` factory per D12/D13's flow (`throttle.find` → `allowSend` → `throttle.save` → send-or-skip); no `src/adapters` import (hexagonal rule)
- [ ] 2.8 Verify: `pnpm test` (2.1/2.4/2.6 GREEN); `pnpm typecheck && pnpm lint && pnpm build`. Still unwired — no network call in any test.

**Risk note (no split pre-planned, but flagged).** Tasks 2.6–2.7 are the hand-written-fake-heavy half most exposed to the Engram #101 inflation pattern that hit challenge-ui's fakes-based use-case slices (2–3×). design.md's own Budget Reconciliation already classifies S2 safe after that factor. If `git diff --stat` measured before opening the PR still exceeds 400, split along the natural seam: 2.1–2.5 (pure policy + Resend adapter) first, 2.6–2.7 (the use case) second — same dependency order, no shared files.

---

## Phase S3b-i: Identity schema swap — the atomic slice

**PR title**: `feat: recreate users as an email-keyed identity table`
**Branch**: `feat/email-magic-link-auth-s3bi`
**Depends on**: S1
**Est. changed lines**: 320–420 (median 370)
**Strict TDD — RED first** for every pair below.

- [ ] 3bi.1 Modify `src/db/schema.ts`: replace `users` per design.md §1 (`id`, `email` unique NOT NULL, `emailVerifiedAt`, `displayName`, `avatarUrl`, `createdAt`); `discordId` and its unique index are dropped (D2)
- [ ] 3bi.2 Run `pnpm db:generate`, then hand-edit **only** the `SELECT` list of the generated `INSERT INTO __new_users … SELECT …` statement in `drizzle/0003_users_email_identity.sql` to supply the synthetic `"id" || '@legacy.invalid'` email and `NULL` `email_verified_at` (D3); record the drizzle-kit source-line comment at the top of the file so a regenerate does not silently undo the edit
- [ ] 3bi.3 Modify `src/domain/ports/user-repository.ts`: remove `DiscordIdentity"/"upsertFromDiscord`; add `User` (with `emailVerifiedAt`), `NewEmailUser` types and `findById"/"findByEmail"/"createFromEmail"/"markEmailVerified` signatures (§2) — email-authentication: Email as the Unique Account Identifier
- [ ] 3bi.4 RED: rewrite `src/adapters/db/user-repository.test.ts` over `createTestDb()` — `createFromEmail` then `findByEmail"/"findById`; the unique-email constraint rejects a duplicate; `markEmailVerified` sets the timestamp and preserves `id"/"createdAt"/"email"/"displayName`; `markEmailVerified` on an unknown id throws; a `riot_accounts` row survives `markEmailVerified` on its owner — email-authentication: Email as the Unique Account Identifier, Display Name Derivation at First Sign-In
- [ ] 3bi.5 GREEN: rewrite `src/adapters/db/user-repository.ts` around email per §2/D8/D9 (`createFromEmail` persists `emailVerifiedAt` on first sign-in; `markEmailVerified` preserves `id"/"createdAt"/"displayName`)
- [ ] 3bi.6 Modify the 11 seed sites in `src/adapters/db/riot-account-repository.test.ts`, `src/adapters/db/challenge-repository.test.ts`, `src/adapters/db/polling-repository.test.ts`: `discordId: "d1"/"d2"` → `email: "user-1@example.com"/"user-2@example.com"` (design.md §7 Removal map)
- [ ] 3bi.7 Modify `src/auth/callbacks.ts` (+test): delete `discordIdentityFromProfile"/"discordProfileSchema` and their doc comment and the `zod` import; `enrichToken"/"sessionFromToken` unchanged; in `src/auth/callbacks.test.ts`, the `enrichToken` case's `sub: "discord-123"` becomes `sub: "user-1"`
- [ ] 3bi.8 Modify `src/auth.ts`: simplify the `jwt` callback to `if (!user?.id) return token; return enrichToken(token, user.id)`; **leave** `providers: [Discord]` and no `adapter` for this slice only (the intentional intermediate state design.md's "Why S3b splits" names)
- [ ] 3bi.9 Verify: `pnpm test` (3bi.4/3bi.7's GREEN); `pnpm typecheck && pnpm lint && pnpm build`; `pnpm db:migrate:local`, then run the full adapter suite against local D1 (the FK-integrity regression test for R8/D4, per design.md §1's three stated consequences)

**Pre-authorised `size:exception`.** design.md's Slice Map pre-authorises this exact exception, reasoning: *"the identity column, its port, its adapter, that adapter's test and every test seed that inserts a user are one typecheck unit; any cut leaves a red tree."* (design.md §Budget reconciliation, §Why S3b splits). No further approval round is needed before apply if invoked for exactly that reason — the owner decided it in the design document, not during review.

**Owner-visible constraint, this slice only.** Between the S3b-i merge and the S3b-ii merge, do not attempt a Discord sign-in — there is no matching `users` row for a Discord snowflake once this slice lands. Safe today because no Discord credentials exist and nothing is deployed (proposal §Risks R10, design.md §"Why S3b splits").

---

## Phase S3a: Auth.js adapter

**PR title**: `feat: add the six-method Auth.js adapter over the hexagonal ports`
**Branch**: `feat/email-magic-link-auth-s3a`
**Depends on**: S1, S3b-i
**Est. changed lines**: 220–320 (design.md classifies this under budget by median and upper bound after the empirical factor)
**Strict TDD — RED first** for every pair below.

- [ ] 3a.1 RED: `src/adapters/auth/auth-adapter.test.ts` — every name in `REQUIRED_ADAPTER_METHODS` is present on `createAuthAdapter(...)` and `typeof === "function"`; removing one fails and names it — email-authentication: Auth.js Adapter Contract — Exactly Six Methods
- [ ] 3a.2 GREEN: create `src/adapters/auth/auth-adapter.ts` — export `REQUIRED_ADAPTER_METHODS` (`as const satisfies readonly (keyof Adapter)[]`, D10) and a `createAuthAdapter({ users, tokens })` skeleton returning all six methods
- [ ] 3a.3 RED: add mapping tests to `auth-adapter.test.ts` with hand-written in-memory fake `UserRepository"/"VerificationTokenRepository` (no DB, no HTTP, no mocking library) — `getUserByEmail` normalises its argument; `createUser` ignores the incoming `id`, derives the display name, and persists `emailVerified`; `updateUser` maps `emailVerified` and throws on an unsupported key and on a missing `emailVerified` `Date`; `getUser"/"getUserByEmail` map `null` to `null`; `toAdapterUser` maps `emailVerifiedAt`→`emailVerified`, `displayName`→`name`, `avatarUrl`→`image` — email-authentication: Auth.js Adapter Contract — Exactly Six Methods, Display Name Derivation at First Sign-In
- [ ] 3a.4 GREEN: complete the `createAuthAdapter` mapping per design.md §3/D1/D9 (`toAdapterUser`, the `updateUser` guard quoting the exact `handle-login.js:68` call site)
- [ ] 3a.5 Verify: `pnpm test` (3a.1/3a.3 GREEN); `pnpm typecheck` (the `satisfies` clause is part of the test) `&& pnpm lint && pnpm build`. Unreferenced — exactly like S1's tables.

**Risk note (no split available).** This is a single-file, six-method unit test suite — the same reasoning as S3b-i applies: any partial-method cut would leave `REQUIRED_ADAPTER_METHODS`'s existence check red. If measured over 400 before opening the PR, there is no further split within this slice; fall back to `size:exception` with that reason.

---

## Phase S4: Login UX

**PR title**: `feat: replace the Discord sign-in form with an email magic-link form`
**Branch**: `feat/email-magic-link-auth-s4`
**Depends on**: S0
**Est. changed lines**: 260–360 (design.md classifies this under budget by median and upper bound after the empirical factor)

- [ ] 4.1 Modify `src/app/login/login-panel.tsx`: replace the Discord button with an uncontrolled `Input type="email" name="email" label="Email" required`, wire `emailError?: string` to `Input`'s `error` prop, update the CTA ("Email me a sign-in link" / "Try again" when `error` is set) and the note copy ("No password. We email you a link that signs you in.") — email-authentication: /login Email Sign-In Form, Design-System Compliance for Login Screens
- [ ] 4.2 RED: `src/app/login/login-panel.test.tsx` — main state: field present (`type="email"`, `name="email"`, `required`); hidden `from` present/absent; CTA label; note copy; no "Discord". Error state: one case per D20 title, `role="alert"` ordering, CTA relabelled "Try again". Field-error state: `aria-invalid="true"`, the message rendered, panel still in main state — email-authentication: /login Email Sign-In Form, Login Error State Copy, Design-System Compliance for Login Screens
- [ ] 4.3 GREEN: make 4.2 pass against 4.1's markup (`renderToStaticMarkup`, no jsdom — the established pattern)
- [ ] 4.4 Modify `src/app/login/actions.ts`: replace `signInWithDiscordAction` with `signInWithEmailAction` per D18 — `normalizeEmail(formData.get("email"))` → `redirect(invalidEmailLoginPath(from))` on `null`; else `signIn("resend", { email, redirectTo: safeReturnPath(from) })`; no `try/catch` anywhere (thin root, untested — covered by 4.2's behavioural assertions plus manual plan steps 1/7 and S7's e2e spec) — email-authentication: /login Email Sign-In Form, Return Path Honoured Through safeReturnPath
- [ ] 4.5 Modify `src/app/login/page.tsx` (thin root, untested — covered by manual verification plan steps 1/7 and S7's e2e spec): add `emailError = firstValue(rawInvalid) === "email" ? INVALID_EMAIL_MESSAGE : undefined` from `?invalid=email`; pass `action={signInWithEmailAction}` — email-authentication: /login Email Sign-In Form, Signed-In Visitor Redirected Away From /login
- [ ] 4.6 Create `src/app/login/check-email/page.tsx` — synchronous server component, no `auth()`, no `searchParams` read (D19); headline "Check your inbox.", body naming the 15-minute expiry and single-use property, a ghost "Back to sign in" link to "/login" — email-authentication: /login/check-email Generic Confirmation Page
- [ ] 4.7 RED+GREEN: `src/app/login/check-email/page.test.tsx` (parameterless static render) — headline present; "15 minutes" and "works once" present; "/login" link present; no address echoed anywhere — email-authentication: /login/check-email Generic Confirmation Page
- [ ] 4.8 Verify: `pnpm test`; `pnpm typecheck && pnpm lint && pnpm build`; manual: "/login" and "/login/check-email" at 390px and ~1200px, keyboard focus ring on the email field, `?invalid=email` renders the field error — email-authentication: Design-System Compliance for Login Screens

**Risk note (no split pre-planned).** The component-test inflation pattern that hit challenge-ui's S4b (845 vs 170–240, ~4×) was driven by a four-step client wizard with `useActionState`. `/login` stays a zero-JS server component (D18) with far fewer rendered states, so design.md's Budget Reconciliation classifies this slice safe after the factor. If measured over 400 before opening the PR, split along the existing file boundary: 4.1–4.3 (`login-panel.tsx`) first, 4.4–4.7 (`actions.ts` + `check-email/page.tsx`, sharing no code with `login-panel.tsx`) second.

---

## Phase S3b-ii: `src/auth.ts` swap — the slice that makes it work

**PR title**: `feat: wire Resend sign-in, the adapter, and verifyRequest into src/auth.ts`
**Branch**: `feat/email-magic-link-auth-s3bii`
**Depends on**: S2, S3a, S4
**Est. changed lines**: 120–200

- [ ] 3bii.1 Modify `src/auth.ts`: build `users"/"tokens"/"throttle` from the D1 adapters, `sender` from `createResendEmailSender`, `sendMagicLink` from `requestMagicLink`, all inside the lazy config body; add `adapter: createAuthAdapter({ users, tokens })`; replace the Discord provider with `Resend({ from: emailFrom, maxAge: 15 * 60, sendVerificationRequest })`; set `pages.verifyRequest: "/login/check-email"`; keep `session: { strategy: "jwt" }` explicit (D4/D15) — email-authentication: Magic-Link Token Single-Use and TTL, Session Identity Unchanged
- [ ] 3bii.2 Modify `.dev.vars.example`: remove `AUTH_DISCORD_ID"/"AUTH_DISCORD_SECRET`; add `AUTH_RESEND_KEY` and `EMAIL_FROM`, each with a comment naming where to get it
- [ ] 3bii.3 Verify: `pnpm test`; `pnpm typecheck && pnpm lint && pnpm build`; `pnpm exec opennextjs-cloudflare build`; **manual verification plan steps 1–8 against a real `AUTH_RESEND_KEY`** (`src/auth.ts` is the thin composition root with no unit coverage of its own — this manual pass plus S7's e2e fixture are what cover it) — email-authentication: Manual Verification Plan Recorded

**Local prerequisite, does not block apply.** This slice can be built, typechecked, linted, and built for Workers without a real `AUTH_RESEND_KEY` — an absent key makes the adapter throw `EmailSenderNotConfiguredError` at send time, surfacing as `/login?error=Configuration` (D14), which 2.4's RED cases already prove. Only the manual verification step (3bii.3's last item) needs the real key and a verified `EMAIL_FROM` (owner prerequisites P1/P2).

---

## Phase S6: Discord copy and config removal

**PR title**: `feat: remove remaining Discord copy and references`
**Branch**: `feat/email-magic-link-auth-s6`
**Depends on**: S3b-ii
**Est. changed lines**: 200–300

- [ ] 6.1 RED+GREEN: `src/app/hero.tsx` / `src/app/hero.test.tsx` — replace "No new account. We use your Discord sign-in." with "No password. We email you a link that signs you in." (the same sentence as `login-panel.tsx`'s note; assert equality) — email-authentication: Discord Removal Completeness
- [ ] 6.2 Modify `src/app/terms/page.tsx`: "You sign in with Discord." → "You sign in with your email address. We email you a single-use link; there is no password to lose." (thin presentational page, no dedicated unit test — covered by 6.6's grep and manual read) — email-authentication: Legal Pages State Email Identity and Email Processor, Discord Removal Completeness
- [ ] 6.3 Modify `src/app/privacy/page.tsx`: "What is collected" Discord bullet → "Your email address, which is how your account is identified. You give it to us when you sign in; we never receive a password."; "Who it is shared with" Discord bullet → "Resend — our email provider. It receives your email address in order to deliver your sign-in link, and nothing else."; "Children" drops "Discord's", keeps Riot's minimum age — email-authentication: Legal Pages State Email Identity and Email Processor
- [ ] 6.4 Modify `src/components/auth-status.tsx`: comment-only change (D21) — the `eslint-disable` justification becomes a general external-URL note; no behavioural change, the avatar branch stays
- [ ] 6.5 Modify `openspec/config.yaml`'s context block ("Auth.js (Discord, JWT sessions)" → "Auth.js (email magic link via Resend, JWT sessions)") and `.gitignore`'s secrets comment ("never commit Discord OAuth credentials" → "never commit auth or API secrets")
- [ ] 6.6 Verify: `pnpm test`; `pnpm typecheck && pnpm lint && pnpm build`; `rg -i discord src/ e2e/ openspec/config.yaml .dev.vars.example` returns nothing; "/", "/terms", "/privacy" read correctly at both viewports — email-authentication: Discord Removal Completeness

---

## Phase S7: E2E fixtures and the manual verification plan

**PR title**: `feat: update e2e fixtures to email identity and record the manual verification plan`
**Branch**: `feat/email-magic-link-auth-s7`
**Depends on**: S3b-i
**Est. changed lines**: 150–250

- [ ] 7.1 Modify `e2e/fixtures/session.ts`: `SessionUser` drops `discordId`; `signIn()`'s minted token becomes `{ sub: user.id, name: user.name, userId: user.id }` — email-authentication: Session Identity Unchanged, No Test-Only Sign-In Bypass
- [ ] 7.2 Modify `e2e/fixtures/seed.sql`: `INSERT … (id, email, email_verified_at, display_name, avatar_url, created_at)` with `e2e-a@example.com"/"e2e-b@example.com` and `unixepoch() * 1000` for `email_verified_at`
- [ ] 7.3 Modify `e2e/create-then-join.spec.ts`: `USER_A"/"USER_B` fixtures drop `discordId`
- [ ] 7.4 Write `openspec/changes/email-magic-link-auth/manual-verification.md` recording the eight-step plan — first sign-in, repeat sign-in, replay, expiry, throttle, enumeration neutrality, return-path handling, Riot linking — per design.md's Testing Strategy §Manual verification plan — email-authentication: Manual Verification Plan Recorded
- [ ] 7.5 Verify: `pnpm test:e2e` passes both the `mobile` (390) and `desktop` (1280) projects — email-authentication: No Test-Only Sign-In Bypass

---

## Apply notes

**Owner-blocked prerequisites that do NOT block apply.** `AUTH_RESEND_KEY` (P1), a verified `EMAIL_FROM` sender (P2), the remote D1 migration (P3), and deleting the old Discord secrets from the real `.dev.vars`/`.env.local` (P4) are all outstanding owner items, but none of them block this change locally. Every slice through S3b-ii builds, typechecks, lints, and runs its test suite entirely against `createTestDb()`, hand-written fakes, and an injected `fetch` — no real Resend key or D1 binding is required until the manual verification step (3bii.3).

**Local D1 migrations.** Run `pnpm db:migrate:local` twice: once after S1 lands (applies `0002`, additive), and again after S3b-i lands (applies `0003`, the `users` recreate) and before running the full adapter suite or S7's e2e spec against local D1 — `e2e/global-setup.ts` re-seeds disposable `e2e-%` rows on every run, so the recreate carries no data that matters locally.

**E2E seed changes.** S7 is the only slice that touches `e2e/`. No new devDependency or Playwright reinstall is needed — `@playwright/test` and both config/scripts already exist from the `challenge-ui` change; only the fixture's token payload and the seeded rows change to email identity.

**Manual verification.** 3bii.3's eight steps are the only coverage of the real magic-link round trip (A10 — no test-only sign-in bypass exists or is added). They require a real `AUTH_RESEND_KEY` and a verified `EMAIL_FROM`; until the owner supplies both, every other slice's automated checks remain the complete proof of correctness.
