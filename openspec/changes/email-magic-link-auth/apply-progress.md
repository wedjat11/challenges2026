# Apply progress: email-magic-link-auth

Change: `email-magic-link-auth` · Store: hybrid (this file + Engram topic `sdd/email-magic-link-auth/apply-progress`, project `challenges2026`)

## Status

**Phases S0 and S1 complete — 20/20 tasks (0.1–0.11, 1.1–1.9).** Phases S2–S7 (tasks 2.x onward) are **not started**. S0 landed first (see below); S1 (`Auth tables, token and throttle ports and adapters`) was implemented by a prior apply pass that committed the code but was interrupted before persisting progress, recording verification, mirroring to Engram, or running `pnpm db:migrate:local`. This pass audited that S1 code against the spec and design (full audit log below, every check passed, nothing was changed in the production code), ran the missing verification, and records honest evidence for the first time. 3/9 total slices delivered so far: S0a, S0b, and S1 (itself pre-split into S1a + S1b).

The S0 pre-planned contingent split triggered: the combined S0 diff measured 434 authored lines against `feat/public-landing-gated-nav` (over the 400-line budget), so S0 landed as two chained PR slices per tasks.md's own pre-authorised split:

- **S0a** (`feat/email-magic-link-auth-s0a`, targets `feat/public-landing-gated-nav`): `email-identity.ts`+test, `auth-error.ts`+test, `return-path.ts`+test (tasks 0.1–0.4, 0.7–0.10). Measured **314 authored lines** (284 insertions + 30 deletions). Three work-unit commits: `f6eea14`, `5d2bc97`, `c8f5b2b`.
- **S0b** (`feat/email-magic-link-auth-s0b`, based on S0a): `magic-link-email.ts`+test (tasks 0.5, 0.6) plus the final tasks.md checkbox state and task 0.11's verify record. Measured **123 authored lines** (123 insertions, 0 deletions) against S0a. One work-unit commit: `8a0aa82`.

No `size:exception` was needed — both slices land under the 400-line budget per the pre-planned split. The original branch `feat/email-magic-link-auth-s0` (created by the orchestrator from the tracker `feat/email-magic-link-auth`) was renamed in place to `feat/email-magic-link-auth-s0a` once the split was confirmed necessary, so no commits were discarded.

## Completed: Phase S0 — Pure identity and copy helpers

- [x] 0.1 RED: `src/domain/email-identity.test.ts` — 16 cases: case folding, NFKC (fullwidth `＠` rejected after normalization because it canonicalizes to a second real `@`), leading/trailing whitespace and NBSP, quote rejection, 0/2/3 `@`-parts, empty local, empty domain, `domain,second` comma-trim (and comma-trim-to-empty), non-string/undefined/null, empty string, never-throws.
- [x] 0.2 GREEN: created `src/domain/email-identity.ts` — `normalizeEmail(raw: unknown): string | null`, implemented step-for-step from `@auth/core@0.41.3`'s `defaultNormalizer` (`node_modules/.pnpm/@auth+core@0.41.3/node_modules/@auth/core/lib/actions/signin/send-token.js:74-104`, read directly to confirm the exact case table): NFKC → lowercase → trim → reject quotes → split on `@` requiring exactly 2 parts → comma-trim the domain → reject empty parts. Returns `null` instead of throwing (D17).
- [x] 0.3 RED: added to `email-identity.test.ts` — 5 cases: ordinary local part, exactly-20-char local part, 21-char truncation, whitespace-only local part → `"Player"`, no plus-tag stripping.
- [x] 0.4 GREEN: added `displayNameFromEmail`, `DISPLAY_NAME_MAX_LENGTH = 20`, `DISPLAY_NAME_FALLBACK = "Player"` to `email-identity.ts` (D23) — raw local part, trimmed, truncated; no prettification.
- [x] 0.5 RED: `src/domain/magic-link-email.test.ts` — 6 cases: subject contains `siteName`; text contains the URL exactly once; html contains the HTML-escaped URL exactly once; unescaping the html `href` round-trips to the original URL byte-for-byte; both parts state the expiry in minutes; neither part mentions Discord.
- [x] 0.6 GREEN: created `src/domain/magic-link-email.ts` — `magicLinkEmail({ url, expiresInMinutes, siteName })` returning `{ subject, text, html }` per design.md §5's exact content; `escapeHtmlAttribute` escapes `&`, `<`, `>`, `"` so a query-string `&` in the URL cannot mangle the link in strict mail clients.
- [x] 0.7 RED: rewrote `src/app/login/auth-error.test.ts` in full (the existing file asserted Discord-era copy for every known code, which design.md D20 changes for `AccessDenied`/`Configuration`/default and adds `Verification`/`EmailSignInError` for — a direct add would have left stale assertions asserting the old copy alongside new ones asserting the new copy for the same codes) — one case per D20 row plus the unknown-code fallback, plus one test asserting no known/unknown code's copy contains "Discord".
- [x] 0.8 GREEN: rewrote `messageForAuthError` in `src/app/login/auth-error.ts` per D20's table exactly (the `Configuration` body says "temporarily unavailable", not "misconfigured" — D20's rationale: it now covers a failed Resend send too, which is an outage, not a misconfiguration).
- [x] 0.9 RED: added to `src/app/login/return-path.test.ts` — 6 cases: safe `from` carried with the correct `&from=` joiner (not `?from=`, since `?invalid=email` is already present); unsafe `from` (`//evil.com`, backslash, absolute URL, non-string) all drop to the bare `/login?invalid=email`; absent `from` emits no `from` parameter.
- [x] 0.10 GREEN: added `invalidEmailLoginPath(from: unknown): string` to `return-path.ts`, re-running `safeReturnPath(from, "")` (D18). **Deviation note**: could not reuse `withReturnPath` as a literal joiner here — `withReturnPath` always prefixes `?from=`, but `invalidEmailLoginPath`'s target already carries `?invalid=email`, so the second parameter must join with `&`. Implemented as its own small function instead; `safeReturnPath` and `withReturnPath` themselves, and every existing test for both, are byte-for-byte unchanged (verified: all 11 pre-existing `return-path.test.ts` cases still pass).
- [x] 0.11 Verify: `pnpm test` → 582/582 passed (61 test files). `pnpm typecheck && pnpm lint && pnpm build` → all exit 0. Nothing is wired yet (no `auth.ts`, `login-panel.tsx`, or `page.tsx` changes), so no rendered page changed, matching the task's own note.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 0.1/0.2 | `src/domain/email-identity.test.ts` (normalizeEmail) | Unit | N/A (new file) | ✅ Written — `pnpm exec vitest run` failed with `Cannot find package '@/domain/email-identity'` | ✅ 16/16 passed | ✅ 16 cases (case fold, NFKC homoglyph, whitespace/NBSP, quote, 0/2/3 `@`, empty local/domain, comma-trim ×2, non-string ×3, empty, never-throws) | ✅ none needed — already minimal, pure, named constants |
| 0.3/0.4 | `email-identity.test.ts` (displayNameFromEmail) | Unit | ✅ 16/16 (prior cases in same file) | ✅ Written — 5 new tests failed with `displayNameFromEmail is not a function` | ✅ 21/21 passed | ✅ 5 cases (ordinary, exactly-20, 21-truncate, whitespace-only, plus-tag kept) | ➖ none needed |
| 0.5/0.6 | `src/domain/magic-link-email.test.ts` | Unit | N/A (new file) | ✅ Written — module-not-found failure | ✅ 6/6 passed | ✅ 6 cases (subject, text-once, html-escaped-once, round-trip-unescape, expiry-in-both-parts, no-Discord) | ✅ extracted `escapeHtmlAttribute` as a named pure helper during GREEN rather than inlining `.replaceAll` chains at the call site |
| 0.7/0.8 | `src/app/login/auth-error.test.ts` | Unit | ✅ ran pre-existing file first — 6/6 passed on old copy, confirming baseline before rewrite | ✅ Written — rewritten file failed 6/7 against the unmodified implementation (only "returns null" passed) | ✅ 7/7 passed | ✅ 6 distinct codes + 1 cross-cutting "no Discord in any code" case covering 5 codes in a loop | ➖ none needed — single switch, already minimal |
| 0.9/0.10 | `src/app/login/return-path.test.ts` | Unit | ✅ ran pre-existing file first — 11/11 passed, confirming `safeReturnPath`/`withReturnPath` baseline before adding | ✅ Written — 6 new tests failed with `invalidEmailLoginPath is not a function` | ✅ 17/17 passed (11 pre-existing + 6 new) | ✅ 6 cases (safe-from, 3 distinct unsafe-from shapes, non-string, absent) | ✅ one correction during GREEN: first draft reused `withReturnPath`'s `?from=` joiner, which produced a double `?` against `/login?invalid=email`; replaced with a dedicated `&from=` join once the first assertion caught it |

### Test Summary
- **Total tests in the four files this phase touched/created**: 51 — `email-identity.test.ts` 21 (new file), `magic-link-email.test.ts` 6 (new file), `auth-error.test.ts` 7 (file rewritten: 6 new cases + 1 case, "returns null", whose assertion was already correct and carried through unchanged), `return-path.test.ts` 17 (11 pre-existing cases carried unchanged + 6 new cases)
- **Total tests passing**: 582/582 (full suite, up from the pre-S0 baseline of 548)
- **Layers used**: Unit (51 new/changed tests), Integration (0), E2E (0) — S0 is pure-function/copy-table scope only, per design.md D16
- **Approval tests** (refactoring): `auth-error.test.ts` and `return-path.test.ts` each had their pre-existing suite run green *before* any edit, to confirm the safety net described in strict-tdd.md's "Approval Testing" section, before the copy/addition changes were made
- **Pure functions created**: 5 (`normalizeEmail`, `displayNameFromEmail`, `magicLinkEmail`, `escapeHtmlAttribute`, `invalidEmailLoginPath`) — `messageForAuthError` was modified, not created

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run src/domain/email-identity.test.ts src/domain/magic-link-email.test.ts src/app/login/auth-error.test.ts src/app/login/return-path.test.ts` → all 4 files pass (21 + 6 + 7 + 17 = 51 tests); full `pnpm test` → `Test Files 61 passed (61)`, `Tests 582 passed (582)` (baseline was 59 files / 548 tests before this phase) |
| Runtime harness command/scenario and exact result | **N/A** — nothing imports any of the four new/changed files yet (`src/auth.ts`, `login-panel.tsx`, and `page.tsx` are untouched; they are S3b-ii/S4 scope). No route, Server Function, or adapter references `normalizeEmail`, `displayNameFromEmail`, `magicLinkEmail`, or the new `invalidEmailLoginPath` export. `pnpm build` was run as part of 0.11 and confirms the existing 10 routes (including `/login`) still compile and render unchanged — this is the closest runtime signal available, and it is unaffected because nothing new is wired |
| Rollback boundary | Revert the 4 production files (`src/domain/email-identity.ts`, `src/domain/magic-link-email.ts`, `src/app/login/auth-error.ts`, `src/app/login/return-path.ts`) and their test files, or `git revert` the 4 commits (`f6eea14`, `5d2bc97`, `c8f5b2b`, `8a0aa82`) in reverse order. `auth-error.ts`/`return-path.ts` revert to their pre-S0 Discord-era content; nothing downstream references the new exports, so no other file needs touching |

## Verification (S0, task 0.11)

| Command | Result |
|---|---|
| `pnpm test` | exit 0 — `Test Files 61 passed (61)`, `Tests 582 passed (582)` (up from the pre-S0 baseline of 59 files / 548 tests) |
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean. One fix needed during this step: `src/domain/magic-link-email.test.ts` originally used `match![1]` (non-null-asserting the match but not the capture group), which `tsc --noEmit` rejected under `noUncheckedIndexedAccess` as `error TS2532: Object is possibly 'undefined'`; replaced with `match?.[1]` plus an explicit `expect(href).toBeDefined()` assertion, which is both type-safe and a stronger test (it now fails loudly if the regex ever stops matching, instead of only on `.replaceAll` throwing) |
| `pnpm lint` | exit 0 — `eslint` clean on first run, no changes needed |
| `pnpm build` | exit 0 — `next build` compiled successfully; all 10 existing routes (`/`, `/_not-found`, `/account`, `/api/auth/[...nextauth]`, `/challenges`, `/challenges/[id]`, `/challenges/new`, `/login`, `/privacy`, `/terms`) still generated, none changed shape (S0 wires nothing) |

## Review budget measurement

| Slice | Branch | Base | Measured (additions+deletions) | Budget | Split needed? |
|---|---|---|---|---|---|
| S0 combined (pre-split) | — | `feat/public-landing-gated-nav` | 434 (404 + 30) | 400 | **Yes** — triggered the pre-planned contingent split from tasks.md |
| S0a | `feat/email-magic-link-auth-s0a` | `feat/public-landing-gated-nav` | 314 (284 + 30) | 400 | No — under budget as planned (design.md estimated 180–250; measured came in higher because the full D20 table and the NFKC/comma-trim test matrix are both larger than the median estimate, but still comfortably under 400) |
| S0b | `feat/email-magic-link-auth-s0b` | `feat/email-magic-link-auth-s0a` | 123 (123 + 0) | 400 | No — under budget, within the 120–170 estimate |

No `size:exception` was requested or needed. `pnpm-lock.yaml` was not touched by this phase (no new dependency was added).

## Deviations from design

1. **`invalidEmailLoginPath` could not literally "re-run" `withReturnPath`** the way D18's prose reads at first glance — `withReturnPath` always joins with `?from=`, which collides with the already-present `?invalid=email`. Implemented `invalidEmailLoginPath` as its own small function that calls `safeReturnPath(from, "")` (exactly as D18 specifies) and then joins with `&from=` when the result is non-empty. `safeReturnPath` and `withReturnPath` themselves are untouched, matching D18's actual constraint ("`safeReturnPath`/`withReturnPath` are unchanged").
2. **`auth-error.test.ts` was rewritten wholesale rather than incrementally extended.** The task description says "add to" the file, but every pre-existing case (`AccessDenied`, `Configuration`, the generic fallback) asserts copy that D20 explicitly changes, so an incremental add would have left the file self-contradictory (old and new expectations for the same codes). Ran the pre-existing 6 cases green first as an approval-test safety net, then replaced the file in one RED step covering all 5 D20 rows plus the fallback and the cross-cutting Discord-absence check.
3. **One typecheck-only fix** in `magic-link-email.test.ts` (`match![1]` → `match?.[1]` plus an explicit `toBeDefined()` assertion) — not a design deviation, a strict-mode TypeScript correction caught by 0.11's `pnpm typecheck` gate, applied before this apply pass returned.

No other deviations. No pre-existing test (`login-panel.test.tsx`, `src/components/auth-status.tsx` tests, `hero.test.tsx`) needed an assertion update — the full `pnpm test` run after each change stayed at the expected count increase with zero regressions, confirming none of those files call `messageForAuthError` with a code this phase's copy changes affected in a way their fixtures exercise.

## Issues found

None.

## Completed: Phase S1 — Auth tables, token and throttle ports and adapters

Implemented by a prior apply pass as two commits on branch `feat/email-magic-link-auth-s1b` (based on `feat/email-magic-link-auth-s1a`, which is based on S0's tip `feat/email-magic-link-auth-s0b`): `f5f0218` (S1a, tasks 1.1–1.5) and `dd0dfef` (S1b, tasks 1.6–1.9). That pass committed the code and ticked 1.1–1.8 in the same commits, but stopped before persisting apply-progress, mirroring to Engram, or running the finishing checks — this pass is the audit and completion of that interrupted work, not a reimplementation.

- [x] 1.1 `pnpm db:generate` produced `drizzle/0002_flashy_pyro.sql` (drizzle-kit's own generated slug, not the task's placeholder `0002_auth_email_tables.sql` — see Deviations) containing `CREATE TABLE auth_email_throttle` and `CREATE TABLE verification_tokens`, alphabetical per drizzle-kit's convention. Re-ran `pnpm db:generate` during this audit: **"No schema changes, nothing to migrate"** — confirms the committed SQL is current, generated, and unedited.
- [x] 1.2 `src/db/schema.ts` carries `verificationTokens` (composite PK `(identifier, token)`, no standalone `expires` index — matches D5 exactly) and `authEmailThrottle` (`identifier` PK, `lastSentAt`/`windowStartedAt`/`sentInWindow`) verbatim against design.md §1's diff, including both doc comments. `users` is byte-for-byte untouched in this diff.
- [x] 1.3 `src/domain/ports/verification-token-repository.ts` — `VerificationToken` type and `VerificationTokenRepository.create`/`consume` match design.md §2 exactly, including the doc comments citing D6/D7/A6.
- [x] 1.4 RED: `src/adapters/db/verification-token-repository.test.ts` (144 lines, 7 cases) over `createTestDb()` — create→consume round trip; consume twice → `null`; wrong token → `null`; wrong identifier → `null`; an already-expired row is still returned by `consume` (Auth.js owns expiry); that same expired row is reaped by the next `create` for its identifier; a still-live token for the same identifier survives that reap (A6, two tokens both consumable after both are created). Re-run during this audit: 7/7 pass. All assertions are behavioural `toEqual`/`toBeNull` against real repository output — no banned trivial-assertion patterns.
- [x] 1.5 GREEN: `src/adapters/db/verification-token-repository.ts` — `consume` is exactly one `db.delete(...).where(and(eq(identifier), eq(token))).returning()` (D6, no transaction, no `batch`); `create` is insert-then-reap, where the reap filters `identifier = ? AND expires < now` (D7) so it can never touch the row it just inserted or any other live row for that identifier. `AuthDb = BaseSQLiteDatabase<"async", unknown, typeof schema>` — driver-agnostic, matches `ChallengeDb`'s precedent and D6's cast-in-a-test rationale.
- [x] 1.6 `src/domain/ports/email-throttle-repository.ts` — `SendThrottleState` type and `EmailThrottleRepository.find`/`save` match design.md §2 exactly.
- [x] 1.7 RED: `src/adapters/db/email-throttle-repository.test.ts` (66 lines, 4 cases) over `createTestDb()` — `find` on an unknown identifier → `null`; `save` then `find` round trip; `save` twice for the same identifier replaces (exactly 1 row, verified by `db.select().from(authEmailThrottle)` returning `toHaveLength(1)`, not just a `find` round trip); a second identifier's row is undisturbed by the first's second save (exactly 2 rows). Re-run during this audit: 4/4 pass.
- [x] 1.8 GREEN: `src/adapters/db/email-throttle-repository.ts` — `find` is a one-row `select().where(eq(identifier)).limit(1)`; `save` is `insert(...).onConflictDoUpdate({ target: identifier, set: { ...excluded } })` — a true single-statement upsert, not a read-then-branch.
- [x] 1.9 Verify (re-run during this audit, not carried over from the prior pass): `pnpm test` → 63/63 files, 593/593 tests (up from the S0 baseline of 61/582 — the two new files add exactly 7+4=11 tests). `pnpm typecheck` → exit 0. `pnpm lint` → exit 0. `pnpm build` → exit 0, all 10 pre-existing routes unchanged (purely additive, nothing references either new table yet). `pnpm db:migrate:local` → `✅ No migrations to apply!` — inspected the local D1 sqlite file directly (`.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite`): `d1_migrations` already lists `0002_flashy_pyro.sql` applied 2026-10-05, and both `verification_tokens` and `auth_email_throttle` exist locally with the exact generated DDL — the "no migrations to apply" result is the correct idempotent outcome, not a skipped step.

### Audit findings (this pass)

Ran the full S1 audit checklist against the committed code. Every item passed with no fix required — no production code was changed by this apply pass, only `tasks.md` (1.9 ticked) and this progress record.

1. **Migration file**: generated, unedited, confirmed via a live `pnpm db:generate` re-run reporting no schema changes. `_journal.json` entry (`idx: 2, tag: "0002_flashy_pyro"`) is consistent with the file on disk.
2. **`schema.ts`**: new table definitions match design §1 character-for-character, including doc comments; `users` untouched.
3. **Port signatures**: `VerificationTokenRepository.create`/`consume` and `EmailThrottleRepository.find`/`save` plus `SendThrottleState` match design §2 exactly, no shape drift.
4. **Adapter semantics**: `consume` is one `DELETE … RETURNING` (D6) — confirmed by source inspection and by a characterization mutation (below) that breaks exactly the single-use test when the delete is replaced with a plain select. `create` reaps only expired rows for the same identifier (D7/A6) — confirmed by a second mutation that breaks exactly the two reaping tests when the `expires < now` filter is dropped. The db type stays `BaseSQLiteDatabase<"async", unknown, typeof schema>`, never cast to `DrizzleD1Database`. Throttle adapter is a true single-row upsert (`onConflictDoUpdate`), not read-modify-write — confirmed by a third mutation that breaks exactly the "replaces rather than duplicates" tests (as a `SQLITE_CONSTRAINT_PRIMARYKEY` throw) when the upsert clause is removed.
5. **Test coverage**: exactly the 7 + 4 cases the task list and design specify; no missing case, no extra untested branch; every assertion calls the repository and checks a specific value or row count derived from the setup — no tautologies, no unexplained-empty assertions, no CSS/implementation-detail coupling (none applies to adapter tests).

### Characterization evidence (RED→GREEN re-created for already-committed code)

The original RED phase cannot be re-observed for code that was already committed by the interrupted prior pass. Per the audit instructions, this pass instead ran one targeted mutation per production file, observed the test suite go RED for exactly the expected reason, then restored the file and confirmed byte-for-byte identity via MD5 before confirming GREEN again.

| Production file | Mutation | Test run after mutation | Restored? | Test run after restore |
|---|---|---|---|---|
| `src/adapters/db/verification-token-repository.ts` | `consume`: replaced `.delete(...).returning()` with `.select().from(...)` (no deletion) | FAIL — exactly `single use > returns null on the second consume of the same token` (received the row instead of `null`); 6/7 pass | Yes — `md5` before and after both `29d2988f1cc2b61b13ebf1a3be49ce31`; `git diff --stat` empty | PASS — 7/7 |
| `src/adapters/db/verification-token-repository.ts` | `create`'s reap: dropped the `lt(expires, now)` filter, reaping the whole identifier unconditionally | FAIL — exactly the two `reaping on create (D7)` tests (`never reaps a still-live token` and the reap-then-consume case); 4/7 pass | Yes — same MD5 confirmed again after this second mutation's restore | PASS — 7/7 |
| `src/adapters/db/email-throttle-repository.ts` | `save`: removed `.onConflictDoUpdate(...)`, leaving a bare `insert` | FAIL — exactly both `save replaces rather than duplicates` tests, surfacing as `SQLITE_CONSTRAINT_PRIMARYKEY` on the second save for the same identifier; 2/4 pass | Yes — `md5` before and after both `c53f0d6e336db2c04db0e17a47bac39d`; `git diff --stat` empty | PASS — 4/4 |

No gap was found, so no real RED→GREEN cycle was needed on top of these three characterization mutations.

### TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1–1.5 | `src/adapters/db/verification-token-repository.test.ts` | Unit (adapter, in-memory SQLite via `createTestDb()`) | N/A (new files) | Characterization mutation re-created RED (see table above) — original RED not observable, code was already committed | ✅ 7/7 passed | ✅ 7 cases (round trip, single-use, wrong-token, wrong-identifier, expired-still-returned, reap-expired, reap-skips-live) | ➖ none needed — adapter is already minimal, two sequential awaits per method |
| 1.6–1.8 | `src/adapters/db/email-throttle-repository.test.ts` | Unit (adapter, in-memory SQLite via `createTestDb()`) | N/A (new files) | Characterization mutation re-created RED (see table above) | ✅ 4/4 passed | ✅ 4 cases (unknown→null, round trip, replace-not-duplicate, cross-identifier isolation) | ➖ none needed |

### Test Summary
- **Total tests in the two files this phase created**: 11 — `verification-token-repository.test.ts` 7, `email-throttle-repository.test.ts` 4
- **Total tests passing**: 593/593 (full suite, up from the post-S0 baseline of 582)
- **Layers used**: Unit/adapter (11 new tests, in-memory SQLite), Integration (0), E2E (0) — per design.md's Testing Strategy, S1 is adapter-only scope; nothing wires these repositories into `src/auth.ts` yet
- **Approval tests**: None — both repository files and both port files are new, nothing pre-existing was refactored
- **Pure functions created**: 0 — S1 is storage-only per D12; the pure `send-throttle.ts` policy is S2 scope

### Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command and exact result | `pnpm exec vitest run src/adapters/db/verification-token-repository.test.ts src/adapters/db/email-throttle-repository.test.ts` → 2 files, 11/11 tests pass |
| Runtime harness command/scenario and exact result | `pnpm db:migrate:local` → `✅ No migrations to apply!` (already applied to the local D1 on 2026-10-05, confirmed by inspecting `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite` directly: `d1_migrations` lists `0002_flashy_pyro.sql`, and both new tables exist with the generated DDL). `pnpm build` confirms all 10 existing routes still compile — the closest runtime signal available, since nothing is wired to the new tables yet (S2/S3a scope) |
| Rollback boundary | Revert the two commits `f5f0218` (S1a) and `dd0dfef` (S1b) in reverse order, or revert the 7 production/test files individually (`drizzle/0002_flashy_pyro.sql`, `drizzle/meta/0002_snapshot.json`, `drizzle/meta/_journal.json`, `src/db/schema.ts`'s two added tables, `src/domain/ports/verification-token-repository.ts`, `src/adapters/db/verification-token-repository.ts`+test, `src/domain/ports/email-throttle-repository.ts`, `src/adapters/db/email-throttle-repository.ts`+test). Nothing downstream references either new table or port yet, so no other file needs touching. The local D1's `0002` migration would need `wrangler d1 migrations apply DB --local` re-run against a reverted `drizzle/` directory to roll back the local database too, if that level of rollback is ever needed |

## Verification (S1, task 1.9 — re-run by this audit pass)

| Command | Result |
|---|---|
| `pnpm test` | exit 0 — `Test Files 63 passed (63)`, `Tests 593 passed (593)` (up from the post-S0 baseline of 61 files / 582 tests) |
| `pnpm typecheck` | exit 0 — `next typegen`, `wrangler types`, `tsc --noEmit` all clean |
| `pnpm lint` | exit 0 — `eslint` clean |
| `pnpm build` | exit 0 — `next build` compiled successfully; all 10 existing routes unchanged in shape |
| `pnpm db:migrate:local` | exit 0 — `✅ No migrations to apply!`; verified against the local D1 sqlite file directly that `0002_flashy_pyro.sql` is recorded in `d1_migrations` and both tables exist with the correct schema |

## Review budget measurement (S1)

| Slice | Branch | Base | Measured (additions+deletions) | Authored (excl. generated) | Budget | Split needed? |
|---|---|---|---|---|---|---|
| S1 combined (pre-split, per design.md's own 280–400 median-340 estimate) | — | S0's tip | n/a — pre-planned contingent split, same pattern as S0 | n/a | 400 | Planned ahead of time in tasks.md, not measured as one diff |
| S1a | `feat/email-magic-link-auth-s1a` | `feat/email-magic-link-auth-s0b` | 944 insertions + 1 deletion = 945 | **292** (13 migration SQL + 9 journal + 144 test + 69 adapter + 32 schema + 25 port; the 653-line `drizzle/meta/0002_snapshot.json` is drizzle-kit generated and excluded from authored risk count per `sdd-phase-common.md` §E, but is included in the commit for complete migration-state identity) | 400 | No — well under budget |
| S1b | `feat/email-magic-link-auth-s1b` | `feat/email-magic-link-auth-s1a` | 150 insertions + 8 deletions = 158 (incl. `tasks.md`'s 8+8 checkbox-tick diff) | **129** (66 test + 50 adapter + 13 port; `tasks.md`'s 16-line checkbox update is task-tracking, not production risk) | 400 | No — well under budget |

No `size:exception` was needed for either slice. SHAs: S1a = `f5f0218`, S1b = `dd0dfef`.

## Deviations from design (S1)

1. **Migration filename**: the task list's own placeholder name was `drizzle/0002_auth_email_tables.sql`; drizzle-kit's `generate` command assigns its own random two-word slug (`0002_flashy_pyro.sql`) rather than taking a name from the caller. This is a naming-only deviation — the DDL content is byte-for-byte what design.md §1 specifies, confirmed by re-running `pnpm db:generate` during this audit and getting "No schema changes, nothing to migrate." design.md's own prose anticipates this is drizzle-kit's behavior (it does not claim a specific generated filename anywhere outside the task placeholder).
2. **Interrupted first apply pass**: the code for S1a and S1b was already committed (`f5f0218`, `dd0dfef`) before this audit pass started, with tasks 1.1–1.8 ticked in the same commits but no apply-progress record, no Engram mirror, no finishing verification run (`pnpm test`/`typecheck`/`lint`/`build`), and no `pnpm db:migrate:local`. This pass is the completion of that interrupted unit: it audited every file against the spec and design (all checks passed, zero fixes needed), re-ran the full verification suite, ran the missing local migration, and records the first honest evidence trail for this slice. No production code changed as a result of this audit.

No other deviations in S1.

## Issues found (S1)

None. The audit found the committed code fully compliant with design.md §1/§2 and the spec's "Magic-Link Token Single-Use and TTL", "Concurrent Link Requests Do Not Invalidate Each Other", and "Per-Address Send Throttling" requirements.

## Remaining tasks (not in scope for this apply pass)

- [ ] Phase S2: Delivery, throttle policy, and the send use case
- [ ] Phase S3b-i: Identity schema swap
- [ ] Phase S3a: Auth.js adapter
- [ ] Phase S4: Login UX
- [ ] Phase S3b-ii: `src/auth.ts` swap
- [ ] Phase S6: Discord copy and config removal
- [ ] Phase S7: E2E fixtures and manual verification plan

## Workload / PR boundary

- Mode: chained PR (feature-branch-chain), contingent split triggered for both S0 and S1
- Delivered work units: S0a (`feat/email-magic-link-auth-s0a`), S0b (`feat/email-magic-link-auth-s0b`, based on S0a), S1a (`feat/email-magic-link-auth-s1a`, based on S0b), S1b (`feat/email-magic-link-auth-s1b`, based on S1a) — 4 slices, 3 of 9 pre-planned chain slices by phase count
- Boundary: starts from `feat/public-landing-gated-nav` (S0a's base) and ends with S1b's tip (`dd0dfef`); next slice (S2) targets `feat/email-magic-link-auth-s1b` per the linear chain order
- Estimated review budget impact: all four slices land under the 400-line budget (S0a 314, S0b 123, S1a 292 authored, S1b 129 authored); no exception requested anywhere in the chain so far

## Status

20/20 tasks complete across Phases S0 (11/11) and S1 (9/9). S1's code was committed by an interrupted prior pass and is now fully audited, verified, and documented by this pass — zero production-code changes were needed, every audit check passed on first inspection. Ready for the next apply batch (Phase S2) or for `sdd-archive` if the orchestrator chooses to pause the chain here — per session pace (`interactive`), this apply pass stops after S1 as instructed and returns control to the orchestrator.
